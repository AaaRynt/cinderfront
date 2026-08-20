import type { AircraftId, AircraftMechanicalState, AircraftPhase, AircraftState, AirGroundStrikeId, AirGroundWeaponState, FixedAaaState, PantsirState, PersistentStage1State, Pose3, RadarState, SimulationWorldState, Stage1WorldState, Stage3WorldState, TransientEffectState, Vector3, WaspState } from './types'

import { SIMULATION_DURATION_SECONDS, STAGE1_DURATION_SECONDS, STAGE1_FIXED_SEED } from './constants'
import { headingBetween, inverseLerp, lerp, lerpVector3, samplePolyline, smoothstep, transformLocalOffset } from './math'
import { deriveHarborStage3State, deriveIndustrialStage3State, deriveMolniyaState, deriveStage3ReachedEvents, deriveTalwarState } from './stage3'
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
} as const satisfies Readonly<Record<AircraftId, number>>

const AIRCRAFT_DECK_OFFSETS = {
  attacker_f35_01: { x: -5, y: 15, z: -58 },
  attacker_f35_02: { x: -5, y: 15, z: 20 },
} as const satisfies Readonly<Record<AircraftId, Vector3>>

const PANTSIR_POSITION: Vector3 = { x: 3050, y: 190, z: 3375 }
const PRIMARY_RADAR_POSITION: Vector3 = { x: 3550, y: 210, z: 4150 }
const FIXED_AAA_POSITION: Vector3 = { x: 4625, y: 175, z: 3300 }

interface TimedPosition {
  readonly atSeconds: number
  readonly position: Vector3
}

function eventReached(timeSeconds: number, atSeconds: number): boolean {
  return hasReachedEvent(timeSeconds, atSeconds)
}

