import { describe, expect, it } from 'vitest'

import { adaptScenarioFaction, STAGE1_DURATION_SECONDS, STAGE1_EVENTS, STAGE1_FIXED_SEED } from '.'
import { clampSimulationTime, formatLocalTime, formatSimulationTime, quantizeSimulationTime } from './time'

describe('Stage 1 timeline authority', () => {
  it('contains the exact authoritative event boundaries through 48 seconds', () => {
    expect(STAGE1_DURATION_SECONDS).toBe(48)
    expect(STAGE1_FIXED_SEED).toBe(52730)
    expect(STAGE1_EVENTS.map((event) => event.atSeconds)).toEqual([0, 1, 5, 13, 14, 20, 24, 29, 36, 42, 45, 48])
    expect(STAGE1_EVENTS.map((event) => event.localTime)).toEqual(['05:27:00', '05:27:01', '05:27:05', '05:27:13', '05:27:14', '05:27:20', '05:27:24', '05:27:29', '05:27:36', '05:27:42', '05:27:45', '05:27:48'])
  })

  it('adapts raw scenario sides to the required project faction identifiers', () => {
    expect(adaptScenarioFaction('attacker')).toBe('landings_attacker')
    expect(adaptScenarioFaction('defender')).toBe('island_defender')
  })
})

describe('simulation time formatting', () => {
  it('formats relative and local time at whole and fractional seconds', () => {
    expect(formatSimulationTime(0)).toBe('T+00:00')
    expect(formatSimulationTime(23)).toBe('T+00:23')
    expect(formatSimulationTime(43.2)).toBe('T+00:43.2')
    expect(formatLocalTime(0)).toBe('05:27:00 LOCAL')
    expect(formatLocalTime(23)).toBe('05:27:23 LOCAL')
    expect(formatLocalTime(43.2)).toBe('05:27:43.2 LOCAL')
  })

  it('clamps and quantizes input safely', () => {
    expect(clampSimulationTime(-10)).toBe(0)
    expect(clampSimulationTime(99)).toBe(48)
    expect(clampSimulationTime(Number.POSITIVE_INFINITY)).toBe(48)
    expect(clampSimulationTime(Number.NaN)).toBe(0)
    expect(quantizeSimulationTime(12.26)).toBeCloseTo(12.3)
  })
})
