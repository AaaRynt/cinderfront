import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Shape } from 'three'

import type { WorldPosition, XZPoint } from './worldData.ts'

function shapeFromXZ(points: readonly XZPoint[]) {
  const shape = new Shape()
  const [first, ...rest] = points

  if (!first) {
    return shape
  }

  // The inverted shape Y combined with the -90 degree X rotation preserves
  // the authoritative x/east, z/north plan coordinates and upward normals.
  shape.moveTo(first[0], -first[1])
  for (const [x, z] of rest) {
    shape.lineTo(x, -z)
  }
  shape.closePath()

  return shape
}

export function createPolygonPrismGeometry(points: readonly XZPoint[], bottomY: number, topY: number) {
  const geometry = new ExtrudeGeometry(shapeFromXZ(points), {
    bevelEnabled: false,
    curveSegments: 1,
    depth: Math.max(0.05, topY - bottomY),
    steps: 1,
  })

  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, bottomY, 0)
  geometry.computeBoundingSphere()

  return geometry
}

export function createPolygonSurfaceGeometry(points: readonly XZPoint[], y: number) {
  return createPolygonPrismGeometry(points, y - 0.08, y)
}

export function createRoadRibbonGeometry(points: readonly WorldPosition[], widthM: number, surfaceHeightAt?: (x: number, z: number) => number) {
  const geometry = new BufferGeometry()

  if (points.length < 2) {
    return geometry
  }

  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const halfWidth = widthM / 2

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index]!
    const previous = points[Math.max(0, index - 1)]!
    const next = points[Math.min(points.length - 1, index + 1)]!
    const tangentX = next[0] - previous[0]
    const tangentZ = next[2] - previous[2]
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1
    const offsetX = (-tangentZ / tangentLength) * halfWidth
    const offsetZ = (tangentX / tangentLength) * halfWidth
    const leftX = current[0] + offsetX
    const leftZ = current[2] + offsetZ
    const rightX = current[0] - offsetX
    const rightZ = current[2] - offsetZ
    const centerTerrainY = surfaceHeightAt?.(current[0], current[2])
    const clearanceM = centerTerrainY === undefined ? 0.18 : current[1] - centerTerrainY + 0.18
    const leftY = surfaceHeightAt ? surfaceHeightAt(leftX, leftZ) + clearanceM : current[1] + 0.18
    const rightY = surfaceHeightAt ? surfaceHeightAt(rightX, rightZ) + clearanceM : current[1] + 0.18

    vertices.push(leftX, leftY, leftZ, rightX, rightY, rightZ)
    uvs.push(0, index, 1, index)

    if (index < points.length - 1) {
      const left = index * 2
      const right = left + 1
      const nextLeft = left + 2
      const nextRight = left + 3
      indices.push(left, nextLeft, right, right, nextLeft, nextRight)
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  return geometry
}
