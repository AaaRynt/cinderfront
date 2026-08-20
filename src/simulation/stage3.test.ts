import { describe, expect, it } from 'vitest'

import { deriveAircraftState, deriveFixedAaaState, derivePantsirState, derivePersistentState, deriveRadarState, deriveSimulationWorldState, deriveStage1WorldState, deriveStage3WorldState, deriveTransientEffects, deriveWaspState } from './derive'
import { AMMUNITION_COOKOFF_SCHEDULE, AMMUNITION_HERO_DESCRIPTOR, FUEL_GROUND_FIRE_SCHEDULE, FUEL_STORAGE_HERO_DESCRIPTOR, MOLNIYA_BERTH_POSITION } from './stage3'

describe('Stage 3 deterministic world state', () => {
  it('preserves the completed Stage 1 derivation boundary while the combined runtime continues', () => {
    const openingBoundary = deriveStage1WorldState(172)
    const combined = deriveSimulationWorldState(60)

    expect(openingBoundary.timeSeconds).toBe(48)
    expect(openingBoundary.reachedEvents.at(-1)?.id).toBe('harbor_first_hit')
    expect(combined.timeSeconds).toBe(60)
    expect(combined.fixedAaa.phase).toBe('ceased')
    expect(combined.fixedAaa.isFiring).toBe(false)
    expect(combined.aircraft.attacker_f35_01.pose.position).not.toEqual(openingBoundary.aircraft.attacker_f35_01.pose.position)
    expect(combined.aircraft.attacker_f35_02.pose.position).not.toEqual(openingBoundary.aircraft.attacker_f35_02.pose.position)
  })

  it('keeps every public Stage 1 helper frozen at T+48', () => {
    expect(deriveWaspState(172)).toEqual(deriveWaspState(48))
    expect(deriveAircraftState('attacker_f35_01', 172)).toEqual(deriveAircraftState('attacker_f35_01', 48))
    expect(deriveAircraftState('attacker_f35_02', 172)).toEqual(deriveAircraftState('attacker_f35_02', 48))
    expect(deriveRadarState(172)).toEqual(deriveRadarState(48))
    expect(derivePantsirState(172)).toEqual(derivePantsirState(48))
    expect(deriveFixedAaaState(172)).toEqual(deriveFixedAaaState(48))
    expect(derivePersistentState(172)).toEqual(derivePersistentState(48))
    expect(deriveTransientEffects(172)).toEqual(deriveTransientEffects(48))
  })

  it('derives monotonic Talwar hits, leak, list, flooding, and final mission-kill state', () => {
    const before = deriveStage3WorldState(71.999).talwar
    const firstHit = deriveStage3WorldState(72).talwar
    const leak = deriveStage3WorldState(100).talwar
    const secondHit = deriveStage3WorldState(115).talwar
    const late = deriveStage3WorldState(150).talwar
    const final = deriveStage3WorldState(165).talwar

    expect(before.hitCount).toBe(0)
    expect(firstHit.hitCount).toBe(1)
    expect(firstHit.phase).toBe('first-hit-damaged')
    expect(leak.phase).toBe('burning-and-leaking')
    expect(leak.fuelLeakProgress).toBe(0)
    expect(deriveStage3WorldState(100).harbor.fuelContaminationVisible).toBe(true)
    expect(deriveStage3WorldState(100).harbor.fuelSheenRadiusMeters).toBeGreaterThan(0)
    expect(deriveStage3WorldState(101).talwar.fuelLeakProgress).toBeGreaterThan(0)
    expect(secondHit.hitCount).toBe(2)
    expect(secondHit.phase).toBe('second-hit-severe-damage')
    expect(Math.abs(late.listRadians)).toBeGreaterThan(Math.abs(secondHit.listRadians))
    expect(late.floodingProgress).toBeGreaterThan(secondHit.floodingProgress)
    expect(final.missionKilled).toBe(true)
    expect(final.phase).toBe('mission-killed-partially-flooded')
    expect(final.floodingProgress).toBe(1)
    expect(final.immersionMeters).toBeCloseTo(3.1)
    expect(Math.abs(final.listRadians)).toBeCloseTo((14 * Math.PI) / 180)
    expect(final.pose.position.y).toBeGreaterThan(-4)
  })

  it('moves Molniya continuously from the safe berth into the channel and preserves its damaged escape', () => {
    const before = deriveStage3WorldState(61.999).molniya
    const departure = deriveStage3WorldState(62).molniya
    const accelerating = deriveStage3WorldState(68).molniya
    const beforeDamage = deriveStage3WorldState(127.999).molniya
    const damaged = deriveStage3WorldState(128).molniya
    const beforeOpenWater = deriveStage3WorldState(171.999).molniya
    const escaped = deriveStage3WorldState(172).molniya

    expect(before.pose.position).toEqual(MOLNIYA_BERTH_POSITION)
    expect(departure.pose.position).toEqual(MOLNIYA_BERTH_POSITION)
    expect(departure.phase).toBe('departing-berth')
    expect(accelerating.pathProgress).toBeGreaterThan(0)
    expect(accelerating.speedMetersPerSecond).toBeGreaterThan(0)
    expect(accelerating.wakeStrength).toBeGreaterThan(0)
    expect(beforeDamage.damaged).toBe(false)
    expect(damaged.damaged).toBe(true)
    expect(damaged.mobile).toBe(true)
    expect(damaged.phase).toBe('damaged-mobile-with-smoke')
    expect(beforeOpenWater.escaped).toBe(false)
    expect(escaped.pose.position).toEqual({ x: -5550, y: 0.2, z: 3350 })
    expect(escaped.pathProgress).toBe(1)
    expect(escaped.escaped).toBe(true)
    expect(escaped.damaged).toBe(true)
    expect(escaped.mobile).toBe(true)
  })

  it('uses fixed bounded hero descriptors and an irregular deterministic cook-off schedule', () => {
    expect(FUEL_STORAGE_HERO_DESCRIPTOR.debrisCount).toBe(14)
    expect(FUEL_STORAGE_HERO_DESCRIPTOR.flamingDebrisCount).toBe(8)
    expect(FUEL_STORAGE_HERO_DESCRIPTOR.groundFireCount).toBe(FUEL_GROUND_FIRE_SCHEDULE.length)
    expect(AMMUNITION_HERO_DESCRIPTOR.debrisCount).toBe(26)
    expect(AMMUNITION_COOKOFF_SCHEDULE).toHaveLength(9)

    const intervals = AMMUNITION_COOKOFF_SCHEDULE.slice(1).map((pulse, index) => pulse.atSeconds - AMMUNITION_COOKOFF_SCHEDULE[index].atSeconds)
    expect(intervals.every((interval) => interval >= 0.4 && interval <= 1.8)).toBe(true)
    expect(new Set(intervals.map((interval) => interval.toFixed(2))).size).toBeGreaterThan(3)

    const duringCookoff = deriveStage3WorldState(125.3).industrial
    const afterPrimary = deriveStage3WorldState(140).industrial
    expect(duringCookoff.ammunitionCookoffActive).toBe(true)
    expect(duringCookoff.ammunitionCookoffPulses.filter((pulse) => pulse.reached).length).toBe(7)
    expect(afterPrimary.ammunitionPrimary.reached).toBe(true)
    expect(afterPrimary.ammunitionCompoundDestroyed).toBe(true)
    expect(afterPrimary.fuelCascade.persistentSmokeIntensity).toBe(1)
    expect(afterPrimary.groundFires.every((fire) => fire.active)).toBe(true)
  })

  it('reconstructs identical state by direct seek without accumulated effects', () => {
    const first = deriveSimulationWorldState(132.4)
    const second = deriveSimulationWorldState(132.4)
    expect(first).toEqual(second)
    expect(first.stage3.talwar.hitCount).toBe(2)
    expect(first.stage3.molniya.damaged).toBe(true)
    expect(first.stage3.industrial.ammunitionPrimary.reached).toBe(true)
    expect(first.stage3.industrial.groundFires.filter((fire) => fire.active)).toHaveLength(10)
  })
})
