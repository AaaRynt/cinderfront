import type { SupportActivity, SupportConvoyPhase, SupportConvoyWorldState, SupportSubtype, SupportVehicleId, SupportVehicleState } from './supportConvoyTypes'

import { CORRIDOR_FEATURES, ROAD_DEFINITIONS } from '../scene/world/stage2/stage2Data'
import { distanceToPolyline, getTerrainHeight } from '../scene/world/stage2/terrainModel'
import { createGroundedPose, createPath, projectDistanceOnPath, sampleOffsetPath, samplePath } from './groundMotion'
import { SUPPORT_CONVOY_ROUTE_POINTS } from './groundVehicleRoutes'
import { clamp, lerp, smoothstep } from './math'
import { clampSimulationTime } from './time'
import { STAGE4B2C_EVENTS } from './timeline'

export const SUPPORT_CONVOY_ID = 'defender_support_convoy_01' as const
export const SUPPORT_VEHICLE_IDS = ['defender_support_fire_01', 'defender_support_engineering_01', 'defender_support_recovery_01', 'defender_support_fire_02', 'defender_support_logistics_01', 'defender_support_logistics_02'] as const satisfies readonly SupportVehicleId[]
export const SUPPORT_DIMENSIONS = {
  fire_engine: { length: 8.6, width: 2.55, height: 3.25 },
  engineering_truck: { length: 8.2, width: 2.5, height: 3.15 },
  recovery_vehicle: { length: 8.8, width: 2.6, height: 3.2 },
  logistics_truck: { length: 7.9, width: 2.5, height: 3.1 },
} as const
export const SUPPORT_WHEEL_RADIUS_METERS = 0.52
export const SUPPORT_GROUND_CLEARANCE_METERS = 0.025
const SUBTYPES: readonly SupportSubtype[] = ['fire_engine', 'engineering_truck', 'recovery_vehicle', 'fire_engine', 'logistics_truck', 'logistics_truck']
const LANE_OFFSETS = [0, 0.2, -0.2, 0.15, -0.15, 0] as const
const PATH = createPath(SUPPORT_CONVOY_ROUTE_POINTS)
const INITIAL_LEAD_STATION = projectDistanceOnPath(PATH, [5_250, 442])
const RESCUE_ROAD = ROAD_DEFINITIONS.find((road) => road.id === 'road_rescue_branch')!
const BRIDGE_X = CORRIDOR_FEATURES.bridge.reduce((sum, point) => sum + point[0], 0) / CORRIDOR_FEATURES.bridge.length
const BRIDGE_Z = CORRIDOR_FEATURES.bridge.reduce((sum, point) => sum + point[1], 0) / CORRIDOR_FEATURES.bridge.length
export const SUPPORT_BRIDGE_POSITION = { x: BRIDGE_X, y: getTerrainHeight(BRIDGE_X, BRIDGE_Z) + 2.2, z: BRIDGE_Z } as const

/** Wheels sample the actual terrain and existing draped road top (+0.48 m). */
export function getSupportPresentationSurfaceHeight(x: number, z: number) {
  const distance = distanceToPolyline(x, z, RESCUE_ROAD.points)
  return getTerrainHeight(x, z) + 0.48 * (1 - smoothstep(5.5, 8, distance))
}

interface Motion {
  distance: number
  speed: number
  acceleration: number
}

/** Integral of a smoothstep speed ramp; no frame accumulation or state history. */
function speedRamp(elapsed: number, duration: number, from: number, to: number): Motion {
  const t = Math.max(0, elapsed)
  const u = clamp(t / duration, 0, 1)
  return {
    distance: from * Math.min(t, duration) + (to - from) * duration * (u ** 3 - u ** 4 / 2) + to * Math.max(0, t - duration),
    speed: lerp(from, to, u * u * (3 - 2 * u)),
    acceleration: t < duration ? ((to - from) * 6 * u * (1 - u)) / duration : 0,
  }
}

function reposition(elapsed: number, duration: number, distance: number): Motion {
  const u = clamp(elapsed / duration, 0, 1)
  return { distance: distance * u * u * (3 - 2 * u), speed: elapsed > 0 && elapsed < duration ? (distance * 6 * u * (1 - u)) / duration : 0, acceleration: elapsed > 0 && elapsed < duration ? (distance * 6 * (1 - 2 * u)) / duration ** 2 : 0 }
}

