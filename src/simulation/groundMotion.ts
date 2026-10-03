import { clamp, yawForDirection } from './math'

type XZPoint = readonly [x: number, z: number]

export interface AuthoredPath {
  readonly points: readonly XZPoint[]
  readonly cumulativeDistances: readonly number[]
  readonly lengthMeters: number
}

export interface PathSample {
  readonly x: number
  readonly z: number
  readonly tangentX: number
  readonly tangentZ: number
}

const PATH_TANGENT_SAMPLE_METERS = 0.4

function distanceXZ(start: XZPoint, end: XZPoint) {
  return Math.hypot(end[0] - start[0], end[1] - start[1])
}

export function createPath(points: readonly XZPoint[]): AuthoredPath {
  const cumulativeDistances = [0]
  for (let index = 1; index < points.length; index += 1) cumulativeDistances.push(cumulativeDistances[index - 1]! + distanceXZ(points[index - 1]!, points[index]!))
  return {
    points,
    cumulativeDistances,
    lengthMeters: cumulativeDistances.at(-1) ?? 0,
  }
}

function pathSegmentIndex(path: AuthoredPath, distanceMeters: number) {
  const distance = clamp(distanceMeters, 0, path.lengthMeters)
  let low = 0
  let high = path.cumulativeDistances.length - 1
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2)
    if (path.cumulativeDistances[middle]! <= distance) low = middle
    else high = middle
  }
  return Math.min(low, path.points.length - 2)
}

function rawPathPosition(path: AuthoredPath, distanceMeters: number): XZPoint {
  const distance = clamp(distanceMeters, 0, path.lengthMeters)
  const index = pathSegmentIndex(path, distance)
  const start = path.points[index]!
  const end = path.points[index + 1]!
  const startDistance = path.cumulativeDistances[index]!
  const segmentLength = Math.max(path.cumulativeDistances[index + 1]! - startDistance, 0.000_1)
  const amount = clamp((distance - startDistance) / segmentLength, 0, 1)
  return [start[0] + (end[0] - start[0]) * amount, start[1] + (end[1] - start[1]) * amount]
}

export function samplePath(path: AuthoredPath, distanceMeters: number): PathSample {
  const position = rawPathPosition(path, distanceMeters)
  const before = rawPathPosition(path, distanceMeters - PATH_TANGENT_SAMPLE_METERS)
  const after = rawPathPosition(path, distanceMeters + PATH_TANGENT_SAMPLE_METERS)
  const tangentLength = Math.hypot(after[0] - before[0], after[1] - before[1]) || 1
  return {
    x: position[0],
    z: position[1],
    tangentX: (after[0] - before[0]) / tangentLength,
    tangentZ: (after[1] - before[1]) / tangentLength,
  }
}

export function sampleOffsetPath(path: AuthoredPath, distanceMeters: number, lateralOffsetMeters: number): PathSample {
  const sample = samplePath(path, distanceMeters)
  return {
    ...sample,
    x: sample.x - sample.tangentZ * lateralOffsetMeters,
    z: sample.z + sample.tangentX * lateralOffsetMeters,
  }
}

export function projectDistanceOnPath(path: AuthoredPath, target: XZPoint) {
  let bestDistance = 0
  let bestDistanceSquared = Number.POSITIVE_INFINITY
  for (let index = 1; index < path.points.length; index += 1) {
    const start = path.points[index - 1]!
    const end = path.points[index]!
    const dx = end[0] - start[0]
    const dz = end[1] - start[1]
    const lengthSquared = dx * dx + dz * dz
    const amount = lengthSquared === 0 ? 0 : clamp(((target[0] - start[0]) * dx + (target[1] - start[1]) * dz) / lengthSquared, 0, 1)
    const x = start[0] + dx * amount
    const z = start[1] + dz * amount
    const distanceSquared = (target[0] - x) ** 2 + (target[1] - z) ** 2
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared
      bestDistance = path.cumulativeDistances[index - 1]! + Math.sqrt(lengthSquared) * amount
    }
  }
  return bestDistance
}

export function distanceToPath(path: AuthoredPath, target: XZPoint) {
  const distance = projectDistanceOnPath(path, target)
  const closest = rawPathPosition(path, distance)
  return Math.hypot(target[0] - closest[0], target[1] - closest[1])
}

export function createGroundedPose({
  groundClearanceMeters,
  halfLengthMeters,
  halfWidthMeters,
  heightMeters,
  hullTangent,
  position,
  rollOffsetRadians = 0,
  surfaceHeightAt,
}: {
  readonly groundClearanceMeters: number
  readonly halfLengthMeters: number
  readonly halfWidthMeters: number
  readonly heightMeters: number
  readonly hullTangent: XZPoint
  readonly position: XZPoint
  readonly rollOffsetRadians?: number
  readonly surfaceHeightAt: (x: number, z: number) => number
}) {
  const [tangentX, tangentZ] = hullTangent
  const [x, z] = position
  const centerHeight = surfaceHeightAt(x, z)
  const rightX = -tangentZ
  const rightZ = tangentX
  const frontHeight = surfaceHeightAt(x + tangentX * halfLengthMeters, z + tangentZ * halfLengthMeters)
  const rearHeight = surfaceHeightAt(x - tangentX * halfLengthMeters, z - tangentZ * halfLengthMeters)
  const rightHeight = surfaceHeightAt(x + rightX * halfWidthMeters, z + rightZ * halfWidthMeters)
  const leftHeight = surfaceHeightAt(x - rightX * halfWidthMeters, z - rightZ * halfWidthMeters)
  return {
    position: {
      x,
      y: centerHeight + heightMeters / 2 + groundClearanceMeters,
      z,
    },
    rotation: {
      x: Math.atan2(frontHeight - rearHeight, halfLengthMeters * 2),
      y: yawForDirection({ x: tangentX, y: 0, z: tangentZ }),
      z: Math.atan2(rightHeight - leftHeight, halfWidthMeters * 2) + rollOffsetRadians,
    },
  }
}
