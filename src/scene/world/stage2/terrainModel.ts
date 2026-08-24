import { Color, MathUtils } from 'three'

import type { WorldPosition, XZPoint } from '../worldData.ts'

import { AAA_SITE, COMMUNICATIONS_MAST_SITE, MAINLAND_POLYGON_XZ, RADAR_PAD_POLYGONS, RADAR_SEARCH_SITE, RADAR_SUPPORT_BUILDINGS, RADAR_SUPPORT_POLYGONS, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../worldData.ts'
import { BEACH_FEATURES, CORRIDOR_FEATURES, FUEL_BUND_CELLS, HARBOR_FEATURES, INDUSTRIAL_FEATURES, RADAR_TERRAIN_POLYGONS, ROAD_DEFINITIONS, TERRAIN_STAGE2_POLYGONS } from './stage2Data.ts'

const TERRAIN_COLORS = {
  beach: new Color('#9b865c'),
  drySoil: new Color('#776d58'),
  harbor: new Color('#62645a'),
  industrial: new Color('#706b5b'),
  ridge: new Color('#8a7657'),
  rock: new Color('#776a50'),
  wash: new Color('#887a60'),
} as const

/**
 * Stage 4A keeps source elevations available in map meters, but gives the
 * broad middle-distance relief a restrained presentation remap. Harbor and
 * shoreline elevations remain literal through 18 m, while all fixed Radar
 * Hill installation elevations remain literal from 120 m upward. The middle
 * band is stretched monotonically, so no terrain ordering is inverted.
 */
export const TERRAIN_PRESENTATION_PROFILE = {
  exaggerationSourceM: 82,
  exaggerationVisualM: 100,
  highGroundAuthorityM: 120,
  lowlandAuthorityM: 18,
} as const

export const FUEL_CONTAINMENT_FLOOR_MAP_HEIGHT_M = 32
const FIREWATER_FOUNDATION_MARGIN_M = 4
const [FIREWATER_TANK_X, FIREWATER_TANK_Z] = INDUSTRIAL_FEATURES.firewaterTank.center
const FIREWATER_FOUNDATION_HALF_EXTENT_M = INDUSTRIAL_FEATURES.firewaterTank.radiusM + FIREWATER_FOUNDATION_MARGIN_M
export const FIREWATER_TANK_FOUNDATION_POINTS = [
  [FIREWATER_TANK_X - FIREWATER_FOUNDATION_HALF_EXTENT_M, FIREWATER_TANK_Z + FIREWATER_FOUNDATION_HALF_EXTENT_M],
  [FIREWATER_TANK_X + FIREWATER_FOUNDATION_HALF_EXTENT_M, FIREWATER_TANK_Z + FIREWATER_FOUNDATION_HALF_EXTENT_M],
  [FIREWATER_TANK_X + FIREWATER_FOUNDATION_HALF_EXTENT_M, FIREWATER_TANK_Z - FIREWATER_FOUNDATION_HALF_EXTENT_M],
  [FIREWATER_TANK_X - FIREWATER_FOUNDATION_HALF_EXTENT_M, FIREWATER_TANK_Z - FIREWATER_FOUNDATION_HALF_EXTENT_M],
] as const satisfies readonly XZPoint[]

export function remapTerrainElevation(mapHeightM: number) {
  const { exaggerationSourceM, exaggerationVisualM, highGroundAuthorityM, lowlandAuthorityM } = TERRAIN_PRESENTATION_PROFILE
  if (mapHeightM <= lowlandAuthorityM || mapHeightM >= highGroundAuthorityM) return mapHeightM
  if (mapHeightM <= exaggerationSourceM) {
    const progress = (mapHeightM - lowlandAuthorityM) / (exaggerationSourceM - lowlandAuthorityM)
    return MathUtils.lerp(lowlandAuthorityM, exaggerationVisualM, progress)
  }
  const progress = (mapHeightM - exaggerationSourceM) / (highGroundAuthorityM - exaggerationSourceM)
  return MathUtils.lerp(exaggerationVisualM, highGroundAuthorityM, progress)
}

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

/**
 * Terrain bands own their complete authored footprint. Their transition is a
 * shoulder outside the polygon, rather than an inward fade which erased the
 * elevation at every mapped boundary.
 */
function terrainBandInfluence(x: number, z: number, polygon: readonly XZPoint[], outsideFeatherM: number) {
  if (pointInPolygon(x, z, polygon)) return 1
  return 1 - smoothstep(0, outsideFeatherM, distanceToPolygonEdge(x, z, polygon))
}

function blendTerrainBand(current: number, x: number, z: number, polygon: readonly XZPoint[], outsideFeatherM: number, target: number) {
  return MathUtils.lerp(current, target, terrainBandInfluence(x, z, polygon, outsideFeatherM))
}

function gradePolygon(current: number, x: number, z: number, polygon: readonly XZPoint[], shoulderM: number, target: number) {
  const influence = pointInPolygon(x, z, polygon) ? 1 : 1 - smoothstep(0, shoulderM, distanceToPolygonEdge(x, z, polygon))
  return MathUtils.lerp(current, target, influence)
}

function gradeCircle(current: number, x: number, z: number, centerX: number, centerZ: number, radiusM: number, shoulderM: number, target: number) {
  const distance = Math.hypot(x - centerX, z - centerZ)
  const influence = 1 - smoothstep(radiusM, radiusM + shoulderM, distance)
  return MathUtils.lerp(current, target, influence)
}

function blendHeightControl(current: number, x: number, z: number, centerX: number, centerZ: number, target: number) {
  const distance = Math.hypot(x - centerX, z - centerZ)
  const influence = 1 - smoothstep(18, 145, distance)
  return MathUtils.lerp(current, target, influence)
}

/**
 * Deterministic continuous mainland height in authoritative world meters.
 * Broad landforms feather into one another outside their exact XZ boundaries.
 * Deterministic sub-grid relief remains visible away from deliberately graded
 * installation footprints.
 */
function getAnalyticTerrainHeight(x: number, z: number) {
  const broadRelief = hashNoise(x * 0.15, z * 0.15) * 1.8 + hashNoise(x * 0.035, z * 0.035) * 2.4
  // Keep the shortest relief wavelength comfortably above the 75 m mesh
  // spacing; near-Nyquist ripples read as artificial washboard terraces under
  // the low dawn sun.
  const microRelief = Math.sin(x * 0.011 + z * 0.009 + 0.4) * 0.64 + Math.sin(x * 0.018 - z * 0.014 + 1.8) * 0.4 + Math.cos(x * 0.027 + z * 0.021 + 2.5) * 0.2
  let height = 5.5 + broadRelief + microRelief

  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.harborLowland, 240, MathUtils.clamp(8 + broadRelief * 0.34 + microRelief * 0.28, 3, 18))
  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.industrialPlateau, 300, MathUtils.clamp(32 + broadRelief * 0.64 + microRelief * 0.62, 22, 46))
  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.easternPlain, 360, MathUtils.clamp(40 + broadRelief * 0.88 + microRelief * 0.85, 28, 82))
  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.beachDunes, 180, MathUtils.clamp(10 + broadRelief * 0.55 + microRelief * 0.7, 2, 24))
  height = blendTerrainBand(height, x, z, BEACH_FEATURES.landingStrand, 80, MathUtils.clamp(4.2 + broadRelief * 0.16 + microRelief * 0.2, 2, 8))

  height = blendTerrainBand(height, x, z, RADAR_TERRAIN_POLYGONS.ridge, 260, MathUtils.clamp(94 + broadRelief * 0.78 + microRelief * 0.92, 80, 220))
  height = blendTerrainBand(height, x, z, RADAR_TERRAIN_POLYGONS.lower, 210, MathUtils.clamp(122.5 + broadRelief * 0.46 + microRelief * 0.58, 80, 125))
  height = blendTerrainBand(height, x, z, RADAR_TERRAIN_POLYGONS.middle, 175, MathUtils.clamp(171 + broadRelief * 0.42 + microRelief * 0.5, 125, 175))
  height = blendTerrainBand(height, x, z, RADAR_TERRAIN_POLYGONS.upper, 145, MathUtils.clamp(198 + broadRelief * 0.3 + microRelief * 0.36, 175, 210))
  height = blendTerrainBand(height, x, z, RADAR_TERRAIN_POLYGONS.summit, 110, MathUtils.clamp(218 + broadRelief * 0.16 + microRelief * 0.22, 205, 220))

  const ridgeInterior = polygonInfluence(x, z, RADAR_TERRAIN_POLYGONS.ridge, 260)
  const ridgeFacet = Math.sin(x * 0.0061 - z * 0.0047 + 1.2) * 1.5 + Math.sin(x * 0.012 + z * 0.0081) * 0.75
  height += ridgeInterior * ridgeFacet

  height = blendHeightControl(height, x, z, 2450, 3650, 108)
  height = blendHeightControl(height, x, z, 3300, 4480, 184)
  height = blendHeightControl(height, x, z, 3700, 4180, 220)
  height = blendHeightControl(height, x, z, 4325, 4000, 195)
  height = blendHeightControl(height, x, z, 4050, 2850, 126)
  height = blendHeightControl(height, x, z, 5050, 3200, 96)

  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorBluffWest, 65, MathUtils.clamp(58 + broadRelief * 0.48 + microRelief * 0.68, 28, 62))
  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorBluffCenter, 65, MathUtils.clamp(54 + broadRelief * 0.48 + microRelief * 0.68, 32, 58))
  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorBluffEast, 60, MathUtils.clamp(50 + broadRelief * 0.42 + microRelief * 0.62, 26, 54))
  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorPassWest, 45, MathUtils.clamp(22 + broadRelief * 0.2 + microRelief * 0.22, 20, 32))
  height = blendTerrainBand(height, x, z, TERRAIN_STAGE2_POLYGONS.separatorPassEast, 45, MathUtils.clamp(20.5 + broadRelief * 0.2 + microRelief * 0.22, 18, 30))

  const washDistance = distanceToPolyline(x, z, CORRIDOR_FEATURES.dryWash)
  const channelCut = (1 - smoothstep(0, 64, washDistance)) * 5.2
  const washBank = (smoothstep(38, 76, washDistance) - smoothstep(76, 132, washDistance)) * 1.45
  height += washBank - channelCut

  height = blendTerrainBand(height, x, z, BEACH_FEATURES.duneWest, 48, MathUtils.clamp(11.5 + broadRelief * 0.22 + microRelief * 0.72, 4, 14))
  height = blendTerrainBand(height, x, z, BEACH_FEATURES.duneCentral, 48, MathUtils.clamp(15 + broadRelief * 0.22 + microRelief * 0.9, 5, 18))
  height = blendTerrainBand(height, x, z, BEACH_FEATURES.duneEast, 52, MathUtils.clamp(13.5 + broadRelief * 0.22 + microRelief * 0.82, 4, 16))

  // Only engineered footprints are level. The shoulders are deliberately
  // narrow so the surrounding ridge, harbor, and industrial relief remains.
  height = gradePolygon(height, x, z, HARBOR_FEATURES.warehouses[0].points, 30, 8)
  height = gradePolygon(height, x, z, HARBOR_FEATURES.warehouses[1].points, 30, 8)
  height = gradePolygon(height, x, z, HARBOR_FEATURES.electricalServiceFacility.points, 24, 8)
  height = gradePolygon(height, x, z, HARBOR_FEATURES.defenseEmplacement.points, 24, 8)
  height = gradePolygon(height, x, z, INDUSTRIAL_FEATURES.pumpYard, 24, 31)
  height = gradePolygon(height, x, z, INDUSTRIAL_FEATURES.transferRack.points, 24, 31)
  height = gradePolygon(height, x, z, INDUSTRIAL_FEATURES.ammunitionLoadingYard, 32, 38)
  height = gradePolygon(height, x, z, INDUSTRIAL_FEATURES.ammunitionRailPlatform, 24, 38)
  for (const utility of INDUSTRIAL_FEATURES.utilities) height = gradePolygon(height, x, z, utility.points, 18, 31)
  // Containment cells are engineered level floors. Every product-tank shell,
  // including its damaged replacement, therefore shares one footprint-safe
  // terrain base without changing the authored cylinder dimensions.
  for (const cell of FUEL_BUND_CELLS) height = gradePolygon(height, x, z, cell.points, 28, FUEL_CONTAINMENT_FLOOR_MAP_HEIGHT_M)
  height = gradePolygon(height, x, z, FIREWATER_TANK_FOUNDATION_POINTS, 24, FUEL_CONTAINMENT_FLOOR_MAP_HEIGHT_M)

  height = gradePolygon(height, x, z, RADAR_PAD_POLYGONS.search, 26, 209.35)
  height = gradePolygon(height, x, z, RADAR_PAD_POLYGONS.tracking, 24, 194.35)
  for (const [index, site] of SAM_PAD_POSITIONS.entries()) {
    const polygon = [RADAR_PAD_POLYGONS.sam01, RADAR_PAD_POLYGONS.sam02, RADAR_PAD_POLYGONS.sam03, RADAR_PAD_POLYGONS.sam04][index]!
    height = gradePolygon(height, x, z, polygon, 18, site.terrainY - 0.35)
  }
  height = gradePolygon(height, x, z, RADAR_PAD_POLYGONS.aaa, 22, AAA_SITE.terrainY - 0.35)
  height = gradeCircle(height, x, z, COMMUNICATIONS_MAST_SITE.position[0], COMMUNICATIONS_MAST_SITE.position[2], 24, 18, COMMUNICATIONS_MAST_SITE.position[1])
  for (const [index, building] of RADAR_SUPPORT_BUILDINGS.entries()) {
    height = gradePolygon(height, x, z, RADAR_SUPPORT_POLYGONS[index]!, 18, building.terrainY)
  }

  return MathUtils.clamp(height, 2, 220)
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
  for (const polygon of Object.values(TERRAIN_STAGE2_POLYGONS)) points.push(...polygon)
  for (const polygon of [
    BEACH_FEATURES.landingStrand,
    BEACH_FEATURES.duneWest,
    BEACH_FEATURES.duneCentral,
    BEACH_FEATURES.duneEast,
    ...HARBOR_FEATURES.warehouses.map((warehouse) => warehouse.points),
    HARBOR_FEATURES.electricalServiceFacility.points,
    HARBOR_FEATURES.defenseEmplacement.points,
    INDUSTRIAL_FEATURES.pumpYard,
    INDUSTRIAL_FEATURES.transferRack.points,
    INDUSTRIAL_FEATURES.ammunitionLoadingYard,
    INDUSTRIAL_FEATURES.ammunitionRailPlatform,
    ...INDUSTRIAL_FEATURES.utilities.map((utility) => utility.points),
    ...FUEL_BUND_CELLS.map((cell) => cell.points),
    FIREWATER_TANK_FOUNDATION_POINTS,
  ])
    points.push(...polygon)
  for (const polygon of RADAR_SUPPORT_POLYGONS) points.push(...polygon)
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

