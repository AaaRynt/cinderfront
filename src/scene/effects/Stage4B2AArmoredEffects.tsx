import { BoxGeometry, CircleGeometry, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry } from 'three'

import type { SimulationWorldState, T72GroundVehicleState } from '@/simulation'

import { AftermathGroundDust } from './aftermath/AftermathGroundDust'
import { legacyDustScale, periodicAngle } from './aftermath/effectClocks'
import { createSoftSmokeMaterial, createSoftFlameMaterial, SOFT_SMOKE_GEOMETRY, SOFT_CENTERED_FLAME_GEOMETRY } from './stage3/softParticles'

const DUST = new SphereGeometry(1, 8, 5)
const FLASH = new SphereGeometry(1, 12, 8)
const FIREBALL = new SphereGeometry(1, 9, 6)
const SPARK = new BoxGeometry(0.055, 0.055, 1)
const FRAGMENT = new BoxGeometry(0.34, 0.18, 0.72)
const FIRE = SOFT_CENTERED_FLAME_GEOMETRY
const SMOKE = SOFT_SMOKE_GEOMETRY
const SCORCH = new CircleGeometry(1, 28)

const MATERIALS = {
  dust: new MeshBasicMaterial({ color: '#8b7a62', depthWrite: false, opacity: 0.095, transparent: true }),
  blastDust: new MeshBasicMaterial({ color: '#9b8568', depthWrite: false, opacity: 0.15, transparent: true }),
  flash: new MeshBasicMaterial({ color: '#fff0ba', depthWrite: false, opacity: 0.9, toneMapped: false, transparent: true }),
  fireball: new MeshBasicMaterial({ color: '#ff6d20', depthWrite: false, opacity: 0.79, toneMapped: false, transparent: true }),
  fireballCore: new MeshBasicMaterial({ color: '#ffd071', depthWrite: false, opacity: 0.86, toneMapped: false, transparent: true }),
  spark: new MeshBasicMaterial({ color: '#ffbd66', depthWrite: false, toneMapped: false }),
  fragment: new MeshStandardMaterial({ color: '#30342d', metalness: 0.52, roughness: 0.7 }),
  fire: createSoftFlameMaterial('#ed651f', 0.8),
  fireCore: createSoftFlameMaterial('#ffd16b', 0.88),
  smoke: createSoftSmokeMaterial('#293033', 0.48),
  smokeSoft: createSoftSmokeMaterial('#414944', 0.28),
  scorch: new MeshBasicMaterial({ color: '#161713', depthWrite: false, opacity: 0.66, transparent: true }),
} as const

const FRAGMENTS = [
  { spin: [1.4, 2.2, 0.8], velocity: [-5.8, 10.2, -3.2] },
  { spin: [-1.8, 1.1, 2.5], velocity: [6.4, 12.4, -1.1] },
  { spin: [2.1, -1.4, 1.7], velocity: [-3.1, 8.8, 6.2] },
  { spin: [0.7, 2.8, -2.2], velocity: [4.7, 11.3, 4.9] },
  { spin: [-2.4, 0.9, 1.2], velocity: [1.2, 9.6, -6.8] },
  { spin: [1.1, -2.5, 2.1], velocity: [-6.6, 13.1, 1.8] },
] as const

function TankMovementDust({ order, timeSeconds, vehicle }: { order: number; timeSeconds: number; vehicle: T72GroundVehicleState }) {
  const fade = legacyDustScale(timeSeconds)
  if (vehicle.dustIntensity <= 0.001 || fade <= 0) return null
  const { pose, routeTangent } = vehicle
  const motionYaw = Math.atan2(-routeTangent.x, -routeTangent.z)
  return (
    <group name={`${vehicle.id}-track-dust`} position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, motionYaw, pose.rotation.z]}>
      {([-1, 1] as const).flatMap((side) =>
        Array.from({ length: 4 }, (_, index) => {
          const progress = (timeSeconds * 0.62 + index / 4 + order * 0.173 + (side > 0 ? 0.11 : 0)) % 1
          const radius = (0.38 + progress * 1.3) * (0.8 + vehicle.dustIntensity) * fade
          return <mesh key={`${side}:${index}`} geometry={DUST} material={MATERIALS.dust} position={[side * 1.42 + Math.sin(index * 2.1) * 0.18, -1.04 + progress * 0.54, 2.05 + progress * 4.8]} scale={[radius * 1.45, radius * 0.52, radius]} />
        }),
      )}
    </group>
  )
}

