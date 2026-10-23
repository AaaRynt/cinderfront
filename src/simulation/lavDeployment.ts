import { Euler, Quaternion, Vector3 as ThreeVector3 } from 'three'

import type { EmbarkedLavState, LandingCraftState, LandingParticle, LavWheelState, LavId } from './landingCraftTypes'
import type { Pose3 } from './types'

import { LANDING_SITES } from '../scene/world/landing/landingSiteData'
import { getLandingSupportHeight } from '../scene/world/landing/landingTerrain'
import { landingQuaternion, sampleLandingContact, solveLandingRampAngle, transformLandingPoint } from './landingCraftContact'
import { LCAC_CARGO_CENTERS, LCAC_IDS, LCAC_RAMP, LAV_DIMENSIONS } from './landingCraftData'
import { clamp } from './math'

export const LAV_DEPARTURE_OFFSETS = [0, 3, 6, 9] as const
export const LAV_DUST_SLOTS = 8
export const LAV_DUST_LIFETIME = 1.35
export const LAV_DUST_INTERVAL = 0.18
const RADIUS = LAV_DIMENSIONS.wheelRadius
const HALF_TIRE = LAV_DIMENSIONS.wheelWidth / 2
const GRID = 0.2
const CHASSIS_GRID = 0.1
const MIN_STATION = -12
const MAX_STATION = 90
const TRACK_X = [-3.1, -0.5, 0.5, 3.1]
interface GroundTrack {
  x: number
  heights: number[]
  crossfalls: number[]
  arc: number[]
  lastArcHeight?: number
}
interface SupportContext {
  pose: Pose3
  deck: number
  angle: number
  toe: number
  tracks: GroundTrack[]
  right: ThreeVector3
  up: ThreeVector3
  back: ThreeVector3
  chassis: Map<string, { height: number; pitch: number; roll: number }>
}
interface Contact {
  height: number
  x: number
  y: number
  s: number
  surface: LavWheelState['surface']
}
interface Axis {
  x: number
  y: number
  s: number
}
// Only immutable surface tables and eight solved clearance stations are cached.
// Neither cache stores playback phase or depends on visit/mount order.
const contexts = new Map<number, SupportContext>()
const clearStations = new Map<string, number>()
const births = new Map<string, ReturnType<typeof kinematics>>()

export function lavDepartureAt(index: number, slot: number) {
  return (index === 0 ? 160 : 166) + LAV_DEPARTURE_OFFSETS[slot]!
}

function groundInCarrier(c: SupportContext, x: number, s: number) {
  const baseX = c.pose.position.x + c.right.x * x - c.back.x * s
  const baseY = c.pose.position.y + c.right.y * x - c.back.y * s
  const baseZ = c.pose.position.z + c.right.z * x - c.back.z * s
  let y = getLandingSupportHeight(baseX, baseZ) - baseY
  for (let i = 0; i < 3; i++) y += (getLandingSupportHeight(baseX + c.up.x * y, baseZ + c.up.z * y) - baseY - c.up.y * y) / c.up.y
  return y
}
function groundAt(c: SupportContext, track: GroundTrack, i: number) {
  if (track.heights[i] !== undefined) return
  const s = MIN_STATION + i * GRID
  const left = groundInCarrier(c, track.x - 0.25, s),
    right = groundInCarrier(c, track.x + 0.25, s)
  track.heights[i] = groundInCarrier(c, track.x, s)
  track.crossfalls[i] = (right - left) / 0.5
}

function contextFor(index: number): SupportContext {
  const cached = contexts.get(index)
  if (cached) return cached
  const contact = sampleLandingContact(LCAC_IDS[index]!, index === 0 ? 160 : 166)
  const angle = solveLandingRampAngle(contact.pose, contact.deckLocalY)
  const context: SupportContext = {
    pose: contact.pose,
    deck: contact.deckLocalY,
    angle,
    toe: -LCAC_RAMP.hingeZ + LCAC_RAMP.length * Math.cos(angle),
    tracks: [],
    right: new ThreeVector3(1, 0, 0).applyQuaternion(landingQuaternion(contact.pose)),
    up: new ThreeVector3(0, 1, 0).applyQuaternion(landingQuaternion(contact.pose)),
    back: new ThreeVector3(0, 0, 1).applyQuaternion(landingQuaternion(contact.pose)),
    chassis: new Map(),
  }
  const count = Math.round((MAX_STATION - MIN_STATION) / GRID) + 1
  context.tracks = TRACK_X.map((x) => ({ x, heights: new Array<number>(count), crossfalls: new Array<number>(count), arc: [] }))
  contexts.set(index, context)
  return context
}

