import type { AmmunitionCookoffPulseState, GroundFireState, HarborStage3State, HeroEffectState, IndustrialStage3State, MolniyaState, TalwarState, Vector3 } from './types'

import { clamp, headingBetween, inverseLerp, lerp, lerpAngleRadians, samplePolyline, smoothstep, transformLocalOffsetByPose } from './math'
import { clampSimulationTime } from './time'
import { getReachedStage3Events } from './timeline'

const TALWAR_POSITION: Vector3 = { x: -3766, y: 0.22, z: 3847 }
const TALWAR_MODEL_YAW = Math.PI + (80 * Math.PI) / 180
const TALWAR_FUEL_LEAK_LOCAL: Vector3 = { x: -5.8, y: 0.2, z: 18 }
const TALWAR_FINAL_LIST_RADIANS = -(14 * Math.PI) / 180
const TALWAR_FINAL_IMMERSION_METERS = 3.1

export const MOLNIYA_BERTH_POSITION: Vector3 = { x: -4057.5, y: 0.2, z: 3265.5 }
export const MOLNIYA_HARBOR_PATH = [MOLNIYA_BERTH_POSITION, { x: -4300, y: 0.2, z: 3470 }, { x: -4750, y: 0.2, z: 3440 }, { x: -5150, y: 0.2, z: 3390 }, { x: -5550, y: 0.2, z: 3350 }] as const satisfies readonly Vector3[]

const MOLNIYA_DEPARTURE_SECONDS = 62
const MOLNIYA_OPEN_WATER_SECONDS = 172
const MOLNIYA_ACCELERATION_SECONDS = 12
const MOLNIYA_INITIAL_MODEL_YAW = Math.PI + (20 * Math.PI) / 180

function polylineLength(points: readonly Vector3[]): number {
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y, points[index].z - points[index - 1].z)
  }
  return total
}

const MOLNIYA_PATH_LENGTH_METERS = polylineLength(MOLNIYA_HARBOR_PATH)
const MOLNIYA_TRAVEL_SECONDS = MOLNIYA_OPEN_WATER_SECONDS - MOLNIYA_DEPARTURE_SECONDS
const MOLNIYA_CRUISE_SPEED_MPS = MOLNIYA_PATH_LENGTH_METERS / (MOLNIYA_TRAVEL_SECONDS - MOLNIYA_ACCELERATION_SECONDS / 2)

export const FUEL_STORAGE_HERO_DESCRIPTOR = {
  eventAtSeconds: 92,
  flashDurationSeconds: 0.08,
  fireballRadiusMeters: 68,
  fireballGrowthSeconds: 1.4,
  fireballLingerSeconds: 3.5,
  shockRadiusMeters: 600,
  shockTravelSeconds: 1.8,
  environmentResponseRadiusMeters: 320,
  responseBendAngleDegrees: [10, 32],
  initialResponseSeconds: [0.15, 0.45],
  springReturnSeconds: [1, 3],
  debrisCount: 14,
  flamingDebrisCount: 8,
  debrisLifetimeSeconds: 8,
  groundFireCount: 10,
  groundFirePlacementRadiusMeters: 180,
  smokeMinimumPersistenceSeconds: 90,
} as const

export const SCENARIO_WIND = {
  speedMetersPerSecond: 4,
  xzDirectionNormalized: [0.7, 0.71],
} as const

export const AMMUNITION_HERO_DESCRIPTOR = {
  eventAtSeconds: 132,
  flashDurationSeconds: 0.1,
  fireballRadiusMeters: 52,
  fireballGrowthSeconds: 0.75,
  fireballLingerSeconds: 2.2,
  shockRadiusMeters: 475,
  shockTravelSeconds: 1.35,
  debrisCount: 26,
  flamingDebrisCount: 11,
  debrisLifetimeSeconds: 9,
} as const

