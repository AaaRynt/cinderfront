import type { F35AircraftId, AircraftMechanicalState, AircraftPhase, F35AircraftState, AirGroundStrikeId, AirGroundWeaponState, FixedAaaState, PantsirState, PersistentStage1State, RadarState, SimulationWorldState, Stage1WorldState, Stage3WorldState, TransientEffectState, Vector3, WaspState } from './types'

import { STAGE3_DURATION_SECONDS, STAGE1_DURATION_SECONDS, STAGE1_FIXED_SEED } from './constants'
import { deriveStage4BWorldState } from './groundVehicles'
import { clamp, distanceVector3, headingBetween, inverseLerp, lerp, lerpAngleRadians, normalizeVector3, samplePolyline, scaleVector3, smoothstep, subtractVector3, transformLocalOffset, yawForDirection } from './math'
import { deriveHarborStage3State, deriveIndustrialStage3State, deriveMolniyaState, deriveStage3ReachedEvents, deriveTalwarState } from './stage3'
import { deriveSu30ReinforcementState } from './su30Reinforcement'
import { deriveSupportConvoyState } from './supportConvoy'
import { formatLocalTime, formatSimulationTime, clampSimulationTime, clampStage1Time } from './time'
import { getReachedEvents, getReachedSimulationEvents, hasReachedEvent } from './timeline'
import { AIR_GROUND_STRIKES, deriveAirGroundWeaponState } from './weapons'

const WASP_PATROL_SECONDS = 180
const WASP_PATROL_POINTS: readonly Vector3[] = [
  { x: -4800, y: 0, z: -2700 },
  { x: -4400, y: 0, z: -2900 },
  { x: -4750, y: 0, z: -3300 },
  { x: -5200, y: 0, z: -3000 },
  { x: -4800, y: 0, z: -2700 },
]

const AIRCRAFT_LAUNCH_TIMES = {
  attacker_f35_01: 5,
  attacker_f35_02: 13,
} as const satisfies Readonly<Record<F35AircraftId, number>>

const AIRCRAFT_DECK_OFFSETS = {
  attacker_f35_01: { x: -5, y: 15, z: -58 },
  attacker_f35_02: { x: -5, y: 15, z: 20 },
} as const satisfies Readonly<Record<F35AircraftId, Vector3>>

const PANTSIR_POSITION: Vector3 = { x: 3050, y: 190, z: 3375 }
const PRIMARY_RADAR_POSITION: Vector3 = { x: 3550, y: 210, z: 4150 }
const FIXED_AAA_POSITION: Vector3 = { x: 4625, y: 175, z: 3300 }

interface TimedPosition {
  readonly atSeconds: number
  readonly position: Vector3
  readonly velocity?: Vector3
}

interface TimedFlightKeyframe extends TimedPosition {
  readonly velocity: Vector3
}

interface AircraftMotionSample {
  readonly position: Vector3
  readonly velocity: Vector3
}

const AIRCRAFT_MAX_KEYFRAME_SPEED_METERS_PER_SECOND = 390
const AIRCRAFT_HEADING_SAMPLE_SECONDS = 3.2
const AIRCRAFT_BANK_SAMPLE_SECONDS = 1.1
const AIRCRAFT_MAX_BANK_RADIANS = (34 * Math.PI) / 180
const AIRCRAFT_MAX_CINEMATIC_TURN_RATE_RADIANS_PER_SECOND = (12 * Math.PI) / 180
const STANDARD_GRAVITY_METERS_PER_SECOND_SQUARED = 9.81

const AIRCRAFT_FLIGHT_PATH_CACHE = new Map<F35AircraftId, readonly TimedFlightKeyframe[]>()

function eventReached(timeSeconds: number, atSeconds: number): boolean {
  return hasReachedEvent(timeSeconds, atSeconds)
}

function deriveWaspStateForSimulation(timeSeconds: number): WaspState {
  const time = clampSimulationTime(timeSeconds)
  const pathProgress = time / WASP_PATROL_SECONDS
  const flatPosition = samplePolyline(WASP_PATROL_POINTS, pathProgress)
  const nextPosition = samplePolyline(WASP_PATROL_POINTS, Math.min(1, pathProgress + 0.0005))
  const yaw = headingBetween(flatPosition, nextPosition)
  const seededPhase = (STAGE1_FIXED_SEED % 360) * (Math.PI / 180)

  return {
    factionId: 'landings_attacker',
    phase: eventReached(time, 1) ? 'underway-and-supporting-launch-operations' : 'underway',
    pathProgress,
    pose: {
      position: {
        ...flatPosition,
        y: Math.sin(time * 0.45 + seededPhase) * 0.3,
      },
      rotation: {
        x: Math.sin(time * 0.19 + seededPhase) * 0.004,
        y: yaw,
        z: Math.sin(time * 0.27 + seededPhase * 0.5) * 0.007,
      },
    },
    wakeStrength: eventReached(time, 1) ? 0.72 : 0.58,
  }
}

