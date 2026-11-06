import { Matrix4, Quaternion, Vector3, type BufferGeometry } from 'three'

import type { XZPoint } from '../worldData'

import { fitLandscapeBase } from '../landscape/groundFit'
import { createDeterministicRandom } from '../stage2/environment/seededLayout'
import { BEACH_FEATURES } from '../stage2/stage2Data'
import { TERRAIN_SURFACE_SPECS } from '../stage2/terrainPresentationSpecs'

// The beach sample lies entirely on the mounted east dune veneer, beyond
// the contact-grade and raised road. Its top is above the mainland sampler.
const eastDuneTop = TERRAIN_SURFACE_SPECS.find((surface) => surface.points === BEACH_FEATURES.duneEast)!.offset
export const DETAIL_SITES = {
  corridor: { origin: [4370, 212], heading: Math.atan2(350, 1000), bounds: [-51, 52, 5.5, 49], surfaceOffset: 0 },
  beach: { origin: [5574, -2648], heading: Math.atan2(4, 3), bounds: [-24, 20, 5, 31], surfaceOffset: eastDuneTop },
} as const

export type DetailSite = keyof typeof DETAIL_SITES
export type DetailKind = 'grass' | 'scrub' | 'stone' | 'gravel' | 'upright' | 'wind' | 'shelter' | 'drum' | 'tire' | 'wash-sign' | 'route-sign' | 'remnant'
type Scale = readonly [number, number, number]
export interface DetailPlacement {
  readonly id: string
  readonly kind: DetailKind
  readonly local: XZPoint
  readonly scale: Scale
  readonly yaw: number
  readonly tint: string
}

export function detailXZ(site: DetailSite, [along, out]: XZPoint): XZPoint {
  const { origin, heading } = DETAIL_SITES[site]
  const cos = Math.cos(heading)
  const sin = Math.sin(heading)
  return [origin[0] + along * cos - out * sin, origin[1] + along * sin + out * cos]
}

export function fitDetailPlacement(geometry: BufferGeometry, site: DetailSite, placement: DetailPlacement) {
  const [x, z] = detailXZ(site, placement.local)
  const base = new Matrix4().compose(new Vector3(x, 0, z), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), placement.yaw - DETAIL_SITES[site].heading), new Vector3(...placement.scale))
  const { matrix } = fitLandscapeBase(geometry, base, placement.kind === 'gravel' ? 0.008 : 0.035)
  matrix.elements[13]! += DETAIL_SITES[site].surfaceOffset
  return matrix
}

type FixedDetail = readonly [id: string, kind: DetailKind, along: number, out: number, yaw: number, scale?: Scale, tint?: string]
const PROPS: Record<DetailSite, readonly FixedDetail[]> = {
  corridor: [
    ['inspection-bay', 'shelter', -2.4, 23, 0.08],
    ['wash-crossing', 'wash-sign', 12.4, 14.7, -0.12],
    ['oil-stock-a', 'drum', -8.9, 21.1, 0.3, [1, 1, 1], '#b59d84'],
    ['oil-stock-b', 'drum', -9.57, 21.42, 2.4, [1, 0.97, 1], '#91a49c'],
    ['oil-stock-c', 'drum', -9.32, 22.13, -0.8, [1, 0.93, 1], '#bf9880'],
    ['retired-tire-a', 'tire', -8.34, 19.85, 0.3],
    ['retired-tire-b', 'tire', -9.32, 19.5, -0.23, [0.85, 0.91, 0.85]],
    ['retired-tire-c', 'tire', 3.36, 24.8, 0.1, [0.92, 0.9, 0.92]],
    ['bay-shade', 'upright', -13.8, 31, 0.72, [7.8, 6.8, 7.6], '#e8efcb'],
    ['wash-bank', 'wind', -30.5, 25.5, 1.8, [7.1, 5.8, 7], '#e1eacb'],
    ['outer-bank', 'wind', 23, 33.4, -0.52, [8.6, 7.4, 6.7], '#e3e6c6'],
  ],
  beach: [
    ['east-route-marker', 'route-sign', -1.9, 14.4, 0.22],
    ['buried-service-footing', 'remnant', 3.8, 20.4, 0.14],
    ['lee-saltbush-a', 'scrub', -13, 16.5, 0.65, [1.85, 1.08, 1.63], '#9eab8d'],
    ['lee-saltbush-b', 'scrub', -17, 20.5, -1.31, [1.58, 0.89, 1.43], '#afbb9b'],
  ],
}

