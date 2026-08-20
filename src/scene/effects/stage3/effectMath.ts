import type { BallisticFragmentDescriptor, BallisticSample, BlastResponseDescriptor, BlastResponseSample, GroundFireDescriptor, SmokePuffDescriptor, Stage3BlastObjectKind, Stage3Vec3 } from './types.ts'

export const STAGE3_WIND_XZ = [0.7, 0.71] as const
export const FUEL_HERO_TIME_SECONDS = 92
export const FUEL_RESPONSE_RADIUS_M = 320
export const FUEL_SHOCK_MAX_RADIUS_M = 620
export const FUEL_SHOCK_DURATION_SECONDS = 1.8
export const AMMUNITION_COOKOFF_START_SECONDS = 116
export const AMMUNITION_PRIMARY_TIME_SECONDS = 132

export const AMMUNITION_COOKOFF_OFFSETS_SECONDS = [0.45, 2.1, 3.7, 4.5, 6.25, 7.55, 9.2] as const
export const AMMUNITION_SECONDARY_OFFSETS_SECONDS = [4.2, 11.7, 24.4] as const

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function smoothstep01(value: number) {
  const progress = clamp01(value)
  return progress * progress * (3 - 2 * progress)
}

export function cyclicParticleEnvelope(progress: number, fadeInFraction = 0.14, fadeOutFraction = 0.2) {
  const resolvedProgress = clamp01(progress)
  const fadeIn = resolvedProgress / Math.max(0.001, fadeInFraction)
  const fadeOut = (1 - resolvedProgress) / Math.max(0.001, fadeOutFraction)
  return smoothstep01(Math.min(fadeIn, fadeOut))
}

