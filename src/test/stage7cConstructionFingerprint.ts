import type { BufferGeometry } from 'three'

import { createHash } from 'node:crypto'

import type { XZPoint } from '../scene/world/worldData'

import { createLandingRegionalLayout, createLandingServiceLayout, createLandingSurfaceHistory, createLandingFoamLayout } from '../scene/world/landing/landingReservations'
import { LANDING_SITES } from '../scene/world/landing/landingSiteData'
import { indexSurface, type SurfaceIndex } from '../scene/world/landing/landingSupportIndex'
import { applyLandingSurface, createLandingCoastGeometry, createLandingMainlandGeometry } from '../scene/world/landing/landingTerrain'
import { getLandscapeMovementReservations, createExistingLandscapeEnvelopes } from '../scene/world/landscape/landscapeReservations'
import { addRoadShoulder } from '../scene/world/landscape/roadShoulder'
import { createTreeLayout } from '../scene/world/landscape/treeLayout'
import { AMMUNITION_GATE_SPURS, BEACH_FEATURES, ROAD_DEFINITIONS, TERRAIN_STAGE2_POLYGONS } from '../scene/world/stage2/stage2Data'
import { createContinuousMainlandGeometry, createTerrainRoadGeometry, createTerrainSurfaceGeometry } from '../scene/world/stage2/terrainGeometry'
import { sampleTerrainPolyline } from '../scene/world/stage2/terrainModel'

const sha = (data: string | Uint8Array) => createHash('sha256').update(data).digest('hex')
function bytes(array: ArrayBufferView) {
  return sha(new Uint8Array(array.buffer, array.byteOffset, array.byteLength))
}
export function fingerprintGeometry(g: BufferGeometry) {
  return {
    attributes: Object.fromEntries(Object.entries(g.attributes).map(([name, a]) => [name, { type: a.array.constructor.name, itemSize: a.itemSize, count: a.count, normalized: a.normalized, usage: 'usage' in a ? a.usage : a.data.usage, bytes: a.array.byteLength, sha256: bytes(a.array) }])),
    index: g.index ? { type: g.index.array.constructor.name, count: g.index.count, bytes: g.index.array.byteLength, sha256: bytes(g.index.array) } : null,
    groups: g.groups,
    drawRange: { start: g.drawRange.start, count: String(g.drawRange.count) },
    boundingBox: g.boundingBox ? { min: g.boundingBox.min.toArray(), max: g.boundingBox.max.toArray() } : null,
    boundingSphere: g.boundingSphere ? { center: g.boundingSphere.center.toArray(), radius: g.boundingSphere.radius } : null,
  }
}
function surface(s: SurfaceIndex) {
  const cell = (c: SurfaceIndex['cells']) => ({ minX: c.minX, minZ: c.minZ, width: c.width, height: c.height, offsets: { bytes: c.offsets.byteLength, sha256: bytes(c.offsets) }, triangles: { bytes: c.triangles.byteLength, sha256: bytes(c.triangles) } })
  return { constants: { bytes: s.constants.byteLength, sha256: bytes(s.constants) }, cells: cell(s.cells), exteriorCells: s.exteriorCells ? cell(s.exteriorCells) : null }
}
export function captureConstruction() {
  const geometries: Record<string, ReturnType<typeof fingerprintGeometry>> = {},
    indexes: Record<string, ReturnType<typeof surface>> = {}
  const add = (id: string, g: BufferGeometry, indexed?: boolean) => {
    geometries[id] = fingerprintGeometry(g)
    if (indexed !== undefined) indexes[id] = surface(indexSurface(g, indexed))
    g.dispose()
  }
  add('base-mainland', createContinuousMainlandGeometry())
  add('landing-mainland', createLandingMainlandGeometry(), true)
  add('coast-minus3', createLandingCoastGeometry(-3))
  add('coast-minus6', createLandingCoastGeometry(-6))
  for (const road of ROAD_DEFINITIONS) {
    const points = sampleTerrainPolyline(road.points, 65, 0.3).map(([x, , z]): XZPoint => [x, z])
    const g = applyLandingSurface(createTerrainRoadGeometry(points, road.widthM, 0.48), 0.48, road.id)
    if (LANDING_SITES.some((s) => s.roadId === road.id)) indexes[road.id] = surface(indexSurface(g, false))
    add(road.id, addRoadShoulder(g, points, road.widthM))
  }
  for (const [i, points] of AMMUNITION_GATE_SPURS.entries()) {
    const sampled = sampleTerrainPolyline(points, 35, 0.3).map(([x, , z]): XZPoint => [x, z])
    add('spur-' + i, addRoadShoulder(applyLandingSurface(createTerrainRoadGeometry(sampled, 7, 0.48), 0.48), sampled, 7))
  }
  add('landing-apron', applyLandingSurface(createTerrainSurfaceGeometry(BEACH_FEATURES.exitApron, 0.38), 0.38), false)
  for (const [id, points] of Object.entries(TERRAIN_STAGE2_POLYGONS)) add('surface-' + id, applyLandingSurface(createTerrainSurfaceGeometry(points, 0.3), 0.3))
  const layouts = {
    movement: getLandscapeMovementReservations(),
    envelopes: createExistingLandscapeEnvelopes(),
    regional: createLandingRegionalLayout(),
    service: createLandingServiceLayout(),
    history: createLandingSurfaceHistory(),
    foam: createLandingFoamLayout(),
    trees: createTreeLayout(),
    customTrees: createTreeLayout('stage7c:other-seed'),
  }
  return { reference: '9c0208bc65ed402fec44c8935d4708505c566f46', geometries, indexes, layouts: Object.fromEntries(Object.entries(layouts).map(([key, value]) => [key, { sha256: sha(JSON.stringify(value)), length: Array.isArray(value) ? value.length : Object.values(value).reduce((n, rows) => n + rows.length, 0) }])) }
}
