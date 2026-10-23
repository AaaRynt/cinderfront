import type { SupportConvoyWorldState, SupportVehicleId, SupportVehicleState } from './supportConvoyTypes'
import type { Btr80GroundVehicleGroupState, Btr80GroundVehicleState, Btr80VehicleId, GroundVehicleDamageState, MolniyaState, SimulationWorldState, Stage4BWorldState, T72GroundVehicleGroupState, T72GroundVehicleState, T72VehicleId, Vector3, WaspState } from './types'

import { MAP_BOUNDS } from '../scene/world/worldData'
import { SCRIPTED_DURATION_SECONDS, STAGE1_FIXED_SEED } from './constants'
import { createGroundedPose, createPath, sampleOffsetPath } from './groundMotion'
import { SUPPORT_CONVOY_ROUTE_POINTS } from './groundVehicleRoutes'
import { BTR80_DIMENSIONS_METERS, deriveBtr80GroupState, deriveT72GroupState } from './groundVehicles'
import { clamp, headingBetween, lerp, smoothstep, yawForDirection } from './math'
import { deriveMolniyaState } from './stage3'
import { deriveSupportConvoyState, getSupportPresentationSurfaceHeight, SUPPORT_DIMENSIONS, SUPPORT_GROUND_CLEARANCE_METERS, SUPPORT_VEHICLE_IDS, SUPPORT_WHEEL_RADIUS_METERS } from './supportConvoy'

const TAU = Math.PI * 2
const SUPPORT_PATH = createPath(SUPPORT_CONVOY_ROUTE_POINTS)
const SUPPORT_LANES = [0, 0.2, -0.2, 0.15, -0.15, 0] as const
const WASP_OLD_POINTS = [
  [-4800, -2700],
  [-4400, -2900],
  [-4750, -3300],
  [-5200, -3000],
  [-4800, -2700],
] as const
const WASP_SPEED = WASP_OLD_POINTS.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - WASP_OLD_POINTS[i]![0], point[1] - WASP_OLD_POINTS[i]![1]), 0) / SCRIPTED_DURATION_SECONDS
const WASP_RADIUS = 850
const WASP_PERIOD = (TAU * WASP_RADIUS) / WASP_SPEED
const WASP_CENTER = { x: -4290, z: -3380 } as const
const WASP_INITIAL_RADIUS = { x: -510, z: 680 } as const
const SEED_PHASE = (STAGE1_FIXED_SEED % 360) * (Math.PI / 180)
const MOLNIYA_ANCHOR = deriveMolniyaState(SCRIPTED_DURATION_SECONDS)
const MOLNIYA_TANGENT = { x: -400 / Math.hypot(400, 40), z: -40 / Math.hypot(400, 40) } as const
// Includes hull/weapon extrema and the rendered damaged roll/bob. This is
// deliberately larger than the 56.9 x 10.2 m reference hull.
const MOLNIYA_X_ENVELOPE = Math.abs(MOLNIYA_TANGENT.x) * 29 + Math.abs(MOLNIYA_TANGENT.z) * 6 + 0.3
const MOLNIYA_FIRST_EXIT = SCRIPTED_DURATION_SECONDS + (MOLNIYA_ANCHOR.pose.position.x - MOLNIYA_X_ENVELOPE - MAP_BOUNDS.xMin) / (-MOLNIYA_TANGENT.x * MOLNIYA_ANCHOR.speedMetersPerSecond)
const MOLNIYA_FULL_EXIT = SCRIPTED_DURATION_SECONDS + (MOLNIYA_ANCHOR.pose.position.x + MOLNIYA_X_ENVELOPE - MAP_BOUNDS.xMin) / (-MOLNIYA_TANGENT.x * MOLNIYA_ANCHOR.speedMetersPerSecond)
const MOLNIYA_TERMINAL = SCRIPTED_DURATION_SECONDS + (MOLNIYA_ANCHOR.pose.position.x - (MAP_BOUNDS.xMin - 100)) / (-MOLNIYA_TANGENT.x * MOLNIYA_ANCHOR.speedMetersPerSecond)

