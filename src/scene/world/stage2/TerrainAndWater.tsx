import { useEffect, useMemo } from 'react'

import type { Stage2Materials } from './stage2Materials.ts'

import { createLandingCoastGeometry, createLandingMainlandGeometry, getPreparedTerrainMeshes } from '../landing/landingTerrain'
import { CoastalWater } from '../stage4c/CoastalWater.tsx'

export function TerrainAndWater({ materials }: { materials: Stage2Materials }) {
  const resources = useMemo(() => getPreparedTerrainMeshes() ?? { terrain: createLandingMainlandGeometry(), coast: createLandingCoastGeometry(-3) }, [])
  const { terrain: terrainGeometry, coast: coastGeometry } = resources

  useEffect(
    () => () => {
      if (getPreparedTerrainMeshes()?.terrain === terrainGeometry) return
      coastGeometry.dispose()
      terrainGeometry.dispose()
    },
    [coastGeometry, terrainGeometry],
  )

  return (
    <group name="stage2-terrain-and-water">
      <CoastalWater />
      <mesh geometry={terrainGeometry} material={materials.terrain} name="continuous-mainland-terrain" receiveShadow />
      <mesh geometry={coastGeometry} material={materials.coastRock} name="exact-mainland-coastline" receiveShadow />
    </group>
  )
}
