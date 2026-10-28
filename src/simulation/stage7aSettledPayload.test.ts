import { beforeAll, describe, expect, it } from 'vitest'

import { deriveLandingWorldState } from './landingCraft'
import { LAV_IDS } from './landingCraftData'
import { deriveRuntimeLavPayload, getLavRoadCacheBounds } from './lavAftermath'
import { deriveRuntimeWorldState } from './runtime'
beforeAll(() => {
  deriveRuntimeWorldState(0)
})
beforeAll(() => {
  deriveRuntimeWorldState(188)
})
beforeAll(() => {
  deriveRuntimeWorldState(360)
})
describe('finite exact settled LAV payload records', () => {
  it('retains at most eight time-independent records after the last dust expires, without altering moving or historical states', () => {
    const landing = deriveLandingWorldState(180)
    for (const id of LAV_IDS) {
      const index = LAV_IDS.indexOf(id),
        craft = landing.crafts[index < 4 ? 'attacker_lcac_01' : 'attacker_lcac_02'],
        slot = index % 4
      const held = deriveRuntimeLavPayload(craft, id, slot, 600),
        before = JSON.stringify(held)
      expect(held.runtimeActivity).toBe('holding')
      expect(deriveRuntimeLavPayload(craft, id, slot, 7200)).toBe(held)
      const moving = deriveRuntimeLavPayload(craft, id, slot, held.roadHoldAtSeconds! - 0.01)
      expect(moving).not.toBe(held)
      expect(moving.speedMetersPerSecond).toBeGreaterThan(0)
      expect(JSON.stringify(held)).toBe(before)
      expect(deriveRuntimeLavPayload(craft, id, slot, 180).runtimeActivity).toBeUndefined()
    }
    expect(getLavRoadCacheBounds().settledPayloads).toBe(8)
  })
  it('invalidates the finite slot when the actual carrier reference pose changes and keeps the prior snapshot immutable', () => {
    const craft = deriveLandingWorldState(180).crafts.attacker_lcac_01
    const original = deriveRuntimeLavPayload(craft, 'attacker_lav_01', 0, 600),
      bytes = JSON.stringify(original)
    const changed = { ...craft, pose: { ...craft.pose, position: { ...craft.pose.position, x: craft.pose.position.x + 0.125 } } }
    const next = deriveRuntimeLavPayload(changed, 'attacker_lav_01', 0, 7200)
    expect(next).not.toBe(original)
    expect(next.localPose).not.toEqual(original.localPose)
    expect(next.pose).toEqual(original.pose)
    expect(next.wheels).toEqual(original.wheels)
    expect(JSON.stringify(original)).toBe(bytes)
    expect(JSON.stringify(deriveRuntimeLavPayload(craft, 'attacker_lav_01', 0, 3600))).toBe(bytes)
    expect(getLavRoadCacheBounds().settledPayloads).toBeLessThanOrEqual(8)
  })
})