export const SURVIVOR_CONTINUATION_LIMITS = {
  btr: { brakeSeconds: 7.5, stopSeconds: 187.5, extraTravelMeters: 60 },
  t72: { brakeSeconds: 2, stopSeconds: 182, extraReverseMeters: [4.5, 4] },
  supportLocal: { brakeSeconds: 6, stopSeconds: 186, extraReverseMeters: 2.7 },
  supportRear: { cruiseSeconds: 38, brakeSeconds: 6, stopSeconds: 224, extraReverseMeters: 123 },
  wasp: { radiusMeters: WASP_RADIUS, speedMetersPerSecond: WASP_SPEED, periodSeconds: WASP_PERIOD, center: WASP_CENTER },
  molniya: { firstHullExitSeconds: MOLNIYA_FIRST_EXIT, fullHullExitSeconds: MOLNIYA_FULL_EXIT, terminalSeconds: MOLNIYA_TERMINAL, xEnvelopeMeters: MOLNIYA_X_ENVELOPE, terminalX: MAP_BOUNDS.xMin - 100 },
} as const

export interface SurvivorContinuationMetadata {
  readonly effectClock: 'runtime'
  readonly wasp: { readonly activity: 'scripted' | 'offshore-patrol'; readonly speedMetersPerSecond: number; readonly velocity: Vector3; readonly periodSeconds: number }
  readonly molniya: ReturnType<typeof getMolniyaRuntimePresentation>
  readonly ground: Readonly<Record<Btr80VehicleId | T72VehicleId | SupportVehicleId, { readonly activity: 'fixed-wreck' | 'withdrawing' | 'holding'; readonly stopSeconds: number }>>
}
export interface RuntimeSurvivorState {
  readonly wasp: WaspState
  readonly molniya: MolniyaState
  readonly stage4b: Stage4BWorldState
  readonly stage4b2c: SupportConvoyWorldState
  readonly metadata: SurvivorContinuationMetadata
}

function safeTime(time: number) {
  return Number.isFinite(time) ? Math.max(0, time) : 0
}
function periodicSine(time: number, frequency: number, offset = 0) {
  return Math.sin(((time % (TAU / frequency)) * frequency + offset) % TAU)
}

/** Integral and derivatives of a cruise followed by a C1 smooth speed ramp. */
export function sampleSurvivorBraking(elapsed: number, brakeSeconds: number, cruiseSeconds = 0) {
  const t = Math.max(0, elapsed)
  const u = clamp((t - cruiseSeconds) / brakeSeconds, 0, 1)
  return {
    equivalentSeconds: Math.min(t, cruiseSeconds) + brakeSeconds * (u - u ** 3 + u ** 4 / 2),
    velocityScale: 1 - u * u * (3 - 2 * u),
    accelerationScale: t > cruiseSeconds && t < cruiseSeconds + brakeSeconds ? (-6 * u * (1 - u)) / brakeSeconds : 0,
    stopped: t >= cruiseSeconds + brakeSeconds,
  }
}

function continuingDamage(damage: GroundVehicleDamageState, elapsed: number): GroundVehicleDamageState {
  return damage.causeEventId ? { ...damage, ageSeconds: damage.ageSeconds + elapsed } : damage
}

export function deriveRuntimeBtrGroupState(timeSeconds: number): Btr80GroundVehicleGroupState {
  const time = safeTime(timeSeconds)
  if (time <= SCRIPTED_DURATION_SECONDS) return deriveBtr80GroupState(time)
  const elapsed = time - SCRIPTED_DURATION_SECONDS
  const motion = sampleSurvivorBraking(elapsed, SURVIVOR_CONTINUATION_LIMITS.btr.brakeSeconds)
  const group = deriveBtr80GroupState(SCRIPTED_DURATION_SECONDS + motion.equivalentSeconds)
  const vehicles = Object.fromEntries(
    Object.values(group.vehicles).map((vehicle): [Btr80VehicleId, Btr80GroundVehicleState] => {
      if (vehicle.physicalCondition !== 'operational') return [vehicle.id, { ...vehicle, damage: continuingDamage(deriveBtr80GroupState(SCRIPTED_DURATION_SECONDS).vehicles[vehicle.id].damage, elapsed) }]
      const speed = vehicle.speedMetersPerSecond * motion.velocityScale
      return [
        vehicle.id,
        {
          ...vehicle,
          activity: motion.stopped ? 'movement-complete' : vehicle.activity,
          motionDirection: motion.stopped ? 'stationary' : 'forward',
          speedMetersPerSecond: speed,
          longitudinalSpeedMetersPerSecond: speed,
          accelerationMetersPerSecondSquared: 16 * motion.accelerationScale,
          dustIntensity: smoothstep(1.5, 8, speed) * 0.28,
        },
      ]
    }),
  ) as Record<Btr80VehicleId, Btr80GroundVehicleState>
  return { ...group, vehicles, activity: motion.stopped ? 'movement-complete' : group.activity, withdrawingCount: motion.stopped ? 0 : 3 }
}

