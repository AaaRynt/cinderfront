import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'

import type { XZPoint } from '../worldData'

import { finishConstruction, runConstruction, type Construction, type ConstructionOptions } from '../../../initialization/cooperative'
import { assertPreparedTerrain, publishPreparedTerrain } from '../../../initialization/terrainGate'
import { BEACH_FEATURES, ROAD_DEFINITIONS } from '../stage2/stage2Data'
import { createCoastSkirtGeometry, createContinuousMainlandGeometry, createContinuousMainlandGeometryWork, createTerrainRoadGeometry, createTerrainRoadGeometryWork, createTerrainSurfaceGeometry, createTerrainSurfaceGeometryWork } from '../stage2/terrainGeometry'
import { getTerrainHeight, pointInPolygon, sampleTerrainPolyline } from '../stage2/terrainModel'
import { MAINLAND_POLYGON_XZ } from '../worldData'
import { LANDING_COAST_POINTS, LANDING_GRADE_GRID_METERS, LANDING_SEA_LEVEL, LANDING_SITES, inLandingGrade, type LandingSite } from './landingSiteData'
import { indexSurface, indexSurfaceWork, sampleSurface, type SurfaceIndex } from './landingSupportIndex'

type Vertex = Record<string, number[]>
type Triangle = readonly [Vertex, Vertex, Vertex]
const smooth = (a: number, b: number, v: number) => {
  const u = Math.max(0, Math.min(1, (v - a) / (b - a)))
  return u * u * (3 - 2 * u)
}
export function landingCoastZ(x: number) {
  const coast = LANDING_COAST_POINTS
  for (let i = 1; i < coast.length; i++) {
    const a = coast[i - 1]!,
      b = coast[i]!
    if (x >= a[0] && x <= b[0]) return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0])
  }
  throw new Error(`Landing sample outside the authored beach coast: ${x}`)
}
export function analyticalLandingGrade(x: number, z: number) {
  const original = getTerrainHeight(x, z)
  const site = LANDING_SITES.find(({ bounds: [a, b, c, d] }) => x >= a && x <= b && z >= c && z <= d)
  if (!site) return original
  const [a, b, c, d] = site.bounds
  const feather = smooth(0, site.featherMeters, Math.min(x - a, b - x, z - c, d - z))
  const distance = Math.max(0, z - landingCoastZ(x))
  const graded = LANDING_SEA_LEVEL + (original - LANDING_SEA_LEVEL) * smooth(0, site.riseMeters, distance)
  return original + (graded - original) * feather
}
function mix(a: Vertex, b: Vertex, t: number): Vertex {
  return Object.fromEntries(Object.keys(a).map((k) => [k, a[k]!.map((v, i) => v + (b[k]![i]! - v) * t)]))
}
function clip(polygon: readonly Vertex[], axis: 0 | 2, limit: number, greater: boolean) {
  const result: Vertex[] = []
  if (!polygon.length) return result
  let a = polygon.at(-1)!,
    insideA = greater ? a.position![axis]! >= limit : a.position![axis]! <= limit
  for (const b of polygon) {
    const insideB = greater ? b.position![axis]! >= limit : b.position![axis]! <= limit
    if (insideA !== insideB) result.push(mix(a, b, (limit - a.position![axis]!) / (b.position![axis]! - a.position![axis]!)))
    if (insideB) result.push(b)
    a = b
    insideA = insideB
  }
  return result
}
function triangles(polygon: readonly Vertex[]): Triangle[] {
  const output: Triangle[] = []
  for (let i = 1; i < polygon.length - 1; i++) {
    const [a, b, c] = [polygon[0]!, polygon[i]!, polygon[i + 1]!]
    const pa = a.position!,
      pb = b.position!,
      pc = c.position!
    if (Math.abs((pb[0]! - pa[0]!) * (pc[2]! - pa[2]!) - (pb[2]! - pa[2]!) * (pc[0]! - pa[0]!)) > 1e-7) output.push([a, b, c])
  }
  return output
}
function* sourceTrianglesWork(geometry: BufferGeometry): Construction<Triangle[]> {
  const names = Object.keys(geometry.attributes),
    count = geometry.index?.count ?? geometry.getAttribute('position').count
  const output: Triangle[] = []
  for (let i = 0; i < count; i += 3) {
    if (i % 384 === 0) yield
    const tri: Vertex[] = []
    for (let j = 0; j < 3; j++) {
      const index = geometry.index?.getX(i + j) ?? i + j
      tri.push(
        Object.fromEntries(
          names.map((n) => {
            const attribute = geometry.getAttribute(n)
            return [n, Array.from({ length: attribute.itemSize }, (_, k) => attribute.array[index * attribute.itemSize + k] as number)]
          }),
        ),
      )
    }
    output.push(tri as unknown as Triangle)
  }
  return output
}
function* emitWork(geometry: BufferGeometry, faces: readonly Triangle[]): Construction<BufferGeometry> {
  const names = Object.keys(geometry.attributes),
    out = new BufferGeometry()
  let complete = false
  try {
    for (const name of names) {
      const size = geometry.getAttribute(name).itemSize,
        values: number[] = []
      for (let i = 0; i < faces.length; i++) {
        if (i % 128 === 0) yield
        for (const vertex of faces[i]!) for (const value of vertex[name]!) values.push(value)
      }
      out.setAttribute(name, new Float32BufferAttribute(values, size))
    }
    out.computeBoundingBox()
    out.computeBoundingSphere()
    complete = true
    return out
  } finally {
    if (!complete) out.dispose()
  }
}
/** Split only intersecting source triangles; all untouched attributes remain exact. */
function* refineWork(geometry: BufferGeometry, height: (x: number, z: number) => number): Construction<BufferGeometry> {
  let faces = yield* sourceTrianglesWork(geometry)
  let visited = 0
  for (const site of LANDING_SITES) {
    const [a, b, c, d] = site.bounds,
      newFaces: Triangle[] = []
    for (const tri of faces) {
      if (++visited % 128 === 0) yield
      const p = tri.map((v) => v.position!)
      if (Math.max(...p.map((v) => v[0]!)) <= a || Math.min(...p.map((v) => v[0]!)) >= b || Math.max(...p.map((v) => v[2]!)) <= c || Math.min(...p.map((v) => v[2]!)) >= d) {
        newFaces.push(tri)
        continue
      }
      let inside: Vertex[] = [...tri]
      for (const [axis, limit, greater] of [
        [0, a, true],
        [0, b, false],
        [2, c, true],
        [2, d, false],
      ] as const) {
        newFaces.push(...triangles(clip(inside, axis, limit, !greater)))
        inside = clip(inside, axis, limit, greater)
      }
      if (inside.length < 3) continue
      const xs = inside.map((v) => v.position![0]!),
        zs = inside.map((v) => v.position![2]!),
        step = LANDING_GRADE_GRID_METERS
      for (let x = Math.max(a, Math.floor(Math.min(...xs) / step) * step); x < Math.min(b, Math.max(...xs)); x += step)
        for (let z = Math.max(c, Math.floor(Math.min(...zs) / step) * step); z < Math.min(d, Math.max(...zs)); z += step) {
          if (++visited % 32 === 0) yield
          let cell = clip(clip(clip(clip(inside, 0, x, true), 0, x + step, false), 2, z, true), 2, z + step, false)
          if (cell.length < 3) continue
          // Keep source-grid boundaries while refining locally. The sampler below
          // uses these exact uploaded triangles, including clipped shoreline cells.
          cell = cell.map((v) => {
            const vertex = mix(v, v, 0)
            vertex.position![0] = Math.fround(vertex.position![0]!)
            vertex.position![2] = Math.fround(vertex.position![2]!)
            vertex.position![1] = height(vertex.position![0]!, vertex.position![2]!)
            return vertex
          })
          for (const face of triangles(cell)) {
            const pa = new Vector3(...(face[0].position as [number, number, number])),
              pb = new Vector3(...(face[1].position as [number, number, number])),
              pc = new Vector3(...(face[2].position as [number, number, number]))
            const normal = pb.sub(pa).cross(pc.sub(pa)).normalize().toArray()
            if (face[0].normal) for (const vertex of face) vertex.normal = [...normal]
            newFaces.push(face)
          }
        }
    }
    faces = newFaces
  }
  return yield* emitWork(geometry, faces)
}
let mainland: SurfaceIndex | undefined
function mainlandSurface() {
  assertPreparedTerrain()
  if (!mainland) {
    const base = createContinuousMainlandGeometry(),
      graded = finishConstruction(refineWork(base, analyticalLandingGrade))
    base.dispose()
    mainland = indexSurface(graded)
  }
  return mainland
}
export function createLandingMainlandGeometry() {
  return mainlandSurface().geometry.clone()
}
/** Historical sampler remains unchanged; this is the actual approved local mesh. */
export function getLandingGroundHeight(x: number, z: number) {
  assertPreparedTerrain()
  if (!inLandingGrade(x, z)) return getTerrainHeight(x, z)
  if (!pointInPolygon(x, z, MAINLAND_POLYGON_XZ) && Math.abs(z - landingCoastZ(x)) > 0.0005) return LANDING_SEA_LEVEL
  return sampleSurface(mainlandSurface(), x, z) ?? getTerrainHeight(x, z)
}
export function landingRoadClearance(x: number, z: number, site: LandingSite) {
  if (!inLandingGrade(x, z)) return 0.48
  const [dx, dz] = [site.roadNext[0] - site.beach[0], site.roadNext[1] - site.beach[1]],
    length = Math.hypot(dx, dz)
  const station = ((x - site.beach[0]) * dx + (z - site.beach[1]) * dz) / length
  return 0.48 * smooth(0, 20, station)
}
function* applyLandingSurfaceWork(geometry: BufferGeometry, clearance: number, roadId: string | undefined, ground: (x: number, z: number) => number): Construction<BufferGeometry> {
  const box = geometry.boundingBox ?? (geometry.computeBoundingBox(), geometry.boundingBox!)
  if (!LANDING_SITES.some(({ bounds: [a, b, c, d] }) => box.max.x > a && box.min.x < b && box.max.z > c && box.min.z < d)) return geometry
  const site = LANDING_SITES.find((s) => s.roadId === roadId)
  return yield* refineWork(geometry, (x, z) => ground(x, z) + (site ? landingRoadClearance(x, z, site) : clearance))
}
export function applyLandingSurface(geometry: BufferGeometry, clearance: number, roadId?: string) {
  assertPreparedTerrain()
  const graded = finishConstruction(applyLandingSurfaceWork(geometry, clearance, roadId, getLandingGroundHeight))
  if (graded !== geometry) geometry.dispose()
  return graded
}
export function* applyPreparedLandingSurfaceWork(geometry: BufferGeometry, clearance: number, roadId?: string): Construction<BufferGeometry> {
  assertPreparedTerrain()
  return yield* applyLandingSurfaceWork(geometry, clearance, roadId, getLandingGroundHeight)
}
let supports: readonly SurfaceIndex[] | undefined
function supportSurfaces() {
  assertPreparedTerrain()
  if (!supports) {
    supports = LANDING_SITES.map((site) => {
      const road = ROAD_DEFINITIONS.find((r) => r.id === site.roadId)!,
        points = sampleTerrainPolyline(road.points, 65, 0.3).map(([x, , z]): XZPoint => [x, z])
      return indexSurface(applyLandingSurface(createTerrainRoadGeometry(points, road.widthM, 0.48), 0.48, site.roadId), false)
    })
    const apron = indexSurface(applyLandingSurface(createTerrainSurfaceGeometry(BEACH_FEATURES.exitApron, 0.38), 0.38), false)
    supports = [...supports, apron]
  }
  return supports
}
/** Finite immutable index ownership; inspection never initializes new surfaces. */
export function getLandingSupportIndexBounds() {
  return [mainland, ...(supports ?? [])]
    .filter((surface): surface is SurfaceIndex => !!surface)
    .map((surface) => ({
      triangles: surface.constants.length / 10,
      constantBytes: surface.constants.byteLength,
      cellBytes: surface.cells.offsets.byteLength + surface.cells.triangles.byteLength + (surface.exteriorCells ? surface.exteriorCells.offsets.byteLength + surface.exteriorCells.triangles.byteLength : 0),
    }))
}

