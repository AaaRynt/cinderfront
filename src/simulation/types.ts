export type RawScenarioFaction = 'attacker' | 'defender'

export type FactionId = 'landings_attacker' | 'island_defender'

export type SimulationSpeed = 0.5 | 1 | 2

export type AircraftId = 'attacker_f35_01' | 'attacker_f35_02'

export type Stage1EventId = 'scenario_begin' | 'wasp_offshore_underway' | 'f35_01_launch' | 'f35_02_launch' | 'radar_alert' | 'air_defense_tracking' | 'pantsir_01_engage' | 'fixed_air_defense_engage' | 'radar_hill_near_hit' | 'pantsir_01_destroyed' | 'primary_radar_disabled' | 'harbor_first_hit'

export type Stage3EventId =
  | 'f35_02_harbor_ingress'
  | 'molniya_departure'
  | 'talwar_first_hit'
  | 'industrial_pipeline_hit'
  | 'fuel_tank_initial_hit'
  | 'fuel_storage_cascade'
  | 'fuel_shock_environment_response'
  | 'industrial_blackout'
  | 'talwar_fuel_leak'
  | 'talwar_second_hit'
  | 'ammunition_cookoff_begin'
  | 'molniya_fragment_damage'
  | 'ammunition_storage_primary_detonation'
  | 'talwar_severe_list'
  | 'molniya_open_water'

export type Stage4BEventId = 'btr_01_disabled' | 'btr_survivors_fallback'

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

export interface Stage3Event {
  readonly id: Stage3EventId
  readonly atSeconds: number
  readonly localTime: string
  readonly event: string
  readonly actorId?: string
  readonly targetId?: string
  readonly pathId?: 'path_molniya_harbor_exit'
  readonly effectProfile?: 'ship_hit_heavy' | 'fuel_storage_cascade' | 'harbor_fuel_fire' | 'ammunition_storage_cookoff'
  readonly resultingState?: 'withdrawing_through_harbor_channel' | 'damaged_mobile_with_smoke' | 'escaped_into_open_water'
}

export interface Stage4BEvent {
  readonly id: Stage4BEventId
  readonly atSeconds: number
  readonly localTime: string
  readonly event: string
  readonly groupId: 'defender_btr_group_01'
  readonly actorId?: 'defender_btr_01'
  readonly targetId?: 'defender_btr_group_01'
  readonly pathId?: 'path_defender_convoy_fallback'
  readonly effectProfile?: 'vehicle_kill_medium'
  readonly resultingState?: 'three_mobile_one_disabled'
}

export type SimulationEvent = Stage1Event | Stage3Event | Stage4BEvent

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
  /** World-space speed reconstructed from the deterministic authored flight curve. */
  readonly speedMetersPerSecond: number
  /** Smoothed cinematic heading rate. Positive values turn toward increasing yaw. */
  readonly turnRateRadiansPerSecond: number
  /** The authored aerodynamic bank, also applied to pose.rotation.z. */
  readonly bankRadians: number
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

export type AirGroundStrikeId = 'radar_hill_near_hit' | 'pantsir_01_destroyed' | 'primary_radar_disabled' | 'harbor_first_hit' | 'talwar_first_hit' | 'industrial_pipeline_hit' | 'fuel_tank_initial_hit' | 'talwar_second_hit'

export interface AirGroundStrikeDefinition {
  readonly id: AirGroundStrikeId
  readonly sourceAircraftId: AircraftId
  readonly targetId: 'sam_battery_area' | 'defender_pantsir_01' | 'radar_search_site' | 'warehouse_harbor_01' | 'defender_talwar_01:first_hit' | 'pipeline_harbor_fuel_trunk' | 'fuel_tank_05' | 'defender_talwar_01:second_hit'
  readonly releaseAtSeconds: number
  readonly impactAtSeconds: number
  readonly targetPosition: Vector3
  readonly lowerBayOffset: Vector3
  readonly kind: 'guided-bomb'
  readonly powered: false
  readonly bodyColor: '#202522'
}

export type AirGroundWeaponPhase = 'not-released' | 'in-flight' | 'impacted'

export interface AirGroundWeaponState {
  readonly id: AirGroundStrikeId
  readonly phase: AirGroundWeaponPhase
  readonly visible: boolean
  readonly powered: false
  readonly hasContinuousFlame: false
  readonly bodyColor: '#202522'
  readonly releasePosition: Vector3
  readonly targetPosition: Vector3
  readonly position: Vector3
  readonly tangent: Vector3
  readonly initialTangent: Vector3
  readonly progress: number
}

export interface TalwarState {
  readonly factionId: 'island_defender'
  readonly phase: 'moored-operational' | 'first-hit-damaged' | 'burning-and-leaking' | 'second-hit-severe-damage' | 'mission-killed-partially-flooded'
  readonly pose: Pose3
  readonly headingDegrees: 80
  readonly moored: true
  readonly hitCount: 0 | 1 | 2
  readonly firstHit: boolean
  readonly secondHit: boolean
  readonly missionKilled: boolean
  readonly listRadians: number
  readonly floodingProgress: number
  readonly immersionMeters: number
  readonly deckFireIntensity: number
  readonly smokeIntensity: number
  readonly defensiveActivity: number
  readonly fuelLeakProgress: number
  readonly fuelLeakOrigin: Vector3
}