export function deriveRuntimeT72GroupState(timeSeconds: number): T72GroundVehicleGroupState {
  const time = safeTime(timeSeconds)
  if (time <= SCRIPTED_DURATION_SECONDS) return deriveT72GroupState(time)
  const elapsed = time - SCRIPTED_DURATION_SECONDS
  const motion = sampleSurvivorBraking(elapsed, SURVIVOR_CONTINUATION_LIMITS.t72.brakeSeconds)
  // The rear tank has only 8.339 m of the original reverse path left at 180.
  // Stopping after 4 m preserves its complete hull before the path boundary.
  const group = deriveT72GroupState(SCRIPTED_DURATION_SECONDS + motion.equivalentSeconds)
  const vehicles = Object.fromEntries(
    Object.values(group.vehicles).map((vehicle): [T72VehicleId, T72GroundVehicleState] => {
      if (vehicle.physicalCondition !== 'operational') return [vehicle.id, { ...vehicle, damage: continuingDamage(deriveT72GroupState(SCRIPTED_DURATION_SECONDS).vehicles[vehicle.id].damage, elapsed) }]
      const speed = vehicle.speedMetersPerSecond * motion.velocityScale
      return [
        vehicle.id,
        {
          ...vehicle,
          activity: motion.stopped ? 'movement-complete' : vehicle.activity,
          motionDirection: motion.stopped ? 'stationary' : 'reverse',
          speedMetersPerSecond: speed,
          longitudinalSpeedMetersPerSecond: speed === 0 ? 0 : -speed,
          accelerationMetersPerSecondSquared: -vehicle.speedMetersPerSecond * motion.accelerationScale,
          dustIntensity: smoothstep(1, 7, speed) * 0.34,
        },
      ]
    }),
  ) as Record<T72VehicleId, T72GroundVehicleState>
  return { ...group, vehicles, activity: motion.stopped ? 'movement-complete' : group.activity, withdrawingCount: motion.stopped ? 0 : 2 }
}

export function sampleRuntimeGroundVehicle(id: Btr80VehicleId | T72VehicleId, timeSeconds: number): Btr80GroundVehicleState | T72GroundVehicleState {
  return id.startsWith('defender_btr') ? deriveRuntimeBtrGroupState(timeSeconds).vehicles[id as Btr80VehicleId] : deriveRuntimeT72GroupState(timeSeconds).vehicles[id as T72VehicleId]
}

let supportBoundary: SupportConvoyWorldState | undefined
function supportAnchor() {
  return (supportBoundary ??= deriveSupportConvoyState(SCRIPTED_DURATION_SECONDS))
}
function deriveRuntimeSupportVehicle(time: number, order: number): SupportVehicleState {
  const baseline = supportAnchor().convoy.vehicles[SUPPORT_VEHICLE_IDS[order]!]
  const elapsed = time - SCRIPTED_DURATION_SECONDS
  const motion = sampleSurvivorBraking(elapsed, 6, order >= 3 ? 38 : 0)
  const distance = baseline.speedMetersPerSecond * motion.equivalentSeconds
  const station = baseline.routeStationMeters - distance
  const sample = sampleOffsetPath(SUPPORT_PATH, station, SUPPORT_LANES[order]!)
  const speed = baseline.speedMetersPerSecond * motion.velocityScale
  const stationary = speed === 0
  const d = SUPPORT_DIMENSIONS[baseline.subtype]
  const cycle = (((time - 75 + baseline.lighting.beaconPhaseOffsetSeconds) % 0.9) + 0.9) % 0.9
  return {
    ...baseline,
    activity: order === 0 || motion.stopped ? 'holding' : order < 3 ? 'limited_reposition' : 'reversing',
    pose:
      order === 0 ? baseline.pose : createGroundedPose({ position: [sample.x, sample.z], hullTangent: [sample.tangentX, sample.tangentZ], heightMeters: d.height, halfLengthMeters: 2.6, halfWidthMeters: 1.05, groundClearanceMeters: SUPPORT_GROUND_CLEARANCE_METERS, surfaceHeightAt: getSupportPresentationSurfaceHeight }),
    routeTangent: order === 0 ? baseline.routeTangent : { x: -sample.tangentX, y: 0, z: -sample.tangentZ },
    motionDirection: stationary ? 'stationary' : 'reverse',
    speedMetersPerSecond: speed,
    longitudinalSpeedMetersPerSecond: speed === 0 ? 0 : -speed,
    accelerationMetersPerSecondSquared: -baseline.speedMetersPerSecond * motion.accelerationScale,
    traveledDistanceMeters: baseline.traveledDistanceMeters - distance,
    routeStationMeters: station,
    drivetrain: { ...baseline.drivetrain, wheelRotationRadians: (baseline.traveledDistanceMeters - distance) / SUPPORT_WHEEL_RADIUS_METERS },
    dustIntensity: speed / 100,
    lighting: { ...baseline.lighting, brakeLights: stationary || motion.accelerationScale < -0.001, reverseLights: !stationary, beaconIntensity: cycle < 0.16 || (cycle >= 0.28 && cycle < 0.39) ? 1 : 0.08 },
  }
}

