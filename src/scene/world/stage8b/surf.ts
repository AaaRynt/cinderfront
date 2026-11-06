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
export const EAST_FRONTAGE = { ...EAST_SURF, minX: 5515, maxX: 5680, inland: 14, taper: 0 } as const
const SURF_SITES = { pocket: EAST_SURF, frontage: EAST_FRONTAGE } as const
export type SurfSite = keyof typeof SURF_SITES

// The fitted landing grade gives way to a steep exposed bank. Only the shallow
// seam has a landward sheet; beyond it the wash spends its energy at the toe.
const FRONTAGE_WIDTH_M = EAST_FRONTAGE.maxX - EAST_FRONTAGE.minX
const FRONTAGE_RIM_END_M = 9
export function frontageRimAt(u: number) {
  return EAST_FRONTAGE.inland * (1 - MathUtils.smoothstep(u * FRONTAGE_WIDTH_M, 2, FRONTAGE_RIM_END_M))
}

const BREAK_PHASE = 0.42
const RUNUP_PHASE = 0.67
const END_PHASE = 0.96
const BREAK_AT = -5.7
const SWELL_START = -49
const PHASE_STAGGER = 0.15
const EDGE_FEATHER = 0.17
const FRONTAGE_LAG = PHASE_STAGGER - 0.015 * Math.sin(6.1)

export function eastSurfXZ(u: number, d: number, site: SurfSite = 'pocket'): XZPoint {
  const { minX, maxX, taper } = SURF_SITES[site]
  const x = MathUtils.lerp(minX + Math.max(0, d) * taper, maxX, u)
  return [x, landingCoastZ(x) + d]
}

export function sampleSurf(u: number, runtime: number, site: SurfSite = 'pocket') {
  const lag = site === 'frontage' ? FRONTAGE_LAG : 0
  const phase = MathUtils.euclideanModulo(localMotionTime(runtime) / SURF_PERIOD_SECONDS - PHASE_STAGGER * u + 0.015 * Math.sin(6.1 * u) - lag, 1)
  const openRunup = 16.5 + 1.4 * Math.sin(11.1 * u + 0.4) + 1.3 * Math.sin(23.4 * u + 1.2)
  const runup = site === 'frontage' ? Math.min(openRunup, frontageRimAt(u) - 2.0) : openRunup
  const front = phase < BREAK_PHASE ? MathUtils.lerp(SWELL_START, BREAK_AT, phase / BREAK_PHASE) : phase < RUNUP_PHASE ? MathUtils.lerp(BREAK_AT, runup, 1 - (1 - (phase - BREAK_PHASE) / (RUNUP_PHASE - BREAK_PHASE)) ** 1.55) : MathUtils.lerp(runup, BREAK_AT, MathUtils.smoothstep(phase, RUNUP_PHASE, END_PHASE))
  const swell = MathUtils.smoothstep(phase, 0.015, 0.13) * (1 - MathUtils.smoothstep(phase, 0.46, 0.64))
  const breaking = MathUtils.smoothstep(phase, 0.28, BREAK_PHASE) * (1 - MathUtils.smoothstep(phase, 0.51, 0.65))
  const wash = MathUtils.smoothstep(phase, 0.35, 0.51) * (1 - MathUtils.smoothstep(phase, 0.9, 0.98))
  const damp = 1 - MathUtils.smoothstep(phase, 0.02, 0.35) * (1 - MathUtils.smoothstep(phase, 0.55, 0.69))
  return { phase, runup, front, swell, breaking, wash, damp }
}

