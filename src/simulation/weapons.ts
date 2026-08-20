import type { AirGroundStrikeDefinition, AirGroundWeaponState, Pose3, Vector3 } from './types'

import { addVector3, clamp, distanceVector3, inverseLerp, normalizeVector3, rotateVectorByEulerXYZ, scaleVector3, subtractVector3, transformLocalOffset, transformLocalOffsetByPose } from './math'

const TALWAR_POSITION: Vector3 = { x: -3766, y: 0, z: 3847 }
const TALWAR_MODEL_YAW = Math.PI + (80 * Math.PI) / 180

const TALWAR_FIRST_HIT = transformLocalOffset(TALWAR_POSITION, TALWAR_MODEL_YAW, { x: 3.8, y: 7.4, z: 3 })
const TALWAR_SECOND_HIT = transformLocalOffset(TALWAR_POSITION, TALWAR_MODEL_YAW, { x: 0, y: 5.1, z: -38 })

const LOWER_WEAPONS_BAY_OFFSET: Vector3 = { x: 0, y: -1.2, z: -0.65 }

export const AIR_GROUND_STRIKES = [
  {
    id: 'radar_hill_near_hit',
    sourceAircraftId: 'attacker_f35_01',
    targetId: 'sam_battery_area',
    releaseAtSeconds: 33.2,
    impactAtSeconds: 36,
    targetPosition: { x: 3115, y: 174, z: 3330 },
    lowerBayOffset: LOWER_WEAPONS_BAY_OFFSET,
    kind: 'guided-bomb',
    powered: false,
    bodyColor: '#202522',
  },
  {
    id: 'pantsir_01_destroyed',
    sourceAircraftId: 'attacker_f35_01',
    targetId: 'defender_pantsir_01',
    releaseAtSeconds: 38.6,
    impactAtSeconds: 42,
    targetPosition: { x: 3050, y: 174, z: 3375 },
    lowerBayOffset: LOWER_WEAPONS_BAY_OFFSET,
    kind: 'guided-bomb',
    powered: false,
    bodyColor: '#202522',
  },
  {
    id: 'primary_radar_disabled',
    sourceAircraftId: 'attacker_f35_01',
    targetId: 'radar_search_site',
    releaseAtSeconds: 42,
    impactAtSeconds: 45,
    targetPosition: { x: 3550, y: 216, z: 4150 },
    lowerBayOffset: LOWER_WEAPONS_BAY_OFFSET,
    kind: 'guided-bomb',
    powered: false,
    bodyColor: '#202522',
  },
  {
    id: 'harbor_first_hit',
    sourceAircraftId: 'attacker_f35_02',
    targetId: 'warehouse_harbor_01',
    releaseAtSeconds: 45.2,
    impactAtSeconds: 48,
    targetPosition: { x: -3650, y: 30, z: 4330 },
    lowerBayOffset: LOWER_WEAPONS_BAY_OFFSET,
    kind: 'guided-bomb',
    powered: false,
    bodyColor: '#202522',
  },
  {
    id: 'talwar_first_hit',
    sourceAircraftId: 'attacker_f35_02',
    targetId: 'defender_talwar_01:first_hit',
    releaseAtSeconds: 68,
    impactAtSeconds: 72,
    targetPosition: TALWAR_FIRST_HIT,
    lowerBayOffset: LOWER_WEAPONS_BAY_OFFSET,
    kind: 'guided-bomb',
    powered: false,
    bodyColor: '#202522',
  },
  {
    id: 'industrial_pipeline_hit',
    sourceAircraftId: 'attacker_f35_02',
    targetId: 'pipeline_harbor_fuel_trunk',
    releaseAtSeconds: 74,
    impactAtSeconds: 78,
    targetPosition: { x: -1450, y: 26.66, z: 2500 },
    lowerBayOffset: LOWER_WEAPONS_BAY_OFFSET,
    kind: 'guided-bomb',
    powered: false,
    bodyColor: '#202522',
  },
  {
    id: 'fuel_tank_initial_hit',
    sourceAircraftId: 'attacker_f35_02',
    targetId: 'fuel_tank_05',
    releaseAtSeconds: 82,
    impactAtSeconds: 86,
    targetPosition: { x: -550, y: 54, z: 2050 },
    lowerBayOffset: LOWER_WEAPONS_BAY_OFFSET,
    kind: 'guided-bomb',
    powered: false,
    bodyColor: '#202522',
  },
  {
    id: 'talwar_second_hit',
    sourceAircraftId: 'attacker_f35_02',
    targetId: 'defender_talwar_01:second_hit',
    releaseAtSeconds: 110.5,
    impactAtSeconds: 115,
    targetPosition: TALWAR_SECOND_HIT,
    lowerBayOffset: LOWER_WEAPONS_BAY_OFFSET,
    kind: 'guided-bomb',
    powered: false,
    bodyColor: '#202522',
  },
] as const satisfies readonly AirGroundStrikeDefinition[]

