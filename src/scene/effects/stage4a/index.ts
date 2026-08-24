export { Stage4AFuelDisaster } from './Stage4AFuelDisaster.tsx'
export type { Stage4AFuelDisasterProps } from './Stage4AFuelDisaster.tsx'
export {
  STAGE4A_FUEL_ESCALATION_SCHEDULE,
  STAGE4A_FUEL_HERO_TIME_SECONDS,
  STAGE4A_FUEL_MAX_POOL_FIRE_RADIUS_M,
  STAGE4A_FUEL_POOL_FIRE_COUNT,
  STAGE4A_FUEL_POOL_FIRE_SCHEDULE,
  createStage4AFuelDebris,
  createStage4AFuelPoolFires,
  createStage4ASmokePuffs,
  deriveStage4AFuelDisasterState,
  resolveStage4AFuelEventPosition,
  sampleStage4AFuelBurst,
  sampleStage4AFuelFireIntensity,
} from './fuelDisasterMath.ts'
export type { Stage4AFuelBurstSample, Stage4AFuelDisasterState, Stage4AFuelEventDescriptor, Stage4AFuelEventKind, Stage4AFuelEventState, Stage4AFuelPhase, Stage4AFuelPoolFireDescriptor, Stage4ASmokeLayer, Stage4ASmokePuffDescriptor } from './fuelDisasterMath.ts'
