import type { GroundVehicleActivityPhase, GroundVehicleDamageState, GroundVehicleGroupState, GroundVehicleId, GroundVehicleState, Stage4BWorldState, Vector3 } from './types'

import { getTerrainHeight } from '../scene/world/stage2/terrainModel.ts'
import { clamp, smoothstep, yawForDirection } from './math'
import { getReachedStage4BEvents } from './timeline'

type XZPoint = readonly [x: number, z: number]

interface AuthoredPath {
  readonly points: readonly XZPoint[]
  readonly cumulativeDistances: readonly number[]
  readonly lengthMeters: number
}

interface PathSample {
  readonly x: number
  readonly z: number
  readonly tangentX: number
  readonly tangentZ: number
}

interface ScalarMotionSample {
  readonly distanceMeters: number
  readonly speedMetersPerSecond: number
  readonly accelerationMetersPerSecondSquared: number
}

interface BtrAuthoredDefinition {
  readonly id: GroundVehicleId
  readonly order: number
  readonly stationOffsetMeters: number
  readonly lateralOffsetMeters: number
  readonly withdrawalDelaySeconds: number
  readonly withdrawalPath: AuthoredPath
  readonly turnDistanceMeters: number
  readonly mergeDistanceMeters: number
}

export const BTR80_VEHICLE_IDS = ['defender_btr_01', 'defender_btr_02', 'defender_btr_03', 'defender_btr_04'] as const satisfies readonly GroundVehicleId[]

export const BTR80_DIMENSIONS_METERS = {
  height: 2.35,
  length: 7.65,
  width: 2.89,
  wheelRadius: 0.59,
  wheelbase: 4.76,
} as const

export const BTR80_GROUP_ID = 'defender_btr_group_01' as const
export const BTR80_GROUND_CLEARANCE_METERS = 0.025
export const BTR80_SUPPORT_MOVE_START_SECONDS = 75
export const BTR80_SUPPORT_ARRIVAL_SECONDS = 118
export const BTR80_LEAD_DISABLED_SECONDS = 133
export const BTR80_WITHDRAWAL_START_SECONDS = 136

const EASTERN_TRUNK_POINTS = [
  [600, 1_400],
  [1_300, 1_000],
  [2_200, 400],
  [3_100, -300],
  [4_000, -1_100],
  [5_000, -1_900],
  [6_050, -1_600],
] as const satisfies readonly XZPoint[]

const FIRST_CORNER_ENTRY: XZPoint = [1_247.905, 1_029.768]
const FIRST_CORNER_CONTROL: XZPoint = [1_300, 1_000]
const FIRST_CORNER_EXIT: XZPoint = [1_349.923, 966.718]
const TURN_RADIUS_METERS = 13
const WITHDRAWAL_MERGE_STATION_METERS = 150
const WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND = 4.5
const WITHDRAWAL_TURN_ACCELERATION_SECONDS = 4
const WITHDRAWAL_CRUISE_SPEED_METERS_PER_SECOND = 16
const SUPPORT_ACCELERATION_SECONDS = 12.5
const SUPPORT_MOVE_DURATION_SECONDS = BTR80_SUPPORT_ARRIVAL_SECONDS - BTR80_SUPPORT_MOVE_START_SECONDS
const PATH_TANGENT_SAMPLE_METERS = 0.4

function distanceXZ(start: XZPoint, end: XZPoint) {
  return Math.hypot(end[0] - start[0], end[1] - start[1])
}

function createPath(points: readonly XZPoint[]): AuthoredPath {
  const cumulativeDistances = [0]
  for (let index = 1; index < points.length; index += 1) cumulativeDistances.push(cumulativeDistances[index - 1]! + distanceXZ(points[index - 1]!, points[index]!))
  return {
    points,
    cumulativeDistances,
    lengthMeters: cumulativeDistances.at(-1) ?? 0,
  }
}

function quadraticPoint(start: XZPoint, control: XZPoint, end: XZPoint, amount: number): XZPoint {
  const inverse = 1 - amount
  return [inverse * inverse * start[0] + 2 * inverse * amount * control[0] + amount * amount * end[0], inverse * inverse * start[1] + 2 * inverse * amount * control[1] + amount * amount * end[1]]
}

