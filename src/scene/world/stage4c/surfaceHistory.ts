import { BufferGeometry, Float32BufferAttribute } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import type { XZPoint } from '../worldData'

import { HARBOR_FEATURES, ROAD_DEFINITIONS } from '../stage2/stage2Data'
import { BEACH_FEATURES } from '../stage2/stage2Data'
import { createTerrainSurfaceGeometry } from '../stage2/terrainGeometry'
import { DAMAGE_RESERVATIONS, FUTURE_LCAC_APPROACHES, FUTURE_LAV_CONNECTORS, intersectsReservation, reservePath, reservePolygon } from './spatialReservations'

export type WearKind = 'repair' | 'gravel' | 'runoff' | 'tire' | 'salt'
export interface WearPatch {
  readonly id: string
  readonly kind: WearKind
  readonly points: readonly XZPoint[]
  readonly clearance: number
  readonly flatY?: number
  readonly hideAtSeconds?: number
}
export function orientedPatch(x: number, z: number, width: number, length: number, yaw: number): readonly XZPoint[] {
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sz]) => {
    const localX = (sx! * width) / 2
    const localZ = (sz! * length) / 2
    return [x + Math.cos(yaw) * localX + Math.sin(yaw) * localZ, z - Math.sin(yaw) * localX + Math.cos(yaw) * localZ] as XZPoint
  })
}

export function createSurfaceHistory(): readonly WearPatch[] {
  const patches: WearPatch[] = []
  const add = (id: string, kind: WearKind, x: number, z: number, width: number, length: number, yaw: number, clearance: number) => {
    const radius = Math.hypot(width, length) / 2
    const reserved = [...DAMAGE_RESERVATIONS, reservePolygon('future-apron', BEACH_FEATURES.exitApron, 8), reservePolygon('future-hardstand', BEACH_FEATURES.inlandHardstand, 8), ...FUTURE_LCAC_APPROACHES.map((p) => reservePath('future-lcac', p, 20)), ...FUTURE_LAV_CONNECTORS.map((p) => reservePath('future-lav', p, 9))]
    if (reserved.some((r) => intersectsReservation(x, z, radius, r))) return
    patches.push({ id, kind, points: orientedPatch(x, z, width, length, yaw), clearance })
  }
  for (const road of ROAD_DEFINITIONS.filter((r) => ['road_eastern_trunk', 'road_rescue_branch', 'road_harbor_local_loop', 'road_ridge_access'].includes(r.id))) {
    road.points.slice(1).forEach((end, index) => {
      const start = road.points[index]!
      const dx = end[0] - start[0],
        dz = end[1] - start[1]
      const length = Math.hypot(dx, dz),
        nx = dz / length,
        nz = -dx / length
      const yaw = Math.atan2(dx, dz)
      for (const progress of [0.2, 0.46, 0.75]) {
        const x = start[0] + dx * progress,
          z = start[1] + dz * progress
        add(`${road.id}:${index}:${progress}:repair`, 'repair', x, z, road.widthM * 0.72, 11 + (index % 3) * 4, yaw, 0.498)
        for (const side of [-1, 1]) {
          add(`${road.id}:${index}:${progress}:shoulder:${side}`, 'gravel', x + nx * side * (road.widthM / 2 + 2.5), z + nz * side * (road.widthM / 2 + 2.5), 4.2, 75, yaw, 0.025)
          add(`${road.id}:${index}:${progress}:tire:${side}`, 'tire', x + nx * side * 1.1, z + nz * side * 1.1, 0.65, 42, yaw, 0.505)
        }
      }
    })
  }
  // Ground clearances match the existing district surface at each authored patch.
  for (const [x, z, clearance, yaw] of [
    [-4180, 4240, 0.26, 0.18],
    [-3150, 4410, 0.26, 0.18],
    [725, 1630, 0.022, 0],
    [2070, 1360, 0.26, Math.PI / 2],
    [5810, 150, 0.37, Math.PI / 2],
    [5830, 325, 0.37, 0],
    [4060, 3690, 0.022, 0.5],
    [3500, -2780, 0.022, 0.12],
  ]) {
    add(`maintenance-${x}:${z}`, 'runoff', x!, z!, 9, 31, yaw!, clearance!)
    add(`compacted-${x}:${z}`, 'gravel', x! + 14, z!, 17, 32, yaw!, clearance!)
  }
  // Flat pier decks retain their original 3.1 m elevation. Salt deposits are
  // contact wear on the quay edge, never a surf band in the navigation channel.
  for (const pier of HARBOR_FEATURES.piers) {
    const [a, b] = pier.points
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dx, dz)
    for (let i = 0; i < 9; i++) {
      const p = (i + 0.5) / 9
      patches.push({ id: `${pier.id}:salt:${i}`, kind: 'salt', points: orientedPatch(a[0] + dx * p + (dz / length) * 2, a[1] + dz * p - (dx / length) * 2, 3.4, length / 13, Math.atan2(dx, dz)), clearance: 0, flatY: 3.12 })
    }
  }
  // Dust and old loading wear predate the cookoff. Suppress these patches
  // exactly at the primary detonation; permanent scorch/debris then own it.
  patches.push(
    { id: 'ammo-loading-dust-west', kind: 'gravel', points: orientedPatch(1570, 1380, 105, 58, 0.08), clearance: 0.345, hideAtSeconds: 132 },
    { id: 'ammo-loading-dust-east', kind: 'gravel', points: orientedPatch(1980, 1380, 90, 62, -0.06), clearance: 0.345, hideAtSeconds: 132 },
    { id: 'ammo-loading-old-repair', kind: 'repair', points: orientedPatch(1870, 1505, 24, 38, Math.PI / 2), clearance: 0.345, hideAtSeconds: 132 },
    { id: 'pump-old-oil-contact', kind: 'runoff', points: orientedPatch(470, 1580, 10, 27, 0), clearance: 0.325, hideAtSeconds: 97.6 },
    { id: 'transfer-old-runoff', kind: 'runoff', points: orientedPatch(445, 1950, 12, 30, 0), clearance: 0.325, hideAtSeconds: 97.6 },
  )
  return patches
}

/** Merge draped triangles by material; UVs follow the original patch, so edges
 * feather after clipping to the exact terrain grid rather than floating above it. */
export function createWearGeometry(patches: readonly WearPatch[]): BufferGeometry {
  const parts = patches.map((patch) => {
    const geometry = createTerrainSurfaceGeometry(patch.points, patch.clearance)
    const positions = geometry.getAttribute('position')
    const [a, b, , d] = patch.points
    const bx = b![0] - a![0],
      bz = b![1] - a![1],
      dx = d![0] - a![0],
      dz = d![1] - a![1]
    const uv: number[] = []
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i) - a![0],
        z = positions.getZ(i) - a![1]
      uv.push((x * bx + z * bz) / (bx * bx + bz * bz), (x * dx + z * dz) / (dx * dx + dz * dz))
      if (patch.flatY !== undefined) positions.setY(i, patch.flatY)
    }
    if (patch.flatY !== undefined) geometry.computeVertexNormals()
    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
    geometry.setAttribute(
      'wearHideAt',
      new Float32BufferAttribute(
        Array.from({ length: positions.count }, () => patch.hideAtSeconds ?? 1000),
        1,
      ),
    )
    return geometry
  })
  const merged = mergeGeometries(parts) ?? new BufferGeometry()
  parts.forEach((p) => p.dispose())
  merged.computeBoundingSphere()
  return merged
}
