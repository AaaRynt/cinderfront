import type { WorldPosition, XZPoint } from '../worldData'

import { createDeterministicRandom } from '../stage2/environment/seededLayout'
import { REGION_BOUNDARIES, TERRAIN_STAGE2_POLYGONS } from '../stage2/stage2Data'
import { getTerrainHeight, pointInPolygon } from '../stage2/terrainModel'
import { isDecorationAllowed } from './spatialReservations'

export type Region = 'harbor' | 'industrial' | 'radar' | 'corridor' | 'beach'
export type CoverKind = 'grass' | 'scrub' | 'rock'
export interface CoverInstance {
  readonly id: string
  readonly region: Region
  readonly kind: CoverKind
  readonly variant: number
  readonly position: WorldPosition
  readonly scale: WorldPosition
  readonly yaw: number
  readonly colorMix: number
  readonly footprintRadius: number
}
export const REGIONAL_BOUNDS: Record<Region, readonly XZPoint[]> = {
  harbor: REGION_BOUNDARIES.harborDistrict,
  industrial: REGION_BOUNDARIES.storageDistrict,
  radar: REGION_BOUNDARIES.radarHill,
  corridor: TERRAIN_STAGE2_POLYGONS.easternPlain,
  beach: REGION_BOUNDARIES.remoteBeachhead,
}
// Pockets follow ridge scarps, wash banks and sheltered dunes. Operational
// ground is rejected separately, so denser pockets retain wide bare intervals.
const POCKETS: Record<Region, readonly (readonly [x: number, z: number, radius: number])[]> = {
  radar: [
    [2630, 2930, 220],
    [2720, 4030, 260],
    [3240, 4560, 230],
    [4040, 2810, 220],
    [4970, 3710, 190],
    [3890, 3750, 150],
    [4760, 4500, 180],
  ],
  corridor: [
    [1180, 820, 100],
    [1450, 710, 110],
    [1690, 850, 110],
    [1400, 1480, 120],
    [1900, 800, 170],
    [2180, 640, 160],
    [2430, 140, 180],
    [2940, 500, 220],
    [3550, 360, 130],
    [3740, 900, 180],
    [4480, 1360, 180],
    [3350, -820, 190],
    [4200, -650, 140],
    [4920, -1350, 190],
    [5750, -900, 170],
    [6350, 180, 110],
  ],
  beach: [
    [3530, -2510, 110],
    [3880, -2770, 140],
    [4350, -2520, 90],
    [5590, -2610, 100],
    [5870, -2770, 120],
    [6240, -2860, 130],
    [3140, -2750, 85],
  ],
  harbor: [
    [-4540, 4330, 75],
    [-4400, 4590, 100],
    [-4490, 2690, 75],
    [-2450, 2850, 70],
  ],
  industrial: [
    [-1650, 2900, 65],
    [-1520, 1560, 60],
    [550, 3120, 90],
    [2830, 2060, 70],
    [660, 1820, 70],
  ],
}
const COUNTS: Record<Region, readonly [grass: number, scrub: number, rocks: number]> = {
  radar: [640, 160, 110],
  corridor: [1100, 230, 75],
  beach: [780, 120, 60],
  harbor: [110, 25, 8],
  industrial: [120, 28, 8],
}

export function createRegionalLayout(seed = 'ash-harbor-stage4c'): readonly CoverInstance[] {
  const layout: CoverInstance[] = []
  for (const region of Object.keys(POCKETS) as Region[]) {
    for (const [kindIndex, kind] of (['grass', 'scrub', 'rock'] as const).entries()) {
      const random = createDeterministicRandom(`${seed}:${region}:${kind}`)
      const count = COUNTS[region][kindIndex]!
      let accepted = 0
      for (let attempt = 0; accepted < count && attempt < count * 80; attempt++) {
        const pocket = POCKETS[region][Math.floor(random() * POCKETS[region].length)]!
        const angle = random() * Math.PI * 2
        const distance = Math.sqrt(random()) * pocket[2]
        const x = pocket[0] + Math.cos(angle) * distance
        const z = pocket[1] + Math.sin(angle) * distance * 0.62
        const width = kind === 'rock' ? (region === 'radar' ? 9 : 4) + random() * (region === 'radar' ? 20 : 9) : kind === 'scrub' ? 2.5 + random() * 4.8 : 2 + random() * 4
        const depth = width * (0.55 + random() * 0.35)
        const height = kind === 'rock' ? width * (0.18 + random() * 0.18) : kind === 'scrub' ? 0.7 + random() * 1.35 : 0.5 + random() * 0.8
        const radius = Math.hypot(width, depth) / 2
        if (!pointInPolygon(x, z, REGIONAL_BOUNDS[region]) || !isDecorationAllowed(x, z, radius)) continue
        layout.push({
          id: `4c:${region}:${kind}:${accepted}`,
          region,
          kind,
          variant: accepted % 2,
          position: [x, getTerrainHeight(x, z), z],
          scale: [width, height, depth],
          yaw: random() * Math.PI * 2,
          colorMix: random(),
          footprintRadius: radius,
        })
        accepted++
      }
      if (accepted !== count) throw new Error(`Stage 4C ${region}/${kind}: insufficient clear ground (${accepted}/${count})`)
    }
  }
  return layout
}
