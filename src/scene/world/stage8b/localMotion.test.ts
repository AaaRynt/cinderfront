import { InstancedMesh, MeshDepthMaterial, MeshStandardMaterial, Vector3 } from 'three'
import { afterAll, describe, expect, it } from 'vitest'

import { LANDING_FOAM_RESERVATIONS } from '../landing/landingReservations'
import { getLandingGroundHeight } from '../landing/landingTerrain'
import { createExistingLandscapeEnvelopes, getLandscapeMovementReservations, isNewLandscapeAllowed } from '../landscape/landscapeReservations'
import { MEAN_SEA_LEVEL } from '../stage4c/coastalWater'
import { intersectsReservation } from '../stage4c/spatialReservations'
import { createDetailGeometries } from '../stage8a/detailGeometry'
import { createDetailLayout, detailXZ, fitDetailPlacement } from '../stage8a/detailLayout'
import { createVergeDust, DUST_PUFFS, DUST_RADIUS, DUST_START, DUST_TRAVEL } from './dust'
import { FLUTTER_PERIOD_SECONDS, GUST_PERIOD_SECONDS, MOTION_PERIOD_SECONDS, SURF_PERIOD_SECONDS, localMotionTime } from './motionClock'
import { EAST_SURF, createEastSurfGeometry, eastSurfXZ, sampleSurf } from './surf'
import { WIND_DIRECTION, WIND_PROFILES, applyLocalWind, expandWindBounds, isWindKind, windBendAt, windTipWeight } from './wind'

const geometry = createDetailGeometries()
afterAll(() => Object.values(geometry).forEach((mesh) => mesh.dispose()))

describe('local shore and wind time', () => {
  it('fits every period in the common clock and reconstructs phase after late observation', () => {
    for (const period of [SURF_PERIOD_SECONDS, GUST_PERIOD_SECONDS, FLUTTER_PERIOD_SECONDS]) expect(MOTION_PERIOD_SECONDS % period).toBe(0)
    expect(localMotionTime(NaN)).toBe(0)
    expect(localMotionTime(-17)).toBe(0)
    expect(localMotionTime(7200)).toBe(0)
    expect(localMotionTime(Number.MAX_VALUE)).toBeLessThan(MOTION_PERIOD_SECONDS)
    for (const t of [0, 154.25, 179.875, 180, 180.125, 225, 245, 7200.25]) {
      expect(sampleSurf(0.53, t + 7200)).toEqual(sampleSurf(0.53, t))
      expect(windBendAt('upright', t + 7200, 4356, 244, 1.04)).toBe(windBendAt('upright', t, 4356, 244, 1.04))
    }
    for (const time of [40, 180, 7200]) {
      const before = windBendAt('grass', time - 0.001, 4370, 230, 0.9)
      const after = windBendAt('grass', time + 0.001, 4370, 230, 0.9)
      expect(Math.abs(before - after)).toBeLessThan(0.004)
    }
  })

  it('moves a crest onto the grade and back, staggers the break and retains dampness as the wash recedes', () => {
    const [approach, crest, runup, retreat] = [154.25, 156, 158, 159.5].map((t) => sampleSurf(0.52, t))
    expect(approach!.front).toBeLessThan(-20)
    expect(approach!.swell).toBeGreaterThan(0.98)
    expect(crest!.front).toBeGreaterThan(approach!.front)
    expect(crest!.breaking).toBeGreaterThan(0.9)
    expect(runup!.front).toBeGreaterThan(14)
    expect(runup!.front).toBeLessThan(EAST_SURF.inland)
    expect(runup!.wash).toBeGreaterThan(0.9)
    expect(retreat!.front).toBeLessThan(runup!.front - 10)
    expect(retreat!.damp).toBeGreaterThan(0.95)
    expect(sampleSurf(0.26, 156).front - sampleSurf(0.76, 156).front).toBeGreaterThan(5)
    // The front resets offshore during its inactive gap while the damp
    // footprint remains, so the wrap has no visible discontinuity.
    for (const t of [159.99999, 160, 160.00001]) {
      const wrap = sampleSurf(0, t)
      expect(wrap.swell + wrap.wash + wrap.breaking).toBe(0)
      expect(wrap.damp).toBe(1)
    }
  })
})

