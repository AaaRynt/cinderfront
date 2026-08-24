import type { BallisticFragmentDescriptor, Stage3Vec3 } from '../stage3/types.ts'

import { clamp01, createBallisticFragments, createStage3Random, smoothstep01 } from '../stage3/effectMath.ts'

export type Stage4AFuelEventKind = 'bund-pool-ignition' | 'hero-cascade' | 'manifold-burst' | 'pipe-rupture' | 'rim-seal-ignition' | 'tank-flashover' | 'tank-hit' | 'vent-flashover'

export type Stage4AFuelPhase = 'pre-ignition' | 'pipeline-fire' | 'tank-five-burning' | 'hero-cascade' | 'sympathetic-spread' | 'district-inferno'

export interface Stage4AFuelEventDescriptor {
  readonly atSeconds: number
  readonly burstRadiusM: number
  readonly debrisCount: number
  readonly elevationOffsetM: number
  readonly fireScale: number
  readonly id: string
  readonly kind: Stage4AFuelEventKind
  readonly positionXZ: readonly [x: number, z: number]
  readonly smokeHeightM: number
  readonly smokePuffCount: number
}

export interface Stage4AFuelEventState {
  readonly ageSeconds: number
  readonly descriptor: Stage4AFuelEventDescriptor
  readonly reached: boolean
}

export interface Stage4AFuelDisasterState {
  readonly activePersistentFireCount: number
  readonly events: readonly Stage4AFuelEventState[]
  readonly phase: Stage4AFuelPhase
  readonly reachedEventIds: readonly string[]
  readonly timeSeconds: number
}

export interface Stage4AFuelBurstSample {
  readonly flashIntensity: number
  readonly scaleM: number
  readonly verticalStretch: number
  readonly visible: boolean
}

export interface Stage4AFuelPoolFireDescriptor {
  readonly igniteAtSeconds: number
  readonly phase: number
  readonly positionXZ: readonly [x: number, z: number]
  readonly scale: number
}

export type Stage4ASmokeLayer = 'body' | 'core' | 'edge'

export interface Stage4ASmokePuffDescriptor {
  readonly curl: number
  readonly delaySeconds: number
  readonly layer: Stage4ASmokeLayer
  readonly lifetimeSeconds: number
  readonly phase: number
  readonly sizeM: number
}

export const STAGE4A_FUEL_HERO_TIME_SECONDS = 92
export const STAGE4A_FUEL_POOL_FIRE_COUNT = 14
export const STAGE4A_FUEL_MAX_POOL_FIRE_RADIUS_M = 180

/**
 * Visual-only deterministic sub-events. The authoritative T+78, T+86, and T+92
 * scenario anchors are unchanged; later entries describe connected industrial
 * failures rather than new weapon strikes.
 */
