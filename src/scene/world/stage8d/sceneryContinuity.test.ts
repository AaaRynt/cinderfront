import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { LANDING_FOAM_RESERVATIONS } from '../landing/landingReservations'
import { getLandingGroundHeight, landingCoastZ } from '../landing/landingTerrain'
import { createExistingLandscapeEnvelopes, getLandscapeMovementReservations, isNewLandscapeAllowed } from '../landscape/landscapeReservations'
import { MEAN_SEA_LEVEL } from '../stage4c/coastalWater'
import { intersectsReservation } from '../stage4c/spatialReservations'
import { createDetailGeometries } from '../stage8a/detailGeometry'
import { DETAIL_SITES, detailXZ, fitDetailPlacement } from '../stage8a/detailLayout'
import { createEastSurfGeometry, EAST_FRONTAGE, EAST_SURF, frontageRimAt, sampleSurf } from '../stage8b/surf'
import { isWindKind, WIND_DIRECTION, WIND_PROFILES, windTipWeight } from '../stage8b/wind'
import { createRescueApproachLayout, createRescueShoulder, RESCUE_APPROACH_BOUNDS } from './rescueApproach'

describe('Stage 8D bounded scenery', () => {
  it('fits the new groups and their full wind bend outside the road and original bay', () => {
    const geometries = createDetailGeometries()
    const shoulder = createRescueShoulder()
    const p = new Vector3()
    const { origin, heading } = DETAIL_SITES.corridor
    const cos = Math.cos(heading)
    const sin = Math.sin(heading)
    const local = (x: number, z: number) => [(x - origin[0]) * cos + (z - origin[1]) * sin, (z - origin[1]) * cos - (x - origin[0]) * sin] as const
    const inside = (x: number, z: number, tolerance = 0) => {
      const [s, v] = local(x, z)
      return RESCUE_APPROACH_BOUNDS.some(([s0, s1, v0, v1]) => s >= s0 - tolerance && s <= s1 + tolerance && v >= v0 - tolerance && v <= v1 + tolerance)
    }
    try {
      const plants = createRescueApproachLayout()
      expect(plants).toEqual(createRescueApproachLayout())
      expect(plants.filter((p) => p.kind === 'wind' || p.kind === 'upright')).toHaveLength(2)
      const roots: { x: number; z: number; radius: number }[] = []
      for (const plant of plants) {
        const shape = geometries[plant.kind]
        shape.computeBoundingBox()
        const matrix = fitDetailPlacement(shape, 'corridor', plant)
        const [x, z] = detailXZ('corridor', plant.local)
        const pos = shape.getAttribute('position')
        const kind = plant.kind
        let radius = 0
        let rootRadius = 0
        let allInside = true
        for (let i = 0; i < pos.count; i++) {
          p.fromBufferAttribute(pos, i).applyMatrix4(matrix)
          if (pos.getY(i) < shape.boundingBox!.min.y + 0.001) rootRadius = Math.max(rootRadius, Math.hypot(p.x - x, p.z - z))
          const bend = isWindKind(kind) ? WIND_PROFILES[kind].bend * windTipWeight(kind, pos.getY(i)) : 0
          const bentX = p.x + WIND_DIRECTION[0] * bend
          const bentZ = p.z + WIND_DIRECTION[1] * bend
          allInside &&= inside(p.x, p.z) && inside(bentX, bentZ)
          radius = Math.max(radius, Math.hypot(p.x - x, p.z - z), Math.hypot(bentX - x, bentZ - z))
        }
        expect(allInside, plant.id).toBe(true)
        expect(isNewLandscapeAllowed(x, z, radius), plant.id).toBe(true)
        expect(
          roots.every((root) => Math.hypot(root.x - x, root.z - z) > root.radius + rootRadius),
          plant.id,
        ).toBe(true)
        roots.push({ x, z, radius: rootRadius })
      }
      const surface = shoulder.getAttribute('position')
      for (let i = 0; i < surface.count; i++) {
        const x = surface.getX(i)
        const z = surface.getZ(i)
        expect(inside(x, z, 0.001)).toBe(true)
        expect(surface.getY(i) - getLandingGroundHeight(x, z)).toBeCloseTo(0.035, 2)
      }
    } finally {
      shoulder.dispose()
      Object.values(geometries).forEach((shape) => shape.dispose())
    }
  }, 20_000)

  it('keeps the related wave phase at the seam and limits the wash at the bank', () => {
    expect(EAST_FRONTAGE.minX).toBe(EAST_SURF.maxX)
    for (const t of [0, 154.25, 156, 157.25, 159, 176, 180]) {
      expect(sampleSurf(0, t, 'frontage').phase).toBeCloseTo(sampleSurf(1, t).phase, 12)
      expect(sampleSurf(0.45, t + 7200, 'frontage')).toEqual(sampleSurf(0.45, t, 'frontage'))
    }
    expect(frontageRimAt(0)).toBe(14)
    expect(frontageRimAt(9 / 165)).toBe(0)
    expect(sampleSurf(0.42, 157.25, 'frontage').breaking).toBeGreaterThan(0.9)
    expect(sampleSurf(0.42, 159, 'frontage').runup).toBe(-2)
    expect(sampleSurf(0, 159, 'frontage').runup).toBe(12)
  })

  it('fits the complete new wash and damp meshes clear of padded landing paths and scenery', () => {
    const obstacles = [...LANDING_FOAM_RESERVATIONS, ...getLandscapeMovementReservations(), ...createExistingLandscapeEnvelopes().filter((r) => r.kind === 'circle' && r.center[0] >= 5480 && r.center[0] <= 5710 && r.center[1] >= -3040 && r.center[1] <= -2820)]
    for (const wet of [false, true]) {
      const geometry = createEastSurfGeometry(wet, 'frontage')
      try {
        const p = geometry.getAttribute('position')
        const uv = geometry.getAttribute('uv')
        expect(geometry.index!.count).toBeGreaterThan(0)
        expect(geometry.boundingBox!.min.x).toBe(EAST_FRONTAGE.minX)
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i)
          const z = p.getZ(i)
          const d = uv.getY(i)
          expect(d).toBeCloseTo(z - landingCoastZ(x), 2)
          if (d > 0) expect(x).toBeLessThan(5524)
          expect(p.getY(i) - (d <= 0 ? MEAN_SEA_LEVEL : getLandingGroundHeight(x, z))).toBeCloseTo(EAST_FRONTAGE.drapeLift, 2)
          expect(obstacles.some((r) => intersectsReservation(x, z, 0.75, r))).toBe(false)
        }
      } finally {
        geometry.dispose()
      }
    }
  }, 20_000)
})
