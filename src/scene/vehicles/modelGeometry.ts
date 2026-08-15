import * as THREE from 'three'

export type PlanformPoint = readonly [x: number, z: number]

export interface BodySection {
  z: number
  halfWidth: number
  halfHeight: number
  centerY?: number
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/** Creates a low-poly horizontal prism from a convex X/Z planform. */
export function createPrismGeometryXZ(sourcePoints: readonly PlanformPoint[], height: number, centerY = 0): THREE.BufferGeometry {
  const signedArea = sourcePoints.reduce((area, point, index) => {
    const next = sourcePoints[(index + 1) % sourcePoints.length]
    return area + point[0] * next[1] - next[0] * point[1]
  }, 0)
  const points = signedArea < 0 ? [...sourcePoints].reverse() : [...sourcePoints]
  const halfHeight = height / 2
  const positions: number[] = []

  for (const [x, z] of points) positions.push(x, centerY - halfHeight, z)
  for (const [x, z] of points) positions.push(x, centerY + halfHeight, z)

  const count = points.length
  const indices: number[] = []

  for (let index = 1; index < count - 1; index += 1) {
    indices.push(0, index, index + 1)
    indices.push(count, count + index + 1, count + index)
  }

  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count
    indices.push(index, count + index, count + next)
    indices.push(index, count + next, next)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

/** Creates a faceted body aligned to the local Z axis from elliptical sections. */
export function createSectionedBodyGeometry(sections: readonly BodySection[], radialSegments = 8): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []

  for (const section of sections) {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = (segment / radialSegments) * Math.PI * 2
      positions.push(Math.cos(angle) * section.halfWidth, (section.centerY ?? 0) + Math.sin(angle) * section.halfHeight, section.z)
    }
  }

  for (let sectionIndex = 0; sectionIndex < sections.length - 1; sectionIndex += 1) {
    const ringStart = sectionIndex * radialSegments
    const nextRingStart = (sectionIndex + 1) * radialSegments
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const nextSegment = (segment + 1) % radialSegments
      const a = ringStart + segment
      const b = ringStart + nextSegment
      const c = nextRingStart + nextSegment
      const d = nextRingStart + segment
      indices.push(a, b, d, b, c, d)
    }
  }

  const frontCenter = positions.length / 3
  const first = sections[0]
  positions.push(0, first.centerY ?? 0, first.z)
  const rearCenter = positions.length / 3
  const last = sections[sections.length - 1]
  positions.push(0, last.centerY ?? 0, last.z)

  const rearRingStart = (sections.length - 1) * radialSegments
  for (let segment = 0; segment < radialSegments; segment += 1) {
    const next = (segment + 1) % radialSegments
    indices.push(frontCenter, next, segment)
    indices.push(rearCenter, rearRingStart + segment, rearRingStart + next)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