export const STAGE4A_FUEL_ESCALATION_SCHEDULE = [
  {
    atSeconds: 78,
    burstRadiusM: 18,
    debrisCount: 4,
    elevationOffsetM: 5.8,
    fireScale: 1.55,
    id: 'pipeline-initial-strike',
    kind: 'pipe-rupture',
    positionXZ: [-1_450, 2_500],
    smokeHeightM: 105,
    smokePuffCount: 12,
  },
  {
    atSeconds: 81.2,
    burstRadiusM: 14,
    debrisCount: 3,
    elevationOffsetM: 3.2,
    fireScale: 1.3,
    id: 'trunk-header-sympathetic-rupture',
    kind: 'pipe-rupture',
    positionXZ: [-1_200, 2_300],
    smokeHeightM: 82,
    smokePuffCount: 9,
  },
  {
    atSeconds: 86,
    burstRadiusM: 34,
    debrisCount: 8,
    elevationOffsetM: 22,
    fireScale: 2.65,
    id: 'tank-05-direct-hit',
    kind: 'tank-hit',
    positionXZ: [-550, 2_050],
    smokeHeightM: 165,
    smokePuffCount: 20,
  },
  {
    atSeconds: 88.6,
    burstRadiusM: 16,
    debrisCount: 4,
    elevationOffsetM: 2.4,
    fireScale: 1.65,
    id: 'tank-05-feed-line-rupture',
    kind: 'pipe-rupture',
    positionXZ: [-670, 2_050],
    smokeHeightM: 96,
    smokePuffCount: 10,
  },
  {
    atSeconds: 90.7,
    burstRadiusM: 22,
    debrisCount: 0,
    elevationOffsetM: 0.5,
    fireScale: 2.15,
    id: 'central-bund-spill-ignition',
    kind: 'bund-pool-ignition',
    positionXZ: [-760, 2_185],
    smokeHeightM: 88,
    smokePuffCount: 8,
  },
  {
    atSeconds: STAGE4A_FUEL_HERO_TIME_SECONDS,
    burstRadiusM: 70,
    debrisCount: 18,
    elevationOffsetM: 8,
    fireScale: 4.3,
    id: 'central-bund-hero-cascade',
    kind: 'hero-cascade',
    positionXZ: [-545, 2_050],
    smokeHeightM: 340,
    smokePuffCount: 52,
  },
  {
    atSeconds: 95.2,
    burstRadiusM: 46,
    debrisCount: 7,
    elevationOffsetM: 18,
    fireScale: 3.35,
    id: 'tank-04-shell-flashover',
    kind: 'tank-flashover',
    positionXZ: [-1_050, 2_050],
    smokeHeightM: 235,
    smokePuffCount: 24,
  },
  {
    atSeconds: 97.6,
    burstRadiusM: 32,
    debrisCount: 6,
    elevationOffsetM: 9.8,
    fireScale: 2.75,
    id: 'transfer-manifold-burst',
    kind: 'manifold-burst',
    positionXZ: [400, 2_025],
    smokeHeightM: 190,
    smokePuffCount: 18,
  },
  {
    atSeconds: 101.4,
    burstRadiusM: 38,
    debrisCount: 5,
    elevationOffsetM: 18,
    fireScale: 3.05,
    id: 'tank-06-rim-seal-ignition',
    kind: 'rim-seal-ignition',
    positionXZ: [-50, 2_050],
    smokeHeightM: 220,
    smokePuffCount: 21,
  },
  {
    atSeconds: 105.6,
    burstRadiusM: 22,
    debrisCount: 4,
    elevationOffsetM: 3.2,
    fireScale: 1.85,
    id: 'north-pipe-header-rupture',
    kind: 'pipe-rupture',
    positionXZ: [-300, 2_300],
    smokeHeightM: 126,
    smokePuffCount: 12,
  },
  {
    atSeconds: 109.8,
    burstRadiusM: 34,
    debrisCount: 5,
    elevationOffsetM: 20,
    fireScale: 2.85,
    id: 'tank-02-vent-flashover',
    kind: 'vent-flashover',
    positionXZ: [-550, 2_550],
    smokeHeightM: 205,
    smokePuffCount: 18,
  },
] as const satisfies readonly Stage4AFuelEventDescriptor[]

function phaseAt(timeSeconds: number): Stage4AFuelPhase {
  if (timeSeconds < 78) return 'pre-ignition'
  if (timeSeconds < 86) return 'pipeline-fire'
  if (timeSeconds < STAGE4A_FUEL_HERO_TIME_SECONDS) return 'tank-five-burning'
  if (timeSeconds < 95.2) return 'hero-cascade'
  if (timeSeconds < 109.8) return 'sympathetic-spread'
  return 'district-inferno'
}

export function deriveStage4AFuelDisasterState(timeSeconds: number): Stage4AFuelDisasterState {
  const resolvedTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0
  const events = STAGE4A_FUEL_ESCALATION_SCHEDULE.map((descriptor): Stage4AFuelEventState => ({
    ageSeconds: resolvedTime - descriptor.atSeconds,
    descriptor,
    reached: resolvedTime >= descriptor.atSeconds,
  }))
  const reachedEventIds = events.filter((event) => event.reached).map((event) => event.descriptor.id)
  const reachedPoolFires = STAGE4A_FUEL_POOL_FIRE_SCHEDULE.filter((fire) => resolvedTime >= fire.igniteAtSeconds).length

  return {
    activePersistentFireCount: reachedEventIds.length + reachedPoolFires,
    events,
    phase: phaseAt(resolvedTime),
    reachedEventIds,
    timeSeconds: resolvedTime,
  }
}

