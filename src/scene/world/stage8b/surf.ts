import { BufferGeometry, Float32BufferAttribute, MathUtils } from 'three'

import type { XZPoint } from '../worldData'

import { getLandingGroundHeight, landingCoastZ } from '../landing/landingTerrain'
import { MEAN_SEA_LEVEL } from '../stage4c/coastalWater'
import { SURF_PERIOD_SECONDS, localMotionTime } from './motionClock'

export const EAST_SURF = {
  minX: 5458,
  maxX: 5515,
  offshore: 54,
  inland: 22,
  taper: 0.45,
  drapeLift: 0.026,
  maximumLift: 1.14,
} as const

const BREAK_PHASE = 0.42
const RUNUP_PHASE = 0.67
const END_PHASE = 0.96
const BREAK_AT = -5.7
const SWELL_START = -49
const PHASE_STAGGER = 0.15
const EDGE_FEATHER = 0.17

export function eastSurfXZ(u: number, d: number): XZPoint {
  const x = MathUtils.lerp(EAST_SURF.minX + Math.max(0, d) * EAST_SURF.taper, EAST_SURF.maxX, u)
  return [x, landingCoastZ(x) + d]
}

export function sampleSurf(u: number, runtime: number) {
  const phase = MathUtils.euclideanModulo(localMotionTime(runtime) / SURF_PERIOD_SECONDS - PHASE_STAGGER * u + 0.015 * Math.sin(6.1 * u), 1)
  const runup = 16.5 + 1.4 * Math.sin(11.1 * u + 0.4) + 1.3 * Math.sin(23.4 * u + 1.2)
  const front = phase < BREAK_PHASE ? MathUtils.lerp(SWELL_START, BREAK_AT, phase / BREAK_PHASE) : phase < RUNUP_PHASE ? MathUtils.lerp(BREAK_AT, runup, 1 - (1 - (phase - BREAK_PHASE) / (RUNUP_PHASE - BREAK_PHASE)) ** 1.55) : MathUtils.lerp(runup, BREAK_AT, MathUtils.smoothstep(phase, RUNUP_PHASE, END_PHASE))
  const swell = MathUtils.smoothstep(phase, 0.015, 0.13) * (1 - MathUtils.smoothstep(phase, 0.46, 0.64))
  const breaking = MathUtils.smoothstep(phase, 0.28, BREAK_PHASE) * (1 - MathUtils.smoothstep(phase, 0.51, 0.65))
  const wash = MathUtils.smoothstep(phase, 0.35, 0.51) * (1 - MathUtils.smoothstep(phase, 0.9, 0.98))
  const damp = 1 - MathUtils.smoothstep(phase, 0.02, 0.35) * (1 - MathUtils.smoothstep(phase, 0.55, 0.69))
  return { phase, runup, front, swell, breaking, wash, damp }
}

export const SURF_GLSL = `
  uniform float uLocalMotionTime;
  varying vec2 vEastSurf;
  struct EastSurfState { float phase; float runup; float front; float swell; float breaking; float wash; float damp; };

  EastSurfState eastSurfState(float u) {
    float p = fract(uLocalMotionTime / ${SURF_PERIOD_SECONDS.toFixed(1)} - ${PHASE_STAGGER} * u + 0.015 * sin(6.1 * u));
    float runup = 16.5 + 1.4 * sin(11.1 * u + 0.4) + 1.3 * sin(23.4 * u + 1.2);
    float front = p < ${BREAK_PHASE}
      ? mix(${SWELL_START.toFixed(1)}, ${BREAK_AT}, p / ${BREAK_PHASE})
      : p < ${RUNUP_PHASE}
        ? mix(${BREAK_AT}, runup, 1.0 - pow(1.0 - (p - ${BREAK_PHASE}) / (${RUNUP_PHASE} - ${BREAK_PHASE}), 1.55))
        : mix(runup, ${BREAK_AT}, smoothstep(${RUNUP_PHASE}, ${END_PHASE}, p));
    float swell = smoothstep(0.015, 0.13, p) * (1.0 - smoothstep(0.46, 0.64, p));
    float breaking = smoothstep(0.28, ${BREAK_PHASE}, p) * (1.0 - smoothstep(0.51, 0.65, p));
    float wash = smoothstep(0.35, 0.51, p) * (1.0 - smoothstep(0.90, 0.98, p));
    float damp = 1.0 - smoothstep(0.02, 0.35, p) * (1.0 - smoothstep(0.55, 0.69, p));
    return EastSurfState(p, runup, front, swell, breaking, wash, damp);
  }

  float eastSurfEdge(vec2 coord) {
    float taperedSide = max(0.0, coord.y) * ${EAST_SURF.taper / (EAST_SURF.maxX - EAST_SURF.minX)};
    return smoothstep(0.0, ${EDGE_FEATHER}, min(coord.x - taperedSide, 1.0 - coord.x))
      * smoothstep(-${EAST_SURF.offshore.toFixed(1)}, -43.0, coord.y)
      * (1.0 - smoothstep(20.0, ${EAST_SURF.inland.toFixed(1)}, coord.y));
  }

  float eastRidge(float d, float breaking) {
    float width = d < 0.0 ? mix(11.5, 7.5, breaking) : mix(6.6, 2.9, breaking);
    return pow(1.0 - smoothstep(0.0, width, abs(d)), 1.45);
  }

  float eastFilm(float rel, EastSurfState state) {
    return state.wash * smoothstep(-24.0, -7.0, rel) * (1.0 - smoothstep(-0.45, 1.6, rel));
  }
`

export function createEastSurfGeometry(wet: boolean) {
  const geometry = new BufferGeometry()
  const minD = wet ? 0 : -EAST_SURF.offshore
  const nx = 36
  // The still contact point is a row in both grids.
  const nz = (EAST_SURF.inland - minD) * 2
  const positions: number[] = []
  const uv: number[] = []
  const indices: number[] = []
  for (let j = 0; j <= nz; j++) {
    const d = minD + j / 2
    for (let i = 0; i <= nx; i++) {
      const [x, z] = eastSurfXZ(i / nx, d)
      // The exact boundary belongs to the water row. Sample the fitted
      // mainland only from inside it, where float32 edge rounding is harmless.
      const y = d <= 0 ? MEAN_SEA_LEVEL : Math.max(MEAN_SEA_LEVEL, getLandingGroundHeight(x, z))
      positions.push(x, y + EAST_SURF.drapeLift, z)
      uv.push((x - EAST_SURF.minX) / (EAST_SURF.maxX - EAST_SURF.minX), d)
      if (i > 0 && j > 0) {
        const a = (j - 1) * (nx + 1) + i - 1
        indices.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2)
      }
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  if (!wet) {
    geometry.boundingBox!.max.y += EAST_SURF.maximumLift
    geometry.boundingSphere!.radius += EAST_SURF.maximumLift
  }
  return geometry
}
