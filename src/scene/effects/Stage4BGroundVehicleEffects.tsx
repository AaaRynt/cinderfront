import { BoxGeometry, ConeGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, Quaternion, RingGeometry, SphereGeometry, Vector3 as ThreeVector3 } from 'three'

import type { GroundVehicleState, SimulationWorldState } from '@/simulation'

import { AftermathGroundDust } from './aftermath/AftermathGroundDust'
import { legacyDustScale, periodicAngle } from './aftermath/effectClocks'
import { AMMUNITION_PRIMARY_EFFECT_POSITION } from './stage3/index.ts'

const DUST_GEOMETRY = new SphereGeometry(1, 8, 5)
const SMOKE_GEOMETRY = new SphereGeometry(1, 9, 6)
const FLASH_GEOMETRY = new SphereGeometry(1, 12, 8)
const SPARK_GEOMETRY = new BoxGeometry(0.06, 0.06, 1)
const DEBRIS_STREAK_GEOMETRY = new CylinderGeometry(0.055, 0.12, 1, 6)
const FIRE_GEOMETRY = new ConeGeometry(1, 1, 8)
const SCORCH_GEOMETRY = new RingGeometry(0.18, 1, 28)
const PRESSURE_RING_GEOMETRY = new RingGeometry(0.82, 1, 32)

const MATERIALS = {
  asphaltDust: new MeshBasicMaterial({ color: '#8f8167', depthWrite: false, opacity: 0.075, transparent: true }),
  blastDust: new MeshBasicMaterial({ color: '#98856a', depthWrite: false, opacity: 0.13, transparent: true }),
  smoke: new MeshBasicMaterial({ color: '#202420', depthWrite: false, opacity: 0.2, transparent: true }),
  smokeSoft: new MeshBasicMaterial({ color: '#353932', depthWrite: false, opacity: 0.12, transparent: true }),
  flash: new MeshBasicMaterial({ color: '#ffd29a', depthWrite: false, opacity: 0.72, toneMapped: false, transparent: true }),
  fire: new MeshBasicMaterial({ color: '#ff7b2d', depthWrite: false, opacity: 0.78, toneMapped: false, transparent: true }),
  fireCore: new MeshBasicMaterial({ color: '#ffd36f', depthWrite: false, opacity: 0.84, toneMapped: false, transparent: true }),
  spark: new MeshBasicMaterial({ color: '#ffb358', depthWrite: false, toneMapped: false }),
  debris: new MeshStandardMaterial({ color: '#d26e2c', emissive: '#ff8a35', emissiveIntensity: 1.6, metalness: 0.42, roughness: 0.48 }),
  scorch: new MeshBasicMaterial({ color: '#171916', depthWrite: false, opacity: 0.62, transparent: true }),
  pressure: new MeshBasicMaterial({ color: '#d3b98c', depthWrite: false, opacity: 0.18, transparent: true }),
}

const WORLD_UP = new ThreeVector3(0, 1, 0)

function quadraticArc(start: readonly [number, number, number], control: readonly [number, number, number], end: readonly [number, number, number], amount: number) {
  const inverse = 1 - amount
  return new ThreeVector3(inverse * inverse * start[0] + 2 * inverse * amount * control[0] + amount * amount * end[0], inverse * inverse * start[1] + 2 * inverse * amount * control[1] + amount * amount * end[1], inverse * inverse * start[2] + 2 * inverse * amount * control[2] + amount * amount * end[2])
}

function VehicleDust({ order, timeSeconds, vehicle }: { order: number; timeSeconds: number; vehicle: GroundVehicleState }) {
  const fade = legacyDustScale(timeSeconds)
  if (vehicle.dustIntensity <= 0.001 || fade <= 0) return null
  const { pose } = vehicle
  return (
    <group name={`${vehicle.id}-movement-dust`} position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
      {Array.from({ length: 5 }, (_, index) => {
        const progress = (timeSeconds * 0.72 + index / 5 + order * 0.137) % 1
        const radius = (0.42 + progress * 1.45) * (0.72 + vehicle.dustIntensity) * fade
        const side = (((index * 1.73 + order * 0.61) % 2) - 1) * 1.05
        return <mesh key={index} geometry={DUST_GEOMETRY} material={MATERIALS.asphaltDust} position={[side, -1.08 + progress * 0.72, 2.2 + progress * 5.8]} scale={[radius * 1.35, radius * 0.58, radius]} />
      })}
    </group>
  )
}