export interface MolniyaState {
  readonly factionId: 'island_defender'
  readonly phase: 'moored-operational' | 'departing-berth' | 'withdrawing-through-harbor-channel' | 'damaged-mobile-with-smoke' | 'escaped-into-open-water'
  readonly pose: Pose3
  readonly headingDegrees: number
  readonly pathProgress: number
  readonly speedMetersPerSecond: number
  readonly wakeStrength: number
  readonly damaged: boolean
  readonly mobile: boolean
  readonly escaped: boolean
  readonly smokeIntensity: number
  readonly localFireIntensity: number
}

export interface HarborStage3State {
  readonly firstStrikeDamage: boolean
  readonly firstStrikeFireIntensity: number
  readonly fuelContaminationVisible: boolean
  readonly fuelSheenProgress: number
  readonly fuelSheenRadiusMeters: number
  readonly surfaceFuelFireVisible: boolean
  readonly surfaceFuelFireIntensity: number
  readonly floatingDebrisCount: number
}

export interface HeroEffectState {
  readonly reached: boolean
  readonly ageSeconds: number
  readonly flashIntensity: number
  readonly fireballRadiusMeters: number
  readonly shockRadiusMeters: number
  readonly shockProgress: number
  readonly activeDebrisCount: number
  readonly persistentSmokeIntensity: number
}

export interface AmmunitionCookoffPulseState {
  readonly id: string
  readonly atSeconds: number
  readonly targetId: string
  readonly position: Vector3
  readonly intensity: number
  readonly active: boolean
  readonly reached: boolean
}

export interface GroundFireState {
  readonly id: string
  readonly igniteAtSeconds: number
  readonly position: Vector3
  readonly radiusMeters: number
  readonly active: boolean
}

export interface IndustrialStage3State {
  readonly pipelineIgnited: boolean
  readonly pipelineFireIntensity: number
  readonly fuelTank05Hit: boolean
  readonly fuelTank05DamageProgress: number
  readonly fuelTank05FireIntensity: number
  readonly fuelCascade: HeroEffectState
  readonly environmentShockTriggered: boolean
  readonly blackoutFraction: number
  readonly smokeColumnIntensity: number
  readonly scorchedGround: boolean
  readonly burnedScrub: boolean
  readonly groundFires: readonly GroundFireState[]
  readonly ammunitionCookoffActive: boolean
  readonly ammunitionCookoffPulses: readonly AmmunitionCookoffPulseState[]
  readonly ammunitionPrimary: HeroEffectState
  readonly ammunitionCompoundDestroyed: boolean
}

export interface Stage3WorldState {
  readonly reachedEvents: readonly Stage3Event[]
  readonly weapons: Readonly<Record<AirGroundStrikeId, AirGroundWeaponState>>
  readonly talwar: TalwarState
  readonly molniya: MolniyaState
  readonly harbor: HarborStage3State
  readonly industrial: IndustrialStage3State
}

export type GroundVehicleId = 'defender_btr_01' | 'defender_btr_02' | 'defender_btr_03' | 'defender_btr_04'

export type GroundVehicleActivityPhase = 'security-hold' | 'alerted' | 'moving-to-support' | 'supporting' | 'turning-to-withdraw' | 'withdrawing' | 'movement-complete'

export type GroundVehiclePhysicalCondition = 'operational' | 'damaged' | 'disabled' | 'destroyed'

export type GroundVehicleOutcome = 'active' | 'lost' | 'survived'

export interface GroundVehicleDamageState {
  readonly causeEventId: 'ammunition_storage_primary_detonation' | null
  readonly ageSeconds: number
  readonly hullDamageProgress: number
  readonly flashIntensity: number
  readonly sparkIntensity: number
  readonly dustKickIntensity: number
  readonly localFireIntensity: number
  readonly smokeIntensity: number
}

export interface GroundVehicleState {
  readonly id: GroundVehicleId
  readonly groupId: 'defender_btr_group_01'
  readonly factionId: 'island_defender'
  readonly vehicleType: 'BTR-80'
  readonly activity: GroundVehicleActivityPhase
  readonly physicalCondition: GroundVehiclePhysicalCondition
  readonly outcome: GroundVehicleOutcome
  readonly pose: Pose3
  /** Unit world-space XZ tangent followed by the vehicle's actual motion path. */
  readonly routeTangent: Vector3
  readonly speedMetersPerSecond: number
  readonly accelerationMetersPerSecondSquared: number
  readonly steeringRadians: number
  /** Turret azimuth relative to the hull's local forward axis. */
  readonly turretYawRadians: number
  readonly traveledDistanceMeters: number
  readonly wheelRotationRadians: number
  readonly dustIntensity: number
  readonly groundClearanceMeters: number
  readonly damage: GroundVehicleDamageState
}

export interface GroundVehicleGroupState {
  readonly id: 'defender_btr_group_01'
  readonly factionId: 'island_defender'
  readonly activity: GroundVehicleActivityPhase
  readonly vehicles: Readonly<Record<GroundVehicleId, GroundVehicleState>>
  readonly orderedVehicleIds: readonly GroundVehicleId[]
  readonly operationalCount: number
  readonly disabledCount: number
  readonly withdrawingCount: number
  readonly survivorCount: number
}

export interface Stage4BWorldState {
  readonly reachedEvents: readonly Stage4BEvent[]
  readonly btrGroup: GroundVehicleGroupState
}

export interface SimulationWorldState extends Omit<Stage1WorldState, 'reachedEvents'> {
  readonly reachedEvents: readonly SimulationEvent[]
  readonly stage3: Stage3WorldState
  readonly stage4b: Stage4BWorldState
}
