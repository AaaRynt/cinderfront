export interface IndustrialSecondarySite {
  readonly id: 'fuel-manifold' | 'ammunition-remains'
  readonly positionXZ: readonly [number, number]
  readonly firstCycleAtSeconds: number
  readonly seed: number
}

/** Two existing damaged areas, one optional minor burst per 96-second cycle.
 * Alternating offsets retain at least 37 seconds between any two births. */
export const INDUSTRIAL_SECONDARY_SITES: readonly IndustrialSecondarySite[] = [
  { id: 'fuel-manifold', positionXZ: [400, 2025], firstCycleAtSeconds: 213, seed: 52730 },
  { id: 'ammunition-remains', positionXZ: [1300, 1800], firstCycleAtSeconds: 261, seed: 98417 },
]
export const SECONDARY_CYCLE_SECONDS = 96
export const SECONDARY_LIFETIME_SECONDS = 3.4
export const SECONDARY_PUFFS_PER_SITE = 3

// Integer mixing consumes only a site seed and cycle index; no random state,
// accumulated births, event handlers or playback history is retained.
function cycleHash(seed: number, cycle: number) {
  let value = (seed ^ (cycle >>> 0)) >>> 0
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  return (value ^ (value >>> 16)) >>> 0
}
export function secondaryBirth(site: IndustrialSecondarySite, cycle: number) {
  const mixed = cycleHash(site.seed, cycle)
  return {
    atSeconds: site.firstCycleAtSeconds + cycle * SECONDARY_CYCLE_SECONDS + ((mixed >>> 2) % 701) / 100,
    enabled: (mixed & 3) !== 0,
    scale: 0.7 + ((mixed >>> 13) % 301) / 1000,
    offsetX: ((mixed >>> 6) % 1201) / 100 - 6,
    offsetZ: ((mixed >>> 18) % 1001) / 100 - 5,
  }
}
export function sampleIndustrialSecondary(site: IndustrialSecondarySite, runtime: number) {
  if (!Number.isFinite(runtime) || runtime < site.firstCycleAtSeconds) return null
  const cycle = Math.floor((runtime - site.firstCycleAtSeconds) / SECONDARY_CYCLE_SECONDS)
  const birth = secondaryBirth(site, cycle)
  const age = runtime - birth.atSeconds
  if (!birth.enabled || age < 0 || age >= SECONDARY_LIFETIME_SECONDS) return null
  const fade = Math.sin((Math.PI * age) / SECONDARY_LIFETIME_SECONDS)
  return {
    ...birth,
    cycle,
    age,
    siteId: site.id,
    flash: age < 0.24 ? Math.sin((Math.PI * age) / 0.24) : 0,
    puffScale: (0.5 + age * 1.2) * fade * birth.scale,
    x: site.positionXZ[0] + birth.offsetX,
    z: site.positionXZ[1] + birth.offsetZ,
  }
}
