import { BoxGeometry, BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute, LatheGeometry, Vector2 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import { LCAC_SKIRT_PERIMETER, LAV_DIMENSIONS } from '@/simulation/landingCraftData'

import type { PlanformPoint } from './modelGeometry'

type Point = readonly [number, number, number]
type Tint = string | ((x: number, y: number, z: number) => string)

function paint(geometry: BufferGeometry, tint: Tint) {
  const positions = geometry.getAttribute('position')
  const colors = new Float32Array(positions.count * 3)
  const color = new Color()
  for (let i = 0; i < positions.count; i++) {
    color.set(typeof tint === 'string' ? tint : tint(positions.getX(i), positions.getY(i), positions.getZ(i))).toArray(colors, i * 3)
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return geometry
}

function box([x, y, z]: Point, [width, height, length]: Point, tint: string) {
  return paint(new BoxGeometry(width, height, length).translate(x, y, z), tint)
}

function join(parts: BufferGeometry[]) {
  const solids = parts.map((part) => {
    const solid = part.index ? part.toNonIndexed() : part
    if (solid !== part) part.dispose()
    solid.deleteAttribute('uv')
    return solid
  })
  const geometry = mergeGeometries(solids)!
  solids.forEach((solid) => solid.dispose())
  return geometry
}

function clippedPlan(halfWidth: number, front: number, back: number, corner: number): PlanformPoint[] {
  return [
    [-halfWidth + corner, front],
    [halfWidth - corner, front],
    [halfWidth, front + corner],
    [halfWidth, back - corner],
    [halfWidth - corner, back],
    [-halfWidth + corner, back],
    [-halfWidth, back - corner],
    [-halfWidth, front + corner],
  ]
}

interface ArmorSection {
  y: number
  plan: readonly PlanformPoint[]
  color: string
}

/** Closed, faceted sections. A color belongs to the plate above its section. */
function platedShell(sections: readonly ArmorSection[]) {
  const positions: number[] = []
  const colors: number[] = []
  const color = new Color()
  const ring = ({ y, plan }: ArmorSection): Point[] => plan.map(([x, z]) => [x, y, z])
  const rings = sections.map(ring)
  const n = sections[0]!.plan.length
  const triangle = (a: Point, b: Point, c: Point) => {
    positions.push(...a, ...b, ...c)
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b)
  }
  const lower = rings[0]!
  color.set(sections[0]!.color)
  for (let i = 1; i < n - 1; i++) triangle(lower[0]!, lower[i]!, lower[i + 1]!)
  for (let level = 0; level < rings.length - 1; level++) {
    const a = rings[level]!
    const b = rings[level + 1]!
    color.set(sections[level]!.color)
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      triangle(a[i]!, b[i]!, b[j]!)
      triangle(a[i]!, b[j]!, a[j]!)
    }
  }
  const top = rings.at(-1)!
  color.set(sections.at(-1)!.color)
  for (let i = 1; i < n - 1; i++) triangle(top[0]!, top[i + 1]!, top[i]!)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

export function createLavHull() {
  return platedShell([
    { y: 0.68, plan: clippedPlan(1.12, -3.195, 3.195, 0.22), color: '#515744' },
    { y: 1.14, plan: clippedPlan(1.13, -2.64, 3.1, 0.2), color: '#656e52' },
    { y: 1.45, plan: clippedPlan(1.2, -2.275, 3.05, 0.2), color: '#747b59' },
    { y: 1.65, plan: clippedPlan(1.25, -2.05, 3.02, 0.22), color: '#858a64' },
  ])
}

export function createLavTurret() {
  return platedShell([
    { y: -0.34, plan: clippedPlan(0.76, -0.77, 0.8, 0.35), color: '#46513e' },
    { y: -0.2, plan: clippedPlan(0.86, -0.83, 0.85, 0.38), color: '#656d51' },
    { y: 0.27, plan: clippedPlan(0.68, -0.59, 0.72, 0.29), color: '#7b8461' },
    { y: 0.34, plan: clippedPlan(0.62, -0.53, 0.66, 0.26), color: '#89906a' },
  ])
}

/** Wheel openings stop above the full tire sweep at maximum upward travel. */
function wheelArches(side: number) {
  const outline: [number, number][] = []
  for (const axle of LAV_DIMENSIONS.axleZ) {
    outline.push([axle - 0.58, 1.29], [axle - 0.38, 1.37], [axle, 1.42], [axle + 0.38, 1.37], [axle + 0.58, 1.29])
  }
  const span = [[-2.48, 1.38], ...outline.filter(([z]) => z > -2.48), [2.78, 1.29]]
  const positions: number[] = []
  for (let i = 0; i < span.length - 1; i++) {
    const [z0, y0] = span[i]!
    const [z1, y1] = span[i + 1]!
    const a: Point = [side * 1.247, y0, z0]
    const b: Point = [side * 1.247, y1, z1]
    const c: Point = [side * 1.22, 1.515, z1]
    const d: Point = [side * 1.22, 1.515, z0]
    const e: Point = [side * 1.075, y0, z0]
    const f: Point = [side * 1.075, y1, z1]
    const g: Point = [side * 1.075, 1.515, z0]
    const h: Point = [side * 1.075, 1.515, z1]
    if (side > 0) positions.push(...a, ...d, ...c, ...a, ...c, ...b, ...e, ...a, ...b, ...e, ...b, ...f, ...g, ...h, ...c, ...g, ...c, ...d)
    else positions.push(...a, ...c, ...d, ...a, ...b, ...c, ...e, ...b, ...a, ...e, ...f, ...b, ...g, ...c, ...h, ...g, ...d, ...c)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return paint(geometry, (_x, y) => (y > 1.5 ? '#69724f' : '#414a38'))
}

export function createLavArches() {
  return join([-1, 1].map(wheelArches))
}

export function createLavFittings() {
  const parts = [
    box([0, 0.78, 0], [2.21, 0.4, 5.48], '#373f32'),
    paint(new CylinderGeometry(0.77, 0.79, 0.093, 12).translate(0, 1.666, -0.02), '#444f3e'),
    box([0, 2.31, -0.78], [0.51, 0.29, 0.46], '#4c5544'),
    box([-0.43, 2.37, -0.57], [0.29, 0.18, 0.22], '#596251'),
    paint(new CylinderGeometry(0.303, 0.32, 0.259, 12).translate(0.25, 2.5, 0.25), '#566248'),
    paint(new CylinderGeometry(0.244, 0.27, 0.176, 10).translate(-0.29, 2.43, 0.24), '#667253'),
    box([0.72, 1.676, 1.64], [0.62, 0.052, 1.34], '#545e4b'),
    box([-0.69, 1.668, 1.89], [0.62, 0.036, 1.05], '#697350'),
  ]
  for (const side of [-1, 1]) {
    parts.push(box([side * 0.88, 1.25, -2.55], [0.28, 0.17, 0.18], '#46513c'), box([side * 0.88, 1.264, -2.644], [0.16, 0.066, 0.025], '#b7b79a'), box([side * 0.56, 1.34, 3.06], [0.8, 0.47, 0.1], '#697353'), box([side * 0.94, 1.415, 3.08], [0.116, 0.094, 0.06], '#79483e'))
  }
  for (const z of [1.2, 1.36, 1.52, 1.68, 1.84, 2.0, 2.16]) parts.push(box([0.72, 1.707, z], [0.51, 0.012, 0.067], '#343d34'))
  return join(parts)
}

export function createLavWheel() {
  const { wheelRadius, wheelWidth } = LAV_DIMENSIONS
  // Only paint changes. The original cylinder positions, index, UVs and normals remain exact.
  const wheel = new CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20)
  return paint(wheel, (x, _y, z) => {
    if (Math.hypot(x, z) < 0.45) return '#303733'
    return Math.sin(8 * Math.atan2(x, z)) > 0.35 ? '#39413b' : '#2b322d'
  })
}

export function createLavWheelFace() {
  // The outer rim, dish and bolts fit within the previous marker's 0.171 m reach.
  const hub = [paint(new CylinderGeometry(0.269, 0.287, 0.023, 12).translate(0, 0.152, 0), '#77806d'), paint(new CylinderGeometry(0.211, 0.229, 0.012, 12).translate(0, 0.16, 0), '#495747'), paint(new CylinderGeometry(0.108, 0.132, 0.018, 10).translate(0, 0.161, 0), '#8c9380')]
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    hub.push(paint(new CylinderGeometry(0.016, 0.02, 0.007, 4).translate(0.159 * Math.cos(angle), 0.167, 0.159 * Math.sin(angle)), '#a5aa95'))
  }
  return join(hub).rotateZ(-Math.PI / 2)
}

