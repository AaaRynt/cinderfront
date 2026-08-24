import type { Stage3Vec3 } from '../stage3/types.ts'
import type { Stage4AFuelEventDescriptor } from './fuelDisasterMath.ts'

import { sampleStage4AFuelBurst } from './fuelDisasterMath.ts'
import { STAGE4A_FUEL_GEOMETRIES, STAGE4A_FUEL_MATERIALS } from './sharedResources.ts'

export interface FuelEscalationBurstProps {
  readonly descriptor: Stage4AFuelEventDescriptor
  readonly position: Stage3Vec3
  readonly timeSeconds: number
}

/** Broad, lingering liquid-fuel combustion rather than ammunition's sharp flash language. */
export function FuelEscalationBurst({ descriptor, position, timeSeconds }: FuelEscalationBurstProps) {
  const sample = sampleStage4AFuelBurst(descriptor, timeSeconds)
  if (!sample.visible) return null

  const hero = descriptor.kind === 'hero-cascade'
  const scale = Math.max(0.001, sample.scaleM)
  const y = position[1] + scale * (hero ? 0.52 : 0.42)
  const resolvedPosition: Stage3Vec3 = [position[0], y, position[2]]

  return (
    <group name={`stage4a-fuel-burst:${descriptor.id}`} position={resolvedPosition}>
      <group scale={[scale, scale * sample.verticalStretch, scale]}>
        <mesh dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.burst} material={STAGE4A_FUEL_MATERIALS.burstOuter} scale={[0.92, 0.72, 0.86]} />
        <mesh dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.burst} material={STAGE4A_FUEL_MATERIALS.burstOuter} position={[-0.31, 0.23, 0.19]} scale={[0.61, 0.58, 0.56]} />
        <mesh dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.burst} material={STAGE4A_FUEL_MATERIALS.burstOuter} position={[0.3, 0.16, -0.27]} scale={[0.66, 0.52, 0.62]} />
        <mesh dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.burst} material={STAGE4A_FUEL_MATERIALS.burstInner} position={[0.03, 0.07, 0.02]} scale={[0.59, 0.54, 0.6]} />
        <mesh dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.burst} material={STAGE4A_FUEL_MATERIALS.burstHot} position={[-0.16, -0.14, -0.2]} scale={[0.35, 0.31, 0.38]} />
      </group>
      <mesh dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.burst} material={STAGE4A_FUEL_MATERIALS.flash} scale={descriptor.burstRadiusM * (hero ? 1.12 : 0.72)} visible={sample.flashIntensity > 0} />
      {hero ? <pointLight castShadow={false} color="#ffad5d" decay={2} distance={340} intensity={1_650 * sample.flashIntensity} /> : null}
    </group>
  )
}
