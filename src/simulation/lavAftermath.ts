import { Euler, Quaternion, Vector3 as V3 } from 'three'

import type { XZPoint } from '../scene/world/worldData'
import type { EmbarkedLavState, LandingCraftState, LandingParticle, LavId, LavWheelState } from './landingCraftTypes'
import type { Pose3, Vector3 } from './types'

import { getLandingSupportHeight } from '../scene/world/landing/landingTerrain'
import { ROAD_DEFINITIONS } from '../scene/world/stage2/stage2Data'
import { landingQuaternion } from './landingCraftContact'
import { LCAC_CARGO_CENTERS, LAV_DIMENSIONS } from './landingCraftData'
import { deriveLavNearKinematics, deriveLavPayload, lavDeploymentTiming, LAV_DUST_INTERVAL, LAV_DUST_LIFETIME, LAV_DUST_SLOTS } from './lavDeployment'
import { clamp, smoothstep } from './math'

export const LAV_ROAD_HANDOFF_STATION = 72
export const LAV_ROAD_GRID_METERS = 0.5
export const LAV_ROAD_BRAKE_DISTANCE = 18
export const LAV_ROAD_SPEED = 4.5
export type RuntimeLavState = EmbarkedLavState & { readonly runtimeActivity?: 'unloading' | 'road-transit' | 'braking' | 'holding'; readonly roadStationMeters?: number; readonly roadHoldAtSeconds?: number; readonly roadHandoffAtSeconds?: number }
type Near = ReturnType<typeof deriveLavNearKinematics>
interface PathPoint {
  x: number
  z: number
  distance: number
  yaw: number
}
interface RawSupport {
  height: number
  pitch: number
  roll: number
}
interface RoadContext {
  index: number
  lane: number
  points: PathPoint[]
  length: number
  support: Map<number, RawSupport>
  wheelArc: number[][]
  anchor: Near
  handoff: number
  offsetHeight: number
  offsetPitch: number
  offsetRoll: number
  offsetYaw: number
  carrier: Pose3
}
const roadContexts = new Map<string, RoadContext>()
const handoffTimes = new Map<string, number>()
const handoffStates = new Map<string, EmbarkedLavState>()
const birthStates = new Map<string, RuntimeLavState>()
const radius = LAV_DIMENSIONS.wheelRadius
const anchors = ([-1, 1] as const).flatMap((side) => LAV_DIMENSIONS.axleZ.map((z, axle) => ({ side, axle, point: new V3(side * LAV_DIMENSIONS.wheelCentersX, radius, z) })))
const wrap = (v: number) => Math.atan2(Math.sin(v), Math.cos(v))
const point = (p: Vector3) => new V3(p.x, p.y, p.z)

