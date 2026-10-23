import { describe, expect, it } from 'vitest'

import { sampleCoastalMotion } from '../scene/world/stage4c/coastalWater'
import { SCRIPTED_DURATION_SECONDS, SIMULATION_DURATION_SECONDS, STAGE1_DURATION_SECONDS, STAGE3_DURATION_SECONDS, STAGE4B2C_DURATION_SECONDS } from './constants'
import { deriveSimulationWorldState, deriveStage1WorldState, deriveWaspState } from './derive'
import { deriveRuntimeWorldState } from './runtime'
import { createSimulationStore, getSimulationWorldState } from './store'
import { clampSimulationTime, clampStage1Time, formatLocalTime, formatSimulationTime, quantizeSimulationTime } from './time'

function finite(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(finite)
  if (value && typeof value === 'object') return Object.values(value).every(finite)
  return true
}
describe('historical finite APIs and active runtime handoff', () => {
  it('keeps historical durations/APIs frozen and admits exact 176/180 boundaries and invalid input cases', () => {
    expect([STAGE1_DURATION_SECONDS, STAGE3_DURATION_SECONDS, STAGE4B2C_DURATION_SECONDS]).toEqual([48, 172, 176])
    expect(SCRIPTED_DURATION_SECONDS).toBe(180)
    expect(SIMULATION_DURATION_SECONDS).toBe(180)
    for (const input of [-Infinity, -1, NaN]) expect(clampSimulationTime(input)).toBe(0)
    for (const input of [180, 180.1, 999, Infinity]) expect(clampSimulationTime(input)).toBe(180)
    expect(clampSimulationTime(176.1)).toBe(176.1)
    expect(clampStage1Time(180)).toBe(48)
    expect(deriveStage1WorldState(180)).toEqual(deriveStage1WorldState(48))
    expect(deriveWaspState(180)).toEqual(deriveWaspState(48))
    expect(quantizeSimulationTime(179.96)).toBe(180)
    expect(quantizeSimulationTime(Infinity)).toBe(180)
    expect(formatSimulationTime(180)).toBe('T+03:00')
    expect(formatLocalTime(180)).toBe('05:30:00 LOCAL')
  })
  it.each([0.5, 1, 2] as const)('passes 176 and 180 with overshoot, and reconstructs controls at %s×', (speed) => {
    const store = createSimulationStore({ timeSeconds: 175.9, isPlaying: true, speed })
    store.getState().tick(0.2 / speed)
    expect(store.getState().timeSeconds).toBeCloseTo(176.1)
    expect(store.getState().isPlaying).toBe(true)
    store.getState().tick(100)
    expect(store.getState().timeSeconds).toBeCloseTo(176.1 + 100 * speed)
    expect(store.getState().isPlaying).toBe(true)
    const endpoint = getSimulationWorldState(store)
    expect(endpoint.reachedEvents.at(-1)?.id).toBe('scripted_phase_complete')
    store.getState().play()
    store.getState().tick(100)
    expect(getSimulationWorldState(store).timeSeconds).toBeCloseTo(endpoint.timeSeconds + 100 * speed)
    for (const time of [179.9, 176, 165.9, 160.1, 0, 180, 159.9, 166.1, 175.9]) {
      store.getState().seek(time)
      expect(getSimulationWorldState(store)).toEqual(deriveRuntimeWorldState(time))
      store.getState().pause()
      const paused = getSimulationWorldState(store)
      for (const dt of [0.2, 1, NaN, Infinity, -1, 0]) store.getState().tick(dt)
      expect(getSimulationWorldState(store)).toEqual(paused)
    }
    store.getState().restart()
    expect(getSimulationWorldState(store)).toEqual(deriveRuntimeWorldState(0))
    expect(store.getState().isPlaying).toBe(false)
  })
  it('continues survivors/effects through the new four seconds with stable losses and a terminal Wasp tangent', () => {
    const before = deriveSimulationWorldState(176),
      end = deriveSimulationWorldState(180)
    for (let i = 0; i <= 160; i++) {
      const t = 176 + i / 40,
        world = deriveSimulationWorldState(t)
      expect(finite(world), `all fields finite at ${t}`).toBe(true)
      expect(world.secondaryPantsir.pose).toEqual(before.secondaryPantsir.pose)
      expect(world.secondaryPantsir.condition).toBe('destroyed')
      expect(world.stage4b.t72Group.destroyedCount).toBe(1)
      expect(world.stage4b.btrGroup.disabledCount).toBe(1)
      expect(world.aircraft.defender_su30_01.visible).toBe(false)
      expect(world.aircraft.defender_su30_02.visible).toBe(false)
      for (const id of world.landing.orderedCraftIds) {
        expect(world.landing.crafts[id].pose).toEqual(before.landing.crafts[id].pose)
        expect(world.landing.crafts[id].mechanics.bowRampAngleRadians).toBe(before.landing.crafts[id].mechanics.bowRampAngleRadians)
        expect(world.landing.crafts[id].mechanics.bowRampReady).toBe(true)
      }
    }
    expect(end.wasp.pose.position).not.toEqual(before.wasp.pose.position)
    expect(end.aircraft.attacker_f35_01.pose.position).not.toEqual(before.aircraft.attacker_f35_01.pose.position)
    expect(end.stage3.molniya.pose.position).not.toEqual(before.stage3.molniya.pose.position)
    expect(end.stage4b2c.convoy).not.toEqual(before.stage4b2c.convoy)
    expect(end.landing.crafts.attacker_lcac_01.mechanics.fanRotationRadians).toBeGreaterThan(before.landing.crafts.attacker_lcac_01.mechanics.fanRotationRadians)
    const near = deriveSimulationWorldState(179.999).wasp.pose.rotation.y
    expect(Math.abs(Math.atan2(Math.sin(end.wasp.pose.rotation.y - near), Math.cos(end.wasp.pose.rotation.y - near)))).toBeLessThan(1e-6)
    expect(sampleCoastalMotion(4500, -3300, 180)).not.toEqual(sampleCoastalMotion(4500, -3300, 176))
    expect(deriveSimulationWorldState(181)).toEqual(end)
  })
})
