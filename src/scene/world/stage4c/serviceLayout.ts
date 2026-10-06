import type { Matrix4 } from 'three'

import type { WorldPosition } from '../worldData'

import { transformMatrix } from '../stage2/environment/primitiveLayout'
import { getTerrainHeight } from '../stage2/terrainModel'
import { isDecorationAllowed } from './spatialReservations'

export const SERVICE_CLUSTERS = [
  { id: 'harbor-cable-storage', x: -4190, z: 4250, clearance: 0.24, kind: 'cargo' },
  { id: 'pump-service-spares', x: 735, z: 1630, clearance: 0, kind: 'pipe' },
  { id: 'yard-stowed-recovery', x: 5820, z: 145, clearance: 0.35, kind: 'recovery' },
  { id: 'radar-power-maintenance', x: 4050, z: 3690, clearance: 0, kind: 'power' },
  { id: 'beach-stored-remnants', x: 3530, z: -2790, clearance: 0, kind: 'remains' },
] as const

export type Family = 'steelBox' | 'timberBox' | 'concreteBox' | 'reel' | 'hose' | 'pipe'
export function createServiceEquipmentLayout(): Record<Family, readonly Matrix4[]> {
  const pools: Record<Family, Matrix4[]> = { steelBox: [], timberBox: [], concreteBox: [], reel: [], hose: [], pipe: [] }
  for (const cluster of SERVICE_CLUSTERS) {
    if (!isDecorationAllowed(cluster.x, cluster.z, 17, 'equipment')) throw new Error(`Obstructed Stage 4C service cluster: ${cluster.id}`)
    const part = (family: Family, x: number, z: number, size: WorldPosition, elevation = 0, yaw = 0) => {
      const wx = cluster.x + x,
        wz = cluster.z + z
      const y = getTerrainHeight(wx, wz) + cluster.clearance + size[1] / 2 + elevation
      const matrix = transformMatrix([wx, y, wz], size, yaw)
      pools[family].push(matrix)
    }
    // Existing utility-box and pallet vocabulary, combined into shared pools.
    part('steelBox', -4, 2, [3.2, 2.7, 2.4])
    part('steelBox', -4, 3.23, [2.2, 1.6, 0.06], 0.55)
    part('concreteBox', -4, 2, [3.8, 0.2, 3])
    for (let i = 0; i < 5; i++) part('timberBox', 3 + i * 0.56, -2, [0.45, 0.18, 3.8])
    part('timberBox', 4.1, -2, [3.3, 0.16, 0.34], 0.2)
    for (let i = 0; i < 3; i++) {
      if (cluster.kind === 'pipe') part('pipe', 4, 3 + i * 2.1, [1.6, 1.6, 8], 0, Math.PI / 2)
      else if (cluster.kind === 'cargo') part('steelBox', 3 + i * 2.6, 5, [2.4, 2.1 + i * 0.1, 2.4])
      else if (cluster.kind === 'remains') part('concreteBox', 2 + i * 2.4, 5, [2, 0.45, 3.4], 0, i * 0.14)
      else part('steelBox', 2 + i * 2.2, 5, [1.7, 0.85, 2.5])
    }
    // Cable/hose spool with two end plates and a dark wound centre; tire stacks
    // and folded tow beams identify the maintenance yard without parked actors.
    for (const x of [-7, -3]) {
      part('reel', x, -5, [2.4, 0.25, 2.4], 0)
      part('reel', x, -5, [2.4, 0.25, 2.4], 1.2)
      part('reel', x, -5, [1.6, 1.2, 1.6], 0.15)
      part('hose', x, -5, [1, 1, 1], 0.2)
    }
    if (cluster.kind === 'recovery') {
      // The horizontal torus is 0.48 high before scaling, so seat its lower
      // side on the yard rather than using the box-family half-height.
      for (let i = 0; i < 4; i++) part('hose', 6, -5, [0.7, 0.7, 0.7], i * 0.3 - 0.182)
      part('steelBox', 1, -6, [6, 0.5, 0.5])
      part('steelBox', 3, -7, [5.2, 0.45, 0.45], 0, 0.3)
    }
  }
  return pools
}
