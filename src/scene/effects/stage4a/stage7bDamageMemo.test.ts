import { describe, expect, it } from 'vitest'

import { FuelDamageAftermath } from './FuelDamageAftermath'
import { STAGE4A_FUEL_ESCALATION_SCHEDULE } from './fuelDisasterMath'

const compare = (FuelDamageAftermath as unknown as { compare: (a: { surfaceHeightAt: (x: number, z: number) => number; timeSeconds: number }, b: { surfaceHeightAt: (x: number, z: number) => number; timeSeconds: number }) => boolean }).compare
const surfaceHeightAt = (x: number, z: number) => x * 0.01 + z * 0.03
const at = (timeSeconds: number) => ({ surfaceHeightAt, timeSeconds })
describe('persistent damage memo visibility boundaries', () => {
  it('invalidates at every scorch, tank, rupture, rack and bund boundary in both time directions', () => {
    for (const time of [...STAGE4A_FUEL_ESCALATION_SCHEDULE.map((event) => event.atSeconds), 86, 92, 95.2, 97.1, 101.4, 103.2, 109.8, 112, 78, 81.2, 88.6, 105.6, 97.6]) {
      expect(compare(at(time - 1e-8), at(time)), String(time)).toBe(false)
      expect(compare(at(time), at(time - 1e-8)), String(time)).toBe(false)
      expect(compare(at(time), at(time + 1e-8)), String(time)).toBe(true)
    }
  })
  it('reuses only identical rendered phases and the same terrain authority', () => {
    expect(compare(at(360), at(7200))).toBe(true)
    expect(compare(at(92.1), at(92.2))).toBe(true)
    expect(compare(at(0), at(7200))).toBe(false)
    expect(compare(at(360), { ...at(360), surfaceHeightAt: () => 12 })).toBe(false)
  })
})
