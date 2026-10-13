import type { XZPoint } from '../scene/world/worldData'

export const LCAC_IDS = ['attacker_lcac_01', 'attacker_lcac_02'] as const
export const LAV_IDS = ['attacker_lav_01', 'attacker_lav_02', 'attacker_lav_03', 'attacker_lav_04', 'attacker_lav_05', 'attacker_lav_06', 'attacker_lav_07', 'attacker_lav_08'] as const
export const LAV_GROUP_IDS = ['attacker_lav_group_01', 'attacker_lav_group_02'] as const
export const LCAC_DIMENSIONS = { length: 26.4, width: 14.3, height: 7.2, deckLength: 20.4, deckWidth: 8.2 } as const
export const LAV_DIMENSIONS = { hullLength: 6.39, hullWidth: 2.5, height: 2.69, wheelRadius: 0.49, wheelWidth: 0.32, wheelCentersX: 1.3, axleZ: [-2.12, -0.8, 0.72, 2.06] } as const
export const LCAC_DECK_HEIGHT = 1.75
export const LCAC_SETTLED_DECK_HEIGHT = 1.2
export const LCAC_RAMP = { hingeZ: -10.08, length: 6, width: 8.2, thickness: 0.12, closedAngle: Math.PI / 3 } as const
export const LCAC_CARGO_CENTERS = [
  [-1.8, -4],
  [1.8, -4],
  [-1.8, 4],
  [1.8, 4],
] as const

// Rounded perimeter shared by the visible flexible skirt and contact sampler.
export const LCAC_SKIRT_PERIMETER: readonly XZPoint[] = Array.from({ length: 4 }, (_, corner) => {
  const centers: XZPoint[] = [
    [6.05, 12.1],
    [-6.05, 12.1],
    [-6.05, -12.1],
    [6.05, -12.1],
  ]
  const center = centers[corner]!
  const arc = Array.from({ length: 9 }, (_, i): XZPoint => {
    const angle = (corner * Math.PI) / 2 + (i * Math.PI) / 16
    return [center[0] + 1.1 * Math.cos(angle), center[1] + 1.1 * Math.sin(angle)]
  })
  return corner === 2 ? [...arc, [-4.1, -13.2] as XZPoint, [4.1, -13.2] as XZPoint] : arc
}).flat()