function cubicPoint(start: XZPoint, controlA: XZPoint, controlB: XZPoint, end: XZPoint, amount: number): XZPoint {
  const inverse = 1 - amount
  return [
    inverse * inverse * inverse * start[0] + 3 * inverse * inverse * amount * controlA[0] + 3 * inverse * amount * amount * controlB[0] + amount * amount * amount * end[0],
    inverse * inverse * inverse * start[1] + 3 * inverse * inverse * amount * controlA[1] + 3 * inverse * amount * amount * controlB[1] + amount * amount * amount * end[1],
  ]
}

function createEasternTrunkPath() {
  const roundedCorner = Array.from({ length: 17 }, (_, index) => quadraticPoint(FIRST_CORNER_ENTRY, FIRST_CORNER_CONTROL, FIRST_CORNER_EXIT, index / 16))
  return createPath([EASTERN_TRUNK_POINTS[0], ...roundedCorner, ...EASTERN_TRUNK_POINTS.slice(2)])
}

const EASTERN_TRUNK_PATH = createEasternTrunkPath()

function pathSegmentIndex(path: AuthoredPath, distanceMeters: number) {
  const distance = clamp(distanceMeters, 0, path.lengthMeters)
  let low = 0
  let high = path.cumulativeDistances.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (path.cumulativeDistances[middle]! <= distance) low = middle
    else high = middle
  }
  return Math.min(low, path.points.length - 2)
}

function rawPathPosition(path: AuthoredPath, distanceMeters: number): XZPoint {
  const distance = clamp(distanceMeters, 0, path.lengthMeters)
  const index = pathSegmentIndex(path, distance)
  const start = path.points[index]!
  const end = path.points[index + 1]!
  const startDistance = path.cumulativeDistances[index]!
  const segmentLength = Math.max(path.cumulativeDistances[index + 1]! - startDistance, 0.000_1)
  const amount = clamp((distance - startDistance) / segmentLength, 0, 1)
  return [start[0] + (end[0] - start[0]) * amount, start[1] + (end[1] - start[1]) * amount]
}

function samplePath(path: AuthoredPath, distanceMeters: number): PathSample {
  const position = rawPathPosition(path, distanceMeters)
  const before = rawPathPosition(path, distanceMeters - PATH_TANGENT_SAMPLE_METERS)
  const after = rawPathPosition(path, distanceMeters + PATH_TANGENT_SAMPLE_METERS)
  const tangentLength = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
  return {
    x: position[0],
    z: position[1],
    tangentX: (after[0] - before[0]) / tangentLength,
    tangentZ: (after[1] - before[1]) / tangentLength,
  }
}

function sampleOffsetPath(path: AuthoredPath, distanceMeters: number, lateralOffsetMeters: number): PathSample {
  const sample = samplePath(path, distanceMeters)
  return {
    ...sample,
    x: sample.x - sample.tangentZ * lateralOffsetMeters,
    z: sample.z + sample.tangentX * lateralOffsetMeters,
  }
}

function projectDistanceOnPath(path: AuthoredPath, target: XZPoint) {
  let bestDistance = 0
  let bestDistanceSquared = Number.POSITIVE_INFINITY
  for (let index = 1; index < path.points.length; index += 1) {
    const start = path.points[index - 1]!
    const end = path.points[index]!
    const dx = end[0] - start[0]
    const dz = end[1] - start[1]
    const lengthSquared = dx * dx + dz * dz
    const amount = lengthSquared === 0 ? 0 : clamp(((target[0] - start[0]) * dx + (target[1] - start[1]) * dz) / lengthSquared, 0, 1)
    const x = start[0] + dx * amount
    const z = start[1] + dz * amount
    const distanceSquared = (target[0] - x) ** 2 + (target[1] - z) ** 2
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared
      bestDistance = path.cumulativeDistances[index - 1]! + Math.sqrt(lengthSquared) * amount
    }
  }
  return bestDistance
}

function distanceToPath(path: AuthoredPath, target: XZPoint) {
  const distance = projectDistanceOnPath(path, target)
  const closest = rawPathPosition(path, distance)
  return Math.hypot(target[0] - closest[0], target[1] - closest[1])
}

export const BTR80_ROUTE_STATIONS = {
  supportMeters: projectDistanceOnPath(EASTERN_TRUNK_PATH, [720, 1_330]),
  securityHoldMeters: projectDistanceOnPath(EASTERN_TRUNK_PATH, [1_300, 1_000]),
} as const

