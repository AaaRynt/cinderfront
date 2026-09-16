import { Euler, Vector3 as ThreeVector3 } from 'three'
import { describe, expect, it } from 'vitest'

import type { Su30Activity, Su30AircraftId } from './su30Types'
import type { Pose3, Vector3 } from './types'

import { getTerrainHeight } from '../scene/world/stage2/terrainModel'
import { deriveSimulationWorldState } from './derive'
import { createSimulationStore, getSimulationWorldState } from './store'
import { SU30_DAMAGE_OFFSET, SU30_DIMENSIONS, SU30_ENGINE_OFFSETS } from './su30ModelData'
import { deriveSu30AircraftState, deriveSu30DamageTrail, deriveSu30ReinforcementState, sampleSu30Flight, SU30_AIRCRAFT_IDS, SU30_FLIGHT_PATHS, SU30_MAX_SMOKE_SAMPLES, SU30_MAX_SPARK_SAMPLES, SU30_MOTION_LIMITS, SU30_ROUTE_REFERENCES, SU30_SMOKE_LIFETIME_SECONDS, transformSu30LocalOffset } from './su30Reinforcement'

const BOUNDARIES = [0, 103.9, 104, 104.1, 120, 136.9, 137, 137.1, 141.9, 142, 142.1, 169.9, 170, 170.1, 172] as const
const F35_IDS = ['attacker_f35_01', 'attacker_f35_02'] as const

function distance(first: Vector3, second: Vector3) {
  return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z)
}

function angularDistance(first: number, second: number) {
  return Math.abs(Math.atan2(Math.sin(second - first), Math.cos(second - first)))
}

/** Independent reference to the actual Three.js rotation order used to render. */
function renderedOffset(pose: Pose3, offset: Vector3) {
  return new ThreeVector3(offset.x, offset.y, offset.z).applyEuler(new Euler(pose.rotation.x, pose.rotation.y, pose.rotation.z, 'YXZ')).add(new ThreeVector3(pose.position.x, pose.position.y, pose.position.z))
}

function expectedActivities(time: number): readonly [Su30Activity, Su30Activity] {
  if (time < 104) return ['off-map', 'off-map']
  if (time < 117) return ['entering', 'entering']
  if (time < 137) return ['pressuring', 'supporting']
  if (time < 142) return ['damaged-breakaway', 'supporting']
  if (time < 143) return ['damaged-breakaway', 'covering-withdrawal']
  if (time < 149) return ['withdrawing', 'covering-withdrawal']
  if (time < 170) return ['withdrawing', 'withdrawing']
  return ['egressing', 'egressing']
}

