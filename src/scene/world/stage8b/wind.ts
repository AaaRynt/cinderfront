import { MathUtils, Vector3, type InstancedMesh, type MeshDepthMaterial, type MeshStandardMaterial } from 'three'

import { FLUTTER_PERIOD_SECONDS, GUST_PERIOD_SECONDS, localMotionTime, type MotionClock } from './motionClock'

export const WIND_DIRECTION = [0.8, 0.6] as const
const GUST_SPATIAL_RATE = 0.073
const TAU = Math.PI * 2

export const WIND_PROFILES = {
  grass: { anchor: 0.085, tip: 0.93, bend: 0.62 },
  scrub: { anchor: 0.16, tip: 0.72, bend: 0.44 },
  upright: { anchor: 0.24, tip: 1.04, bend: 1.38 },
  wind: { anchor: 0.24, tip: 1.02, bend: 1.38 },
} as const

export type WindKind = keyof typeof WIND_PROFILES
export function isWindKind(kind: string): kind is WindKind {
  return Object.hasOwn(WIND_PROFILES, kind)
}

export function windTipWeight(kind: WindKind, localY: number) {
  const { anchor, tip } = WIND_PROFILES[kind]
  return MathUtils.clamp((localY - anchor) / (tip - anchor), 0, 1) ** 2
}

export function windBendAt(kind: WindKind, runtime: number, x: number, z: number, localY: number) {
  const time = localMotionTime(runtime)
  const station = x * WIND_DIRECTION[0] + z * WIND_DIRECTION[1]
  const pulse = 0.5 + 0.5 * Math.sin((TAU * time) / GUST_PERIOD_SECONDS - GUST_SPATIAL_RATE * station)
  const flutter = 0.9 + 0.1 * Math.sin((TAU * time) / FLUTTER_PERIOD_SECONDS + station * 0.93 + localY * 4.2)
  return WIND_PROFILES[kind].bend * windTipWeight(kind, localY) * (0.16 + 0.84 * pulse ** 2) * flutter
}

export const WIND_GLSL = `
  uniform float uLocalMotionTime;
  const vec2 localWindDirection = vec2(${WIND_DIRECTION.join(', ')});
  const float localWindTau = 6.28318530718;
  float localWindPhase(vec2 origin) {
    return localWindTau * uLocalMotionTime / ${GUST_PERIOD_SECONDS.toFixed(1)} - ${GUST_SPATIAL_RATE} * dot(origin, localWindDirection);
  }
  float localWindGust(vec2 origin) {
    float pulse = 0.5 + 0.5 * sin(localWindPhase(origin));
    return 0.16 + 0.84 * pulse * pulse;
  }
`

// A world-horizontal offset after Stage 8A's yaw, scale and ground shear.
// Both visible and depth passes apply the same offset to the same vertices.
const BEND_GLSL = `
  mat4 windWorld = modelMatrix;
  #ifdef USE_INSTANCING
    windWorld = modelMatrix * instanceMatrix;
  #endif
  vec2 windOrigin = windWorld[3].xz;
  float windStation = dot(windOrigin, localWindDirection);
  float weight = clamp((position.y - uWindProfile.x) / (uWindProfile.y - uWindProfile.x), 0.0, 1.0);
  float flutter = 0.9 + 0.1 * sin(localWindTau * uLocalMotionTime / ${FLUTTER_PERIOD_SECONDS.toFixed(1)} + windStation * 0.93 + position.y * 4.2);
  vec2 drift = localWindDirection * (uWindProfile.z * weight * weight * localWindGust(windOrigin) * flutter);
`

interface WindDisplacement {
  readonly programKey: string
  readonly uniforms: Readonly<Record<string, MotionClock>>
  readonly declarations: string
  readonly worldXZ: string
}

export function applyLocalWind<T extends MeshStandardMaterial | MeshDepthMaterial>(material: T, kind: WindKind, clock: MotionClock, displacement?: WindDisplacement) {
  const { anchor, tip, bend } = WIND_PROFILES[kind]
  const profile = { value: new Vector3(anchor, tip, bend) }
  const declarations = displacement ? `\n${displacement.declarations}` : ''
  const extraDrift = displacement ? `  drift += (${displacement.worldXZ}) * weight * weight;\n` : ''
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLocalMotionTime = clock
    shader.uniforms.uWindProfile = profile
    Object.assign(shader.uniforms, displacement?.uniforms)
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>\n${WIND_GLSL}\nuniform vec3 uWindProfile;${declarations}`).replace('#include <begin_vertex>', `#include <begin_vertex>\n${BEND_GLSL}${extraDrift}  transformed += inverse(mat3(windWorld)) * vec3(drift.x, 0.0, drift.y);\n`)
  }
  material.customProgramCacheKey = () => displacement?.programKey ?? '8b-local-wind-v1'
  return material
}

export function expandWindBounds(mesh: InstancedMesh, kind: WindKind) {
  const bend = WIND_PROFILES[kind].bend
  const delta = new Vector3(WIND_DIRECTION[0] * bend, 0, WIND_DIRECTION[1] * bend)
  const box = mesh.boundingBox!
  box.union(box.clone().translate(delta))
  mesh.boundingSphere!.radius += bend
}