/** Circle/cylinder support against finite planes and their actual end edges.
 * The ellipse is the tire disk projected into the carrier's longitudinal plane;
 * axle tilt and both 0.32 m tire shoulders participate in support. This rolls
 * over the deck overhang and the 12 cm panel toe instead of height-blending. */
function wheelSupport(c: SupportContext, x: number, s: number, axis: Axis): Contact {
  let best: Contact = { height: -Infinity, x, y: 0, s, surface: 'ground' }
  const choose = (height: number, px: number, py: number, ps: number, surface: Contact['surface']) => {
    if (height > best.height) best = { height, x: px, y: py, s: ps, surface }
  }
  const segment = (start: number, end: number, yStart: number, slope: number, crossfall: number, surface: Contact['surface'], stripeX?: number) => {
    const dot = -crossfall * axis.x + axis.y - slope * axis.s
    const normalLength = Math.sqrt(1 + slope * slope + crossfall * crossfall - dot * dot)
    const discX = (-RADIUS * (-crossfall - axis.x * dot)) / normalLength
    const widthLow = stripeX === undefined ? -HALF_TIRE : Math.max(-HALF_TIRE, (stripeX - 0.0375 - x - discX) / axis.x)
    const widthHigh = stripeX === undefined ? HALF_TIRE : Math.min(HALF_TIRE, (stripeX + 0.0375 - x - discX) / axis.x)
    if (widthLow > widthHigh) return
    const w = dot > 0 ? widthLow : dot < 0 ? widthHigh : clamp(0, widthLow, widthHigh)
    const dx = discX + w * axis.x
    const dy = (-RADIUS * (1 - axis.y * dot)) / normalLength + w * axis.y
    const ds = (-RADIUS * (-slope - axis.s * dot)) / normalLength + w * axis.s
    if (s + ds >= start && s + ds <= end) {
      const height = yStart + slope * (s - start) + RADIUS * normalLength - w * dot
      choose(height, x + dx, height + dy, s + ds, surface)
      return
    }
    // Exact circular contact with finite deck/ramp lips. Ground segment ends
    // also participate, so all candidates remain continuous across grid cells.
    const varianceS = RADIUS * RADIUS * (1 - axis.s * axis.s)
    const covariance = -RADIUS * RADIUS * axis.y * axis.s
    const varianceY = RADIUS * RADIUS * (1 - axis.y * axis.y)
    for (const edge of [clamp(s + ds, start, end)])
      for (const width of [widthLow, widthHigh]) {
        const deltaS = edge - s - width * axis.s
        if (deltaS * deltaS > varianceS) continue
        const py = (covariance / varianceS) * deltaS - Math.sqrt(Math.max(0, (varianceY - (covariance * covariance) / varianceS) * (1 - (deltaS * deltaS) / varianceS)))
        const px = -(axis.y * py + axis.s * deltaS) / axis.x
        const floor = yStart + slope * (edge - start) + crossfall * (px + width * axis.x)
        choose(floor - width * axis.y - py, x + width * axis.x + px, floor, edge, surface)
      }
  }
  segment(-10.2, 10.2, c.deck, 0, 0, 'deck')
  const hinge = -LCAC_RAMP.hingeZ
  segment(hinge, c.toe, c.deck, Math.tan(c.angle), 0, 'ramp')
  // The visible traction strips stand 12 mm proud of the panel. Only tires
  // actually overlapping a strip use its raised surface.
  for (const stripe of [-3, -1, 1, 3])
    if (Math.abs(x - stripe) <= HALF_TIRE + 0.0375) {
      const a = hinge + 0.1 * Math.cos(c.angle) - 0.012 * Math.sin(c.angle)
      const b = hinge + 5.9 * Math.cos(c.angle) - 0.012 * Math.sin(c.angle)
      segment(a, b, c.deck + 0.1 * Math.sin(c.angle) + 0.012 * Math.cos(c.angle), Math.tan(c.angle), 0, 'ramp', stripe)
    }
  const track = c.tracks.reduce((a, b) => (Math.abs(a.x - x) <= Math.abs(b.x - x) ? a : b))
  const low = Math.max(0, Math.floor((s - RADIUS - HALF_TIRE - MIN_STATION) / GRID))
  const high = Math.min(track.heights.length - 2, Math.ceil((s + RADIUS + HALF_TIRE - MIN_STATION) / GRID))
  for (let i = low; i <= high; i++) {
    groundAt(c, track, i)
    groundAt(c, track, i + 1)
    const a = MIN_STATION + i * GRID,
      cross = track.crossfalls[i]!
    const h0 = track.heights[i]! + cross * (x - track.x)
    const h1 = track.heights[i + 1]! + track.crossfalls[i + 1]! * (x - track.x)
    segment(a, a + GRID, h0, (h1 - h0) / GRID, cross, 'ground')
  }
  return best
}