export function getLandingSupportHeight(x: number, z: number) {
  assertPreparedTerrain()
  if (!pointInPolygon(x, z, MAINLAND_POLYGON_XZ)) return LANDING_SEA_LEVEL
  const ground = inLandingGrade(x, z) ? getLandingGroundHeight(x, z) : getTerrainHeight(x, z)
  let height = ground
  for (const surface of supportSurfaces()) height = Math.max(height, sampleSurface(surface, x, z) ?? ground)
  return height
}
function* createLandingCoastWork(bottomY: number, graded: SurfaceIndex): Construction<BufferGeometry> {
  const base = createCoastSkirtGeometry(bottomY)
  try {
    const old = yield* sourceTrianglesWork(base),
      faces: Triangle[] = []
    const shoreline = [...MAINLAND_POLYGON_XZ.slice(2), MAINLAND_POLYGON_XZ[0]!]
    const vertices = graded.geometry.getAttribute('position')
    for (let i = 1; i < shoreline.length; i++) {
      const a = shoreline[i - 1]!,
        b = shoreline[i]!,
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        lengthSquared = dx * dx + dz * dz
      const fractions = new Map<number, number[] | undefined>([
        [0, undefined],
        [1, undefined],
      ])
      // Only boundary vertices of the locally refined mainland are inserted.
      for (let k = 0; k < vertices.count; k++) {
        if (k % 1024 === 0) yield
        const x = vertices.getX(k),
          z = vertices.getZ(k)
        if (!inLandingGrade(x, z, 0.001)) continue
        const u = ((x - a[0]) * dx + (z - a[1]) * dz) / lengthSquared
        if (u <= 0 || u >= 1) continue
        if (Math.abs((x - a[0]) * dz - (z - a[1]) * dx) / Math.sqrt(lengthSquared) < 0.001) fractions.set(Math.round(u * 1e9) / 1e9, [x, vertices.getY(k), z])
      }
      const first = old[(i - 1) * 2]!,
        second = old[(i - 1) * 2 + 1]!
      if (fractions.size === 2) {
        faces.push(first, second)
        continue
      }
      const ordered = [...fractions.keys()].sort((x, y) => x - y)
      const top = (u: number) => mix(first[0], first[2], u)
      const bottom = (u: number) => mix(second[0], second[1], u)
      for (let j = 1; j < ordered.length; j++) {
        const u = ordered[j - 1]!,
          v = ordered[j]!,
          pa = top(u),
          pb = bottom(u),
          pc = top(v),
          pd = bottom(v)
        const inside = inLandingGrade((pa.position![0]! + pc.position![0]!) / 2, (pa.position![2]! + pc.position![2]!) / 2)
        if (inside)
          for (const [vertex, under, uValue] of [
            [pa, pb, u],
            [pc, pd, v],
          ] as const) {
            const boundary = fractions.get(uValue)
            if (boundary) {
              vertex.position = [...boundary]
              under.position = [boundary[0]!, bottomY, boundary[2]!]
            } else {
              const [x, , z] = vertex.position!
              vertex.position![1] = sampleSurface(graded, x!, z!) ?? analyticalLandingGrade(x!, z!)
            }
          }
        for (const face of [
          [pa, pb, pc],
          [pb, pd, pc],
        ] as Triangle[]) {
          if (inside) {
            const p = new Vector3(...(face[0].position as [number, number, number])),
              q = new Vector3(...(face[1].position as [number, number, number])),
              r = new Vector3(...(face[2].position as [number, number, number])),
              normal = q.sub(p).cross(r.sub(p)).normalize().toArray()
            for (const vertex of face) vertex.normal = [...normal]
          }
          faces.push(face)
        }
      }
    }
    return yield* emitWork(base, faces)
  } finally {
    base.dispose()
  }
}

