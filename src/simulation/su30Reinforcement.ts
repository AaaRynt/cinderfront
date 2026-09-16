import type { Su30Activity, Su30AircraftId, Su30AircraftState, Su30ReinforcementState, Su30SmokeSample, Su30SparkSample } from './su30Types'
import type { Pose3, Vector3 } from './types'

import { SIMULATION_DURATION_SECONDS } from './constants'
import { clamp, lerp, smoothstep, yawForDirection } from './math'
import { SU30_DAMAGE_OFFSET, SU30_ENGINE_OFFSETS } from './su30ModelData'

export const SU30_AIRCRAFT_IDS = ['defender_su30_01', 'defender_su30_02'] as const
export const SU30_ENTRY_AT_SECONDS = 104
export const SU30_DAMAGE_AT_SECONDS = 137
export const SU30_COVER_AT_SECONDS = 142
export const SU30_EGRESS_AT_SECONDS = 170
export const SU30_SMOKE_LIFETIME_SECONDS = 2.4
export const SU30_SMOKE_SAMPLE_INTERVAL_SECONDS = 0.05
export const SU30_MAX_SMOKE_SAMPLES = 49
export const SU30_MAX_SPARK_SAMPLES = 7

export const SU30_ROUTE_REFERENCES = {
  entryZoneId: 'offmap_defender_air_northeast',
  entryPathId: 'path_defender_air_entry',
  entryHeadingDegrees: 225,
  entryWaypointsXZ: [
    [7000, 4200],
    [5500, 3500],
    [3500, 3000],
    [2000, 2500],
  ],
  egressPathId: 'path_air_egress_southwest',
  egressHeadingDegrees: 225,
  egressWaypointsXZ: [
    [2000, 2000],
    [0, 0],
    [-3000, -2000],
    [-7000, -4200],
  ],
} as const

export const SU30_MOTION_LIMITS = {
  minimumSpeedMetersPerSecond: 200,
  maximumSpeedMetersPerSecond: 330,
  maximumAccelerationMetersPerSecondSquared: 65,
  maximumSpeedChangeMetersPerSecondSquared: 25,
  maximumHeadingRateRadiansPerSecond: (17 * Math.PI) / 180,
  maximumBankRadians: (44 * Math.PI) / 180,
  maximumPitchRadians: (6 * Math.PI) / 180,
  minimumAircraftSeparationMeters: 130,
  // Final southwest egress converges with the preserved F-35B 02 corridor;
  // retain at least ~nine airframe lengths rather than inventing a new F-35 path.
  minimumF35SeparationMeters: 200,
  minimumTerrainClearanceMeters: 650,
} as const

export interface Su30FlightKeyframe {
  readonly atSeconds: number
  readonly position: Vector3
  readonly velocity: Vector3
}

export interface Su30FlightSample {
  readonly position: Vector3
  readonly velocity: Vector3
  readonly acceleration: Vector3
}

type FlightPositionTuple = readonly [time: number, x: number, y: number, z: number]

// Entry traverses the four authoritative XZ points exactly. The brief southward
// pressure pass is an offset from the southwest corridor, not a northbound loop
// back through [0, 0]. Its shallow western arc rejoins the authored exit at
// [-7000, -4200]. Continuation keys beyond 172 specify an exit tangent, not an
// extension of the scenario or events. The aircraft are still visible at 172.
const PRIMARY_POSITIONS: readonly FlightPositionTuple[] = [
  [104, 7000, 1250, 4200],
  [110, 5500, 1200, 3500],
  [117, 3500, 1150, 3000],
  [122.5, 2000, 1080, 2500],
  [127.5, 1400, 1000, 1200],
  [132, 1750, 930, -200],
  [137, 1800, 900, -1530],
  [143, 540, 970, -2410],
  [151, -1570, 1050, -2770],
  [160, -3970, 1140, -3420],
  [172, -6800, 1240, -4130],
  [173, -7000, 1250, -4200],
  [179, -8150, 1300, -5350],
]