export function createLcacSkirt() {
  const perimeter = [...LCAC_SKIRT_PERIMETER, LCAC_SKIRT_PERIMETER[0]!]
  const distance = [0]
  for (let i = 1; i < perimeter.length; i++) {
    const [x, z] = perimeter[i]!
    const [px, pz] = perimeter[i - 1]!
    distance.push(distance[i - 1]! + Math.hypot(x - px, z - pz))
  }
  // Keep the original bottom and top anchor rings and the low center bow lip.
  const bands = [
    [0, 1, 1],
    [0.25, 1, 1],
    [0.59, 0.994, 0.996],
    [0.83, 0.984, 0.991],
    [1, 0.97, 0.985],
  ] as const
  const positions: number[] = []
  const indices: number[] = []
  const uv: number[] = []
  const n = perimeter.length
  for (const [height, width, length] of bands) {
    for (const [i, [x, z]] of perimeter.entries()) {
      const top = z < -12 && Math.abs(x) < 4.2 ? 0.55 : 1.35
      positions.push(x * width, top * height, z * length)
      uv.push(distance[i]! / distance[n - 1]!, height)
    }
  }
  for (let row = 0; row < bands.length - 1; row++) {
    for (let i = 0; i < n - 1; i++) {
      const a = row * n + i
      const b = a + n
      indices.push(a, b, b + 1, a, b + 1, a + 1)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const normals = geometry.getAttribute('normal')
  for (let row = 0; row < bands.length; row++) {
    const a = row * n
    const b = a + n - 1
    const x = normals.getX(a) + normals.getX(b)
    const y = normals.getY(a) + normals.getY(b)
    const z = normals.getZ(a) + normals.getZ(b)
    const length = Math.hypot(x, y, z)
    normals.setXYZ(a, x / length, y / length, z / length)
    normals.setXYZ(b, x / length, y / length, z / length)
  }
  return geometry
}

export function createLcacMachinery() {
  const parts = [
    platedShell([
      { y: -0.42, plan: clippedPlan(1.29, -9.95, 10.53, 0.29), color: '#545b52' },
      { y: -0.14, plan: clippedPlan(1.42, -10.04, 10.67, 0.31), color: '#7e8477' },
      { y: 0.09, plan: clippedPlan(1.39, -10.03, 10.66, 0.31), color: '#94998a' },
    ]),
    box([1.396, -0.045, 0.33], [0.043, 0.105, 19.56], '#4b554c'),
    box([0.08, 0.53, -5.58], [2.34, 0.88, 4.94], '#7a8275'),
    box([0.12, 0.973, -5.59], [2.27, 0.13, 4.75], '#939a8d'),
    platedShell([
      { y: 0.1, plan: clippedPlan(1.2, -2.85, 5.8, 0.22), color: '#6d796e' },
      { y: 1.1, plan: clippedPlan(1.19, -2.83, 5.77, 0.22), color: '#879285' },
      { y: 1.61, plan: clippedPlan(0.97, -2.02, 5.16, 0.23), color: '#9da796' },
    ]),
    box([0.08, 0.55, 7.84], [2.31, 0.92, 3.65], '#778477'),
    box([0.1, 1.01, 7.85], [2.25, 0.16, 3.45], '#909c90'),
    box([0.03, 1.617, 0.88], [1.61, 0.026, 3.98], '#535f55'),
  ]
  for (const z of [-0.82, -0.34, 0.14, 0.62, 1.1, 1.58, 2.06, 2.54]) parts.push(box([0.03, 1.647, z], [1.51, 0.052, 0.116], '#a7aea0'))
  for (const z of [-6.96, -4.89, 3.08, 4.61, 7.62, 8.92]) {
    parts.push(box([1.255, 0.6, z], [0.055, 0.44, 1.09], '#515d53'), box([1.284, 0.66, z], [0.022, 0.085, 0.78], '#839083'))
  }
  return join(parts)
}

export function createLcacCabin() {
  return join([
    platedShell([
      { y: -1.2, plan: clippedPlan(1.21, -1.875, 1.875, 0.12), color: '#6e7c73' },
      { y: 0.02, plan: clippedPlan(1.225, -1.875, 1.875, 0.12), color: '#879589' },
      { y: 0.95, plan: clippedPlan(1.225, -1.875, 1.875, 0.12), color: '#9aa498' },
      { y: 1.2, plan: clippedPlan(1.16, -1.75, 1.76, 0.18), color: '#89988e' },
    ]),
    box([0, 1.228, 0], [2.55, 0.095, 3.78], '#9da89d'),
    box([0, 0.52, -1.879], [2.16, 0.96, 0.042], '#495750'),
    box([1.228, 0.52, -0.64], [0.047, 0.96, 1.97], '#495750'),
    box([1.234, -0.44, 0.62], [0.044, 0.79, 0.81], '#9ba79b'),
    box([1.258, -0.44, 0.36], [0.044, 0.063, 0.23], '#4c5b52'),
  ])
}

export function createLcacFan() {
  const sleeve = [
    [2.03, -0.175],
    [2.21, -0.175],
    [2.25, -0.115],
    [2.25, 0.115],
    [2.2, 0.175],
    [2.02, 0.175],
    [2.02, -0.12],
    [2.03, -0.175],
  ]
  const shell = paint(
    new LatheGeometry(
      sleeve.map(([r, z]) => new Vector2(r, z)),
      40,
    ),
    (x, y, z) => {
      if (Math.hypot(x, z) < 2.035) return '#505e55'
      return Math.abs(y) > 0.16 ? '#aab5a8' : '#7c8b81'
    },
  ).rotateX(Math.PI / 2)
  const supports = Array.from({ length: 4 }, (_, i) => paint(new BoxGeometry(0.115, 1.72, 0.048).translate(0, 1.16, 0.147).rotateZ((i * Math.PI) / 2 + Math.PI / 4), '#778980'))
  return join([shell, ...supports])
}