let preparedCoast: BufferGeometry | undefined
let stagingOwners = 0
let stagingGeometries = 0
interface StagedLandingTerrain {
  mainland: SurfaceIndex
  supports: readonly SurfaceIndex[]
  coast: BufferGeometry
  owned: Set<BufferGeometry>
}
function releaseStagedTerrain(staged: StagedLandingTerrain) {
  for (const geometry of staged.owned) geometry.dispose()
  staged.owned.clear()
}
function groundOn(surface: SurfaceIndex, x: number, z: number) {
  if (!inLandingGrade(x, z)) return getTerrainHeight(x, z)
  if (!pointInPolygon(x, z, MAINLAND_POLYGON_XZ) && Math.abs(z - landingCoastZ(x)) > 0.0005) return LANDING_SEA_LEVEL
  return sampleSurface(surface, x, z) ?? getTerrainHeight(x, z)
}
function* landingTerrainWork(): Construction<StagedLandingTerrain> {
  const owned = new Set<BufferGeometry>()
  let complete = false
  stagingOwners++
  const own = (g: BufferGeometry) => {
    if (!owned.has(g)) {
      owned.add(g)
      stagingGeometries++
    }
    return g
  }
  const release = (g: BufferGeometry) => {
    if (owned.delete(g)) {
      stagingGeometries--
      g.dispose()
    }
  }
  try {
    yield { message: 'Preparing terrain' }
    let land = mainland
    if (!land) {
      const base = own(yield* createContinuousMainlandGeometryWork())
      yield { message: 'Shaping shoreline' }
      const graded = own(yield* refineWork(base, analyticalLandingGrade))
      release(base)
      land = yield* indexSurfaceWork(graded)
    }
    yield { message: 'Preparing access roads' }
    let roads = supports
    if (!roads) {
      const built: SurfaceIndex[] = []
      for (const site of LANDING_SITES) {
        const road = ROAD_DEFINITIONS.find((r) => r.id === site.roadId)!
        const points = sampleTerrainPolyline(road.points, 65, 0.3).map(([x, , z]): XZPoint => [x, z])
        const base = own(yield* createTerrainRoadGeometryWork(points, road.widthM, 0.48))
        const graded = own(yield* applyLandingSurfaceWork(base, 0.48, site.roadId, (x, z) => groundOn(land, x, z)))
        if (graded !== base) release(base)
        built.push(yield* indexSurfaceWork(graded, false))
      }
      const base = own(yield* createTerrainSurfaceGeometryWork(BEACH_FEATURES.exitApron, 0.38))
      const graded = own(yield* applyLandingSurfaceWork(base, 0.38, undefined, (x, z) => groundOn(land, x, z)))
      if (graded !== base) release(base)
      built.push(yield* indexSurfaceWork(graded, false))
      roads = built
    }
    yield { message: 'Preparing coastline' }
    const coast = preparedCoast ?? own(yield* createLandingCoastWork(-3, land))
    complete = true
    return { mainland: land, supports: roads, coast, owned }
  } finally {
    stagingOwners--
    stagingGeometries -= owned.size
    if (!complete) for (const g of owned) g.dispose()
  }
}
/** No staging object is reachable by a sampler, scene or layout before commit. */
export async function prepareLandingTerrain(options: ConstructionOptions) {
  if (mainland && supports && preparedCoast) {
    if (options.signal.aborted) throw options.signal.reason
    publishPreparedTerrain()
    return
  }
  const staged = await runConstruction(landingTerrainWork(), { ...options, onDiscard: releaseStagedTerrain })
  let published = false
  try {
    if (options.signal.aborted) throw options.signal.reason
    if ((options.now?.() ?? performance.now()) >= (options.deadline ?? Infinity)) throw new Error('Scene preparation took too long. Try again.')
    if (mainland && supports && preparedCoast) return
    mainland = staged.mainland
    supports = staged.supports
    preparedCoast = staged.coast
    staged.owned.clear()
    publishPreparedTerrain()
    published = true
  } finally {
    if (!published) releaseStagedTerrain(staged)
  }
}
export function getLandingPreparationBounds() {
  const geometryBytes = (g: BufferGeometry) => Object.values(g.attributes).reduce((n, a) => n + a.array.byteLength, 0) + (g.index?.array.byteLength ?? 0)
  return { complete: !!(mainland && supports && preparedCoast), stagingOwners, stagingGeometries, coastBytes: preparedCoast ? geometryBytes(preparedCoast) : 0, geometryBytes: [mainland, ...(supports ?? [])].reduce((n, s) => n + (s ? geometryBytes(s.geometry) : 0), 0) }
}
export function getPreparedTerrainMeshes() {
  return mainland && preparedCoast ? { terrain: mainland.geometry, coast: preparedCoast } : undefined
}
export function createLandingCoastGeometry(bottomY = -3) {
  assertPreparedTerrain()
  if (bottomY === -3 && preparedCoast) return preparedCoast.clone()
  return finishConstruction(createLandingCoastWork(bottomY, mainlandSurface()))
}
