import { describe, expect, it } from 'vitest'

import { sampleRuntimeGroundVehicle, sampleRuntimeSupportVehicle, getMolniyaRuntimePresentation } from '@/simulation/aftermathSurvivors'
import { getBtr80PresentationSurfaceHeight, getT72PresentationSurfaceHeight } from '@/simulation/groundVehicles'
import { getSupportPresentationSurfaceHeight } from '@/simulation/supportConvoy'

import { COASTAL_WAVES, sampleCoastalMotion, sampleFoamOpacity } from '../../world/stage4c/coastalWater'
import { coastalShaderTime, COASTAL_PHASE_PERIOD_SECONDS, cyclicEmissionAge, legacyDustScale, periodicAngle, surfaceHistoryTime } from './effectClocks'
import { AFTERMATH_DUST_CACHE_LIMIT, AFTERMATH_DUST_LIFETIME_SECONDS, AFTERMATH_DUST_SLOTS_PER_ACTOR, getAftermathDustCacheSize, sampleRecentGroundDust } from './groundDust'
import { INDUSTRIAL_SECONDARY_SITES, sampleIndustrialSecondary, secondaryBirth, SECONDARY_CYCLE_SECONDS, SECONDARY_LIFETIME_SECONDS } from './industrialSecondary'

describe('bounded aftermath effect clocks and reconstruction', () => {
  it('preserves every scripted shader time and only wraps periodic water harmonics', () => {
    for (let tick = 0; tick <= 1800; tick++) {
      const t = tick / 10
      expect(coastalShaderTime(t)).toBe(t)
      expect(surfaceHistoryTime(t)).toBe(t)
      expect(periodicAngle(t, 8.3, 0.7)).toBe(t * 8.3 + 0.7)
    }
    for (const t of [180.0001, 240, 360, 600, 1800, 3600, 7200, 72000]) {
      const phase = coastalShaderTime(t)
      expect(phase).toBeGreaterThanOrEqual(0)
      expect(phase).toBeLessThan(COASTAL_PHASE_PERIOD_SECONDS)
      expect(surfaceHistoryTime(t)).toBe(180)
      const original = sampleCoastalMotion(4900, -3450, t)
      const bounded = sampleCoastalMotion(4900, -3450, phase)
      expect(bounded.slopeX).toBeCloseTo(original.slopeX, 10)
      expect(bounded.slopeZ).toBeCloseTo(original.slopeZ, 10)
      expect(bounded.wetness).toBeCloseTo(original.wetness, 10)
      expect(sampleFoamOpacity(0.4, 0.5, 2.1, phase)).toBeCloseTo(sampleFoamOpacity(0.4, 0.5, 2.1, t), 10)
    }
    for (const wave of COASTAL_WAVES) expect((wave.frequency * COASTAL_PHASE_PERIOD_SECONDS) / (Math.PI * 2)).toBeCloseTo(Math.round(wave.frequency * 100), 10)
    for (const t of [180, 7200, Number.MAX_VALUE]) expect(Number.isFinite(periodicAngle(t, 13.7))).toBe(true)
    expect(coastalShaderTime(Infinity)).toBe(0)
    expect(surfaceHistoryTime(NaN)).toBe(0)
  })

  it('ends a departed source by finishing existing fixed smoke slots within their lifetime', () => {
    const end = getMolniyaRuntimePresentation(7200).emissionEndSeconds
    for (const life of [4.4, 5.6, 12.1, 18.9]) {
      expect(cyclicEmissionAge(end - 0.001, 0.7, life, end)).not.toBeNull()
      expect(cyclicEmissionAge(end + life + 0.001, 0.7, life, end)).toBeNull()
      for (let time = end; time <= end + life; time += 0.1) {
        const age = cyclicEmissionAge(time, 0.7, life, end)
        if (age !== null) expect(time - age).toBeLessThanOrEqual(end)
      }
    }
    expect(cyclicEmissionAge(-1, 0.2, 5)).toBeNull()
    expect(legacyDustScale(180)).toBe(1)
    expect(legacyDustScale(180.6)).toBeCloseTo(0, 12)
    expect(legacyDustScale(7200)).toBe(0)
  })

  it('reconstructs sparse site/cycle bursts at exact boundaries with long quiet intervals', () => {
    const births: number[] = []
    for (const site of INDUSTRIAL_SECONDARY_SITES) {
      expect(sampleIndustrialSecondary(site, 180)).toBeNull()
      for (let cycle = 0; cycle < 80; cycle++) {
        const birth = secondaryBirth(site, cycle)
        expect(secondaryBirth(site, cycle)).toEqual(birth)
        expect(birth.atSeconds).toBeGreaterThan(180)
        expect(birth.atSeconds).toBeGreaterThanOrEqual(site.firstCycleAtSeconds + cycle * SECONDARY_CYCLE_SECONDS)
        if (!birth.enabled) {
          expect(sampleIndustrialSecondary(site, birth.atSeconds + 0.1)).toBeNull()
          continue
        }
        births.push(birth.atSeconds)
        expect(sampleIndustrialSecondary(site, birth.atSeconds - 0.0001)).toBeNull()
        expect(sampleIndustrialSecondary(site, birth.atSeconds)?.age).toBe(0)
        const burst = sampleIndustrialSecondary(site, birth.atSeconds + 0.12)!
        expect(burst.flash).toBeCloseTo(1, 8)
        expect(burst.puffScale).toBeGreaterThan(0)
        expect(sampleIndustrialSecondary(site, birth.atSeconds + SECONDARY_LIFETIME_SECONDS + 1e-6)).toBeNull()
        expect(sampleIndustrialSecondary(site, birth.atSeconds + 0.12)).toEqual(burst)
      }
    }
    births.sort((a, b) => a - b)
    for (let i = 1; i < births.length; i++) expect(births[i]! - births[i - 1]! - SECONDARY_LIFETIME_SECONDS).toBeGreaterThanOrEqual(37)
    for (const time of [7200, 240, 1800, 600, 3600, 360, 7200]) expect(INDUSTRIAL_SECONDARY_SITES.map((s) => sampleIndustrialSecondary(s, time))).toHaveLength(2)
  })

  it('samples only recent moving ground contacts and finishes old dust after a stop', () => {
    let samples = 0
    const actor = (time: number) => {
      samples++
      const moving = time < 190
      return { id: 'test-ground-contact', pose: { position: { x: Math.min(time, 190) * 2, y: 1, z: Math.sin(time) }, rotation: { x: 0, y: time / 8, z: 0 } }, speedMetersPerSecond: moving ? 2 : 0, motionDirection: moving ? ('forward' as const) : ('stationary' as const), dustIntensity: moving ? 0.2 : 0 }
    }
    const sample = (time: number) => sampleRecentGroundDust('test-ground-contact', time, actor, 1, 2, (x, z) => x * 0.01 + z * 0.02)
    expect(sample(180)).toEqual([])
    const active = sample(189.9)
    expect(active.length).toBeGreaterThan(0)
    expect(active.length).toBeLessThanOrEqual(AFTERMATH_DUST_SLOTS_PER_ACTOR)
    expect(samples).toBeLessThanOrEqual(AFTERMATH_DUST_SLOTS_PER_ACTOR)
    for (const puff of active) {
      expect(puff.ageSeconds).toBeLessThan(AFTERMATH_DUST_LIFETIME_SECONDS)
      expect(puff.birthAtSeconds).toBeGreaterThanOrEqual(189.9 - AFTERMATH_DUST_LIFETIME_SECONDS)
      expect(puff.scale).toBeGreaterThanOrEqual(0)
    }
    expect(sample(191.5)).toEqual([])
    expect(sample(189.9)).toEqual(active)
    const wider = sampleRecentGroundDust('test-ground-contact', 189.9, actor, 1.5, 2, (x, z) => x * 0.01 + z * 0.02)
    expect(wider[0]?.position).not.toEqual(active[0]?.position)
    expect(sample(189.9)).toEqual(active)
  })

  it('bounds direct-seek caches and follows the actual survivor/support surfaces', () => {
    const families = [
      { id: 'defender_btr_02', sample: (t: number) => sampleRuntimeGroundVehicle('defender_btr_02', t), height: getBtr80PresentationSurfaceHeight },
      { id: 'defender_t72_02', sample: (t: number) => sampleRuntimeGroundVehicle('defender_t72_02', t), height: getT72PresentationSurfaceHeight },
      { id: 'defender_support_logistics_01', sample: (t: number) => sampleRuntimeSupportVehicle('defender_support_logistics_01', t), height: getSupportPresentationSurfaceHeight },
    ]
    for (let i = 0; i < 80; i++)
      for (const family of families) {
        const time = i % 2 ? 7200 - i : 180.6 + i
        const dust = sampleRecentGroundDust(family.id, time, family.sample, 1.1, 2.2, family.height)
        expect(dust.length).toBeLessThanOrEqual(AFTERMATH_DUST_SLOTS_PER_ACTOR)
        expect(dust.every((p) => Object.values(p.position).every(Number.isFinite))).toBe(true)
        expect(getAftermathDustCacheSize()).toBeLessThanOrEqual(AFTERMATH_DUST_CACHE_LIMIT)
      }
    for (const family of families) expect(sampleRecentGroundDust(family.id, 7200, family.sample, 1.1, 2.2, family.height)).toEqual([])
  })
})
