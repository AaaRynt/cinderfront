import { memo, type ReactNode } from 'react'

import type { SupportLightingState, SupportSubtype } from '@/simulation/supportConvoyTypes'

import { SUPPORT_DIMENSIONS, SUPPORT_WHEEL_RADIUS_METERS } from '@/simulation/supportConvoy'

import { ALTERNATE_CARGO_PARTS, BOX, HUB, MODEL_PARTS, SUPPORT_AXLE_Z, SUPPORT_MATERIALS, TIRE } from './SupportVehicleGeometry'

export function SupportVehicleModel({ subtype, alternateLoad, wheelRotationRadians, steeringRadians, lighting }: { subtype: SupportSubtype; alternateLoad: boolean; wheelRotationRadians: number; steeringRadians: number; lighting: SupportLightingState }) {
  const { length, width, height } = SUPPORT_DIMENSIONS[subtype]
  const parts = alternateLoad && subtype === 'logistics_truck' ? ALTERNATE_CARGO_PARTS : MODEL_PARTS[subtype]
  return (
    <group dispose={null}>
      {stableBody(parts)}
      <StableWheels width={width} height={height} steeringRadians={steeringRadians} wheelRotationRadians={wheelRotationRadians} />
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh geometry={BOX} position={[side * 0.86, 1.46 - height / 2, -length / 2 + 0.03]} scale={[0.36, 0.21, 0.055]}>
            <meshStandardMaterial color="#dddabc" emissive="#fff1ca" emissiveIntensity={lighting.headlights ? 2 : 0} roughness={0.35} toneMapped={false} />
          </mesh>
          <mesh geometry={BOX} position={[side * 0.9, 1.19 - height / 2, length / 2 - 0.015]} scale={[0.28, 0.19, 0.045]}>
            <meshStandardMaterial color="#862921" emissive="#ff3d24" emissiveIntensity={lighting.brakeLights ? 3 : 0.22} toneMapped={false} />
          </mesh>
          <mesh geometry={BOX} position={[side * 0.54, 1.19 - height / 2, length / 2 - 0.015]} scale={[0.17, 0.13, 0.045]}>
            <meshStandardMaterial color="#b1b5ad" emissive="#fff7df" emissiveIntensity={lighting.reverseLights ? 2.2 : 0} toneMapped={false} />
          </mesh>
          <mesh geometry={BOX} position={[side * 0.7, height / 2 - 0.15, -length / 2 + 1.25]} scale={[0.48, 0.3, 0.38]}>
            <meshStandardMaterial color={subtype === 'fire_engine' ? '#a72d24' : '#ae7c2d'} emissive={subtype === 'fire_engine' ? '#ff3421' : '#ffb323'} emissiveIntensity={lighting.beaconIntensity * 4.5} toneMapped={false} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Parts are finite module-owned descriptors, independent of wheel/light time.
const bodies = new WeakMap<(typeof MODEL_PARTS)[SupportSubtype], ReactNode>()
function stableBody(parts: (typeof MODEL_PARTS)[SupportSubtype]) {
  let body = bodies.get(parts)
  if (!body) {
    body = parts.map((part) => <mesh key={part.name} name={part.name} castShadow receiveShadow geometry={part.geometry ?? BOX} material={part.material} position={part.position} rotation={part.rotation} scale={part.scale} />)
    bodies.set(parts, body)
  }
  return body
}

// Two module-owned child lists; moving steering/roll groups still update.
const WHEEL_PARTS = [-1, 1].map((side) => (
  <>
    <mesh castShadow geometry={TIRE} material={SUPPORT_MATERIALS.tire} rotation={[0, 0, Math.PI / 2]} />
    <mesh geometry={HUB} material={SUPPORT_MATERIALS.equipment} rotation={[0, 0, Math.PI / 2]} />
    <mesh geometry={BOX} material={SUPPORT_MATERIALS.chassis} position={[side * 0.16, 0.31, 0]} scale={[0.025, 0.18, 0.05]} />
  </>
))

function SupportWheels({ width, height, steeringRadians, wheelRotationRadians }: { width: number; height: number; steeringRadians: number; wheelRotationRadians: number }) {
  return (
    <>
      {([-1, 1] as const).flatMap((side) =>
        SUPPORT_AXLE_Z.map((z, axle) => (
          <group key={`${side}-${axle}`} position={[side * (width / 2 - 0.15), SUPPORT_WHEEL_RADIUS_METERS - height / 2, z]} rotation={[0, axle === 0 ? steeringRadians : 0, 0]}>
            <group rotation={[-wheelRotationRadians, 0, 0]}>{WHEEL_PARTS[side > 0 ? 1 : 0]}</group>
          </group>
        )),
      )}
    </>
  )
}
const StableWheels = memo(SupportWheels)
