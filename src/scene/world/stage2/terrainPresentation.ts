import type { BufferGeometry } from 'three'

import type { XZPoint } from '../worldData'

import { runConstruction, type Construction, type ConstructionOptions } from '../../../initialization/cooperative'
import { applyPreparedLandingSurfaceWork } from '../landing/landingTerrain'
import { addRoadShoulder } from '../landscape/roadShoulder'
import { createTerrainRoadGeometryWork, createTerrainSurfaceGeometryWork } from './terrainGeometry'
import { sampleTerrainPolyline } from './terrainModel'
import { TERRAIN_ROAD_SPECS, TERRAIN_SURFACE_SPECS } from './terrainPresentationSpecs'

let prepared: { roads: readonly BufferGeometry[]; surfaces: readonly BufferGeometry[] } | undefined
let stagingOwners = 0
function release(result: NonNullable<typeof prepared>) {
  for (const g of [...result.roads, ...result.surfaces]) g.dispose()
}
function* presentationWork(): Construction<NonNullable<typeof prepared>> {
  const roads: BufferGeometry[] = [],
    surfaces: BufferGeometry[] = []
  let complete = false
  stagingOwners++
  try {
    yield { message: 'Preparing ground surfaces' }
    for (const spec of TERRAIN_ROAD_SPECS) {
      const points = sampleTerrainPolyline(spec.points, spec.spacing, spec.offset).map(([x, , z]): XZPoint => [x, z])
      const base = yield* createTerrainRoadGeometryWork(points, spec.width, spec.offset + 0.18)
      let g: BufferGeometry | undefined
      try {
        g = yield* applyPreparedLandingSurfaceWork(base, spec.offset + 0.18, spec.id)
      } finally {
        if (g !== base) base.dispose()
      }
      roads.push(g)
      addRoadShoulder(g, points, spec.width)
      yield
    }
    for (const spec of TERRAIN_SURFACE_SPECS) {
      const base = yield* createTerrainSurfaceGeometryWork(spec.points, spec.offset)
      let g: BufferGeometry | undefined
      try {
        g = yield* applyPreparedLandingSurfaceWork(base, spec.offset)
      } finally {
        if (g !== base) base.dispose()
      }
      surfaces.push(g)
      yield
    }
    complete = true
    return { roads, surfaces }
  } finally {
    stagingOwners--
    if (!complete) release({ roads, surfaces })
  }
}
/** Published geometry is the mounted geometry, never a retained duplicate. */
export async function prepareTerrainPresentation(options: ConstructionOptions) {
  if (prepared) return
  const result = await runConstruction(presentationWork(), { ...options, onDiscard: release })
  if (options.signal.aborted) {
    release(result)
    throw options.signal.reason
  }
  if (prepared) release(result)
  else prepared = result
}
export function preparedTerrainRoad(id: string | undefined, points: readonly XZPoint[], width: number, spacing: number, offset: number) {
  const i = TERRAIN_ROAD_SPECS.findIndex((s) => s.id === id && s.points === points && s.width === width && s.spacing === spacing && s.offset === offset)
  return i < 0 ? undefined : prepared?.roads[i]
}
export function preparedTerrainSurface(points: readonly XZPoint[], offset: number) {
  const i = TERRAIN_SURFACE_SPECS.findIndex((s) => s.points === points && s.offset === offset)
  return i < 0 ? undefined : prepared?.surfaces[i]
}
export function isPreparedTerrainGeometry(g: BufferGeometry) {
  return !!prepared && (prepared.roads.includes(g) || prepared.surfaces.includes(g))
}
export function getTerrainPresentationBounds() {
  const geometries = prepared ? [...prepared.roads, ...prepared.surfaces] : []
  return { stagingOwners, geometries: geometries.length, capacity: TERRAIN_ROAD_SPECS.length + TERRAIN_SURFACE_SPECS.length, bytes: geometries.reduce((n, g) => n + Object.values(g.attributes).reduce((sum, a) => sum + a.array.byteLength, 0) + (g.index?.array.byteLength ?? 0), 0) }
}