describe('local motion envelopes', () => {
  it('follows the existing shoreline and grade without crossing the padded landing paths or scenery', () => {
    const bounds = [...LANDING_FOAM_RESERVATIONS, ...getLandscapeMovementReservations(), ...createExistingLandscapeEnvelopes().filter((r) => r.kind === 'circle' && r.center[0] > 5400 && r.center[0] < 5590 && r.center[1] < -2820 && r.center[1] > -3040)]
    for (const wet of [false, true]) {
      const surface = createEastSurfGeometry(wet)
      try {
        const p = surface.getAttribute('position')
        const uv = surface.getAttribute('uv')
        expect(surface.index!.count / 3).toBe(wet ? 3168 : 10944)
        let maximum = -Infinity
        for (let i = 0; i < p.count; i++) {
          const x = p.getX(i),
            z = p.getZ(i),
            y = p.getY(i),
            d = uv.getY(i)
          const expected = d <= 0 ? MEAN_SEA_LEVEL : getLandingGroundHeight(x, z)
          expect(y - expected).toBeCloseTo(EAST_SURF.drapeLift, 2)
          expect(
            bounds.some((r) => intersectsReservation(x, z, 1, r)),
            `surf ${x}, ${z}`,
          ).toBe(false)
          maximum = Math.max(maximum, y)
        }
        expect(maximum).toBeLessThan(1.2)
        expect(surface.boundingBox!.max.y).toBeCloseTo(maximum + (wet ? 0 : EAST_SURF.maximumLift), 5)
      } finally {
        surface.dispose()
      }
    }
    expect(eastSurfXZ(0, 22)[0]).toBeCloseTo(5467.9)
  }, 20_000)

  it('keeps root vertices fixed and the full wind displacement inside culling and traffic envelopes', () => {
    const material = new MeshStandardMaterial()
    try {
      const displaced = new Vector3()
      const original = new Vector3()
      for (const site of ['corridor', 'beach'] as const) {
        for (const plant of createDetailLayout(site)) {
          if (!isWindKind(plant.kind)) continue
          const kind = plant.kind
          const [x, z] = detailXZ(site, plant.local)
          const shape = geometry[kind]
          const matrix = fitDetailPlacement(shape, site, plant)
          const mesh = new InstancedMesh(shape, material, 1)
          mesh.setMatrixAt(0, matrix)
          mesh.computeBoundingBox()
          mesh.computeBoundingSphere()
          expandWindBounds(mesh, kind)
          let radius = 0
          const p = shape.getAttribute('position')
          for (let i = 0; i < p.count; i++) {
            original.fromBufferAttribute(p, i).applyMatrix4(matrix)
            const localY = p.getY(i)
            const limit = WIND_PROFILES[kind].bend * windTipWeight(kind, localY)
            displaced.copy(original).add(new Vector3(WIND_DIRECTION[0] * limit, 0, WIND_DIRECTION[1] * limit))
            expect(mesh.boundingBox!.containsPoint(displaced)).toBe(true)
            expect(mesh.boundingSphere!.containsPoint(displaced)).toBe(true)
            if (localY <= WIND_PROFILES[kind].anchor) expect(windBendAt(kind, 7211, x, z, localY)).toBe(0)
            radius = Math.max(radius, Math.hypot(original.x - x, original.z - z), Math.hypot(displaced.x - x, displaced.z - z))
          }
          expect(isNewLandscapeAllowed(x, z, radius), plant.id).toBe(true)
          mesh.dispose()
        }
      }
    } finally {
      material.dispose()
    }
  }, 20_000)

  it('shares the same vertex deformation and live clock with the tree depth pass', () => {
    const clock = { value: 12.5 }
    const surface = applyLocalWind(new MeshStandardMaterial(), 'wind', clock)
    const depth = applyLocalWind(new MeshDepthMaterial(), 'wind', clock)
    const compile = (material: MeshDepthMaterial | MeshStandardMaterial) => {
      const input = { uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>' } as Parameters<typeof material.onBeforeCompile>[0]
      material.onBeforeCompile(input, {} as Parameters<typeof material.onBeforeCompile>[1])
      return input
    }
    const visibleShader = compile(surface)
    const depthShader = compile(depth)
    expect(visibleShader.vertexShader).toEqual(depthShader.vertexShader)
    expect(visibleShader.uniforms.uLocalMotionTime).toBe(clock)
    expect(depthShader.uniforms.uLocalMotionTime).toBe(clock)
    expect(visibleShader.uniforms.uWindProfile.value.toArray()).toEqual(depthShader.uniforms.uWindProfile.value.toArray())
    surface.dispose()
    depth.dispose()
  })

  it('uses a fixed dust pool clear of the road and rigid inspection equipment', () => {
    const clock = { value: 0 }
    const dust = createVergeDust(clock)
    try {
      expect(dust.geometry.getAttribute('position').count).toBe(DUST_PUFFS * 4)
      expect(dust.geometry.index!.count).toBe(DUST_PUFFS * 6)
      expect(dust.material.uniforms.uLocalMotionTime).toBe(clock)
      const props = createDetailLayout('corridor')
        .filter((p) => ['wash-sign', 'shelter', 'drum', 'tire'].includes(p.kind))
        .map((p) => {
          geometry[p.kind].computeBoundingSphere()
          const sphere = geometry[p.kind].boundingSphere!.clone().applyMatrix4(fitDetailPlacement(geometry[p.kind], 'corridor', p))
          return sphere
        })
      for (let along = 0; along <= DUST_TRAVEL; along += 0.25) {
        const x = DUST_START[0] + along * WIND_DIRECTION[0]
        const z = DUST_START[1] + along * WIND_DIRECTION[1]
        expect(isNewLandscapeAllowed(x, z, DUST_RADIUS)).toBe(true)
        expect(props.every((p) => Math.hypot(x - p.center.x, z - p.center.z) > DUST_RADIUS + p.radius)).toBe(true)
      }
    } finally {
      dust.geometry.dispose()
      dust.material.dispose()
    }
  })
})