export function sampleRuntimeSupportVehicle(id: SupportVehicleId, timeSeconds: number): SupportVehicleState {
  const time = safeTime(timeSeconds)
  return time <= SCRIPTED_DURATION_SECONDS ? deriveSupportConvoyState(time).convoy.vehicles[id] : deriveRuntimeSupportVehicle(time, SUPPORT_VEHICLE_IDS.indexOf(id))
}

export function deriveRuntimeSupportConvoyState(timeSeconds: number): SupportConvoyWorldState {
  const time = safeTime(timeSeconds)
  if (time <= SCRIPTED_DURATION_SECONDS) return deriveSupportConvoyState(time)
  const baseline = supportAnchor()
  const list = SUPPORT_VEHICLE_IDS.map((_, order) => deriveRuntimeSupportVehicle(time, order))
  const vehicles = Object.fromEntries(list.map((v) => [v.id, v])) as Record<SupportVehicleId, SupportVehicleState>
  const centroid = list.reduce((sum, v) => ({ x: sum.x + v.pose.position.x / 6, y: sum.y + v.pose.position.y / 6, z: sum.z + v.pose.position.z / 6 }), { x: 0, y: 0, z: 0 })
  const bridge = baseline.bridge.position
  return {
    ...baseline,
    convoy: { ...baseline.convoy, vehicles, holdingCount: list.filter((v) => v.activity === 'holding').length, repositioningCount: list.filter((v) => v.activity === 'limited_reposition').length, withdrawingCount: list.filter((v) => v.responseRole === 'rear_withdrawal' && v.motionDirection === 'reverse').length },
    bridge: { ...baseline.bridge, ageSeconds: baseline.bridge.ageSeconds + time - SCRIPTED_DURATION_SECONDS },
    camera: { ...baseline.camera, anchor: { ...baseline.camera.anchor, position: { x: lerp(centroid.x, bridge.x, 0.2), y: lerp(centroid.y, bridge.y + 2, 0.2), z: lerp(centroid.z, bridge.z, 0.2) } } },
  }
}

/** A continuous position/tangent seam; only the periodic patrol phase wraps. */
export function deriveRuntimeWaspState(timeSeconds: number, baseline: WaspState): WaspState {
  const time = safeTime(timeSeconds)
  if (time <= SCRIPTED_DURATION_SECONDS) return baseline
  const elapsed = time - SCRIPTED_DURATION_SECONDS
  const angle = ((elapsed % WASP_PERIOD) * WASP_SPEED) / WASP_RADIUS
  const cosine = Math.cos(angle),
    sine = Math.sin(angle)
  const rx = WASP_INITIAL_RADIUS.x * cosine + WASP_INITIAL_RADIUS.z * sine
  const rz = WASP_INITIAL_RADIUS.z * cosine - WASP_INITIAL_RADIUS.x * sine
  const tangent = { x: rz / WASP_RADIUS, y: 0, z: -rx / WASP_RADIUS }
  return { ...baseline, pathProgress: 1, pose: { position: { x: WASP_CENTER.x + rx, y: periodicSine(time, 0.45, SEED_PHASE) * 0.3, z: WASP_CENTER.z + rz }, rotation: { x: periodicSine(time, 0.19, SEED_PHASE) * 0.004, y: yawForDirection(tangent), z: periodicSine(time, 0.27, SEED_PHASE * 0.5) * 0.007 } } }
}

export function getMolniyaRuntimePresentation(timeSeconds: number) {
  const time = safeTime(timeSeconds)
  return {
    visible: time < MOLNIYA_FULL_EXIT,
    opacity: 1 - smoothstep(MOLNIYA_FIRST_EXIT, MOLNIYA_FULL_EXIT, time),
    mapPresence: time >= MOLNIYA_FULL_EXIT ? ('departed' as const) : ('present' as const),
    emissionEndSeconds: MOLNIYA_FULL_EXIT,
    firstHullExitSeconds: MOLNIYA_FIRST_EXIT,
    fullHullExitSeconds: MOLNIYA_FULL_EXIT,
    terminalSeconds: MOLNIYA_TERMINAL,
  }
}

