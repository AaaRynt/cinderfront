import { Color, MathUtils } from 'three'

import type { WorldPosition, XZPoint } from '../worldData.ts'

import { AAA_SITE, COMMUNICATIONS_MAST_SITE, MAINLAND_POLYGON_XZ, RADAR_PAD_POLYGONS, RADAR_SEARCH_SITE, RADAR_SUPPORT_BUILDINGS, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../worldData.ts'
import { BEACH_FEATURES, CORRIDOR_FEATURES, RADAR_TERRAIN_POLYGONS, ROAD_DEFINITIONS, TERRAIN_STAGE2_POLYGONS } from './stage2Data.ts'

const TERRAIN_COLORS = {
  beach: new Color('#9b865c'),
  drySoil: new Color('#776d58'),
  harbor: new Color('#62645a'),
  industrial: new Color('#706b5b'),
  ridge: new Color('#8a7657'),
  rock: new Color('#776a50'),
  wash: new Color('#887a60'),
} as const

function smoothstep(edge0: number, edge1: number, value: number) {
  const progress = MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return progress * progress * (3 - 2 * progress)
}

function hashNoise(x: number, z: number) {
  return Math.sin(x * 0.013 + z * 0.007 + 2.3) * 0.5 + Math.sin(x * 0.031 - z * 0.017 + 0.8) * 0.3 + Math.cos(x * 0.007 - z * 0.023 + 1.7) * 0.2
}

export function pointInPolygon(x: number, z: number, polygon: readonly XZPoint[]) {
  let inside = false
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index]!
    const previous = polygon[previousIndex]!
    const intersects = current[1] > z !== previous[1] > z && x < ((previous[0] - current[0]) * (z - current[1])) / (previous[1] - current[1]) + current[0]
    if (intersects) inside = !inside
  }
  return inside
}

function pointSegmentDistance(x: number, z: number, start: XZPoint, end: XZPoint) {
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  const lengthSquared = dx * dx + dz * dz
  if (lengthSquared === 0) return Math.hypot(x - start[0], z - start[1])
  const progress = MathUtils.clamp(((x - start[0]) * dx + (z - start[1]) * dz) / lengthSquared, 0, 1)
  return Math.hypot(x - (start[0] + dx * progress), z - (start[1] + dz * progress))
}

export function distanceToPolyline(x: number, z: number, points: readonly XZPoint[]) {
  let distance = Number.POSITIVE_INFINITY
  for (let index = 1; index < points.length; index += 1) {
    distance = Math.min(distance, pointSegmentDistance(x, z, points[index - 1]!, points[index]!))
  }
  return distance
}

function distanceToPolygonEdge(x: number, z: number, polygon: readonly XZPoint[]) {
  let distance = Number.POSITIVE_INFINITY
  for (let index = 0; index < polygon.length; index += 1) {
    distance = Math.min(distance, pointSegmentDistance(x, z, polygon[index]!, polygon[(index + 1) % polygon.length]!))
  }
  return distance
}

function polygonInfluence(x: number, z: number, polygon: readonly XZPoint[], featherM: number) {
  if (!pointInPolygon(x, z, polygon)) return 0
  return smoothstep(0, featherM, distanceToPolygonEdge(x, z, polygon))
}

function blendPolygonHeight(current: number, x: number, z: number, polygon: readonly XZPoint[], featherM: number, target: number) {
  return MathUtils.lerp(current, target, polygonInfluence(x, z, polygon, featherM))
}

function flattenCircle(current: number, x: number, z: number, centerX: number, centerZ: number, radiusM: number, target: number) {
  const distance = Math.hypot(x - centerX, z - centerZ)
  const influence = 1 - smoothstep(radiusM * 0.72, radiusM * 1.32, distance)
  return MathUtils.lerp(current, target, influence)
}

/**
 * Deterministic continuous mainland height in authoritative world meters.
 * Broad landforms feather into one another; exact Stage 1 installation sites
 * are locally flattened so authored platforms retain their original heights.
 */
