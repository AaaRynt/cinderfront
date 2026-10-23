/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { Euler, Quaternion, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { getLandingSupportHeight } from '../scene/world/landing/landingTerrain'
import { ROAD_DEFINITIONS } from '../scene/world/stage2/stage2Data'
import { deriveRuntimeLandingWorldState } from './landingAftermath'
import { deriveLandingWorldState } from './landingCraft'
import { LAV_IDS, LAV_DIMENSIONS } from './landingCraftData'
import { deriveRuntimeLavPayload, getLavRoadCacheBounds, getLavRoadMeasurement, lavRoadTiming } from './lavAftermath'
import { lavDeploymentTiming } from './lavDeployment'

const gap = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
const angle = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))
function completeFootprint(state: ReturnType<typeof deriveRuntimeLavPayload>) {
  const r = state.pose.rotation,
    p = state.pose.position,
    q = new Quaternion().setFromEuler(new Euler(r.x, r.y, r.z, 'YXZ'))
  return [-1.6, 1.6].flatMap((x) => [-0.2, 2.69].flatMap((y) => [-3.8, 3.195].map((z) => new Vector3(x, y, z).applyQuaternion(q).add(new Vector3(p.x, p.y, p.z)))))
}
function separatingGap(a: ReturnType<typeof deriveRuntimeLavPayload>, b: ReturnType<typeof deriveRuntimeLavPayload>) {
  const pa = completeFootprint(a),
    pb = completeFootprint(b)
  let maximum = -Infinity
  for (const state of [a, b])
    for (const axisYaw of [state.pose.rotation.y, state.pose.rotation.y + Math.PI / 2]) {
      const x = Math.cos(axisYaw),
        z = -Math.sin(axisYaw),
        sa = pa.map((v) => v.x * x + v.z * z),
        sb = pb.map((v) => v.x * x + v.z * z)
      maximum = Math.max(maximum, Math.min(...sa) - Math.max(...sb), Math.min(...sb) - Math.max(...sa))
    }
  return maximum
}
function record(name: string, value: unknown) {
  if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1') writeFileSync(`stage6b-review.local/lav-${name}.json`, JSON.stringify(value, null, 2))
}
function actor(id: (typeof LAV_IDS)[number]) {
  const ordinal = LAV_IDS.indexOf(id),
    index = Math.floor(ordinal / 4),
    slot = ordinal % 4,
    craft = deriveLandingWorldState(180).crafts[index === 0 ? 'attacker_lcac_01' : 'attacker_lcac_02']
  return { index, slot, craft, timing: lavRoadTiming(index, slot, craft), at: (time: number) => deriveRuntimeLavPayload(craft, id, slot, time) }
}
function roadDistance(x: number, z: number, index: number) {
  const ps = ROAD_DEFINITIONS.find((r) => r.id === (index === 0 ? 'road_beach_exit' : 'road_beach_access_east'))!.points
  return Math.min(
    ...ps.slice(1).map((b, n) => {
      const a = ps[n]!,
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)))
      return Math.hypot(x - a[0] - u * dx, z - a[1] - u * dz)
    }),
  )
}