const wheelAnchors = ([-1, 1] as const).flatMap((side) => LAV_DIMENSIONS.axleZ.map((z, axle) => ({ side, axle, point: new ThreeVector3(side * LAV_DIMENSIONS.wheelCentersX, RADIUS, z) })))
function fitChassis(c: SupportContext, x: number, s: number) {
  let height = c.deck,
    pitch = 0,
    roll = 0
  const q = new Quaternion(),
    point = new ThreeVector3(),
    axleAxis = new ThreeVector3()
  for (let iteration = 0; iteration < 3; iteration++) {
    q.setFromEuler(new Euler(pitch, 0, roll, 'YXZ'))
    axleAxis.set(1, 0, 0).applyQuaternion(q)
    let residual = 0,
      pitchResidual = 0,
      rollResidual = 0,
      pitchWeight = 0,
      rollWeight = 0
    for (const wheel of wheelAnchors) {
      point.copy(wheel.point).applyQuaternion(q)
      const support = wheelSupport(c, x + point.x, s - point.z, { x: axleAxis.x, y: axleAxis.y, s: -axleAxis.z })
      const error = support.height - height - point.y
      const forward = -wheel.point.z - 0.035
      residual += error
      pitchResidual += error * forward
      pitchWeight += forward * forward
      rollResidual += error * wheel.point.x
      rollWeight += wheel.point.x ** 2
    }
    const dp = pitchResidual / pitchWeight
    height += residual / 8 - dp * 0.035
    pitch = clamp(pitch + dp, -0.32, 0.32)
    roll = clamp(roll + rollResidual / rollWeight, -0.12, 0.12)
  }
  return { height, pitch, roll }
}
const CHASSIS_KERNEL = [1, 4, 7, 10, 12, 10, 7, 4, 1]
function chassisAt(c: SupportContext, x: number, s: number) {
  const f = (s - MIN_STATION) / CHASSIS_GRID,
    base = Math.floor(f),
    u = f - base
  const samples = [-1, 0, 1, 2].map((offset) => {
    const total = { height: 0, pitch: 0, roll: 0 }
    for (let i = 0; i < CHASSIS_KERNEL.length; i++) {
      const tick = base + offset + i - 4,
        key = `${x}:${tick}`
      let raw = c.chassis.get(key)
      if (!raw) {
        raw = fitChassis(c, x, MIN_STATION + tick * CHASSIS_GRID)
        c.chassis.set(key, raw)
      }
      const weight = CHASSIS_KERNEL[i]! / 56
      total.height += raw.height * weight
      total.pitch += raw.pitch * weight
      total.roll += raw.roll * weight
    }
    return total
  })
  const spline = (key: 'height' | 'pitch' | 'roll') => {
    const [a, b, d, e] = samples.map((v) => v[key]) as [number, number, number, number]
    return 0.5 * (2 * b + (-a + d) * u + (2 * a - 5 * b + 4 * d - e) * u * u + (-a + 3 * b - 3 * d + e) * u * u * u)
  }
  return { height: spline('height'), pitch: spline('pitch'), roll: spline('roll') }
}
function localSupport(c: SupportContext, x: number, s: number) {
  // Spatially filtered all-axle chassis preference; suspension is then solved
  // against unfiltered tire geometry below. C1 interpolation bounds chassis
  // response to sharp panel edges without moving or concealing those edges.
  const { height, pitch, roll } = chassisAt(c, x, s)
  const q = new Quaternion(),
    point = new ThreeVector3(),
    axleAxis = new ThreeVector3()
  q.setFromEuler(new Euler(pitch, 0, roll, 'YXZ'))
  const up = new ThreeVector3(0, 1, 0).applyQuaternion(q)
  axleAxis.set(1, 0, 0).applyQuaternion(q)
  const wheels = wheelAnchors.map((wheel) => {
    const anchor = wheel.point
      .clone()
      .applyQuaternion(q)
      .add(new ThreeVector3(x, height, -s))
    let suspension = 0
    let contact = wheelSupport(c, anchor.x, -anchor.z, { x: axleAxis.x, y: axleAxis.y, s: -axleAxis.z })
    for (let i = 0; i < 3; i++) {
      suspension = clamp(suspension + (contact.height - anchor.y - up.y * suspension) / up.y, -0.27, 0.27)
      contact = wheelSupport(c, anchor.x + up.x * suspension, -anchor.z - up.z * suspension, { x: axleAxis.x, y: axleAxis.y, s: -axleAxis.z })
    }
    const center = anchor.addScaledVector(up, suspension)
    return { ...wheel, suspension, center, contact }
  })
  const pose: Pose3 = { position: { x, y: height, z: -s }, rotation: { x: pitch, y: 0, z: roll } }
  // Conservative full model box includes hull, every wheel/marker and the
  // stowed cannon. All of it must pass the finite panel toe to count ashore.
  let lastZ = -Infinity
  for (const bx of [-1.471, 1.471])
    for (const by of [0, 2.69])
      for (const bz of [-3.75, 3.195]) {
        point.set(bx, by, bz).applyQuaternion(q)
        lastZ = Math.max(lastZ, point.z - s)
      }
  return { pose, wheels, rampClearanceMeters: -lastZ - c.toe }
}

