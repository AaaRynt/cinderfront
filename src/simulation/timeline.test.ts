import { describe, expect, it } from 'vitest'

import { adaptScenarioFaction, getReachedSimulationEvents, SIMULATION_DURATION_SECONDS, SIMULATION_EVENTS, STAGE1_DURATION_SECONDS, STAGE1_EVENTS, STAGE1_FIXED_SEED, STAGE3_EVENTS, STAGE4B_EVENTS } from '.'
import { clampSimulationTime, clampStage1Time, formatLocalTime, formatSimulationTime, quantizeSimulationTime } from './time'

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
    expect(clampSimulationTime(99)).toBe(99)
    expect(clampSimulationTime(999)).toBe(SIMULATION_DURATION_SECONDS)
    expect(clampSimulationTime(Number.POSITIVE_INFINITY)).toBe(SIMULATION_DURATION_SECONDS)
    expect(clampSimulationTime(Number.NaN)).toBe(0)
    expect(clampStage1Time(99)).toBe(STAGE1_DURATION_SECONDS)
    expect(quantizeSimulationTime(12.26)).toBeCloseTo(12.3)
  })
})

describe('Stage 3 timeline authority', () => {
  it('uses the exact in-scope event boundaries through Molniya open water', () => {
    expect(SIMULATION_DURATION_SECONDS).toBe(172)
    expect(STAGE3_EVENTS.map((event) => event.atSeconds)).toEqual([52, 62, 72, 78, 86, 92, 94, 98, 100, 115, 116, 128, 132, 165, 172])
    expect(STAGE3_EVENTS.map((event) => event.localTime)).toEqual(['05:27:52', '05:28:02', '05:28:12', '05:28:18', '05:28:26', '05:28:32', '05:28:34', '05:28:38', '05:28:40', '05:28:55', '05:28:56', '05:29:08', '05:29:12', '05:29:45', '05:29:52'])
  })
})

describe('Stage 4B timeline authority', () => {
  it('keeps the BTR slice and adds the three exact armored-reinforcement events without extending the simulation', () => {
    expect(SIMULATION_DURATION_SECONDS).toBe(172)
    expect(STAGE4B_EVENTS.map((event) => event.id)).toEqual(['btr_01_disabled', 'btr_survivors_fallback', 'defender_armored_reinforcement_move', 't72_lead_destroyed', 't72_survivors_withdraw'])
    expect(STAGE4B_EVENTS.map((event) => event.atSeconds)).toEqual([133, 136, 150, 158, 163])
    expect(STAGE4B_EVENTS.map((event) => event.localTime)).toEqual(['05:29:13', '05:29:16', '05:29:30', '05:29:38', '05:29:43'])
    expect(STAGE4B_EVENTS.map((event) => event.groupId)).toEqual(['defender_btr_group_01', 'defender_btr_group_01', 'defender_t72_group_01', 'defender_t72_group_01', 'defender_t72_group_01'])
    expect(STAGE4B_EVENTS.filter((event) => event.id === 't72_lead_destroyed')[0]).toMatchObject({ sourceActorId: 'attacker_f35_01', targetId: 'defender_t72_01' })
  })

  it('keeps the combined event stream chronological around the BTR events and later Stage 3 events', () => {
    expect(SIMULATION_EVENTS.map((event) => event.atSeconds)).toEqual([0, 1, 5, 13, 14, 20, 24, 29, 36, 42, 45, 48, 52, 62, 72, 78, 86, 92, 94, 98, 100, 115, 116, 128, 132, 133, 136, 150, 158, 163, 165, 172])

    expect(getReachedSimulationEvents(132.9).at(-1)?.id).toBe('ammunition_storage_primary_detonation')
    expect(getReachedSimulationEvents(133).at(-1)?.id).toBe('btr_01_disabled')
    expect(getReachedSimulationEvents(135.9).at(-1)?.id).toBe('btr_01_disabled')
    expect(getReachedSimulationEvents(136).at(-1)?.id).toBe('btr_survivors_fallback')
    expect(getReachedSimulationEvents(149.9).at(-1)?.id).toBe('btr_survivors_fallback')
    expect(getReachedSimulationEvents(150).at(-1)?.id).toBe('defender_armored_reinforcement_move')
    expect(getReachedSimulationEvents(157.9).at(-1)?.id).toBe('defender_armored_reinforcement_move')
    expect(getReachedSimulationEvents(158).at(-1)?.id).toBe('t72_lead_destroyed')
    expect(getReachedSimulationEvents(162.9).at(-1)?.id).toBe('t72_lead_destroyed')
    expect(getReachedSimulationEvents(163).at(-1)?.id).toBe('t72_survivors_withdraw')
    expect(getReachedSimulationEvents(165).at(-1)?.id).toBe('talwar_severe_list')
    expect(getReachedSimulationEvents(172).at(-1)?.id).toBe('molniya_open_water')
  })
})
