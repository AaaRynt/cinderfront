import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { createDetailGround, type GroundMark } from '../stage8a/detailGround'
import { createDetailPocketPlacements, type DetailPlacement, type DetailPocket } from '../stage8a/detailLayout'

export const RESCUE_APPROACH_BOUNDS = [
  [-142, -51, 5.55, 38],
  [52, 142, 5.55, 38],
] as const

const MARKS: readonly (readonly GroundMark[])[] = [
  [
    [-95, 7.8, 55, 6.9, '#a19781', 0.89],
    [-117, 11.6, 23, 4.8, '#b6a68a', 0.72, 0.06],
    [-73, 10.2, 19, 3.9, '#b0a189', 0.54, -0.1],
    [-105, 17.8, 31, 3.6, '#675c47', 0.67, -0.045],
    [-113, 22.1, 20, 7, '#736950', 0.59, 0.09],
    [-127, 19.5, 13, 2.3, '#b3a68b', 0.45, 0.15],
  ],
  [
    [95, 8.3, 56, 6.7, '#a19781', 0.88],
    [66, 11.9, 13, 5.4, '#a79a7e', 0.73, 0.15],
    [114, 10.7, 23, 4.5, '#b6a78c', 0.63, 0.045],
    [72, 18.5, 17, 3.8, '#72664f', 0.63, -0.21],
    [110, 17.5, 25, 2.8, '#6d624e', 0.67, 0.07],
    [118, 26, 21, 7, '#756b53', 0.54, 0.13],
    [122, 21.8, 10, 2.7, '#b0a084', 0.49, -0.12],
  ],
]

const BANK_TREES: readonly DetailPlacement[] = [
  { id: '8d:rescue:outbound-tree', kind: 'wind', local: [-110.5, 25.7], scale: [7.7, 6.9, 7.4], yaw: 0.85, tint: '#e1e8c2' },
  { id: '8d:rescue:inbound-tree', kind: 'upright', local: [113, 25.3], scale: [7.0, 7.2, 7.5], yaw: -0.18, tint: '#e9edca' },
]

const POCKETS: readonly DetailPocket[] = [
  ['outer-wash-grass', 'grass', -117, 23, 16, 6.2, 23, 0.85, 1.65],
  ['outer-wash-scrub', 'scrub', -110, 25, 16, 7.0, 13, 1.1, 2.5],
  ['outer-wash-stone', 'stone', -119, 17.2, 15, 3.1, 12, 0.54, 2.7],
  ['inner-swale-grass', 'grass', 68, 19.6, 12, 4.2, 18, 0.85, 1.65],
  ['inner-swale-scrub', 'scrub', 73, 21.9, 10, 4.0, 10, 1, 2.3],
  ['inner-swale-stone', 'stone', 67, 17.1, 8, 2.8, 8, 0.47, 1.8],
  ['high-bank-grass', 'grass', 119, 25, 15, 6.6, 24, 0.86, 1.75],
  ['high-bank-scrub', 'scrub', 118, 27, 14, 6.2, 13, 1, 2.55],
  ['high-bank-stone', 'stone', 122, 18.6, 13, 4.0, 12, 0.5, 2.7],
]

function rootSpacing(placement: DetailPlacement) {
  return Math.max(placement.scale[0], placement.scale[2]) * (placement.kind === 'stone' ? 0.7 : 0.47)
}

export function createRescueApproachLayout(): readonly DetailPlacement[] {
  const placements = [...BANK_TREES]
  for (const plant of createDetailPocketPlacements('corridor', '8d:rescue', POCKETS)) {
    const [u, v] = plant.local
    const spacing = rootSpacing(plant) + 0.2
    // Keep an open base around each tree and avoid stacked stones and plants.
    if (placements.every((other) => Math.hypot(u - other.local[0], v - other.local[1]) > spacing + rootSpacing(other))) placements.push(plant)
  }
  return placements
}

export function createRescueShoulder() {
  const sections = RESCUE_APPROACH_BOUNDS.map((bounds, i) => createDetailGround('corridor', bounds, MARKS[i]!))
  const geometry = mergeGeometries(sections)!
  for (const section of sections) section.dispose()
  return geometry
}
