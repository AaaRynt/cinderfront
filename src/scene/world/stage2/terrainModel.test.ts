import type { BufferGeometry } from 'three'

import { describe, expect, it } from 'vitest'

import { AAA_SITE, COMMUNICATIONS_MAST_SITE, MAINLAND_POLYGON_XZ, RADAR_SEARCH_SITE, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../worldData.ts'
import { BEACH_FEATURES, CORRIDOR_FEATURES, FUEL_BUND_CELLS, FUEL_DISTRICT_DAMAGE_THRESHOLDS_SECONDS, FUEL_DISTRICT_DAMAGE_TIMES, FUEL_PIPE_DEFINITIONS, FUEL_TANKS, HARBOR_FEATURES, INDUSTRIAL_FEATURES, ROAD_DEFINITIONS, getFuelDistrictDamagePhase } from './stage2Data.ts'
import { createCoastSkirtGeometry, createContinuousMainlandGeometry, createTerrainRoadGeometry, createTerrainSurfaceGeometry } from './terrainGeometry.ts'
import { FUEL_CONTAINMENT_FLOOR_MAP_HEIGHT_M, getMapTerrainHeight, getTerrainHeight, pointInPolygon, remapTerrainElevation, sampleTerrainPolyline } from './terrainModel.ts'

function expectWithin(value: number, minimum: number, maximum: number) {
  expect(value).toBeGreaterThanOrEqual(minimum)
  expect(value).toBeLessThanOrEqual(maximum)
}

function renderedGeometryHeightAt(geometry: BufferGeometry, x: number, z: number) {
  const positions = geometry.getAttribute('position')
  const index = geometry.index!
  for (let offset = 0; offset < index.count; offset += 3) {
    const a = index.getX(offset)
    const b = index.getX(offset + 1)
    const c = index.getX(offset + 2)
    const ax = positions.getX(a)
    const az = positions.getZ(a)
    const bx = positions.getX(b)
    const bz = positions.getZ(b)
    const cx = positions.getX(c)
    const cz = positions.getZ(c)
    if (x < Math.min(ax, bx, cx) - 1e-5 || x > Math.max(ax, bx, cx) + 1e-5 || z < Math.min(az, bz, cz) - 1e-5 || z > Math.max(az, bz, cz) + 1e-5) continue
    const denominator = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz)
    if (Math.abs(denominator) < 1e-9) continue
    const aWeight = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / denominator
    const bWeight = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / denominator
    const cWeight = 1 - aWeight - bWeight
    if (aWeight >= -1e-5 && bWeight >= -1e-5 && cWeight >= -1e-5) {
      return aWeight * positions.getY(a) + bWeight * positions.getY(b) + cWeight * positions.getY(c)
    }
  }
  throw new Error(`No terrain triangle found at ${x}, ${z}`)
}

function triangleCentroidClearanceRange(geometry: BufferGeometry) {
  const positions = geometry.getAttribute('position')
  const index = geometry.index!
  let minimum = Number.POSITIVE_INFINITY
  let maximum = Number.NEGATIVE_INFINITY
  for (let offset = 0; offset < index.count; offset += 3) {
    const a = index.getX(offset)
    const b = index.getX(offset + 1)
    const c = index.getX(offset + 2)
    const x = (positions.getX(a) + positions.getX(b) + positions.getX(c)) / 3
    const y = (positions.getY(a) + positions.getY(b) + positions.getY(c)) / 3
    const z = (positions.getZ(a) + positions.getZ(b) + positions.getZ(c)) / 3
    const clearance = y - getTerrainHeight(x, z)
    minimum = Math.min(minimum, clearance)
    maximum = Math.max(maximum, clearance)
  }
  return { maximum, minimum }
}

