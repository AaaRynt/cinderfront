import type { BufferGeometry } from 'three'

import { describe, expect, it } from 'vitest'

import { COMMUNICATIONS_MAST_SITE, MAINLAND_POLYGON_XZ, RADAR_SEARCH_SITE, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../worldData.ts'
import { BEACH_FEATURES, INDUSTRIAL_FEATURES, ROAD_DEFINITIONS } from './stage2Data.ts'
import { createCoastSkirtGeometry, createContinuousMainlandGeometry, createTerrainSurfaceGeometry } from './terrainGeometry.ts'
import { getTerrainHeight, sampleTerrainPolyline } from './terrainModel.ts'

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

describe('Stage 2 continuous terrain', () => {
  it('retains the exact authored radar platform elevations', () => {
    expect(getTerrainHeight(RADAR_SEARCH_SITE.position[0], RADAR_SEARCH_SITE.position[2])).toBeCloseTo(209.35, 4)
    expect(getTerrainHeight(RADAR_TRACKING_SITE.position[0], RADAR_TRACKING_SITE.position[2])).toBeCloseTo(194.35, 4)
    for (const site of SAM_PAD_POSITIONS) {
      expect(getTerrainHeight(site.position[0], site.position[2])).toBeCloseTo(site.terrainY - 0.35, 4)
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
    expect(Math.min(...elevations)).toBeLessThan(100)
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
    expect(geometry.boundingBox?.min.y).toBeGreaterThanOrEqual(2)
    expect(geometry.boundingBox?.max.y).toBeLessThanOrEqual(221)

    const index = geometry.index!
    let triangleArea = 0
    for (let offset = 0; offset < index.count; offset += 3) {
      const a = index.getX(offset)
      const b = index.getX(offset + 1)
      const c = index.getX(offset + 2)
      const abX = positions.getX(b) - positions.getX(a)
      const abZ = positions.getZ(b) - positions.getZ(a)
      const acX = positions.getX(c) - positions.getX(a)
      const acZ = positions.getZ(c) - positions.getZ(a)
      triangleArea += (abZ * acX - abX * acZ) / 2
      expect(abZ * acX - abX * acZ).toBeGreaterThan(0)
    }
    let polygonArea = 0
    MAINLAND_POLYGON_XZ.forEach((point, pointIndex) => {
      const next = MAINLAND_POLYGON_XZ[(pointIndex + 1) % MAINLAND_POLYGON_XZ.length]!
      polygonArea += point[0] * next[1] - next[0] * point[1]
    })
    expect(triangleArea).toBeCloseTo(Math.abs(polygonArea) / 2, -1)
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

  it('drapes large hardstands over the shared rendered heightfield', () => {
    for (const polygon of [INDUSTRIAL_FEATURES.fuelCompound, INDUSTRIAL_FEATURES.ammunitionCompound, BEACH_FEATURES.inlandHardstand]) {
      const geometry = createTerrainSurfaceGeometry(polygon, 0.32)
      const positions = geometry.getAttribute('position')
      for (let index = 0; index < positions.count; index += Math.max(1, Math.floor(positions.count / 20))) {
        const x = positions.getX(index)
        const z = positions.getZ(index)
        expect(positions.getY(index)).toBeCloseTo(getTerrainHeight(x, z) + 0.32, 3)
      }
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