describe('Stage 4B.2B exact Su-30MKK roster and lifecycle', () => {
  it('has only the two authoritative defender aircraft, at real-meter scale', () => {
    expect(SU30_AIRCRAFT_IDS).toEqual(['defender_su30_01', 'defender_su30_02'])
    expect(SU30_DIMENSIONS).toEqual({ length: 21.94, wingspan: 14.7, height: 6.36 })
    for (const time of BOUNDARIES) {
      const world = deriveSimulationWorldState(time)
      expect(
        Object.values(world.aircraft)
          .filter((aircraft) => aircraft.vehicleType === 'Su-30MKK')
          .map((aircraft) => aircraft.id),
      ).toEqual(SU30_AIRCRAFT_IDS)
      expect(Object.keys(world.aircraft)).toEqual([...F35_IDS, ...SU30_AIRCRAFT_IDS])
      expect(world.stage4b2b.orderedAircraftIds).toEqual(SU30_AIRCRAFT_IDS)
      for (const id of SU30_AIRCRAFT_IDS) {
        expect(world.stage4b2b.aircraft[id]).toEqual(world.aircraft[id])
        expect(world.aircraft[id]).toMatchObject({ id, factionId: 'island_defender', vehicleType: 'Su-30MKK' })
      }
    }
  })

  it.each(BOUNDARIES)('reconstructs exact activity, condition, outcome and visibility at T+%s', (time) => {
    const state = deriveSu30ReinforcementState(time)
    const first = state.aircraft.defender_su30_01
    const second = state.aircraft.defender_su30_02
    expect([first.activity, second.activity]).toEqual(expectedActivities(time))
    expect([first.visible, second.visible]).toEqual([time >= 104, time >= 104])
    expect([first.physicalCondition, second.physicalCondition]).toEqual([time >= 137 ? 'damaged' : 'operational', 'operational'])
    expect([first.outcome, second.outcome]).toEqual([time >= 137 ? 'survived' : 'active', time >= 142 ? 'survived' : 'active'])
    expect(state.damagedCount).toBe(time >= 137 ? 1 : 0)
    expect(state.operationalCount).toBe(time >= 137 ? 1 : 2)
    expect(state.survivorCount).toBe(Number(time >= 137) + Number(time >= 142))
    for (const aircraft of [first, second]) {
      expect(aircraft.mapPresence).toBe(time < 104 ? 'outside' : time === 104 ? 'boundary' : time >= 169.9 ? 'leaving' : 'active')
      expect(['destroyed', 'crashing', 'ejected', 'respawned']).not.toContain(aircraft.activity)
      expect(aircraft).not.toHaveProperty('pilot')
      expect(aircraft).not.toHaveProperty('ejection')
      if (time < 104) {
        expect(aircraft.engine).toEqual({ leftIntensity: 0, rightIntensity: 0 })
        expect(aircraft.navigationLightIntensity).toBe(0)
        expect(aircraft.vaporIntensity).toBe(0)
        expect(aircraft.damageTrail).toEqual([])
        expect(aircraft.damageSparks).toEqual([])
      }
    }
  })

  it('uses all four authoritative entry points and a separated southwest exit corridor', () => {
    expect(SU30_ROUTE_REFERENCES).toEqual({
      entryZoneId: 'offmap_defender_air_northeast',
      entryPathId: 'path_defender_air_entry',
      entryHeadingDegrees: 225,
      entryWaypointsXZ: [
        [7000, 4200],
        [5500, 3500],
        [3500, 3000],
        [2000, 2500],
      ],
      egressPathId: 'path_air_egress_southwest',
      egressHeadingDegrees: 225,
      egressWaypointsXZ: [
        [2000, 2000],
        [0, 0],
        [-3000, -2000],
        [-7000, -4200],
      ],
    })
    expect(SU30_FLIGHT_PATHS.defender_su30_01.slice(0, 4).map((key) => [key.position.x, key.position.z])).toEqual(SU30_ROUTE_REFERENCES.entryWaypointsXZ)
    expect(sampleSu30Flight('defender_su30_01', 173).position).toMatchObject({ x: -7000, z: -4200 })
    for (const id of SU30_AIRCRAFT_IDS) {
      const entry = sampleSu30Flight(id, 104)
      expect(entry.velocity.x).toBe(-200)
      expect(entry.velocity.z).toBe(-200)
      const final = deriveSu30AircraftState(id, 172)
      expect(final.visible).toBe(true)
      expect(final.mapPresence).toBe('leaving')
      expect(final.velocity.x).toBeLessThan(0)
      expect(final.velocity.z).toBeLessThan(0)
      // 170 is an activity boundary, not an arbitrary renderer removal point.
      expect(distance(final.pose.position, deriveSu30AircraftState(id, 170).pose.position)).toBeGreaterThan(400)
    }
  })
})

