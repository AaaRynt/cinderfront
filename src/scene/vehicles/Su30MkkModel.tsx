import type { ThreeElements } from '@react-three/fiber'

import { memo } from 'react'

import { SU30_MATERIALS, SU30_MODEL_PARTS } from './Su30MkkGeometry.ts'

export interface Su30MkkModelProps extends Omit<ThreeElements['group'], 'children'> {
  damaged?: boolean
}

const StaticAirframe = memo(function StaticAirframe({ damaged }: { damaged: boolean }) {
  return (
    <group dispose={null}>
      {SU30_MODEL_PARTS.map((part) => (
        <mesh key={part.name} name={part.name} geometry={part.geometry} material={damaged && part.damagedSurface ? SU30_MATERIALS.scorched : part.material} position={part.position} rotation={part.rotation} scale={part.scale} castShadow />
      ))}
    </group>
  )
})

/** Centered 21.94 × 14.7 × 6.36 m airframe, facing local -Z; effects are separate. */
export function Su30MkkModel({ damaged = false, ...groupProps }: Su30MkkModelProps) {
  return (
    <group {...groupProps} dispose={null}>
      <StaticAirframe damaged={damaged} />
    </group>
  )
}
