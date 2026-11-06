import { Box3, BufferGeometry, Color, Float32BufferAttribute, ShaderMaterial, Sphere, Vector3 } from 'three'

import type { MotionClock } from './motionClock'

import { getLandingGroundHeight } from '../landing/landingTerrain'
import { detailXZ } from '../stage8a/detailLayout'
import { GUST_PERIOD_SECONDS } from './motionClock'
import { WIND_DIRECTION, WIND_GLSL } from './wind'

export const DUST_START = detailXZ('corridor', [-44, 36])
export const DUST_TRAVEL = 20
export const DUST_RADIUS = 6
export const DUST_PUFFS = 6

function createDustGeometry() {
  const [x, z] = DUST_START
  const endX = x + WIND_DIRECTION[0] * DUST_TRAVEL
  const endZ = z + WIND_DIRECTION[1] * DUST_TRAVEL
  const startY = getLandingGroundHeight(x, z)
  const endY = getLandingGroundHeight(endX, endZ)
  const positions: number[] = []
  const uv: number[] = []
  const seeds: number[] = []
  const indices: number[] = []
  for (let i = 0; i < DUST_PUFFS; i++) {
    for (const [u, v] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      positions.push(x, startY, z)
      uv.push(u!, v!)
      seeds.push(i / DUST_PUFFS)
    }
    const a = i * 4
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setAttribute('dustSeed', new Float32BufferAttribute(seeds, 1))
  geometry.setIndex(indices)
  geometry.boundingBox = new Box3(new Vector3(x - DUST_RADIUS, Math.min(startY, endY) - 1, z - DUST_RADIUS), new Vector3(endX + DUST_RADIUS, Math.max(startY, endY) + 3, endZ + DUST_RADIUS))
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new Sphere())
  return { geometry, rise: endY - startY }
}

export function createVergeDust(clock: MotionClock) {
  const { geometry, rise } = createDustGeometry()
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uLocalMotionTime: clock,
      uDustRise: { value: rise },
      uDustTint: { value: new Color('#c5ac8c') },
    },
    vertexShader: `
      ${WIND_GLSL}
      uniform float uDustRise;
      attribute float dustSeed;
      varying vec2 vDustUv;
      varying float vDustAlpha;
      varying float vDustSeed;
      void main() {
        float age = fract(uLocalMotionTime / ${GUST_PERIOD_SECONDS.toFixed(1)} + dustSeed);
        vec2 crossWind = vec2(-localWindDirection.y, localWindDirection.x);
        float spread = sin(dustSeed * 22.0) * 0.95;
        // Integrate the gust's zero-mean part from birth to this phase. The
        // loop travels exactly one bounded path even with variable wind speed.
        float windRate = localWindTau / ${GUST_PERIOD_SECONDS.toFixed(1)};
        float now = localWindPhase(position.xz);
        float born = now - localWindTau * age;
        float gustDrift = (0.42 * (cos(born) - cos(now)) - 0.0525 * (sin(2.0 * now) - sin(2.0 * born))) / windRate;
        float distance = age * ${DUST_TRAVEL.toFixed(1)} + 0.9 * gustDrift;
        vec2 center = position.xz + localWindDirection * distance + crossWind * spread;
        float altitude = position.y + uDustRise * (distance / ${DUST_TRAVEL.toFixed(1)}) + 0.31 + 0.33 * age;
        vec3 centerView = (modelViewMatrix * vec4(center.x, altitude, center.y, 1.0)).xyz;
        centerView.x += uv.x * (1.7 + 2.95 * age);
        centerView.y += uv.y * (0.29 + 0.62 * age);
        gl_Position = projectionMatrix * vec4(centerView, 1.0);
        vDustUv = uv;
        vDustSeed = dustSeed;
        vDustAlpha = smoothstep(0.03, 0.23, age) * (1.0 - smoothstep(0.58, 0.99, age))
          * (0.15 + 0.85 * localWindGust(position.xz));
      }
    `,
    fragmentShader: `
      uniform vec3 uDustTint;
      varying vec2 vDustUv;
      varying float vDustAlpha;
      varying float vDustSeed;
      void main() {
        float edge = 1.0 - smoothstep(0.0, 1.0, length(vDustUv));
        float folds = 0.66 + 0.34 * cos(vDustUv.x * 7.4 - vDustUv.y * 4.7 + vDustSeed * 34.0);
        gl_FragColor = vec4(uDustTint, 0.34 * vDustAlpha * edge * edge * folds);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  return { geometry, material }
}
