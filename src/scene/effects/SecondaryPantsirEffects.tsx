import { useEffect, useMemo } from 'react'
import { BoxGeometry, ConeGeometry, CylinderGeometry, MeshBasicMaterial, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3 } from 'three'

import type { SimulationWorldState } from '@/simulation'

import { deriveSecondaryPantsirState, SECONDARY_PANTSIR_TIMING } from '@/simulation/secondaryPantsir'

import { periodicAngle } from './aftermath/effectClocks'
import { createSecondaryPantsirScorch } from './secondaryPantsirSurface'

type SecondaryPantsirState = SimulationWorldState['secondaryPantsir']
type DefensiveShot = SecondaryPantsirState['defensiveShots'][number]

const PUFF = new SphereGeometry(1, 9, 6)
const FLASH = new SphereGeometry(1, 12, 8)
const FIRE = new ConeGeometry(1, 1, 8)
const FRAGMENT = new BoxGeometry(0.2, 0.1, 0.42)
const SPARK = new BoxGeometry(0.04, 0.04, 0.7)
const MISSILE = new CylinderGeometry(0.095, 0.12, 2.1, 8)
const MISSILE_FLAME = new ConeGeometry(0.2, 1.1, 7)
const TRAIL = new CylinderGeometry(0.065, 0.065, 1, 6)
const WORLD_UP = new Vector3(0, 1, 0)
const IMPACT_YAW = deriveSecondaryPantsirState(SECONDARY_PANTSIR_TIMING.destroyed).pose.rotation.y

// Shared immutable resources serve fixed slots; seeks never create a particle pool.
const MATERIALS = {
  dust: new MeshBasicMaterial({ color: '#a08e70', depthWrite: false, opacity: 0.13, transparent: true }),
  flash: new MeshBasicMaterial({ color: '#fff0c6', depthWrite: false, opacity: 0.88, toneMapped: false, transparent: true }),
  fire: new MeshBasicMaterial({ color: '#ee6424', depthWrite: false, opacity: 0.78, toneMapped: false, transparent: true }),
  fireCore: new MeshBasicMaterial({ color: '#ffd079', depthWrite: false, opacity: 0.8, toneMapped: false, transparent: true }),
  smoke: new MeshBasicMaterial({ color: '#252b29', depthWrite: false, opacity: 0.17, transparent: true }),
  smokeSoft: new MeshBasicMaterial({ color: '#424740', depthWrite: false, opacity: 0.11, transparent: true }),
  fragment: new MeshStandardMaterial({ color: '#30382d', metalness: 0.42, roughness: 0.86 }),
  spark: new MeshBasicMaterial({ color: '#ffc078', toneMapped: false }),
  missile: new MeshStandardMaterial({ color: '#d2d4c5', metalness: 0.22, roughness: 0.72 }),
  trail: new MeshBasicMaterial({ color: '#d6ded4', depthWrite: false, opacity: 0.36, transparent: true }),
  scorch: new MeshBasicMaterial({ color: '#171b16', depthWrite: false, opacity: 0.63, polygonOffset: true, polygonOffsetFactor: -1, transparent: true }),
} as const

MATERIALS.scorch.onBeforeCompile = (shader) => {
  shader.vertexShader = `varying vec2 vScorchUv;\n${shader.vertexShader}`.replace('#include <uv_vertex>', '#include <uv_vertex>\nvScorchUv = uv;')
  shader.fragmentShader = `varying vec2 vScorchUv;\n${shader.fragmentShader}`.replace('#include <alphatest_fragment>', 'diffuseColor.a *= smoothstep(0.0, 0.18, 1.0 - length(vScorchUv * 2.0 - 1.0));\n#include <alphatest_fragment>')
}
MATERIALS.scorch.customProgramCacheKey = () => 'secondary-pantsir-draped-scorch'

const SMOKE_SLOTS = Array.from({ length: 8 }, (_, index) => index)
const DUST_SLOTS = Array.from({ length: 5 }, (_, index) => index)
const FRAGMENTS = [
  { velocity: [-4.1, 7.4, -2.6], spin: [1.4, 0.8, 1.2] },
  { velocity: [4.4, 8.8, 1.3], spin: [0.7, 1.8, -1.1] },
  { velocity: [-1.8, 6.9, 4.5], spin: [-1.5, 1.1, 0.9] },
  { velocity: [2.7, 8.1, -4.2], spin: [1.2, -1.4, 0.7] },
] as const