function clearStation(index: number, slot: number) {
  const key = `${index}:${slot}`,
    cached = clearStations.get(key)
  if (cached !== undefined) return cached
  const c = contextFor(index),
    x = LCAC_CARGO_CENTERS[slot]![0]
  let low = 17,
    high = 22
  for (let i = 0; i < 28; i++) {
    const mid = (low + high) / 2
    if (localSupport(c, x, mid).rampClearanceMeters < 0) low = mid
    else high = mid
  }
  clearStations.set(key, high)
  return high
}
export function lavDeploymentTiming(index: number, slot: number) {
  const departureAtSeconds = lavDepartureAt(index, slot)
  const initialStation = -LCAC_CARGO_CENTERS[slot]![1]
  const clearDistanceMeters = clearStation(index, slot) - initialStation
  const rampClearAtSeconds = departureAtSeconds + (clearDistanceMeters + 2) / 2
  return { departureAtSeconds, clearDistanceMeters, rampClearAtSeconds, roadEntryAtSeconds: rampClearAtSeconds }
}

function motion(elapsed: number, clearDistance: number) {
  if (elapsed <= 0) return { distance: 0, speed: 0, acceleration: 0 }
  if (elapsed < 2) {
    const u = elapsed / 2
    return { distance: 4 * (u ** 3 - u ** 4 / 2), speed: 2 * u * u * (3 - 2 * u), acceleration: 6 * u * (1 - u) }
  }
  const accelerateAt = (clearDistance + 2) / 2 + 0.3
  if (elapsed <= accelerateAt) return { distance: 2 * elapsed - 2, speed: 2, acceleration: 0 }
  const dt = elapsed - accelerateAt,
    u = clamp(dt / 3, 0, 1)
  return { distance: 2 * elapsed - 2 + 7.5 * (u ** 3 - u ** 4 / 2) + 2.5 * Math.max(0, dt - 3), speed: 2 + 2.5 * u * u * (3 - 2 * u), acceleration: dt < 3 ? 5 * u * (1 - u) : 0 }
}
function trackArc(c: SupportContext, x: number, s: number) {
  const track = c.tracks.reduce((a, b) => (Math.abs(a.x - x) <= Math.abs(b.x - x) ? a : b))
  const f = clamp((s - MIN_STATION) / GRID, 0, track.heights.length - 1),
    i = Math.min(track.heights.length - 2, Math.floor(f)),
    u = f - i
  if (!track.arc.length) {
    track.arc.push(0)
    track.lastArcHeight = wheelSupport(c, track.x, MIN_STATION, { x: 1, y: 0, s: 0 }).height
  }
  while (track.arc.length <= i + 1) {
    const tick = track.arc.length,
      height = wheelSupport(c, track.x, MIN_STATION + tick * GRID, { x: 1, y: 0, s: 0 }).height
    track.arc.push(track.arc.at(-1)! + Math.hypot(GRID, height - track.lastArcHeight!))
    track.lastArcHeight = height
  }
  return track.arc[i]! + (track.arc[i + 1]! - track.arc[i]!) * u
}