/** Frozen Stage 1 helper: direct callers retain the original T+48 boundary. */
export function deriveWaspState(timeSeconds: number): WaspState {
  return deriveWaspStateForSimulation(clampStage1Time(timeSeconds))
}

function deckPosition(aircraftId: F35AircraftId, timeSeconds: number): Vector3 {
  const wasp = deriveWaspStateForSimulation(timeSeconds)
  return transformLocalOffset(wasp.pose.position, wasp.pose.rotation.y, AIRCRAFT_DECK_OFFSETS[aircraftId])
}

function deckVelocity(aircraftId: F35AircraftId, timeSeconds: number): Vector3 {
  const sampleRadiusSeconds = 0.05
  const before = deckPosition(aircraftId, Math.max(0, timeSeconds - sampleRadiusSeconds))
  const after = deckPosition(aircraftId, Math.min(STAGE3_DURATION_SECONDS, timeSeconds + sampleRadiusSeconds))
  return scaleVector3(subtractVector3(after, before), 1 / (sampleRadiusSeconds * 2))
}

function authoredFlightPositions(aircraftId: F35AircraftId): readonly TimedPosition[] {
  const launchAtSeconds = AIRCRAFT_LAUNCH_TIMES[aircraftId]
  const transitionStart = deckPosition(aircraftId, launchAtSeconds + 5)
  const liftedStart = { ...transitionStart, y: transitionStart.y + 42 }

  if (aircraftId === 'attacker_f35_01') {
    return [
      { atSeconds: 10, position: liftedStart },
      { atSeconds: 16.25, position: { x: -3400, y: 180, z: -1700 } },
      { atSeconds: 24, position: { x: -800, y: 420, z: 200 } },
      { atSeconds: 30, position: { x: 1200, y: 500, z: 1600 } },
      { atSeconds: 36, position: { x: 2700, y: 420, z: 2900 } },
      { atSeconds: 42, position: { x: 3400, y: 360, z: 3700 } },
      { atSeconds: 45, position: { x: 4000, y: 430, z: 4200 } },
      { atSeconds: 48, position: { x: 4700, y: 610, z: 4600 } },
      { atSeconds: 52, position: { x: 5600, y: 700, z: 4700 } },
      { atSeconds: 56, position: { x: 6000, y: 760, z: 4400 } },
      { atSeconds: 60, position: { x: 6100, y: 800, z: 3800 } },
      { atSeconds: 68, position: { x: 5600, y: 860, z: 2800 } },
      {
        atSeconds: 90,
        position: { x: 3000, y: 1000, z: 1000 },
        // Preserve the completed pre-T+90 Hermite segment exactly while the
        // following keyframes author the late return pass.
        velocity: { x: -108.36055031789476, y: 4.644023585052633, z: -63.8553242944737 },
      },
      { atSeconds: 100, position: { x: 2000, y: 930, z: 300 } },
      { atSeconds: 110, position: { x: 1000, y: 850, z: -1000 } },
      { atSeconds: 120, position: { x: 800, y: 780, z: -2200 } },
      { atSeconds: 130, position: { x: 1600, y: 700, z: -3000 } },
      { atSeconds: 140, position: { x: 3500, y: 620, z: -2000 } },
      { atSeconds: 148, position: { x: 4600, y: 580, z: -900 } },
      { atSeconds: 154.5, position: { x: 5400, y: 550, z: -100 } },
      { atSeconds: 158, position: { x: 6250, y: 520, z: 400 } },
      { atSeconds: 161.5, position: { x: 6933, y: 535, z: 490 } },
      { atSeconds: 165, position: { x: 7479, y: 570, z: 71 } },
      { atSeconds: 168.5, position: { x: 7569, y: 650, z: -612 } },
      { atSeconds: 172, position: { x: 7150, y: 760, z: -1158 }, velocity: { x: -174, y: 31, z: -101 } },
    ]
  }

  return [
    { atSeconds: 18, position: liftedStart },
    { atSeconds: 24.75, position: { x: -4300, y: 180, z: -1200 } },
    { atSeconds: 32, position: { x: -4050, y: 400, z: 500 } },
    { atSeconds: 40, position: { x: -3850, y: 430, z: 2400 } },
    { atSeconds: 45.2, position: { x: -3760, y: 390, z: 3500 } },
    { atSeconds: 48, position: { x: -3700, y: 380, z: 4100 } },
    { atSeconds: 50, position: { x: -3825, y: 410, z: 4400 } },
    { atSeconds: 52, position: { x: -4075, y: 450, z: 4550 } },
    { atSeconds: 55, position: { x: -4525, y: 510, z: 4525 } },
    { atSeconds: 58, position: { x: -5000, y: 570, z: 4100 } },
    { atSeconds: 61, position: { x: -5100, y: 620, z: 3500 } },
    { atSeconds: 64, position: { x: -4900, y: 650, z: 3000 } },
    { atSeconds: 66, position: { x: -4500, y: 660, z: 2750 } },
    { atSeconds: 68, position: { x: -3950, y: 650, z: 2750 } },
    { atSeconds: 72, position: { x: -3000, y: 620, z: 3000 } },
    { atSeconds: 74, position: { x: -2550, y: 590, z: 2925 } },
    { atSeconds: 78, position: { x: -1800, y: 560, z: 2575 } },
    { atSeconds: 82, position: { x: -1525, y: 540, z: 2525 } },
    { atSeconds: 86, position: { x: -800, y: 560, z: 2200 } },
    { atSeconds: 90, position: { x: 200, y: 680, z: 1400 } },
    { atSeconds: 94, position: { x: 1050, y: 740, z: 1100 } },
    { atSeconds: 97, position: { x: 1500, y: 780, z: 1400 } },
    { atSeconds: 100, position: { x: 1500, y: 810, z: 2150 } },
    { atSeconds: 103, position: { x: 800, y: 810, z: 2850 } },
    { atSeconds: 106, position: { x: -300, y: 790, z: 3150 } },
    { atSeconds: 108.5, position: { x: -1250, y: 750, z: 3300 } },
    { atSeconds: 110.5, position: { x: -2000, y: 700, z: 3500 } },
    { atSeconds: 116, position: { x: -3900, y: 650, z: 3950 } },
    { atSeconds: 120, position: { x: -5000, y: 720, z: 3500 } },
    { atSeconds: 125, position: { x: -5400, y: 820, z: 2600 } },
    { atSeconds: 140, position: { x: -5500, y: 980, z: 500 } },
    { atSeconds: 155, position: { x: -6000, y: 1080, z: -1800 } },
    { atSeconds: 172, position: { x: -7000, y: 1200, z: -4200 } },
  ]
}

