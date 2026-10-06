import { Vector3, type BufferGeometry } from 'three'
import { describe, expect, it } from 'vitest'

import { createSimulationStore } from '../../../simulation/store'
import { pointInPolygon, getTerrainHeight } from '../stage2/terrainModel'
import { MAINLAND_POLYGON_XZ } from '../worldData'
import { COASTAL_WAVES, createCoastalWaterGeometry, createFoamGeometry, createShoreFoamLayout, createWetShoreGeometry, FOAM_MAX_OPACITY, MAX_WATER_SLOPE, MEAN_SEA_LEVEL, sampleCoastalMotion, sampleFoamOpacity, sampleWaterRegion, WATER_NORMAL_GLSL } from './coastalWater'

function expectSurfaceTriangles(g: BufferGeometry) {
  const p = g.getAttribute('position'),
    indices = g.index
  for (let i = 0; i < (indices?.count ?? p.count); i += 3) {
    const [a, b, c] = [0, 1, 2].map((offset) => new Vector3().fromBufferAttribute(p, indices ? indices.getX(i + offset) : i + offset))
    expect([a!, b!, c!].every((v) => [v.x, v.y, v.z].every(Number.isFinite))).toBe(true)
    expect(b!.sub(a!).cross(c!.sub(a!)).lengthSq()).toBeGreaterThan(1e-12)
  }
}