export const AMMUNITION_COOKOFF_SCHEDULE = [
  { id: 'ammo-cookoff-01', atSeconds: 116.35, targetId: 'ammo_bunker_02', position: { x: 1800, y: 39, z: 2350 }, strength: 0.54 },
  { id: 'ammo-cookoff-02', atSeconds: 117.25, targetId: 'ammo_bunker_05', position: { x: 1800, y: 38, z: 1800 }, strength: 0.68 },
  { id: 'ammo-cookoff-03', atSeconds: 118.95, targetId: 'ammo_bunker_01', position: { x: 1300, y: 38, z: 2350 }, strength: 0.46 },
  { id: 'ammo-cookoff-04', atSeconds: 120.15, targetId: 'ammo_bunker_06', position: { x: 2300, y: 38, z: 1800 }, strength: 0.76 },
  { id: 'ammo-cookoff-05', atSeconds: 121.95, targetId: 'ammo_bunker_03', position: { x: 2300, y: 39, z: 2350 }, strength: 0.58 },
  { id: 'ammo-cookoff-06', atSeconds: 123.45, targetId: 'ammo_bunker_05', position: { x: 1800, y: 38, z: 1800 }, strength: 0.82 },
  { id: 'ammo-cookoff-07', atSeconds: 125.2, targetId: 'ammo_bunker_01', position: { x: 1300, y: 38, z: 2350 }, strength: 0.63 },
  { id: 'ammo-cookoff-08', atSeconds: 126.75, targetId: 'ammo_bunker_03', position: { x: 2300, y: 39, z: 2350 }, strength: 0.71 },
  { id: 'ammo-cookoff-09', atSeconds: 128.5, targetId: 'ammo_bunker_04', position: { x: 1300, y: 38, z: 1800 }, strength: 0.9 },
] as const

export const FUEL_GROUND_FIRE_SCHEDULE = [
  { id: 'fuel-ground-fire-01', igniteAtSeconds: 94.1, position: { x: -680, y: 31, z: 2110 }, radiusMeters: 14 },
  { id: 'fuel-ground-fire-02', igniteAtSeconds: 94.6, position: { x: -430, y: 31, z: 2170 }, radiusMeters: 18 },
  { id: 'fuel-ground-fire-03', igniteAtSeconds: 95.2, position: { x: -610, y: 31, z: 1900 }, radiusMeters: 11 },
  { id: 'fuel-ground-fire-04', igniteAtSeconds: 96.1, position: { x: -390, y: 31, z: 2010 }, radiusMeters: 16 },
  { id: 'fuel-ground-fire-05', igniteAtSeconds: 97, position: { x: -700, y: 31, z: 1970 }, radiusMeters: 9 },
  { id: 'fuel-ground-fire-06', igniteAtSeconds: 98.4, position: { x: -535, y: 31, z: 2220 }, radiusMeters: 20 },
  { id: 'fuel-ground-fire-07', igniteAtSeconds: 99.1, position: { x: -470, y: 31, z: 1890 }, radiusMeters: 13 },
  { id: 'fuel-ground-fire-08', igniteAtSeconds: 100.2, position: { x: -395, y: 31, z: 2090 }, radiusMeters: 17 },
  { id: 'fuel-ground-fire-09', igniteAtSeconds: 101.3, position: { x: -620, y: 31, z: 2205 }, radiusMeters: 12 },
  { id: 'fuel-ground-fire-10', igniteAtSeconds: 102.8, position: { x: -520, y: 31, z: 1925 }, radiusMeters: 15 },
] as const

function monotonicRamp(startSeconds: number, endSeconds: number, timeSeconds: number): number {
  return smoothstep(startSeconds, endSeconds, timeSeconds)
}

