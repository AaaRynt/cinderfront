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

export function createRoadRibbonGeometry(points: readonly WorldPosition[], widthM: number) {
  const geometry = new BufferGeometry()

  if (points.length < 2) {
    return geometry
  }

  const vertices: number[] = []
  const normals: number[] = []
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
    const y = current[1] + 0.18

    vertices.push(current[0] + offsetX, y, current[2] + offsetZ, current[0] - offsetX, y, current[2] - offsetZ)
    normals.push(0, 1, 0, 0, 1, 0)
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
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()

  return geometry
}
