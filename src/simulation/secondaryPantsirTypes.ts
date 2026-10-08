import type { Pose3, Vector3 } from './types'

export interface Stage5AEvent {
  readonly id: 'pantsir_02_relocate' | 'pantsir_02_destroyed'
  readonly atSeconds: number
  readonly localTime: string
  readonly event: string
  readonly actorId: 'defender_pantsir_02'
  readonly pathId?: 'path_pantsir_relocation'
  readonly sourceAircraftId?: 'attacker_f35_01'
  readonly effectProfile?: 'vehicle_kill_medium'
}

export interface SecondaryPantsirShot {
  readonly id: string
  readonly launchAtSeconds: number
  readonly durationSeconds: number
  readonly origin: Vector3
  readonly control: Vector3
  readonly end: Vector3
  readonly active: boolean
  readonly ageSeconds: number
  readonly hit: false
}

export interface SecondaryPantsirState {
  readonly id: 'defender_pantsir_02'
  readonly factionId: 'island_defender'
  readonly pathId: 'path_pantsir_relocation'
  readonly initialFeatureId: 'corridor_pull_off_east'
  readonly roles: readonly ['relocation', 'secondary air-defense support']
  readonly phase: 'reserve' | 'relocating' | 'deploying' | 'engaging' | 'destroyed'
  readonly activity: 'reserve' | 'relocating' | 'braking' | 'deploying-alignment' | 'engaging' | 'destroyed'
  readonly condition: 'operational' | 'destroyed'
  readonly outcome: 'active' | 'lost'
  readonly status: string
  readonly pose: Pose3
  readonly speedMetersPerSecond: number
  readonly accelerationMetersPerSecondSquared: number
  readonly travelDistanceMeters: number
  readonly movementDust: number
  readonly mechanical: {
    readonly wheelTravelMeters: number
    readonly steeringRadians: number
    readonly stabilizerDeployment: number
    readonly radarDeployment: number
    readonly turretYawRadians: number
    readonly radarRotationRadians: number
    readonly launcherElevationRadians: number
    readonly firedTubeCount: number
  }
  readonly defensiveShots: readonly SecondaryPantsirShot[]
  readonly destruction: {
    readonly active: boolean
    readonly ageSeconds: number
    readonly sourceAircraftId: 'attacker_f35_01'
    readonly impactPosition: Vector3
    readonly groundPosition: Vector3
    readonly flashIntensity: number
    readonly dustIntensity: number
    readonly fireIntensity: number
    readonly smokeIntensity: number
  }
}