const LONGITUDINAL_OFFSETS_METERS = [0, 24, 47, 70] as const
const LATERAL_OFFSETS_METERS = [0, 0.8, -0.7, 0.4] as const
const WITHDRAWAL_DELAYS_SECONDS = [0, 1.2, 0.6, 0] as const

function createWithdrawalPath(stationOffsetMeters: number, lateralOffsetMeters: number) {
  const supportStation = BTR80_ROUTE_STATIONS.supportMeters + stationOffsetMeters
  const anchor = sampleOffsetPath(EASTERN_TRUNK_PATH, supportStation, lateralOffsetMeters)
  const inboundForward: XZPoint = [-anchor.tangentX, -anchor.tangentZ]
  const turnNormal: XZPoint = [inboundForward[1], -inboundForward[0]]
  const turnPoints = Array.from({ length: 129 }, (_, index): XZPoint => {
    const angle = (index / 128) * Math.PI
    return [anchor.x + TURN_RADIUS_METERS * turnNormal[0] * (1 - Math.cos(angle)) + TURN_RADIUS_METERS * inboundForward[0] * Math.sin(angle), anchor.z + TURN_RADIUS_METERS * turnNormal[1] * (1 - Math.cos(angle)) + TURN_RADIUS_METERS * inboundForward[1] * Math.sin(angle)]
  })
  const turnPath = createPath(turnPoints)
  const turnEnd = turnPoints.at(-1)!
  const outboundForward: XZPoint = [-inboundForward[0], -inboundForward[1]]
  const mergeStation = supportStation + WITHDRAWAL_MERGE_STATION_METERS
  const mergeTargetSample = sampleOffsetPath(EASTERN_TRUNK_PATH, mergeStation, lateralOffsetMeters)
  const mergeTarget: XZPoint = [mergeTargetSample.x, mergeTargetSample.z]
  const mergeControlDistance = WITHDRAWAL_MERGE_STATION_METERS * 0.34
  const mergeControlA: XZPoint = [turnEnd[0] + outboundForward[0] * mergeControlDistance, turnEnd[1] + outboundForward[1] * mergeControlDistance]
  const mergeControlB: XZPoint = [mergeTarget[0] - mergeTargetSample.tangentX * mergeControlDistance, mergeTarget[1] - mergeTargetSample.tangentZ * mergeControlDistance]
  const mergePoints = Array.from({ length: 161 }, (_, index) => cubicPoint(turnEnd, mergeControlA, mergeControlB, mergeTarget, index / 160))

  const roadContinuation: XZPoint[] = []
  for (let station = mergeStation + 18; station < EASTERN_TRUNK_PATH.lengthMeters; station += 18) {
    const sample = sampleOffsetPath(EASTERN_TRUNK_PATH, station, lateralOffsetMeters)
    roadContinuation.push([sample.x, sample.z])
  }
  const routeEnd = sampleOffsetPath(EASTERN_TRUNK_PATH, EASTERN_TRUNK_PATH.lengthMeters, lateralOffsetMeters)
  roadContinuation.push([routeEnd.x, routeEnd.z])

  const path = createPath([...turnPoints, ...mergePoints.slice(1), ...roadContinuation])
  const mergePath = createPath(mergePoints)
  return {
    path,
    turnDistanceMeters: turnPath.lengthMeters,
    mergeDistanceMeters: mergePath.lengthMeters,
  }
}

const AUTHORED_BTR_DEFINITIONS = BTR80_VEHICLE_IDS.map((id, order): BtrAuthoredDefinition => {
  const stationOffsetMeters = LONGITUDINAL_OFFSETS_METERS[order]!
  const lateralOffsetMeters = LATERAL_OFFSETS_METERS[order]!
  const withdrawal = createWithdrawalPath(stationOffsetMeters, lateralOffsetMeters)
  return {
    id,
    order,
    stationOffsetMeters,
    lateralOffsetMeters,
    withdrawalDelaySeconds: WITHDRAWAL_DELAYS_SECONDS[order]!,
    withdrawalPath: withdrawal.path,
    turnDistanceMeters: withdrawal.turnDistanceMeters,
    mergeDistanceMeters: withdrawal.mergeDistanceMeters,
  }
})