function forwardMotion(time: number, order: number): Motion {
  if (time < 75) return { distance: time * 17, speed: 17, acceleration: 0 }
  const delay = order * 0.35
  const brakeAt = 108 + delay
  const cruise = speedRamp(Math.min(time, brakeAt) - 75, 8, 17, 23)
  const distanceAtBrake = 75 * 17 + cruise.distance
  if (time < brakeAt) return { ...cruise, distance: distanceAtBrake }
  const brake = speedRamp(Math.min(time - brakeAt, 9), 9, 23, 0)
  let distance = distanceAtBrake + brake.distance
  if (time < brakeAt + 9) return { ...brake, distance }
  const creepAt = 119 + delay
  if (time < creepAt) return { distance, speed: 0, acceleration: 0 }
  const hitBrakeAt = 125 + delay * 0.55
  const creep = speedRamp(Math.min(time, hitBrakeAt) - creepAt, 3, 0, 4)
  distance += creep.distance
  if (time < hitBrakeAt) return { ...creep, distance }
  const hitBrake = speedRamp(Math.min(time - hitBrakeAt, 2.5), 2.5, 4, 0)
  distance += hitBrake.distance
  if (time < hitBrakeAt + 2.5) return { ...hitBrake, distance }
  // Engineering/recovery inspect a few safe meters; the obstruction is never cleared.
  const local = order === 1 ? reposition(time - 140, 6, 5) : order === 2 ? reposition(time - 141, 5, 3) : { distance: 0, speed: 0, acceleration: 0 }
  return { ...local, distance: distance + local.distance }
}

export function sampleSupportRoute(stationMeters: number) {
  return samplePath(PATH, stationMeters)
}

function groupPhase(time: number): SupportConvoyPhase {
  if (time < 75) return 'routine_transit'
  if (time < 108) return 'emergency_response'
  if (time < 119) return 'visibility_hesitation'
  if (time < 125) return 'cautious_advance'
  if (time < 130) return 'obstruction_stop'
  if (time < 174) return 'route_assessment'
  return 'withdrawal_in_progress'
}

function activityAt(time: number, order: number, motion: Motion): SupportActivity {
  if (time >= 174) return order === 0 ? 'holding' : order < 3 ? 'limited_reposition' : motion.speed < -0.01 ? 'reversing' : 'abandoning_approach'
  if (time < 108 + order * 0.35) return time < 75 ? 'routine_transit' : 'emergency_response'
  if (time < 119 + order * 0.35) return 'visibility_hesitation'
  if (time < 125 + order * 0.35 * 0.55) return 'cautious_advance'
  if (time < 130) return 'obstruction_stop'
  return motion.speed > 0 ? 'limited_reposition' : 'route_assessment'
}

function deriveVehicle(time: number, order: number): SupportVehicleState {
  const id = SUPPORT_VEHICLE_IDS[order]!
  const subtype = SUBTYPES[order]!
  const dimensions = SUPPORT_DIMENSIONS[subtype]
  const forward = forwardMotion(Math.min(time, 174), order)
  const withdrawalAt = 174 + (order >= 3 ? (order - 3) * 0.15 : 0)
  const reverse = time > withdrawalAt && order > 0 ? speedRamp(time - withdrawalAt, order < 3 ? 1.5 : 2, 0, order < 3 ? 0.9 : 3) : { distance: 0, speed: 0, acceleration: 0 }
  const motion = { distance: forward.distance - reverse.distance, speed: forward.speed - reverse.speed, acceleration: forward.acceleration - reverse.acceleration }
  const station = INITIAL_LEAD_STATION - order * 34 + motion.distance
  const sample = sampleOffsetPath(PATH, station, LANE_OFFSETS[order]!)
  const ahead = samplePath(PATH, station + 2)
  const behind = samplePath(PATH, station - 2)
  const curvature = Math.atan2(ahead.tangentX * behind.tangentZ - ahead.tangentZ * behind.tangentX, ahead.tangentX * behind.tangentX + ahead.tangentZ * behind.tangentZ) / 4
  const enabled = time >= 75
  const beaconPhaseOffsetSeconds = order * 0.137
  const cycle = (((time - 75 + beaconPhaseOffsetSeconds) % 0.9) + 0.9) % 0.9
  const beaconIntensity = enabled && (cycle < 0.16 || (cycle >= 0.28 && cycle < 0.39)) ? 1 : 0.08 * Number(enabled)
  const direction = motion.speed < -0.001 ? -1 : 1
  return {
    id,
    groupId: SUPPORT_CONVOY_ID,
    factionId: 'island_defender',
    vehicleType: 'support_vehicle',
    subtype,
    convoyOrder: order + 1,
    responseRole: order === 0 ? 'lead_hold' : order < 3 ? 'local_reposition' : 'rear_withdrawal',
    activity: activityAt(time, order, motion),
    physicalCondition: 'operational',
    outcome: time >= 174 ? 'survived' : 'active',
    visible: true,
    mapPresence: 'present',
    pose: createGroundedPose({ position: [sample.x, sample.z], hullTangent: [sample.tangentX, sample.tangentZ], heightMeters: dimensions.height, halfLengthMeters: 2.6, halfWidthMeters: 1.05, groundClearanceMeters: SUPPORT_GROUND_CLEARANCE_METERS, surfaceHeightAt: getSupportPresentationSurfaceHeight }),
    routeTangent: { x: sample.tangentX * direction, y: 0, z: sample.tangentZ * direction },
    motionDirection: Math.abs(motion.speed) < 0.001 ? 'stationary' : motion.speed < 0 ? 'reverse' : 'forward',
    speedMetersPerSecond: Math.abs(motion.speed),
    longitudinalSpeedMetersPerSecond: motion.speed,
    accelerationMetersPerSecondSquared: motion.acceleration,
    traveledDistanceMeters: motion.distance,
    routeStationMeters: station,
    drivetrain: { kind: 'wheeled', wheelRotationRadians: motion.distance / SUPPORT_WHEEL_RADIUS_METERS, steeringRadians: clamp(Math.atan(5.2 * curvature), -0.5, 0.5) },
    groundClearanceMeters: SUPPORT_GROUND_CLEARANCE_METERS,
    dustIntensity: Math.min(0.22, Math.abs(motion.speed) / 100) * (time >= 108 ? 1 : 0.35),
    lighting: { headlights: true, brakeLights: (motion.acceleration < -0.03 && motion.speed > 0) || (Math.abs(motion.speed) < 0.01 && time >= 108) || (time >= 174 && time < withdrawalAt + 0.12), reverseLights: motion.speed < -0.001, beaconEnabled: enabled, beaconPhaseOffsetSeconds, beaconIntensity },
  }
}