function LeadTankKill({ timeSeconds, vehicle }: { timeSeconds: number; vehicle: T72GroundVehicleState }) {
  const { damage, pose } = vehicle
  if (damage.causeEventId !== 't72_lead_destroyed') return null
  const age = damage.ageSeconds
  const fireballProgress = Math.min(1, Math.max(0, age / 0.92))
  const firePulse = 0.93 + Math.sin(periodicAngle(timeSeconds, 8.3)) * 0.07

  return (
    <group name="stage4b2a-t72-lead-kill" position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z]}>
      <mesh geometry={SCORCH} material={MATERIALS.scorch} position={[0, -1.132, 0.05]} rotation={[-Math.PI / 2, 0, 0.18]} scale={[4.7 * damage.hullDamageProgress, 3.6 * damage.hullDamageProgress, 1]} />

      {damage.flashIntensity > 0.002 ? (
        <>
          <mesh geometry={FLASH} material={MATERIALS.flash} position={[0.12, 0.38, -0.25]} scale={0.6 + damage.flashIntensity * 4.1} />
          <pointLight color="#ff9d4d" distance={42} intensity={damage.flashIntensity * 105} position={[0.1, 1.2, -0.3]} />
        </>
      ) : null}

      {age >= 0.035 && age < 0.96 ? (
        <group position={[0.12, 0.55 + fireballProgress * 1.4, -0.28]}>
          <mesh geometry={FIREBALL} material={MATERIALS.fireball} scale={2.2 + fireballProgress * 5.1} />
          <mesh geometry={FIREBALL} material={MATERIALS.fireballCore} position={[-0.8, -0.1, 0.45]} scale={1.45 + fireballProgress * 2.7} />
        </group>
      ) : null}

      {Array.from({ length: 8 }, (_, index) => {
        const sparkAge = age - index * 0.045
        if (sparkAge < 0 || sparkAge > 0.9 || damage.sparkIntensity <= 0.001) return null
        const angle = index * 2.19 + 0.35
        const speed = 6.5 + (index % 3) * 2
        return <mesh key={index} geometry={SPARK} material={MATERIALS.spark} position={[Math.sin(angle) * speed * sparkAge, 0.52 + speed * 0.78 * sparkAge - 4.9 * sparkAge * sparkAge, Math.cos(angle) * speed * sparkAge]} rotation={[angle * 0.45, angle, 0.3]} scale={[1, 1, 0.35 + damage.sparkIntensity * 1.65]} />
      })}

      {FRAGMENTS.map((fragment, index) => {
        const fragmentAge = age - 0.055 - index * 0.025
        if (fragmentAge < 0 || fragmentAge > 2.45) return null
        return (
          <mesh
            key={index}
            geometry={FRAGMENT}
            material={MATERIALS.fragment}
            position={[fragment.velocity[0] * fragmentAge, Math.max(-1.04, 0.45 + fragment.velocity[1] * fragmentAge - 4.9 * fragmentAge * fragmentAge), fragment.velocity[2] * fragmentAge]}
            rotation={[fragment.spin[0] * fragmentAge, fragment.spin[1] * fragmentAge, fragment.spin[2] * fragmentAge]}
          />
        )
      })}

      {Array.from({ length: 7 }, (_, index) => {
        const puffAge = age - index * 0.06
        if (puffAge < 0 || puffAge > 1.55 || damage.dustKickIntensity <= 0.001) return null
        const progress = puffAge / 1.55
        const angle = index * 2.03
        const radius = 0.65 + progress * 2.15
        return <mesh key={index} geometry={DUST} material={MATERIALS.blastDust} position={[Math.sin(angle) * progress * 6.8, -1.02 + progress * 0.76, Math.cos(angle) * progress * 6.8]} scale={[radius * 1.5, radius * 0.58, radius]} />
      })}

      {damage.localFireIntensity > 0.001 ? (
        <group scale={damage.localFireIntensity * firePulse}>
          <mesh geometry={FIRE} material={MATERIALS.fire} position={[0.45, 1.05, 2.05]} scale={[1.25, 3.1, 1.25]} />
          <mesh geometry={FIRE} material={MATERIALS.fireCore} position={[0.14, 0.72, 1.84]} scale={[0.68, 2.05, 0.68]} />
          <mesh geometry={FIRE} material={MATERIALS.fire} position={[-0.62, 0.62, 0.38]} scale={[0.72, 1.8, 0.72]} />
        </group>
      ) : null}

      {Array.from({ length: 8 }, (_, index) => {
        const birth = 0.32 + index * 0.38
        if (age < birth || damage.smokeIntensity <= 0.001) return null
        const cycleAge = (age - birth) % 4.9
        const progress = cycleAge / 4.9
        const radius = (0.78 + progress * 3.1) * damage.smokeIntensity
        return (
          <mesh key={index} geometry={SMOKE} material={index % 3 === 0 ? MATERIALS.smokeSoft : MATERIALS.smoke} position={[0.45 + Math.sin(index * 2.17) * progress * 1.45 + progress * 2.4, 1.2 + progress * 34, 2.05 + Math.cos(index * 1.71) * progress * 1.3 - progress * 1.1]} scale={[radius * 1.08, radius, radius]} />
        )
      })}
    </group>
  )
}

export function Stage4B2AArmoredEffects({ world }: { world: SimulationWorldState }) {
  const group = world.stage4b.t72Group
  const lead = group.vehicles.defender_t72_01
  return (
    <group dispose={null} name="ash-harbor-stage4b2a-armored-effects">
      {group.orderedVehicleIds.map((id, order) => (
        <TankMovementDust key={id} order={order} timeSeconds={world.timeSeconds} vehicle={group.vehicles[id]} />
      ))}
      <AftermathGroundDust family="t72" ids={group.orderedVehicleIds} time={world.timeSeconds} />
      <LeadTankKill timeSeconds={world.timeSeconds} vehicle={lead} />
    </group>
  )
}
