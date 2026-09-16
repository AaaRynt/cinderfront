import { describe, expect, it } from 'vitest'

import type { F35AircraftId } from './types'

import { deriveSimulationWorldState } from './derive'

function angularDistance(start: number, end: number): number {
  return Math.abs(Math.atan2(Math.sin(end - start), Math.cos(end - start)))
}

function aircraftAt(aircraftId: F35AircraftId, timeSeconds: number) {
  return deriveSimulationWorldState(timeSeconds).aircraft[aircraftId]
}

function headingBetweenPositions(before: { readonly x: number; readonly z: number }, after: { readonly x: number; readonly z: number }): number {
  return Math.atan2(-(after.x - before.x), -(after.z - before.z))
}

describe('Stage 4A deterministic F-35 cinematic motion', () => {
  it.each([
    ['attacker_f35_01', 5],
    ['attacker_f35_02', 13],
  ] as const)('%s transitions from vertical lift into forward acceleration without a speed step', (aircraftId, launchTime) => {
    const before = aircraftAt(aircraftId, launchTime + 5 - 0.001)
    const boundary = aircraftAt(aircraftId, launchTime + 5)

    expect(Math.abs(boundary.speedMetersPerSecond - before.speedMetersPerSecond)).toBeLessThan(0.25)
    expect(Math.hypot(boundary.pose.position.x - before.pose.position.x, boundary.pose.position.y - before.pose.position.y, boundary.pose.position.z - before.pose.position.z)).toBeLessThan(0.1)
    expect(angularDistance(before.pose.rotation.y, boundary.pose.rotation.y)).toBeLessThan(0.01)
  })

  it.each([
    ['attacker_f35_01', 10],
    ['attacker_f35_02', 18],
  ] as const)('%s keeps speed and heading changes bounded from the forward-transition boundary', (aircraftId, startTime) => {
    const sampleStepSeconds = 0.1
    let previous = aircraftAt(aircraftId, startTime)
    let maximumAcceleration = 0
    let maximumHeadingRate = 0

    for (let time = startTime + sampleStepSeconds; time <= 171.9; time += sampleStepSeconds) {
      const current = aircraftAt(aircraftId, time)
      const acceleration = Math.abs(current.speedMetersPerSecond - previous.speedMetersPerSecond) / sampleStepSeconds
      const headingRate = angularDistance(previous.pose.rotation.y, current.pose.rotation.y) / sampleStepSeconds
      maximumAcceleration = Math.max(maximumAcceleration, acceleration)
      maximumHeadingRate = Math.max(maximumHeadingRate, headingRate)
      previous = current
    }

    expect(maximumAcceleration).toBeLessThan(145)
    expect(maximumHeadingRate).toBeLessThan((27 * Math.PI) / 180)
  })

  it.each([
    ['attacker_f35_01', 10],
    ['attacker_f35_02', 18],
  ] as const)('%s follows a bounded high-speed path tangent instead of hiding sharp turns with pose smoothing', (aircraftId, startTime) => {
    const sampleStepSeconds = 0.05
    const samples = []
    let maximumPathTurnRate = 0
    let maximumPoseMismatch = 0

    for (let time = startTime; time <= 171.9; time += sampleStepSeconds) samples.push(aircraftAt(aircraftId, time))

    for (let index = 2; index < samples.length - 2; index += 1) {
      const aircraft = samples[index]
      if (aircraft.speedMetersPerSecond < 80) continue

      const beforeHeading = headingBetweenPositions(samples[index - 2].pose.position, aircraft.pose.position)
      const afterHeading = headingBetweenPositions(aircraft.pose.position, samples[index + 2].pose.position)
      const pathHeading = headingBetweenPositions(samples[index - 1].pose.position, samples[index + 1].pose.position)
      maximumPathTurnRate = Math.max(maximumPathTurnRate, angularDistance(beforeHeading, afterHeading) / (sampleStepSeconds * 2))
      maximumPoseMismatch = Math.max(maximumPoseMismatch, angularDistance(aircraft.pose.rotation.y, pathHeading))
    }

    expect(maximumPathTurnRate).toBeLessThan((25 * Math.PI) / 180)
    expect(maximumPoseMismatch).toBeLessThan((1.5 * Math.PI) / 180)
  })

  it('banks into authored turns without exceeding the cinematic roll limit', () => {
    const turningSamples = [53, 59, 64, 66, 96, 104].map((time) => aircraftAt('attacker_f35_02', time))
    const maximumBank = Math.max(...turningSamples.map((sample) => Math.abs(sample.bankRadians)))

    expect(maximumBank).toBeGreaterThan((8 * Math.PI) / 180)
    expect(maximumBank).toBeLessThanOrEqual((34 * Math.PI) / 180)
    for (const sample of turningSamples) expect(sample.pose.rotation.z).toBe(sample.bankRadians)
  })

  it('keeps the second Talwar release within a plausible unpowered glide distance', () => {
    const weapon = deriveSimulationWorldState(110.5).stage3.weapons.talwar_second_hit
    const straightLineDistance = Math.hypot(weapon.targetPosition.x - weapon.releasePosition.x, weapon.targetPosition.y - weapon.releasePosition.y, weapon.targetPosition.z - weapon.releasePosition.z)
    const requiredAverageMetersPerSecond = straightLineDistance / 4.5

    expect(requiredAverageMetersPerSecond).toBeLessThan(500)
  })

  it('reconstructs aircraft kinematics identically after direct seeks', () => {
    for (const time of [33.2, 45.2, 68, 74, 82, 110.5, 150, 170]) {
      expect(aircraftAt('attacker_f35_01', time)).toEqual(aircraftAt('attacker_f35_01', time))
      expect(aircraftAt('attacker_f35_02', time)).toEqual(aircraftAt('attacker_f35_02', time))
    }
  })

  it('preserves the primary F-35 handoff at T+90 and follows the authored late support pass', () => {
    const beforeHandoff = aircraftAt('attacker_f35_01', 89.999)
    const handoff = aircraftAt('attacker_f35_01', 90)
    const afterHandoff = aircraftAt('attacker_f35_01', 90.001)

    expect(handoff.pose.position).toEqual({ x: 3_000, y: 1_000, z: 1_000 })
    expect(Math.hypot(handoff.pose.position.x - beforeHandoff.pose.position.x, handoff.pose.position.y - beforeHandoff.pose.position.y, handoff.pose.position.z - beforeHandoff.pose.position.z)).toBeLessThan(0.2)
    expect(Math.hypot(afterHandoff.pose.position.x - handoff.pose.position.x, afterHandoff.pose.position.y - handoff.pose.position.y, afterHandoff.pose.position.z - handoff.pose.position.z)).toBeLessThan(0.2)
    expect(Math.abs(handoff.speedMetersPerSecond - beforeHandoff.speedMetersPerSecond)).toBeLessThan(0.2)
    expect(Math.abs(afterHandoff.speedMetersPerSecond - handoff.speedMetersPerSecond)).toBeLessThan(0.2)
    expect(angularDistance(beforeHandoff.pose.rotation.y, afterHandoff.pose.rotation.y)).toBeLessThan(0.002)

    expect(aircraftAt('attacker_f35_01', 154.5).pose.position).toEqual({ x: 5_400, y: 550, z: -100 })
    expect(aircraftAt('attacker_f35_01', 158).pose.position).toEqual({ x: 6_250, y: 520, z: 400 })
    const outboundTurn = aircraftAt('attacker_f35_01', 168.5)
    const final = aircraftAt('attacker_f35_01', 172)
    expect(outboundTurn.pose.position).toEqual({ x: 7_569, y: 650, z: -612 })
    expect(final.pose.position).toEqual({ x: 7_150, y: 760, z: -1_158 })
    expect(final.pose.position.x).toBeLessThan(outboundTurn.pose.position.x)
    expect(final.pose.position.z).toBeLessThan(outboundTurn.pose.position.z)
  })

  it('keeps the revised late primary-F-35 pass inside the established motion envelope', () => {
    const sampleStepSeconds = 0.05
    let previous = aircraftAt('attacker_f35_01', 90)
    let maximumAcceleration = 0
    let maximumBank = 0
    let maximumPoseMismatch = 0
    let maximumSpeed = 0
    let maximumTurnRate = 0

    for (let time = 90 + sampleStepSeconds; time <= 171.95; time += sampleStepSeconds) {
      const current = aircraftAt('attacker_f35_01', time)
      const pathHeading = headingBetweenPositions(previous.pose.position, current.pose.position)
      maximumAcceleration = Math.max(maximumAcceleration, Math.abs(current.speedMetersPerSecond - previous.speedMetersPerSecond) / sampleStepSeconds)
      maximumBank = Math.max(maximumBank, Math.abs(current.bankRadians))
      maximumPoseMismatch = Math.max(maximumPoseMismatch, angularDistance(current.pose.rotation.y, pathHeading))
      maximumSpeed = Math.max(maximumSpeed, current.speedMetersPerSecond)
      maximumTurnRate = Math.max(maximumTurnRate, Math.abs(current.turnRateRadiansPerSecond))
      previous = current
    }

    expect(maximumSpeed).toBeLessThan(330)
    expect(maximumAcceleration).toBeLessThan(110)
    expect(maximumTurnRate).toBeLessThan((25 * Math.PI) / 180)
    expect(maximumBank).toBeLessThanOrEqual((34 * Math.PI) / 180)
    expect(maximumPoseMismatch).toBeLessThan((1.5 * Math.PI) / 180)
  })
})