function cappedVelocity(direction: Vector3, speedMetersPerSecond: number): Vector3 {
  return scaleVector3(normalizeVector3(direction), Math.min(speedMetersPerSecond, AIRCRAFT_MAX_KEYFRAME_SPEED_METERS_PER_SECOND))
}

function buildAuthoredFlightPath(aircraftId: F35AircraftId): readonly TimedFlightKeyframe[] {
  const cached = AIRCRAFT_FLIGHT_PATH_CACHE.get(aircraftId)
  if (cached) return cached

  const positions = authoredFlightPositions(aircraftId)
  const path = positions.map((keyframe, index): TimedFlightKeyframe => {
    if (keyframe.velocity) return { ...keyframe, velocity: { ...keyframe.velocity } }
    if (index === 0) {
      return {
        ...keyframe,
        velocity: deckVelocity(aircraftId, keyframe.atSeconds),
      }
    }

    if (index === positions.length - 1) {
      const previous = positions[index - 1]
      const seconds = keyframe.atSeconds - previous.atSeconds
      return {
        ...keyframe,
        velocity: cappedVelocity(subtractVector3(keyframe.position, previous.position), distanceVector3(previous.position, keyframe.position) / seconds),
      }
    }

    const previous = positions[index - 1]
    const next = positions[index + 1]
    const seconds = next.atSeconds - previous.atSeconds
    const centeredDirection = subtractVector3(next.position, previous.position)
    const incomingSpeed = distanceVector3(previous.position, keyframe.position) / (keyframe.atSeconds - previous.atSeconds)
    const outgoingSpeed = distanceVector3(keyframe.position, next.position) / (next.atSeconds - keyframe.atSeconds)
    const harmonicSpeed = (2 * incomingSpeed * outgoingSpeed) / Math.max(incomingSpeed + outgoingSpeed, 0.001)
    const centeredSpeed = distanceVector3(previous.position, next.position) / seconds

    return {
      ...keyframe,
      velocity: cappedVelocity(centeredDirection, Math.min(harmonicSpeed, centeredSpeed * 1.18)),
    }
  })

  AIRCRAFT_FLIGHT_PATH_CACHE.set(aircraftId, path)
  return path
}