function composePose(parent: Pose3, local: Pose3): Pose3 {
  const q = landingQuaternion(parent).multiply(landingQuaternion(local)),
    e = new Euler().setFromQuaternion(q, 'YXZ')
  return { position: transformLandingPoint(parent, local.position), rotation: { x: e.x, y: e.y, z: e.z } }
}
function kinematics(index: number, slot: number, time: number) {
  const c = contextFor(index),
    timing = lavDeploymentTiming(index, slot),
    [x, z] = LCAC_CARGO_CENTERS[slot]!,
    initialStation = -z
  const m = motion(time - timing.departureAtSeconds, timing.clearDistanceMeters)
  const local = localSupport(c, x, initialStation + m.distance)
  const wheels: LavWheelState[] = local.wheels.map((w) => {
    const travel = trackArc(c, w.center.x, -w.center.z) - trackArc(c, x + w.point.x, initialStation - w.point.z)
    return {
      side: w.side,
      axle: w.axle,
      suspensionMeters: w.suspension,
      steeringRadians: 0,
      travelMeters: Math.max(0, travel),
      rotationRadians: -Math.max(0, travel) / RADIUS,
      center: transformLandingPoint(c.pose, w.center),
      contact: transformLandingPoint(c.pose, { x: w.contact.x, y: w.contact.y, z: -w.contact.s }),
      surface: w.contact.surface,
    }
  })
  const allDeck = wheels.every((w) => w.surface === 'deck'),
    allRamp = wheels.every((w) => w.surface === 'ramp'),
    allGround = wheels.every((w) => w.surface === 'ground'),
    anyGround = wheels.some((w) => w.surface === 'ground')
  const ashore = local.rampClearanceMeters >= 0 && allGround
  const activity: EmbarkedLavState['activity'] = ashore ? 'inland-advance' : anyGround ? 'beach-clearance' : allDeck ? 'deck-transit' : 'ramp-transit'
  return {
    localPose: local.pose,
    pose: composePose(c.pose, local.pose),
    pathDistanceMeters: m.distance,
    speedMetersPerSecond: m.speed,
    accelerationMetersPerSecondSquared: m.acceleration,
    wheels,
    rampClearanceMeters: local.rampClearanceMeters,
    activity,
    occupancy: ashore ? ('ashore' as const) : allDeck ? ('embarked' as const) : ('transferring' as const),
    support: allDeck ? ('deck' as const) : allRamp ? ('ramp' as const) : allGround ? ('ground' as const) : ('mixed' as const),
  }
}

// Stage 6B reuses the unchanged finite near-craft solution through a measured
// station-72 handoff. Historical callers and all solver operations stay exact.
export const deriveLavNearKinematics = kinematics