export function deriveSupportConvoyState(timeSeconds: number): SupportConvoyWorldState {
  const time = clampSimulationTime(timeSeconds)
  const list = SUPPORT_VEHICLE_IDS.map((_, order) => deriveVehicle(time, order))
  const vehicles = Object.fromEntries(list.map((vehicle) => [vehicle.id, vehicle])) as Record<SupportVehicleId, SupportVehicleState>
  const age = time - 125
  const lead = list[0]!
  const centroid = list.reduce((sum, vehicle) => ({ x: sum.x + vehicle.pose.position.x / 6, y: sum.y + vehicle.pose.position.y / 6, z: sum.z + vehicle.pose.position.z / 6 }), { x: 0, y: 0, z: 0 })
  // Introduce the bridge into the same smooth shot before the hit, then retain
  // the separated response and rear withdrawal in frame. No camera history.
  const bridgeWeight = smoothstep(114, 124.5, time) * 0.4 * (1 - 0.5 * smoothstep(140, 160, time))
  const anchor = { x: lerp(centroid.x, BRIDGE_X, bridgeWeight), y: lerp(centroid.y, SUPPORT_BRIDGE_POSITION.y + 2, bridgeWeight), z: lerp(centroid.z, BRIDGE_Z, bridgeWeight) }
  return {
    reachedEvents: STAGE4B2C_EVENTS.filter((event) => time >= event.atSeconds),
    convoy: {
      id: SUPPORT_CONVOY_ID,
      factionId: 'island_defender',
      role: 'generic_support_convoy',
      pathId: 'path_support_convoy_industrial',
      phase: groupPhase(time),
      orderedVehicleIds: SUPPORT_VEHICLE_IDS,
      vehicles,
      operationalCount: 6,
      survivorCount: time >= 174 ? 6 : 0,
      holdingCount: list.filter((vehicle) => vehicle.activity === 'holding').length,
      repositioningCount: list.filter((vehicle) => vehicle.activity === 'limited_reposition').length,
      withdrawingCount: list.filter((vehicle) => vehicle.responseRole === 'rear_withdrawal' && time >= 174).length,
      outcome: time >= 174 ? 'survived' : 'active',
    },
    bridge: {
      eventId: 'rescue_route_secondary_hit',
      position: SUPPORT_BRIDGE_POSITION,
      ageSeconds: Math.max(0, age),
      blocked: age >= 0,
      persistentDamage: age >= 0,
      flashIntensity: age >= 0 && age < 0.6 ? 1 - smoothstep(0, 0.6, age) : 0,
      dustIntensity: age >= 0 && age < 8 ? (0.3 + 0.7 * smoothstep(0, 0.7, age)) * (1 - smoothstep(2, 8, age)) : 0,
      shockProgress: age >= 0 && age < 1.6 ? age / 1.6 : 0,
      debrisActive: age >= 0 && age < 2.4,
    },
    visibilityIntensity: time < 108 ? 0 : (0.2 + 0.25 * smoothstep(108, 110, time)) * (1 - smoothstep(120, 132, time)),
    camera: { anchor: { position: anchor, rotation: { x: 0, y: lead.pose.rotation.y, z: 0 } }, framingScale: 1 + 0.55 * smoothstep(114, 124.5, time) * (1 - 0.8 * smoothstep(144, 164, time)) },
  }
}