interface DebrisDescriptor {
  readonly arrivalSeconds: number
  readonly launchSeconds: number
  readonly lateralOffsetMeters: number
  readonly endOffset: readonly [number, number, number]
}

const SECONDARY_DEBRIS = [
  { arrivalSeconds: 132.94, launchSeconds: 132.14, lateralOffsetMeters: -15, endOffset: [0.8, 0.45, -0.7] },
  { arrivalSeconds: 132.97, launchSeconds: 132.22, lateralOffsetMeters: 12, endOffset: [-0.55, 0.2, 0.5] },
  { arrivalSeconds: 132.985, launchSeconds: 132.31, lateralOffsetMeters: -6, endOffset: [0.15, 0.75, 0.2] },
  { arrivalSeconds: 133, launchSeconds: 132.4, lateralOffsetMeters: 5, endOffset: [0.45, 0.05, -0.2] },
] as const satisfies readonly DebrisDescriptor[]

function SecondaryDebrisFragment({ descriptor, lead, timeSeconds }: { descriptor: DebrisDescriptor; lead: GroundVehicleState; timeSeconds: number }) {
  const duration = descriptor.arrivalSeconds - descriptor.launchSeconds
  const progress = (timeSeconds - descriptor.launchSeconds) / duration
  if (progress < 0 || progress > 1) return null
  const start = AMMUNITION_PRIMARY_EFFECT_POSITION
  const end = [lead.pose.position.x + descriptor.endOffset[0], lead.pose.position.y + descriptor.endOffset[1], lead.pose.position.z + descriptor.endOffset[2]] as const
  const control = [(start[0] + end[0]) / 2 + descriptor.lateralOffsetMeters, Math.max(start[1], end[1]) + 78, (start[2] + end[2]) / 2 - descriptor.lateralOffsetMeters * 0.35] as const
  const head = quadraticArc(start, control, end, progress)
  const tail = quadraticArc(start, control, end, Math.max(0, progress - 0.018))
  const delta = head.clone().sub(tail)
  const length = Math.max(0.4, delta.length())
  const midpoint = head.clone().add(tail).multiplyScalar(0.5)
  const quaternion = new Quaternion().setFromUnitVectors(WORLD_UP, delta.normalize())
  return <mesh geometry={DEBRIS_STREAK_GEOMETRY} material={MATERIALS.debris} position={midpoint} quaternion={quaternion} scale={[1, length, 1]} />
}

function SecondaryAmmunitionDebris({ lead, timeSeconds }: { lead: GroundVehicleState; timeSeconds: number }) {
  if (timeSeconds < SECONDARY_DEBRIS[0].launchSeconds || timeSeconds > 133) return null
  return (
    <group name="stage4b-ammunition-secondary-debris">
      {SECONDARY_DEBRIS.map((descriptor, index) => (
        <SecondaryDebrisFragment key={index} descriptor={descriptor} lead={lead} timeSeconds={timeSeconds} />
      ))}
    </group>
  )
}

