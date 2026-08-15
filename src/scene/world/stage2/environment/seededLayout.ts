import type { WorldPosition, XZPoint } from '../../worldData.ts'
import type { EnvironmentResponseGroup, EnvironmentResponseInstance } from './responseGroups.ts'

export type DeterministicSeed = number | string

export type VegetationKind = 'dry_grass' | 'scrub'
export type VegetationProfile = 'coastal_dune' | 'dry_plain' | 'radar_hill'

export type VegetationExclusion =
  | Readonly<{
      centerXZ: XZPoint
      radiusM: number
      type: 'circle'
    }>
  | Readonly<{
      polygonXZ: readonly XZPoint[]
      type: 'polygon'
    }>

export type VegetationPatchSpec = Readonly<{
  exclusions?: readonly VegetationExclusion[]
  grassCount: number
  id: string
  polygonXZ: readonly XZPoint[]
  profile?: VegetationProfile
  responseGroup?: EnvironmentResponseGroup
  scrubCount: number
  seed: DeterministicSeed
  surfaceY: number | ((x: number, z: number) => number)
}>

export type VegetationInstanceTransform = Readonly<{
  colorMix: number
  instanceIndex: number
  kind: VegetationKind
  position: WorldPosition
  responseId: string
  scale: WorldPosition
  windPhase: number
  yaw: number
}>

export type VegetationLayout = Readonly<{
  grass: readonly VegetationInstanceTransform[]
  responseInstances: readonly EnvironmentResponseInstance[]
  scrub: readonly VegetationInstanceTransform[]
}>

function hashSeed(seed: DeterministicSeed) {
  const value = String(seed)
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function createDeterministicRandom(seed: DeterministicSeed) {
  let state = hashSeed(seed)

  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function isPointInsidePolygon(point: XZPoint, polygon: readonly XZPoint[]) {
  let inside = false

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [currentX, currentZ] = polygon[index]!
    const [previousX, previousZ] = polygon[previous]!
    const crosses = currentZ > point[1] !== previousZ > point[1]
    const edgeX = ((previousX - currentX) * (point[1] - currentZ)) / (previousZ - currentZ || Number.EPSILON) + currentX

    if (crosses && point[0] < edgeX) {
      inside = !inside
    }
  }

  return inside
}

function isExcluded(point: XZPoint, exclusions: readonly VegetationExclusion[]) {
  return exclusions.some((exclusion) => {
    if (exclusion.type === 'polygon') {
      return isPointInsidePolygon(point, exclusion.polygonXZ)
    }

    return Math.hypot(point[0] - exclusion.centerXZ[0], point[1] - exclusion.centerXZ[1]) <= exclusion.radiusM
  })
}

function scaleFor(profile: VegetationProfile, kind: VegetationKind, random: () => number): WorldPosition {
  const profileMultiplier = profile === 'coastal_dune' ? 0.82 : profile === 'radar_hill' ? 0.72 : 1

  if (kind === 'dry_grass') {
    const width = (0.55 + random() * 0.8) * profileMultiplier
    const height = (1.1 + random() * 1.7) * profileMultiplier
    return [width, height, width * (0.78 + random() * 0.35)]
  }

  const width = (1.7 + random() * 2.8) * profileMultiplier
  return [width, (1.1 + random() * 1.7) * profileMultiplier, width * (0.74 + random() * 0.42)]
}

function createKindInstances(spec: VegetationPatchSpec, kind: VegetationKind, count: number, random: () => number, bounds: Readonly<{ maximumX: number; maximumZ: number; minimumX: number; minimumZ: number }>) {
  const instances: VegetationInstanceTransform[] = []
  const exclusions = spec.exclusions ?? []
  const profile = spec.profile ?? 'dry_plain'
  const maximumAttempts = Math.max(256, count * 96)

  for (let attempts = 0; instances.length < count && attempts < maximumAttempts; attempts += 1) {
    const x = bounds.minimumX + random() * (bounds.maximumX - bounds.minimumX)
    const z = bounds.minimumZ + random() * (bounds.maximumZ - bounds.minimumZ)
    const point = [x, z] as const

    if (!isPointInsidePolygon(point, spec.polygonXZ) || isExcluded(point, exclusions)) {
      continue
    }

    const instanceIndex = instances.length
    const y = typeof spec.surfaceY === 'function' ? spec.surfaceY(x, z) : spec.surfaceY
    instances.push({
      colorMix: random(),
      instanceIndex,
      kind,
      position: [x, y, z],
      responseId: `${spec.id}:${kind}:${instanceIndex}`,
      scale: scaleFor(profile, kind, random),
      windPhase: random() * Math.PI * 2,
      yaw: random() * Math.PI * 2,
    })
  }

  if (instances.length !== count) {
    throw new Error(`Unable to place ${count} ${kind} instances inside vegetation patch "${spec.id}".`)
  }

  return instances
}

export function createVegetationLayout(spec: VegetationPatchSpec): VegetationLayout {
  if (spec.polygonXZ.length < 3) {
    throw new Error(`Vegetation patch "${spec.id}" requires at least three polygon vertices.`)
  }

  if (spec.grassCount < 0 || spec.scrubCount < 0) {
    throw new Error(`Vegetation patch "${spec.id}" counts must be non-negative.`)
  }

  let minimumX = Number.POSITIVE_INFINITY
  let maximumX = Number.NEGATIVE_INFINITY
  let minimumZ = Number.POSITIVE_INFINITY
  let maximumZ = Number.NEGATIVE_INFINITY

  for (const [x, z] of spec.polygonXZ) {
    minimumX = Math.min(minimumX, x)
    maximumX = Math.max(maximumX, x)
    minimumZ = Math.min(minimumZ, z)
    maximumZ = Math.max(maximumZ, z)
  }

  const bounds = { maximumX, maximumZ, minimumX, minimumZ }
  const random = createDeterministicRandom(`${spec.seed}:${spec.id}`)
  const grass = createKindInstances(spec, 'dry_grass', Math.floor(spec.grassCount), random, bounds)
  const scrub = createKindInstances(spec, 'scrub', Math.floor(spec.scrubCount), random, bounds)
  const responseInstances = spec.responseGroup
    ? [...grass, ...scrub].map((instance) => ({
        id: instance.responseId,
        instanceIndex: instance.instanceIndex,
        kind: instance.kind,
        position: instance.position,
        responseGroupId: spec.responseGroup!.id,
      }))
    : []

  return { grass, responseInstances, scrub }
}