function triangleInteriorClearanceRange(geometry: BufferGeometry) {
  const positions = geometry.getAttribute('position')
  const index = geometry.index!
  const weights = [
    [1 / 3, 1 / 3, 1 / 3],
    [0.6, 0.2, 0.2],
    [0.2, 0.6, 0.2],
    [0.2, 0.2, 0.6],
  ] as const
  let minimum = Number.POSITIVE_INFINITY
  let maximum = Number.NEGATIVE_INFINITY
  for (let offset = 0; offset < index.count; offset += 3) {
    const a = index.getX(offset)
    const b = index.getX(offset + 1)
    const c = index.getX(offset + 2)
    for (const [aWeight, bWeight, cWeight] of weights) {
      const x = positions.getX(a) * aWeight + positions.getX(b) * bWeight + positions.getX(c) * cWeight
      const y = positions.getY(a) * aWeight + positions.getY(b) * bWeight + positions.getY(c) * cWeight
      const z = positions.getZ(a) * aWeight + positions.getZ(b) * bWeight + positions.getZ(c) * cWeight
      const clearance = y - getTerrainHeight(x, z)
      minimum = Math.min(minimum, clearance)
      maximum = Math.max(maximum, clearance)
    }
  }
  return { maximum, minimum }
}

describe('Stage 2 continuous terrain', () => {
  it('retains the exact authored radar platform elevations', () => {
    expect(getTerrainHeight(RADAR_SEARCH_SITE.position[0], RADAR_SEARCH_SITE.position[2])).toBeCloseTo(209.35, 4)
    expect(getTerrainHeight(RADAR_TRACKING_SITE.position[0], RADAR_TRACKING_SITE.position[2])).toBeCloseTo(194.35, 4)
    expect(getMapTerrainHeight(RADAR_SEARCH_SITE.position[0], RADAR_SEARCH_SITE.position[2])).toBeCloseTo(209.35, 4)
    expect(getMapTerrainHeight(RADAR_TRACKING_SITE.position[0], RADAR_TRACKING_SITE.position[2])).toBeCloseTo(194.35, 4)
    for (const site of SAM_PAD_POSITIONS) {
      expect(getTerrainHeight(site.position[0], site.position[2])).toBeCloseTo(site.terrainY - 0.35, 4)
      expect(getMapTerrainHeight(site.position[0], site.position[2])).toBeCloseTo(site.terrainY - 0.35, 4)
    }
    expect(getTerrainHeight(AAA_SITE.position[0], AAA_SITE.position[2])).toBeCloseTo(AAA_SITE.terrainY - 0.35, 4)
    expect(getTerrainHeight(COMMUNICATIONS_MAST_SITE.position[0], COMMUNICATIONS_MAST_SITE.position[2])).toBeCloseTo(COMMUNICATIONS_MAST_SITE.position[1], 4)
  })

  it('applies a monotonic middle-elevation presentation remap without moving the coast or high installations', () => {
    expect(remapTerrainElevation(2)).toBe(2)
    expect(remapTerrainElevation(18)).toBe(18)
    expect(remapTerrainElevation(82)).toBe(100)
    expect(remapTerrainElevation(120)).toBe(120)
    expect(remapTerrainElevation(170)).toBe(170)

    let previous = remapTerrainElevation(2)
    for (let mapHeight = 2.25; mapHeight <= 220; mapHeight += 0.25) {
      const rendered = remapTerrainElevation(mapHeight)
      expect(rendered).toBeGreaterThan(previous)
      previous = rendered
    }
  })

  it('samples roads against the same terrain authority', () => {
    const sampled = sampleTerrainPolyline(
      [
        [600, 1400],
        [3100, -300],
        [6050, -1600],
      ],
      80,
    )
    expect(sampled.length).toBeGreaterThan(50)
    for (const [x, y, z] of sampled) {
      expect(y).toBeCloseTo(getTerrainHeight(x, z), 8)
    }
  })

  it('produces varied, non-terraced Radar Hill elevations', () => {
    const elevations = new Set<number>()
    for (let x = 2400; x <= 5000; x += 130) {
      for (let z = 2800; z <= 4600; z += 130) {
        elevations.add(Math.round(getTerrainHeight(x, z) * 2) / 2)
      }
    }
    expect(elevations.size).toBeGreaterThan(80)
    expect(Math.max(...elevations)).toBeGreaterThan(200)
    expect(Math.min(...elevations)).toBeLessThan(115)
  })

  it('keeps representative map elevations inside each authoritative Radar Hill band', () => {
    expectWithin(getMapTerrainHeight(2050, 4000), 80, 220)
    expectWithin(getMapTerrainHeight(2400, 3500), 80, 125)
    expectWithin(getMapTerrainHeight(3000, 4000), 125, 175)
    expectWithin(getMapTerrainHeight(4400, 3700), 175, 210)
    expectWithin(getMapTerrainHeight(3850, 4200), 205, 220)

    expect(getMapTerrainHeight(2450, 3650)).toBeCloseTo(108, 4)
    expect(getMapTerrainHeight(3300, 4480)).toBeCloseTo(184, 4)
    expect(getMapTerrainHeight(4050, 2850)).toBeCloseTo(126, 4)
    expect(getMapTerrainHeight(5050, 3200)).toBeCloseTo(96, 4)
    expect(getTerrainHeight(2450, 3650)).toBeGreaterThan(getMapTerrainHeight(2450, 3650))
    expect(getTerrainHeight(5050, 3200)).toBeGreaterThan(getMapTerrainHeight(5050, 3200))
  })

  it('models the exact dune fields, separator bluffs, passes, and dry wash as relief', () => {
    expectWithin(getMapTerrainHeight(3500, -2520), 4, 14)
    expectWithin(getMapTerrainHeight(4250, -2550), 5, 18)
    expectWithin(getMapTerrainHeight(5700, -2600), 4, 16)

    const bluffHeights = [getTerrainHeight(3000, -2250), getTerrainHeight(4800, -2320), getTerrainHeight(6200, -2500)]
    const passHeights = [getTerrainHeight(4200, -2280), getTerrainHeight(5650, -2350)]
    expect(Math.min(...bluffHeights) - Math.max(...passHeights)).toBeGreaterThan(30)

    const mapWashCenter = getMapTerrainHeight(3800, 700)
    const mapWashBanks = [getMapTerrainHeight(3680, 600), getMapTerrainHeight(3920, 800)]
    for (const bank of mapWashBanks) expectWithin(bank - mapWashCenter, 2, 6)
    expect(getTerrainHeight(3680, 600) - getTerrainHeight(3800, 700)).toBeGreaterThan(mapWashBanks[0]! - mapWashCenter)
  })

  it('grades only engineered foundations to their intended local floors', () => {
    for (const [x, z] of INDUSTRIAL_FEATURES.ammunitionLoadingYard) {
      expect(getMapTerrainHeight(x, z)).toBeCloseTo(38, 4)
      expect(getTerrainHeight(x, z)).toBeCloseTo(remapTerrainElevation(38), 4)
    }
    for (const [x, z] of INDUSTRIAL_FEATURES.ammunitionRailPlatform) {
      expect(getMapTerrainHeight(x, z)).toBeCloseTo(38, 4)
      expect(getTerrainHeight(x, z)).toBeCloseTo(remapTerrainElevation(38), 4)
    }
    expect(getMapTerrainHeight(410, 1645)).toBeCloseTo(31, 4)
    expect(getTerrainHeight(410, 1645)).toBeCloseTo(remapTerrainElevation(31), 4)
    expect(getTerrainHeight(-3650, 4330)).toBeCloseTo(8, 4)
    expect(getTerrainHeight(-2850, 2790)).toBeCloseTo(8, 4)
  })

  it('preserves every authoritative coastline vertex in the terrain mesh', () => {
    const geometry = createContinuousMainlandGeometry()
    const positions = geometry.getAttribute('position')
    const vertices = new Map<string, number>()
    for (let index = 0; index < positions.count; index += 1) {
      vertices.set(`${positions.getX(index).toFixed(4)}:${positions.getZ(index).toFixed(4)}`, positions.getY(index))
    }
    MAINLAND_POLYGON_XZ.forEach(([x, z]) => {
      expect(vertices.get(`${x.toFixed(4)}:${z.toFixed(4)}`)).toBeCloseTo(getTerrainHeight(x, z), 4)
    })
    expect(geometry.index?.count).toBeGreaterThan(MAINLAND_POLYGON_XZ.length * 3)
    expect(geometry.index!.count / 3).toBeLessThan(175_000)
    expect(geometry.boundingBox?.min.y).toBeGreaterThanOrEqual(2)
    expect(geometry.boundingBox?.max.y).toBeLessThanOrEqual(221)

    const normals = geometry.getAttribute('normal')
    let minimumNormalY = 1
    let maximumHorizontalNormal = 0
    for (let normalIndex = 0; normalIndex < normals.count; normalIndex += 1) {
      minimumNormalY = Math.min(minimumNormalY, normals.getY(normalIndex))
      maximumHorizontalNormal = Math.max(maximumHorizontalNormal, Math.hypot(normals.getX(normalIndex), normals.getZ(normalIndex)))
    }
    expect(minimumNormalY).toBeLessThan(0.85)
    expect(maximumHorizontalNormal).toBeGreaterThan(0.5)

    const index = geometry.index!
    let triangleArea = 0
    let outsideTriangleCount = 0
    for (let offset = 0; offset < index.count; offset += 3) {
      const a = index.getX(offset)
      const b = index.getX(offset + 1)
      const c = index.getX(offset + 2)
      const abX = positions.getX(b) - positions.getX(a)
      const abZ = positions.getZ(b) - positions.getZ(a)
      const acX = positions.getX(c) - positions.getX(a)
      const acZ = positions.getZ(c) - positions.getZ(a)
      triangleArea += (abZ * acX - abX * acZ) / 2
      const centroidX = (positions.getX(a) + positions.getX(b) + positions.getX(c)) / 3
      const centroidZ = (positions.getZ(a) + positions.getZ(b) + positions.getZ(c)) / 3
      if (!pointInPolygon(centroidX, centroidZ, MAINLAND_POLYGON_XZ)) outsideTriangleCount += 1
      expect(abZ * acX - abX * acZ).toBeGreaterThan(0)
    }
    let polygonArea = 0
    MAINLAND_POLYGON_XZ.forEach((point, pointIndex) => {
      const next = MAINLAND_POLYGON_XZ[(pointIndex + 1) % MAINLAND_POLYGON_XZ.length]!
      polygonArea += point[0] * next[1] - next[0] * point[1]
    })
    expect(triangleArea).toBeCloseTo(Math.abs(polygonArea) / 2, -1)
    expect(outsideTriangleCount).toBe(0)
    const interiorClearance = triangleCentroidClearanceRange(geometry)
    expect(interiorClearance.minimum).toBeCloseTo(0, 3)
    expect(interiorClearance.maximum).toBeCloseTo(0, 3)
  }, 15_000)

  it('preserves the explicit tank and harbor warehouse scale authority', () => {
    expect(FUEL_TANKS.map(({ heightM, radiusM }) => [radiusM, heightM])).toEqual([
      [120, 22],
      [110, 20],
      [125, 24],
      [105, 18],
      [120, 22],
      [105, 18],
      [95, 16],
      [95, 16],
    ])
    expect(HARBOR_FEATURES.warehouses.map(({ heightM }) => heightM)).toEqual([24, 20])
    const warehouseDimensions = HARBOR_FEATURES.warehouses.map(({ points }) => [Math.hypot(points[1]![0] - points[0]![0], points[1]![1] - points[0]![1]), Math.hypot(points[2]![0] - points[1]![0], points[2]![1] - points[1]![1])])
    expect(warehouseDimensions[0]![0]).toBeCloseTo(620, -1)
    expect(warehouseDimensions[0]![1]).toBeCloseTo(220, -1)
    expect(warehouseDimensions[1]![0]).toBeCloseTo(520, -1)
    expect(warehouseDimensions[1]![1]).toBeCloseTo(210, -1)

    expect(FUEL_PIPE_DEFINITIONS.map(({ diameterM, id }) => [id, diameterM])).toEqual([
      ['fuel_pipe_header_east_west', 0.8],
      ['fuel_pipe_lateral_west', 0.5],
      ['fuel_pipe_lateral_east', 0.5],
      ['fuel_pipe_pump_drop', 0.5],
      ['fuel_pipe_transfer_rack_branch', 0.5],
      ['fuel_pipe_tank_01_feed', 0.35],
      ['fuel_pipe_tank_02_feed', 0.35],
      ['fuel_pipe_tank_03_feed', 0.35],
      ['fuel_pipe_tank_04_feed', 0.35],
      ['fuel_pipe_tank_05_feed', 0.35],
      ['fuel_pipe_tank_06_feed', 0.35],
    ])
  })

  it('grades every complete fuel-tank footprint to one shared replacement-safe base', () => {
    const tanks = [
      ...FUEL_TANKS,
      {
        center: INDUSTRIAL_FEATURES.firewaterTank.center,
        heightM: INDUSTRIAL_FEATURES.firewaterTank.heightM,
        id: 'fuel-firewater-tank',
        radiusM: INDUSTRIAL_FEATURES.firewaterTank.radiusM,
      },
    ]
    const expectedHeight = remapTerrainElevation(FUEL_CONTAINMENT_FLOOR_MAP_HEIGHT_M)

    for (const tank of tanks) {
      const [centerX, centerZ] = tank.center
      const heights: number[] = []
      for (const radiusFraction of [0, 0.25, 0.5, 0.75, 1]) {
        for (let angleIndex = 0; angleIndex < 32; angleIndex += 1) {
          const angle = (angleIndex / 32) * Math.PI * 2
          heights.push(getTerrainHeight(centerX + Math.cos(angle) * tank.radiusM * radiusFraction, centerZ + Math.sin(angle) * tank.radiusM * radiusFraction))
        }
      }
      expect(Math.min(...heights)).toBeCloseTo(expectedHeight, 4)
      expect(Math.max(...heights)).toBeCloseTo(expectedHeight, 4)
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(0.001)
    }
  })

  it('advances permanent fuel-district geometry only at authored damage thresholds', () => {
    expect(FUEL_DISTRICT_DAMAGE_THRESHOLDS_SECONDS).toEqual([78, 81.2, 86, 88.6, 92, 95.2, 97.6, 101.4, 105.6, 109.8])
    expect(getFuelDistrictDamagePhase(Number.NaN)).toBe(0)
    for (const [index, threshold] of FUEL_DISTRICT_DAMAGE_THRESHOLDS_SECONDS.entries()) {
      expect(getFuelDistrictDamagePhase(threshold - 0.0001)).toBe(index)
      expect(getFuelDistrictDamagePhase(threshold)).toBe(index + 1)
    }

    expect(FUEL_PIPE_DEFINITIONS.flatMap((definition) => ('failureAtSeconds' in definition ? [[definition.id, definition.failureAtSeconds]] : []))).toEqual([
      ['fuel_pipe_header_east_west', FUEL_DISTRICT_DAMAGE_TIMES.fuelHeader],
      ['fuel_pipe_lateral_east', FUEL_DISTRICT_DAMAGE_TIMES.northPipeHeader],
      ['fuel_pipe_transfer_rack_branch', FUEL_DISTRICT_DAMAGE_TIMES.transferRack],
      ['fuel_pipe_tank_05_feed', FUEL_DISTRICT_DAMAGE_TIMES.tank05Feed],
    ])
  })

  it('keeps terrain-facing roads and installation anchors on the rendered mesh', () => {
    const geometry = createContinuousMainlandGeometry()
    const anchors = [...SAM_PAD_POSITIONS.map((site) => [site.position[0], site.position[2]] as const), [COMMUNICATIONS_MAST_SITE.position[0], COMMUNICATIONS_MAST_SITE.position[2]] as const]
    for (const [x, z] of anchors) {
      expect(renderedGeometryHeightAt(geometry, x, z)).toBeCloseTo(getTerrainHeight(x, z), 3)
    }

    for (const roadId of ['road_ridge_access', 'road_radar_ring', 'road_beach_exit', 'road_beach_access_east']) {
      const road = ROAD_DEFINITIONS.find((candidate) => candidate.id === roadId)!
      const samples = sampleTerrainPolyline(road.points, 65)
      for (let index = 0; index < samples.length; index += 12) {
        const [x, y, z] = samples[index]!
        expect(renderedGeometryHeightAt(geometry, x, z)).toBeCloseTo(y, 3)
      }
    }
  })

  it('uses mainland terrain planes throughout steep road-ribbon edges and interiors', () => {
    for (const roadId of ['road_ridge_access', 'road_radar_ring', 'road_beach_exit', 'road_beach_access_east']) {
      const road = ROAD_DEFINITIONS.find((candidate) => candidate.id === roadId)!
      const centerline = sampleTerrainPolyline(road.points, 65, 0.3)
      const terrainXZ = centerline.map(([x, , z]) => [x, z] as const)
      const geometry = createTerrainRoadGeometry(terrainXZ, road.widthM, 0.48)
      const positions = geometry.getAttribute('position')
      for (let index = 0; index < positions.count; index += 1) {
        const clearance = positions.getY(index) - getTerrainHeight(positions.getX(index), positions.getZ(index))
        expect(clearance).toBeCloseTo(0.48, 2)
      }
      const clearance = triangleInteriorClearanceRange(geometry)
      expect(clearance.minimum).toBeCloseTo(0.48, 2)
      expect(clearance.maximum).toBeCloseTo(0.48, 2)
      const normals = geometry.getAttribute('normal')
      for (let index = 0; index < normals.count; index += 1) expect(normals.getY(index)).toBeGreaterThan(0.25)
      geometry.dispose()
    }

    const dryWashPoints = sampleTerrainPolyline(CORRIDOR_FEATURES.dryWash, 55, 0.24).map(([x, , z]) => [x, z] as const)
    const dryWash = createTerrainRoadGeometry(dryWashPoints, 112, 0.42)
    const dryWashClearance = triangleInteriorClearanceRange(dryWash)
    expect(dryWashClearance.minimum).toBeCloseTo(0.42, 2)
    expect(dryWashClearance.maximum).toBeCloseTo(0.42, 2)
    dryWash.dispose()
  })

  it('uses the mainland terrain triangles throughout hardstand and bund interiors', () => {
    const surfaces = [{ offsetM: 0.3, points: INDUSTRIAL_FEATURES.fuelCompound }, { offsetM: 0.32, points: INDUSTRIAL_FEATURES.ammunitionCompound }, { offsetM: 0.38, points: BEACH_FEATURES.inlandHardstand }, ...FUEL_BUND_CELLS.map((cell) => ({ offsetM: 0.16, points: cell.points }))]

    for (const surface of surfaces) {
      const geometry = createTerrainSurfaceGeometry(surface.points, surface.offsetM)
      const positions = geometry.getAttribute('position')
      for (let index = 0; index < positions.count; index += Math.max(1, Math.floor(positions.count / 20))) {
        const x = positions.getX(index)
        const z = positions.getZ(index)
        expect(positions.getY(index)).toBeCloseTo(getTerrainHeight(x, z) + surface.offsetM, 3)
      }
      const clearance = triangleCentroidClearanceRange(geometry)
      expect(clearance.minimum).toBeCloseTo(surface.offsetM, 3)
      expect(clearance.maximum).toBeCloseTo(surface.offsetM, 3)
      geometry.dispose()
    }
  })

  it('builds the coast skirt only along exposed shoreline edges', () => {
    const geometry = createCoastSkirtGeometry()
    const positions = geometry.getAttribute('position')
    expect(positions.count).toBe((MAINLAND_POLYGON_XZ.length - 1) * 2)
    expect([positions.getX(0), positions.getZ(0)]).toEqual(MAINLAND_POLYGON_XZ[2])
    expect([positions.getX(positions.count - 2), positions.getZ(positions.count - 2)]).toEqual(MAINLAND_POLYGON_XZ[0])
  })
})
