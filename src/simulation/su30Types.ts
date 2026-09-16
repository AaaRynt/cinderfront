import type { AircraftMotionState, Pose3, Vector3 } from './types'

export type Su30AircraftId = 'defender_su30_01' | 'defender_su30_02'
export type Su30Activity = 'off-map' | 'entering' | 'pressuring' | 'supporting' | 'damaged-breakaway' | 'covering-withdrawal' | 'withdrawing' | 'egressing' | 'exited'
export type Su30MapPresence = 'outside' | 'boundary' | 'active' | 'leaving' | 'beyond-render-boundary'

export interface Su30SmokeSample {
  readonly emittedAtSeconds: number
  readonly position: Vector3
  readonly radius: number
  readonly opacity: number
}

export interface Su30SparkSample {
  readonly position: Vector3
  readonly radius: number
  readonly opacity: number
}

export interface Su30AircraftState extends AircraftMotionState {
  readonly id: Su30AircraftId
  readonly vehicleType: 'Su-30MKK'
  readonly factionId: 'island_defender'
  readonly activity: Su30Activity
  readonly physicalCondition: 'operational' | 'damaged'
  readonly outcome: 'active' | 'survived'
  readonly visible: boolean
  readonly mapPresence: Su30MapPresence
  readonly velocity: Vector3
  readonly accelerationMetersPerSecondSquared: number
  readonly engine: { readonly leftIntensity: number; readonly rightIntensity: number }
  readonly navigationLightIntensity: number
  readonly vaporIntensity: number
  readonly damage: {
    readonly ageSeconds: number | null
    readonly flashIntensity: number
    readonly sparkIntensity: number
    readonly smokeIntensity: number
    readonly surfaceDarkened: boolean
    readonly anchor: Vector3
    readonly onsetAnchor: Vector3
  }
  readonly damageTrail: readonly Su30SmokeSample[]
  readonly damageSparks: readonly Su30SparkSample[]
}

export interface Su30ReinforcementState {
  readonly aircraft: Readonly<Record<Su30AircraftId, Su30AircraftState>>
  readonly orderedAircraftIds: readonly Su30AircraftId[]
  readonly anchor: Pose3
  readonly status: string
  readonly operationalCount: number
  readonly damagedCount: number
  readonly survivorCount: number
}
