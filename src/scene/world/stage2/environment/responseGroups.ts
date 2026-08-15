export const ASH_HARBOR_REGION_IDS = ['region_a_harbor_district', 'region_b_storage_district', 'region_c_radar_hill', 'region_d_convoy_corridor', 'region_e_remote_beachhead', 'region_f_attacker_offshore_group'] as const

export type AshHarborRegionId = (typeof ASH_HARBOR_REGION_IDS)[number]

export type EnvironmentResponseKind = 'vegetation' | 'dry_grass' | 'scrub' | 'fence' | 'utility' | 'barrier' | 'industrial_fixture' | 'rock'

/**
 * Addressing metadata reserved for the authored, local Stage 3 response system.
 * Stage 2 components only publish this data; they do not animate blast response
 * or ignition.
 */
export type EnvironmentResponseGroup = Readonly<{
  id: string
  ignitionEligible: boolean
  kind: EnvironmentResponseKind
  regionId: AshHarborRegionId
  stage3Addressable: true
}>

export type EnvironmentResponseInstance = Readonly<{
  id: string
  instanceIndex: number
  kind: EnvironmentResponseKind
  position: readonly [x: number, y: number, z: number]
  responseGroupId: string
}>

export function createEnvironmentResponseGroup(id: string, regionId: AshHarborRegionId, kind: EnvironmentResponseKind, ignitionEligible = false): EnvironmentResponseGroup {
  return {
    id,
    ignitionEligible,
    kind,
    regionId,
    stage3Addressable: true,
  }
}

export function createEnvironmentUserData(componentId: string, responseGroup: EnvironmentResponseGroup | undefined, instanceCount: number, instances?: readonly EnvironmentResponseInstance[]) {
  return {
    cinderfrontEnvironment: {
      componentId,
      instanceCount,
      responseGroup: responseGroup ?? null,
      responseInstances: instances ?? null,
      stage: 2,
    },
  }
}