const ANALYTIC_GRID_HEIGHT_CACHE = new Map<number, Map<number, number>>()

function getCachedAnalyticTerrainHeight(x: number, z: number) {
  let zValues = ANALYTIC_GRID_HEIGHT_CACHE.get(x)
  if (!zValues) {
    zValues = new Map<number, number>()
    ANALYTIC_GRID_HEIGHT_CACHE.set(x, zValues)
  }
  const cached = zValues.get(z)
  if (cached !== undefined) return cached
  const height = getAnalyticTerrainHeight(x, z)
  zValues.set(z, height)
  return height
}

function getPresentedGridHeight(x: number, z: number) {
  return remapTerrainElevation(getCachedAnalyticTerrainHeight(x, z))
}

function interpolateTerrainGrid(x: number, z: number, cornerHeight: (cornerX: number, cornerZ: number) => number) {
  const xIndex = enclosingAxisInterval(TERRAIN_GRID_X_VALUES, x)
  const zIndex = enclosingAxisInterval(TERRAIN_GRID_Z_VALUES, z)
  const x0 = TERRAIN_GRID_X_VALUES[xIndex]!
  const x1 = TERRAIN_GRID_X_VALUES[xIndex + 1]!
  const z0 = TERRAIN_GRID_Z_VALUES[zIndex]!
  const z1 = TERRAIN_GRID_Z_VALUES[zIndex + 1]!
  const xMix = MathUtils.clamp((x - x0) / (x1 - x0), 0, 1)
  const zMix = MathUtils.clamp((z - z0) / (z1 - z0), 0, 1)
  const height00 = cornerHeight(x0, z0)
  const height10 = cornerHeight(x1, z0)
  const height11 = cornerHeight(x1, z1)
  const height01 = cornerHeight(x0, z1)

  if (xMix >= zMix) {
    return height00 * (1 - xMix) + height10 * (xMix - zMix) + height11 * zMix
  }
  return height00 * (1 - zMix) + height11 * xMix + height01 * (zMix - xMix)
}

/** Map-spec elevation sampled on the exact mesh grid, before presentation remapping. */
export function getMapTerrainHeight(x: number, z: number) {
  return interpolateTerrainGrid(x, z, getCachedAnalyticTerrainHeight)
}

/** Height of the actual rendered Stage 2 terrain, not a finer hidden sampler. */
export function getTerrainHeight(x: number, z: number) {
  return interpolateTerrainGrid(x, z, getPresentedGridHeight)
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
