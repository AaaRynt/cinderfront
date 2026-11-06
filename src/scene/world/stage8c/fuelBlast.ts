import { MathUtils, type MeshDepthMaterial, type MeshStandardMaterial } from 'three'

import type { MotionClock } from '../stage8b/motionClock'

import { FUEL_SHOCK_DURATION_SECONDS, FUEL_SHOCK_MAX_RADIUS_M, shockArrivalSeconds, smoothstep01 } from '../../effects/stage3/effectMath'
import { STAGE4A_FUEL_ESCALATION_SCHEDULE } from '../../effects/stage4a/fuelDisasterMath'
import { applyLocalWind, type WindKind } from '../stage8b/wind'

const hero = STAGE4A_FUEL_ESCALATION_SCHEDULE.find((event) => event.id === 'central-bund-hero-cascade')!
const FULL_STRENGTH_RADIUS_M = 140
export const FUEL_BLAST_ATTACK_SECONDS = 0.22
const REBOUND_RATE = 4.4
const REBOUND_DAMPING = 1.15
const FADE_START_SECONDS = 1.9
export const FUEL_BLAST_SETTLE_SECONDS = 3.25

export function fuelBlastAge(timeSeconds: number) {
  // Saturation keeps the uniform small during indefinite observation.
  return Number.isFinite(timeSeconds) ? MathUtils.clamp(timeSeconds - hero.atSeconds, -1, FUEL_SHOCK_DURATION_SECONDS + FUEL_BLAST_SETTLE_SECONDS) : -1
}

export function fuelResponseAt(x: number, z: number, fullStrengthTipM: number) {
  const dx = x - hero.positionXZ[0]
  const dz = z - hero.positionXZ[1]
  const distanceM = Math.hypot(dx, dz)
  const attenuation = 1 - smoothstep01((distanceM - FULL_STRENGTH_RADIUS_M) / (FUEL_SHOCK_MAX_RADIUS_M - FULL_STRENGTH_RADIUS_M))
  const directionX = distanceM > 0 ? dx / distanceM : 0
  const directionZ = distanceM > 0 ? dz / distanceM : 0
  return {
    distanceM,
    arrivalAge: shockArrivalSeconds(distanceM, 0),
    directionX,
    directionZ,
    peakM: fullStrengthTipM * attenuation,
  }
}

/** CPU evaluation of the vertex shader's signed, unit-peak impulse. */
export function fuelBlastEnvelope(age: number) {
  if (age <= 0 || age >= FUEL_BLAST_SETTLE_SECONDS) return 0
  if (age < FUEL_BLAST_ATTACK_SECONDS) return smoothstep01(age / FUEL_BLAST_ATTACK_SECONDS)
  const reboundAge = age - FUEL_BLAST_ATTACK_SECONDS
  return Math.exp(-REBOUND_DAMPING * reboundAge) * Math.cos(REBOUND_RATE * reboundAge) * (1 - smoothstep01((age - FADE_START_SECONDS) / (FUEL_BLAST_SETTLE_SECONDS - FADE_START_SECONDS)))
}

const FUEL_BLAST_GLSL = `
  uniform float uFuelBlastAge;
  // World XZ direction, arrival age from the cascade, and peak metres.
  attribute vec4 fuelResponse;
  float fuelBlastEnvelope(float age) {
    if (age <= 0.0 || age >= ${FUEL_BLAST_SETTLE_SECONDS}) return 0.0;
    if (age < ${FUEL_BLAST_ATTACK_SECONDS}) return smoothstep(0.0, ${FUEL_BLAST_ATTACK_SECONDS}, age);
    float reboundAge = age - ${FUEL_BLAST_ATTACK_SECONDS};
    return exp(-${REBOUND_DAMPING} * reboundAge) * cos(${REBOUND_RATE} * reboundAge) * (1.0 - smoothstep(${FADE_START_SECONDS}, ${FUEL_BLAST_SETTLE_SECONDS}, age));
  }
`

export function applyFuelBlast<T extends MeshStandardMaterial | MeshDepthMaterial>(material: T, kind: WindKind, windClock: MotionClock, blastClock: MotionClock) {
  return applyLocalWind(material, kind, windClock, {
    programKey: '8c-fuel-blast-v1',
    uniforms: { uFuelBlastAge: blastClock },
    declarations: FUEL_BLAST_GLSL,
    worldXZ: 'fuelResponse.xy * (fuelResponse.w * fuelBlastEnvelope(uFuelBlastAge - fuelResponse.z))',
  })
}
