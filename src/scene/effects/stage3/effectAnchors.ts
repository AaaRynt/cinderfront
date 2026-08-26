import type { Stage3Vec3 } from './types.ts'

import { AMMUNITION_BUNKERS } from '../../world/stage2/stage2Data.ts'
import { getTerrainHeight } from '../../world/stage2/terrainModel.ts'

/** Shared visual anchors for the authored ammunition sequence and its consequences. */
export const AMMUNITION_EFFECT_POSITIONS = AMMUNITION_BUNKERS.map((bunker): Stage3Vec3 => {
  const [x, z] = bunker.center
  return [x, getTerrainHeight(x, z) + 8.2, z]
})

export const AMMUNITION_PRIMARY_EFFECT_POSITION = AMMUNITION_EFFECT_POSITIONS[3]!
