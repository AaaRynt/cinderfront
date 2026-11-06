import { BufferGeometry, Color, Float32BufferAttribute, MathUtils } from 'three'

import { getLandingGroundHeight } from '../landing/landingTerrain'
import { DETAIL_SITES, detailXZ, type DetailSite } from './detailLayout'

type Mark = readonly [along: number, out: number, halfLength: number, halfWidth: number, color: string, opacity: number, heading?: number]

// Laid over the existing surface. The entrance flares into the old hardpack;
// wheel scuffs run in from the upstream end. Beyond it, the open plain shows
// between the wash growth and the scrub behind the bay.
const GROUND_MARKS: Record<DetailSite, readonly Mark[]> = {
  corridor: [
    [-2, 29, 18.2, 6.8, '#6f654c', 0.47, -0.12],
    [-31, 23, 16, 7.5, '#746955', 0.62, -0.13],
    [29, 30, 15, 8, '#786c54', 0.48, 0.19],
    [0.5, 6.9, 53, 5.2, '#9c9686', 0.92, 0],
    [-31, 11.5, 14, 3.0, '#99927f', 0.5, 0.05],
    [6.7, 14, 15, 8.1, '#a29a85', 0.83, -0.51],
    [-1.4, 20, 10.5, 6.8, '#a49981', 0.72, 0.07],
    [8, 14.15, 11, 0.83, '#756b58', 0.55, -0.55],
    [9.4, 15.65, 11, 0.86, '#746b57', 0.51, -0.56],
    [-9.2, 21.25, 2.6, 1.6, '#4f4a38', 0.72, 0.11],
    [-2.3, 23.3, 6.6, 3.65, '#625a46', 0.48, 0.06],
  ],
  beach: [
    [-14, 20.4, 6.8, 5.7, '#877f66', 0.58, 0.12],
    [-0.8, 24.8, 8.9, 5.7, '#8e866c', 0.64, 0.14],
    [12.5, 26.7, 7.6, 4.7, '#948970', 0.58, -0.11],
    [-1.4, 6.3, 24, 3.5, '#a9987c', 0.63, 0.015],
    [-13.8, 9.9, 11, 3.9, '#b5a17c', 0.57, 0.18],
    [3.9, 10.4, 14.2, 5.15, '#baa785', 0.66, -0.09],
    [-0.6, 14.25, 8.8, 2.3, '#ada28a', 0.68, 0.03],
    [3.8, 20.5, 3.3, 2.8, '#746d57', 0.58, 0.05],
  ],
}

export function createDetailGround(site: DetailSite) {
  const {
    bounds: [loU, hiU, loV, hiV],
    surfaceOffset,
  } = DETAIL_SITES[site]
  const marks = GROUND_MARKS[site].map(([u, v, length, width, tint, opacity, heading = 0]) => ({
    u,
    v,
    length,
    width,
    tint: new Color(tint),
    opacity,
    cos: Math.cos(heading),
    sin: Math.sin(heading),
  }))
  const nu = Math.ceil((hiU - loU) / 1.65)
  const nv = Math.ceil((hiV - loV) / 0.9)
  const positions = []
  const colors = []
  const indices = []
  const color = new Color()
  const contribution = new Color()
  for (let row = 0; row <= nv; row++) {
    for (let col = 0; col <= nu; col++) {
      const u = MathUtils.lerp(loU, hiU, col / nu)
      const v = MathUtils.lerp(loV, hiV, row / nv)
      const [x, z] = detailXZ(site, [u, v])
      positions.push(x, getLandingGroundHeight(x, z) + surfaceOffset + 0.035, z)

      color.setRGB(0, 0, 0)
      let alpha = 0
      const ragged = 0.08 * Math.sin(u * 0.83 + v * 0.44) + 0.065 * Math.cos(v * 1.11 - u * 0.39)
      for (const mark of marks) {
        const du = u - mark.u
        const dv = v - mark.v
        const distance = Math.hypot((du * mark.cos + dv * mark.sin) / mark.length, (-du * mark.sin + dv * mark.cos) / mark.width)
        const cover = mark.opacity * (1 - MathUtils.smoothstep(distance + ragged, 0.24, 1))
        color.multiplyScalar(1 - cover).add(contribution.copy(mark.tint).multiplyScalar(cover))
        alpha = cover + alpha * (1 - cover)
      }
      if (alpha > 0) color.multiplyScalar(1 / alpha)
      const edge = MathUtils.smoothstep(Math.min(u - loU, hiU - u, hiV - v), 0, 4)
      colors.push(color.r, color.g, color.b, alpha * edge)
      if (row > 0 && col > 0) {
        const a = (row - 1) * (nu + 1) + col - 1
        indices.push(a, a + nu + 1, a + 1, a + 1, a + nu + 1, a + nu + 2)
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 4))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
