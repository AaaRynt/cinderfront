import { describe, expect, it } from 'vitest'

import { deriveRuntimeWorldState } from './runtime'
import { normalizeRuntimeTime, quantizeRuntimeTime, runtimeProgress, formatRuntimeTime, formatRuntimeLocalTime } from './runtimeTime'
import { createSimulationStore, getSimulationWorldState, selectSimulationWorldState } from './store'
import { SIMULATION_EVENTS } from './timeline'
const finite = (v: unknown): boolean => (typeof v === 'number' ? Number.isFinite(v) : Array.isArray(v) ? v.every(finite) : v && typeof v === 'object' ? Object.values(v).every(finite) : true)
describe('one indefinite observation clock', () => {
  it.each([0.5, 1, 2] as const)('preserves180overshoot and resume at%s×', (speed) => {
    const s = createSimulationStore({ timeSeconds: 179.9, isPlaying: true, speed })
    s.getState().tick(0.5 / speed)
    expect(s.getState().timeSeconds).toBeCloseTo(180.4)
    expect(s.getState().isPlaying).toBe(true)
    expect(getSimulationWorldState(s).runtime).toMatchObject({ scriptedSeconds: 180, aftermathSeconds: expect.closeTo(0.4), phase: 'aftermath' })
    expect(selectSimulationWorldState(s.getState())).toBe(getSimulationWorldState(s))
    s.getState().pause()
    s.getState().tick(3)
    expect(s.getState().timeSeconds).toBeCloseTo(180.4)
    s.getState().play()
    s.getState().tick(0.1 / speed)
    expect(s.getState().timeSeconds).toBeCloseTo(180.5)
    s.getState().seek(160)
    expect(s.getState().isPlaying).toBe(true)
    s.getState().restart()
    expect(s.getState()).toMatchObject({ timeSeconds: 0, isPlaying: false })
  })
  it('handles finite negatives, nonfinite seek/tick and overflowing tick deliberately', () => {
    const s = createSimulationStore({ timeSeconds: 180, isPlaying: true, speed: 2 })
    for (const n of [NaN, Infinity, -Infinity]) {
      s.getState().seek(n)
      expect(s.getState().timeSeconds).toBe(180)
      s.getState().tick(n)
      expect(s.getState().timeSeconds).toBe(180)
    }
    s.getState().tick(Number.MAX_VALUE)
    expect(s.getState().timeSeconds).toBe(180)
    s.getState().seek(-2)
    expect(s.getState().timeSeconds).toBe(0)
    expect(normalizeRuntimeTime(Infinity)).toBe(0)
    expect(quantizeRuntimeTime(7200.14)).toBe(7200.1)
    expect(runtimeProgress(7200)).toEqual({ observationSeconds: 7200, scriptedSeconds: 180, aftermathSeconds: 7020, phase: 'aftermath' })
  })
  it('formats observation/aftermath and wraps local day without replaying history', () => {
    expect(formatRuntimeTime(180.4)).toBe('T+03:00.4')
    expect(formatRuntimeTime(7200)).toBe('T+120:00')
    expect(formatRuntimeLocalTime(7200)).toBe('07:27:00 LOCAL')
    expect(formatRuntimeLocalTime(66780)).toBe('00:00:00 LOCAL')
    expect(formatRuntimeLocalTime(86400.1)).toBe('05:27:00.1 LOCAL')
  })
  it('reconstructs arbitrary late and backward seeks with exact events, bounded state and continuing activity', () => {
    const times = [180, 188, 240, 360, 600, 1800, 3600, 7200]
    const captured = new Map(times.map((t) => [t, JSON.stringify(deriveRuntimeWorldState(t))]))
    for (const t of [...times].reverse()) {
      const w = deriveRuntimeWorldState(t)
      expect(JSON.stringify(w)).toBe(captured.get(t))
      expect(finite(w)).toBe(true)
      expect(w.reachedEvents).toEqual(SIMULATION_EVENTS)
      expect(w.reachedEvents.at(-1)?.id).toBe('scripted_phase_complete')
      expect(w.stage3.industrial.fuelCascade.flashIntensity).toBe(0)
      expect(w.stage3.industrial.ammunitionPrimary.activeDebrisCount).toBe(0)
    }
    for (const t of [179, 160, 0, 7200, 180]) expect(deriveRuntimeWorldState(t).reachedEvents).toEqual(SIMULATION_EVENTS.filter((e) => e.atSeconds <= t))
    const a = deriveRuntimeWorldState(7200),
      b = deriveRuntimeWorldState(7201)
    expect(a.wasp.pose).not.toEqual(b.wasp.pose)
    expect(a.radar.secondaryDishRotationRadians).not.toBe(b.radar.secondaryDishRotationRadians)
    expect(a.landing.crafts.attacker_lcac_01.mechanics.fanRotationRadians).not.toBe(b.landing.crafts.attacker_lcac_01.mechanics.fanRotationRadians)
    expect(b.stage3.talwar).toEqual(a.stage3.talwar)
  })
})