export function sampleStage4AFuelBurst(descriptor: Stage4AFuelEventDescriptor, timeSeconds: number): Stage4AFuelBurstSample {
  const age = timeSeconds - descriptor.atSeconds
  const hero = descriptor.kind === 'hero-cascade'
  const growthSeconds = hero ? 1.4 : descriptor.kind === 'tank-flashover' ? 1.05 : 0.72
  const lingerSeconds = hero ? 3.5 : descriptor.kind === 'bund-pool-ignition' ? 3.1 : 2.35
  const totalSeconds = growthSeconds + lingerSeconds
  if (age < 0 || age > totalSeconds) return { flashIntensity: 0, scaleM: 0, verticalStretch: 1, visible: false }

  const growth = smoothstep01(age / growthSeconds)
  const transition = smoothstep01((age - growthSeconds) / lingerSeconds)
  const terminalFade = 1 - smoothstep01((transition - 0.5) / 0.5)
  const flashDurationSeconds = hero ? 0.08 : 0.055
  const flashIntensity = age < flashDurationSeconds ? 1 - clamp01(age / flashDurationSeconds) : 0

  return {
    flashIntensity,
    scaleM: descriptor.burstRadiusM * growth * terminalFade,
    verticalStretch: 1 + transition * (hero ? 0.62 : 0.34),
    visible: true,
  }
}

export function sampleStage4AFuelFireIntensity(eventTimeSeconds: number, timeSeconds: number, phase = 0): number {
  const age = timeSeconds - eventTimeSeconds
  if (age < 0) return 0
  const ignition = smoothstep01(age / 0.65)
  const sustained = 0.82 + Math.sin(age * 4.7 + phase) * 0.1 + Math.sin(age * 8.9 + phase * 0.37) * 0.04
  return ignition * sustained
}

export function createStage4AFuelPoolFires(seed: number | string = 'ash-harbor-stage4a-fuel-pool-fires'): readonly Stage4AFuelPoolFireDescriptor[] {
  const random = createStage3Random(seed)
  return Array.from({ length: STAGE4A_FUEL_POOL_FIRE_COUNT }, (_, index): Stage4AFuelPoolFireDescriptor => {
    const angle = random() * Math.PI * 2 + index * 0.37
    const radius = 48 + Math.sqrt(random()) * (STAGE4A_FUEL_MAX_POOL_FIRE_RADIUS_M - 48)
    return {
      igniteAtSeconds: 93.25 + index * 0.48 + random() * 1.8,
      phase: random() * Math.PI * 2,
      positionXZ: [-545 + Math.sin(angle) * radius, 2_050 + Math.cos(angle) * radius],
      scale: 1.35 + random() * 1.8,
    }
  })
}

export const STAGE4A_FUEL_POOL_FIRE_SCHEDULE = createStage4AFuelPoolFires()

/** Fuel fragments begin at the damaged structure but terminate at local ground height. */
export function createStage4AFuelDebris(seed: number | string, count: number, emissionHeightM: number): readonly BallisticFragmentDescriptor[] {
  return createBallisticFragments(seed, count, 'fuel').map((fragment) => {
    const startY = fragment.offset[1] + Math.max(0, emissionHeightM)
    const lifetime = fragment.lifetimeSeconds
    return {
      ...fragment,
      offset: [fragment.offset[0], startY, fragment.offset[2]],
      velocity: [fragment.velocity[0], (9.81 * lifetime * lifetime * 0.5 - startY) / lifetime, fragment.velocity[2]],
    }
  })
}

export function createStage4ASmokePuffs(seed: number | string, count: number, sourceScale = 1): readonly Stage4ASmokePuffDescriptor[] {
  const random = createStage3Random(`${seed}:cinematic-fuel-smoke`)
  return Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index): Stage4ASmokePuffDescriptor => {
    const layerRoll = index % 7
    return {
      curl: random() * 2 - 1,
      delaySeconds: index * (0.16 + random() * 0.1),
      layer: layerRoll < 3 ? 'core' : layerRoll < 6 ? 'body' : 'edge',
      lifetimeSeconds: 12 + random() * 7,
      phase: random() * Math.PI * 2,
      sizeM: (8 + random() * 11) * sourceScale,
    }
  })
}

export function resolveStage4AFuelEventPosition(descriptor: Stage4AFuelEventDescriptor, surfaceHeightAt: (x: number, z: number) => number): Stage3Vec3 {
  const [x, z] = descriptor.positionXZ
  return [x, surfaceHeightAt(x, z) + descriptor.elevationOffsetM, z]
}
