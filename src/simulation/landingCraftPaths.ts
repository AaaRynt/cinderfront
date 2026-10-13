import type { XZPoint } from '../scene/world/worldData'
import type { LcacId } from './landingCraftTypes'

import { LANDING_SITES } from '../scene/world/landing/landingSiteData'
import { createPath } from './groundMotion'
import { clamp } from './math'

export const LCAC_ROUTE_KNOTS: readonly (readonly XZPoint[])[] = [
  [
    [4250, -3720],
    [4260, -3530],
    [4290, -3330],
    [4300, -3160],
    [4320, -3050],
    [4311.0810828, -2968.7567643],
    [4300, -2920],
  ],
  [
    [5380, -3740],
    [5370, -3540],
    [5360, -3300],
    [5390, -3120],
    [5400, -2990],
    [5420.861424, -2912.4494368],
    [5450, -2860],
  ],
]
export function landingForward(index: number): XZPoint {
  const site = LANDING_SITES[index]!,
    dx = site.roadNext[0] - site.beach[0],
    dz = site.roadNext[1] - site.beach[1],
    length = Math.hypot(dx, dz)
  return [dx / length, dz / length]
}
interface CurveSegment {
  readonly a: XZPoint
  readonly b: XZPoint
  readonly ma: XZPoint
  readonly mb: XZPoint
}
function curvePoint(s: CurveSegment, t: number, derivative = false): XZPoint {
  const t2 = t * t,
    t3 = t2 * t
  const weights = derivative ? [6 * t2 - 6 * t, 3 * t2 - 4 * t + 1, -6 * t2 + 6 * t, 3 * t2 - 2 * t] : [2 * t3 - 3 * t2 + 1, t3 - 2 * t2 + t, -2 * t3 + 3 * t2, t3 - t2]
  return [0, 1].map((axis) => weights[0]! * s.a[axis]! + weights[1]! * s.ma[axis]! + weights[2]! * s.b[axis]! + weights[3]! * s.mb[axis]!) as unknown as XZPoint
}
function curveArc(s: CurveSegment, a: number, b: number) {
  const midpoint = (a + b) / 2,
    half = (b - a) / 2,
    q = Math.sqrt(3 / 5)
  return (
    half *
    [-q, 0, q].reduce((sum, p, i) => {
      const d = curvePoint(s, midpoint + p * half, true)
      return sum + Math.hypot(...d) * (i === 1 ? 8 / 9 : 5 / 9)
    }, 0)
  )
}
function smoothApproach(knots: readonly XZPoint[], terminal: XZPoint, gateIndex: number) {
  const tangents = knots.map((p, i): XZPoint => {
    if (i === knots.length - 1) {
      const before = knots[i - 1]!,
        length = Math.hypot(p[0] - before[0], p[1] - before[1])
      return [terminal[0] * length, terminal[1] * length]
    }
    if (i === 0) return [knots[1]![0] - p[0], knots[1]![1] - p[1]]
    const a = knots[i - 1]!,
      b = knots[i + 1]!,
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dx, dz),
      size = (Math.hypot(p[0] - a[0], p[1] - a[1]) + Math.hypot(b[0] - p[0], b[1] - p[1])) / 2
    if (i === knots.length - 2) return [terminal[0] * size, terminal[1] * size]
    return [(dx / length) * size, (dz / length) * size]
  })
  const points: XZPoint[] = [knots[0]!],
    knotIndices = [0],
    segments: CurveSegment[] = [],
    parameters = [{ segment: 0, u: 0 }],
    cumulativeDistances = [0]
  for (let i = 1; i < knots.length; i++) {
    const segment = { a: knots[i - 1]!, b: knots[i]!, ma: tangents[i - 1]!, mb: tangents[i]! },
      steps = Math.ceil(Math.hypot(segment.b[0] - segment.a[0], segment.b[1] - segment.a[1]) * 2)
    segments.push(segment)
    for (let step = 1; step <= steps; step++) {
      const u = step / steps
      points.push(curvePoint(segment, u))
      parameters.push({ segment: i - 1, u })
      cumulativeDistances.push(cumulativeDistances.at(-1)! + curveArc(segment, (step - 1) / steps, u))
    }
    knotIndices.push(points.length - 1)
  }
  // Dense chords serve reservations. Contact/motion evaluate the actual cubic
  // at inverted arc length, preserving C1 velocity at every authored knot.
  const path = { ...createPath(points), cumulativeDistances, lengthMeters: cumulativeDistances.at(-1)! }
  return { path, segments, parameters, gateDistanceMeters: cumulativeDistances[knotIndices[gateIndex]!]! }
}
export const LCAC_APPROACHES = LCAC_ROUTE_KNOTS.map((knots, i) => ({
  ...smoothApproach(knots, landingForward(i), i === 0 ? 3 : 4),
  knots,
  gateAtSeconds: i === 0 ? 140 : 148,
  beachAtSeconds: i === 0 ? 155 : 162,
  rampReadyAtSeconds: i === 0 ? 158.8 : 165.2,
  pathId: i === 0 ? 'path_lcac_beach_approach_west' : 'path_lcac_beach_approach_east',
}))
function sampleApproach(index: number, distance: number) {
  const route = LCAC_APPROACHES[index]!,
    table = route.path.cumulativeDistances
  let low = 0,
    high = table.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (table[middle]! <= distance) low = middle
    else high = middle
  }
  const parameter = route.parameters[high]!,
    segment = route.segments[parameter.segment]!,
    u0 = route.parameters[low]!.segment === parameter.segment ? route.parameters[low]!.u : 0,
    remaining = distance - table[low]!
  let u = u0 + (parameter.u - u0) * clamp(remaining / (table[high]! - table[low]!), 0, 1)
  for (let iteration = 0; iteration < 3; iteration++) {
    const derivative = curvePoint(segment, u, true)
    u = clamp(u - (curveArc(segment, u0, u) - remaining) / Math.hypot(...derivative), u0, parameter.u)
  }
  const [x, z] = curvePoint(segment, u),
    [dx, dz] = curvePoint(segment, u, true),
    length = Math.hypot(dx, dz)
  return { x, z, tangentX: dx / length, tangentZ: dz / length }
}
interface SpeedSegment {
  readonly atSeconds: number
  readonly duration: number
  readonly from: number
  readonly to: number
  readonly startDistance: number
  readonly roundedLinear?: boolean
}
function buildSpeedProfile(index: number): readonly SpeedSegment[] {
  const route = LCAC_APPROACHES[index]!,
    firstDuration = route.gateAtSeconds - 110,
    firstDistance = route.gateDistanceMeters,
    lastDuration = route.beachAtSeconds - route.gateAtSeconds,
    lastDistance = route.path.lengthMeters - firstDistance
  const gateSpeed = index === 0 ? 20 : 14
  const accelerationTime = index === 0 ? 16 : 12
  const approachBrakingTime = 6
  const cruiseSpeed = (firstDistance - (gateSpeed * approachBrakingTime) / 2) / (firstDuration - accelerationTime / 2 - approachBrakingTime / 2)
  const finalBrakingTime = 2 * (lastDuration - lastDistance / gateSpeed)
  if (finalBrakingTime <= 0 || finalBrakingTime > lastDuration || accelerationTime <= 0) throw new Error('LCAC event profile does not fit the measured path')
  const profile: SpeedSegment[] = []
  let at = 110,
    distance = 0
  const add = (duration: number, from: number, to: number, roundedLinear = false) => {
    if (duration <= 0) return
    profile.push({ atSeconds: at, duration, from, to, startDistance: distance, roundedLinear })
    at += duration
    distance += ((from + to) * duration) / 2
  }
  add(accelerationTime, 0, cruiseSpeed)
  add(firstDuration - accelerationTime - approachBrakingTime, cruiseSpeed, cruiseSpeed)
  add(approachBrakingTime, cruiseSpeed, gateSpeed)
  add(lastDuration - finalBrakingTime, gateSpeed, gateSpeed)
  add(finalBrakingTime, gateSpeed, 0, index === 0)
  return profile
}
export const LCAC_SPEED_PROFILES = LCAC_APPROACHES.map((_, i) => buildSpeedProfile(i))
/** Short jerk ramps around constant braking keep first contact slower while
 * fitting the unchanged west gate/stop distance, without exceeding 4.5 m/s². */