function sampleCubicFlightSegment(previous: TimedFlightKeyframe, next: TimedFlightKeyframe, timeSeconds: number): AircraftMotionSample {
  const duration = next.atSeconds - previous.atSeconds
  const amount = inverseLerp(previous.atSeconds, next.atSeconds, timeSeconds)
  const amount2 = amount * amount
  const amount3 = amount2 * amount
  const positionForAxis = (start: number, end: number, startVelocity: number, endVelocity: number) => {
    const startWeight = 2 * amount3 - 3 * amount2 + 1
    const startVelocityWeight = amount3 - 2 * amount2 + amount
    const endWeight = -2 * amount3 + 3 * amount2
    const endVelocityWeight = amount3 - amount2
    return startWeight * start + startVelocityWeight * duration * startVelocity + endWeight * end + endVelocityWeight * duration * endVelocity
  }

  const velocityForAxis = (start: number, end: number, startVelocity: number, endVelocity: number) => {
    const startWeightDerivative = 6 * amount2 - 6 * amount
    const startVelocityWeightDerivative = 3 * amount2 - 4 * amount + 1
    const endWeightDerivative = -6 * amount2 + 6 * amount
    const endVelocityWeightDerivative = 3 * amount2 - 2 * amount
    return (startWeightDerivative * start + startVelocityWeightDerivative * duration * startVelocity + endWeightDerivative * end + endVelocityWeightDerivative * duration * endVelocity) / duration
  }

  return {
    position: {
      x: positionForAxis(previous.position.x, next.position.x, previous.velocity.x, next.velocity.x),
      y: positionForAxis(previous.position.y, next.position.y, previous.velocity.y, next.velocity.y),
      z: positionForAxis(previous.position.z, next.position.z, previous.velocity.z, next.velocity.z),
    },
    velocity: {
      x: velocityForAxis(previous.position.x, next.position.x, previous.velocity.x, next.velocity.x),
      y: velocityForAxis(previous.position.y, next.position.y, previous.velocity.y, next.velocity.y),
      z: velocityForAxis(previous.position.z, next.position.z, previous.velocity.z, next.velocity.z),
    },
  }
}

function sampleAuthoredFlightPath(aircraftId: F35AircraftId, timeSeconds: number): AircraftMotionSample {
  const keyframes = buildAuthoredFlightPath(aircraftId)
  if (timeSeconds <= keyframes[0].atSeconds) return { position: { ...keyframes[0].position }, velocity: { ...keyframes[0].velocity } }

  for (let index = 1; index < keyframes.length; index += 1) {
    const previous = keyframes[index - 1]
    const next = keyframes[index]
    if (timeSeconds <= next.atSeconds) return sampleCubicFlightSegment(previous, next, timeSeconds)
  }

  const last = keyframes[keyframes.length - 1]
  return { position: { ...last.position }, velocity: { ...last.velocity } }
}

function aircraftPhase(elapsedSeconds: number): AircraftPhase {
  if (elapsedSeconds < 0) return 'launch-ready'
  if (elapsedSeconds < 2) return 'stovl-prep'
  if (elapsedSeconds < 5) return 'vertical-lift'
  if (elapsedSeconds < 11) return 'transition'
  return 'forward-flight'
}

function aircraftMechanicalState(elapsedSeconds: number): AircraftMechanicalState {
  if (elapsedSeconds < 0) {
    return {
      liftFanDoor: 0,
      rearNozzleDeflectionDegrees: 0,
      landingGearRetraction: 0,
      downwashStrength: 0,
      heatHazeStrength: 0.15,
    }
  }

  if (elapsedSeconds < 2) {
    const deployment = smoothstep(0, 2, elapsedSeconds)
    return {
      liftFanDoor: deployment,
      rearNozzleDeflectionDegrees: deployment * 90,
      landingGearRetraction: 0,
      downwashStrength: lerp(0.2, 0.72, deployment),
      heatHazeStrength: lerp(0.35, 0.8, deployment),
    }
  }

  if (elapsedSeconds < 5) {
    return {
      liftFanDoor: 1,
      rearNozzleDeflectionDegrees: 90,
      landingGearRetraction: 0,
      downwashStrength: lerp(0.78, 1, smoothstep(2, 5, elapsedSeconds)),
      heatHazeStrength: 1,
    }
  }

  if (elapsedSeconds < 11) {
    return {
      liftFanDoor: 1 - smoothstep(7, 11, elapsedSeconds),
      rearNozzleDeflectionDegrees: 90 * (1 - smoothstep(5, 10, elapsedSeconds)),
      landingGearRetraction: smoothstep(6, 10, elapsedSeconds),
      downwashStrength: 1 - smoothstep(5, 10, elapsedSeconds),
      heatHazeStrength: lerp(1, 0.45, smoothstep(5, 11, elapsedSeconds)),
    }
  }

  return {
    liftFanDoor: 0,
    rearNozzleDeflectionDegrees: 0,
    landingGearRetraction: 1,
    downwashStrength: 0,
    heatHazeStrength: 0.42,
  }
}

