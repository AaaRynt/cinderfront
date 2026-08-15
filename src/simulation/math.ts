import type { Vector3 } from './types'

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
