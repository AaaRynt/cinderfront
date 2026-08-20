export { AmmunitionCookoffEffect } from './AmmunitionCookoffEffect.tsx'
export type { AmmunitionCookoffBurstDescriptor, AmmunitionCookoffEffectProps } from './AmmunitionCookoffEffect.tsx'
export { AnalyticalDebris } from './AnalyticalDebris.tsx'
export type { AnalyticalDebrisProps } from './AnalyticalDebris.tsx'
export { BlastResponseField } from './BlastResponseField.tsx'
export type { BlastResponseFieldProps } from './BlastResponseField.tsx'
export { DustShockFront, LayeredBlast, PersistentBlastDamage } from './BlastLayers.tsx'
export type { LayeredBlastProps, PersistentBlastDamageProps, Stage3BlastProfile } from './BlastLayers.tsx'
export { BoundedSmokeColumn } from './BoundedSmoke.tsx'
export type { BoundedSmokeColumnProps } from './BoundedSmoke.tsx'
export { FuelStorageHeroEffect } from './FuelStorageHeroEffect.tsx'
export type { FuelStorageHeroEffectProps } from './FuelStorageHeroEffect.tsx'
export { GuidedBomb } from './GuidedBomb.tsx'
export type { GuidedBombProps } from './GuidedBomb.tsx'
export { PersistentGroundFires } from './PersistentGroundFires.tsx'
export type { PersistentGroundFiresProps } from './PersistentGroundFires.tsx'
export {
  AMMUNITION_COOKOFF_OFFSETS_SECONDS,
  AMMUNITION_COOKOFF_START_SECONDS,
  AMMUNITION_PRIMARY_TIME_SECONDS,
  AMMUNITION_SECONDARY_OFFSETS_SECONDS,
  FUEL_HERO_TIME_SECONDS,
  FUEL_RESPONSE_RADIUS_M,
  FUEL_SHOCK_DURATION_SECONDS,
  FUEL_SHOCK_MAX_RADIUS_M,
  STAGE3_WIND_XZ,
  addVec3,
  clamp01,
  cyclicParticleEnvelope,
  createBallisticFragments,
  createBlastResponseLayout,
  createGroundFires,
  createSmokePuffs,
  createStage3Random,
  sampleBallisticFragment,
  sampleBlastResponse,
  shockArrivalSeconds,
  shockRadiusAt,
  smoothstep01,
} from './effectMath.ts'
export type { BlastResponseLayoutOptions } from './effectMath.ts'
export type { BallisticFragmentDescriptor, BallisticSample, BlastResponseDescriptor, BlastResponseSample, GroundFireDescriptor, SmokePuffDescriptor, Stage3BlastObjectKind, Stage3Vec3 } from './types.ts'