function sampleAircraftMotion(aircraftId: F35AircraftId, timeSeconds: number): AircraftMotionSample {
  const launchAtSeconds = AIRCRAFT_LAUNCH_TIMES[aircraftId]
  const elapsedSeconds = timeSeconds - launchAtSeconds

  if (elapsedSeconds < 2) {
    const position = deckPosition(aircraftId, timeSeconds)
    return {
      position,
      velocity: deckVelocity(aircraftId, timeSeconds),
    }
  }

  if (elapsedSeconds < 5) {
    const deck = deckPosition(aircraftId, timeSeconds)
    const liftProgress = inverseLerp(2, 5, elapsedSeconds)
    const verticalVelocity = (42 * 6 * liftProgress * (1 - liftProgress)) / 3
    const carrierVelocity = deckVelocity(aircraftId, timeSeconds)
    return {
      position: {
        ...deck,
        y: deck.y + smoothstep(2, 5, elapsedSeconds) * 42,
      },
      velocity: {
        x: carrierVelocity.x,
        y: carrierVelocity.y + verticalVelocity,
        z: carrierVelocity.z,
      },
    }
  }

  return sampleAuthoredFlightPath(aircraftId, timeSeconds)
}

function headingFromMotion(aircraftId: F35AircraftId, timeSeconds: number): number {
  const minimumTime = AIRCRAFT_LAUNCH_TIMES[aircraftId] + 5
  const before = sampleAircraftMotion(aircraftId, Math.max(minimumTime, timeSeconds - AIRCRAFT_HEADING_SAMPLE_SECONDS)).position
  const after = sampleAircraftMotion(aircraftId, Math.min(STAGE3_DURATION_SECONDS, timeSeconds + AIRCRAFT_HEADING_SAMPLE_SECONDS)).position
  return headingBetween(before, after)
}

function flightHeading(aircraftId: F35AircraftId, timeSeconds: number, motion: AircraftMotionSample): number {
  const cinematicHeading = headingFromMotion(aircraftId, timeSeconds)
  const horizontalSpeed = Math.hypot(motion.velocity.x, motion.velocity.z)
  if (horizontalSpeed < 0.001) return cinematicHeading

  const tangentHeading = yawForDirection(motion.velocity)
  return lerpAngleRadians(cinematicHeading, tangentHeading, smoothstep(20, 100, horizontalSpeed))
}

function angleDifferenceRadians(start: number, end: number): number {
  return Math.atan2(Math.sin(end - start), Math.cos(end - start))
}

