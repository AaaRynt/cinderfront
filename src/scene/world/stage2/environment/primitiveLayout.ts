import { Matrix4, Quaternion, Vector3 } from 'three'

import type { WorldPosition } from '../../worldData.ts'

export type PolylineSample = Readonly<{
  position: WorldPosition
  tangent: WorldPosition
}>

const LOCAL_Y_AXIS = new Vector3(0, 1, 0)

export function matrixBetween(start: WorldPosition, end: WorldPosition, thickness: number) {
  const startVector = new Vector3(...start)
  const endVector = new Vector3(...end)
  const direction = endVector.clone().sub(startVector)
  const length = Math.max(0.001, direction.length())
  const midpoint = startVector.add(endVector).multiplyScalar(0.5)
  const rotation = new Quaternion().setFromUnitVectors(LOCAL_Y_AXIS, direction.normalize())

  return new Matrix4().compose(midpoint, rotation, new Vector3(thickness, length, thickness))
}

export function transformMatrix(position: WorldPosition, scale: WorldPosition, yaw = 0) {
  return new Matrix4().compose(new Vector3(...position), new Quaternion().setFromAxisAngle(LOCAL_Y_AXIS, yaw), new Vector3(...scale))
}

export function samplePolyline(points: readonly WorldPosition[], spacingM: number): readonly PolylineSample[] {
  if (points.length === 0) {
    return []
  }

  if (points.length === 1) {
    return [{ position: points[0]!, tangent: [0, 0, 1] }]
  }

  const segments: Array<Readonly<{ endDistance: number; length: number; startDistance: number }>> = []
  let totalLength = 0

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]!
    const end = points[index + 1]!
    const length = Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2])
    segments.push({ endDistance: totalLength + length, length, startDistance: totalLength })
    totalLength += length
  }

  if (totalLength === 0) {
    return [{ position: points[0]!, tangent: [0, 0, 1] }]
  }

  const samples: PolylineSample[] = []
  const spacing = Math.max(0.25, spacingM)

  for (let distance = 0; distance < totalLength; distance += spacing) {
    const segmentIndex = segments.findIndex((segment) => distance <= segment.endDistance)
    const resolvedIndex = segmentIndex === -1 ? segments.length - 1 : segmentIndex
    const segment = segments[resolvedIndex]!
    const start = points[resolvedIndex]!
    const end = points[resolvedIndex + 1]!
    const alpha = segment.length === 0 ? 0 : (distance - segment.startDistance) / segment.length
    const tangentLength = segment.length || 1

    samples.push({
      position: [start[0] + (end[0] - start[0]) * alpha, start[1] + (end[1] - start[1]) * alpha, start[2] + (end[2] - start[2]) * alpha],
      tangent: [(end[0] - start[0]) / tangentLength, (end[1] - start[1]) / tangentLength, (end[2] - start[2]) / tangentLength],
    })
  }

  const last = points.at(-1)!
  const penultimate = points.at(-2)!
  const finalLength = Math.hypot(last[0] - penultimate[0], last[1] - penultimate[1], last[2] - penultimate[2]) || 1
  samples.push({
    position: last,
    tangent: [(last[0] - penultimate[0]) / finalLength, (last[1] - penultimate[1]) / finalLength, (last[2] - penultimate[2]) / finalLength],
  })

  return samples
}

export function offsetPolyline(points: readonly WorldPosition[], offsetM: number): readonly WorldPosition[] {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)] ?? point
    const next = points[Math.min(points.length - 1, index + 1)] ?? point
    const tangentX = next[0] - previous[0]
    const tangentZ = next[2] - previous[2]
    const length = Math.hypot(tangentX, tangentZ) || 1
    return [point[0] - (tangentZ / length) * offsetM, point[1], point[2] + (tangentX / length) * offsetM]
  })
}