describe('Stage 4C absolute-time coastal presentation', () => {
  it('shares tested harmonic inputs with the rendered GLSL and preserves sea level', () => {
    for (const wave of COASTAL_WAVES) {
      expect(WATER_NORMAL_GLSL).toContain(`uCoastalTime * ${wave.frequency}`)
      expect(Math.hypot(...wave.direction)).toBeCloseTo(1, 6)
      expect(wave.direction[0]).toBeGreaterThan(0)
      expect(wave.direction[1]).toBeGreaterThan(0)
    }
    for (const x of [-6000, -4000, 3500, 5500])
      for (const z of [-4300, -3100, 3400, 3900])
        for (let t = 0; t <= 176; t += 0.7) {
          const sample = sampleCoastalMotion(x, z, t)
          expect(Math.hypot(sample.slopeX, sample.slopeZ)).toBeLessThanOrEqual(MAX_WATER_SLOPE + 1e-8)
          expect(sample.meanY).toBe(MEAN_SEA_LEVEL)
          expect(sample.roughness).toBeGreaterThanOrEqual(0.42)
          expect(sample.roughness).toBeLessThanOrEqual(0.62)
          expect(sample.wetness).toBeGreaterThanOrEqual(0.695)
          expect(sample.wetness).toBeLessThanOrEqual(0.785)
        }
  })
  it('attenuates the sheltered basin while shallows and deep water retain smooth regional variation', () => {
    const harbor = sampleWaterRegion(-3800, 3500),
      exposed = sampleWaterRegion(-6000, -4000),
      shallow = sampleWaterRegion(4900, -3450)
    expect(harbor.attenuation).toBeLessThan(exposed.attenuation * 0.35)
    expect(shallow.shallow).toBeGreaterThan(exposed.shallow)
    for (let x = 3000; x < 6600; x += 17)
      for (let z = -4400; z < -2900; z += 37) {
        const a = sampleWaterRegion(x, z),
          b = sampleWaterRegion(x + 0.1, z)
        expect(Math.abs(a.shallow - b.shallow)).toBeLessThan(0.003)
        expect(Math.abs(a.attenuation - b.attenuation)).toBeLessThan(0.003)
      }
  })
  it('puts the actual proxy values into finite render attributes without vertical displacement', () => {
    const g = createCoastalWaterGeometry(),
      p = g.getAttribute('position'),
      regions = g.getAttribute('coastalRegion'),
      attenuation = g.getAttribute('coastalAttenuation')
    for (let i = 0; i < p.count; i++) {
      const r = sampleWaterRegion(p.getX(i), p.getZ(i))
      expect(p.getY(i)).toBeCloseTo(MEAN_SEA_LEVEL, 7)
      expect(regions.getX(i)).toBeCloseTo(r.harbor, 6)
      expect(regions.getY(i)).toBeCloseTo(r.shallow, 6)
      expect(regions.getZ(i)).toBeCloseTo(r.wet, 6)
      expect(attenuation.getX(i)).toBeCloseTo(r.attenuation, 6)
    }
    g.dispose()
  })
  it('reconstructs waves, foam and wetness after pause/backward seek/restart and at all speeds', () => {
    const samples = (t: number) => [sampleCoastalMotion(4900, -3450, t), sampleCoastalMotion(-3800, 3500, t), sampleFoamOpacity(0.5, 0.5, 2.1, t)]
    const baseline = samples(132.4)
    for (const speed of [0.5, 1, 2] as const) {
      const store = createSimulationStore({ isPlaying: true, speed })
      store.getState().tick(132.4 / speed)
      expect(samples(store.getState().timeSeconds)).toEqual(baseline)
      store.getState().pause()
      store.getState().tick(10)
      expect(samples(store.getState().timeSeconds)).toEqual(baseline)
      store.getState().seek(12)
      store.getState().seek(132.4)
      expect(samples(store.getState().timeSeconds)).toEqual(baseline)
      store.getState().restart()
      expect(samples(store.getState().timeSeconds)).toEqual(samples(0))
    }
    expect(samples(1)).not.toEqual(samples(0))
  })
  it('keeps broken surf outside land, away from quays and bounded in opacity at every timestamp', () => {
    const fragments = createShoreFoamLayout()
    expect(fragments.length).toBeGreaterThan(15)
    expect(fragments.length).toBeLessThan(65)
    expect(createShoreFoamLayout()).toEqual(fragments)
    for (const f of fragments) {
      expect(f.points.every((p) => p[0] >= 3000 && p[1] < -2880 && !pointInPolygon(...p, MAINLAND_POLYGON_XZ))).toBe(true)
      for (let t = 0; t <= 176; t += 0.8) {
        const opacity = sampleFoamOpacity(0.4, 0.5, f.phase, t)
        expect(opacity).toBeGreaterThanOrEqual(0)
        expect(opacity).toBeLessThanOrEqual(FOAM_MAX_OPACITY)
        expect(sampleFoamOpacity(0, 0.5, f.phase, t)).toBe(0)
      }
    }
    const g = createFoamGeometry(),
      p = g.getAttribute('position')
    expectSurfaceTriangles(g)
    expect(p.count).toBe(fragments.length * 6)
    for (let i = 0; i < p.count; i++) expect(p.getY(i)).toBeCloseTo(0.012, 7)
    g.dispose()
  })
  it('drapes the finite wet strip to existing terrain with a feathered inland edge', () => {
    const g = createWetShoreGeometry(),
      p = g.getAttribute('position'),
      edge = g.getAttribute('wetEdge')
    expectSurfaceTriangles(g)
    expect(p.count).toBeGreaterThan(100)
    for (let i = 0; i < p.count; i++) {
      expect(p.getY(i)).toBeCloseTo(getTerrainHeight(p.getX(i), p.getZ(i)) + 0.018, 3)
      expect(Number.isFinite(edge.getX(i))).toBe(true)
      expect(edge.getX(i)).toBeGreaterThanOrEqual(0)
      expect(edge.getX(i)).toBeLessThanOrEqual(1)
    }
    g.dispose()
  })
  it('feathers ragged foam inside every fragment rather than exposing rectangular borders', () => {
    for (const phase of [0, 1.8, 4.7])
      for (const t of [0, 12, 132.4, 176])
        for (let u = 0; u <= 1; u += 0.025) {
          expect(sampleFoamOpacity(u, 0, phase, t)).toBe(0)
          expect(sampleFoamOpacity(u, 1, phase, t)).toBe(0)
          for (let v = 0; v <= 1; v += 0.025) {
            const alpha = sampleFoamOpacity(u, v, phase, t)
            expect(alpha).toBeGreaterThanOrEqual(0)
            expect(alpha).toBeLessThanOrEqual(FOAM_MAX_OPACITY)
          }
        }
  })
})