export const AIR_GROUND_STRIKE_BY_ID = Object.fromEntries(AIR_GROUND_STRIKES.map((strike) => [strike.id, strike])) as unknown as Readonly<Record<AirGroundStrikeDefinition['id'], AirGroundStrikeDefinition>>

interface GuidedBombCurve {
  readonly release: Vector3
  readonly control1: Vector3
  readonly control2: Vector3
  readonly target: Vector3
  readonly initialTangent: Vector3
}

function cubicBezier(curve: GuidedBombCurve, progress: number): Vector3 {
  const amount = clamp(progress, 0, 1)
  const inverse = 1 - amount
  return {
    x: inverse ** 3 * curve.release.x + 3 * inverse ** 2 * amount * curve.control1.x + 3 * inverse * amount ** 2 * curve.control2.x + amount ** 3 * curve.target.x,
    y: inverse ** 3 * curve.release.y + 3 * inverse ** 2 * amount * curve.control1.y + 3 * inverse * amount ** 2 * curve.control2.y + amount ** 3 * curve.target.y,
    z: inverse ** 3 * curve.release.z + 3 * inverse ** 2 * amount * curve.control1.z + 3 * inverse * amount ** 2 * curve.control2.z + amount ** 3 * curve.target.z,
  }
}

function cubicBezierTangent(curve: GuidedBombCurve, progress: number): Vector3 {
  const amount = clamp(progress, 0, 1)
  const inverse = 1 - amount
  const first = scaleVector3(subtractVector3(curve.control1, curve.release), 3 * inverse ** 2)
  const second = scaleVector3(subtractVector3(curve.control2, curve.control1), 6 * inverse * amount)
  const third = scaleVector3(subtractVector3(curve.target, curve.control2), 3 * amount ** 2)
  return normalizeVector3(addVector3(addVector3(first, second), third))
}

function guidedBombCurve(definition: AirGroundStrikeDefinition, sourcePoseAtRelease: Pose3): GuidedBombCurve {
  const release = transformLocalOffsetByPose(sourcePoseAtRelease, definition.lowerBayOffset)
  const aircraftForward = normalizeVector3(rotateVectorByEulerXYZ({ x: 0, y: 0, z: -1 }, sourcePoseAtRelease.rotation))
  const aircraftDown = normalizeVector3(rotateVectorByEulerXYZ({ x: 0, y: -1, z: 0 }, sourcePoseAtRelease.rotation))
  const initialTangent = normalizeVector3(addVector3(scaleVector3(aircraftForward, 0.94), scaleVector3(aircraftDown, 0.34)))
  const distance = distanceVector3(release, definition.targetPosition)
  const firstControlDistance = clamp(distance * 0.22, 70, 280)
  const horizontalApproach = normalizeVector3({
    x: definition.targetPosition.x - release.x,
    y: 0,
    z: definition.targetPosition.z - release.z,
  })
  const approachDistance = clamp(distance * 0.16, 55, 240)
  const heightDifference = Math.max(0, release.y - definition.targetPosition.y)

  return {
    release,
    control1: addVector3(release, scaleVector3(initialTangent, firstControlDistance)),
    control2: {
      x: definition.targetPosition.x - horizontalApproach.x * approachDistance,
      y: definition.targetPosition.y + clamp(heightDifference * 0.28, 24, 140),
      z: definition.targetPosition.z - horizontalApproach.z * approachDistance,
    },
    target: { ...definition.targetPosition },
    initialTangent,
  }
}

export function deriveAirGroundWeaponState(definition: AirGroundStrikeDefinition, timeSeconds: number, sourcePoseAtRelease: Pose3): AirGroundWeaponState {
  const curve = guidedBombCurve(definition, sourcePoseAtRelease)
  const progress = inverseLerp(definition.releaseAtSeconds, definition.impactAtSeconds, timeSeconds)
  const phase = timeSeconds < definition.releaseAtSeconds ? 'not-released' : timeSeconds < definition.impactAtSeconds ? 'in-flight' : 'impacted'
  const position = phase === 'not-released' ? curve.release : phase === 'impacted' ? curve.target : cubicBezier(curve, progress)
  const tangent = phase === 'not-released' ? curve.initialTangent : cubicBezierTangent(curve, progress)

  return {
    id: definition.id,
    phase,
    visible: phase === 'in-flight',
    powered: false,
    hasContinuousFlame: false,
    bodyColor: '#202522',
    releasePosition: curve.release,
    targetPosition: curve.target,
    position,
    tangent,
    initialTangent: curve.initialTangent,
    progress,
  }
}