// Distinct timings and changing offsets: a high/lateral support position opens
// behind the pressure aircraft, crosses into one covering arc at 142, and then
// settles into a separated high/trailing relationship. No pursuit or AI state.
const SUPPORT_POSITIONS: readonly FlightPositionTuple[] = [
  [104, 7000, 1330, 4320],
  [110, 5580, 1300, 3640],
  [117, 3650, 1250, 3180],
  [123, 2120, 1170, 2600],
  [128, 1600, 1110, 1270],
  [133, 2010, 1070, -250],
  [137, 2020, 1040, -1390],
  [140, 1580, 1080, -2060],
  [142, 1110, 1110, -2380],
  [146, 65, 1150, -2670],
  [151, -1330, 1190, -2850],
  [160, -3730, 1280, -3500],
  [172, -6560, 1380, -4210],
  [174, -6950, 1395, -4400],
  [180, -8100, 1450, -5620],
]

const AXES = ['x', 'y', 'z'] as const

/** Clamped cubic spline: shared key velocities and accelerations give C2 flight. */
function buildFlightPath(positions: readonly FlightPositionTuple[]): readonly Su30FlightKeyframe[] {
  const keyframes = positions.map(([atSeconds, x, y, z]) => ({ atSeconds, position: { x, y, z }, velocity: { x: 0, y: 0, z: 0 } }))
  const count = keyframes.length
  for (const axis of AXES) {
    const lower: number[] = []
    const diagonal: number[] = []
    const upper: number[] = []
    const right: number[] = []
    for (let index = 0; index < count; index += 1) {
      if (index === 0 || index === count - 1) {
        lower.push(0)
        diagonal.push(1)
        upper.push(0)
        // 225-degree geographic heading maps to -X/-Z world velocity.
        right.push(axis === 'y' ? (index === 0 ? -8 : 10) : index === 0 ? -200 : -190)
      } else {
        const previous = keyframes[index - 1]
        const current = keyframes[index]
        const next = keyframes[index + 1]
        const beforeDuration = current.atSeconds - previous.atSeconds
        const afterDuration = next.atSeconds - current.atSeconds
        lower.push(afterDuration)
        diagonal.push(2 * (beforeDuration + afterDuration))
        upper.push(beforeDuration)
        right.push(3 * ((afterDuration * (current.position[axis] - previous.position[axis])) / beforeDuration + (beforeDuration * (next.position[axis] - current.position[axis])) / afterDuration))
      }
    }
    for (let index = 1; index < count; index += 1) {
      const factor = lower[index] / diagonal[index - 1]
      diagonal[index] -= factor * upper[index - 1]
      right[index] -= factor * right[index - 1]
    }
    for (let index = count - 1; index >= 0; index -= 1) {
      keyframes[index].velocity[axis] = (right[index] - (index < count - 1 ? upper[index] * keyframes[index + 1].velocity[axis] : 0)) / diagonal[index]
    }
  }
  return keyframes
}

export const SU30_FLIGHT_PATHS: Readonly<Record<Su30AircraftId, readonly Su30FlightKeyframe[]>> = {
  defender_su30_01: buildFlightPath(PRIMARY_POSITIONS),
  defender_su30_02: buildFlightPath(SUPPORT_POSITIONS),
}

function extrapolate(keyframe: Su30FlightKeyframe, timeSeconds: number): Su30FlightSample {
  const delta = timeSeconds - keyframe.atSeconds
  return {
    position: { x: keyframe.position.x + keyframe.velocity.x * delta, y: keyframe.position.y + keyframe.velocity.y * delta, z: keyframe.position.z + keyframe.velocity.z * delta },
    velocity: { ...keyframe.velocity },
    acceleration: { x: 0, y: 0, z: 0 },
  }
}