const SUPPORT_TRAVEL_DISTANCE_METERS = BTR80_ROUTE_STATIONS.securityHoldMeters - BTR80_ROUTE_STATIONS.supportMeters
const SUPPORT_MAX_SPEED_METERS_PER_SECOND = SUPPORT_TRAVEL_DISTANCE_METERS / (SUPPORT_MOVE_DURATION_SECONDS - SUPPORT_ACCELERATION_SECONDS)
const SUPPORT_ACCELERATION_METERS_PER_SECOND_SQUARED = SUPPORT_MAX_SPEED_METERS_PER_SECOND / SUPPORT_ACCELERATION_SECONDS

function deriveSupportMotion(timeSeconds: number): ScalarMotionSample {
  const elapsed = clamp(timeSeconds - BTR80_SUPPORT_MOVE_START_SECONDS, 0, SUPPORT_MOVE_DURATION_SECONDS)
  const accelerationDistance = 0.5 * SUPPORT_MAX_SPEED_METERS_PER_SECOND * SUPPORT_ACCELERATION_SECONDS
  const cruiseDuration = SUPPORT_MOVE_DURATION_SECONDS - SUPPORT_ACCELERATION_SECONDS * 2
  if (elapsed <= SUPPORT_ACCELERATION_SECONDS) {
    return {
      distanceMeters: 0.5 * SUPPORT_ACCELERATION_METERS_PER_SECOND_SQUARED * elapsed * elapsed,
      speedMetersPerSecond: SUPPORT_ACCELERATION_METERS_PER_SECOND_SQUARED * elapsed,
      accelerationMetersPerSecondSquared: SUPPORT_ACCELERATION_METERS_PER_SECOND_SQUARED,
    }
  }
  if (elapsed <= SUPPORT_ACCELERATION_SECONDS + cruiseDuration) {
    const cruiseElapsed = elapsed - SUPPORT_ACCELERATION_SECONDS
    return {
      distanceMeters: accelerationDistance + SUPPORT_MAX_SPEED_METERS_PER_SECOND * cruiseElapsed,
      speedMetersPerSecond: SUPPORT_MAX_SPEED_METERS_PER_SECOND,
      accelerationMetersPerSecondSquared: 0,
    }
  }
  if (elapsed < SUPPORT_MOVE_DURATION_SECONDS) {
    const decelerationElapsed = elapsed - SUPPORT_ACCELERATION_SECONDS - cruiseDuration
    return {
      distanceMeters: accelerationDistance + SUPPORT_MAX_SPEED_METERS_PER_SECOND * cruiseDuration + SUPPORT_MAX_SPEED_METERS_PER_SECOND * decelerationElapsed - 0.5 * SUPPORT_ACCELERATION_METERS_PER_SECOND_SQUARED * decelerationElapsed * decelerationElapsed,
      speedMetersPerSecond: SUPPORT_MAX_SPEED_METERS_PER_SECOND - SUPPORT_ACCELERATION_METERS_PER_SECOND_SQUARED * decelerationElapsed,
      accelerationMetersPerSecondSquared: -SUPPORT_ACCELERATION_METERS_PER_SECOND_SQUARED,
    }
  }
  return { distanceMeters: SUPPORT_TRAVEL_DISTANCE_METERS, speedMetersPerSecond: 0, accelerationMetersPerSecondSquared: 0 }
}