function curvePoint(shot: DefensiveShot, progress: number) {
  const inverse = 1 - progress
  return new Vector3(
    inverse * inverse * shot.origin.x + 2 * inverse * progress * shot.control.x + progress * progress * shot.end.x,
    inverse * inverse * shot.origin.y + 2 * inverse * progress * shot.control.y + progress * progress * shot.end.y,
    inverse * inverse * shot.origin.z + 2 * inverse * progress * shot.control.z + progress * progress * shot.end.z,
  )
}

function DefensiveMissile({ shot }: { shot: DefensiveShot }) {
  if (!shot.active) return null
  const progress = Math.max(0, Math.min(1, shot.ageSeconds / shot.durationSeconds))
  const head = curvePoint(shot, progress)
  const ahead = curvePoint(shot, Math.min(1, progress + 0.003))
  const behind = curvePoint(shot, Math.max(0, progress - 0.003))
  const direction = ahead.sub(behind).normalize()
  const quaternion = new Quaternion().setFromUnitVectors(WORLD_UP, direction)
  const tail = curvePoint(shot, Math.max(0, progress - 0.025))
  const trailDirection = head.clone().sub(tail)
  const trailLength = trailDirection.length()
  const midpoint = head.clone().add(tail).multiplyScalar(0.5)
  return (
    <group name={shot.id}>
      {shot.ageSeconds < 0.16 ? <mesh name="secondary-pantsir-launch-flash" geometry={FLASH} material={MATERIALS.fireCore} position={[shot.origin.x, shot.origin.y, shot.origin.z]} scale={0.42 * (1 - shot.ageSeconds / 0.16)} /> : null}
      <group position={head} quaternion={quaternion}>
        <mesh geometry={MISSILE} material={MATERIALS.missile} />
        <mesh geometry={MISSILE_FLAME} material={MATERIALS.fireCore} position={[0, -1.48, 0]} rotation={[Math.PI, 0, 0]} />
      </group>
      {trailLength > 0.01 ? <mesh geometry={TRAIL} material={MATERIALS.trail} position={midpoint} quaternion={new Quaternion().setFromUnitVectors(WORLD_UP, trailDirection.normalize())} scale={[1, trailLength, 1]} /> : null}
    </group>
  )
}

