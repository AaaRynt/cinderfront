import type { GroundVehicleMotionState, Pose3, Vector3, WheeledDrivetrainState } from './types'

export type SupportVehicleId = 'defender_support_fire_01' | 'defender_support_engineering_01' | 'defender_support_recovery_01' | 'defender_support_fire_02' | 'defender_support_logistics_01' | 'defender_support_logistics_02'
export type SupportSubtype = 'fire_engine' | 'engineering_truck' | 'recovery_vehicle' | 'logistics_truck'
export type SupportActivity = 'routine_transit' | 'emergency_response' | 'visibility_hesitation' | 'cautious_advance' | 'obstruction_stop' | 'route_assessment' | 'limited_reposition' | 'holding' | 'abandoning_approach' | 'reversing'
export type SupportConvoyPhase = 'routine_transit' | 'emergency_response' | 'visibility_hesitation' | 'cautious_advance' | 'obstruction_stop' | 'route_assessment' | 'withdrawal_in_progress'
export type Stage4B2CEventId = 'rescue_convoy_redirect' | 'rescue_convoy_chokepoint' | 'rescue_route_secondary_hit' | 'rescue_convoy_abandon_approach'

export interface Stage4B2CEvent {
  readonly id: Stage4B2CEventId
  readonly atSeconds: number
  readonly localTime: string
  readonly event: string
  readonly groupId: 'defender_support_convoy_01'
  readonly pathId: 'path_support_convoy_industrial'
  readonly targetFeatureId?: 'dry_wash_bridge'
  // The route hit deliberately has no source actor, weapon, or kill attribution.
}

export interface SupportLightingState {
  readonly headlights: boolean
  readonly brakeLights: boolean
  readonly reverseLights: boolean
  readonly beaconEnabled: boolean
  readonly beaconPhaseOffsetSeconds: number
  readonly beaconIntensity: number
}

export interface SupportVehicleState extends GroundVehicleMotionState {
  readonly id: SupportVehicleId
  readonly groupId: 'defender_support_convoy_01'
  readonly vehicleType: 'support_vehicle'
  readonly subtype: SupportSubtype
  readonly convoyOrder: number
  readonly responseRole: 'lead_hold' | 'local_reposition' | 'rear_withdrawal'
  readonly activity: SupportActivity
  readonly physicalCondition: 'operational'
  readonly outcome: 'active' | 'survived'
  readonly visible: true
  readonly mapPresence: 'present'
  readonly drivetrain: WheeledDrivetrainState
  readonly lighting: SupportLightingState
  readonly routeStationMeters: number
}

export interface SupportConvoyGroupState {
  readonly id: 'defender_support_convoy_01'
  readonly factionId: 'island_defender'
  readonly role: 'generic_support_convoy'
  readonly pathId: 'path_support_convoy_industrial'
  readonly phase: SupportConvoyPhase
  readonly orderedVehicleIds: readonly SupportVehicleId[]
  readonly vehicles: Readonly<Record<SupportVehicleId, SupportVehicleState>>
  readonly operationalCount: number
  readonly survivorCount: number
  readonly holdingCount: number
  readonly repositioningCount: number
  readonly withdrawingCount: number
  readonly outcome: 'active' | 'survived'
}

export interface SupportBridgeState {
  readonly eventId: 'rescue_route_secondary_hit'
  readonly position: Vector3
  readonly ageSeconds: number
  readonly blocked: boolean
  readonly persistentDamage: boolean
  readonly flashIntensity: number
  readonly dustIntensity: number
  readonly shockProgress: number
  readonly debrisActive: boolean
}

export interface SupportConvoyWorldState {
  readonly reachedEvents: readonly Stage4B2CEvent[]
  readonly convoy: SupportConvoyGroupState
  readonly bridge: SupportBridgeState
  readonly visibilityIntensity: number
  readonly camera: { readonly anchor: Pose3; readonly framingScale: number }
}
