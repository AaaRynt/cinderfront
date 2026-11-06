import { BoxGeometry, BufferGeometry, Color, Float32BufferAttribute, IcosahedronGeometry, LatheGeometry, PlaneGeometry, Quaternion, TorusGeometry, Vector2, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import type { DetailKind } from './detailLayout'

import { createGrassGeometry, createRockGeometry, createScrubGeometry, createTreeGeometry, type TreeForm } from '../landscape/landscapeGeometry'
import { createDeterministicRandom } from '../stage2/environment/seededLayout'

function colored(source: BufferGeometry, tint: string | ((x: number, y: number, z: number) => Color)) {
  const geometry = source.index ? source.toNonIndexed() : source
  if (source !== geometry) source.dispose()
  const p = geometry.getAttribute('position')
  const solid = typeof tint === 'string' ? new Color(tint) : undefined
  const colors = []
  for (let i = 0; i < p.count; i++) {
    const c = typeof tint === 'function' ? tint(p.getX(i), p.getY(i), p.getZ(i)) : solid!
    colors.push(c.r, c.g, c.b)
  }
  geometry.deleteAttribute('uv')
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
}

function join(parts: BufferGeometry[]) {
  const merged = mergeGeometries(parts)!
  parts.forEach((geometry) => geometry.dispose())
  return merged
}

function box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, lean = 0) {
  return colored(new BoxGeometry(w, h, d).rotateZ(lean).translate(x, y, z), color)
}

function brace(a: Vector3, b: Vector3, width: number, tint: string) {
  const direction = b.clone().sub(a)
  const center = a.clone().lerp(b, 0.5)
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())
  return colored(new BoxGeometry(width, direction.length(), width).applyQuaternion(rotation).translate(center.x, center.y, center.z), tint)
}

/** Crown lobes follow the existing branch tips. The original open sprays break
 * the edges of the denser, low-poly foliage. Roots and crown fit as one batch. */
function fullerTree(form: TreeForm, variant: number) {
  const { wood, leaves } = createTreeGeometry(form, variant)
  const random = createDeterministicRandom(`8a:canopy:${form}`)
  const leaf = leaves.getAttribute('position')
  const parts = [wood, leaves]
  const shades = ['#687655', '#7a8259', '#8c9067', '#9c9e73']
  for (let i = 0; i < leaf.count; i += 18) {
    const center = new Vector3()
    for (let j = i; j < i + 18; j++) center.add(new Vector3().fromBufferAttribute(leaf, j))
    center.multiplyScalar(1 / 18)
    const lobe = new IcosahedronGeometry(1, i % 54 === 0 ? 0 : 1)
    const p = lobe.getAttribute('position')
    const phase = random() * 8
    for (let v = 0; v < p.count; v++) {
      const x = p.getX(v),
        y = p.getY(v),
        z = p.getZ(v)
      const r = 1 + 0.23 * Math.sin(9 * x + 4 * z + phase) * Math.cos(5 * y - 4 * z)
      p.setXYZ(v, x * r, y * r, z * r)
    }
    const radius = 0.102 + random() * 0.088
    lobe.scale(radius * (form === 'wind' ? 1.55 : 1.08), radius * (0.43 + random() * 0.36), radius)
    lobe.rotateY(random() * 2)
    lobe.translate(center.x, center.y + 0.016, center.z)
    lobe.computeVertexNormals()
    parts.push(colored(lobe, (_x, y) => new Color(shades[Math.min(3, Math.max(0, Math.floor(((y - center.y) / radius) * 2 + 1.8)))]!)))
  }
  return join(parts)
}

function shelter() {
  const parts = [box(0, 0.02, 0, 8.75, 0.21, 5.4, '#827c6c'), box(-0.35, 0.135, 0.38, 7.94, 0.052, 4.46, '#70685a')]
  for (const x of [-4.05, 3.85]) {
    for (const z of [-2.38, 2.38]) {
      const top = 3.15 - z * 0.125
      parts.push(box(x, 0.14, z, 0.48, 0.28, 0.5, '#989080'))
      parts.push(box(x, top * 0.5, z, 0.19, top, 0.19, '#4d5047'))
      parts.push(brace(new Vector3(x, top - 1.05, z), new Vector3(x * 0.8, top - 0.14, z), 0.11, '#665c4c'))
    }
    parts.push(brace(new Vector3(x, 3.45, -2.64), new Vector3(x, 2.82, 2.66), 0.16, '#665747'))
  }
  for (const z of [-2.64, -0.3, 2.57]) {
    parts.push(box(-0.25, 3.16 - z * 0.125, z, 9.2, 0.16, 0.17, '#625647'))
  }
  // The back and short western return retain only part of their cladding.
  for (let slat = 0; slat < 20; slat++) {
    const x = -4 + slat * 0.38
    const height = slat < 15 ? 2.46 : 1.13 - (slat - 15) * 0.15
    parts.push(box(x, 0.19 + height * 0.5, 2.42, 0.355, height, 0.09, ['#656c66', '#75766b', '#7e7764', '#856956'][slat % 4]!))
  }
  for (let slat = 0; slat < 6; slat++) parts.push(box(-4.06, 1.33, 0.15 + slat * 0.39, 0.09, 2.3, 0.37, slat % 2 ? '#737666' : '#737063'))

  // Raised corrugations, uneven edges and a missing sheet at the east end.
  const random = createDeterministicRandom('8a:inspection-roof')
  const roofColors = ['#8f7660', '#b18265', '#b19477', '#837d70', '#989289', '#85766c', '#837565', '#a4755e', '#827f70']
  for (let rib = 0; rib < 54; rib++) {
    const x = -4.72 + rib * 0.165
    const length = rib >= 48 ? 3.3 + random() * 0.72 : 5.98 + random() * 0.3
    const z = (length - 6) * 0.5
    const y = 3.3 - z * 0.125 + (rib % 2) * 0.038
    const panel = new BoxGeometry(0.172, 0.06, length).rotateX(Math.atan(0.125)).translate(x, y, z)
    const tint = new Color(roofColors[Math.floor(rib / 6)]!).multiplyScalar(0.83 + random() * 0.25)
    parts.push(colored(panel, (_x, height, depth) => tint.clone().lerp(new Color('#895d43'), 0.19 + 0.15 * Math.sin(depth * 1.65 + height))))
  }
  // Shelving and one pale peg rail survive inside the open bay.
  parts.push(box(-2.45, 0.9, 1.93, 2.4, 0.13, 0.56, '#796d5b'), box(-3.5, 0.46, 1.93, 0.13, 0.83, 0.45, '#5b5647'), box(-1.4, 0.46, 1.93, 0.13, 0.83, 0.45, '#5b5647'))
  parts.push(box(-2.45, 1.78, 2.34, 2.4, 0.22, 0.06, '#9c8e71'))
  return join(parts)
}