export function surfShader(site: SurfSite) {
  const strip = SURF_SITES[site]
  const frontage = site === 'frontage'
  const rim = frontage
    ? `float eastSurfRim(float u) {
         return ${EAST_FRONTAGE.inland.toFixed(1)} * (1.0 - smoothstep(2.0, ${FRONTAGE_RIM_END_M.toFixed(1)}, u * ${FRONTAGE_WIDTH_M.toFixed(1)}));
       }`
    : ''
  const inlandEdge = frontage ? 'smoothstep(eastSurfRim(coord.x) - 2.0, eastSurfRim(coord.x), coord.y)' : 'smoothstep(20.0, 22.0, coord.y)'
  return `
  uniform float uLocalMotionTime;
  varying vec2 vEastSurf;
  struct EastSurfState { float phase; float runup; float front; float swell; float breaking; float wash; float damp; };
  ${rim}

  EastSurfState eastSurfState(float u) {
    float p = fract(uLocalMotionTime / ${SURF_PERIOD_SECONDS.toFixed(1)} - ${PHASE_STAGGER} * u + 0.015 * sin(6.1 * u)${frontage ? ` - ${FRONTAGE_LAG.toFixed(8)}` : ''});
    float runup = 16.5 + 1.4 * sin(11.1 * u + 0.4) + 1.3 * sin(23.4 * u + 1.2);
    ${frontage ? 'runup = min(runup, eastSurfRim(u) - 2.0);' : ''}
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
    float taperedSide = max(0.0, coord.y) * ${(strip.taper / (strip.maxX - strip.minX)).toPrecision(17)};
    return smoothstep(0.0, ${frontage ? 0.055 : EDGE_FEATHER}, min(coord.x - taperedSide, 1.0 - coord.x))
      * smoothstep(-${strip.offshore.toFixed(1)}, -43.0, coord.y)
      * (1.0 - ${inlandEdge});
  }

  float eastRidge(float d, float breaking) {
    float width = d < 0.0 ? mix(11.5, 7.5, breaking) : mix(6.6, 2.9, breaking);
    return pow(1.0 - smoothstep(0.0, width, abs(d)), 1.45);
  }

  float eastFilm(float rel, EastSurfState state) {
    return state.wash * smoothstep(-24.0, -7.0, rel) * (1.0 - smoothstep(-0.45, 1.6, rel));
  }
`
}

export function createEastSurfGeometry(wet: boolean, site: SurfSite = 'pocket') {
  const geometry = new BufferGeometry()
  const strip = SURF_SITES[site]
  const frontage = site === 'frontage'
  const nx = frontage ? 90 : 36
  const offshoreDensity = frontage ? 1 : 2
  const offshoreRows = wet ? 0 : strip.offshore * offshoreDensity
  // The still contact point is a row in both grids.
  const nz = offshoreRows + strip.inland * 2
  const seamColumns = 18
  const columns = Array.from({ length: nx + 1 }, (_, i) => {
    if (!frontage) return { u: i / nx, rim: strip.inland }
    // Half-metre stations follow the rapidly rising grade at the seam.
    const station = i <= seamColumns ? (i / seamColumns) * FRONTAGE_RIM_END_M : MathUtils.lerp(FRONTAGE_RIM_END_M, FRONTAGE_WIDTH_M, (i - seamColumns) / (nx - seamColumns))
    const u = station / FRONTAGE_WIDTH_M
    return { u, rim: frontageRimAt(u) }
  })
  const positions: number[] = []
  const uv: number[] = []
  const indices: number[] = []
  for (let j = 0; j <= nz; j++) {
    const rowD = j < offshoreRows ? (j - offshoreRows) / offshoreDensity : (j - offshoreRows) / 2
    for (let i = 0; i <= nx; i++) {
      const { u, rim } = columns[i]!
      const d = frontage && rowD > 0 ? (rowD * rim) / strip.inland : rowD
      const [x, z] = eastSurfXZ(u, d, site)
      // The exact boundary belongs to the water row. Sample the fitted
      // mainland only from inside it, where float32 edge rounding is harmless.
      const y = d <= 0 ? MEAN_SEA_LEVEL : Math.max(MEAN_SEA_LEVEL, getLandingGroundHeight(x, z))
      positions.push(x, y + strip.drapeLift, z)
      uv.push((x - strip.minX) / (strip.maxX - strip.minX), d)
      if (i > 0 && j > 0 && (rowD <= 0 || rim + columns[i - 1]!.rim > 0)) {
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
    geometry.boundingBox!.max.y += strip.maximumLift
    geometry.boundingSphere!.radius += strip.maximumLift
  }
  return geometry
}