function sampleTimedPositions(keyframes: readonly TimedPosition[], timeSeconds: number): Vector3 {
  if (keyframes.length === 0) return { x: 0, y: 0, z: 0 }
  if (timeSeconds <= keyframes[0].atSeconds) return { ...keyframes[0].position }

  for (let index = 1; index < keyframes.length; index += 1) {
    const previous = keyframes[index - 1]
    const next = keyframes[index]
    if (timeSeconds <= next.atSeconds) {
      return lerpVector3(previous.position, next.position, smoothstep(previous.atSeconds, next.atSeconds, timeSeconds))
    }
  }

  return { ...keyframes[keyframes.length - 1].position }
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

function deckPosition(aircraftId: AircraftId, timeSeconds: number): Vector3 {
  const wasp = deriveWaspStateForSimulation(timeSeconds)
  return transformLocalOffset(wasp.pose.position, wasp.pose.rotation.y, AIRCRAFT_DECK_OFFSETS[aircraftId])
}

function authoredFlightPath(aircraftId: AircraftId): readonly TimedPosition[] {
  const launchAtSeconds = AIRCRAFT_LAUNCH_TIMES[aircraftId]
  const transitionStart = deckPosition(aircraftId, launchAtSeconds + 5)
  const liftedStart = { ...transitionStart, y: transitionStart.y + 42 }

  if (aircraftId === 'attacker_f35_01') {
    return [
      { atSeconds: 10, position: liftedStart },
      { atSeconds: 16, position: { x: -3400, y: 180, z: -1700 } },
      { atSeconds: 24, position: { x: -800, y: 420, z: 200 } },
      { atSeconds: 30, position: { x: 1200, y: 500, z: 1600 } },
      { atSeconds: 36, position: { x: 2700, y: 420, z: 2900 } },
      { atSeconds: 42, position: { x: 3400, y: 360, z: 3700 } },
      { atSeconds: 45, position: { x: 4200, y: 430, z: 4350 } },
      { atSeconds: 48, position: { x: 5200, y: 650, z: 4800 } },
      { atSeconds: 60, position: { x: 6000, y: 800, z: 3500 } },
      { atSeconds: 90, position: { x: 3000, y: 1000, z: 1000 } },
      { atSeconds: 120, position: { x: 0, y: 1100, z: -500 } },
      { atSeconds: 150, position: { x: -3000, y: 1200, z: -2500 } },
      { atSeconds: 172, position: { x: -5200, y: 1300, z: -3800 } },
    ]
  }

  return [
    { atSeconds: 18, position: liftedStart },
    { atSeconds: 24, position: { x: -4300, y: 180, z: -1200 } },
    { atSeconds: 32, position: { x: -4050, y: 400, z: 500 } },
    { atSeconds: 40, position: { x: -3850, y: 430, z: 2400 } },
    { atSeconds: 46, position: { x: -3750, y: 380, z: 3700 } },
    { atSeconds: 48, position: { x: -3650, y: 330, z: 4330 } },
    { atSeconds: 52, position: { x: -4500, y: 360, z: 3800 } },
    { atSeconds: 58, position: { x: -5200, y: 520, z: 2900 } },
    { atSeconds: 64, position: { x: -5000, y: 650, z: 3000 } },
    { atSeconds: 68, position: { x: -4800, y: 620, z: 3300 } },
    { atSeconds: 72, position: { x: -3600, y: 450, z: 3900 } },
    { atSeconds: 74, position: { x: -2700, y: 520, z: 3200 } },
    { atSeconds: 78, position: { x: -1500, y: 390, z: 2500 } },
    { atSeconds: 82, position: { x: -1400, y: 520, z: 2550 } },
    { atSeconds: 86, position: { x: -350, y: 390, z: 1950 } },
    { atSeconds: 94, position: { x: 2100, y: 700, z: 800 } },
    { atSeconds: 102, position: { x: 1500, y: 760, z: 2600 } },
    { atSeconds: 110.5, position: { x: -2400, y: 650, z: 3500 } },
    { atSeconds: 115, position: { x: -4200, y: 440, z: 4100 } },
    { atSeconds: 128, position: { x: -2500, y: 700, z: 2200 } },
    { atSeconds: 150, position: { x: -4500, y: 950, z: -1200 } },
    { atSeconds: 172, position: { x: -6500, y: 1100, z: -3800 } },
  ]
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

function aircraftPosition(aircraftId: AircraftId, timeSeconds: number): Vector3 {
  const launchAtSeconds = AIRCRAFT_LAUNCH_TIMES[aircraftId]
  const elapsedSeconds = timeSeconds - launchAtSeconds

  if (elapsedSeconds < 2) return deckPosition(aircraftId, timeSeconds)
  if (elapsedSeconds < 5) {
    const deck = deckPosition(aircraftId, timeSeconds)
    return {
      ...deck,
      y: deck.y + smoothstep(2, 5, elapsedSeconds) * 42,
    }
  }

  return sampleTimedPositions(authoredFlightPath(aircraftId), timeSeconds)
}

function aircraftPose(aircraftId: AircraftId, timeSeconds: number): Pose3 {
  const launchAtSeconds = AIRCRAFT_LAUNCH_TIMES[aircraftId]
  const elapsedSeconds = timeSeconds - launchAtSeconds
  const position = aircraftPosition(aircraftId, timeSeconds)

  if (elapsedSeconds < 5) {
    const waspRotation = deriveWaspStateForSimulation(timeSeconds).pose.rotation
    return {
      position,
      rotation: {
        x: 0,
        y: waspRotation.y,
        z: elapsedSeconds < 2 ? waspRotation.z : 0,
      },
    }
  }

  const before = aircraftPosition(aircraftId, Math.max(launchAtSeconds + 5, timeSeconds - 0.05))
  const poseSampleMaximum = timeSeconds <= STAGE1_DURATION_SECONDS ? STAGE1_DURATION_SECONDS : SIMULATION_DURATION_SECONDS
  const after = aircraftPosition(aircraftId, Math.min(poseSampleMaximum, timeSeconds + 0.05))
  const horizontalDistance = Math.hypot(after.x - before.x, after.z - before.z)
  const seededPhase = ((STAGE1_FIXED_SEED + (aircraftId === 'attacker_f35_01' ? 1 : 2)) % 360) * (Math.PI / 180)

  return {
    position,
    rotation: {
      x: Math.atan2(after.y - before.y, Math.max(horizontalDistance, 0.001)),
      y: headingBetween(before, after),
      z: Math.sin(timeSeconds * 0.48 + seededPhase) * (elapsedSeconds < 11 ? 0.06 : 0.12),
    },
  }
}

function deriveAircraftStateForSimulation(aircraftId: AircraftId, timeSeconds: number): AircraftState {
  const time = clampSimulationTime(timeSeconds)
  const launchAtSeconds = AIRCRAFT_LAUNCH_TIMES[aircraftId]
  const elapsedSeconds = time - launchAtSeconds
  return {
    id: aircraftId,
    factionId: 'landings_attacker',
    launchAtSeconds,
    phase: aircraftPhase(elapsedSeconds),
    launched: eventReached(time, launchAtSeconds),
    onDeck: elapsedSeconds < 2,
    pose: aircraftPose(aircraftId, time),
    mechanical: aircraftMechanicalState(elapsedSeconds),
  }
}

/** Frozen Stage 1 helper: direct callers retain the original T+48 boundary. */
export function deriveAircraftState(aircraftId: AircraftId, timeSeconds: number): AircraftState {
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
    },
    radar: deriveRadarStateForSimulation(time),
    pantsir: derivePantsirStateForSimulation(time),
    fixedAaa: deriveFixedAaaStateForSimulation(time),
    persistent: derivePersistentStateForSimulation(time),
    transientEffects: deriveTransientEffectsForSimulation(time),
    stage3: deriveStage3WorldState(time),
  }
}