function deriveWithdrawalMotion(definition: BtrAuthoredDefinition, timeSeconds: number): ScalarMotionSample {
  const elapsed = Math.max(0, timeSeconds - BTR80_WITHDRAWAL_START_SECONDS - definition.withdrawalDelaySeconds)
  const turnAcceleration = WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND / WITHDRAWAL_TURN_ACCELERATION_SECONDS
  const turnAccelerationDistance = 0.5 * WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND * WITHDRAWAL_TURN_ACCELERATION_SECONDS
  if (elapsed <= WITHDRAWAL_TURN_ACCELERATION_SECONDS) {
    return {
      distanceMeters: 0.5 * turnAcceleration * elapsed * elapsed,
      speedMetersPerSecond: turnAcceleration * elapsed,
      accelerationMetersPerSecondSquared: turnAcceleration,
    }
  }

  const turnCruiseDistance = Math.max(0, definition.turnDistanceMeters - turnAccelerationDistance)
  const turnCruiseDuration = turnCruiseDistance / WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND
  const turnDuration = WITHDRAWAL_TURN_ACCELERATION_SECONDS + turnCruiseDuration
  if (elapsed <= turnDuration) {
    const cruiseElapsed = elapsed - WITHDRAWAL_TURN_ACCELERATION_SECONDS
    return {
      distanceMeters: turnAccelerationDistance + WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND * cruiseElapsed,
      speedMetersPerSecond: WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND,
      accelerationMetersPerSecondSquared: 0,
    }
  }

  const mergeDuration = (2 * definition.mergeDistanceMeters) / (WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND + WITHDRAWAL_CRUISE_SPEED_METERS_PER_SECOND)
  const mergeAcceleration = (WITHDRAWAL_CRUISE_SPEED_METERS_PER_SECOND - WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND) / mergeDuration
  const mergeElapsed = elapsed - turnDuration
  if (mergeElapsed <= mergeDuration) {
    return {
      distanceMeters: definition.turnDistanceMeters + WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND * mergeElapsed + 0.5 * mergeAcceleration * mergeElapsed * mergeElapsed,
      speedMetersPerSecond: WITHDRAWAL_TURN_SPEED_METERS_PER_SECOND + mergeAcceleration * mergeElapsed,
      accelerationMetersPerSecondSquared: mergeAcceleration,
    }
  }

  const cruiseElapsed = mergeElapsed - mergeDuration
  return {
    distanceMeters: definition.turnDistanceMeters + definition.mergeDistanceMeters + WITHDRAWAL_CRUISE_SPEED_METERS_PER_SECOND * cruiseElapsed,
    speedMetersPerSecond: WITHDRAWAL_CRUISE_SPEED_METERS_PER_SECOND,
    accelerationMetersPerSecondSquared: 0,
  }
}

function steeringForPath(path: AuthoredPath, distanceMeters: number) {
  const before = samplePath(path, distanceMeters - 1.8)
  const after = samplePath(path, distanceMeters + 1.8)
  const cross = before.tangentX * after.tangentZ - before.tangentZ * after.tangentX
  const dot = before.tangentX * after.tangentX + before.tangentZ * after.tangentZ
  const curvature = Math.atan2(cross, dot) / 3.6
  return clamp(Math.atan(BTR80_DIMENSIONS_METERS.wheelbase * curvature), -0.58, 0.58)
}

export function getBtr80PresentationSurfaceHeight(x: number, z: number, surfaceHeightAt: (surfaceX: number, surfaceZ: number) => number = getTerrainHeight) {
  const centerlineDistance = distanceToPath(EASTERN_TRUNK_PATH, [x, z])
  const roadRibbonOffset = 0.48 * (1 - smoothstep(5.2, 10, centerlineDistance))
  return surfaceHeightAt(x, z) + roadRibbonOffset
}

function createTerrainPose(sample: PathSample, surfaceHeightAt: (x: number, z: number) => number, disabledRoll = 0) {
  const presentedSurfaceHeight = (x: number, z: number) => getBtr80PresentationSurfaceHeight(x, z, surfaceHeightAt)
  const centerHeight = presentedSurfaceHeight(sample.x, sample.z)
  const halfLength = BTR80_DIMENSIONS_METERS.length * 0.38
  const halfWidth = BTR80_DIMENSIONS_METERS.width * 0.42
  const rightX = -sample.tangentZ
  const rightZ = sample.tangentX
  const frontHeight = presentedSurfaceHeight(sample.x + sample.tangentX * halfLength, sample.z + sample.tangentZ * halfLength)
  const rearHeight = presentedSurfaceHeight(sample.x - sample.tangentX * halfLength, sample.z - sample.tangentZ * halfLength)
  const rightHeight = presentedSurfaceHeight(sample.x + rightX * halfWidth, sample.z + rightZ * halfWidth)
  const leftHeight = presentedSurfaceHeight(sample.x - rightX * halfWidth, sample.z - rightZ * halfWidth)
  return {
    position: {
      x: sample.x,
      y: centerHeight + BTR80_DIMENSIONS_METERS.height / 2 + BTR80_GROUND_CLEARANCE_METERS,
      z: sample.z,
    },
    rotation: {
      x: Math.atan2(frontHeight - rearHeight, halfLength * 2),
      y: yawForDirection({ x: sample.tangentX, y: 0, z: sample.tangentZ }),
      z: Math.atan2(rightHeight - leftHeight, halfWidth * 2) + disabledRoll,
    },
  }
}

