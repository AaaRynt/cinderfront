import { useEffect, useMemo } from 'react'

import type { Stage2Materials } from './stage2Materials.ts'

import { MAP_BOUNDS } from '../worldData.ts'
import { WATER_POLYGONS } from './stage2Data.ts'
import { PolygonSurface } from './Stage2Meshes.tsx'
import { createCoastSkirtGeometry, createContinuousMainlandGeometry } from './terrainGeometry.ts'

export function TerrainAndWater({ materials }: { materials: Stage2Materials }) {
  const terrainGeometry = useMemo(() => createContinuousMainlandGeometry(), [])
  const coastGeometry = useMemo(() => createCoastSkirtGeometry(-3), [])
  const oceanWidth = MAP_BOUNDS.xMax - MAP_BOUNDS.xMin
  const oceanDepth = MAP_BOUNDS.zMax - MAP_BOUNDS.zMin

  useEffect(
    () => () => {
      coastGeometry.dispose()
      terrainGeometry.dispose()
    },
    [coastGeometry, terrainGeometry],
  )

  return (
    <group name="stage2-terrain-and-water">
      <mesh material={materials.ocean} position={[0, -0.12, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[oceanWidth, oceanDepth, 1, 1]} />
      </mesh>
      <mesh castShadow geometry={terrainGeometry} material={materials.terrain} name="continuous-mainland-terrain" receiveShadow />
      <mesh geometry={coastGeometry} material={materials.coastRock} name="exact-mainland-coastline" receiveShadow />

      <PolygonSurface material={materials.harborWater} name="harbor-basin-water" points={WATER_POLYGONS.harborBasin} receiveShadow={false} y={0.16} />
      <PolygonSurface material={materials.ocean} name="harbor-navigation-channel" points={WATER_POLYGONS.harborChannel} receiveShadow={false} y={0.21} />
      <PolygonSurface material={materials.ocean} name="harbor-deep-water" points={WATER_POLYGONS.harborDeep} receiveShadow={false} y={0.2} />
      <PolygonSurface material={materials.shallowWater} name="harbor-shallow-north" points={WATER_POLYGONS.harborShallowNorth} receiveShadow={false} y={0.24} />
      <PolygonSurface material={materials.shallowWater} name="harbor-shallow-south" points={WATER_POLYGONS.harborShallowSouth} receiveShadow={false} y={0.24} />
      <PolygonSurface material={materials.intertidalWater} name="beach-intertidal" points={WATER_POLYGONS.beachIntertidal} receiveShadow={false} y={0.2} />
      <PolygonSurface material={materials.shallowWater} name="beach-shallows" points={WATER_POLYGONS.beachShallows} receiveShadow={false} y={0.12} />
      <PolygonSurface material={materials.ocean} name="beach-deep-transition" points={WATER_POLYGONS.beachDeepTransition} receiveShadow={false} y={0.06} />
    </group>
  )
}