function handoffTime(index: number, slot: number) {
  const key = `${index}:${slot}`,
    cached = handoffTimes.get(key)
  if (cached !== undefined) return cached
  const timing = lavDeploymentTiming(index, slot)
  const target = LAV_ROAD_HANDOFF_STATION + LCAC_CARGO_CENTERS[slot]![1]
  const accelerateAt = (timing.clearDistanceMeters + 2) / 2 + 0.3
  const at = timing.departureAtSeconds + (target + 5.75 + 2.5 * accelerateAt) / LAV_ROAD_SPEED
  handoffTimes.set(key, at)
  return at
}
function roadCenterline(index: number) {
  const road = ROAD_DEFINITIONS.find((r) => r.id === (index === 0 ? 'road_beach_exit' : 'road_beach_access_east'))!
  const samples: XZPoint[] = [road.points[0]!]
  const emitLine = (a: XZPoint, b: XZPoint) => {
    const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25)
    for (let n = 1; n <= steps; n++) samples.push([a[0] + ((b[0] - a[0]) * n) / steps, a[1] + ((b[1] - a[1]) * n) / steps])
  }
  let previous = road.points[0]! as XZPoint
  for (let n = 1; n < road.points.length - 1; n++) {
    const a = road.points[n - 1]!,
      b = road.points[n]!,
      d = road.points[n + 1]!
    const al = Math.hypot(b[0] - a[0], b[1] - a[1]),
      dl = Math.hypot(d[0] - b[0], d[1] - b[1]),
      trim = 14
    const ax = (b[0] - a[0]) / al,
      az = (b[1] - a[1]) / al,
      dx = (d[0] - b[0]) / dl,
      dz = (d[1] - b[1]) / dl
    const start: XZPoint = [b[0] - ax * trim, b[1] - az * trim],
      end: XZPoint = [b[0] + dx * trim, b[1] + dz * trim]
    emitLine(previous, start)
    // Quintic fillet: collinear first/last three controls give zero endpoint
    // curvature and a continuous steering transition into each straight.
    const controls = [start, [start[0] + ax * trim * 0.4, start[1] + az * trim * 0.4], [start[0] + ax * trim * 0.8, start[1] + az * trim * 0.8], [end[0] - dx * trim * 0.8, end[1] - dz * trim * 0.8], [end[0] - dx * trim * 0.4, end[1] - dz * trim * 0.4], end] as const
    for (let k = 1; k <= 160; k++) {
      const u = k / 160,
        v = 1 - u,
        weights = [v ** 5, 5 * v ** 4 * u, 10 * v ** 3 * u ** 2, 10 * v ** 2 * u ** 3, 5 * v * u ** 4, u ** 5]
      samples.push([controls.reduce((s, p, i) => s + p[0] * weights[i]!, 0), controls.reduce((s, p, i) => s + p[1] * weights[i]!, 0)])
    }
    previous = end
  }
  emitLine(previous, road.points.at(-1)!)
  return samples
}
const centerlines = new Map<number, readonly XZPoint[]>()
function pathFor(index: number, lane: number, anchor: Near): PathPoint[] {
  let centerline = centerlines.get(index)
  if (!centerline) {
    centerline = roadCenterline(index)
    centerlines.set(index, centerline)
  }
  const points: PathPoint[] = []
  const a = anchor.pose.position
  let started = false,
    distance = 0
  for (let n = 1; n < centerline.length - 1; n++) {
    const previous = centerline[n - 1]!,
      p = centerline[n]!,
      next = centerline[n + 1]!,
      l = Math.hypot(next[0] - previous[0], next[1] - previous[1]),
      dx = (next[0] - previous[0]) / l,
      dz = (next[1] - previous[1]) / l
    const x = p[0] + lane * -dz,
      z = p[1] + lane * dx
    if (!started) {
      if ((x - a.x) * dx + (z - a.z) * dz < 0) continue
      points.push({ x: a.x, z: a.z, distance: 0, yaw: anchor.pose.rotation.y })
      started = true
    }
    const last = points.at(-1)!,
      segment = Math.hypot(x - last.x, z - last.z)
    if (segment < 1e-5) continue
    distance += segment
    const blend = smoothstep(0, 24, distance),
      startX = a.x + dx * distance,
      startZ = a.z + dz * distance
    points.push({ x: startX + (x - startX) * blend, z: startZ + (z - startZ) * blend, distance, yaw: Math.atan2(-dx, -dz) })
  }
  // Recompute arc length and tangent from the actual offset curve.
  for (let n = 1; n < points.length; n++) points[n]!.distance = points[n - 1]!.distance + Math.hypot(points[n]!.x - points[n - 1]!.x, points[n]!.z - points[n - 1]!.z)
  for (let n = 1; n < points.length - 1; n++) points[n]!.yaw = Math.atan2(points[n - 1]!.x - points[n + 1]!.x, points[n - 1]!.z - points[n + 1]!.z)
  return points
}
function horizontal(c: RoadContext, station: number) {
  const s = clamp(station, 0, c.length),
    ps = c.points
  let lo = 0,
    hi = ps.length - 1
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1
    if (ps[m]!.distance < s) lo = m
    else hi = m
  }
  const a = ps[lo]!,
    b = ps[hi]!,
    u = (s - a.distance) / (b.distance - a.distance)
  return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, yaw: a.yaw + wrap(b.yaw - a.yaw) * u }
}
function tireSupport(center: V3, axle: V3) {
  let contact = center.clone(),
    height = -Infinity,
    bestContact = center.clone()
  for (let n = 0; n < 3; n++) {
    const slopeX = (getLandingSupportHeight(contact.x + 0.1, contact.z) - getLandingSupportHeight(contact.x - 0.1, contact.z)) / 0.2
    const slopeZ = (getLandingSupportHeight(contact.x, contact.z + 0.1) - getLandingSupportHeight(contact.x, contact.z - 0.1)) / 0.2
    const normal = new V3(-slopeX, 1, -slopeZ),
      dot = normal.dot(axle),
      disc = normal.clone().addScaledVector(axle, -dot).normalize().multiplyScalar(-radius)
    const width = dot > 0 ? -LAV_DIMENSIONS.wheelWidth / 2 : LAV_DIMENSIONS.wheelWidth / 2
    disc.addScaledVector(axle, width)
    contact = new V3(center.x + disc.x, 0, center.z + disc.z)
    contact.y = getLandingSupportHeight(contact.x, contact.z)
    const candidate = contact.y - disc.y
    if (candidate > height) {
      height = candidate
      bestContact = contact.clone()
    }
  }
  return { height, contact: bestContact }
}
function rawSupport(c: RoadContext, tick: number): RawSupport {
  const bounded = clamp(tick, 0, Math.ceil(c.length / LAV_ROAD_GRID_METERS)),
    cached = c.support.get(bounded)
  if (cached) return cached
  const h = horizontal(c, bounded * LAV_ROAD_GRID_METERS)
  let height = getLandingSupportHeight(h.x, h.z),
    pitch = 0,
    roll = 0
  for (let iteration = 0; iteration < 3; iteration++) {
    const q = new Quaternion().setFromEuler(new Euler(pitch, h.yaw, roll, 'YXZ'))
    let sum = 0,
      dp = 0,
      dr = 0,
      wp = 0,
      wr = 0
    for (const w of anchors) {
      const p = w.point
          .clone()
          .applyQuaternion(q)
          .add(new V3(h.x, height, h.z)),
        residual = getLandingSupportHeight(p.x, p.z) + radius - p.y,
        f = -w.point.z - 0.035
      sum += residual
      dp += residual * f
      dr += residual * w.point.x
      wp += f * f
      wr += w.point.x ** 2
    }
    height += sum / 8 - (dp / wp) * 0.035
    pitch = clamp(pitch + dp / wp, -0.7, 0.7)
    roll = clamp(roll + dr / wr, -0.4, 0.4)
  }
  const result = { height, pitch, roll }
  c.support.set(bounded, result)
  return result
}
function supportAt(c: RoadContext, s: number) {
  const f = clamp(s / LAV_ROAD_GRID_METERS, 0, c.length / LAV_ROAD_GRID_METERS),
    i = Math.floor(f),
    u = f - i
  const samples = [-1, 0, 1, 2].map((d) => rawSupport(c, i + d))
  const spline = (key: keyof RawSupport) => {
    const [a, b, d, e] = samples.map((p) => p[key]) as [number, number, number, number]
    return 0.5 * (2 * b + (-a + d) * u + (2 * a - 5 * b + 4 * d - e) * u * u + (-a + 3 * b - 3 * d + e) * u ** 3)
  }
  return { height: spline('height'), pitch: spline('pitch'), roll: spline('roll') }
}
function context(index: number, slot: number, craft: LandingCraftState) {
  const lane = LCAC_CARGO_CENTERS[slot]![0],
    key = `${index}:${lane}`
  let c = roadContexts.get(key)
  if (c) return c
  const handoff = handoffTime(index, slot),
    anchor = deriveLavNearKinematics(index, slot, handoff),
    points = pathFor(index, lane, anchor)
  c = { index, lane, points, length: points.at(-1)!.distance, support: new Map(), wheelArc: anchors.map(() => [0]), anchor, handoff, offsetHeight: 0, offsetPitch: 0, offsetRoll: 0, offsetYaw: 0, carrier: craft.pose }
  const s = supportAt(c, 0),
    h = horizontal(c, 0)
  c.offsetHeight = anchor.pose.position.y - s.height
  c.offsetPitch = anchor.pose.rotation.x - s.pitch
  c.offsetRoll = anchor.pose.rotation.z - s.roll
  c.offsetYaw = wrap(anchor.pose.rotation.y - h.yaw)
  roadContexts.set(key, c)
  return c
}
function roadPose(c: RoadContext, s: number): Pose3 {
  const h = horizontal(c, s),
    support = supportAt(c, s),
    fade = 1 - smoothstep(0, 24, s)
  return { position: { x: h.x, y: support.height + c.offsetHeight * fade, z: h.z }, rotation: { x: support.pitch + c.offsetPitch * fade, y: h.yaw + c.offsetYaw * fade, z: support.roll + c.offsetRoll * fade } }
}
function roadWheels(c: RoadContext, s: number) {
  const pose = roadPose(c, s),
    q = landingQuaternion(pose),
    up = new V3(0, 1, 0).applyQuaternion(q)
  const a = horizontal(c, s - 0.1),
    b = horizontal(c, s + 0.1),
    curvature = wrap(b.yaw - a.yaw) / Math.max(0.1, Math.min(c.length, s + 0.1) - Math.max(0, s - 0.1))
  return anchors.map((w) => {
    const steeringRadians = w.axle < 2 ? Math.atan(curvature * (1.39 - w.point.z)) : 0
    const axis = new V3(1, 0, 0).applyAxisAngle(new V3(0, 1, 0), steeringRadians).applyQuaternion(q),
      anchor = w.point.clone().applyQuaternion(q).add(point(pose.position))
    let suspension = 0,
      support = tireSupport(anchor, axis)
    for (let n = 0; n < 3; n++) {
      suspension = clamp(suspension + (support.height - anchor.y - up.y * suspension) / up.y, -0.4, 0.4)
      support = tireSupport(anchor.clone().addScaledVector(up, suspension), axis)
    }
    const center = anchor.addScaledVector(up, suspension)
    return { side: w.side, axle: w.axle, steeringRadians, suspensionMeters: suspension, center: { x: center.x, y: center.y, z: center.z }, contact: { x: support.contact.x, y: support.contact.y, z: support.contact.z }, surface: 'ground' as const }
  })
}
function wheelTravel(c: RoadContext, s: number, wheels: ReturnType<typeof roadWheels>) {
  const f = clamp(s / LAV_ROAD_GRID_METERS, 0, c.length / LAV_ROAD_GRID_METERS),
    i = Math.floor(f)
  while (c.wheelArc[0]!.length <= i) {
    const tick = c.wheelArc[0]!.length,
      oldPose = roadPose(c, (tick - 1) * LAV_ROAD_GRID_METERS),
      nextPose = roadPose(c, tick * LAV_ROAD_GRID_METERS)
    const oldQ = landingQuaternion(oldPose),
      nextQ = landingQuaternion(nextPose)
    for (let n = 0; n < anchors.length; n++) {
      const old = anchors[n]!.point.clone().applyQuaternion(oldQ).add(point(oldPose.position)),
        next = anchors[n]!.point.clone().applyQuaternion(nextQ).add(point(nextPose.position))
      c.wheelArc[n]!.push(c.wheelArc[n]!.at(-1)! + next.distanceTo(old))
    }
  }
  const u = f - i
  if (u > 0 && c.wheelArc[0]!.length <= i + 1) {
    const oldPose = roadPose(c, i * LAV_ROAD_GRID_METERS),
      nextPose = roadPose(c, (i + 1) * LAV_ROAD_GRID_METERS),
      oldQ = landingQuaternion(oldPose),
      nextQ = landingQuaternion(nextPose)
    for (let n = 0; n < anchors.length; n++)
      c.wheelArc[n]!.push(
        c.wheelArc[n]![i]! +
          anchors[n]!.point.clone()
            .applyQuaternion(nextQ)
            .add(point(nextPose.position))
            .distanceTo(anchors[n]!.point.clone().applyQuaternion(oldQ).add(point(oldPose.position))),
      )
  }
  return wheels.map((_, n) => c.wheelArc[n]![i]! + ((c.wheelArc[n]![i + 1] ?? c.wheelArc[n]![i]!) - c.wheelArc[n]![i]!) * u)
}
export function lavRoadTiming(index: number, slot: number, craft: LandingCraftState) {
  const c = context(index, slot, craft),
    handoffAtSeconds = handoffTime(index, slot)
  // First row stays ahead of its follower; alternating columns are staggered
  // by 8 m. Complete hulls remain well before the road ends/junctions.
  const holdStationMeters = c.length - (index === 0 ? 140 : 270) - (slot >= 2 ? 22 : 0) - (slot % 2 ? 8 : 0)
  const brakeAtSeconds = handoffAtSeconds + (holdStationMeters - LAV_ROAD_BRAKE_DISTANCE) / LAV_ROAD_SPEED
  return { handoffAtSeconds, holdAtSeconds: brakeAtSeconds + 8, brakeAtSeconds, holdStationMeters, routeLengthMeters: c.length }
}
function roadMotion(time: number, timing: ReturnType<typeof lavRoadTiming>) {
  if (time <= timing.brakeAtSeconds) return { station: (time - timing.handoffAtSeconds) * LAV_ROAD_SPEED, speed: LAV_ROAD_SPEED, acceleration: 0 }
  const u = clamp((time - timing.brakeAtSeconds) / 8, 0, 1),
    eased = u * u * (3 - 2 * u)
  return { station: timing.holdStationMeters - LAV_ROAD_BRAKE_DISTANCE + 36 * (u - u ** 3 + u ** 4 / 2), speed: LAV_ROAD_SPEED * (1 - eased), acceleration: u < 1 ? (-LAV_ROAD_SPEED * 6 * u * (1 - u)) / 8 : 0 }
}
function movingState(craft: LandingCraftState, id: LavId, slot: number, time: number, includeTravel = true): RuntimeLavState {
  const index = craft.id === 'attacker_lcac_01' ? 0 : 1,
    handoff = handoffTime(index, slot)
  if (time <= handoff) return { ...deriveLavPayload(craft, id, slot, time), runtimeActivity: 'unloading', roadHandoffAtSeconds: handoff }
  const c = context(index, slot, craft),
    timing = lavRoadTiming(index, slot, craft),
    m = roadMotion(time, timing),
    pose = roadPose(c, m.station),
    raw = roadWheels(c, m.station),
    arcs = includeTravel ? wheelTravel(c, m.station, raw) : raw.map(() => 0)
  const key = `${index}:${slot}`
  let original = handoffStates.get(key)
  if (!original) {
    original = deriveLavPayload(craft, id, slot, handoff)
    handoffStates.set(key, original)
  }
  const near = original
  const wheels: LavWheelState[] = raw.map((w, n) => {
    const travelMeters = near.wheels[n]!.travelMeters + arcs[n]!
    return { ...w, travelMeters, rotationRadians: -travelMeters / radius }
  })
  const travel = wheels.reduce((s, w) => s + w.travelMeters, 0) / 8,
    inverse = landingQuaternion(craft.pose).invert(),
    p = point(pose.position).sub(point(craft.pose.position)).applyQuaternion(inverse),
    e = new Euler().setFromQuaternion(inverse.multiply(landingQuaternion(pose)), 'YXZ')
  return {
    ...original,
    pose,
    localPose: { position: { x: p.x, y: p.y, z: p.z }, rotation: { x: e.x, y: e.y, z: e.z } },
    wheels,
    speedMetersPerSecond: m.speed,
    accelerationMetersPerSecondSquared: m.acceleration,
    pathDistanceMeters: near.pathDistanceMeters + m.station,
    wheelTravelMeters: travel,
    wheelRotationRadians: -travel / radius,
    rampClearanceMeters: near.rampClearanceMeters + m.station,
    activity: 'inland-advance',
    occupancy: 'ashore',
    support: 'ground',
    attachedToCarrierId: null,
    dust: [],
    dustIntensity: 0,
    runtimeActivity: time >= timing.holdAtSeconds ? 'holding' : time >= timing.brakeAtSeconds ? 'braking' : 'road-transit',
    roadStationMeters: m.station,
    roadHoldAtSeconds: timing.holdAtSeconds,
    roadHandoffAtSeconds: timing.handoffAtSeconds,
  }
}
export function deriveRuntimeLavPayload(craft: LandingCraftState, id: LavId, slot: number, time: number): RuntimeLavState {
  if (time <= 180) return deriveLavPayload(craft, id, slot, time)
  const state = movingState(craft, id, slot, time),
    dust: LandingParticle[] = [],
    tick = Math.floor((time - state.departureAtSeconds) / LAV_DUST_INTERVAL)
  if (state.roadHoldAtSeconds !== undefined && time >= state.roadHoldAtSeconds + LAV_DUST_LIFETIME) return state
  for (let n = 0; n < LAV_DUST_SLOTS; n++) {
    const birthIndex = tick - n,
      birth = state.departureAtSeconds + birthIndex * LAV_DUST_INTERVAL,
      age = time - birth
    if (birthIndex < 0 || age < 0 || age >= LAV_DUST_LIFETIME) continue
    const key = `${id}:${birthIndex}`
    let born = birthStates.get(key)
    if (!born) {
      born = movingState(craft, id, slot, birth, false)
      birthStates.set(key, born)
      if (birthStates.size > 128) birthStates.delete(birthStates.keys().next().value!)
    }
    const grounded = born.wheels.filter((w) => w.surface === 'ground')
    if (!grounded.length || born.speedMetersPerSecond < 0.05) continue
    const p = grounded[birthIndex % grounded.length]!.contact
    dust.push({
      id: `${id}-dust-${birthIndex}`,
      kind: 'sand',
      birthAtSeconds: birth,
      ageSeconds: age,
      position: { x: p.x + age * 0.16, y: p.y + 0.08 + age * 0.28, z: p.z },
      scale: { x: 0.18 + age * 0.6, y: 0.1 + age * 0.34, z: 0.22 + age * 0.7 },
      opacity: Math.sin((Math.PI * age) / LAV_DUST_LIFETIME) ** 2 * Math.min(0.12, born.speedMetersPerSecond * 0.026),
    })
  }
  return { ...state, dust, dustIntensity: dust.reduce((s, p) => s + p.opacity, 0) }
}
export function getLavRoadCacheBounds() {
  return {
    routes: roadContexts.size,
    centerlines: centerlines.size,
    supportSamples: Array.from(roadContexts.values(), (c) => c.support.size),
    maximumSupportSamples: Array.from(roadContexts.values(), (c) => Math.ceil(c.length / LAV_ROAD_GRID_METERS) + 1),
    wheelArcSamples: Array.from(roadContexts.values(), (c) => c.wheelArc[0]!.length),
    births: birthStates.size,
  }
}
export function getLavRoadMeasurement(index: number, slot: number, craft: LandingCraftState) {
  const c = context(index, slot, craft)
  return { ...lavRoadTiming(index, slot, craft), points: c.points, departure: lavDeploymentTiming(index, slot), nearAnchor: c.anchor, nearHandoff: c.handoff }
}
