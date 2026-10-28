import { memo } from 'react'
import { MeshBasicMaterial, SphereGeometry } from 'three'

import type { Su30AircraftState, Su30ReinforcementState, Vector3 } from '@/simulation'

import { SU30_DAMAGE_OFFSET, SU30_ENGINE_OFFSETS, SU30_NAVIGATION_OFFSETS } from '@/simulation'

import { Su30MkkModel } from './Su30MkkModel'

// Both aircraft and every bounded effect slot reuse these resources. Opacity is
// selected from a small shared palette, never a material allocated each frame.
const EFFECT_SPHERE = new SphereGeometry(1, 12, 8)
const EFFECT_MATERIALS = {
  exhaust: new MeshBasicMaterial({ color: '#ffb57b', transparent: true, opacity: 0.54, depthWrite: false, toneMapped: false }),
  exhaustHaze: new MeshBasicMaterial({ color: '#96a3a7', transparent: true, opacity: 0.035, depthWrite: false }),
  flash: new MeshBasicMaterial({ color: '#ffdc9c', transparent: true, opacity: 0.84, depthWrite: false, toneMapped: false }),
  spark: new MeshBasicMaterial({ color: '#ffbc6a', depthWrite: false, toneMapped: false }),
  red: new MeshBasicMaterial({ color: '#ec4f3b', toneMapped: false }),
  green: new MeshBasicMaterial({ color: '#78c39a', toneMapped: false }),
  vapor: new MeshBasicMaterial({ color: '#b8c5c5', transparent: true, opacity: 0.09, depthWrite: false }),
}
const SMOKE_PALETTE = Array.from({ length: 24 }, (_, index) => new MeshBasicMaterial({ color: '#6c7172', transparent: true, opacity: (index + 1) / 120, depthWrite: false }))

function tuple(position: Vector3): [number, number, number] {
  return [position.x, position.y, position.z]
}

function AttachedPresentation({ aircraft }: { aircraft: Su30AircraftState }) {
  return (
    <>
      {(['left', 'right'] as const).map((side) => {
        const intensity = side === 'left' ? aircraft.engine.leftIntensity : aircraft.engine.rightIntensity
        const nozzle = SU30_ENGINE_OFFSETS[side]
        return (
          <group key={side} position={tuple(nozzle)}>
            <mesh geometry={EFFECT_SPHERE} material={EFFECT_MATERIALS.exhaust} position={[0, 0, 0.12]} scale={[0.38 * intensity, 0.38 * intensity, 0.35 + 0.5 * intensity]} />
            <mesh geometry={EFFECT_SPHERE} material={EFFECT_MATERIALS.exhaustHaze} position={[0, 0, 1.3]} scale={[0.45, 0.45, 1.65 * intensity]} />
          </group>
        )
      })}
      <mesh geometry={EFFECT_SPHERE} material={EFFECT_MATERIALS.red} position={tuple(SU30_NAVIGATION_OFFSETS.left)} scale={0.11} />
      <mesh geometry={EFFECT_SPHERE} material={EFFECT_MATERIALS.green} position={tuple(SU30_NAVIGATION_OFFSETS.right)} scale={0.11} />
      <mesh geometry={EFFECT_SPHERE} material={EFFECT_MATERIALS.red} position={tuple(SU30_NAVIGATION_OFFSETS.beacon)} scale={0.15 * aircraft.navigationLightIntensity} />
      {([-1, 1] as const).map((side) => (
        <mesh key={side} geometry={EFFECT_SPHERE} material={EFFECT_MATERIALS.vapor} position={[side * 2.55, -0.48, -0.3]} rotation={[0, side * -0.3, 0]} scale={[0.45 * aircraft.vaporIntensity, 0.12 * aircraft.vaporIntensity, 2.5 * aircraft.vaporIntensity]} />
      ))}
      {aircraft.damage.flashIntensity > 0 ? <mesh geometry={EFFECT_SPHERE} material={EFFECT_MATERIALS.flash} position={tuple(SU30_DAMAGE_OFFSET)} scale={aircraft.damage.flashIntensity * 1.05} /> : null}
    </>
  )
}

function Su30Aircraft({ aircraft }: { aircraft: Su30AircraftState }) {
  const { pose } = aircraft
  return (
    <group name={`${aircraft.id}-presentation`} visible={aircraft.visible}>
      <group name={aircraft.id} visible={aircraft.visible} position={tuple(pose.position)} rotation={[pose.rotation.x, pose.rotation.y, pose.rotation.z, 'YXZ']}>
        <StableSu30MkkModel damaged={aircraft.damage.surfaceDarkened} />
        <AttachedPresentation aircraft={aircraft} />
      </group>
      {/* Historic emitted positions deliberately live outside the rotating actor. */}
      <group name={`${aircraft.id}-damage-trail`}>
        {aircraft.damageTrail.map((sample, index) => (
          <mesh key={index} geometry={EFFECT_SPHERE} material={SMOKE_PALETTE[Math.min(23, Math.max(0, Math.round(sample.opacity * 120) - 1))]} position={tuple(sample.position)} scale={[sample.radius * 1.12, sample.radius, sample.radius]} visible={sample.opacity > 0.003} />
        ))}
      </group>
      <group name={`${aircraft.id}-contact-sparks`}>
        {aircraft.damageSparks.map((sample, index) => (
          <mesh key={index} geometry={EFFECT_SPHERE} material={EFFECT_MATERIALS.spark} position={tuple(sample.position)} scale={sample.radius * Math.sqrt(sample.opacity)} />
        ))}
      </group>
    </group>
  )
}

export function Su30MkkGroup({ group }: { group: Su30ReinforcementState }) {
  return (
    <group dispose={null} name="stage4b2b-su30-reinforcement">
      {group.orderedAircraftIds.map((id) => (
        <Su30Aircraft key={id} aircraft={group.aircraft[id]} />
      ))}
    </group>
  )
}

const StableSu30MkkModel = memo(Su30MkkModel)