export function deriveTalwarState(timeSeconds: number): TalwarState {
  const time = clampSimulationTime(timeSeconds)
  const firstHit = time >= 72
  const leakReachedWater = time >= 100
  const secondHit = time >= 115
  const missionKilled = time >= 165
  const earlyList = monotonicRamp(72, 115, time) * ((2.5 * Math.PI) / 180)
  const severeList = secondHit ? lerp((2.5 * Math.PI) / 180, Math.abs(TALWAR_FINAL_LIST_RADIANS), monotonicRamp(115, 165, time)) : earlyList
  const listRadians = -severeList
  const earlyFlooding = monotonicRamp(82, 115, time) * 0.18
  const floodingProgress = secondHit ? lerp(0.18, 1, monotonicRamp(115, 165, time)) : earlyFlooding
  const immersionMeters = floodingProgress * TALWAR_FINAL_IMMERSION_METERS
  const deckFireIntensity = !firstHit ? 0 : !secondHit ? lerp(0.55, 0.7, monotonicRamp(72, 115, time)) : lerp(0.85, 1, monotonicRamp(115, 165, time))
  const smokeIntensity = !firstHit ? 0 : !secondHit ? lerp(0.36, 0.58, monotonicRamp(72, 115, time)) : lerp(0.72, 1, monotonicRamp(115, 155, time))
  const defensiveActivity = !firstHit ? 1 : !secondHit ? lerp(0.62, 0.35, monotonicRamp(72, 115, time)) : lerp(0.25, 0, monotonicRamp(115, 145, time))
  const fuelLeakProgress = monotonicRamp(100, 165, time)
  const pose = {
    position: { x: TALWAR_POSITION.x, y: TALWAR_POSITION.y - immersionMeters, z: TALWAR_POSITION.z },
    rotation: { x: 0, y: TALWAR_MODEL_YAW, z: listRadians },
  }
  let phase: TalwarState['phase'] = 'moored-operational'
  if (missionKilled) phase = 'mission-killed-partially-flooded'
  else if (secondHit) phase = 'second-hit-severe-damage'
  else if (leakReachedWater) phase = 'burning-and-leaking'
  else if (firstHit) phase = 'first-hit-damaged'

  return {
    factionId: 'island_defender',
    phase,
    pose,
    headingDegrees: 80,
    moored: true,
    hitCount: secondHit ? 2 : firstHit ? 1 : 0,
    firstHit,
    secondHit,
    missionKilled,
    listRadians,
    floodingProgress,
    immersionMeters,
    deckFireIntensity,
    smokeIntensity,
    defensiveActivity,
    fuelLeakProgress,
    fuelLeakOrigin: transformLocalOffsetByPose(pose, TALWAR_FUEL_LEAK_LOCAL),
  }
}

function molniyaProgress(timeSeconds: number): number {
  const elapsed = clamp(timeSeconds - MOLNIYA_DEPARTURE_SECONDS, 0, MOLNIYA_TRAVEL_SECONDS)
  if (elapsed <= 0) return 0
  if (elapsed >= MOLNIYA_TRAVEL_SECONDS) return 1
  const denominator = MOLNIYA_TRAVEL_SECONDS - MOLNIYA_ACCELERATION_SECONDS / 2
  if (elapsed < MOLNIYA_ACCELERATION_SECONDS) return elapsed ** 2 / (2 * MOLNIYA_ACCELERATION_SECONDS) / denominator
  return (elapsed - MOLNIYA_ACCELERATION_SECONDS / 2) / denominator
}

function molniyaSpeed(timeSeconds: number): number {
  const elapsed = timeSeconds - MOLNIYA_DEPARTURE_SECONDS
  if (elapsed <= 0 || timeSeconds >= MOLNIYA_OPEN_WATER_SECONDS) return timeSeconds >= MOLNIYA_OPEN_WATER_SECONDS ? MOLNIYA_CRUISE_SPEED_MPS : 0
  if (elapsed < MOLNIYA_ACCELERATION_SECONDS) return MOLNIYA_CRUISE_SPEED_MPS * (elapsed / MOLNIYA_ACCELERATION_SECONDS)
  return MOLNIYA_CRUISE_SPEED_MPS
}

function mapHeadingDegreesFromModelYaw(modelYaw: number): number {
  return (((modelYaw - Math.PI) * 180) / Math.PI + 360) % 360
}

