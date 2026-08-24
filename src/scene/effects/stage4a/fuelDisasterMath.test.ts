import { describe, expect, it } from 'vitest'

import { AIR_GROUND_STRIKE_BY_ID } from '../../../simulation/weapons.ts'
import { getTerrainHeight } from '../../world/stage2/terrainModel.ts'
import { sampleBallisticFragment } from '../stage3/effectMath.ts'
import {
  STAGE4A_FUEL_ESCALATION_SCHEDULE,
  STAGE4A_FUEL_HERO_TIME_SECONDS,
  STAGE4A_FUEL_MAX_POOL_FIRE_RADIUS_M,
  STAGE4A_FUEL_POOL_FIRE_COUNT,
  createStage4AFuelDebris,
  createStage4AFuelPoolFires,
  createStage4ASmokePuffs,
  deriveStage4AFuelDisasterState,
  resolveStage4AFuelEventPosition,
  sampleStage4AFuelBurst,
  sampleStage4AFuelFireIntensity,
} from './fuelDisasterMath.ts'

describe('Stage 4A deterministic fuel-disaster escalation', () => {
  it('preserves the authoritative anchors and staggers connected failures before ammunition cookoff', () => {
    const times = STAGE4A_FUEL_ESCALATION_SCHEDULE.map((event) => event.atSeconds)
    const ids = STAGE4A_FUEL_ESCALATION_SCHEDULE.map((event) => event.id)
    const hero = STAGE4A_FUEL_ESCALATION_SCHEDULE.find((event) => event.kind === 'hero-cascade')!

    expect(times).toContain(78)
    expect(times).toContain(86)
    expect(hero.atSeconds).toBe(STAGE4A_FUEL_HERO_TIME_SECONDS)
    expect(hero.burstRadiusM).toBe(70)
    expect(new Set(ids).size).toBe(ids.length)
    expect(times.every((time, index) => index === 0 || time > times[index - 1]!)).toBe(true)
    expect(STAGE4A_FUEL_ESCALATION_SCHEDULE.at(-1)!.atSeconds).toBeLessThan(116)
    expect(STAGE4A_FUEL_ESCALATION_SCHEDULE.filter((event) => event.kind !== 'hero-cascade').every((event) => event.burstRadiusM < hero.burstRadiusM)).toBe(true)
    const kinds = new Set<string>(STAGE4A_FUEL_ESCALATION_SCHEDULE.map((event) => event.kind))
    expect(['bund-pool-ignition', 'hero-cascade', 'manifold-burst', 'pipe-rupture', 'rim-seal-ignition', 'tank-flashover', 'tank-hit', 'vent-flashover'].every((kind) => kinds.has(kind))).toBe(true)
  })

  it('reconstructs phase and reached events directly from absolute time', () => {
    expect(deriveStage4AFuelDisasterState(0).phase).toBe('pre-ignition')
    expect(deriveStage4AFuelDisasterState(78).phase).toBe('pipeline-fire')
    expect(deriveStage4AFuelDisasterState(86).phase).toBe('tank-five-burning')
    expect(deriveStage4AFuelDisasterState(92).phase).toBe('hero-cascade')
    expect(deriveStage4AFuelDisasterState(100).phase).toBe('sympathetic-spread')
    expect(deriveStage4AFuelDisasterState(112).phase).toBe('district-inferno')

    const directSeek = deriveStage4AFuelDisasterState(112)
    deriveStage4AFuelDisasterState(96)
    deriveStage4AFuelDisasterState(180)
    expect(deriveStage4AFuelDisasterState(112)).toEqual(directSeek)
    expect(directSeek.reachedEventIds).toHaveLength(STAGE4A_FUEL_ESCALATION_SCHEDULE.length)
    expect(directSeek.activePersistentFireCount).toBe(STAGE4A_FUEL_ESCALATION_SCHEDULE.length + STAGE4A_FUEL_POOL_FIRE_COUNT)

    const restarted = deriveStage4AFuelDisasterState(0)
    expect(restarted.reachedEventIds).toEqual([])
    expect(restarted.activePersistentFireCount).toBe(0)
  })

  it('keeps the fourteen pool fires deterministic and inside the authored 180 meter footprint', () => {
    const first = createStage4AFuelPoolFires('pool-layout-test')
    const second = createStage4AFuelPoolFires('pool-layout-test')
    expect(first).toEqual(second)
    expect(first).toHaveLength(STAGE4A_FUEL_POOL_FIRE_COUNT)
    expect(first.every((fire) => Math.hypot(fire.positionXZ[0] + 545, fire.positionXZ[1] - 2_050) <= STAGE4A_FUEL_MAX_POOL_FIRE_RADIUS_M)).toBe(true)
    expect(first.every((fire) => fire.igniteAtSeconds > STAGE4A_FUEL_HERO_TIME_SECONDS && fire.igniteAtSeconds < 104)).toBe(true)
    expect(first.every((fire) => fire.scale >= 1.35 && fire.scale <= 3.15)).toBe(true)
  })

  it('builds a bounded, layered black-smoke pool with repeatable crown variation', () => {
    const first = createStage4ASmokePuffs('hero-column', 52, 1.14)
    expect(first).toEqual(createStage4ASmokePuffs('hero-column', 52, 1.14))
    expect(first).toHaveLength(52)
    expect(new Set(first.map((puff) => puff.layer))).toEqual(new Set(['body', 'core', 'edge']))
    expect(first.every((puff) => puff.lifetimeSeconds >= 12 && puff.lifetimeSeconds <= 19)).toBe(true)
    expect(STAGE4A_FUEL_ESCALATION_SCHEDULE.reduce((total, event) => total + event.smokePuffCount, 0)).toBeLessThanOrEqual(220)
  })

  it('uses a broad sustained fuel pulse rather than an ammunition-like impulse', () => {
    const hero = STAGE4A_FUEL_ESCALATION_SCHEDULE.find((event) => event.kind === 'hero-cascade')!
    expect(sampleStage4AFuelBurst(hero, hero.atSeconds - 0.001).visible).toBe(false)
    expect(sampleStage4AFuelBurst(hero, hero.atSeconds).flashIntensity).toBe(1)
    expect(sampleStage4AFuelBurst(hero, hero.atSeconds + 1.4).scaleM).toBeCloseTo(70)
    expect(sampleStage4AFuelBurst(hero, hero.atSeconds + 3).visible).toBe(true)
    expect(sampleStage4AFuelBurst(hero, hero.atSeconds + 4.901).visible).toBe(false)
    expect(sampleStage4AFuelFireIntensity(hero.atSeconds, hero.atSeconds - 0.01)).toBe(0)
    expect(sampleStage4AFuelFireIntensity(hero.atSeconds, hero.atSeconds + 8)).toBeGreaterThan(0.65)
  })

  it('launches fixed-count structural debris from elevation and terminates every arc at ground', () => {
    const first = createStage4AFuelDebris('hero-debris-test', 18, 8)
    expect(first).toEqual(createStage4AFuelDebris('hero-debris-test', 18, 8))
    expect(first).toHaveLength(18)
    expect(first.every((fragment) => fragment.offset[1] >= 11)).toBe(true)
    expect(first.every((fragment) => Math.abs(sampleBallisticFragment(fragment, fragment.lifetimeSeconds).position[1]) < 1e-8)).toBe(true)
    expect(first.filter((fragment) => fragment.burning).length / first.length).toBeGreaterThanOrEqual(0.45)
    expect(first.filter((fragment) => fragment.burning).length / first.length).toBeLessThanOrEqual(0.7)
  })

  it('resolves every event against the supplied terrain sampler without mutating XZ authority', () => {
    const event = STAGE4A_FUEL_ESCALATION_SCHEDULE[2]!
    const position = resolveStage4AFuelEventPosition(event, (x, z) => x * 0.001 + z * 0.002)
    expect(position[0]).toBe(event.positionXZ[0])
    expect(position[2]).toBe(event.positionXZ[1])
    expect(position[1]).toBeCloseTo(-0.55 + 4.1 + event.elevationOffsetM)
  })

  it('grounds the two industrial weapon impacts to their presentation-remapped effect anchors', () => {
    const pipeline = STAGE4A_FUEL_ESCALATION_SCHEDULE.find((event) => event.id === 'pipeline-initial-strike')!
    const tankFive = STAGE4A_FUEL_ESCALATION_SCHEDULE.find((event) => event.id === 'tank-05-direct-hit')!

    expect(AIR_GROUND_STRIKE_BY_ID.industrial_pipeline_hit.targetPosition.y).toBeCloseTo(getTerrainHeight(...pipeline.positionXZ) + pipeline.elevationOffsetM, 2)
    expect(AIR_GROUND_STRIKE_BY_ID.fuel_tank_initial_hit.targetPosition.y).toBeCloseTo(getTerrainHeight(...tankFive.positionXZ) + tankFive.elevationOffsetM, 2)
  })
})