/** Compact terminal strike and absolute-time fixed slots stay subordinate to the industrial effects. */
export function SecondaryPantsirEffects({ state, time }: { state: SecondaryPantsirState; time: number }) {
  const { destruction, pose } = state
  const ground = destruction.groundPosition
  const impact = destruction.impactPosition
  const scorch = useMemo(() => createSecondaryPantsirScorch({ x: ground.x, y: ground.y, z: ground.z }, IMPACT_YAW), [ground.x, ground.y, ground.z])
  useEffect(() => () => scorch.dispose(), [scorch])
  const age = destruction.ageSeconds
  const firePulse = 0.94 + Math.sin(periodicAngle(time, 8.3)) * 0.06
  return (
    <group name="secondary-pantsir-effects" dispose={null}>
      {state.defensiveShots.map((shot) => (
        <DefensiveMissile key={shot.id} shot={shot} />
      ))}
      {state.movementDust > 0.001 ? (
        <group name="secondary-pantsir-wheel-dust" position={[pose.position.x, pose.position.y, pose.position.z]} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z, 'YXZ']}>
          {DUST_SLOTS.map((slot) => {
            const progress = (time * 0.71 + slot * 0.217) % 1
            const size = (0.35 + progress * 0.9) * Math.sqrt(state.movementDust / 0.25)
            return <mesh key={slot} geometry={PUFF} material={MATERIALS.dust} position={[(slot % 2 === 0 ? -1 : 1) * 1.4, 0.24 + progress * 0.4, 3.2 + progress * 3.4]} scale={[size * 1.3, size * 0.5, size]} />
          })}
        </group>
      ) : null}
      {destruction.active ? (
        <>
          <mesh name="secondary-pantsir-scorch" geometry={scorch} material={MATERIALS.scorch} renderOrder={1} />
          {destruction.flashIntensity > 0.002 ? (
            <group position={[impact.x, impact.y, impact.z]}>
              <mesh name="secondary-pantsir-terminal-flash" geometry={FLASH} material={MATERIALS.flash} scale={0.6 + destruction.flashIntensity * 3.2} />
              <pointLight color="#ffb16b" distance={32} intensity={destruction.flashIntensity * 85} />
            </group>
          ) : null}
          {age >= 0.025 && age < 0.75 ? <mesh name="secondary-pantsir-compact-fireball" geometry={FLASH} material={MATERIALS.fire} position={[impact.x, impact.y + age * 0.65, impact.z]} scale={[1.3 + age * 3.2, 1.5 + age * 3.7, 1.3 + age * 3.2]} /> : null}
          {FRAGMENTS.map((fragment, slot) => {
            const fragmentAge = age - 0.035 - slot * 0.025
            if (fragmentAge < 0 || fragmentAge > 1.65) return null
            return (
              <mesh
                key={slot}
                name="secondary-pantsir-fragment"
                geometry={FRAGMENT}
                material={MATERIALS.fragment}
                position={[impact.x + fragment.velocity[0] * fragmentAge, Math.max(ground.y + 0.14, impact.y + fragment.velocity[1] * fragmentAge - 4.9 * fragmentAge * fragmentAge), impact.z + fragment.velocity[2] * fragmentAge]}
                rotation={[fragment.spin[0] * fragmentAge, fragment.spin[1] * fragmentAge, fragment.spin[2] * fragmentAge]}
              />
            )
          })}
          {DUST_SLOTS.map((slot) => {
            const sparkAge = age - slot * 0.04
            if (sparkAge < 0 || sparkAge > 0.9) return null
            const angle = slot * 2.41
            return (
              <mesh
                key={slot}
                name="secondary-pantsir-spark"
                geometry={SPARK}
                material={MATERIALS.spark}
                position={[impact.x + Math.sin(angle) * sparkAge * 6, Math.max(ground.y + 0.12, impact.y + sparkAge * 4 - sparkAge * sparkAge * 4.9), impact.z + Math.cos(angle) * sparkAge * 6]}
                rotation={[angle * 0.45, angle, 0.4]}
              />
            )
          })}
          {destruction.dustIntensity > 0.001
            ? DUST_SLOTS.map((slot) => {
                const progress = Math.min(1, age / 1.65)
                const radius = (0.65 + progress * 2.1) * Math.sqrt(destruction.dustIntensity)
                const angle = slot * 2.07
                return <mesh key={slot} name="secondary-pantsir-impact-dust" geometry={PUFF} material={MATERIALS.dust} position={[ground.x + Math.sin(angle) * progress * 5, ground.y + 0.45 + progress * 0.7, ground.z + Math.cos(angle) * progress * 5]} scale={[radius * 1.5, radius * 0.6, radius]} />
              })
            : null}
          {destruction.fireIntensity > 0.001 ? (
            <group name="secondary-pantsir-local-fire" position={[impact.x, Math.max(impact.y, ground.y + 2.8), impact.z]} scale={destruction.fireIntensity * firePulse}>
              <mesh geometry={FIRE} material={MATERIALS.fire} position={[0.32, 1, 0.1]} scale={[0.95, 3, 0.85]} />
              <mesh geometry={FIRE} material={MATERIALS.fireCore} position={[-0.1, 0.65, 0.24]} scale={[0.55, 1.9, 0.55]} />
            </group>
          ) : null}
          {SMOKE_SLOTS.map((slot) => {
            const emittedAge = age - 0.3 - slot * 0.39
            if (emittedAge < 0 || destruction.smokeIntensity < 0.001) return null
            const progress = (emittedAge % 4.8) / 4.8
            const fade = Math.min(1, progress * 9) * Math.min(1, (1 - progress) * 6)
            const size = (0.7 + progress * 2.6) * fade * destruction.smokeIntensity
            return (
              <mesh
                key={slot}
                name="secondary-pantsir-bounded-smoke"
                geometry={PUFF}
                material={slot % 3 === 0 ? MATERIALS.smokeSoft : MATERIALS.smoke}
                position={[impact.x + progress * 4.4 + Math.sin(slot * 2.1) * progress * 0.85, impact.y + 1 + progress * 13, impact.z + progress * 4.4 + Math.cos(slot * 1.7) * progress * 0.85]}
                scale={[size, size * 1.1, size]}
              />
            )
          })}
        </>
      ) : null}
    </group>
  )
}
