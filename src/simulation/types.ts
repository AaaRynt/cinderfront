export type RawScenarioFaction = 'attacker' | 'defender'

export type FactionId = 'landings_attacker' | 'island_defender'

export type SimulationSpeed = 0.5 | 1 | 2

export type AircraftId = 'attacker_f35_01' | 'attacker_f35_02'

export type Stage1EventId = 'scenario_begin' | 'wasp_offshore_underway' | 'f35_01_launch' | 'f35_02_launch' | 'radar_alert' | 'air_defense_tracking' | 'pantsir_01_engage' | 'fixed_air_defense_engage' | 'radar_hill_near_hit' | 'pantsir_01_destroyed' | 'primary_radar_disabled' | 'harbor_first_hit'

export interface Vector3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface Pose3 {
  readonly position: Vector3
  readonly rotation: Vector3
}

export interface Stage1Event {
  readonly id: Stage1EventId
  readonly atSeconds: number
  readonly localTime: string
  readonly event: string
  readonly actorId?: string
  readonly targetId?: string
  readonly effectProfile?: 'radar_position_hit' | 'vehicle_kill_medium'
}

export type AircraftPhase = 'launch-ready' | 'stovl-prep' | 'vertical-lift' | 'transition' | 'forward-flight'

export interface AircraftMechanicalState {
  /** 0 is closed; 1 is fully open. */
  readonly liftFanDoor: number
  /** 0 points aft; 90 points down for vertical lift. */
  readonly rearNozzleDeflectionDegrees: number
  /** 0 is deployed; 1 is fully retracted. */
  readonly landingGearRetraction: number
  readonly downwashStrength: number
  readonly heatHazeStrength: number
}

export interface AircraftState {
  readonly id: AircraftId
  readonly factionId: 'landings_attacker'
  readonly launchAtSeconds: number
  readonly phase: AircraftPhase
  readonly launched: boolean
  readonly onDeck: boolean
  readonly pose: Pose3
  readonly mechanical: AircraftMechanicalState
}

export interface WaspState {
  readonly factionId: 'landings_attacker'
  readonly phase: 'underway' | 'underway-and-supporting-launch-operations'
  readonly pathProgress: number
  readonly pose: Pose3
  readonly wakeStrength: number
}

export type PrimaryRadarPhase = 'scanning' | 'alert-tracking' | 'tracking' | 'destroyed'

export interface RadarState {
  readonly primaryPhase: PrimaryRadarPhase
  readonly primaryOperational: boolean
  readonly primaryDishRotationRadians: number
  readonly secondaryOperational: true
  readonly secondaryTracking: boolean
  readonly secondaryDishRotationRadians: number
}

export type PantsirPhase = 'operational' | 'acquiring' | 'engaging' | 'destroyed'

export interface PantsirState {
  readonly factionId: 'island_defender'
  readonly phase: PantsirPhase
  readonly operational: boolean
  readonly turretYawRadians: number
  readonly radarRotationRadians: number
  readonly missileActivity: number
  readonly launcherRoundsExpended: number
}

export interface FixedAaaState {
  readonly factionId: 'island_defender'
  readonly phase: 'idle' | 'tracking' | 'firing' | 'ceased'
  readonly turretYawRadians: number
  readonly isFiring: boolean
  readonly tracerActivity: number
}

export interface PersistentStage1State {
  readonly radarHillScorch: boolean
  readonly radarHillSmoke: boolean
  readonly radarHillLocalFire: boolean
  readonly pantsirWreck: boolean
  readonly pantsirFire: boolean
  readonly pantsirSmoke: boolean
  readonly primaryRadarDestroyed: boolean
  readonly primaryRadarDamage: boolean
  readonly primaryRadarSmoke: boolean
  readonly primaryRadarLocalFire: boolean
  readonly harborFirstHit: boolean
}

export interface TransientEffectState {
  readonly radarHillImpact: number
  readonly pantsirDestruction: number
  readonly primaryRadarDestruction: number
  readonly harborImpact: number
}

export interface Stage1WorldState {
  readonly seed: number
  readonly timeSeconds: number
  readonly relativeTimeLabel: string
  readonly localTimeLabel: string
  readonly reachedEvents: readonly Stage1Event[]
  readonly wasp: WaspState
  readonly aircraft: Readonly<Record<AircraftId, AircraftState>>
  readonly radar: RadarState
  readonly pantsir: PantsirState
  readonly fixedAaa: FixedAaaState
  readonly persistent: PersistentStage1State
  readonly transientEffects: TransientEffectState
}