export function deriveRuntimeMolniyaState(timeSeconds: number, baseline?: MolniyaState): MolniyaState {
  const time = safeTime(timeSeconds)
  if (time <= SCRIPTED_DURATION_SECONDS) return baseline ?? deriveMolniyaState(time)
  const anchor = baseline ?? MOLNIYA_ANCHOR
  const elapsed = Math.min(time, MOLNIYA_TERMINAL) - SCRIPTED_DURATION_SECONDS
  const present = getMolniyaRuntimePresentation(time)
  const position = { ...anchor.pose.position, x: anchor.pose.position.x + MOLNIYA_TANGENT.x * anchor.speedMetersPerSecond * elapsed, z: anchor.pose.position.z + MOLNIYA_TANGENT.z * anchor.speedMetersPerSecond * elapsed }
  return {
    ...anchor,
    pose: { position, rotation: { ...anchor.pose.rotation, z: periodicSine(Math.min(time, MOLNIYA_TERMINAL), 0.7) * 0.012 } },
    speedMetersPerSecond: time >= MOLNIYA_TERMINAL ? 0 : anchor.speedMetersPerSecond,
    wakeStrength: present.opacity * anchor.wakeStrength,
    smokeIntensity: present.visible ? anchor.smokeIntensity : 0,
    localFireIntensity: present.visible ? anchor.localFireIntensity : 0,
  }
}

export function deriveRuntimeSurvivors(timeSeconds: number, baseline: SimulationWorldState): RuntimeSurvivorState {
  const time = safeTime(timeSeconds)
  const wasp = deriveRuntimeWaspState(time, baseline.wasp)
  const molniya = deriveRuntimeMolniyaState(time, baseline.stage3.molniya)
  const stage4b = time <= SCRIPTED_DURATION_SECONDS ? baseline.stage4b : { ...baseline.stage4b, btrGroup: deriveRuntimeBtrGroupState(time), t72Group: deriveRuntimeT72GroupState(time) }
  const stage4b2c = time <= SCRIPTED_DURATION_SECONDS ? baseline.stage4b2c : deriveRuntimeSupportConvoyState(time)
  const angle = ((Math.max(0, time - SCRIPTED_DURATION_SECONDS) % WASP_PERIOD) * WASP_SPEED) / WASP_RADIUS
  const ground = Object.fromEntries(
    [...Object.values(stage4b.btrGroup.vehicles), ...Object.values(stage4b.t72Group.vehicles), ...Object.values(stage4b2c.convoy.vehicles)].map((v) => [
      v.id,
      {
        activity: 'physicalCondition' in v && v.physicalCondition !== 'operational' ? 'fixed-wreck' : v.speedMetersPerSecond > 0 ? 'withdrawing' : 'holding',
        stopSeconds: v.id.startsWith('defender_btr')
          ? SURVIVOR_CONTINUATION_LIMITS.btr.stopSeconds
          : v.id.startsWith('defender_t72')
            ? SURVIVOR_CONTINUATION_LIMITS.t72.stopSeconds
            : 'convoyOrder' in v && v.convoyOrder >= 4
              ? SURVIVOR_CONTINUATION_LIMITS.supportRear.stopSeconds
              : SURVIVOR_CONTINUATION_LIMITS.supportLocal.stopSeconds,
      },
    ]),
  ) as SurvivorContinuationMetadata['ground']
  return {
    wasp,
    molniya,
    stage4b,
    stage4b2c,
    metadata: {
      effectClock: 'runtime',
      wasp: {
        activity: time <= SCRIPTED_DURATION_SECONDS ? 'scripted' : 'offshore-patrol',
        speedMetersPerSecond: WASP_SPEED,
        velocity: { x: ((WASP_INITIAL_RADIUS.z * Math.cos(angle) - WASP_INITIAL_RADIUS.x * Math.sin(angle)) * WASP_SPEED) / WASP_RADIUS, y: 0, z: (-(WASP_INITIAL_RADIUS.x * Math.cos(angle) + WASP_INITIAL_RADIUS.z * Math.sin(angle)) * WASP_SPEED) / WASP_RADIUS },
        periodSeconds: WASP_PERIOD,
      },
      molniya: getMolniyaRuntimePresentation(time),
      ground,
    },
  }
}

// Keep the historical heading convention explicit in the route audit.
export const SURVIVOR_HANDOFF_HEADINGS = { waspRadians: headingBetween({ x: -5200, y: 0, z: -3000 }, { x: -4800, y: 0, z: -2700 }), btrWheelRadiusMeters: BTR80_DIMENSIONS_METERS.wheelRadius } as const