/** Analytic position, first derivative and second derivative, with no clock state. */
export function sampleSu30Flight(aircraftId: Su30AircraftId, timeSeconds: number): Su30FlightSample {
  const path = SU30_FLIGHT_PATHS[aircraftId]
  if (timeSeconds < path[0].atSeconds) return extrapolate(path[0], timeSeconds)
  if (timeSeconds > path[path.length - 1].atSeconds) return extrapolate(path[path.length - 1], timeSeconds)
  let nextIndex = 1
  while (nextIndex < path.length - 1 && timeSeconds > path[nextIndex].atSeconds) nextIndex += 1
  const previous = path[nextIndex - 1]
  const next = path[nextIndex]
  const duration = next.atSeconds - previous.atSeconds
  const u = (timeSeconds - previous.atSeconds) / duration
  const u2 = u * u
  const u3 = u2 * u
  const position = { x: 0, y: 0, z: 0 }
  const velocity = { x: 0, y: 0, z: 0 }
  const acceleration = { x: 0, y: 0, z: 0 }
  for (const axis of AXES) {
    const p0 = previous.position[axis]
    const p1 = next.position[axis]
    const v0 = previous.velocity[axis]
    const v1 = next.velocity[axis]
    position[axis] = (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * duration * v0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * duration * v1
    velocity[axis] = ((6 * u2 - 6 * u) * p0 + (3 * u2 - 4 * u + 1) * duration * v0 + (-6 * u2 + 6 * u) * p1 + (3 * u2 - 2 * u) * duration * v1) / duration
    acceleration[axis] = ((12 * u - 6) * p0 + (6 * u - 4) * duration * v0 + (-12 * u + 6) * p1 + (6 * u - 2) * duration * v1) / (duration * duration)
  }
  return { position, velocity, acceleration }
}

function flightKinematics(aircraftId: Su30AircraftId, timeSeconds: number) {
  const motion = sampleSu30Flight(aircraftId, timeSeconds)
  const horizontalSpeed = Math.hypot(motion.velocity.x, motion.velocity.z)
  const turnRateRadiansPerSecond = (motion.velocity.z * motion.acceleration.x - motion.velocity.x * motion.acceleration.z) / (horizontalSpeed * horizontalSpeed)
  // Restrained cinematic roll, not a claim of a fully physical flight model.
  // Smooth saturation avoids a visible bank-rate step at the roll limit.
  const aerodynamicBank = Math.atan((horizontalSpeed * turnRateRadiansPerSecond) / 9.81)
  const bankRadians = SU30_MOTION_LIMITS.maximumBankRadians * Math.tanh(aerodynamicBank / SU30_MOTION_LIMITS.maximumBankRadians)
  return {
    motion,
    pose: {
      position: motion.position,
      rotation: { x: Math.atan2(motion.velocity.y, horizontalSpeed), y: yawForDirection(motion.velocity), z: bankRadians },
    },
    speedMetersPerSecond: Math.hypot(motion.velocity.x, motion.velocity.y, motion.velocity.z),
    accelerationMetersPerSecondSquared: Math.hypot(motion.acceleration.x, motion.acceleration.y, motion.acceleration.z),
    turnRateRadiansPerSecond,
    bankRadians,
  }
}

/** Matches the aircraft renderer's YXZ order: bank, pitch, then world heading. */
export function transformSu30LocalOffset(pose: Pose3, offset: Vector3): Vector3 {
  const { x: pitch, y: yaw, z: bank } = pose.rotation
  const rolledX = offset.x * Math.cos(bank) - offset.y * Math.sin(bank)
  const rolledY = offset.x * Math.sin(bank) + offset.y * Math.cos(bank)
  const pitchedY = rolledY * Math.cos(pitch) - offset.z * Math.sin(pitch)
  const pitchedZ = rolledY * Math.sin(pitch) + offset.z * Math.cos(pitch)
  return {
    x: pose.position.x + rolledX * Math.cos(yaw) + pitchedZ * Math.sin(yaw),
    y: pose.position.y + pitchedY,
    z: pose.position.z - rolledX * Math.sin(yaw) + pitchedZ * Math.cos(yaw),
  }
}

const DAMAGE_ONSET_KINEMATICS = flightKinematics('defender_su30_01', SU30_DAMAGE_AT_SECONDS)
const DAMAGE_ONSET_ANCHOR = transformSu30LocalOffset(DAMAGE_ONSET_KINEMATICS.pose, SU30_DAMAGE_OFFSET)

/** A bounded historical world-space trail; no sample may come from the future. */
export function deriveSu30DamageTrail(aircraftId: Su30AircraftId, timeSeconds: number): readonly Su30SmokeSample[] {
  if (aircraftId !== 'defender_su30_01' || timeSeconds < SU30_DAMAGE_AT_SECONDS) return []
  const lastIndex = Math.floor((timeSeconds - SU30_DAMAGE_AT_SECONDS) / SU30_SMOKE_SAMPLE_INTERVAL_SECONDS + 1e-9)
  const firstIndex = Math.max(0, lastIndex - SU30_MAX_SMOKE_SAMPLES + 1)
  const samples: Su30SmokeSample[] = []
  for (let index = firstIndex; index <= lastIndex; index += 1) {
    const emittedAtSeconds = SU30_DAMAGE_AT_SECONDS + index * SU30_SMOKE_SAMPLE_INTERVAL_SECONDS
    const age = Math.max(0, timeSeconds - emittedAtSeconds)
    if (age > SU30_SMOKE_LIFETIME_SECONDS || emittedAtSeconds > timeSeconds + 1e-8) continue
    const emissionPose = flightKinematics(aircraftId, emittedAtSeconds).pose
    const source = transformSu30LocalOffset(emissionPose, SU30_ENGINE_OFFSETS.right)
    samples.push({
      emittedAtSeconds,
      position: { x: source.x + age * 2.1, y: source.y + age * 2.5, z: source.z + age * 0.85 },
      radius: 0.8 + age * 3.2,
      opacity: 0.16 * (1 - smoothstep(0.3, SU30_SMOKE_LIFETIME_SECONDS, age)),
    })
  }
  return samples
}

function deriveDamageSparks(age: number): readonly Su30SparkSample[] {
  if (age < 0 || age >= 0.8) return []
  return Array.from({ length: SU30_MAX_SPARK_SAMPLES }, (_, index) => {
    const angle = index * 2.3999632297
    const localVelocity = { x: Math.cos(angle) * (2 + index * 0.55), y: 2 + Math.sin(angle) * 3, z: 8 + index }
    const offset = transformSu30LocalOffset(DAMAGE_ONSET_KINEMATICS.pose, localVelocity)
    return {
      position: {
        x: DAMAGE_ONSET_ANCHOR.x + (offset.x - DAMAGE_ONSET_KINEMATICS.pose.position.x + DAMAGE_ONSET_KINEMATICS.motion.velocity.x * 0.24) * age,
        y: DAMAGE_ONSET_ANCHOR.y + (offset.y - DAMAGE_ONSET_KINEMATICS.pose.position.y) * age - 4.9 * age * age,
        z: DAMAGE_ONSET_ANCHOR.z + (offset.z - DAMAGE_ONSET_KINEMATICS.pose.position.z + DAMAGE_ONSET_KINEMATICS.motion.velocity.z * 0.24) * age,
      },
      radius: 0.07 + (index % 3) * 0.025,
      opacity: 1 - smoothstep(0, 0.8, age),
    }
  })
}

function activityFor(aircraftId: Su30AircraftId, timeSeconds: number, beyondBoundary: boolean): Su30Activity {
  if (timeSeconds < SU30_ENTRY_AT_SECONDS) return 'off-map'
  if (beyondBoundary) return 'exited'
  if (timeSeconds >= SU30_EGRESS_AT_SECONDS) return 'egressing'
  if (aircraftId === 'defender_su30_01' && timeSeconds >= SU30_DAMAGE_AT_SECONDS) return timeSeconds < 143 ? 'damaged-breakaway' : 'withdrawing'
  if (aircraftId === 'defender_su30_02' && timeSeconds >= SU30_COVER_AT_SECONDS) return timeSeconds < 149 ? 'covering-withdrawal' : 'withdrawing'
  if (timeSeconds < 117) return 'entering'
  return aircraftId === 'defender_su30_01' ? 'pressuring' : 'supporting'
}

export function deriveSu30AircraftState(aircraftId: Su30AircraftId, timeSeconds: number): Su30AircraftState {
  const time = clamp(timeSeconds, 0, SIMULATION_DURATION_SECONDS)
  const kinematics = flightKinematics(aircraftId, time)
  const beyondBoundary = kinematics.pose.position.x < -7050 || kinematics.pose.position.z < -5050
  const visible = time >= SU30_ENTRY_AT_SECONDS && !beyondBoundary
  const damaged = aircraftId === 'defender_su30_01' && time >= SU30_DAMAGE_AT_SECONDS
  const survived = damaged || (aircraftId === 'defender_su30_02' && time >= SU30_COVER_AT_SECONDS)
  const damageAge = damaged ? time - SU30_DAMAGE_AT_SECONDS : -1
  const engineIntensity = visible ? 0.62 + 0.12 * smoothstep(220, 325, kinematics.speedMetersPerSecond) : 0
  return {
    id: aircraftId,
    vehicleType: 'Su-30MKK',
    factionId: 'island_defender',
    activity: activityFor(aircraftId, time, beyondBoundary),
    physicalCondition: damaged ? 'damaged' : 'operational',
    outcome: survived ? 'survived' : 'active',
    visible,
    mapPresence: time < SU30_ENTRY_AT_SECONDS ? 'outside' : beyondBoundary ? 'beyond-render-boundary' : time === SU30_ENTRY_AT_SECONDS ? 'boundary' : kinematics.pose.position.x < -5500 ? 'leaving' : 'active',
    pose: kinematics.pose,
    velocity: kinematics.motion.velocity,
    speedMetersPerSecond: kinematics.speedMetersPerSecond,
    accelerationMetersPerSecondSquared: kinematics.accelerationMetersPerSecondSquared,
    turnRateRadiansPerSecond: kinematics.turnRateRadiansPerSecond,
    bankRadians: kinematics.bankRadians,
    engine: { leftIntensity: engineIntensity, rightIntensity: engineIntensity * (damaged ? 0.44 + 0.07 * Math.sin(damageAge * 11) : 1) },
    navigationLightIntensity: visible && (time * 1.2) % 1 < 0.16 ? 1 : 0,
    vaporIntensity: visible ? 0.38 * smoothstep(0.33, 0.73, Math.abs(kinematics.bankRadians)) : 0,
    damage: {
      ageSeconds: damaged ? damageAge : null,
      flashIntensity: damaged && visible ? 1 - smoothstep(0, 0.34, damageAge) : 0,
      sparkIntensity: damaged && visible ? 1 - smoothstep(0, 0.8, damageAge) : 0,
      smokeIntensity: damaged && visible ? 0.28 : 0,
      surfaceDarkened: damaged,
      anchor: transformSu30LocalOffset(kinematics.pose, SU30_DAMAGE_OFFSET),
      onsetAnchor: DAMAGE_ONSET_ANCHOR,
    },
    damageTrail: visible && damaged ? deriveSu30DamageTrail(aircraftId, time) : [],
    damageSparks: visible && damaged ? deriveDamageSparks(damageAge) : [],
  }
}

export function deriveSu30ReinforcementState(timeSeconds: number): Su30ReinforcementState {
  const time = clamp(timeSeconds, 0, SIMULATION_DURATION_SECONDS)
  const aircraft = { defender_su30_01: deriveSu30AircraftState('defender_su30_01', time), defender_su30_02: deriveSu30AircraftState('defender_su30_02', time) }
  const first = aircraft.defender_su30_01
  const second = aircraft.defender_su30_02
  // One fixed weighting avoids target switches at damage, cover, or egress.
  const anchorFirst = time < SU30_ENTRY_AT_SECONDS ? flightKinematics('defender_su30_01', SU30_ENTRY_AT_SECONDS) : { pose: first.pose, motion: { velocity: first.velocity } }
  const anchorSecond = time < SU30_ENTRY_AT_SECONDS ? flightKinematics('defender_su30_02', SU30_ENTRY_AT_SECONDS) : { pose: second.pose, motion: { velocity: second.velocity } }
  const anchorVelocity = {
    x: lerp(anchorFirst.motion.velocity.x, anchorSecond.motion.velocity.x, 0.5),
    y: lerp(anchorFirst.motion.velocity.y, anchorSecond.motion.velocity.y, 0.5),
    z: lerp(anchorFirst.motion.velocity.z, anchorSecond.motion.velocity.z, 0.5),
  }
  const status = time < 104 ? 'Off-map · northeast sector' : time < 117 ? '2 entering' : time < 137 ? '1 pressuring · 1 supporting' : time < 142 ? '1 damaged · 1 supporting' : time < 149 ? '1 damaged · 1 covering' : time < 170 ? '2 withdrawing · 1 damaged' : '2 egressing · 1 damaged'
  return {
    aircraft,
    orderedAircraftIds: SU30_AIRCRAFT_IDS,
    anchor: {
      position: { x: lerp(anchorFirst.pose.position.x, anchorSecond.pose.position.x, 0.5), y: lerp(anchorFirst.pose.position.y, anchorSecond.pose.position.y, 0.5), z: lerp(anchorFirst.pose.position.z, anchorSecond.pose.position.z, 0.5) },
      rotation: { x: 0, y: yawForDirection(anchorVelocity), z: 0 },
    },
    status,
    operationalCount: first.physicalCondition === 'operational' ? 2 : 1,
    damagedCount: first.physicalCondition === 'damaged' ? 1 : 0,
    survivorCount: Number(first.outcome === 'survived') + Number(second.outcome === 'survived'),
  }
}
