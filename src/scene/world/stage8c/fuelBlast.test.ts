import { MeshDepthMaterial, MeshStandardMaterial, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { FUEL_SHOCK_DURATION_SECONDS, FUEL_SHOCK_MAX_RADIUS_M, shockRadiusAt } from '../../effects/stage3/effectMath'
import { STAGE4A_FUEL_HERO_TIME_SECONDS } from '../../effects/stage4a/fuelDisasterMath'
import { getLandingSupportHeight } from '../landing/landingTerrain'
import { createDetailPlantGeometry } from '../stage8a/detailGeometry'
import { localMotionTime } from '../stage8b/motionClock'
import { applyLocalWind, WIND_DIRECTION, WIND_PROFILES, windTipWeight } from '../stage8b/wind'
import { applyFuelBlast, FUEL_BLAST_ATTACK_SECONDS, FUEL_BLAST_SETTLE_SECONDS, fuelBlastAge, fuelBlastEnvelope, fuelResponseAt } from './fuelBlast'
import { fitFuelPlant, FUEL_PLANTS, fullStrengthTipM } from './fuelPlantLayout'

const responseFor = (plant: (typeof FUEL_PLANTS)[number]) => fuelResponseAt(plant.x, plant.z, fullStrengthTipM(plant))

describe('fuel front vegetation', () => {
  it('reaches both pockets in order on the live cascade front', () => {
    expect(STAGE4A_FUEL_HERO_TIME_SECONDS).toBe(92)
    expect(FUEL_SHOCK_DURATION_SECONDS).toBe(1.8)
    expect(FUEL_SHOCK_MAX_RADIUS_M).toBe(620)
    const arrivals = FUEL_PLANTS.map((plant) => {
      const { arrivalAge, directionX, directionZ, distanceM } = responseFor(plant)
      expect(distanceM).toBeCloseTo(Math.hypot(plant.x + 545, plant.z - 2050), 9)
      expect(shockRadiusAt(arrivalAge, FUEL_SHOCK_MAX_RADIUS_M, FUEL_SHOCK_DURATION_SECONDS)).toBeCloseTo(distanceM, 9)
      expect([directionX, directionZ]).toEqual([(plant.x + 545) / distanceM, (plant.z - 2050) / distanceM])
      return { age: arrivalAge, near: plant.id.startsWith('near') }
    })
    const nearPeak = Math.max(...arrivals.filter((p) => p.near).map((p) => p.age)) + FUEL_BLAST_ATTACK_SECONDS
    for (const { age, near } of arrivals) {
      if (near) expect(fuelBlastEnvelope(nearPeak - age)).toBeGreaterThan(0.9)
      else expect(fuelBlastEnvelope(nearPeak - age)).toBe(0)
    }
  })

  it('falls off smoothly to zero at the outer reach', () => {
    const distances = [0, 140, 250, 425, 619, 620, 621]
    const peaks = distances.map((d) => fuelResponseAt(-545 + d, 2050, 4).peakM)
    expect(peaks[0]).toBe(4)
    expect(peaks[1]).toBe(4)
    expect(peaks[2]).toBeGreaterThan(peaks[3]!)
    expect(peaks[3]).toBeGreaterThan(peaks[4]!)
    expect(peaks[4]).toBeGreaterThan(0)
    expect(peaks[4]).toBeLessThan(0.0001)
    expect(peaks.slice(5)).toEqual([0, 0])
  })

  it('rebounds, settles and reconstructs solely from the absolute clock', () => {
    const { arrivalAge } = responseFor(FUEL_PLANTS[0])
    const sample = (time: number) => fuelBlastEnvelope(fuelBlastAge(time) - arrivalAge)
    const arrival = STAGE4A_FUEL_HERO_TIME_SECONDS + arrivalAge
    const peak = arrival + FUEL_BLAST_ATTACK_SECONDS
    const peakValue = sample(peak)
    expect(sample(arrival - 0.001)).toBe(0)
    expect(sample(arrival + 0.1)).toBeGreaterThan(0.4)
    expect(peakValue).toBeCloseTo(1, 9)
    expect(sample(peak + 0.65)).toBeLessThan(-0.4)
    expect(Math.abs(sample(arrival + 3))).toBeLessThan(0.1)
    expect(fuelBlastEnvelope(FUEL_BLAST_SETTLE_SECONDS)).toBe(0)
    expect(sample(arrival + FUEL_BLAST_SETTLE_SECONDS + 0.001)).toBe(0)
    for (const t of [180, peak + 40, peak + 80, 7199.9, 7200, 7200.1, 0]) expect(sample(t)).toBe(0)
    expect(localMotionTime(peak + 40)).toBeCloseTo(localMotionTime(peak), 9)
    expect(sample(peak)).toBe(peakValue)
  })

  it('keeps the fitted roots and the complete bent geometry inside the gravel strip', () => {
    const point = new Vector3()
    for (const plant of FUEL_PLANTS) {
      const { directionZ, peakM } = responseFor(plant)
      const geometry = createDetailPlantGeometry(plant.kind)
      geometry.computeBoundingBox()
      const { min, max } = geometry.boundingBox!
      const matrix = fitFuelPlant(geometry, plant)
      const positions = geometry.getAttribute('position')
      let maximumBend = 0
      let minZ = Infinity
      let maxZ = -Infinity
      let rootCover = Infinity
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i)
        const weight = windTipWeight(plant.kind, point.y)
        const root = point.y < min.y + 0.009
        point.applyMatrix4(matrix)
        if (root) {
          expect(weight).toBe(0)
          rootCover = Math.min(rootCover, getLandingSupportHeight(point.x, point.z) + 0.3 - point.y)
        }
        maximumBend = Math.max(maximumBend, weight * peakM)
        // Full possible gust and radial offset, including the negative lobe.
        for (const impulse of [-2 / 3, 1]) {
          const z = point.z + weight * directionZ * peakM * impulse
          minZ = Math.min(minZ, z)
          maxZ = Math.max(maxZ, z + weight * WIND_DIRECTION[1] * WIND_PROFILES[plant.kind].bend)
        }
      }
      expect(rootCover).toBeGreaterThan(0)
      expect(maximumBend).toBeCloseTo(peakM * windTipWeight(plant.kind, max.y), 7)
      expect(minZ).toBeGreaterThan(1797)
      expect(maxZ).toBeLessThan(1813)
      geometry.dispose()
    }
  })

  it('uses one shader for visible and shadow bend and keeps the two clocks independent', () => {
    const wind = { value: 12.95 }
    const blast = { value: 0.95 }
    const visible = applyFuelBlast(new MeshStandardMaterial(), 'upright', wind, blast)
    const depth = applyFuelBlast(new MeshDepthMaterial(), 'upright', wind, blast)
    const ambient = applyLocalWind(new MeshStandardMaterial(), 'upright', wind)
    type Compile = MeshStandardMaterial['onBeforeCompile']
    function sample(material: MeshStandardMaterial | MeshDepthMaterial) {
      const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>', fragmentShader: '' } as Parameters<Compile>[0]
      material.onBeforeCompile(shader, {} as Parameters<Compile>[1])
      material.dispose()
      return shader
    }
    const shader = sample(visible)
    expect(sample(depth)).toEqual(shader)
    expect(shader.uniforms.uLocalMotionTime).toBe(wind)
    expect(shader.uniforms.uFuelBlastAge).toBe(blast)
    expect(shader.vertexShader).toContain('fuelBlastEnvelope(uFuelBlastAge - fuelResponse.z))')
    expect(shader.vertexShader).toContain('* weight * weight')
    expect(sample(ambient).uniforms.uFuelBlastAge).toBeUndefined()
    expect(ambient.customProgramCacheKey()).toBe('8b-local-wind-v1')
  })
})
