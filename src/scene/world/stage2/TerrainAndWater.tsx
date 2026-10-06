import { useEffect, useMemo } from 'react'

import type { Stage2Materials } from './stage2Materials.ts'

import { CoastalWater } from '../stage4c/CoastalWater.tsx'
import { createCoastSkirtGeometry, createContinuousMainlandGeometry } from './terrainGeometry.ts'

export function TerrainAndWater({ materials }: { materials: Stage2Materials }) {
  const terrainGeometry = useMemo(() => createContinuousMainlandGeometry(), [])
  const coastGeometry = useMemo(() => createCoastSkirtGeometry(-3), [])

  useEffect(
    () => () => {
      coastGeometry.dispose()
      terrainGeometry.dispose()
    },
    [coastGeometry, terrainGeometry],
  )

  return (
    <group name="stage2-terrain-and-water">
      <CoastalWater />
      <mesh castShadow geometry={terrainGeometry} material={materials.terrain} name="continuous-mainland-terrain" receiveShadow />
      <mesh geometry={coastGeometry} material={materials.coastRock} name="exact-mainland-coastline" receiveShadow />
    </group>
  )
}