function hashSeed(seed: number | string) {
  const value = String(seed)
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function createStage3Random(seed: number | string) {
  let state = hashSeed(seed)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function selectBurningFragmentIndices(seed: number | string, count: number, profile: 'fuel' | 'ammunition') {
  const [minimumFraction, maximumFraction] = profile === 'fuel' ? [0.45, 0.7] : [0.3, 0.55]
  const minimumCount = Math.min(count, Math.ceil(count * minimumFraction))
  const maximumCount = Math.max(minimumCount, Math.floor(count * maximumFraction))
  const random = createStage3Random(`${seed}:${profile}:burning-fragment-selection`)
  const targetCount = minimumCount + Math.floor(random() * (maximumCount - minimumCount + 1))
  const indices = Array.from({ length: count }, (_, index) => index)

  for (let index = indices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = indices[index]
    indices[index] = indices[swapIndex]
    indices[swapIndex] = current
  }

  return new Set(indices.slice(0, targetCount))
}

export function createBallisticFragments(seed: number | string, count: number, profile: 'fuel' | 'ammunition'): readonly BallisticFragmentDescriptor[] {
  const random = createStage3Random(`${seed}:${profile}:ballistic-fragments`)
  const resolvedCount = Math.max(0, Math.floor(count))
  const burningIndices = selectBurningFragmentIndices(seed, resolvedCount, profile)

  return Array.from({ length: resolvedCount }, (_, index) => {
    const angle = random() * Math.PI * 2
    const horizontalSpeed = profile === 'fuel' ? 24 + random() * 34 : 34 + random() * 46
    const lifetimeSeconds = profile === 'fuel' ? 3 + random() * 5 : 6 + random() * 3
    const offset: Stage3Vec3 = [(random() - 0.5) * 22, 3 + random() * 12, (random() - 0.5) * 22]
    const verticalSpeed = (9.81 * lifetimeSeconds * lifetimeSeconds * 0.5 - offset[1]) / lifetimeSeconds
    const size = profile === 'fuel' ? 2.1 + random() * 4.8 : 1.1 + random() * 3.4

    return {
      angularVelocity: [(random() - 0.5) * 5.6, (random() - 0.5) * 6.2, (random() - 0.5) * 5.4],
      burning: burningIndices.has(index),
      lifetimeSeconds,
      offset,
      scale: [size, size * (0.2 + random() * 0.32), size * (0.28 + random() * 0.55)],
      velocity: [Math.sin(angle) * horizontalSpeed, verticalSpeed, Math.cos(angle) * horizontalSpeed],
    }
  })
}

export function sampleBallisticFragment(descriptor: BallisticFragmentDescriptor, ageSeconds: number, gravityMps2 = 9.81): BallisticSample {
  const age = Math.max(0, ageSeconds)
  const [offsetX, offsetY, offsetZ] = descriptor.offset
  const [velocityX, velocityY, velocityZ] = descriptor.velocity
  return {
    position: [offsetX + velocityX * age, offsetY + velocityY * age - gravityMps2 * age * age * 0.5, offsetZ + velocityZ * age],
    rotation: [descriptor.angularVelocity[0] * age, descriptor.angularVelocity[1] * age, descriptor.angularVelocity[2] * age],
    velocity: [velocityX, velocityY - gravityMps2 * age, velocityZ],
  }
}

export function createGroundFires(seed: number | string, count: number, maximumRadiusM = 180): readonly GroundFireDescriptor[] {
  const random = createStage3Random(`${seed}:ground-fires`)
  return Array.from({ length: Math.max(0, Math.floor(count)) }, () => {
    const angle = random() * Math.PI * 2
    const radius = (0.18 + Math.sqrt(random()) * 0.82) * maximumRadiusM
    return {
      delaySeconds: 0.7 + random() * 4.8,
      offset: [Math.sin(angle) * radius, 0, Math.cos(angle) * radius],
      phase: random() * Math.PI * 2,
      scale: 0.72 + random() * 0.95,
    }
  })
}

export function createSmokePuffs(seed: number | string, count: number, profile: 'fuel' | 'ammunition' | 'local'): readonly SmokePuffDescriptor[] {
  const random = createStage3Random(`${seed}:${profile}:smoke-puffs`)
  const interval = profile === 'fuel' ? 0.28 : profile === 'ammunition' ? 0.38 : 0.55
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => ({
    core: index % 3 !== 2,
    curl: random() * 2 - 1,
    delaySeconds: index * interval,
    lifetimeSeconds: profile === 'fuel' ? 10 + random() * 4 : profile === 'ammunition' ? 8 + random() * 3 : 5 + random() * 2,
    phase: random() * Math.PI * 2,
    size: profile === 'fuel' ? 11 + random() * 10 : profile === 'ammunition' ? 7 + random() * 7 : 2 + random() * 2.8,
  }))
}

export function shockRadiusAt(ageSeconds: number, maximumRadiusM: number, durationSeconds: number) {
  if (ageSeconds <= 0) return 0
  if (ageSeconds >= durationSeconds) return maximumRadiusM
  return maximumRadiusM * clamp01(ageSeconds / Math.max(0.001, durationSeconds))
}

export function shockArrivalSeconds(distanceM: number, blastTimeSeconds: number, maximumRadiusM = FUEL_SHOCK_MAX_RADIUS_M, durationSeconds = FUEL_SHOCK_DURATION_SECONDS) {
  return blastTimeSeconds + (Math.max(0, distanceM) / Math.max(1, maximumRadiusM)) * durationSeconds
}

function responseEnvelope(ageAfterArrivalSeconds: number) {
  if (ageAfterArrivalSeconds < 0) return 0
  const attackSeconds = 0.24
  if (ageAfterArrivalSeconds < attackSeconds) return Math.sin((ageAfterArrivalSeconds / attackSeconds) * Math.PI * 0.5)
  const reboundAge = ageAfterArrivalSeconds - attackSeconds
  return Math.exp(-reboundAge * 0.72) * Math.cos(reboundAge * 4.4)
}

export function sampleBlastResponse(descriptor: BlastResponseDescriptor, timeSeconds: number, blastTimeSeconds = FUEL_HERO_TIME_SECONDS, responseRadiusM = FUEL_RESPONSE_RADIUS_M): BlastResponseSample {
  const arrival = shockArrivalSeconds(descriptor.distanceFromBlastM, blastTimeSeconds)
  const distanceAttenuation = clamp01(1 - descriptor.distanceFromBlastM / Math.max(1, responseRadiusM))
  const maximumDegrees = Math.min(32, Math.max(10, 10 + 22 * distanceAttenuation + Math.sin(descriptor.phase) * 2))
  const bendRadians = (maximumDegrees * Math.PI * responseEnvelope(timeSeconds - arrival)) / 180
  const ignitionAt = arrival + 0.9 + ((descriptor.phase / (Math.PI * 2)) % 1) * 1.1
  const ignitionAgeSeconds = timeSeconds - ignitionAt
  return {
    bendRadians,
    charred: descriptor.burns && ignitionAgeSeconds >= 2.4,
    ignitionActive: descriptor.burns && ignitionAgeSeconds >= 0,
    ignitionAgeSeconds,
    shockArrivalSeconds: arrival,
  }
}

export interface BlastResponseLayoutOptions {
  readonly antennaCount?: number
  readonly fenceCount?: number
  readonly grassCount?: number
  readonly lightPoleCount?: number
  readonly origin: Stage3Vec3
  readonly responseRadiusM?: number
  readonly scrubCount?: number
  readonly seed?: number | string
  readonly surfaceHeightAt?: (x: number, z: number) => number
}

function dimensionsForBlastObject(kind: Stage3BlastObjectKind, random: () => number): Stage3Vec3 {
  if (kind === 'grass') return [0.7 + random() * 0.65, 1.4 + random() * 1.6, 0.7 + random() * 0.65]
  if (kind === 'scrub') return [2 + random() * 2.8, 1.8 + random() * 2.4, 2 + random() * 2.8]
  if (kind === 'light-pole') return [0.6, 12 + random() * 6, 0.6]
  if (kind === 'fence') return [6 + random() * 8, 2.5 + random() * 0.9, 0.22]
  return [0.4, 7 + random() * 7, 0.4]
}

export function createBlastResponseLayout(options: BlastResponseLayoutOptions): readonly BlastResponseDescriptor[] {
  const { antennaCount = 2, fenceCount = 8, grassCount = 36, lightPoleCount = 3, origin, responseRadiusM = FUEL_RESPONSE_RADIUS_M, scrubCount = 14, seed = 'ash-harbor-stage3-industrial-response', surfaceHeightAt } = options
  const random = createStage3Random(`${seed}:blast-response-layout`)
  const counts = [
    ['grass', grassCount],
    ['scrub', scrubCount],
    ['light-pole', lightPoleCount],
    ['fence', fenceCount],
    ['antenna', antennaCount],
  ] as const satisfies readonly (readonly [Stage3BlastObjectKind, number])[]
  const layout: BlastResponseDescriptor[] = []

  for (const [kind, count] of counts) {
    for (let index = 0; index < Math.max(0, Math.floor(count)); index += 1) {
      const angle = random() * Math.PI * 2
      const minimumRadius = kind === 'grass' || kind === 'scrub' ? 52 : 105
      const radius = minimumRadius + Math.sqrt(random()) * Math.max(0, responseRadiusM - minimumRadius)
      const x = origin[0] + Math.sin(angle) * radius
      const z = origin[2] + Math.cos(angle) * radius
      const y = surfaceHeightAt ? surfaceHeightAt(x, z) : origin[1]
      layout.push({
        burns: (kind === 'grass' || kind === 'scrub') && random() < 0.27,
        distanceFromBlastM: radius,
        id: `industrial-response:${kind}:${index}`,
        kind,
        phase: random() * Math.PI * 2,
        position: [x, y, z],
        scale: dimensionsForBlastObject(kind, random),
        yawRadians: random() * Math.PI * 2,
      })
    }
  }

  return layout
}

export function addVec3(first: Stage3Vec3, second: Stage3Vec3): Stage3Vec3 {
  return [first[0] + second[0], first[1] + second[1], first[2] + second[2]]
}
