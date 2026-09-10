import { describe, expect, it } from 'vitest'

import {
  deriveSimulationWorldState,
  deriveT72GroupState,
  getT72PresentationSurfaceHeight,
  SIMULATION_DURATION_SECONDS,
  T72_DIMENSIONS_METERS,
  T72_GROUND_CLEARANCE_METERS,
  T72_GROUP_ID,
  T72_LEAD_DESTROYED_SECONDS,
  T72_LEAD_IMPACT_ANCHOR,
  T72_REINFORCEMENT_ROUTE_LENGTH_METERS,
  T72_RESERVE_POSITIONS_XZ,
  T72_VEHICLE_IDS,
  T72_WITHDRAWAL_START_SECONDS,
} from '.'
import { createSimulationStore, getSimulationWorldState } from './store.ts'

function distanceXZ(left: { readonly x: number; readonly z: number }, right: { readonly x: number; readonly z: number }) {
  return Math.hypot(right.x - left.x, right.z - left.z)
}

function hullForward(yawRadians: number) {
  return { x: -Math.sin(yawRadians), z: -Math.cos(yawRadians) }
}

function angularDistance(start: number, end: number) {
  return Math.abs(Math.atan2(Math.sin(end - start), Math.cos(end - start)))
}

describe('Stage 4B.2A deterministic T-72B reinforcement lifecycle', () => {
  it('creates exactly the authoritative three-tank group at exact scale in the clear eastern service yard', () => {
    const group = deriveT72GroupState(0)
    expect(group.id).toBe(T72_GROUP_ID)
    expect(group.factionId).toBe('island_defender')
    expect(group.orderedVehicleIds).toEqual(T72_VEHICLE_IDS)
    expect(Object.keys(group.vehicles)).toHaveLength(3)
    expect(T72_DIMENSIONS_METERS).toEqual({ gunForwardLength: 9.53, height: 2.23, hullLength: 6.86, roadWheelRadius: 0.435, trackWidth: 0.63, width: 3.59 })
    expect(T72_REINFORCEMENT_ROUTE_LENGTH_METERS).toBeGreaterThan(7_400)

    const ordered = group.orderedVehicleIds.map((id) => group.vehicles[id])
    expect(ordered.every((vehicle) => vehicle.factionId === 'island_defender' && vehicle.vehicleType === 'T-72B' && vehicle.drivetrain.kind === 'tracked')).toBe(true)
    expect(ordered.map((vehicle) => [vehicle.pose.position.x, vehicle.pose.position.z])).toEqual(T72_VEHICLE_IDS.map((id) => [...T72_RESERVE_POSITIONS_XZ[id]]))
    for (const vehicle of ordered) {
      const { x, z } = vehicle.pose.position
      expect(x).toBeGreaterThanOrEqual(5_425)
      expect(x).toBeLessThanOrEqual(6_075)
      expect(z).toBeGreaterThanOrEqual(70)
      expect(z).toBeLessThanOrEqual(430)
      expect(x).toBeGreaterThan(5_750 + T72_DIMENSIONS_METERS.gunForwardLength / 2)
      expect(Math.hypot(x - 5_580, z - 170)).toBeGreaterThan(120)
      expect(Math.hypot(x - 6_000, z - 390)).toBeGreaterThan(120)
      expect(430 - z).toBeGreaterThan(160)
    }
    for (let index = 1; index < ordered.length; index += 1) expect(distanceXZ(ordered[index - 1]!.pose.position, ordered[index]!.pose.position)).toBeGreaterThan(30)
  })

  it('uses every exact movement, release, loss, reaction, and withdrawal boundary', () => {
    const reserve = deriveSimulationWorldState(149.9)
    expect(reserve.stage4b.t72Group.activity).toBe('stationary-reserve')
    expect(reserve.stage4b.t72Group.orderedVehicleIds.every((id) => reserve.stage4b.t72Group.vehicles[id].motionDirection === 'stationary')).toBe(true)
    expect(reserve.stage3.weapons.t72_lead_destroyed.phase).toBe('not-released')

    const move = deriveSimulationWorldState(150)
    expect(move.reachedEvents.at(-1)?.id).toBe('defender_armored_reinforcement_move')
    expect(move.stage4b.t72Group.activity).toBe('moving-to-reinforce')
    expect(move.stage4b.t72Group.vehicles.defender_t72_01).toMatchObject({ accelerationMetersPerSecondSquared: 1.5, longitudinalSpeedMetersPerSecond: 0, motionDirection: 'forward' })
    expect(deriveT72GroupState(150.1).vehicles.defender_t72_01.pose.position.x).toBeGreaterThan(move.stage4b.t72Group.vehicles.defender_t72_01.pose.position.x)

    expect(deriveSimulationWorldState(154.4).stage3.weapons.t72_lead_destroyed.phase).toBe('not-released')
    const release = deriveSimulationWorldState(154.5)
    expect(release.stage3.weapons.t72_lead_destroyed).toMatchObject({ phase: 'in-flight', progress: 0, visible: true })
    expect(release.stage4b.t72Group.vehicles.defender_t72_01.longitudinalSpeedMetersPerSecond).toBeCloseTo(6.75)

    expect(deriveT72GroupState(157.9).vehicles.defender_t72_01).toMatchObject({ physicalCondition: 'operational', outcome: 'active' })
    const impact = deriveSimulationWorldState(158)
    expect(impact.reachedEvents.at(-1)?.id).toBe('t72_lead_destroyed')
    expect(impact.stage4b.t72Group.vehicles.defender_t72_01).toMatchObject({ physicalCondition: 'destroyed', outcome: 'lost', motionDirection: 'stationary' })
    expect(impact.stage4b.t72Group.vehicles.defender_t72_01.damage).toMatchObject({ causeEventId: 't72_lead_destroyed', flashIntensity: 1 })
    expect(impact.stage4b.t72Group.vehicles.defender_t72_02).toMatchObject({ activity: 'halted-after-strike', accelerationMetersPerSecondSquared: -2, longitudinalSpeedMetersPerSecond: 9, outcome: 'active' })
    expect(deriveT72GroupState(158.1).vehicles.defender_t72_02.longitudinalSpeedMetersPerSecond).toBeCloseTo(8.8)

    const halted = deriveT72GroupState(162.9)
    expect(halted.activity).toBe('halted-after-strike')
    expect(halted.vehicles.defender_t72_02.motionDirection).toBe('stationary')
    expect(halted.vehicles.defender_t72_03.motionDirection).toBe('stationary')

    const withdrawal = deriveSimulationWorldState(163)
    expect(withdrawal.reachedEvents.at(-1)?.id).toBe('t72_survivors_withdraw')
    expect(withdrawal.stage4b.t72Group).toMatchObject({ activity: 'withdrawing', destroyedCount: 1, survivorCount: 2, withdrawingCount: 2 })
    for (const id of T72_VEHICLE_IDS.slice(1)) expect(withdrawal.stage4b.t72Group.vehicles[id]).toMatchObject({ activity: 'reversing-to-cover', motionDirection: 'reverse', outcome: 'survived', physicalCondition: 'operational' })
    expect(deriveT72GroupState(163.1).vehicles.defender_t72_02.longitudinalSpeedMetersPerSecond).toBeLessThan(0)
    expect(deriveT72GroupState(163.1).vehicles.defender_t72_03.longitudinalSpeedMetersPerSecond).toBe(0)

    const final = deriveT72GroupState(172)
    expect(final.vehicles.defender_t72_01).toMatchObject({ physicalCondition: 'destroyed', outcome: 'lost' })
    for (const id of T72_VEHICLE_IDS.slice(1)) {
      expect(final.vehicles[id]).toMatchObject({ motionDirection: 'reverse', outcome: 'survived', physicalCondition: 'operational' })
      expect(final.vehicles[id].longitudinalSpeedMetersPerSecond).toBeLessThan(0)
    }
    expect(SIMULATION_DURATION_SECONDS).toBe(172)
  })

  it('freezes and reconstructs the wreck while seeks, restart, and playback speed remain equivalent', () => {
    const impact = deriveT72GroupState(T72_LEAD_DESTROYED_SECONDS).vehicles.defender_t72_01
    const late = deriveT72GroupState(172).vehicles.defender_t72_01
    expect(late.pose).toEqual(impact.pose)
    expect(late.traveledDistanceMeters).toBe(impact.traveledDistanceMeters)
    expect(late.drivetrain).toEqual(impact.drivetrain)
    expect(late.damage.smokeIntensity).toBeGreaterThan(0)

    const restored = deriveT72GroupState(157.9).vehicles.defender_t72_01
    expect(restored.physicalCondition).toBe('operational')
    expect(restored.damage).toMatchObject({ causeEventId: null, flashIntensity: 0, localFireIntensity: 0, smokeIntensity: 0 })

    const store = createSimulationStore()
    store.getState().seek(170)
    const firstLate = getSimulationWorldState(store).stage4b.t72Group
    store.getState().seek(149.9)
    store.getState().seek(170)
    expect(getSimulationWorldState(store).stage4b.t72Group).toEqual(firstLate)
    store.getState().restart()
    expect(getSimulationWorldState(store).stage4b.t72Group).toEqual(deriveT72GroupState(0))

    const speedOutcomes = ([0.5, 1, 2] as const).map((speed) => {
      const speedStore = createSimulationStore({ isPlaying: true, speed })
      speedStore.getState().tick(170 / speed)
      return getSimulationWorldState(speedStore).stage4b.t72Group
    })
    expect(speedOutcomes[1]).toEqual(speedOutcomes[0])
    expect(speedOutcomes[2]).toEqual(speedOutcomes[0])
  })

  it('keeps heavy motion continuous, bounded, longitudinal, safely spaced, and genuinely reversed', () => {
    let maximumActualSpeed = 0
    let maximumReportedSpeed = 0
    let maximumAcceleration = 0
    let maximumHullYawRate = 0
    let minimumSpacing = Number.POSITIVE_INFINITY
    let minimumBarrierClearance = Number.POSITIVE_INFINITY
    let minimumFixtureClearance = Number.POSITIVE_INFINITY
    let minimumShedClearance = Number.POSITIVE_INFINITY
    let maximumReverseSpeed = 0
    for (let time = 149; time <= 172; time += 0.05) {
      const group = deriveT72GroupState(time)
      const vehicles = group.orderedVehicleIds.map((id) => group.vehicles[id])
      for (const vehicle of vehicles) {
        const { x, z } = vehicle.pose.position
        minimumShedClearance = Math.min(minimumShedClearance, x - T72_DIMENSIONS_METERS.hullLength / 2 - 5_750)
        minimumBarrierClearance = Math.min(minimumBarrierClearance, 430 - z - T72_DIMENSIONS_METERS.width / 2)
        for (const [fixtureX, fixtureZ] of [
          [5_580, 170],
          [5_450, 390],
          [6_000, 390],
          [5_900, 400],
        ] as const)
          minimumFixtureClearance = Math.min(minimumFixtureClearance, Math.hypot(x - fixtureX, z - fixtureZ) - T72_DIMENSIONS_METERS.width / 2 - 0.52)
        maximumReportedSpeed = Math.max(maximumReportedSpeed, vehicle.speedMetersPerSecond)
        maximumAcceleration = Math.max(maximumAcceleration, Math.abs(vehicle.accelerationMetersPerSecondSquared))
        if (time <= 171.95) {
          const after = deriveT72GroupState(time + 0.05).vehicles[vehicle.id]
          const actualSpeed = distanceXZ(vehicle.pose.position, after.pose.position) / 0.05
          maximumActualSpeed = Math.max(maximumActualSpeed, actualSpeed)
          maximumHullYawRate = Math.max(maximumHullYawRate, angularDistance(vehicle.pose.rotation.y, after.pose.rotation.y) / 0.05)
          if (actualSpeed > 0.05) {
            const movement = { x: (after.pose.position.x - vehicle.pose.position.x) / actualSpeed / 0.05, z: (after.pose.position.z - vehicle.pose.position.z) / actualSpeed / 0.05 }
            expect(movement.x * vehicle.routeTangent.x + movement.z * vehicle.routeTangent.z).toBeGreaterThan(0.998)
          }
        }
        if (vehicle.motionDirection === 'forward' && vehicle.speedMetersPerSecond > 0.05) {
          const forward = hullForward(vehicle.pose.rotation.y)
          expect(forward.x * vehicle.routeTangent.x + forward.z * vehicle.routeTangent.z).toBeGreaterThan(0.998)
        }
        if (vehicle.motionDirection === 'reverse' && vehicle.speedMetersPerSecond > 0.05) {
          maximumReverseSpeed = Math.max(maximumReverseSpeed, vehicle.speedMetersPerSecond)
          const forward = hullForward(vehicle.pose.rotation.y)
          expect(forward.x * vehicle.routeTangent.x + forward.z * vehicle.routeTangent.z).toBeLessThan(-0.998)
          expect(vehicle.longitudinalSpeedMetersPerSecond).toBeLessThan(0)
        }
      }
      for (let first = 0; first < vehicles.length; first += 1) {
        for (let second = first + 1; second < vehicles.length; second += 1) minimumSpacing = Math.min(minimumSpacing, distanceXZ(vehicles[first]!.pose.position, vehicles[second]!.pose.position))
      }
    }

    expect(maximumReportedSpeed).toBeLessThanOrEqual(9)
    expect(maximumActualSpeed).toBeLessThan(9.1)
    expect(maximumAcceleration).toBeLessThanOrEqual(2)
    expect(maximumHullYawRate).toBeLessThan((12 * Math.PI) / 180)
    expect(maximumReverseSpeed).toBeGreaterThan(3.9)
    expect(maximumReverseSpeed).toBeLessThanOrEqual(4.5)
    expect(minimumSpacing).toBeGreaterThan(T72_DIMENSIONS_METERS.gunForwardLength + 1.5)
    expect(minimumShedClearance).toBeGreaterThan(200)
    expect(minimumBarrierClearance).toBeGreaterThan(170)
    expect(minimumFixtureClearance).toBeGreaterThan(120)

    for (const [before, boundary] of [
      [149.999, 150],
      [157.999, 158],
      [162.999, 163],
    ] as const) {
      for (const id of T72_VEHICLE_IDS) expect(distanceXZ(deriveT72GroupState(before).vehicles[id].pose.position, deriveT72GroupState(boundary).vehicles[id].pose.position)).toBeLessThan(0.011)
    }

    const reverseStart = deriveT72GroupState(T72_WITHDRAWAL_START_SECONDS)
    const final = deriveT72GroupState(172)
    for (const id of T72_VEHICLE_IDS.slice(1)) {
      expect(final.vehicles[id].traveledDistanceMeters).toBeLessThan(reverseStart.vehicles[id].traveledDistanceMeters)
      expect(final.vehicles[id].drivetrain.trackTravelMeters).toBeLessThan(reverseStart.vehicles[id].drivetrain.trackTravelMeters)
      expect(final.vehicles[id].drivetrain.roadWheelRotationRadians).toBeLessThan(reverseStart.vehicles[id].drivetrain.roadWheelRotationRadians)
    }
    expect(distanceXZ(reverseStart.vehicles.defender_t72_02.pose.position, reverseStart.vehicles.defender_t72_01.pose.position)).toBeGreaterThan(T72_DIMENSIONS_METERS.gunForwardLength + 1.5)
  })

  it('grounds reserve, departure, wreck, halt, reverse, and final states on the rendered connector surface', () => {
    for (const time of [0, 150, 154.5, 158, 160, 163.1, 168, 172]) {
      const group = deriveT72GroupState(time)
      for (const id of T72_VEHICLE_IDS) {
        const vehicle = group.vehicles[id]
        const { x, y, z } = vehicle.pose.position
        expect(y).toBeCloseTo(getT72PresentationSurfaceHeight(x, z) + T72_DIMENSIONS_METERS.height / 2 + T72_GROUND_CLEARANCE_METERS, 8)
        expect(Math.abs(vehicle.pose.rotation.x)).toBeLessThan(0.12)
        expect(Math.abs(vehicle.pose.rotation.z)).toBeLessThan(0.12)
      }
    }

    const flat = deriveT72GroupState(168, () => 12)
    for (const id of T72_VEHICLE_IDS) {
      expect(flat.vehicles[id].pose.position.y).toBeCloseTo(12 + 0.48 + T72_DIMENSIONS_METERS.height / 2 + T72_GROUND_CLEARANCE_METERS, 10)
      expect(flat.vehicles[id].pose.rotation.x).toBeCloseTo(0, 10)
      expect(flat.vehicles[id].pose.rotation.z).toBeCloseTo(0, 10)
    }
  })

  it('shares the exact T+158 lead pose with the strike and adds no excluded future actors', () => {
    expect(T72_LEAD_IMPACT_ANCHOR).toEqual(deriveT72GroupState(T72_LEAD_DESTROYED_SECONDS).vehicles.defender_t72_01.pose.position)
    expect(T72_LEAD_IMPACT_ANCHOR.x).toBe(T72_AUTHORED_EXIT_X)
    expect(T72_LEAD_IMPACT_ANCHOR.z).toBe(250)
    const serialized = JSON.stringify(deriveSimulationWorldState(172))
    for (const excluded of ['su30', 'support_convoy', 'pantsir_02', 'lcac', 'lav_25']) expect(serialized.toLowerCase()).not.toContain(excluded)
  })

  it('keeps dust and every lead-damage layer tied to absolute time', () => {
    const reserve = deriveT72GroupState(149.9)
    expect(T72_VEHICLE_IDS.every((id) => reserve.vehicles[id].dustIntensity === 0)).toBe(true)
    const moving = deriveT72GroupState(154.5)
    expect(T72_VEHICLE_IDS.every((id) => moving.vehicles[id].dustIntensity > 0)).toBe(true)

    const impact = deriveT72GroupState(158)
    expect(impact.vehicles.defender_t72_01).toMatchObject({ dustIntensity: 0 })
    expect(impact.vehicles.defender_t72_01.damage).toMatchObject({ causeEventId: 't72_lead_destroyed', flashIntensity: 1 })
    expect(impact.vehicles.defender_t72_02.dustIntensity).toBeGreaterThan(0)

    const persistent = deriveT72GroupState(170).vehicles.defender_t72_01
    expect(persistent.damage.flashIntensity).toBe(0)
    expect(persistent.damage.sparkIntensity).toBe(0)
    expect(persistent.damage.dustKickIntensity).toBe(0)
    expect(persistent.damage.localFireIntensity).toBeGreaterThan(0)
    expect(persistent.damage.smokeIntensity).toBeGreaterThan(0)

    const restored = deriveT72GroupState(149.9)
    expect(restored).toEqual(deriveT72GroupState(149.9))
    expect(restored.vehicles.defender_t72_01.damage).toMatchObject({ causeEventId: null, flashIntensity: 0, sparkIntensity: 0, dustKickIntensity: 0, localFireIntensity: 0, smokeIntensity: 0 })
  })
})

const T72_AUTHORED_EXIT_X = 6_075