function oilDrum() {
  const profile = [
    [0, 0],
    [0.25, 0],
    [0.28, 0.018],
    [0.28, 0.054],
    [0.265, 0.065],
    [0.266, 0.27],
    [0.288, 0.29],
    [0.287, 0.328],
    [0.266, 0.349],
    [0.266, 0.582],
    [0.288, 0.603],
    [0.287, 0.637],
    [0.266, 0.66],
    [0.266, 0.834],
    [0.282, 0.845],
    [0.282, 0.884],
    [0.255, 0.884],
    [0.244, 0.862],
    [0, 0.862],
  ]
  const steel = new Color('#969087')
  const rust = new Color('#8d5236')
  const cylinder = colored(
    new LatheGeometry(
      profile.map(([x, y]) => new Vector2(x, y)),
      14,
    ),
    (x, y, z) => steel.clone().lerp(rust, 0.44 + 0.33 * Math.sin(x * 10 + z * 9 + y * 16) ** 2 + 0.13 * Math.cos(y * 29)),
  )
  return join([cylinder, box(0.13, 0.87, 0, 0.06, 0.024, 0.065, '#57463b')])
}

export const SIGN_PANELS = {
  corridor: { w: 3.05, h: 1.39, y: 2.05, z: -0.049 },
  beach: { w: 1.48, h: 0.87, y: 1.26, z: -0.044 },
} as const

function signBack(site: keyof typeof SIGN_PANELS) {
  const { w, h, y, z } = SIGN_PANELS[site]
  const post = site === 'corridor' ? 0.115 : 0.086
  return join([box(0, y, 0, w, h, -2 * z - 0.012, site === 'corridor' ? '#72644d' : '#6d7670', 0.018), ...[-0.37, 0.37].map((x) => box(x * w, y * 0.55, 0.048, post, y * 1.1, post, '#675a46', 0.018))])
}

export function createSignFace(site: keyof typeof SIGN_PANELS) {
  const { w, h, y, z } = SIGN_PANELS[site]
  // Face the road. The second image occupies the lower half of the atlas.
  const face = new PlaneGeometry(w - 0.025, h - 0.025)
  const uv = face.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 0.5 + (site === 'corridor' ? 0.5 : 0))
  return face.rotateY(Math.PI).rotateZ(0.018).translate(0, y, z)
}

function footing() {
  return join([
    box(0, 0.02, 0, 3.55, 0.22, 2.72, '#a29a85', -0.018),
    box(-0.18, 0.28, 1.03, 3.07, 0.5, 0.51, '#a9a38d'),
    box(-0.98, 0.33, 0.44, 0.65, 0.57, 0.66, '#a09a82'),
    box(0.28, 0.29, 1.04, 0.53, 0.065, 0.64, '#7a715f'),
    box(-1.4, 0.175, -0.48, 0.55, 0.09, 0.8, '#87816c', -0.04),
    box(0.37, 0.175, 0.15, 1.58, 0.07, 0.23, '#7e7765').rotateY(-0.17),
    colored(new TorusGeometry(0.12, 0.023, 5, 10).translate(-0.26, 0.41, 0.75), '#645746'),
  ])
}

export function createDetailGeometries(): Record<DetailKind, BufferGeometry> {
  const tire = new TorusGeometry(0.37, 0.102, 7, 20).rotateX(Math.PI * 0.5).scale(1, 1.24, 1)
  return {
    grass: join([createGrassGeometry(0), createGrassGeometry(1).rotateY(1.4).scale(0.76, 0.73, 0.76)]),
    scrub: join([createScrubGeometry(1), createScrubGeometry(0).scale(0.76, 0.74, 0.76).rotateY(0.84)]),
    stone: createRockGeometry(1),
    gravel: colored(new IcosahedronGeometry(0.47).scale(1, 0.78, 0.81), '#d3cdbd'),
    upright: fullerTree('upright', 0),
    wind: fullerTree('wind', 1),
    shelter: shelter(),
    drum: oilDrum(),
    tire: colored(tire, (x, y, z) => new Color('#353531').multiplyScalar(0.79 + 0.19 * Math.cos(20 * Math.atan2(z, x)) ** 2 + y * 0.65)),
    'wash-sign': signBack('corridor'),
    'route-sign': signBack('beach'),
    remnant: footing(),
  }
}