function aircraftKinematics(aircraftId: F35AircraftId, timeSeconds: number): Pick<F35AircraftState, 'pose' | 'speedMetersPerSecond' | 'turnRateRadiansPerSecond' | 'bankRadians'> {
  // Preserve the completed T+172 sampling window exactly. Only the newly
  // admitted four seconds extrapolate the established final velocity.
  if (timeSeconds > STAGE3_DURATION_SECONDS) {
    const endpoint = aircraftKinematics(aircraftId, STAGE3_DURATION_SECONDS)
    const velocity = sampleAircraftMotion(aircraftId, STAGE3_DURATION_SECONDS).velocity
    const elapsed = timeSeconds - STAGE3_DURATION_SECONDS
    const bank = endpoint.bankRadians * (1 - smoothstep(0, 3, elapsed))
    return {
      ...endpoint,
      pose: { position: { x: endpoint.pose.position.x + velocity.x * elapsed, y: endpoint.pose.position.y + velocity.y * elapsed, z: endpoint.pose.position.z + velocity.z * elapsed }, rotation: { ...endpoint.pose.rotation, z: bank } },
      bankRadians: bank,
      turnRateRadiansPerSecond: endpoint.turnRateRadiansPerSecond * (1 - smoothstep(0, 3, elapsed)),
    }
  }
  const launchAtSeconds = AIRCRAFT_LAUNCH_TIMES[aircraftId]
  const elapsedSeconds = timeSeconds - launchAtSeconds
  const motion = sampleAircraftMotion(aircraftId, timeSeconds)
  const position = motion.position
  const speedMetersPerSecond = Math.hypot(motion.velocity.x, motion.velocity.y, motion.velocity.z)

  if (elapsedSeconds < 5) {
    const waspRotation = deriveWaspStateForSimulation(timeSeconds).pose.rotation
    const flightHandoffHeading = headingFromMotion(aircraftId, launchAtSeconds + 5)
    const yaw = elapsedSeconds < 2 ? waspRotation.y : lerpAngleRadians(waspRotation.y, flightHandoffHeading, smoothstep(2, 5, elapsedSeconds))
    return {
      pose: {
        position,
        rotation: {
          x: 0,
          y: yaw,
          z: elapsedSeconds < 2 ? waspRotation.z : 0,
        },
      },
      speedMetersPerSecond,
      turnRateRadiansPerSecond: 0,
      bankRadians: 0,
    }
  }

  const transitionBlend = smoothstep(5, 11, elapsedSeconds)
  const yaw = flightHeading(aircraftId, timeSeconds, motion)
  const horizontalSpeed = Math.hypot(motion.velocity.x, motion.velocity.z)
  const pitch = Math.atan2(motion.velocity.y, Math.max(horizontalSpeed, 0.001))
  const bankBeforeTime = Math.max(launchAtSeconds + 5, timeSeconds - AIRCRAFT_BANK_SAMPLE_SECONDS)
  const bankAfterTime = Math.min(STAGE3_DURATION_SECONDS, timeSeconds + AIRCRAFT_BANK_SAMPLE_SECONDS)
  const bankSampleDuration = Math.max(bankAfterTime - bankBeforeTime, 0.001)
  const bankBeforeMotion = sampleAircraftMotion(aircraftId, bankBeforeTime)
  const bankAfterMotion = sampleAircraftMotion(aircraftId, bankAfterTime)
  const rawTurnRate = angleDifferenceRadians(flightHeading(aircraftId, bankBeforeTime, bankBeforeMotion), flightHeading(aircraftId, bankAfterTime, bankAfterMotion)) / bankSampleDuration
  const turnRateRadiansPerSecond = clamp(rawTurnRate, -AIRCRAFT_MAX_CINEMATIC_TURN_RATE_RADIANS_PER_SECOND, AIRCRAFT_MAX_CINEMATIC_TURN_RATE_RADIANS_PER_SECOND)
  const aerodynamicBank = Math.atan((horizontalSpeed * turnRateRadiansPerSecond) / STANDARD_GRAVITY_METERS_PER_SECOND_SQUARED)
  const bankRadians = clamp(aerodynamicBank, -AIRCRAFT_MAX_BANK_RADIANS, AIRCRAFT_MAX_BANK_RADIANS) * smoothstep(8, 13, elapsedSeconds)

  return {
    pose: {
      position,
      rotation: {
        x: pitch * transitionBlend,
        y: yaw,
        z: bankRadians,
      },
    },
    speedMetersPerSecond,
    turnRateRadiansPerSecond,
    bankRadians,
  }
}

function deriveAircraftStateForSimulation(aircraftId: F35AircraftId, timeSeconds: number): F35AircraftState {
  const time = clampSimulationTime(timeSeconds)
  const launchAtSeconds = AIRCRAFT_LAUNCH_TIMES[aircraftId]
  const elapsedSeconds = time - launchAtSeconds
  const kinematics = aircraftKinematics(aircraftId, time)
  return {
    id: aircraftId,
    vehicleType: 'F-35B',
    factionId: 'landings_attacker',
    launchAtSeconds,
    phase: aircraftPhase(elapsedSeconds),
    launched: eventReached(time, launchAtSeconds),
    onDeck: elapsedSeconds < 2,
    ...kinematics,
    mechanical: aircraftMechanicalState(elapsedSeconds),
  }
}

/** Frozen Stage 1 helper: direct callers retain the original T+48 boundary. */
export function deriveAircraftState(aircraftId: F35AircraftId, timeSeconds: number): F35AircraftState {
  return deriveAircraftStateForSimulation(aircraftId, clampStage1Time(timeSeconds))
}

function aimYaw(origin: Vector3, target: Vector3): number {
  return headingBetween(origin, target)
}

function deriveRadarStateForSimulation(timeSeconds: number): RadarState {
  const time = clampSimulationTime(timeSeconds)
  const targetAtTime = deriveAircraftStateForSimulation('attacker_f35_01', Math.min(time, 45)).pose.position
  const trackingYaw = aimYaw(PRIMARY_RADAR_POSITION, targetAtTime)
  let primaryPhase: RadarState['primaryPhase']

  if (!eventReached(time, 14)) primaryPhase = 'scanning'
  else if (!eventReached(time, 20)) primaryPhase = 'alert-tracking'
  else if (!eventReached(time, 45)) primaryPhase = 'tracking'
  else primaryPhase = 'destroyed'

  const scanRotation = time * 0.72
  const alertBlend = smoothstep(14, 20, time)
  const primaryDishRotationRadians = eventReached(time, 45) ? aimYaw(PRIMARY_RADAR_POSITION, deriveAircraftStateForSimulation('attacker_f35_01', 45).pose.position) : lerp(scanRotation, trackingYaw, alertBlend)

  return {
    primaryPhase,
    primaryOperational: !eventReached(time, 45),
    primaryDishRotationRadians,
    secondaryOperational: true,
    secondaryTracking: eventReached(time, 20),
    secondaryDishRotationRadians: eventReached(time, 20) ? trackingYaw : time * 0.34 + 0.8,
  }
}