export function deriveMolniyaState(timeSeconds: number): MolniyaState {
  const time = clampSimulationTime(timeSeconds)
  const pathProgress = molniyaProgress(time)
  const position = samplePolyline(MOLNIYA_HARBOR_PATH, pathProgress)
  const sampleDelta = 0.0005
  const before = samplePolyline(MOLNIYA_HARBOR_PATH, Math.max(0, pathProgress - sampleDelta))
  const after = samplePolyline(MOLNIYA_HARBOR_PATH, Math.min(1, pathProgress + sampleDelta))
  const pathYaw = pathProgress >= 1 ? headingBetween(before, position) : headingBetween(position, after)
  const modelYaw = time <= MOLNIYA_DEPARTURE_SECONDS ? MOLNIYA_INITIAL_MODEL_YAW : lerpAngleRadians(MOLNIYA_INITIAL_MODEL_YAW, pathYaw, smoothstep(62, 70, time))
  const damaged = time >= 128
  const escaped = time >= MOLNIYA_OPEN_WATER_SECONDS
  const mobile = time >= MOLNIYA_DEPARTURE_SECONDS
  let phase: MolniyaState['phase'] = 'moored-operational'
  if (escaped) phase = 'escaped-into-open-water'
  else if (damaged) phase = 'damaged-mobile-with-smoke'
  else if (time >= 70) phase = 'withdrawing-through-harbor-channel'
  else if (mobile) phase = 'departing-berth'

  return {
    factionId: 'island_defender',
    phase,
    pose: {
      position,
      rotation: { x: 0, y: modelYaw, z: damaged ? Math.sin(time * 0.7) * 0.012 : 0 },
    },
    headingDegrees: mapHeadingDegreesFromModelYaw(modelYaw),
    pathProgress,
    speedMetersPerSecond: molniyaSpeed(time),
    wakeStrength: mobile ? clamp(molniyaSpeed(time) / MOLNIYA_CRUISE_SPEED_MPS, 0, 1) : 0,
    damaged,
    mobile,
    escaped,
    smokeIntensity: damaged ? lerp(0.32, 0.62, monotonicRamp(128, 138, time)) : 0,
    localFireIntensity: damaged ? 0.24 : 0,
  }
}

function deriveHeroEffect(
  timeSeconds: number,
  descriptor: {
    readonly eventAtSeconds: number
    readonly flashDurationSeconds: number
    readonly fireballRadiusMeters: number
    readonly fireballGrowthSeconds: number
    readonly fireballLingerSeconds: number
    readonly shockRadiusMeters: number
    readonly shockTravelSeconds: number
    readonly debrisCount: number
    readonly debrisLifetimeSeconds: number
  },
): HeroEffectState {
  const ageSeconds = Math.max(0, timeSeconds - descriptor.eventAtSeconds)
  const reached = timeSeconds >= descriptor.eventAtSeconds
  const flashIntensity = reached && ageSeconds < descriptor.flashDurationSeconds ? 1 - inverseLerp(0, descriptor.flashDurationSeconds, ageSeconds) : 0
  const growth = smoothstep(0, descriptor.fireballGrowthSeconds, ageSeconds)
  const fireballFade = 1 - smoothstep(descriptor.fireballGrowthSeconds, descriptor.fireballGrowthSeconds + descriptor.fireballLingerSeconds, ageSeconds)
  const fireballRadiusMeters = reached ? descriptor.fireballRadiusMeters * growth * fireballFade : 0
  const shockProgress = reached ? inverseLerp(0, descriptor.shockTravelSeconds, ageSeconds) : 0

  return {
    reached,
    ageSeconds,
    flashIntensity,
    fireballRadiusMeters,
    shockRadiusMeters: reached ? descriptor.shockRadiusMeters * shockProgress : 0,
    shockProgress,
    activeDebrisCount: reached && ageSeconds <= descriptor.debrisLifetimeSeconds ? descriptor.debrisCount : 0,
    persistentSmokeIntensity: reached ? smoothstep(0.8, 8, ageSeconds) : 0,
  }
}

