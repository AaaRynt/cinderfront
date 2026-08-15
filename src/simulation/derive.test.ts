import { describe, expect, it } from 'vitest'

import { deriveStage1WorldState } from './derive'

describe('deriveStage1WorldState event boundaries', () => {
  it('changes aircraft launch and STOVL mechanics exactly at authored launch times', () => {
    const beforeFirstLaunch = deriveStage1WorldState(4.999)
    const firstLaunch = deriveStage1WorldState(5)
    const firstVerticalLift = deriveStage1WorldState(8)
    const firstForwardFlight = deriveStage1WorldState(16)

    expect(beforeFirstLaunch.aircraft.attacker_f35_01.phase).toBe('launch-ready')
    expect(beforeFirstLaunch.aircraft.attacker_f35_01.launched).toBe(false)
    expect(firstLaunch.aircraft.attacker_f35_01.phase).toBe('stovl-prep')
    expect(firstLaunch.aircraft.attacker_f35_01.launched).toBe(true)
    expect(firstVerticalLift.aircraft.attacker_f35_01.phase).toBe('vertical-lift')
    expect(firstVerticalLift.aircraft.attacker_f35_01.mechanical.liftFanDoor).toBe(1)
    expect(firstVerticalLift.aircraft.attacker_f35_01.mechanical.rearNozzleDeflectionDegrees).toBe(90)
    expect(firstForwardFlight.aircraft.attacker_f35_01.phase).toBe('forward-flight')
    expect(firstForwardFlight.aircraft.attacker_f35_01.mechanical.landingGearRetraction).toBe(1)
    expect(firstForwardFlight.aircraft.attacker_f35_01.mechanical.liftFanDoor).toBe(0)

    expect(deriveStage1WorldState(12.999).aircraft.attacker_f35_02.phase).toBe('launch-ready')
    expect(deriveStage1WorldState(13).aircraft.attacker_f35_02.phase).toBe('stovl-prep')
  })

  it('changes Radar Hill equipment states on exact detection and engagement boundaries', () => {
    expect(deriveStage1WorldState(13.999).radar.primaryPhase).toBe('scanning')
    expect(deriveStage1WorldState(14).radar.primaryPhase).toBe('alert-tracking')
    expect(deriveStage1WorldState(20).radar.primaryPhase).toBe('tracking')
    expect(deriveStage1WorldState(19.999).pantsir.phase).toBe('operational')
    expect(deriveStage1WorldState(20).pantsir.phase).toBe('acquiring')
    expect(deriveStage1WorldState(24).pantsir.phase).toBe('engaging')
    expect(deriveStage1WorldState(28.999).fixedAaa.phase).toBe('tracking')
    expect(deriveStage1WorldState(29).fixedAaa.phase).toBe('firing')
    expect(deriveStage1WorldState(29).fixedAaa.isFiring).toBe(true)
  })

  it('reconstructs destruction and persistent damage at exact boundaries', () => {
    expect(deriveStage1WorldState(35.999).persistent.radarHillSmoke).toBe(false)
    expect(deriveStage1WorldState(36).persistent.radarHillSmoke).toBe(true)
    expect(deriveStage1WorldState(41.999).persistent.pantsirWreck).toBe(false)

    const pantsirDestroyed = deriveStage1WorldState(42)
    expect(pantsirDestroyed.pantsir.phase).toBe('destroyed')
    expect(pantsirDestroyed.persistent.pantsirWreck).toBe(true)
    expect(pantsirDestroyed.persistent.pantsirFire).toBe(true)
    expect(pantsirDestroyed.persistent.pantsirSmoke).toBe(true)
    expect(pantsirDestroyed.transientEffects.pantsirDestruction).toBe(1)

    expect(deriveStage1WorldState(44.999).radar.primaryOperational).toBe(true)
    const radarDestroyed = deriveStage1WorldState(45)
    expect(radarDestroyed.radar.primaryPhase).toBe('destroyed')
    expect(radarDestroyed.radar.primaryOperational).toBe(false)
    expect(radarDestroyed.radar.secondaryOperational).toBe(true)
    expect(radarDestroyed.persistent.primaryRadarDestroyed).toBe(true)

    const boundary = deriveStage1WorldState(48)
    expect(boundary.persistent.harborFirstHit).toBe(true)
    expect(boundary.reachedEvents.at(-1)?.id).toBe('harbor_first_hit')
  })

  it('derives a coherent direct-seek state without replaying prior frames', () => {
    const first = deriveStage1WorldState(43.2)
    const second = deriveStage1WorldState(43.2)

    expect(first).toEqual(second)
    expect(first.aircraft.attacker_f35_01.phase).toBe('forward-flight')
    expect(first.aircraft.attacker_f35_02.phase).toBe('forward-flight')
    expect(first.pantsir.phase).toBe('destroyed')
    expect(first.persistent.pantsirWreck).toBe(true)
    expect(first.radar.primaryPhase).toBe('tracking')
    expect(first.persistent.primaryRadarDestroyed).toBe(false)
    expect(first.reachedEvents).toHaveLength(10)
  })
})
