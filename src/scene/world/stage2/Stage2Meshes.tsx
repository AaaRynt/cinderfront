import type { BufferGeometry, Material } from 'three'

import { useEffect, useMemo } from 'react'

import type { WorldPosition, XZPoint } from '../worldData.ts'

import { applyLandingSurface } from '../landing/landingTerrain'
import { addRoadShoulder } from '../landscape/roadShoulder'
import { createPolygonPrismGeometry, createPolygonSurfaceGeometry, createRoadRibbonGeometry } from '../worldGeometry.ts'
import { createTerrainRoadGeometry, createTerrainSurfaceGeometry } from './terrainGeometry.ts'
import { getTerrainHeight, sampleTerrainPolyline } from './terrainModel.ts'
import { isPreparedTerrainGeometry, preparedTerrainRoad, preparedTerrainSurface } from './terrainPresentation'

function useGeometryDisposal(geometry: BufferGeometry) {
  useEffect(
    () => () => {
      if (!isPreparedTerrainGeometry(geometry)) geometry.dispose()
    },
    [geometry],
  )
}

export function PolygonPrism({ bottomY, castShadow = false, material, name, points, receiveShadow = true, topY }: { bottomY: number; castShadow?: boolean; material: Material; name?: string; points: readonly XZPoint[]; receiveShadow?: boolean; topY: number }) {
  const geometry = useMemo(() => createPolygonPrismGeometry(points, bottomY, topY), [bottomY, points, topY])
  useGeometryDisposal(geometry)
  return <mesh castShadow={castShadow} frustumCulled geometry={geometry} material={material} name={name} receiveShadow={receiveShadow} />
}

export function PolygonSurface({ material, name, points, receiveShadow = true, y }: { material: Material; name?: string; points: readonly XZPoint[]; receiveShadow?: boolean; y: number }) {
  const geometry = useMemo(() => createPolygonSurfaceGeometry(points, y), [points, y])
  useGeometryDisposal(geometry)
  return <mesh frustumCulled geometry={geometry} material={material} name={name} receiveShadow={receiveShadow} />
}

export function TerrainPolygonSurface({ material, name, points, receiveShadow = true, yOffset = 0.3 }: { material: Material; name?: string; points: readonly XZPoint[]; receiveShadow?: boolean; yOffset?: number }) {
  const geometry = useMemo(() => preparedTerrainSurface(points, yOffset) ?? applyLandingSurface(createTerrainSurfaceGeometry(points, yOffset), yOffset), [points, yOffset])
  useGeometryDisposal(geometry)
  return <mesh frustumCulled geometry={geometry} material={material} name={name} receiveShadow={receiveShadow} />
}

export function RoadRibbon({ material, name, points, widthM }: { material: Material; name?: string; points: readonly WorldPosition[]; widthM: number }) {
  const geometry = useMemo(() => createRoadRibbonGeometry(points, widthM, getTerrainHeight), [points, widthM])
  useGeometryDisposal(geometry)
  return <mesh frustumCulled geometry={geometry} material={material} name={name} receiveShadow />
}

export function TerrainRoad({ material, name, points, spacingM = 75, widthM, yOffset = 0.3 }: { material: Material; name?: string; points: readonly XZPoint[]; spacingM?: number; widthM: number; yOffset?: number }) {
  const prepared = useMemo(() => preparedTerrainRoad(name, points, widthM, spacingM, yOffset), [name, points, widthM, spacingM, yOffset])
  const terrainPoints = useMemo(() => (prepared ? [] : sampleTerrainPolyline(points, spacingM, yOffset)), [prepared, points, spacingM, yOffset])
  const terrainXZ = useMemo(() => terrainPoints.map(([x, , z]) => [x, z] as XZPoint), [terrainPoints])
  const geometry = useMemo(() => prepared ?? addRoadShoulder(applyLandingSurface(createTerrainRoadGeometry(terrainXZ, widthM, yOffset + 0.18), yOffset + 0.18, name), terrainXZ, widthM), [prepared, terrainXZ, widthM, yOffset, name])
  useGeometryDisposal(geometry)
  return <mesh frustumCulled geometry={geometry} material={material} name={name} receiveShadow />
}