const UNDAMAGED_STATE: GroundVehicleDamageState = {
  causeEventId: null,
  ageSeconds: 0,
  hullDamageProgress: 0,
  flashIntensity: 0,
  sparkIntensity: 0,
  dustKickIntensity: 0,
  localFireIntensity: 0,
  smokeIntensity: 0,
}

function deriveLeadDamageState(timeSeconds: number): GroundVehicleDamageState {
  if (timeSeconds < BTR80_LEAD_DISABLED_SECONDS) return UNDAMAGED_STATE
  const ageSeconds = timeSeconds - BTR80_LEAD_DISABLED_SECONDS
  return {
    causeEventId: 'ammunition_storage_primary_detonation',
    ageSeconds,
    hullDamageProgress: smoothstep(0, 0.85, ageSeconds),
    flashIntensity: 1 - smoothstep(0, 0.42, ageSeconds),
    sparkIntensity: 1 - smoothstep(0.08, 1.25, ageSeconds),
    dustKickIntensity: 1 - smoothstep(0, 1.6, ageSeconds),
    localFireIntensity: smoothstep(0.15, 0.7, ageSeconds) * (0.2 + 0.16 * Math.exp(-ageSeconds * 0.055)),
    smokeIntensity: smoothstep(0.35, 1.8, ageSeconds) * 0.58,
  }
}

function preWithdrawalActivity(timeSeconds: number): GroundVehicleActivityPhase {
  if (timeSeconds < BTR80_SUPPORT_MOVE_START_SECONDS) return 'security-hold'
  if (timeSeconds === BTR80_SUPPORT_MOVE_START_SECONDS) return 'alerted'
  if (timeSeconds < BTR80_SUPPORT_ARRIVAL_SECONDS) return 'moving-to-support'
  return 'supporting'
}

function angleDifferenceRadians(start: number, end: number) {
  return Math.atan2(Math.sin(end - start), Math.cos(end - start))
}

function turretYawForState(sample: PathSample, timeSeconds: number) {
  const hullYaw = yawForDirection({ x: sample.tangentX, y: 0, z: sample.tangentZ })
  const threatYaw = yawForDirection({ x: 600 - sample.x, y: 0, z: 1_400 - sample.z })
  const supportOrientation = angleDifferenceRadians(hullYaw, threatYaw)
  if (timeSeconds < BTR80_SUPPORT_ARRIVAL_SECONDS) return 0
  if (timeSeconds < BTR80_WITHDRAWAL_START_SECONDS) return supportOrientation
  return supportOrientation * (1 - smoothstep(BTR80_WITHDRAWAL_START_SECONDS, BTR80_WITHDRAWAL_START_SECONDS + 9, timeSeconds))
}

