import { Float32BufferAttribute } from 'three'

import type { Vector3 } from '@/simulation'

import { createTerrainSurfaceGeometry } from '../world/stage2/terrainGeometry'
import { getTerrainHeight } from '../world/stage2/terrainModel'

/** Clipped triangles share terrain-cell diagonals, including their interiors. */
export function createSecondaryPantsirScorch(ground: Vector3, yaw: number) {
  const halfWidth = 4.7
  const halfLength = 6.5
  const cosine = Math.cos(yaw)
  const sine = Math.sin(yaw)
  const points = Array.from({ length: 32 }, (_, index): readonly [number, number] => {
    const angle = (index * Math.PI * 2) / 32
    const localX = Math.cos(angle) * halfWidth
    const localZ = Math.sin(angle) * halfLength
    return [ground.x + cosine * localX + sine * localZ, ground.z - sine * localX + cosine * localZ]
  })
  const clearance = ground.y - getTerrainHeight(ground.x, ground.z) + 0.035
  const geometry = createTerrainSurfaceGeometry(points, clearance)
  const position = geometry.getAttribute('position')
  const uvs: number[] = []
  for (let index = 0; index < position.count; index += 1) {
    const dx = position.getX(index) - ground.x
    const dz = position.getZ(index) - ground.z
    uvs.push(0.5 + (cosine * dx - sine * dz) / (halfWidth * 2), 0.5 + (sine * dx + cosine * dz) / (halfLength * 2))
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  return geometry
}