describe('Stage 6B complete landing continuation', () => {
  it.each([0, 110, 155, 160, 166, 169, 172, 175, 176, 179.9, 180])('retains every historical landing field at T+%s', (t) => {
    expect(deriveRuntimeLandingWorldState(t)).toEqual(deriveLandingWorldState(t))
  })

  it('retains exact handoff cargo counts and completes unloading by 188', () => {
    const end = deriveRuntimeLandingWorldState(180)
    expect([end.embarkedCount, end.transferringCount, end.ashoreCount]).toEqual([1, 2, 5])
    expect(deriveRuntimeLandingWorldState(188).ashoreCount).toBe(8)
  })

  it.each([LAV_IDS[3], LAV_IDS[6], LAV_IDS[7]])('%s completes its actual remaining full-envelope clearance', (id) => {
    const { index, slot, at } = actor(id),
      timing = lavDeploymentTiming(index, slot)
    expect(at(timing.rampClearAtSeconds - 0.001).occupancy).not.toBe('ashore')
    const clear = at(timing.rampClearAtSeconds + 0.001)
    expect(clear.occupancy).toBe('ashore')
    expect(clear.wheels.every((w) => w.surface === 'ground')).toBe(true)
    expect(clear.rampClearanceMeters).toBeGreaterThan(0)
    expect(clear.attachedToCarrierId).toBeNull()
    const transition = (predicate: (s: ReturnType<typeof at>) => boolean) => {
      let low = timing.departureAtSeconds,
        high = timing.rampClearAtSeconds + 0.01
      for (let n = 0; n < 28; n++) {
        const mid = (low + high) / 2
        if (predicate(at(mid))) high = mid
        else low = mid
      }
      return high
    }
    record(`unloading-${id}`, {
      ...timing,
      firstRamp: transition((s) => s.wheels.some((w) => w.surface === 'ramp')),
      lastDeck: transition((s) => !s.wheels.some((w) => w.surface === 'deck')),
      firstGround: transition((s) => s.wheels.some((w) => w.surface === 'ground')),
      allGround: transition((s) => s.wheels.every((w) => w.surface === 'ground')),
      detachedAndAshore: timing.rampClearAtSeconds,
    })
  })

  it('keeps the eight original identities and the grounded open craft indefinitely', () => {
    for (const t of [180, 188, 240, 360, 600, 1800, 3600, 7200, Number.MAX_VALUE]) {
      const s = deriveRuntimeLandingWorldState(t)
      expect(Object.keys(s.payload)).toEqual([...LAV_IDS])
      expect(s.orderedPayloadIds).toHaveLength(8)
      expect(s.operationalPayloadCount).toBe(8)
      for (const c of Object.values(s.crafts)) {
        expect(c.pose).toEqual(deriveLandingWorldState(180).crafts[c.id].pose)
        expect(c.mechanics.bowRampReady).toBe(true)
        expect(c.mechanics.sternRampClosed).toBe(true)
        expect(Number.isFinite(c.mechanics.fanRotationRadians)).toBe(true)
        expect(c.particles).toEqual([])
      }
    }
  })

  it.each(LAV_IDS)('%s joins the complete road before the old support bound without pose, wheels or velocity reset', (id) => {
    const { index, slot, craft, timing, at } = actor(id),
      t = timing.handoffAtSeconds,
      a = at(t - 0.001),
      b = at(t),
      c = at(t + 0.001)
    expect(gap(a.pose.position, b.pose.position)).toBeLessThan(0.005)
    expect(gap(b.pose.position, c.pose.position)).toBeLessThan(0.005)
    expect(Math.abs(angle(c.pose.rotation.y, b.pose.rotation.y))).toBeLessThan(0.001)
    for (let n = 0; n < 8; n++) {
      expect(gap(b.wheels[n]!.center, c.wheels[n]!.center)).toBeLessThan(0.008)
      expect(Math.abs(c.wheels[n]!.travelMeters - b.wheels[n]!.travelMeters)).toBeLessThan(0.008)
    }
    const before = at(t - 0.01),
      after = at(t + 0.01),
      velocityBefore = new Vector3(b.pose.position.x - before.pose.position.x, b.pose.position.y - before.pose.position.y, b.pose.position.z - before.pose.position.z).multiplyScalar(100),
      velocityAfter = new Vector3(after.pose.position.x - b.pose.position.x, after.pose.position.y - b.pose.position.y, after.pose.position.z - b.pose.position.z).multiplyScalar(100)
    expect(velocityAfter.distanceTo(velocityBefore)).toBeLessThan(0.08)
    const measurement = getLavRoadMeasurement(index, slot, craft)
    expect(measurement.nearAnchor.localPose.position.z).toBeCloseTo(-72, 9)
    expect(measurement.routeLengthMeters).toBeGreaterThan(index === 0 ? 790 : 900)
    const road = ROAD_DEFINITIONS.find((r) => r.id === (index === 0 ? 'road_beach_exit' : 'road_beach_access_east'))!
    const lastBend = road.points.at(-2)!
    const lastBendStation = measurement.points.reduce((best, p) => (Math.hypot(p.x - lastBend[0], p.z - lastBend[1]) < Math.hypot(best.x - lastBend[0], best.z - lastBend[1]) ? p : best)).distance
    expect(timing.holdStationMeters - lastBendStation).toBeGreaterThan(25)
    record(`handoff-${id}`, { ...timing, positionGap: gap(b.pose.position, c.pose.position), velocityDifference: velocityAfter.distanceTo(velocityBefore), lastBendStation, holdBeyondLastBendMeters: timing.holdStationMeters - lastBendStation, supportLookAheadBound: 72 + 3.195 + 0.49 + 0.16 + 0.6 })
  })

  it.each(LAV_IDS)('%s keeps every tire, belly and barrel supported inside the road through bends, grades and braking', (id) => {
    const { index, timing, at } = actor(id),
      start = timing.handoffAtSeconds
    let maxTireGap = 0,
      maxCylinderContactError = 0,
      maxCenterError = 0,
      minTireVertexGap = Infinity,
      maxSuspension = 0,
      maxYawRate = 0,
      maxPitchRate = 0,
      maxRollRate = 0,
      maxSteering = 0,
      maxSteeringRate = 0,
      minBelly = Infinity,
      minBarrel = Infinity,
      maxRoadDistance = 0,
      maxDeceleration = 0,
      minPitch = Infinity,
      maxPitch = -Infinity,
      minRoll = Infinity,
      maxRoll = -Infinity
    let previous = at(start)
    for (let tick = 1; tick <= Math.ceil((timing.holdAtSeconds - start) * 4) + 1; tick++) {
      const t = start + tick / 4,
        s = at(t),
        q = new Quaternion().setFromEuler(new Euler(s.pose.rotation.x, s.pose.rotation.y, s.pose.rotation.z, 'YXZ')),
        origin = new Vector3(s.pose.position.x, s.pose.position.y, s.pose.position.z)
      minPitch = Math.min(minPitch, s.pose.rotation.x)
      maxPitch = Math.max(maxPitch, s.pose.rotation.x)
      minRoll = Math.min(minRoll, s.pose.rotation.z)
      maxRoll = Math.max(maxRoll, s.pose.rotation.z)
      maxYawRate = Math.max(maxYawRate, Math.abs(angle(s.pose.rotation.y, previous.pose.rotation.y)) * 4)
      maxPitchRate = Math.max(maxPitchRate, Math.abs(s.pose.rotation.x - previous.pose.rotation.x) * 4)
      maxRollRate = Math.max(maxRollRate, Math.abs(s.pose.rotation.z - previous.pose.rotation.z) * 4)
      maxDeceleration = Math.max(maxDeceleration, -s.accelerationMetersPerSecondSquared)
      expect(s.speedMetersPerSecond).toBeGreaterThanOrEqual(0)
      expect(s.speedMetersPerSecond).toBeLessThanOrEqual(4.5)
      for (const [n, w] of s.wheels.entries()) {
        maxSuspension = Math.max(maxSuspension, Math.abs(w.suspensionMeters))
        maxSteering = Math.max(maxSteering, Math.abs(w.steeringRadians))
        maxSteeringRate = Math.max(maxSteeringRate, Math.abs(w.steeringRadians - previous.wheels[n]!.steeringRadians) * 4)
        maxTireGap = Math.max(maxTireGap, Math.abs(w.contact.y - getLandingSupportHeight(w.contact.x, w.contact.z)))
        const center = new Vector3(w.center.x, w.center.y, w.center.z),
          axis = new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), w.steeringRadians).applyQuaternion(q),
          contact = new Vector3(w.contact.x, w.contact.y, w.contact.z).sub(center),
          axial = contact.dot(axis)
        maxCylinderContactError = Math.max(maxCylinderContactError, Math.abs(contact.addScaledVector(axis, -axial).length() - LAV_DIMENSIONS.wheelRadius), Math.max(0, Math.abs(axial) - LAV_DIMENSIONS.wheelWidth / 2))
        const renderedCenter = new Vector3(w.side * LAV_DIMENSIONS.wheelCentersX, LAV_DIMENSIONS.wheelRadius + w.suspensionMeters, LAV_DIMENSIONS.axleZ[w.axle]!).applyQuaternion(q).add(origin)
        maxCenterError = Math.max(maxCenterError, renderedCenter.distanceTo(center))
        maxRoadDistance = Math.max(maxRoadDistance, roadDistance(w.contact.x, w.contact.z, index))
        expect(w.travelMeters).toBeGreaterThanOrEqual(previous.wheels[n]!.travelMeters - 1e-7)
        expect(w.rotationRadians).toBeCloseTo(-w.travelMeters / LAV_DIMENSIONS.wheelRadius, 10)
        // Match all forty actual cylinder rim vertices once per second, including
        // rolling phase, both shoulders, steering, suspension and the YXZ root.
        if (tick % 4 === 0)
          for (const shoulder of [-0.16, 0.16])
            for (let k = 0; k < 20; k++) {
              const a = (k * Math.PI) / 10 + w.rotationRadians,
                local = new Vector3(shoulder, Math.cos(a) * 0.49, Math.sin(a) * 0.49)
                  .applyAxisAngle(new Vector3(0, 1, 0), w.steeringRadians)
                  .applyQuaternion(q)
                  .add(center)
              minTireVertexGap = Math.min(minTireVertexGap, local.y - getLandingSupportHeight(local.x, local.z))
              maxRoadDistance = Math.max(maxRoadDistance, roadDistance(local.x, local.z, index))
            }
      }
      for (const x of [-1.25, 0, 1.25])
        for (let z = -3.195; z <= 3.196; z += 0.5325) {
          const p = new Vector3(x, 0.68, z).applyQuaternion(q).add(origin)
          minBelly = Math.min(minBelly, p.y - getLandingSupportHeight(p.x, p.z))
          maxRoadDistance = Math.max(maxRoadDistance, roadDistance(p.x, p.z, index))
        }
      for (const z of [-3.75, -1.85, 0.05]) {
        const p = new Vector3(0, 2.332, z).applyQuaternion(q).add(origin)
        minBarrel = Math.min(minBarrel, p.y - getLandingSupportHeight(p.x, p.z))
        maxRoadDistance = Math.max(maxRoadDistance, roadDistance(p.x, p.z, index))
      }
      previous = s
    }
    const measured = { maxTireGap, maxCylinderContactError, maxCenterError, minTireVertexGap, maxSuspension, maxYawRate, maxPitchRate, maxRollRate, maxSteering, maxSteeringRate, minBelly, minBarrel, maxRoadDistance, maxDeceleration, minPitch, maxPitch, minRoll, maxRoll }
    record(`motion-${id}`, measured)
    expect(maxTireGap).toBeLessThan(0.003)
    expect(maxCylinderContactError).toBeLessThan(0.004)
    expect(maxCenterError).toBeLessThan(1e-9)
    expect(minTireVertexGap).toBeGreaterThan(-0.01)
    expect(maxSuspension).toBeLessThan(0.2)
    expect(maxYawRate).toBeLessThan(0.18)
    expect(maxPitchRate).toBeLessThan(0.23)
    expect(maxRollRate).toBeLessThan(0.2)
    expect(maxSteering).toBeLessThan(0.15)
    expect(maxSteeringRate).toBeLessThan(0.08)
    expect(maxDeceleration).toBeLessThanOrEqual(0.84375)
    expect(minBelly).toBeGreaterThan(0.05)
    expect(minBarrel).toBeGreaterThan(1.9)
    expect(maxRoadDistance).toBeLessThan(5)
    const hold = at(timing.holdAtSeconds + 2)
    expect(hold.runtimeActivity).toBe('holding')
    expect(hold.speedMetersPerSecond).toBe(0)
    expect(hold.dust).toEqual([])
    expect(at(7200).pose).toEqual(hold.pose)
    expect(at(7200).wheels).toEqual(hold.wheels)
  })

  it.each(
    [0, 1].flatMap((index) =>
      [
        [190, 240],
        [240, 290],
        [290, 346],
      ].map(([start, finish]) => ({ index, start: start!, finish: finish! })),
    ),
  )('keeps carrier $index separated from $start through $finish, including terminal braking', ({ index, start, finish }) => {
    const base = index * 4,
      list = LAV_IDS.slice(base, base + 4).map(actor)
    let minimumSameLaneCenterGap = Infinity,
      minimumAllLaneEnvelopeGap = Infinity
    for (let t = start; t <= finish; t += 0.5) {
      const states = list.map((v) => v.at(t))
      for (const [a, b] of [
        [0, 2],
        [1, 3],
      ])
        minimumSameLaneCenterGap = Math.min(minimumSameLaneCenterGap, gap(states[a!]!.pose.position, states[b!]!.pose.position))
      // Project a complete conservative 3D box through each actual quaternion.
      // This includes steering, suspension/cant, wheel markers and the gun,
      // then measures a separating axis for every pair of different headings.
      for (let a = 0; a < states.length; a++)
        for (let b = a + 1; b < states.length; b++) {
          minimumAllLaneEnvelopeGap = Math.min(minimumAllLaneEnvelopeGap, separatingGap(states[a]!, states[b]!))
        }
    }
    expect(minimumSameLaneCenterGap).toBeGreaterThan(13)
    expect(minimumAllLaneEnvelopeGap).toBeGreaterThan(0.2)
    record(`spacing-${index}-${start}`, { minimumSameLaneCenterGap, minimumAllLaneEnvelopeGap, terminal: list.map((v) => ({ ...v.timing, pose: v.at(7200).pose })) })
  })

  it('reconstructs arbitrary seeks and bounds dust and every finite route cache', () => {
    const times = [180, 188, 240, 360, 600, 1800, 3600, 7200],
      expected = new Map(times.map((t) => [t, deriveRuntimeLandingWorldState(t)]))
    for (const t of [...times].reverse()) expect(deriveRuntimeLandingWorldState(t)).toEqual(expected.get(t))
    for (const t of times)
      for (const s of Object.values(expected.get(t)!.payload)) {
        expect(s.dust.length).toBeLessThanOrEqual(8)
        for (const p of s.dust) {
          expect(p.ageSeconds).toBeGreaterThanOrEqual(0)
          expect(p.ageSeconds).toBeLessThan(1.35)
        }
      }
    const bounds = getLavRoadCacheBounds()
    expect(bounds.routes).toBe(4)
    expect(bounds.centerlines).toBe(2)
    expect(bounds.births).toBeLessThanOrEqual(128)
    bounds.supportSamples.forEach((n, i) => expect(n).toBeLessThanOrEqual(bounds.maximumSupportSamples[i]!))
    bounds.wheelArcSamples.forEach((n, i) => expect(n).toBeLessThanOrEqual(bounds.maximumSupportSamples[i]!))
    record('cache-bounds', bounds)
  })
})
