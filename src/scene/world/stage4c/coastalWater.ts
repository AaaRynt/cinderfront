import { BufferGeometry, Float32BufferAttribute, PlaneGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import type { XZPoint } from '../worldData'

import { createDeterministicRandom } from '../stage2/environment/seededLayout'
import { WATER_POLYGONS } from '../stage2/stage2Data'
import { createTerrainSurfaceGeometry } from '../stage2/terrainGeometry'
import { distanceToPolyline, pointInPolygon } from '../stage2/terrainModel'
import { MAINLAND_POLYGON_XZ } from '../worldData'
import { FUTURE_LCAC_APPROACHES, intersectsReservation, reservePath } from './spatialReservations'
import { orientedPatch } from './surfaceHistory'

export const MEAN_SEA_LEVEL = -0.12
export const COASTAL_WAVES = [
  { direction: [0.70207418, 0.71210381], wavelength: 210, slope: 0.078, frequency: 0.31, phase: 0.7 },
  { direction: [0.4472136, 0.89442719], wavelength: 83, slope: 0.041, frequency: 0.56, phase: 2.1 },
  { direction: [0.92847669, 0.37139068], wavelength: 32, slope: 0.019, frequency: 0.92, phase: 4.2 },
] as const
export const MAX_WATER_SLOPE = COASTAL_WAVES.reduce((sum, wave) => sum + wave.slope, 0)
export const BEACH_COAST: readonly XZPoint[] = WATER_POLYGONS.beachIntertidal.slice(0, 7)

const smooth = (a: number, b: number, value: number) => {
  const u = Math.max(0, Math.min(1, (value - a) / (b - a)))
  return u * u * (3 - 2 * u)
}
function polygonMask(x: number, z: number, points: readonly XZPoint[], feather: number) {
  const distance = distanceToPolyline(x, z, [...points, points[0]!])
  return smooth(-feather, feather, pointInPolygon(x, z, points) ? distance : -distance)
}
/** Feathered map-region distance is a visual depth/shelter proxy, not bathymetry. */
export function sampleWaterRegion(x: number, z: number) {
  const harbor = polygonMask(x, z, WATER_POLYGONS.harborBasin, 150)
  const channel = polygonMask(x, z, WATER_POLYGONS.harborChannel, 85)
  const shallow = Math.max(polygonMask(x, z, WATER_POLYGONS.beachShallows, 170), polygonMask(x, z, WATER_POLYGONS.harborShallowNorth, 95), polygonMask(x, z, WATER_POLYGONS.harborShallowSouth, 95))
  const wet = polygonMask(x, z, WATER_POLYGONS.beachIntertidal, 90)
  const transition = polygonMask(x, z, WATER_POLYGONS.beachDeepTransition, 230)
  return { harbor, shallow: Math.max(shallow, wet * 0.95, transition * 0.22), wet, attenuation: (1 - harbor * 0.74) * (1 - wet * 0.36) * (1 - channel * harbor * 0.08) }
}
export function sampleCoastalMotion(x: number, z: number, timeSeconds: number) {
  const region = sampleWaterRegion(x, z)
  const time = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0
  let slopeX = 0,
    slopeZ = 0
  for (const wave of COASTAL_WAVES) {
    const phase = (x * wave.direction[0] + z * wave.direction[1]) * ((Math.PI * 2) / wave.wavelength) - time * wave.frequency + wave.phase
    const slope = wave.slope * Math.cos(phase) * region.attenuation
    slopeX += wave.direction[0] * slope
    slopeZ += wave.direction[1] * slope
  }
  return { meanY: MEAN_SEA_LEVEL, slopeX, slopeZ, roughness: 0.42 + region.harbor * 0.12 + region.wet * 0.08, wetness: 0.74 + 0.045 * Math.sin(time * 0.31 + x * 0.009 + z * 0.006) }
}

// Shader normal uses exactly the tested components; all phases use the one
// simulation-time uniform, never frame delta, render clock or camera position.
export const WATER_NORMAL_GLSL = COASTAL_WAVES.map((w) => `slope += vec2(${w.direction[0]}, ${w.direction[1]}) * ${w.slope} * cos(dot(vCoastalXZ, vec2(${w.direction[0]}, ${w.direction[1]})) * ${((Math.PI * 2) / w.wavelength).toFixed(12)} - uCoastalTime * ${w.frequency} + ${w.phase});`).join('\n')
export const WETNESS_GLSL = '0.74 + 0.045 * sin(uCoastalTime * 0.31 + vCoastalXZ.x * 0.009 + vCoastalXZ.y * 0.006)'
export const FOAM_MAX_OPACITY = 0.32
export function sampleFoamOpacity(u: number, v: number, phase: number, time: number) {
  const center = 0.5 + 0.12 * Math.sin(u * 9 + phase) + 0.045 * Math.sin(u * 23 - phase) + 0.025 * Math.sin(time * 0.31 + phase)
  const width = 0.15 + 0.055 * Math.sin(u * 19 + phase * 0.7)
  const edge = smooth(0, 0.18, Math.min(u, 1 - u)) * (1 - smooth(width * 0.35, width, Math.abs(v - center)))
  const broken = 0.55 + 0.45 * smooth(-0.8, 0.4, Math.sin(u * 28 + phase))
  return FOAM_MAX_OPACITY * edge * broken * (0.56 + 0.44 * Math.sin(time * 0.31 + phase + u * 4) ** 2)
}
// Shared analytic shape: a ragged, narrow crest inside each batched quad,
// never a straight rectangular stamp or a continuous luminous coast border.
export const FOAM_SHAPE_GLSL = `
  float center = 0.5 + 0.12 * sin(vFoamUv.x * 9.0 + vFoamPhase) + 0.045 * sin(vFoamUv.x * 23.0 - vFoamPhase) + 0.025 * sin(uCoastalTime * 0.31 + vFoamPhase);
  float width = 0.15 + 0.055 * sin(vFoamUv.x * 19.0 + vFoamPhase * 0.7);
  float edge = smoothstep(0.0, 0.18, min(vFoamUv.x, 1.0-vFoamUv.x)) * (1.0 - smoothstep(width * 0.35, width, abs(vFoamUv.y-center)));
  float broken = 0.55 + 0.45 * smoothstep(-0.8, 0.4, sin(vFoamUv.x * 28.0 + vFoamPhase));`
export const FOAM_ALPHA_GLSL = `${FOAM_MAX_OPACITY} * edge * broken * (0.56 + 0.44 * pow(sin(uCoastalTime * 0.31 + vFoamPhase + vFoamUv.x * 4.0), 2.0))`

export function createCoastalWaterGeometry() {
  const geometry = new PlaneGeometry(14000, 10000, 140, 100).rotateX(-Math.PI / 2)
  const p = geometry.getAttribute('position')
  const masks: number[] = [],
    attenuation: number[] = []
  for (let i = 0; i < p.count; i++) {
    p.setY(i, MEAN_SEA_LEVEL)
    const r = sampleWaterRegion(p.getX(i), p.getZ(i))
    masks.push(r.harbor, r.shallow, r.wet)
    attenuation.push(r.attenuation)
  }
  geometry.setAttribute('coastalRegion', new Float32BufferAttribute(masks, 3))
  geometry.setAttribute('coastalAttenuation', new Float32BufferAttribute(attenuation, 1))
  return geometry
}

export interface FoamFragment {
  readonly points: readonly XZPoint[]
  readonly phase: number
}
export function createShoreFoamLayout(): readonly FoamFragment[] {
  const random = createDeterministicRandom('ash-harbor-4c-broken-surf')
  const fragments: FoamFragment[] = []
  const landing = FUTURE_LCAC_APPROACHES.map((p) => reservePath('future-approach', p, 21))
  // Only exposed natural beach contacts. Engineered harbor shores deliberately
  // receive no surf; the existing wake/pollution geometry keeps its ordering.
  for (let edge = 1; edge < BEACH_COAST.length; edge++) {
    const a = BEACH_COAST[edge - 1]!,
      b = BEACH_COAST[edge]!
    const dx = b[0] - a[0],
      dz = b[1] - a[1],
      length = Math.hypot(dx, dz)
    for (let distance = 25; distance < length - 25; distance += 55 + random() * 55) {
      const segmentLength = 18 + random() * 35,
        width = 2.5 + random() * 3.5
      const offshore = 1.5 + random() * 5.5 + width / 2
      const x = a[0] + (dx * distance) / length + (dz / length) * offshore
      const z = a[1] + (dz * distance) / length - (dx / length) * offshore
      const points = orientedPatch(x, z, segmentLength, width, Math.atan2(-dz, dx) + (random() - 0.5) * 0.08)
      if (points.some((p) => pointInPolygon(...p, MAINLAND_POLYGON_XZ)) || landing.some((r) => intersectsReservation(x, z, Math.hypot(segmentLength, width) / 2, r))) continue
      fragments.push({ points, phase: random() * Math.PI * 2 })
    }
  }
  return fragments
}
export function createFoamGeometry() {
  const positions: number[] = [],
    uvs: number[] = [],
    phases: number[] = []
  for (const f of createShoreFoamLayout()) {
    for (const index of [0, 2, 1, 0, 3, 2]) {
      const p = f.points[index]!
      positions.push(p[0], 0.012, p[1])
      uvs.push(index === 1 || index === 2 ? 1 : 0, index >= 2 ? 1 : 0)
      phases.push(f.phase)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('foamPhase', new Float32BufferAttribute(phases, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
export function createWetShoreGeometry() {
  const parts: BufferGeometry[] = []
  for (let i = 1; i < BEACH_COAST.length; i++) {
    const a = BEACH_COAST[i - 1]!,
      b = BEACH_COAST[i]!
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]),
      nx = -(b[1] - a[1]) / length,
      nz = (b[0] - a[0]) / length
    // Narrow visual wet zone on the existing land surface; no altered tide,
    // height or collision. Irregular inland edge breaks up the dry-sand border.
    const steps = Math.ceil(length / 45)
    for (let j = 0; j < steps; j++) {
      const p = (j + 0.0) / steps,
        q = (j + 1) / steps
      const ax = a[0] + (b[0] - a[0]) * p,
        az = a[1] + (b[1] - a[1]) * p
      const bx = a[0] + (b[0] - a[0]) * q,
        bz = a[1] + (b[1] - a[1]) * q
      const aw = 22 + 9 * Math.sin(ax * 0.014),
        bw = 22 + 9 * Math.sin(bx * 0.014)
      const points: readonly XZPoint[] = [
        [ax + nx * 1.5, az + nz * 1.5],
        [bx + nx * 1.5, bz + nz * 1.5],
        [bx + nx * bw, bz + nz * bw],
        [ax + nx * aw, az + nz * aw],
      ]
      if (FUTURE_LCAC_APPROACHES.some((path) => intersectsReservation((ax + bx) / 2, (az + bz) / 2, 40, reservePath('future-ramp', path, 21)))) continue
      const g = createTerrainSurfaceGeometry(points, 0.018)
      const position = g.getAttribute('position'),
        wet: number[] = []
      for (let k = 0; k < position.count; k++) wet.push(Math.min(1, distanceToPolyline(position.getX(k), position.getZ(k), BEACH_COAST) / Math.max(aw, bw)))
      g.setAttribute('wetEdge', new Float32BufferAttribute(wet, 1))
      parts.push(g)
    }
  }
  const merged = mergeGeometries(parts) ?? new BufferGeometry()
  parts.forEach((p) => p.dispose())
  merged.computeBoundingSphere()
  return merged
}