type Pocket = readonly [id: string, kind: 'grass' | 'scrub' | 'stone' | 'gravel', along: number, out: number, halfLength: number, halfWidth: number, count: number, minScale: number, maxScale: number]
const POCKETS: Record<DetailSite, readonly Pocket[]> = {
  corridor: [
    ['wash-grass', 'grass', -31, 20.5, 13, 5.2, 29, 0.75, 1.52],
    ['wash-scrub', 'scrub', -30, 27, 12, 5.1, 16, 0.92, 2.35],
    ['wash-stone', 'stone', -32, 17.6, 10, 3.6, 12, 0.23, 1.45],
    ['bay-edge-grass', 'grass', -12.4, 23, 2.4, 5.5, 15, 0.66, 1.45],
    ['rear-grass', 'grass', -1.7, 30, 11.8, 3.6, 18, 0.76, 1.46],
    ['rear-scrub', 'scrub', -6, 35, 10.4, 5, 14, 0.8, 2.15],
    ['entrance-gravel', 'gravel', 7, 15.3, 8, 1.7, 26, 0.12, 0.36],
    ['east-shoulder', 'grass', 29, 17, 12.1, 3.9, 24, 0.55, 1.34],
    ['east-bank-grass', 'grass', 29, 31, 14, 5, 19, 0.8, 1.5],
    ['east-bank-scrub', 'scrub', 30, 31, 10, 6.2, 15, 1, 2.35],
    ['east-bank-stone', 'stone', 28.5, 23, 10, 4, 13, 0.29, 1.5],
  ],
  beach: [
    ['lower-lee-grass', 'grass', -15.1, 17.9, 4.1, 2.5, 16, 0.55, 1.34],
    ['lower-lee-scrub', 'scrub', -15.1, 22.4, 3.4, 3.5, 9, 0.6, 1.55],
    ['marker-gravel', 'gravel', -1, 13.65, 7.3, 0.65, 21, 0.09, 0.35],
    ['marker-grass', 'grass', 0, 17.6, 3.6, 1.55, 12, 0.55, 0.96],
    ['footing-grass', 'grass', 0.4, 24.6, 6, 2.5, 19, 0.61, 1.42],
    ['footing-scrub', 'scrub', 2.5, 25.1, 5.8, 2.8, 12, 0.65, 1.64],
    ['upper-lee-grass', 'grass', 12.5, 26.9, 5.8, 2.6, 16, 0.7, 1.25],
    ['upper-lee-scrub', 'scrub', 13, 25.6, 5.5, 3.2, 8, 0.77, 1.51],
    ['shell-gravel', 'gravel', 7, 14.1, 7.6, 1.4, 15, 0.12, 0.4],
  ],
}

const TINTS = {
  corridor: { grass: ['#c7aa78', '#e0bf8e', '#ded19c'], scrub: ['#a3b38a', '#aeb384', '#8d9f7d'], stone: ['#af9f87', '#c8ba9f', '#978c76'] },
  beach: { grass: ['#e9d9ab', '#d1c89b', '#d9c68e'], scrub: ['#a0ac99', '#9cae9e', '#bec7a8'], stone: ['#d9ccb3', '#beb2a0', '#d0c3a7'] },
} as const

export function createDetailLayout(site: DetailSite): readonly DetailPlacement[] {
  const props: DetailPlacement[] = PROPS[site].map(([id, kind, u, v, yaw, scale = [1, 1, 1], tint = '#ffffff']) => ({ id: `8a:${site}:${id}`, kind, local: [u, v], yaw, scale, tint }))
  return [
    ...props,
    ...POCKETS[site].flatMap(([id, kind, u, v, halfLength, halfWidth, count, minScale, maxScale]) => {
      const random = createDeterministicRandom(`8a:${site}:${id}`)
      const palette = TINTS[site][kind === 'gravel' ? 'stone' : kind]
      const heightScale = kind === 'gravel' ? 0.54 : kind === 'stone' ? 0.43 : site === 'beach' ? 0.69 : 1
      return Array.from({ length: count }, (_, index): DetailPlacement => {
        const angle = random() * Math.PI * 2
        const radius = Math.sqrt(random())
        const scale = minScale + random() * (maxScale - minScale)
        return {
          id: `8a:${site}:${id}:${index}`,
          kind,
          local: [u + Math.cos(angle) * radius * halfLength, v + Math.sin(angle) * radius * halfWidth],
          yaw: random() * Math.PI * 2,
          scale: [scale * (0.88 + random() * 0.44), scale * heightScale, scale],
          tint: palette[Math.floor(random() * palette.length)]!,
        }
      })
    }),
  ]
}
