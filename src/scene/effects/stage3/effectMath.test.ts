import { describe, expect, it } from 'vitest'

import type { BlastResponseDescriptor } from './types.ts'

import { AMMUNITION_COOKOFF_OFFSETS_SECONDS, FUEL_HERO_TIME_SECONDS, createBallisticFragments, createBlastResponseLayout, createGroundFires, cyclicParticleEnvelope, sampleBallisticFragment, sampleBlastResponse, shockArrivalSeconds, shockRadiusAt } from './effectMath.ts'

describe('Stage 3 deterministic effect descriptors', () => {
  it('creates a fixed fuel debris field with repeatable analytical arcs', () => {
    const first = createBallisticFragments('fuel-test', 14, 'fuel')
    const second = createBallisticFragments('fuel-test', 14, 'fuel')

    expect(first).toEqual(second)
    expect(first).toHaveLength(14)
    expect(first.every((fragment) => fragment.lifetimeSeconds >= 3 && fragment.lifetimeSeconds <= 8)).toBe(true)
    expect(first.filter((fragment) => fragment.burning).length / first.length).toBeGreaterThanOrEqual(0.45)
    expect(first.filter((fragment) => fragment.burning).length / first.length).toBeLessThanOrEqual(0.7)
    expect(first.every((fragment) => Math.abs(sampleBallisticFragment(fragment, fragment.lifetimeSeconds).position[1]) < 1e-8)).toBe(true)

    const fragment = first[0]
    const initial = sampleBallisticFragment(fragment, 0)
    const ascending = sampleBallisticFragment(fragment, 0.5)
    expect(ascending.position[1]).toBeGreaterThan(initial.position[1])
    expect(sampleBallisticFragment(fragment, 1.25)).toEqual(sampleBallisticFragment(fragment, 1.25))
  })

  it('gives the ammunition primary high, fragment-heavy arcs', () => {
    const fragments = createBallisticFragments('ammunition-test', 26, 'ammunition')
    expect(fragments).toHaveLength(26)
    expect(fragments.every((fragment) => fragment.lifetimeSeconds >= 6 && fragment.lifetimeSeconds <= 9)).toBe(true)
    expect(fragments.every((fragment) => sampleBallisticFragment(fragment, fragment.lifetimeSeconds * 0.5).position[1] > 30)).toBe(true)
    expect(fragments.every((fragment) => Math.abs(sampleBallisticFragment(fragment, fragment.lifetimeSeconds).position[1]) < 1e-8)).toBe(true)
    expect(fragments.filter((fragment) => fragment.burning).length / fragments.length).toBeGreaterThanOrEqual(0.3)
    expect(fragments.filter((fragment) => fragment.burning).length / fragments.length).toBeLessThanOrEqual(0.55)
  })

  it('keeps ground fire placement fixed for a given seed', () => {
    const first = createGroundFires('compound', 10, 168)
    expect(first).toEqual(createGroundFires('compound', 10, 168))
    expect(first).toHaveLength(10)
    expect(first.every((fire) => Math.hypot(fire.offset[0], fire.offset[2]) <= 168)).toBe(true)
  })

  it('hides recycled smoke at both ends of each fixed-pool cycle', () => {
    expect(cyclicParticleEnvelope(0)).toBe(0)
    expect(cyclicParticleEnvelope(0.5)).toBe(1)
    expect(cyclicParticleEnvelope(1)).toBe(0)
  })

  it('uses a bounded physical shock radius and distance-based arrival', () => {
    expect(shockRadiusAt(-1, 620, 1.8)).toBe(0)
    expect(shockRadiusAt(0.9, 620, 1.8)).toBeCloseTo(310)
    expect(shockRadiusAt(0.45, 620, 1.8)).toBeCloseTo(155)
    expect(shockRadiusAt(1.35, 620, 1.8)).toBeCloseTo(465)
    expect(shockRadiusAt(1.8, 620, 1.8)).toBe(620)
    expect(shockRadiusAt(12, 620, 1.8)).toBe(620)
    expect(shockArrivalSeconds(310, FUEL_HERO_TIME_SECONDS)).toBeCloseTo(FUEL_HERO_TIME_SECONDS + 0.9)
  })

  it('bends away, rebounds through an overshoot, and settles from absolute time', () => {
    const descriptor: BlastResponseDescriptor = {
      burns: true,
      distanceFromBlastM: 120,
      id: 'response-test',
      kind: 'scrub',
      phase: 1.2,
      position: [120, 0, 0],
      scale: [3, 3, 3],
      yawRadians: 0,
    }
    const arrival = shockArrivalSeconds(descriptor.distanceFromBlastM, FUEL_HERO_TIME_SECONDS)

    expect(sampleBlastResponse(descriptor, arrival - 0.001).bendRadians).toBe(0)
    expect(sampleBlastResponse(descriptor, arrival + 0.2).bendRadians).toBeGreaterThan(0)
    expect((sampleBlastResponse(descriptor, arrival + 0.24).bendRadians * 180) / Math.PI).toBeGreaterThanOrEqual(10)
    expect((sampleBlastResponse(descriptor, arrival + 0.24).bendRadians * 180) / Math.PI).toBeLessThanOrEqual(32)
    expect(sampleBlastResponse(descriptor, arrival + 0.95).bendRadians).toBeLessThan(0)
    expect(Math.abs(sampleBlastResponse(descriptor, arrival + 10).bendRadians)).toBeLessThan(0.002)
    expect(sampleBlastResponse(descriptor, arrival + 6).ignitionActive).toBe(true)
    expect(sampleBlastResponse(descriptor, arrival + 6).charred).toBe(true)

    const edgeDescriptor: BlastResponseDescriptor = { ...descriptor, distanceFromBlastM: 320, phase: -Math.PI / 2, position: [320, 0, 0] }
    const edgeArrival = shockArrivalSeconds(edgeDescriptor.distanceFromBlastM, FUEL_HERO_TIME_SECONDS)
    const edgePeakDegrees = (sampleBlastResponse(edgeDescriptor, edgeArrival + 0.24).bendRadians * 180) / Math.PI
    expect(edgePeakDegrees).toBeGreaterThanOrEqual(10)
    expect(edgePeakDegrees).toBeLessThanOrEqual(32)
  })

  it('builds the bounded industrial response layout deterministically', () => {
    const options = { origin: [500, 4, -250] as const, responseRadiusM: 320, seed: 'layout-test' }
    const first = createBlastResponseLayout(options)
    expect(first).toEqual(createBlastResponseLayout(options))
    expect(first).toHaveLength(63)
    expect(first.every((descriptor) => descriptor.distanceFromBlastM <= 320)).toBe(true)
    expect(first.some((descriptor) => descriptor.kind === 'light-pole')).toBe(true)
    expect(first.some((descriptor) => descriptor.kind === 'fence')).toBe(true)
    expect(first.some((descriptor) => descriptor.kind === 'antenna')).toBe(true)
    expect(first.some((descriptor) => descriptor.burns)).toBe(true)
  })

  it('uses seven non-periodic preliminary cookoff times', () => {
    const intervals = AMMUNITION_COOKOFF_OFFSETS_SECONDS.slice(1).map((offset, index) => Number((offset - AMMUNITION_COOKOFF_OFFSETS_SECONDS[index]).toFixed(2)))
    expect(AMMUNITION_COOKOFF_OFFSETS_SECONDS).toHaveLength(7)
    expect(new Set(intervals).size).toBeGreaterThan(4)
    expect(AMMUNITION_COOKOFF_OFFSETS_SECONDS[0]).toBeGreaterThanOrEqual(0.4)
    expect(AMMUNITION_COOKOFF_OFFSETS_SECONDS[0]).toBeLessThanOrEqual(1.8)
    expect(intervals.every((interval) => interval >= 0.4 && interval <= 1.8)).toBe(true)
    expect(AMMUNITION_COOKOFF_OFFSETS_SECONDS.at(-1)).toBeLessThan(16)
  })
})
