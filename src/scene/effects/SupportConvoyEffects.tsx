import * as THREE from 'three'

import type { SupportConvoyWorldState } from '@/simulation/supportConvoyTypes'

import { getSupportPresentationSurfaceHeight, sampleSupportRoute } from '@/simulation/supportConvoy'

import { AftermathGroundDust } from './aftermath/AftermathGroundDust'
import { legacyDustScale, periodicAngle } from './aftermath/effectClocks'

const SPHERE = new THREE.SphereGeometry(1, 12, 8)
const ROCK = new THREE.DodecahedronGeometry(1, 0)
const BOX = new THREE.BoxGeometry(1, 1, 1)
const RING = new THREE.RingGeometry(0.93, 1, 40)
const SCORCH = new THREE.CircleGeometry(1, 32)
const RUBBLE = new THREE.MeshStandardMaterial({ color: '#777263', roughness: 0.98, flatShading: true })
const SCORCHED = new THREE.MeshStandardMaterial({ color: '#34332c', roughness: 0.99, polygonOffset: true, polygonOffsetFactor: -2 })
const FLASH = new THREE.MeshBasicMaterial({ color: '#ffe1a0', toneMapped: false })

function DustPuff({ position, scale, opacity, smoke = false }: { position: [number, number, number]; scale: [number, number, number]; opacity: number; smoke?: boolean }) {
  return (
    <mesh geometry={SPHERE} position={position} scale={scale}>
      <meshBasicMaterial color={smoke ? '#606259' : '#ad9a77'} depthWrite={false} opacity={opacity} transparent />
    </mesh>
  )
}

/** Fixed particle slots with analytic positions and bounded ages. Repeated
 * seeks render the same slots, and backward seeks remove all future residue. */
export function SupportConvoyEffects({ state, time }: { state: SupportConvoyWorldState; time: number }) {
  const { bridge, convoy } = state
  const p = bridge.position
  const age = bridge.ageSeconds
  const legacyFade = legacyDustScale(time)
  return (
    <group name="stage4b2c-support-effects" dispose={null}>
      {convoy.orderedVehicleIds.map((id) => {
        const vehicle = convoy.vehicles[id]
        if (vehicle.dustIntensity < 0.005 || legacyFade <= 0) return null
        return (
          <group key={id} name={`${id}-wheel-dust`}>
            {[0, 1, 2, 3].map((slot) => {
              const life = (time * 0.8 + slot * 0.29 + vehicle.convoyOrder * 0.13) % 1.2
              const sign = vehicle.motionDirection === 'reverse' ? -1 : 1
              const sample = sampleSupportRoute(vehicle.routeStationMeters - sign * (3 + life * vehicle.speedMetersPerSecond * 0.45))
              const side = slot % 2 === 0 ? -1 : 1
              const x = sample.x - sample.tangentZ * side
              const z = sample.z + sample.tangentX * side
              return <DustPuff key={slot} position={[x, getSupportPresentationSurfaceHeight(x, z) + 0.25 + life * 0.6, z]} scale={[(0.45 + life) * legacyFade, (0.28 + life * 0.4) * legacyFade, (0.5 + life) * legacyFade]} opacity={vehicle.dustIntensity * (1 - life / 1.2) * 0.4} />
            })}
          </group>
        )
      })}
      <AftermathGroundDust family="support" ids={convoy.orderedVehicleIds} time={time} />
      {state.visibilityIntensity > 0 ? (
        <group name="rescue-corridor-visibility-haze">
          {[0, 1, 2, 3, 4, 5, 6].map((slot) => {
            const lead = convoy.vehicles.defender_support_fire_01.pose.position
            return (
              <DustPuff
                key={slot}
                smoke
                position={[lead.x + (slot - 2) * 21 + Math.sin(periodicAngle(time, 0.21, slot)) * 3, getSupportPresentationSurfaceHeight(lead.x, lead.z) + 5 + (slot % 3) * 2, lead.z + (slot - 2) * 9]}
                scale={[17 + (slot % 3) * 3, 6 + (slot % 2) * 2, 12]}
                opacity={state.visibilityIntensity * 0.22}
              />
            )
          })}
        </group>
      ) : null}
      {bridge.persistentDamage ? (
        <group name="dry-wash-bridge-obstruction" position={[p.x, p.y, p.z]}>
          {/* Deck stays intact. Scorch and a road-edge slab obstruct this approach. */}
          <mesh name="bridge-scorch" geometry={SCORCH} material={SCORCHED} position={[3, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[18, 9, 1]} />
          {[-2, -1, 0, 1, 2].map((slot) => (
            <mesh key={slot} name={`bridge-rubble-${slot}`} castShadow receiveShadow geometry={ROCK} material={RUBBLE} position={[28 - slot * 1.02, 0.85 + (slot % 2 === 0 ? 0.3 : 0), 12 + slot * 2.15]} rotation={[slot * 0.13, slot * 0.61, 0.2]} scale={[2.1, 1.3, 2.4]} />
          ))}
          <mesh name="damaged-road-edge-slab" castShadow geometry={BOX} material={RUBBLE} position={[20, 0.65, 7]} rotation={[0.16, -0.4, -0.12]} scale={[10, 0.9, 2.7]} />
          <mesh name="bent-edge-rail" geometry={BOX} material={RUBBLE} position={[30, 1.35, 4]} rotation={[0.12, -0.72, 0.2]} scale={[7, 0.3, 0.35]} />
        </group>
      ) : null}
      {bridge.flashIntensity > 0 ? <mesh name="bridge-secondary-flash" geometry={SPHERE} material={FLASH} position={[p.x + 12, p.y + 2, p.z + 5]} scale={[4 * bridge.flashIntensity + 0.6, 3 * bridge.flashIntensity + 0.4, 4 * bridge.flashIntensity + 0.6]} /> : null}
      {bridge.dustIntensity > 0 ? (
        <group name="bridge-secondary-dust">
          {[0, 1, 2, 3, 4, 5].map((slot) => {
            const angle = slot * 2.4
            const radius = Math.min(age, 5) * (2.8 + slot * 0.3)
            return <DustPuff key={slot} position={[p.x + 15 + Math.cos(angle) * radius, p.y + 2 + age * 1.15, p.z + 5 + Math.sin(angle) * radius]} scale={[3 + age * 1.4, 2 + age * 0.85, 3 + age * 1.4]} opacity={bridge.dustIntensity * 0.18} />
          })}
        </group>
      ) : null}
      {bridge.shockProgress > 0 ? (
        <mesh name="bridge-compact-shock" geometry={RING} position={[p.x, p.y + 0.12, p.z]} rotation={[-Math.PI / 2, 0, 0]} scale={2 + bridge.shockProgress * 24}>
          <meshBasicMaterial color="#c4b58d" depthWrite={false} opacity={(1 - bridge.shockProgress) * 0.23} side={THREE.DoubleSide} transparent />
        </mesh>
      ) : null}
      {bridge.debrisActive ? (
        <group name="bridge-limited-debris">
          {[0, 1, 2, 3, 4, 5].map((slot) => {
            const t = Math.min(age, 2.4)
            const angle = slot * 2.399
            return <mesh key={slot} geometry={ROCK} material={RUBBLE} position={[p.x + 12 + Math.cos(angle) * 4 * t, p.y + 1 + Math.max(0, (5 + slot * 0.3) * t - 4.9 * t * t), p.z + 5 + Math.sin(angle) * 4 * t]} rotation={[t * 2 + slot, slot, t]} scale={0.2 + slot * 0.05} />
          })}
        </group>
      ) : null}
    </group>
  )
}