/** Frozen Stage 1 helper: direct callers retain the original T+48 boundary. */
export function deriveRadarState(timeSeconds: number): RadarState {
  return deriveRadarStateForSimulation(clampStage1Time(timeSeconds))
}

function pantsirAimAt(timeSeconds: number): number {
  const targetTime = Math.min(timeSeconds, 42)
  return aimYaw(PANTSIR_POSITION, deriveAircraftStateForSimulation('attacker_f35_01', targetTime).pose.position)
}

function pulseActivity(timeSeconds: number, startSeconds: number, durationSeconds: number): number {
  if (timeSeconds < startSeconds || timeSeconds >= startSeconds + durationSeconds) return 0
  return 1 - inverseLerp(startSeconds, startSeconds + durationSeconds, timeSeconds)
}

function derivePantsirStateForSimulation(timeSeconds: number): PantsirState {
  const time = clampSimulationTime(timeSeconds)
  let phase: PantsirState['phase']
  if (!eventReached(time, 20)) phase = 'operational'
  else if (!eventReached(time, 24)) phase = 'acquiring'
  else if (!eventReached(time, 42)) phase = 'engaging'
  else phase = 'destroyed'

  const authoredLaunches = [24, 31.2, 37.4] as const
  const missileActivity = eventReached(time, 42) ? 0 : Math.max(...authoredLaunches.map((launchTime) => pulseActivity(time, launchTime, 2.8)))

  return {
    factionId: 'island_defender',
    phase,
    operational: !eventReached(time, 42),
    turretYawRadians: eventReached(time, 20) ? pantsirAimAt(time) : Math.sin(time * 0.22) * 0.45,
    radarRotationRadians: eventReached(time, 42) ? 42 * 1.4 : time * 1.4,
    missileActivity,
    launcherRoundsExpended: authoredLaunches.filter((launchTime) => eventReached(time, launchTime)).length,
  }
}

/** Frozen Stage 1 helper: direct callers retain the original T+48 boundary. */
export function derivePantsirState(timeSeconds: number): PantsirState {
  return derivePantsirStateForSimulation(clampStage1Time(timeSeconds))
}

function aaaBurstActivity(timeSeconds: number): number {
  if (!eventReached(timeSeconds, 29) || timeSeconds > STAGE1_DURATION_SECONDS) return 0
  const cycleSeconds = (timeSeconds - 29) % 3.2
  if (cycleSeconds >= 0.72) return 0
  return 1 - cycleSeconds / 0.72
}

function deriveFixedAaaStateForSimulation(timeSeconds: number): FixedAaaState {
  const time = clampSimulationTime(timeSeconds)
  const targetTime = Math.min(time, 48)
  const target = deriveAircraftStateForSimulation('attacker_f35_01', targetTime).pose.position
  const isTracking = eventReached(time, 20)
  const tracerActivity = aaaBurstActivity(time)
  const ceased = time > STAGE1_DURATION_SECONDS

  return {
    factionId: 'island_defender',
    phase: ceased ? 'ceased' : !isTracking ? 'idle' : eventReached(time, 29) ? 'firing' : 'tracking',
    turretYawRadians: isTracking ? aimYaw(FIXED_AAA_POSITION, target) : Math.sin(time * 0.16) * 0.35,
    isFiring: !ceased && tracerActivity > 0,
    tracerActivity,
  }
}

/** Frozen Stage 1 helper: direct callers retain the original T+48 boundary. */
export function deriveFixedAaaState(timeSeconds: number): FixedAaaState {
  return deriveFixedAaaStateForSimulation(clampStage1Time(timeSeconds))
}

function derivePersistentStateForSimulation(timeSeconds: number): PersistentStage1State {
  const time = clampSimulationTime(timeSeconds)
  const firstImpact = eventReached(time, 36)
  const pantsirDestroyed = eventReached(time, 42)
  const primaryRadarDestroyed = eventReached(time, 45)

  return {
    radarHillScorch: firstImpact,
    radarHillSmoke: firstImpact,
    radarHillLocalFire: firstImpact,
    pantsirWreck: pantsirDestroyed,
    pantsirFire: pantsirDestroyed,
    pantsirSmoke: pantsirDestroyed,
    primaryRadarDestroyed,
    primaryRadarDamage: primaryRadarDestroyed,
    primaryRadarSmoke: primaryRadarDestroyed,
    primaryRadarLocalFire: primaryRadarDestroyed,
    harborFirstHit: eventReached(time, 48),
  }
}