function cookoffPulseState(timeSeconds: number): readonly AmmunitionCookoffPulseState[] {
  return AMMUNITION_COOKOFF_SCHEDULE.map((pulse) => {
    const age = timeSeconds - pulse.atSeconds
    return {
      id: pulse.id,
      atSeconds: pulse.atSeconds,
      targetId: pulse.targetId,
      position: pulse.position,
      intensity: age >= 0 && age < 0.65 ? pulse.strength * (1 - smoothstep(0, 0.65, age)) : 0,
      active: age >= 0 && age < 0.65,
      reached: age >= 0,
    }
  })
}

function groundFireState(timeSeconds: number): readonly GroundFireState[] {
  return FUEL_GROUND_FIRE_SCHEDULE.map((fire) => ({
    id: fire.id,
    igniteAtSeconds: fire.igniteAtSeconds,
    position: fire.position,
    radiusMeters: fire.radiusMeters,
    active: timeSeconds >= fire.igniteAtSeconds,
  }))
}

export function deriveHarborStage3State(timeSeconds: number, talwar: TalwarState): HarborStage3State {
  const time = clampSimulationTime(timeSeconds)
  const firstStrikeAge = time - 48
  const firstStrikeDamage = firstStrikeAge >= 0
  const firstStrikeFireIntensity = !firstStrikeDamage ? 0 : firstStrikeAge < 3 ? lerp(1, 0.45, smoothstep(0, 3, firstStrikeAge)) : 0.38
  const surfaceFuelFireVisible = time >= 115
  const fuelSheenProgress = time >= 100 ? Math.max(0.05, talwar.fuelLeakProgress) : 0

  return {
    firstStrikeDamage,
    firstStrikeFireIntensity,
    fuelContaminationVisible: time >= 100,
    fuelSheenProgress,
    fuelSheenRadiusMeters: fuelSheenProgress * 170,
    surfaceFuelFireVisible,
    surfaceFuelFireIntensity: surfaceFuelFireVisible ? lerp(0.3, 0.72, monotonicRamp(115, 123, time)) : 0,
    floatingDebrisCount: talwar.secondHit ? 12 : talwar.firstHit ? 5 : firstStrikeDamage ? 2 : 0,
  }
}

export function deriveIndustrialStage3State(timeSeconds: number): IndustrialStage3State {
  const time = clampSimulationTime(timeSeconds)
  const pipelineIgnited = time >= 78
  const fuelTank05Hit = time >= 86
  const fuelCascade = deriveHeroEffect(time, FUEL_STORAGE_HERO_DESCRIPTOR)
  const ammunitionPrimary = deriveHeroEffect(time, AMMUNITION_HERO_DESCRIPTOR)
  const pipelineAge = time - 78
  const tankAge = time - 86

  return {
    pipelineIgnited,
    pipelineFireIntensity: pipelineIgnited ? (pipelineAge < 3 ? lerp(1, 0.56, smoothstep(0, 3, pipelineAge)) : 0.56) : 0,
    fuelTank05Hit,
    fuelTank05DamageProgress: fuelTank05Hit ? (fuelCascade.reached ? 1 : lerp(0.38, 0.72, monotonicRamp(86, 92, time))) : 0,
    fuelTank05FireIntensity: fuelTank05Hit ? (fuelCascade.reached ? 1 : lerp(0.72, 0.94, smoothstep(0, 6, tankAge))) : 0,
    fuelCascade,
    environmentShockTriggered: time >= 94,
    blackoutFraction: time >= 98 ? lerp(0, 0.72, monotonicRamp(98, 101, time)) : 0,
    smokeColumnIntensity: fuelCascade.reached ? smoothstep(92.8, 101, time) : 0,
    scorchedGround: fuelCascade.reached,
    burnedScrub: time >= 94,
    groundFires: groundFireState(time),
    ammunitionCookoffActive: time >= 116,
    ammunitionCookoffPulses: cookoffPulseState(time),
    ammunitionPrimary,
    ammunitionCompoundDestroyed: ammunitionPrimary.reached,
  }
}

export function deriveStage3ReachedEvents(timeSeconds: number) {
  return getReachedStage3Events(clampSimulationTime(timeSeconds))
}
