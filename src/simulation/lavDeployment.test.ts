import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

/// <reference types="node" />
import { writeStage5cMeasurement } from '@/test/stage5cMeasurements'

import { deriveLandingWorldState } from './landingCraft'
import { LAV_IDS } from './landingCraftData'
import { deriveLavPayload } from './lavDeployment'
import { lavDeploymentTiming } from './lavDeployment'

describe('Stage 5C absolute deployment', () => {
  it('retains the eight identities, stagger, manifest and actual mutually exclusive occupancy', () => {
    const rows = []
    for (const [i, id] of LAV_IDS.entries()) {
      const timing = lavDeploymentTiming(Math.floor(i / 4), i % 4)
      const before = deriveLandingWorldState(timing.departureAtSeconds).payload[id]
      expect(before.activity).toBe('embarked')
      expect(before.wheelTravelMeters).toBe(0)
      expect(before.dust).toEqual([])
      const states = [176, 180].map((t) => deriveLandingWorldState(t).payload[id])
      if (i === 0 || i === 4) expect(states[0]!.activity).toBe('inland-advance')
      rows.push({ id, ...timing, states: states.map((s) => ({ activity: s.activity, occupancy: s.occupancy, support: s.support, pathDistance: s.pathDistanceMeters, speed: s.speedMetersPerSecond, rampClearance: s.rampClearanceMeters, position: s.pose.position, wheels: s.wheels.map((w) => w.surface) })) })
    }
    for (const time of [0, 159.9, 160, 160.1, 163, 166, 169, 172, 175, 176, 180]) {
      const world = deriveLandingWorldState(time)
      expect(world.orderedPayloadIds).toEqual(LAV_IDS)
      expect(world.embarkedCount + world.transferringCount + world.ashoreCount).toBe(8)
      for (const group of Object.values(world.groups)) expect(group.embarkedCount + group.transferringCount + group.ashoreCount).toBe(4)
    }
    expect(deriveLandingWorldState(176).payload.attacker_lav_03.support).toBe('ramp')
    expect(deriveLandingWorldState(180).payload.attacker_lav_07.support).toBe('mixed')
    writeStage5cMeasurement('deployment-timings.json', rows)
  })
  it('keeps departure and support transitions continuous, motion restrained, and dust grounded', () => {
    let maxTransferSpeed = 0
    let maxSpeed = 0,
      maxAcceleration = 0,
      maxSuspension = 0,
      maxPitchRate = 0,
      maxRollRate = 0,
      maxYawRate = 0
    const boundaries: Record<string, Record<string, number>> = {}
    for (const [i, id] of LAV_IDS.entries()) {
      const depart = (i < 4 ? 160 : 166) + (i % 4) * 3
      const craft = deriveLandingWorldState(depart).crafts[i < 4 ? 'attacker_lcac_01' : 'attacker_lcac_02']
      let previous = deriveLavPayload(craft, id, i % 4, depart),
        previousVelocity = new Vector3()
      boundaries[id] = {}
      for (let tick = 1; tick <= Math.round((180 - depart) * 40); tick++) {
        const t = depart + tick / 40,
          state = deriveLavPayload(craft, id, i % 4, t)
        const p = state.pose.position,
          old = previous.pose.position
        const velocity = new Vector3(p.x - old.x, p.y - old.y, p.z - old.z).multiplyScalar(40)
        maxSpeed = Math.max(maxSpeed, velocity.length())
        if (state.occupancy !== 'ashore') maxTransferSpeed = Math.max(maxTransferSpeed, velocity.length())
        if (tick > 1) maxAcceleration = Math.max(maxAcceleration, velocity.clone().sub(previousVelocity).length() * 40)
        maxPitchRate = Math.max(maxPitchRate, Math.abs(state.pose.rotation.x - previous.pose.rotation.x) * 40)
        maxRollRate = Math.max(maxRollRate, Math.abs(state.pose.rotation.z - previous.pose.rotation.z) * 40)
        maxYawRate = Math.max(maxYawRate, Math.abs(Math.atan2(Math.sin(state.pose.rotation.y - previous.pose.rotation.y), Math.cos(state.pose.rotation.y - previous.pose.rotation.y))) * 40)
        for (const w of state.wheels) maxSuspension = Math.max(maxSuspension, Math.abs(w.suspensionMeters))
        if (!boundaries[id]!.firstRamp && state.wheels.some((w) => w.surface === 'ramp')) boundaries[id]!.firstRamp = t
        if (!boundaries[id]!.lastDeck && !state.wheels.some((w) => w.surface === 'deck')) boundaries[id]!.lastDeck = t
        if (!boundaries[id]!.firstGround && state.wheels.some((w) => w.surface === 'ground')) boundaries[id]!.firstGround = t
        if (!boundaries[id]!.lastRamp && state.wheels.every((w) => w.surface === 'ground')) boundaries[id]!.lastRamp = t
        if (state.wheels.every((w) => w.surface === 'deck')) expect(state.dust).toEqual([])
        expect(state.dust.length).toBeLessThanOrEqual(8)
        for (const particle of state.dust) {
          expect(particle.ageSeconds).toBeGreaterThanOrEqual(0)
          expect(particle.ageSeconds).toBeLessThan(1.35)
        }
        previous = state
        previousVelocity = velocity
      }
    }
    const measurements = { maxTransferSpeed, maxSpeed, maxAcceleration, maxSuspension, maxPitchRate, maxRollRate, maxYawRate, boundaries }
    writeStage5cMeasurement('motion-measurements.json', measurements)
    expect(maxTransferSpeed).toBeLessThan(2.5)
    expect(maxYawRate).toBeLessThan(0.02)
    expect(maxPitchRate).toBeLessThan(0.2)
    expect(maxRollRate).toBeLessThan(0.03)
    expect(maxSpeed).toBeLessThan(5)
    expect(maxSuspension).toBeLessThan(0.27)
    expect(maxAcceleration).toBeLessThan(5)
  })
  it('reconstructs independent wheel travel and actual grounded-wheel dust births across nonmonotonic seeks', () => {
    const times = [0, 159.9, 160, 160.1, 163.15, 165.9, 166, 166.1, 168.2, 169, 172.05, 175, 175.9, 176, 176.1, 179.9, 180]
    const expected = new Map(times.map((t) => [t, deriveLandingWorldState(t)]))
    for (const t of [...times].reverse()) expect(deriveLandingWorldState(t)).toEqual(expected.get(t))
    for (const [i, id] of LAV_IDS.entries()) {
      const craft = expected.get(180)!.crafts[i < 4 ? 'attacker_lcac_01' : 'attacker_lcac_02']
      const state = expected.get(180)!.payload[id]
      for (const wheel of state.wheels) {
        expect(wheel.travelMeters).toBeGreaterThan(0)
        expect(wheel.rotationRadians).toBeCloseTo(-wheel.travelMeters / 0.49, 12)
      }
      for (const particle of state.dust) {
        const born = deriveLavPayload(craft, id, i % 4, particle.birthAtSeconds)
        const origin = { x: particle.position.x - particle.ageSeconds * 0.16, y: particle.position.y - 0.08 - particle.ageSeconds * 0.28, z: particle.position.z }
        expect(born.wheels.some((w) => w.surface === 'ground' && Math.hypot(w.contact.x - origin.x, w.contact.y - origin.y, w.contact.z - origin.z) < 1e-8)).toBe(true)
      }
      const timing = lavDeploymentTiming(Math.floor(i / 4), i % 4)
      if (timing.rampClearAtSeconds <= 180) {
        expect(deriveLavPayload(craft, id, i % 4, timing.rampClearAtSeconds - 0.001).occupancy).not.toBe('ashore')
        expect(deriveLavPayload(craft, id, i % 4, timing.rampClearAtSeconds + 0.001).occupancy).toBe('ashore')
      }
    }
  })
  it('keeps all eight wheel centres and wheel angles continuous at millisecond hinge/toe boundaries', () => {
    let maxWheelSpeed = 0,
      maxRootSpeed = 0,
      maxWheelAngleStep = 0
    for (const [i, id] of LAV_IDS.entries()) {
      const index = Math.floor(i / 4),
        slot = i % 4,
        depart = (index === 0 ? 160 : 166) + slot * 3
      const craft = deriveLandingWorldState(depart).crafts[index === 0 ? 'attacker_lcac_01' : 'attacker_lcac_02']
      const switches = index === 0 ? [3.15, 5.2, 6.075, 8.2] : [3.175, 5.2, 6.05, 8.175]
      for (const crossing of switches) {
        const at = depart + crossing + (slot >= 2 ? 4 : 0)
        if (at > 180) continue
        let previous = deriveLavPayload(craft, id, slot, at - 0.04)
        for (let tick = 1; tick <= 80; tick++) {
          const state = deriveLavPayload(craft, id, slot, at - 0.04 + tick / 1000)
          maxRootSpeed = Math.max(maxRootSpeed, Math.hypot(state.pose.position.x - previous.pose.position.x, state.pose.position.y - previous.pose.position.y, state.pose.position.z - previous.pose.position.z) * 1000)
          for (const [n, wheel] of state.wheels.entries()) {
            const old = previous.wheels[n]!
            maxWheelSpeed = Math.max(maxWheelSpeed, Math.hypot(wheel.center.x - old.center.x, wheel.center.y - old.center.y, wheel.center.z - old.center.z) * 1000)
            maxWheelAngleStep = Math.max(maxWheelAngleStep, Math.abs(wheel.rotationRadians - old.rotationRadians))
          }
          previous = state
        }
      }
    }
    writeStage5cMeasurement('boundary-continuity.json', { maxWheelSpeed, maxRootSpeed, maxWheelAngleStep })
    expect(maxRootSpeed).toBeLessThan(2.5)
    expect(maxWheelSpeed).toBeLessThan(5)
    expect(maxWheelAngleStep).toBeLessThan(0.01)
  })
})