describe('Stage 4B.2B deterministic clock and visual reconstruction', () => {
  it.each(BOUNDARIES)('reconstructs all visual and motion state through late/early/repeated seeking at T+%s', (time) => {
    const store = createSimulationStore()
    const expected = deriveSu30ReinforcementState(time)
    for (const otherTime of [172, 103.9, 137.1, 0, 170]) {
      store.getState().seek(otherTime)
      getSimulationWorldState(store)
      store.getState().seek(time)
      expect(getSimulationWorldState(store).stage4b2b).toEqual(expected)
      expect(deriveSu30ReinforcementState(time)).toEqual(expected)
    }
    store.getState().restart()
    expect(store.getState().timeSeconds).toBe(0)
    expect(getSimulationWorldState(store).stage4b2b).toEqual(deriveSu30ReinforcementState(0))
  })

  it.each([0.5, 1, 2] as const)('reaches identical complete states at %sx using actual store playback, pause and restart', (speed) => {
    const store = createSimulationStore({ timeSeconds: 103, speed })
    store.getState().play()
    // Binary-exact increments isolate replay determinism from decimal clock rounding.
    for (let index = 1; index <= (170 - 103) * 8; index += 1) {
      store.getState().tick(0.125 / speed)
      const time = 103 + index / 8
      if ([104, 120, 137, 137.125, 142, 142.125, 170].includes(time)) {
        const expected = deriveSu30ReinforcementState(time)
        expect(store.getState().timeSeconds).toBe(time)
        expect(getSimulationWorldState(store).stage4b2b).toEqual(expected)
        store.getState().pause()
        store.getState().tick(100)
        expect(getSimulationWorldState(store).stage4b2b).toEqual(expected)
        store.getState().play()
      }
    }
    store.getState().restart()
    expect(getSimulationWorldState(store).stage4b2b).toEqual(deriveSu30ReinforcementState(0))
  })

  it('holds a valid empty entry anchor, then follows a continuous weighted pair without event cuts', () => {
    expect(deriveSu30ReinforcementState(0).anchor).toEqual(deriveSu30ReinforcementState(103.9).anchor)
    for (const time of [104, 137, 142, 170]) {
      const before = deriveSu30ReinforcementState(time - 0.0001).anchor
      const at = deriveSu30ReinforcementState(time).anchor
      const after = deriveSu30ReinforcementState(time + 0.0001).anchor
      expect(distance(before.position, at.position)).toBeLessThan(0.034)
      expect(distance(at.position, after.position)).toBeLessThan(0.034)
      expect(angularDistance(before.rotation.y, after.rotation.y)).toBeLessThan(0.00006)
    }
  })
})

