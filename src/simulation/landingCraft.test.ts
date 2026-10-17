/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { LANDING_SITES } from '../scene/world/landing/landingSiteData'
import { getLandingSupportHeight } from '../scene/world/landing/landingTerrain'
import { SIMULATION_DURATION_SECONDS } from './constants'
import { deriveLandingCraft, deriveLandingWorldState, LANDING_PARTICLE_LIMIT, LANDING_PARTICLE_LIFETIME } from './landingCraft'
import { LANDING_CONTACT_POINTS, landingRampClearance, landingRampPoint, sampleLandingContact, transformLandingPoint } from './landingCraftContact'
import { landingQuaternion } from './landingCraftContact'
import { LCAC_IDS, LAV_IDS, LCAC_CARGO_CENTERS, LCAC_RAMP } from './landingCraftData'
import { LCAC_APPROACHES, sampleLandingMotion, landingForward } from './landingCraftPaths'
import { createSimulationStore, getSimulationWorldState } from './store'
import { SIMULATION_EVENTS, STAGE5B_EVENTS } from './timeline'

describe('Stage 5B measured approach and contact', () => {
  it('retains exactly two operational craft and eight persistent payloads, retaining every pre-departure attachment', () => {
    for (const time of [0, 109.9, 110, 110.1, 140, 148, 155, 159.9, 160, 162, 165.9, 166, 172, 174, 176]) {
      const world = deriveLandingWorldState(time)
      expect(world.orderedCraftIds).toEqual(LCAC_IDS)
      expect(world.orderedPayloadIds).toEqual(LAV_IDS)
      expect(Object.keys(world.crafts)).toEqual([...LCAC_IDS])
      expect(Object.keys(world.payload)).toEqual([...LAV_IDS])
      expect(world).toMatchObject({ operationalCraftCount: 2, operationalPayloadCount: 8 })
      for (const [index, id] of LCAC_IDS.entries()) {
        const craft = world.crafts[id]
        expect(craft).toMatchObject({ factionId: 'landings_attacker', condition: 'operational', outcome: 'active', payloadGroupId: `attacker_lav_group_0${index + 1}`, stagingRegionId: 'region_e_remote_beachhead' })
        expect(craft.payloadIds).toEqual(LAV_IDS.slice(index * 4, index * 4 + 4))
        for (const [slot, pid] of craft.payloadIds.entries()) {
          const payload = world.payload[pid],
            center = LCAC_CARGO_CENTERS[slot]!
          if (time > payload.departureAtSeconds) continue
          expect(payload).toMatchObject({ id: pid, carrierId: id, groupId: craft.payloadGroupId, factionId: 'landings_attacker', vehicleType: 'LAV-25', activity: 'embarked', condition: 'operational', outcome: 'active', wheelTravelMeters: 0, wheelRotationRadians: 0, dustIntensity: 0 })
          expect(payload.localPose).toEqual({ position: { x: center[0], y: craft.mechanics.deckLocalY, z: center[1] }, rotation: { x: 0, y: 0, z: 0 } })
          // Invert the full pitched/rolled carrier transform independently.
          const p = payload.pose.position,
            c = craft.pose.position,
            local = new Vector3(p.x - c.x, p.y - c.y, p.z - c.z).applyQuaternion(landingQuaternion(craft.pose).invert())
          expect(local.distanceTo(new Vector3(center[0], craft.mechanics.deckLocalY, center[1]))).toBeLessThan(1e-9)
        }
      }
    }
  })
  it('holds until the exact departure, gates independently of water polygons, and settles before ramp readiness', () => {
    expect(deriveLandingWorldState(0).crafts.attacker_lcac_01.waterRegion).toBe('broad-shallows')
    expect(deriveLandingWorldState(0).crafts.attacker_lcac_02.waterRegion).toBe('open-water')
    expect(deriveLandingCraft(LCAC_IDS[1], 130).waterRegion).toBe('broad-shallows')
    for (const [i, id] of LCAC_IDS.entries()) {
      const route = LCAC_APPROACHES[i]!,
        holding = deriveLandingCraft(id, 0),
        before = deriveLandingCraft(id, 109.9),
        depart = deriveLandingCraft(id, 110)
      expect(before.pose).toEqual(holding.pose)
      expect(before.travelDistanceMeters).toBe(0)
      expect(before.activity).toBe('holding')
      expect(before.particles).toEqual([])
      expect(depart.pose).toEqual(holding.pose)
      expect(depart.speedMetersPerSecond).toBe(0)
      expect(depart.activity).toBe('departing')
      expect(deriveLandingCraft(id, 110.1).speedMetersPerSecond).toBeGreaterThan(0)
      expect(deriveLandingCraft(id, route.gateAtSeconds - 0.001).nearshoreGateReached).toBe(false)
      const gate = deriveLandingCraft(id, route.gateAtSeconds)
      expect(gate.nearshoreGateReached).toBe(true)
      expect(gate.waterRegion).toBe('intertidal')
      expect(gate.speedMetersPerSecond).toBe(i === 0 ? 20 : 14)
      expect(deriveLandingCraft(id, i === 0 ? 142.5 : 153).speedMetersPerSecond).toBeLessThan(deriveLandingCraft(id, 130).speedMetersPerSecond)
      const arrival = deriveLandingCraft(id, route.beachAtSeconds)
      expect(arrival.activity).toBe('ramp-lowering')
      expect(arrival.mechanics.bowRampProgress).toBe(0)
      expect(arrival.mechanics.bowRampAngleRadians).toBe(LCAC_RAMP.closedAngle)
      const ready = deriveLandingCraft(id, route.rampReadyAtSeconds)
      expect(deriveLandingCraft(id, route.rampReadyAtSeconds - 0.001).mechanics.bowRampReady).toBe(false)
      expect(ready).toMatchObject({ activity: 'beached-ready', speedMetersPerSecond: 0, travelDistanceMeters: route.path.lengthMeters, mechanics: { bowRampReady: true, skirtCompression: 1, deckLocalY: 1.2, sternRampClosed: true } })
      expect(ready.mechanics.bowRampAngleRadians).toBeLessThan(0)
      expect(route.rampReadyAtSeconds).toBeLessThan(i === 0 ? 160 : 166)
      expect(ready.pose).toEqual(deriveLandingCraft(id, 176).pose)
    }
  })
  it('retains the five LCAC events within the complete 51-event scripted timeline', () => {
    expect(STAGE5B_EVENTS.map((e) => [e.id, e.atSeconds])).toEqual([
      ['lcac_departure', 110],
      ['lcac_01_shallow_water', 140],
      ['lcac_02_shallow_water', 148],
      ['lcac_01_beach', 155],
      ['lcac_02_beach', 162],
    ])
    expect(SIMULATION_EVENTS).toHaveLength(51)
    expect(new Set(SIMULATION_EVENTS.map((e) => e.id)).size).toBe(51)
    expect(SIMULATION_DURATION_SECONDS).toBe(180)
    expect(SIMULATION_EVENTS.filter((e) => /lav_|scripted_phase_complete/.test(e.id))).toHaveLength(4)
    const store = createSimulationStore({ timeSeconds: 174, isPlaying: true })
    store.getState().tick(10)
    expect(store.getState()).toMatchObject({ timeSeconds: 180, isPlaying: false })
    expect(getSimulationWorldState(store).landing.operationalPayloadCount).toBe(8)
  })
  it('measures both authored approaches, the full skirt crossing and ramp landing', () => {
    const measurements = LCAC_IDS.map((id, index) => {
      const route = LCAC_APPROACHES[index]!
      let peakSpeed = 0,
        peakAcceleration = 0,
        peakTurn = 0,
        minSkirtGap = Infinity,
        maxTipGap = 0,
        maxStep = 0,
        firstContact = Infinity,
        fullContact = Infinity
      let peakTurnTime = 0,
        peakVectorAcceleration = 0
      let previous = sampleLandingMotion(id, 110),
        previousContact = sampleLandingContact(id, 138)
      for (let time = 110.01; time <= route.beachAtSeconds; time += 0.01) {
        const motion = sampleLandingMotion(id, time)
        peakSpeed = Math.max(peakSpeed, motion.speedMetersPerSecond)
        peakAcceleration = Math.max(peakAcceleration, Math.abs(motion.accelerationMetersPerSecondSquared))
        peakVectorAcceleration = Math.max(peakVectorAcceleration, Math.hypot(motion.tangentX * motion.speedMetersPerSecond - previous.tangentX * previous.speedMetersPerSecond, motion.tangentZ * motion.speedMetersPerSecond - previous.tangentZ * previous.speedMetersPerSecond) / 0.01)
        const yaw = Math.atan2(-motion.tangentX, -motion.tangentZ),
          oldYaw = Math.atan2(-previous.tangentX, -previous.tangentZ)
        if (((Math.abs(Math.atan2(Math.sin(yaw - oldYaw), Math.cos(yaw - oldYaw))) / 0.01) * 180) / Math.PI > peakTurn) peakTurnTime = time
        peakTurn = Math.max(peakTurn, ((Math.abs(Math.atan2(Math.sin(yaw - oldYaw), Math.cos(yaw - oldYaw))) / 0.01) * 180) / Math.PI)
        previous = motion
      }
      for (let time = 138; time <= route.rampReadyAtSeconds + 0.001; time += 0.025) {
        const contact = sampleLandingContact(id, time)
        if (contact.landContactFraction > 0) firstContact = Math.min(firstContact, time)
        if (contact.landContactFraction === 1) fullContact = Math.min(fullContact, time)
        maxStep = Math.max(maxStep, Math.abs(contact.pose.position.y - previousContact.pose.position.y))
        for (const [x, z] of LANDING_CONTACT_POINTS) {
          const p = transformLandingPoint(contact.pose, { x, y: 0, z })
          minSkirtGap = Math.min(minSkirtGap, p.y - getLandingSupportHeight(p.x, p.z))
        }
        previousContact = contact
      }
      const final = deriveLandingCraft(id, 176)
      for (let i = 0; i <= 16; i++) {
        const p = landingRampPoint(final.pose, final.mechanics.deckLocalY, final.mechanics.bowRampAngleRadians, -4.1 + (8.2 * i) / 16)
        maxTipGap = Math.max(maxTipGap, p.y - getLandingSupportHeight(p.x, p.z))
      }
      const gate = sampleLandingMotion(id, route.gateAtSeconds),
        end = sampleLandingMotion(id, route.beachAtSeconds)
      expect([gate.x, gate.z]).toEqual([...LANDING_SITES[index]!.gate])
      expect([end.x, end.z]).toEqual([...LANDING_SITES[index]!.beach])
      expect([end.tangentX, end.tangentZ]).toEqual([...landingForward(index)])
      expect(peakSpeed).toBeLessThanOrEqual(30)
      expect(peakAcceleration).toBeLessThanOrEqual(4.5)
      expect(peakVectorAcceleration).toBeLessThanOrEqual(4.5)
      expect(peakTurn).toBeLessThan(12)
      expect(minSkirtGap).toBeGreaterThanOrEqual(0.01999)
      expect(maxStep).toBeLessThan(0.06)
      expect(landingRampClearance(final.pose, final.mechanics.deckLocalY, final.mechanics.bowRampAngleRadians)).toBeCloseTo(0.003, 8)
      expect(maxTipGap).toBeLessThan(0.03)
      return {
        id,
        length: route.path.lengthMeters,
        gateDistance: route.gateDistanceMeters,
        peakSpeed,
        peakAcceleration,
        peakVectorAcceleration,
        peakTurn,
        peakTurnTime,
        minSkirtGap,
        maxStep,
        firstContact,
        fullContact,
        finalPose: final.pose,
        rampAngle: final.mechanics.bowRampAngleRadians,
        rampTip: final.mechanics.rampTipPosition,
        maxTipGap,
        ready: route.rampReadyAtSeconds,
      }
    })
    if (process.env.CINDERFRONT_STAGE5B_MEASUREMENTS === '1') writeFileSync('stage5b-review.local/contact-measurements.json', JSON.stringify(measurements, null, 2) + '\n')
    const world = deriveLandingWorldState(176)
    expect(world.embarkedCount).toBe(3)
  })
  it('keeps full craft separation and C1 translation/heading through every knot and event', () => {
    let minimumSeparation = Infinity
    for (let time = 110; time <= 162; time += 0.025) {
      const a = sampleLandingMotion(LCAC_IDS[0], time),
        b = sampleLandingMotion(LCAC_IDS[1], time)
      minimumSeparation = Math.min(minimumSeparation, Math.hypot(a.x - b.x, a.z - b.z))
      for (const id of LCAC_IDS) {
        const point = sampleLandingMotion(id, time),
          before = sampleLandingMotion(id, time - 0.001),
          after = sampleLandingMotion(id, time + 0.001)
        const vx = (after.x - before.x) / 0.002,
          vz = (after.z - before.z) / 0.002
        expect(Math.hypot(vx - point.tangentX * point.speedMetersPerSecond, vz - point.tangentZ * point.speedMetersPerSecond)).toBeLessThan(0.006)
      }
    }
    expect(minimumSeparation).toBeGreaterThan(1000)
  })
  it('reconstructs bounded water/spray/dust births without future or accumulated trails', () => {
    let sawWater = false,
      sawSpray = false,
      sawSand = false
    for (const id of LCAC_IDS)
      for (const time of [0, 109.9, 110, 114, 125, 139.9, 140, 142.5, 148, 152.5, 154.9, 155, 156, 159.9, 162, 164, 165.9, 172, 176]) {
        const craft = deriveLandingCraft(id, time)
        expect(craft.particles.length).toBeLessThanOrEqual(LANDING_PARTICLE_LIMIT)
        expect(new Set(craft.particles.map((p) => p.id)).size).toBe(craft.particles.length)
        for (const p of craft.particles) {
          expect(p.birthAtSeconds).toBeGreaterThanOrEqual(110)
          expect(p.birthAtSeconds).toBeLessThanOrEqual(time)
          expect(p.ageSeconds).toBeGreaterThanOrEqual(0)
          expect(p.ageSeconds).toBeLessThan(LANDING_PARTICLE_LIFETIME)
          expect(p.opacity).toBeGreaterThanOrEqual(0)
          expect(p.opacity).toBeLessThanOrEqual(0.33)
          sawWater ||= p.kind === 'water'
          sawSpray ||= p.kind === 'spray'
          sawSand ||= p.kind === 'sand'
        }
        if (time <= 110 || time >= 172) expect(craft.particles).toEqual([])
        const expected = JSON.stringify(craft)
        deriveLandingCraft(id, 176)
        deriveLandingCraft(id, 0)
        expect(JSON.stringify(deriveLandingCraft(id, time))).toBe(expected)
      }
    expect([sawWater, sawSpray, sawSand]).toEqual([true, true, true])
  })
  it('freezes every mechanical/effect/cargo value on pause and resets identically for all speeds', () => {
    for (const speed of [0.5, 1, 2] as const) {
      const store = createSimulationStore({ timeSeconds: 140, isPlaying: true, speed })
      store.getState().tick(0.1)
      expect(store.getState().timeSeconds).toBeCloseTo(140 + 0.1 * speed, 10)
      store.getState().pause()
      const snapshot = getSimulationWorldState(store).landing
      for (let i = 0; i < 20; i++) store.getState().tick(0.2)
      expect(getSimulationWorldState(store).landing).toEqual(snapshot)
      for (const time of [159.9, 0, 110, 165.9, 142.5, 176, 109.9]) {
        store.getState().seek(time)
        expect(getSimulationWorldState(store).landing).toEqual(deriveLandingWorldState(time))
      }
      store.getState().restart()
      expect(getSimulationWorldState(store).landing).toEqual(deriveLandingWorldState(0))
      expect(store.getState().isPlaying).toBe(false)
    }
  })
})