function LeadLossEffect({ lead, timeSeconds }: { lead: GroundVehicleState; timeSeconds: number }) {
  const { damage, pose } = lead
  if (damage.causeEventId === null) return null
  const age = damage.ageSeconds
  const flashScale = Math.max(0.01, damage.flashIntensity * 3.2)
  const pressureAge = Math.min(1, age / 1.15)
  const firePulse = 0.92 + Math.sin(periodicAngle(timeSeconds, 8.7)) * 0.08

  return (
    <group name="stage4b-btr-01-local-loss" position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
      <mesh geometry={SCORCH_GEOMETRY} material={MATERIALS.scorch} position={[0.25, -1.142, -0.2]} rotation={[-Math.PI / 2, 0, 0.3]} scale={[5.4 * damage.hullDamageProgress, 4.1 * damage.hullDamageProgress, 1]} />

      {damage.flashIntensity > 0.002 ? (
        <>
          <mesh geometry={FLASH_GEOMETRY} material={MATERIALS.flash} position={[0.35, 0.15, -0.25]} scale={[flashScale, flashScale * 0.82, flashScale]} />
          <pointLight color="#ff9b4b" distance={28} intensity={damage.flashIntensity * 65} position={[0.3, 1.2, -0.3]} />
        </>
      ) : null}

      {age < 1.15 ? <mesh geometry={PRESSURE_RING_GEOMETRY} material={MATERIALS.pressure} position={[0, -1.13, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.2 + pressureAge * 15, 1.2 + pressureAge * 15, 1]} /> : null}

      {Array.from({ length: 7 }, (_, index) => {
        const sparkAge = age - index * 0.055
        if (sparkAge < 0 || sparkAge > 1.2 || damage.sparkIntensity <= 0.001) return null
        const angle = index * 2.31 + 0.4
        const speed = 7 + (index % 3) * 2.2
        return <mesh key={index} geometry={SPARK_GEOMETRY} material={MATERIALS.spark} position={[Math.sin(angle) * speed * sparkAge, 0.35 + speed * 0.72 * sparkAge - 4.9 * sparkAge * sparkAge, Math.cos(angle) * speed * sparkAge]} rotation={[angle * 0.4, angle, 0.4]} scale={[1, 1, 0.35 + damage.sparkIntensity * 1.8]} />
      })}

      {Array.from({ length: 6 }, (_, index) => {
        const puffAge = age - index * 0.07
        if (puffAge < 0 || puffAge > 1.6 || damage.dustKickIntensity <= 0.001) return null
        const angle = index * 2.07
        const progress = puffAge / 1.6
        const radius = 0.7 + progress * 2.5
        return <mesh key={index} geometry={DUST_GEOMETRY} material={MATERIALS.blastDust} position={[Math.sin(angle) * progress * 6.5, -1.02 + progress * 0.8, Math.cos(angle) * progress * 6.5]} scale={[radius * 1.5, radius * 0.62, radius]} />
      })}

      {damage.localFireIntensity > 0.001 ? (
        <group position={[0.48, 0.45, -0.38]} scale={[damage.localFireIntensity * firePulse, damage.localFireIntensity * firePulse, damage.localFireIntensity * firePulse]}>
          <mesh geometry={FIRE_GEOMETRY} material={MATERIALS.fire} position={[0, 0.6, 0]} scale={[1.35, 3.1, 1.35]} />
          <mesh geometry={FIRE_GEOMETRY} material={MATERIALS.fireCore} position={[-0.25, 0.35, 0.18]} scale={[0.72, 1.9, 0.72]} />
        </group>
      ) : null}

      {Array.from({ length: 8 }, (_, index) => {
        const birth = 0.45 + index * 0.34
        if (age < birth || damage.smokeIntensity <= 0.001) return null
        const cycleAge = (age - birth) % 4.4
        const progress = cycleAge / 4.4
        const radius = (0.85 + progress * 3.4) * damage.smokeIntensity
        return (
          <mesh
            key={index}
            geometry={SMOKE_GEOMETRY}
            material={index % 3 === 0 ? MATERIALS.smokeSoft : MATERIALS.smoke}
            position={[0.48 + Math.sin(index * 2.12) * progress * 1.8 + progress * 3.2, 0.9 + progress * 14, -0.38 + Math.cos(index * 1.73) * progress * 1.6 - progress * 1.4]}
            scale={[radius * 1.12, radius, radius]}
          />
        )
      })}
    </group>
  )
}

export function Stage4BGroundVehicleEffects({ world }: { world: SimulationWorldState }) {
  const group = world.stage4b.btrGroup
  const lead = group.vehicles.defender_btr_01
  return (
    <group name="ash-harbor-stage4b-ground-vehicle-effects">
      {group.orderedVehicleIds.map((id, order) => (
        <VehicleDust key={id} order={order} timeSeconds={world.timeSeconds} vehicle={group.vehicles[id]} />
      ))}
      <AftermathGroundDust family="btr" ids={group.orderedVehicleIds} time={world.timeSeconds} />
      <SecondaryAmmunitionDebris lead={lead} timeSeconds={world.timeSeconds} />
      <LeadLossEffect lead={lead} timeSeconds={world.timeSeconds} />
    </group>
  )
}