function roundedLinearEase(time: number, duration: number) {
  const edge = 0.6,
    denominator = duration - edge,
    remaining = duration - time
  if (time < edge) return { value: (time * time) / (2 * edge * denominator), integral: time ** 3 / (6 * edge * denominator), derivative: time / (edge * denominator) }
  if (remaining < edge) return { value: 1 - (remaining * remaining) / (2 * edge * denominator), integral: time - duration / 2 + remaining ** 3 / (6 * edge * denominator), derivative: remaining / (edge * denominator) }
  return { value: (time - edge / 2) / denominator, integral: ((time * time) / 2 - (edge * time) / 2 + (edge * edge) / 6) / denominator, derivative: 1 / denominator }
}
export function sampleLandingMotion(id: LcacId, time: number) {
  const index = id === 'attacker_lcac_01' ? 0 : 1,
    route = LCAC_APPROACHES[index]!,
    profile = LCAC_SPEED_PROFILES[index]!
  let distance = 0,
    speed = 0,
    acceleration = 0
  if (time >= route.beachAtSeconds) distance = route.path.lengthMeters
  else if (time > 110) {
    const segment = profile.find((s) => time < s.atSeconds + s.duration) ?? profile.at(-1)!
    const u = clamp((time - segment.atSeconds) / segment.duration, 0, 1),
      dv = segment.to - segment.from
    if (segment.roundedLinear) {
      const elapsed = u * segment.duration,
        ease = roundedLinearEase(elapsed, segment.duration)
      distance = segment.startDistance + segment.from * elapsed + dv * ease.integral
      speed = segment.from + dv * ease.value
      acceleration = dv * ease.derivative
    } else {
      distance = segment.startDistance + segment.duration * (segment.from * u + dv * (u ** 3 - u ** 4 / 2))
      speed = segment.from + dv * (u * u * (3 - 2 * u))
      acceleration = (dv * 6 * u * (1 - u)) / segment.duration
    }
  }
  if (time === route.gateAtSeconds) distance = route.gateDistanceMeters
  const point = sampleApproach(index, distance)
  const direction = distance >= route.path.lengthMeters ? landingForward(index) : [point.tangentX, point.tangentZ]
  return { ...point, tangentX: direction[0]!, tangentZ: direction[1]!, distanceMeters: distance, speedMetersPerSecond: speed, accelerationMetersPerSecondSquared: acceleration, index }
}
