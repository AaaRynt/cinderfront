import type { LCAC_IDS, LAV_IDS, LAV_GROUP_IDS } from './landingCraftData'
import type { Pose3, Vector3 } from './types'

export type LcacId = (typeof LCAC_IDS)[number]
export type LavId = (typeof LAV_IDS)[number]
export type LavGroupId = (typeof LAV_GROUP_IDS)[number]
export type LandingPathId = 'path_lcac_beach_approach_west' | 'path_lcac_beach_approach_east'
export interface Stage5BEvent {
  readonly id: 'lcac_departure' | 'lcac_01_shallow_water' | 'lcac_02_shallow_water' | 'lcac_01_beach' | 'lcac_02_beach'
  readonly atSeconds: number
  readonly localTime: string
  readonly event: 'depart_offshore_staging_area' | 'enter_final_nearshore_approach' | 'beach_and_lower_ramp'
  readonly actorId?: LcacId
  readonly entities?: readonly LcacId[]
  readonly pathId?: LandingPathId
  readonly pathIds?: readonly LandingPathId[]
  readonly resultingState?: 'beached_ramp_lowered'
}
export interface EmbarkedLavState {
  readonly id: LavId
  readonly groupId: LavGroupId
  readonly carrierId: LcacId
  readonly factionId: 'landings_attacker'
  readonly vehicleType: 'LAV-25'
  readonly activity: 'embarked'
  readonly condition: 'operational'
  readonly outcome: 'active'
  readonly localPose: Pose3
  readonly pose: Pose3
  readonly wheelTravelMeters: 0
  readonly wheelRotationRadians: 0
  readonly dustIntensity: 0
}
export interface LandingParticle {
  readonly id: string
  readonly kind: 'water' | 'spray' | 'sand'
  readonly birthAtSeconds: number
  readonly ageSeconds: number
  readonly position: Vector3
  readonly scale: Vector3
  readonly opacity: number
}
export interface LandingCraftState {
  readonly id: LcacId
  readonly factionId: 'landings_attacker'
  readonly vehicleType: 'LCAC'
  readonly payloadGroupId: LavGroupId
  readonly payloadIds: readonly LavId[]
  readonly activity: 'holding' | 'departing' | 'approaching' | 'final-nearshore' | 'shore-contact' | 'ramp-lowering' | 'beached-ready'
  readonly condition: 'operational'
  readonly outcome: 'active'
  readonly pathId: LandingPathId
  readonly stagingFeatureId: string
  readonly nearshoreFeatureId: string
  readonly stagingRegionId: 'region_e_remote_beachhead'
  readonly waterRegion: 'open-water' | 'broad-shallows' | 'intertidal' | 'land'
  readonly nearshoreGateReached: boolean
  readonly pose: Pose3
  readonly speedMetersPerSecond: number
  readonly accelerationMetersPerSecondSquared: number
  readonly travelDistanceMeters: number
  readonly landContactFraction: number
  readonly mechanics: {
    readonly fanRotationRadians: number
    readonly fanPower: number
    readonly skirtCompression: number
    readonly deckLocalY: number
    readonly bowRampAngleRadians: number
    readonly bowRampProgress: number
    readonly bowRampReady: boolean
    readonly rampTipPosition: Vector3
    readonly sternRampClosed: true
    readonly navigationLight: number
  }
  readonly particles: readonly LandingParticle[]
}
export interface LandingWorldState {
  readonly orderedCraftIds: readonly LcacId[]
  readonly crafts: Readonly<Record<LcacId, LandingCraftState>>
  readonly orderedPayloadIds: readonly LavId[]
  readonly payload: Readonly<Record<LavId, EmbarkedLavState>>
  readonly embarkedCount: 8
  readonly operationalCraftCount: 2
  readonly operationalPayloadCount: 8
}