export function deriveLavPayload(craft: LandingCraftState, id: LavId, slot: number, time: number): EmbarkedLavState {
  const index = craft.id === 'attacker_lcac_01' ? 0 : 1,
    departureAtSeconds = lavDepartureAt(index, slot),
    [x, z] = LCAC_CARGO_CENTERS[slot]!
  const localPose = { position: { x, y: craft.mechanics.deckLocalY, z }, rotation: { x: 0, y: 0, z: 0 } }
  const staticPose = { position: transformLandingPoint(craft.pose, localPose.position), rotation: { ...craft.pose.rotation } }
  const metadata = {
    id,
    groupId: craft.payloadGroupId,
    carrierId: craft.id,
    factionId: 'landings_attacker' as const,
    vehicleType: 'LAV-25' as const,
    condition: 'operational' as const,
    outcome: 'active' as const,
    departureAtSeconds,
    pathId: index === 0 ? ('path_lav_inland_west' as const) : ('path_lav_inland_east' as const),
    roadId: LANDING_SITES[index]!.roadId,
  }
  if (time <= departureAtSeconds || !craft.mechanics.bowRampReady)
    return {
      ...metadata,
      activity: 'embarked',
      localPose,
      pose: staticPose,
      wheelTravelMeters: 0,
      wheelRotationRadians: 0,
      dustIntensity: 0,
      pathDistanceMeters: 0,
      speedMetersPerSecond: 0,
      accelerationMetersPerSecondSquared: 0,
      rampClearanceMeters: -z - 3.195 + LCAC_RAMP.hingeZ - LCAC_RAMP.length * Math.cos(craft.mechanics.bowRampAngleRadians),
      occupancy: 'embarked',
      support: 'deck',
      attachedToCarrierId: craft.id,
      dust: [],
      wheels: wheelAnchors.map((w) => ({
        side: w.side,
        axle: w.axle,
        suspensionMeters: 0,
        steeringRadians: 0,
        travelMeters: 0,
        rotationRadians: 0,
        center: transformLandingPoint(craft.pose, { x: x + w.point.x, y: craft.mechanics.deckLocalY + RADIUS, z: z + w.point.z }),
        contact: transformLandingPoint(craft.pose, { x: x + w.point.x, y: craft.mechanics.deckLocalY, z: z + w.point.z }),
        surface: 'deck',
      })),
    }
  const k = kinematics(index, slot, time),
    dust: LandingParticle[] = []
  const tick = Math.floor((time - departureAtSeconds) / LAV_DUST_INTERVAL)
  for (let n = 0; n < LAV_DUST_SLOTS; n++) {
    const birthIndex = tick - n,
      birth = departureAtSeconds + birthIndex * LAV_DUST_INTERVAL,
      age = time - birth
    if (birthIndex < 0 || age < 0 || age >= LAV_DUST_LIFETIME) continue
    const key = `${id}:${birthIndex}`
    let atBirth = births.get(key)
    if (!atBirth) {
      atBirth = kinematics(index, slot, birth)
      births.set(key, atBirth)
      if (births.size > 128) births.delete(births.keys().next().value!)
    }
    const grounded = atBirth.wheels.filter((w) => w.surface === 'ground')
    if (!grounded.length || atBirth.speedMetersPerSecond < 0.05) continue
    const wheel = grounded[birthIndex % grounded.length]!,
      p = wheel.contact
    dust.push({
      id: `${id}-dust-${birthIndex}`,
      kind: 'sand',
      birthAtSeconds: birth,
      ageSeconds: age,
      position: { x: p.x + age * 0.16, y: p.y + 0.08 + age * 0.28, z: p.z },
      scale: { x: 0.18 + age * 0.6, y: 0.1 + age * 0.34, z: 0.22 + age * 0.7 },
      opacity: Math.sin((Math.PI * age) / LAV_DUST_LIFETIME) ** 2 * Math.min(0.12, atBirth.speedMetersPerSecond * 0.026),
    })
  }
  const travel = k.wheels.reduce((sum, w) => sum + w.travelMeters, 0) / 8
  return { ...metadata, ...k, attachedToCarrierId: k.support === 'deck' ? craft.id : null, wheelTravelMeters: travel, wheelRotationRadians: -travel / RADIUS, dustIntensity: dust.reduce((sum, p) => sum + p.opacity, 0), dust }
}