function getAnalyticTerrainHeight(x: number, z: number) {
  const broadNoise = hashNoise(x * 0.16, z * 0.16) * 1.35 + hashNoise(x * 0.035, z * 0.035) * 2.1
  let height = 5.5 + broadNoise

  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.harborLowland, 460, 8 + broadNoise * 0.28)
  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.industrialPlateau, 520, 31 + broadNoise * 0.55)
  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.easternPlain, 650, 38 + broadNoise * 0.9)
  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.beachDunes, 340, 10 + broadNoise * 0.7)
  height = blendPolygonHeight(height, x, z, BEACH_FEATURES.landingStrand, 170, 4.2 + broadNoise * 0.22)

  height = blendPolygonHeight(height, x, z, RADAR_TERRAIN_POLYGONS.ridge, 470, 88 + broadNoise * 1.1)
  height = blendPolygonHeight(height, x, z, RADAR_TERRAIN_POLYGONS.lower, 330, 122 + broadNoise * 0.9)
  height = blendPolygonHeight(height, x, z, RADAR_TERRAIN_POLYGONS.middle, 280, 169 + broadNoise * 0.75)
  height = blendPolygonHeight(height, x, z, RADAR_TERRAIN_POLYGONS.upper, 220, 194 + broadNoise * 0.5)
  height = blendPolygonHeight(height, x, z, RADAR_TERRAIN_POLYGONS.summit, 150, 216 + broadNoise * 0.3)

  height = flattenCircle(height, x, z, 2450, 3650, 360, 108)
  height = flattenCircle(height, x, z, 3300, 4480, 300, 184)
  height = flattenCircle(height, x, z, 3700, 4180, 280, 220)
  height = flattenCircle(height, x, z, 4325, 4000, 280, 195)
  height = flattenCircle(height, x, z, 4050, 2850, 300, 126)
  height = flattenCircle(height, x, z, 5050, 3200, 320, 96)

  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorBluffWest, 100, 48 + broadNoise * 0.6)
  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorBluffCenter, 100, 44 + broadNoise * 0.6)
  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorBluffEast, 90, 40 + broadNoise * 0.5)
  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorPassWest, 80, 19 + broadNoise * 0.35)
  height = blendPolygonHeight(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorPassEast, 80, 18 + broadNoise * 0.35)

  const washDistance = distanceToPolyline(x, z, CORRIDOR_FEATURES.dryWash)
  height -= (1 - smoothstep(28, 165, washDistance)) * 4.5

  height = flattenCircle(height, x, z, RADAR_SEARCH_SITE.position[0], RADAR_SEARCH_SITE.position[2], RADAR_SEARCH_SITE.radiusM, 209.35)
  height = flattenCircle(height, x, z, RADAR_TRACKING_SITE.position[0], RADAR_TRACKING_SITE.position[2], RADAR_TRACKING_SITE.radiusM, 194.35)
  for (const site of SAM_PAD_POSITIONS) {
    height = flattenCircle(height, x, z, site.position[0], site.position[2], site.radiusM, site.terrainY - 0.35)
  }
  height = flattenCircle(height, x, z, AAA_SITE.position[0], AAA_SITE.position[2], AAA_SITE.radiusM, AAA_SITE.terrainY - 0.35)
  height = flattenCircle(height, x, z, COMMUNICATIONS_MAST_SITE.position[0], COMMUNICATIONS_MAST_SITE.position[2], 55, COMMUNICATIONS_MAST_SITE.position[1])
  for (const building of RADAR_SUPPORT_BUILDINGS) {
    height = flattenCircle(height, x, z, building.centerXZ[0], building.centerXZ[1], 105, building.terrainY)
  }

  return Math.max(2, height)
}

const TERRAIN_GRID_SPACING_METERS = 75
const RADAR_HEIGHT_CONTROLS: readonly XZPoint[] = [
  [2450, 3650],
  [3300, 4480],
  [3700, 4180],
  [4325, 4000],
  [4050, 2850],
  [5050, 3200],
]

function terrainGridConstraintPoints() {
  const points: XZPoint[] = [...MAINLAND_POLYGON_XZ, ...RADAR_HEIGHT_CONTROLS]
  for (const polygon of Object.values(RADAR_PAD_POLYGONS)) points.push(...polygon)
  for (const polygon of Object.values(RADAR_TERRAIN_POLYGONS)) points.push(...polygon)
  for (const building of RADAR_SUPPORT_BUILDINGS) points.push(building.centerXZ)
  for (const road of ROAD_DEFINITIONS) points.push(...road.points)
  points.push(...CORRIDOR_FEATURES.dryWash, ...BEACH_FEATURES.exitApron, ...BEACH_FEATURES.inlandHardstand, [COMMUNICATIONS_MAST_SITE.position[0], COMMUNICATIONS_MAST_SITE.position[2]])
  const sites = [RADAR_SEARCH_SITE, RADAR_TRACKING_SITE, ...SAM_PAD_POSITIONS, AAA_SITE]
  for (const site of sites) {
    const x = site.position[0]
    const z = site.position[2]
    points.push([x, z], [x - site.radiusM, z], [x + site.radiusM, z], [x, z - site.radiusM], [x, z + site.radiusM])
  }
  return points
}

