import type { Pose3, Vector3 } from './types'

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount
}

export function inverseLerp(start: number, end: number, value: number): number {
  if (start === end) return value >= end ? 1 : 0
  return clamp((value - start) / (end - start), 0, 1)
}

export function smoothstep(start: number, end: number, value: number): number {
  const amount = inverseLerp(start, end, value)
  return amount * amount * (3 - 2 * amount)
}

export function lerpVector3(start: Vector3, end: Vector3, amount: number): Vector3 {
  return {
    x: lerp(start.x, end.x, amount),
    y: lerp(start.y, end.y, amount),
    z: lerp(start.z, end.z, amount),
  }
}

export function distanceVector3(start: Vector3, end: Vector3): number {
  return Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z)
}

export function addVector3(left: Vector3, right: Vector3): Vector3 {
  return { x: left.x + right.x, y: left.y + right.y, z: left.z + right.z }
}

export function subtractVector3(left: Vector3, right: Vector3): Vector3 {
  return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z }
}

export function scaleVector3(vector: Vector3, scale: number): Vector3 {
  return { x: vector.x * scale, y: vector.y * scale, z: vector.z * scale }
}

export function normalizeVector3(vector: Vector3): Vector3 {
  const length = Math.hypot(vector.x, vector.y, vector.z)
  if (length === 0) return { x: 0, y: 0, z: 0 }
  return scaleVector3(vector, 1 / length)
}

export function dotVector3(left: Vector3, right: Vector3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z
}

export function samplePolyline(points: readonly Vector3[], progress: number): Vector3 {
  if (points.length === 0) return { x: 0, y: 0, z: 0 }
  if (points.length === 1) return { ...points[0] }

  const segmentLengths = points.slice(1).map((point, index) => distanceVector3(points[index], point))
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0)
  if (totalLength === 0) return { ...points[0] }

  let remaining = clamp(progress, 0, 1) * totalLength
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index]
    if (remaining <= segmentLength || index === segmentLengths.length - 1) {
      return lerpVector3(points[index], points[index + 1], segmentLength === 0 ? 0 : remaining / segmentLength)
    }
    remaining -= segmentLength
  }

  return { ...points[points.length - 1] }
}

export function yawForDirection(direction: Vector3): number {
  return Math.atan2(-direction.x, -direction.z)
}

export function headingBetween(start: Vector3, end: Vector3): number {
  return yawForDirection({ x: end.x - start.x, y: 0, z: end.z - start.z })
}

export function transformLocalOffset(origin: Vector3, yawRadians: number, offset: Vector3): Vector3 {
  const cosine = Math.cos(yawRadians)
  const sine = Math.sin(yawRadians)
  return {
    x: origin.x + offset.x * cosine + offset.z * sine,
    y: origin.y + offset.y,
    z: origin.z - offset.x * sine + offset.z * cosine,
  }
}

/** Matches Three.js' default intrinsic XYZ Euler rotation order. */
export function rotateVectorByEulerXYZ(vector: Vector3, rotation: Vector3): Vector3 {
  const cosineX = Math.cos(rotation.x)
  const sineX = Math.sin(rotation.x)
  const cosineY = Math.cos(rotation.y)
  const sineY = Math.sin(rotation.y)
  const cosineZ = Math.cos(rotation.z)
  const sineZ = Math.sin(rotation.z)

  return {
    x: cosineY * cosineZ * vector.x - cosineY * sineZ * vector.y + sineY * vector.z,
    y: (cosineX * sineZ + sineX * cosineZ * sineY) * vector.x + (cosineX * cosineZ - sineX * sineZ * sineY) * vector.y - sineX * cosineY * vector.z,
    z: (sineX * sineZ - cosineX * cosineZ * sineY) * vector.x + (sineX * cosineZ + cosineX * sineZ * sineY) * vector.y + cosineX * cosineY * vector.z,
  }
}

export function transformLocalOffsetByPose(pose: Pose3, offset: Vector3): Vector3 {
  return addVector3(pose.position, rotateVectorByEulerXYZ(offset, pose.rotation))
}

export function lerpAngleRadians(start: number, end: number, amount: number): number {
  const difference = ((end - start + Math.PI) % (Math.PI * 2)) - Math.PI
  return start + difference * clamp(amount, 0, 1)
}