describe('Stage 4B.2B absolute-time attached damage and world-space effects', () => {
  it('starts compact damage only on the first aircraft at 137, with bounded transients and persistent light smoke', () => {
    const before = deriveSu30AircraftState('defender_su30_01', 136.9)
    expect(before.damage).toMatchObject({ ageSeconds: null, flashIntensity: 0, sparkIntensity: 0, smokeIntensity: 0, surfaceDarkened: false })
    expect(before.damageTrail).toEqual([])
    expect(before.damageSparks).toEqual([])
    const onset = deriveSu30AircraftState('defender_su30_01', 137)
    expect(onset.damage).toMatchObject({ ageSeconds: 0, flashIntensity: 1, sparkIntensity: 1, smokeIntensity: 0.28, surfaceDarkened: true })
    expect(onset.damageSparks).toHaveLength(7)
    for (const spark of onset.damageSparks) expect(spark.position).toEqual(onset.damage.onsetAnchor)
    expect(deriveSu30AircraftState('defender_su30_01', 137.1).damage.flashIntensity).toBeLessThan(1)
    expect(deriveSu30AircraftState('defender_su30_01', 137.35).damage.flashIntensity).toBe(0)
    expect(deriveSu30AircraftState('defender_su30_01', 137.81).damageSparks).toEqual([])
    for (const time of [137, 137.1, 137.4, 137.7, 138, 142, 160, 172]) {
      const damaged = deriveSu30AircraftState('defender_su30_01', time)
      const intact = deriveSu30AircraftState('defender_su30_02', time)
      expect(damaged.damage.smokeIntensity).toBe(0.28)
      expect(damaged.damage.surfaceDarkened).toBe(true)
      expect(damaged.engine.rightIntensity).toBeLessThan(damaged.engine.leftIntensity * 0.52)
      expect(damaged.engine.rightIntensity).toBeGreaterThan(damaged.engine.leftIntensity * 0.36)
      expect(damaged.damageSparks.length).toBeLessThanOrEqual(SU30_MAX_SPARK_SAMPLES)
      for (const spark of damaged.damageSparks) {
        expect(distance(spark.position, damaged.damage.onsetAnchor)).toBeLessThan(70)
        expect(spark.radius).toBeLessThanOrEqual(0.12 + Number.EPSILON)
        expect(spark.opacity).toBeGreaterThan(0)
        expect(spark.opacity).toBeLessThanOrEqual(1)
      }
      expect(intact.damage).toMatchObject({ ageSeconds: null, flashIntensity: 0, sparkIntensity: 0, smokeIntensity: 0, surfaceDarkened: false })
      expect(intact.engine.rightIntensity).toBe(intact.engine.leftIntensity)
      expect(intact.damageTrail).toEqual([])
      expect(intact.damageSparks).toEqual([])
    }
  })

  it('keeps the damaged patch on the right aft nacelle using the actual bank/pitch/yaw transform', () => {
    expect(SU30_DAMAGE_OFFSET.x).toBe(SU30_ENGINE_OFFSETS.right.x)
    expect(SU30_DAMAGE_OFFSET.z).toBeGreaterThan(0)
    expect(SU30_ENGINE_OFFSETS.right.x).toBeGreaterThan(0)
    expect(SU30_ENGINE_OFFSETS.left.x).toBeLessThan(0)
    for (const time of [104, 125, 136.9, 137, 139, 142, 155, 170, 172]) {
      const aircraft = deriveSu30AircraftState('defender_su30_01', time)
      expect(distance(aircraft.damage.anchor, renderedOffset(aircraft.pose, SU30_DAMAGE_OFFSET))).toBeLessThan(1e-9)
      expect(distance(transformSu30LocalOffset(aircraft.pose, SU30_ENGINE_OFFSETS.right), renderedOffset(aircraft.pose, SU30_ENGINE_OFFSETS.right))).toBeLessThan(1e-9)
    }
  })

  it('rebuilds only bounded historical smoke emissions from the moving right exhaust, never a body-attached ribbon', () => {
    expect(SU30_MAX_SMOKE_SAMPLES).toBe(49)
    expect(SU30_SMOKE_LIFETIME_SECONDS).toBe(2.4)
    for (const time of [136.9, 137, 137.013, 137.1, 138.6, 139.4, 142.037, 169.9, 170, 172]) {
      const state = deriveSu30AircraftState('defender_su30_01', time)
      const trail = state.damageTrail
      expect(trail).toEqual(deriveSu30DamageTrail('defender_su30_01', time))
      expect(trail.length).toBeLessThanOrEqual(49)
      if (time >= 139.4) expect(trail.length).toBeGreaterThanOrEqual(48)
      for (let index = 0; index < trail.length; index += 1) {
        const sample = trail[index]
        const age = time - sample.emittedAtSeconds
        expect(sample.emittedAtSeconds).toBeGreaterThanOrEqual(137)
        expect(sample.emittedAtSeconds).toBeLessThanOrEqual(time + 1e-8)
        expect(age).toBeLessThanOrEqual(2.4 + 1e-8)
        if (index > 0) expect(sample.emittedAtSeconds).toBeGreaterThan(trail[index - 1].emittedAtSeconds)
        const historical = deriveSu30AircraftState('defender_su30_01', sample.emittedAtSeconds)
        const expected = renderedOffset(historical.pose, SU30_ENGINE_OFFSETS.right)
        expected.add(new ThreeVector3(age * 2.1, age * 2.5, age * 0.85))
        expect(distance(sample.position, expected)).toBeLessThan(1e-8)
        expect(sample.radius).toBeGreaterThanOrEqual(0.8)
        expect(sample.radius).toBeLessThanOrEqual(8.48 + 1e-8)
        expect(sample.opacity).toBeGreaterThanOrEqual(0)
        expect(sample.opacity).toBeLessThanOrEqual(0.16)
        if (age > 1) expect(distance(sample.position, state.damage.anchor)).toBeGreaterThan(190)
      }
      deriveSu30DamageTrail('defender_su30_01', 172)
      expect(deriveSu30DamageTrail('defender_su30_01', time)).toEqual(trail)
      expect(deriveSu30DamageTrail('defender_su30_02', time)).toEqual([])
    }
  })
})

