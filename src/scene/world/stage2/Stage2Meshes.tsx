import type { BufferGeometry, Material } from 'three'

import { useEffect, useMemo } from 'react'

import type { WorldPosition, XZPoint } from '../worldData.ts'

import { createPolygonPrismGeometry, createPolygonSurfaceGeometry, createRoadRibbonGeometry } from '../worldGeometry.ts'
import { createTerrainSurfaceGeometry } from './terrainGeometry.ts'
import { sampleTerrainPolyline } from './terrainModel.ts'

function useGeometryDisposal(geometry: BufferGeometry) {
  useEffect(() => () => geometry.dispose(), [geometry])
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
  const geometry = useMemo(() => createTerrainSurfaceGeometry(points, yOffset), [points, yOffset])
  useGeometryDisposal(geometry)
  return <mesh frustumCulled geometry={geometry} material={material} name={name} receiveShadow={receiveShadow} />
}

export function RoadRibbon({ material, name, points, widthM }: { material: Material; name?: string; points: readonly WorldPosition[]; widthM: number }) {
  const geometry = useMemo(() => createRoadRibbonGeometry(points, widthM), [points, widthM])
  useGeometryDisposal(geometry)
  return <mesh frustumCulled geometry={geometry} material={material} name={name} receiveShadow />
}

export function TerrainRoad({ material, name, points, spacingM = 75, widthM, yOffset = 1.5 }: { material: Material; name?: string; points: readonly XZPoint[]; spacingM?: number; widthM: number; yOffset?: number }) {
  const terrainPoints = useMemo(() => sampleTerrainPolyline(points, spacingM, yOffset), [points, spacingM, yOffset])
  return <RoadRibbon material={material} name={name} points={terrainPoints} widthM={widthM} />
}