/** Frozen Stage 1 helper: direct callers retain the original T+48 boundary. */
export function derivePersistentState(timeSeconds: number): PersistentStage1State {
  return derivePersistentStateForSimulation(clampStage1Time(timeSeconds))
}

function impactEnvelope(timeSeconds: number, startSeconds: number, durationSeconds: number): number {
  if (timeSeconds < startSeconds || timeSeconds >= startSeconds + durationSeconds) return 0
  return 1 - smoothstep(startSeconds, startSeconds + durationSeconds, timeSeconds)
}

function deriveTransientEffectsForSimulation(timeSeconds: number): TransientEffectState {
  const time = clampSimulationTime(timeSeconds)
  return {
    radarHillImpact: impactEnvelope(time, 36, 2.2),
    pantsirDestruction: impactEnvelope(time, 42, 3.2),
    primaryRadarDestruction: impactEnvelope(time, 45, 2.8),
    harborImpact: impactEnvelope(time, 48, 2.1),
  }
}

/** Frozen Stage 1 helper: direct callers retain the original T+48 boundary. */
export function deriveTransientEffects(timeSeconds: number): TransientEffectState {
  return deriveTransientEffectsForSimulation(clampStage1Time(timeSeconds))
}

export function deriveStage1WorldState(timeSeconds: number): Stage1WorldState {
  const time = clampStage1Time(timeSeconds)
  return {
    seed: STAGE1_FIXED_SEED,
    timeSeconds: time,
    relativeTimeLabel: formatSimulationTime(time),
    localTimeLabel: formatLocalTime(time),
    reachedEvents: getReachedEvents(time),
    wasp: deriveWaspState(time),
    aircraft: {
      attacker_f35_01: deriveAircraftState('attacker_f35_01', time),
      attacker_f35_02: deriveAircraftState('attacker_f35_02', time),
    },
    radar: deriveRadarState(time),
    pantsir: derivePantsirState(time),
    fixedAaa: deriveFixedAaaState(time),
    persistent: derivePersistentState(time),
    transientEffects: deriveTransientEffects(time),
  }
}

function deriveAirGroundWeapons(timeSeconds: number): Readonly<Record<AirGroundStrikeId, AirGroundWeaponState>> {
  return Object.fromEntries(
    AIR_GROUND_STRIKES.map((definition) => {
      const sourcePoseAtRelease = deriveAircraftStateForSimulation(definition.sourceAircraftId, definition.releaseAtSeconds).pose
      return [definition.id, deriveAirGroundWeaponState(definition, timeSeconds, sourcePoseAtRelease)]
    }),
  ) as Readonly<Record<AirGroundStrikeId, AirGroundWeaponState>>
}

export function deriveStage3WorldState(timeSeconds: number): Stage3WorldState {
  const time = clampSimulationTime(timeSeconds)
  const talwar = deriveTalwarState(time)
  return {
    reachedEvents: deriveStage3ReachedEvents(time),
    weapons: deriveAirGroundWeapons(time),
    talwar,
    molniya: deriveMolniyaState(time),
    harbor: deriveHarborStage3State(time, talwar),
    industrial: deriveIndustrialStage3State(time),
  }
}

export function deriveSimulationWorldState(timeSeconds: number): SimulationWorldState {
  const time = clampSimulationTime(timeSeconds)
  const opening = deriveStage1WorldState(Math.min(time, STAGE1_DURATION_SECONDS))
  const stage4b2b = deriveSu30ReinforcementState(time)
  return {
    ...opening,
    timeSeconds: time,
    relativeTimeLabel: formatSimulationTime(time),
    localTimeLabel: formatLocalTime(time),
    reachedEvents: getReachedSimulationEvents(time),
    wasp: deriveWaspStateForSimulation(time),
    aircraft: {
      attacker_f35_01: deriveAircraftStateForSimulation('attacker_f35_01', time),
      attacker_f35_02: deriveAircraftStateForSimulation('attacker_f35_02', time),
      ...stage4b2b.aircraft,
    },
    radar: deriveRadarStateForSimulation(time),
    pantsir: derivePantsirStateForSimulation(time),
    fixedAaa: deriveFixedAaaStateForSimulation(time),
    persistent: derivePersistentStateForSimulation(time),
    transientEffects: deriveTransientEffectsForSimulation(time),
    stage3: deriveStage3WorldState(time),
    stage4b: deriveStage4BWorldState(time),
    stage4b2b,
    stage4b2c: deriveSupportConvoyState(time),
  }
}