describe('Stage 4B.2B deterministic fighter motion quality', () => {
  it.each(SU30_AIRCRAFT_IDS)('%s keeps position and velocity continuous at every authored key and event', (id) => {
    const keys = new Set([...SU30_FLIGHT_PATHS[id].map((key) => key.atSeconds), 104, 137, 142, 170, 172])
    const epsilon = 1e-6
    for (const time of keys) {
      const before = sampleSu30Flight(id, time - epsilon)
      const at = sampleSu30Flight(id, time)
      const after = sampleSu30Flight(id, time + epsilon)
      expect(distance(before.position, at.position)).toBeLessThan(0.0034)
      expect(distance(at.position, after.position)).toBeLessThan(0.0034)
      expect(distance(before.velocity, at.velocity)).toBeLessThan(0.001)
      expect(distance(at.velocity, after.velocity)).toBeLessThan(0.001)
      const numericVelocity = { x: (after.position.x - before.position.x) / (2 * epsilon), y: (after.position.y - before.position.y) / (2 * epsilon), z: (after.position.z - before.position.z) / (2 * epsilon) }
      expect(distance(numericVelocity, at.velocity)).toBeLessThan(0.0001)
    }
  })

  it('stays within its documented envelope and safely separated over dense 0.05-second samples', () => {
    const limits = SU30_MOTION_LIMITS
    const metrics = { minimumSpeed: Infinity, maximumSpeed: 0, maximumAcceleration: 0, maximumSpeedChange: 0, maximumHeadingRate: 0, maximumBank: 0, maximumPitch: 0, minimumPairSeparation: Infinity, maximumPairSeparation: 0, minimumF35Separation: Infinity, minimumTerrainClearance: Infinity, maximumTangentMismatch: 0 }
    const f35Pairings: Record<string, { distance: number; atSeconds: number }> = {}
    const measure = (name: keyof typeof metrics, value: number, minimum = false) => {
      if (minimum ? value < metrics[name] : value > metrics[name]) {
        metrics[name] = value
      }
    }
    for (let step = 0; step <= (172 - 103) * 20; step += 1) {
      const time = 103 + step / 20
      const world = deriveSimulationWorldState(time)
      const pair = SU30_AIRCRAFT_IDS.map((id) => world.aircraft[id])
      measure('minimumPairSeparation', distance(pair[0].pose.position, pair[1].pose.position), true)
      measure('maximumPairSeparation', distance(pair[0].pose.position, pair[1].pose.position))
      for (const aircraft of pair) {
        const flight = sampleSu30Flight(aircraft.id, time)
        measure('minimumSpeed', aircraft.speedMetersPerSecond, true)
        measure('maximumSpeed', aircraft.speedMetersPerSecond)
        measure('maximumAcceleration', aircraft.accelerationMetersPerSecondSquared)
        measure('maximumHeadingRate', Math.abs(aircraft.turnRateRadiansPerSecond))
        measure('maximumBank', Math.abs(aircraft.bankRadians))
        measure('maximumPitch', Math.abs(aircraft.pose.rotation.x))
        const speedChange = Math.abs(flight.velocity.x * flight.acceleration.x + flight.velocity.y * flight.acceleration.y + flight.velocity.z * flight.acceleration.z) / aircraft.speedMetersPerSecond
        measure('maximumSpeedChange', speedChange)
        // The render's -Z nose, including roll, must match the true 3D velocity.
        const nose = renderedOffset(aircraft.pose, { x: 0, y: 0, z: -1 })
          .sub(new ThreeVector3(aircraft.pose.position.x, aircraft.pose.position.y, aircraft.pose.position.z))
          .normalize()
        const tangent = new ThreeVector3(flight.velocity.x, flight.velocity.y, flight.velocity.z).normalize()
        measure('maximumTangentMismatch', nose.distanceTo(tangent))
        expect(aircraft.pose.rotation.z).toBe(aircraft.bankRadians)
        expect(Math.sign(aircraft.pose.rotation.x)).toBe(Math.sign(flight.velocity.y))
        if (Math.abs(aircraft.turnRateRadiansPerSecond) > 1e-9) expect(Math.sign(aircraft.bankRadians)).toBe(Math.sign(aircraft.turnRateRadiansPerSecond))
        measure('minimumTerrainClearance', aircraft.pose.position.y - SU30_DIMENSIONS.height / 2 - getTerrainHeight(aircraft.pose.position.x, aircraft.pose.position.z), true)
        for (const f35Id of F35_IDS) {
          const separation = distance(aircraft.pose.position, world.aircraft[f35Id].pose.position)
          measure('minimumF35Separation', separation, true)
          const pairing = `${aircraft.id}/${f35Id}`
          if (separation < (f35Pairings[pairing]?.distance ?? Infinity)) f35Pairings[pairing] = { distance: separation, atSeconds: time }
        }
      }
    }
    expect(Object.keys(f35Pairings)).toHaveLength(4)
    for (const [pairing, closest] of Object.entries(f35Pairings)) expect(closest.distance, `${pairing} at T+${closest.atSeconds}`).toBeGreaterThanOrEqual(limits.minimumF35SeparationMeters)
    expect(metrics.minimumSpeed).toBeGreaterThanOrEqual(limits.minimumSpeedMetersPerSecond)
    expect(metrics.maximumSpeed).toBeLessThanOrEqual(limits.maximumSpeedMetersPerSecond)
    expect(metrics.maximumAcceleration).toBeLessThanOrEqual(limits.maximumAccelerationMetersPerSecondSquared)
    expect(metrics.maximumSpeedChange).toBeLessThanOrEqual(limits.maximumSpeedChangeMetersPerSecondSquared)
    expect(metrics.maximumHeadingRate).toBeLessThanOrEqual(limits.maximumHeadingRateRadiansPerSecond)
    expect(metrics.maximumBank).toBeLessThanOrEqual(limits.maximumBankRadians)
    expect(metrics.maximumPitch).toBeLessThanOrEqual(limits.maximumPitchRadians)
    expect(metrics.minimumPairSeparation).toBeGreaterThanOrEqual(limits.minimumAircraftSeparationMeters)
    expect(metrics.maximumPairSeparation).toBeLessThan(400)
    expect(metrics.minimumF35Separation).toBeGreaterThanOrEqual(limits.minimumF35SeparationMeters)
    expect(metrics.minimumTerrainClearance).toBeGreaterThanOrEqual(limits.minimumTerrainClearanceMeters)
    expect(metrics.maximumTangentMismatch).toBeLessThan(1e-9)
  })

  it('uses distinct support/cover timing, closes for brief pressure, then progresses southwest without a repeated orbit', () => {
    const relativeOffset = (time: number) => {
      const pair = deriveSu30ReinforcementState(time).aircraft
      const primary = pair.defender_su30_01.pose.position
      const support = pair.defender_su30_02.pose.position
      return { x: support.x - primary.x, y: support.y - primary.y, z: support.z - primary.z }
    }
    // Changing offsets by several airframe lengths rules out a rigid duplicate.
    expect(distance(relativeOffset(104), relativeOffset(137))).toBeGreaterThan(SU30_DIMENSIONS.length * 2)
    expect(distance(relativeOffset(137), relativeOffset(142))).toBeGreaterThan(SU30_DIMENSIONS.length * 2)
    expect(distance(relativeOffset(142), relativeOffset(165))).toBeGreaterThan(SU30_DIMENSIONS.length * 2)
    let minimumPressureDistance = Infinity
    let maximumHeadingDifference = 0
    const strongestTurn: Record<Su30AircraftId, { rate: number; time: number }> = {
      defender_su30_01: { rate: 0, time: 117 },
      defender_su30_02: { rate: 0, time: 117 },
    }
    for (let step = 0; step <= (137 - 117) * 20; step += 1) {
      const time = 117 + step / 20
      const world = deriveSimulationWorldState(time)
      minimumPressureDistance = Math.min(minimumPressureDistance, distance(world.aircraft.defender_su30_01.pose.position, world.aircraft.attacker_f35_01.pose.position))
    }
    expect(minimumPressureDistance).toBeLessThan(1500)
    for (let step = 0; step <= (146 - 117) * 20; step += 1) {
      const time = 117 + step / 20
      const pair = deriveSu30ReinforcementState(time).aircraft
      maximumHeadingDifference = Math.max(maximumHeadingDifference, angularDistance(pair.defender_su30_01.pose.rotation.y, pair.defender_su30_02.pose.rotation.y))
      for (const id of SU30_AIRCRAFT_IDS) {
        const rate = Math.abs(pair[id].turnRateRadiansPerSecond)
        if (rate > strongestTurn[id].rate) strongestTurn[id] = { rate, time }
      }
    }
    expect(maximumHeadingDifference).toBeGreaterThan((5 * Math.PI) / 180)
    expect(Math.abs(strongestTurn.defender_su30_01.time - strongestTurn.defender_su30_02.time)).toBeGreaterThanOrEqual(0.5)
    for (const [id, withdrawalTime] of [
      ['defender_su30_01', 137],
      ['defender_su30_02', 142],
    ] as const satisfies readonly (readonly [Su30AircraftId, number])[]) {
      for (let step = 0; step <= (172 - withdrawalTime) * 20; step += 1) {
        const time = withdrawalTime + step / 20
        const sample = sampleSu30Flight(id, time)
        expect(sample.velocity.x).toBeLessThan(0)
        expect(sample.velocity.z).toBeLessThan(0)
      }
    }
  })
})