function createTerrainAxisValues(axis: 0 | 1) {
  const mainlandValues = MAINLAND_POLYGON_XZ.map((point) => point[axis])
  const minimum = Math.min(...mainlandValues)
  const maximum = Math.max(...mainlandValues)
  const values = [minimum, maximum, ...terrainGridConstraintPoints().map((point) => point[axis])]
  for (let value = minimum + TERRAIN_GRID_SPACING_METERS; value < maximum; value += TERRAIN_GRID_SPACING_METERS) values.push(value)
  values.sort((first, second) => first - second)
  return values.filter((value, index) => index === 0 || value - values[index - 1]! > 1e-4)
}

export const TERRAIN_GRID_X_VALUES = createTerrainAxisValues(0)
export const TERRAIN_GRID_Z_VALUES = createTerrainAxisValues(1)

function enclosingAxisInterval(values: readonly number[], coordinate: number) {
  if (coordinate <= values[0]!) return 0
  if (coordinate >= values[values.length - 1]!) return values.length - 2
  let low = 0
  let high = values.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (values[middle]! <= coordinate) low = middle
    else high = middle
  }
  return low
}

/** Height of the actual triangulated Stage 2 terrain, not a finer hidden sampler. */
export function getTerrainHeight(x: number, z: number) {
  const xIndex = enclosingAxisInterval(TERRAIN_GRID_X_VALUES, x)
  const zIndex = enclosingAxisInterval(TERRAIN_GRID_Z_VALUES, z)
  const x0 = TERRAIN_GRID_X_VALUES[xIndex]!
  const x1 = TERRAIN_GRID_X_VALUES[xIndex + 1]!
  const z0 = TERRAIN_GRID_Z_VALUES[zIndex]!
  const z1 = TERRAIN_GRID_Z_VALUES[zIndex + 1]!
  const xMix = MathUtils.clamp((x - x0) / (x1 - x0), 0, 1)
  const zMix = MathUtils.clamp((z - z0) / (z1 - z0), 0, 1)
  const height00 = getAnalyticTerrainHeight(x0, z0)
  const height10 = getAnalyticTerrainHeight(x1, z0)
  const height11 = getAnalyticTerrainHeight(x1, z1)
  const height01 = getAnalyticTerrainHeight(x0, z1)

  if (xMix >= zMix) {
    return height00 * (1 - xMix) + height10 * (xMix - zMix) + height11 * zMix
  }
  return height00 * (1 - zMix) + height11 * xMix + height01 * (zMix - xMix)
}

export function getTerrainColor(x: number, z: number, height: number, target = new Color()) {
  target.copy(TERRAIN_COLORS.drySoil)
  const harbor = polygonInfluence(x, z, TERRAIN_STAGE2_POLYGONS.harborLowland, 320)
  const industrial = polygonInfluence(x, z, TERRAIN_STAGE2_POLYGONS.industrialPlateau, 420)
  const beach = polygonInfluence(x, z, TERRAIN_STAGE2_POLYGONS.beachDunes, 260)
  const ridge = MathUtils.clamp((height - 60) / 150, 0, 1)
  const wash = 1 - smoothstep(35, 145, distanceToPolyline(x, z, CORRIDOR_FEATURES.dryWash))

  target.lerp(TERRAIN_COLORS.harbor, harbor * 0.68)
  target.lerp(TERRAIN_COLORS.industrial, industrial * 0.58)
  target.lerp(TERRAIN_COLORS.beach, beach * 0.82)
  target.lerp(TERRAIN_COLORS.ridge, ridge * 0.72)
  target.lerp(TERRAIN_COLORS.rock, ridge * Math.max(0, hashNoise(x * 0.31, z * 0.31)) * 0.24)
  target.lerp(TERRAIN_COLORS.wash, wash * 0.5)
  return target
}

export function sampleTerrainPolyline(points: readonly XZPoint[], spacingM = 90, yOffset = 0): WorldPosition[] {
  const sampled: WorldPosition[] = []
  points.forEach((point, index) => {
    if (index === 0) {
      sampled.push([point[0], getTerrainHeight(point[0], point[1]) + yOffset, point[1]])
      return
    }
    const previous = points[index - 1]!
    const segmentLength = Math.hypot(point[0] - previous[0], point[1] - previous[1])
    const steps = Math.max(1, Math.ceil(segmentLength / spacingM))
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps
      const x = MathUtils.lerp(previous[0], point[0], progress)
      const z = MathUtils.lerp(previous[1], point[1], progress)
      sampled.push([x, getTerrainHeight(x, z) + yOffset, z])
    }
  })
  return sampled
}
