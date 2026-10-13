import { LANDING_COAST_POINTS } from '../world/landing/landingSiteData'

const glsl = (n: number) => (Number.isInteger(n) ? `${n}.0` : String(n))
/** CPU contact and fragment masks use the identical unchanged coast vertices. */
export const LANDING_EFFECT_MASK_GLSL = `
  float coast;
  ${LANDING_COAST_POINTS.slice(1)
    .map((b, i) => {
      const a = LANDING_COAST_POINTS[i]!
      return `${i === 0 ? 'if' : i === LANDING_COAST_POINTS.length - 2 ? 'else' : 'else if'}${i === LANDING_COAST_POINTS.length - 2 ? '' : `(vLandingXZ.x < ${glsl(b[0])})`} coast=mix(${glsl(a[1])},${glsl(b[1])},(vLandingXZ.x-${glsl(a[0])})/${glsl(b[0] - a[0])});`
    })
    .join('\n')}
  float inland=smoothstep(-0.25,0.25,vLandingXZ.y-coast);
  diffuseColor.a *= mix(1.0-inland,inland,step(0.5,vLandingKind));`