function deriveBtrState(definition: BtrAuthoredDefinition, timeSeconds: number, surfaceHeightAt: (x: number, z: number) => number): GroundVehicleState {
  const supportMotion = deriveSupportMotion(timeSeconds)
  const routeStation = BTR80_ROUTE_STATIONS.securityHoldMeters + definition.stationOffsetMeters - supportMotion.distanceMeters
  const inboundRouteSample = sampleOffsetPath(EASTERN_TRUNK_PATH, routeStation, definition.lateralOffsetMeters)
  const inboundSample: PathSample = {
    ...inboundRouteSample,
    tangentX: -inboundRouteSample.tangentX,
    tangentZ: -inboundRouteSample.tangentZ,
  }
  const isLead = definition.id === 'defender_btr_01'
  const disabled = isLead && timeSeconds >= BTR80_LEAD_DISABLED_SECONDS
  const withdrawing = !isLead && timeSeconds >= BTR80_WITHDRAWAL_START_SECONDS
  const withdrawalMotion = withdrawing ? deriveWithdrawalMotion(definition, timeSeconds) : undefined
  const withdrawalDistance = withdrawalMotion?.distanceMeters ?? 0
  const withdrawalSample = withdrawalMotion ? samplePath(definition.withdrawalPath, withdrawalDistance) : undefined
  const sample = withdrawalSample ?? inboundSample
  const damage = isLead ? deriveLeadDamageState(timeSeconds) : UNDAMAGED_STATE
  const speedMetersPerSecond = withdrawalMotion?.speedMetersPerSecond ?? (timeSeconds >= BTR80_SUPPORT_MOVE_START_SECONDS && timeSeconds < BTR80_SUPPORT_ARRIVAL_SECONDS ? supportMotion.speedMetersPerSecond : 0)
  const accelerationMetersPerSecondSquared = withdrawalMotion?.accelerationMetersPerSecondSquared ?? (timeSeconds >= BTR80_SUPPORT_MOVE_START_SECONDS && timeSeconds < BTR80_SUPPORT_ARRIVAL_SECONDS ? supportMotion.accelerationMetersPerSecondSquared : 0)
  const activity: GroundVehicleActivityPhase = disabled ? 'supporting' : withdrawing ? (withdrawalDistance < definition.turnDistanceMeters ? 'turning-to-withdraw' : 'withdrawing') : preWithdrawalActivity(timeSeconds)
  const traveledDistanceMeters = supportMotion.distanceMeters + withdrawalDistance

  return {
    id: definition.id,
    groupId: BTR80_GROUP_ID,
    factionId: 'island_defender',
    vehicleType: 'BTR-80',
    activity,
    physicalCondition: disabled ? 'disabled' : 'operational',
    outcome: disabled ? 'lost' : withdrawing ? 'survived' : 'active',
    pose: createTerrainPose(sample, surfaceHeightAt, disabled ? damage.hullDamageProgress * 0.025 : 0),
    routeTangent: { x: sample.tangentX, y: 0, z: sample.tangentZ },
    speedMetersPerSecond,
    accelerationMetersPerSecondSquared,
    steeringRadians: withdrawalMotion ? steeringForPath(definition.withdrawalPath, withdrawalDistance) : 0,
    turretYawRadians: turretYawForState(sample, timeSeconds),
    traveledDistanceMeters,
    wheelRotationRadians: traveledDistanceMeters / BTR80_DIMENSIONS_METERS.wheelRadius,
    dustIntensity: smoothstep(1.5, 8, speedMetersPerSecond) * 0.28,
    groundClearanceMeters: BTR80_GROUND_CLEARANCE_METERS,
    damage,
  }
}

export function deriveBtr80GroupState(timeSeconds: number, surfaceHeightAt: (x: number, z: number) => number = getTerrainHeight): GroundVehicleGroupState {
  const vehicles = Object.fromEntries(AUTHORED_BTR_DEFINITIONS.map((definition) => [definition.id, deriveBtrState(definition, timeSeconds, surfaceHeightAt)])) as Readonly<Record<GroundVehicleId, GroundVehicleState>>
  const orderedVehicles = BTR80_VEHICLE_IDS.map((id) => vehicles[id])
  const disabledCount = orderedVehicles.filter((vehicle) => vehicle.physicalCondition === 'disabled').length
  const withdrawingCount = orderedVehicles.filter((vehicle) => vehicle.activity === 'turning-to-withdraw' || vehicle.activity === 'withdrawing').length
  return {
    id: BTR80_GROUP_ID,
    factionId: 'island_defender',
    activity: timeSeconds >= BTR80_WITHDRAWAL_START_SECONDS ? 'withdrawing' : preWithdrawalActivity(timeSeconds),
    vehicles,
    orderedVehicleIds: BTR80_VEHICLE_IDS,
    operationalCount: orderedVehicles.filter((vehicle) => vehicle.physicalCondition === 'operational').length,
    disabledCount,
    withdrawingCount,
    survivorCount: orderedVehicles.length - disabledCount,
  }
}

export function deriveStage4BWorldState(timeSeconds: number): Stage4BWorldState {
  return {
    reachedEvents: getReachedStage4BEvents(timeSeconds),
    btrGroup: deriveBtr80GroupState(timeSeconds),
  }
}

/** Exposes the exact authored path sample for continuity and grounding regression tests. */
export function sampleBtr80MotionPath(id: GroundVehicleId, timeSeconds: number): Vector3 {
  const definition = AUTHORED_BTR_DEFINITIONS.find((candidate) => candidate.id === id)!
  const state = deriveBtrState(definition, timeSeconds, () => 0)
  return { ...state.pose.position }
}
