import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from 'three'

import { createDeterministicRandom } from '../stage2/environment/seededLayout'

type Point = readonly [number, number, number]
/** Small opaque, vertex-colored meshes. No textures, alpha cards or leaf objects. */
class MeshWriter {
  positions: number[] = []
  colors: number[] = []
  triangle(a: Point, b: Point, c: Point, tint: string, shade = 1) {
    this.positions.push(...a, ...b, ...c)
    const color = new Color(tint).multiplyScalar(shade)
    for (let i = 0; i < 3; i++) this.colors.push(color.r, color.g, color.b)
  }
  branch(a: Point, b: Point, radius: number, tip: number, tint: string, sides = 3) {
    const start = new Vector3(...a),
      end = new Vector3(...b),
      direction = end.clone().sub(start).normalize()
    const u = new Vector3(0, 0, 1).cross(direction).normalize()
    if (u.lengthSq() < 0.01) u.set(1, 0, 0)
    const v = direction.clone().cross(u).normalize()
    const ring = (center: Vector3, r: number, i: number): Point =>
      center
        .clone()
        .addScaledVector(u, Math.cos((i * Math.PI * 2) / sides) * r)
        .addScaledVector(v, Math.sin((i * Math.PI * 2) / sides) * r)
        .toArray()
    for (let i = 0; i < sides; i++) {
      const p = ring(start, radius, i),
        q = ring(start, radius, i + 1),
        r = ring(end, tip, i),
        s = ring(end, tip, i + 1)
      this.triangle(p, q, r, tint, 0.85 + i * 0.05)
      this.triangle(q, s, r, tint, 0.85 + i * 0.05)
    }
  }
  leaf(center: Point, angle: number, length: number, width: number, tint: string, rise = 0.04) {
    const [x, y, z] = center,
      dx = (Math.cos(angle) * length) / 2,
      dz = (Math.sin(angle) * length) / 2,
      nx = (-Math.sin(angle) * width) / 2,
      nz = (Math.cos(angle) * width) / 2
    const a: Point = [x - dx, y, z - dz],
      b: Point = [x + nx, y + rise, z + nz],
      c: Point = [x + dx, y + 0.03, z + dz],
      d: Point = [x - nx, y + rise, z - nz]
    this.triangle(a, b, c, tint)
    this.triangle(a, c, d, tint, 0.88)
  }
  geometry() {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(this.positions, 3))
    geometry.setAttribute('color', new Float32BufferAttribute(this.colors, 3))
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    return geometry
  }
}
function fitWidth(geometry: BufferGeometry, radius = 0.49) {
  geometry.computeBoundingBox()
  const b = geometry.boundingBox!,
    e = Math.max(Math.abs(b.min.x), Math.abs(b.max.x), Math.abs(b.min.z), Math.abs(b.max.z))
  geometry.scale(radius / e, 1, radius / e)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}
export function createGrassGeometry(variant = 0, origin: 'root' | 'center' = 'root') {
  const random = createDeterministicRandom(`6a:grass:${variant}`),
    mesh = new MeshWriter()
  for (let i = 0; i < 11; i++) {
    const a = random() * Math.PI * 2,
      r = Math.sqrt(random()) * 0.31,
      x = Math.cos(a) * r,
      z = Math.sin(a) * r
    const width = 0.009 + random() * 0.018,
      h = 0.48 + random() * 0.5,
      lean = 0.12 + random() * 0.13,
      dx = Math.cos(a) * width,
      dz = Math.sin(a) * width
    const p: Point = [x - dx, -0.055, z - dz],
      q: Point = [x + dx, -0.055, z + dz],
      l: Point = [x + lean * 0.38 - dx * 0.42, h * 0.57, z + lean * 0.26 - dz * 0.42],
      r2: Point = [x + lean * 0.38 + dx * 0.42, h * 0.57, z + lean * 0.26 + dz * 0.42],
      t: Point = [x + lean, h, z + lean * 0.72]
    mesh.triangle(p, q, l, '#a59976', 0.78 + random() * 0.15)
    mesh.triangle(q, r2, l, '#c2b58f')
    mesh.triangle(l, r2, t, '#e0cd9d', 0.8 + random() * 0.2)
  }
  const geometry = fitWidth(mesh.geometry())
  if (origin === 'center') geometry.translate(0, -0.5, 0)
  return geometry
}
export function createScrubGeometry(variant = 0, origin: 'root' | 'center' = 'root') {
  const random = createDeterministicRandom(`6a:scrub:${variant}`),
    mesh = new MeshWriter()
  const root: Point = [0, -0.06, 0],
    fork: Point = [0.02, 0.26, 0.01]
  mesh.branch(root, fork, 0.043, 0.025, '#88745a')
  for (let i = 0; i < 5; i++) {
    const a = i * 2.399 + variant * 0.8,
      reach = 0.24 + random() * 0.19,
      end: Point = [Math.cos(a) * reach, 0.4 + random() * 0.4, Math.sin(a) * reach]
    mesh.branch(fork, end, 0.021, 0.006, '#8e8064')
    const leaves = i < 3 ? 3 : 2
    for (let j = 0; j < leaves; j++) {
      const center: Point = [end[0] * 0.88, end[1] - 0.05 + j * 0.055, end[2] * 0.88]
      mesh.leaf(center, a + j * 1.7, 0.25 + random() * 0.12, 0.1 + random() * 0.07, j % 2 ? '#b0b18e' : '#8d9974', 0.055)
    }
  }
  const geometry = fitWidth(mesh.geometry())
  if (origin === 'center') geometry.translate(0, -0.5, 0)
  return geometry
}

/** Three overlapping angular strata, closed embedded bases, chipped shoulders.
 * Every vertex stays inside the historical half-width/half-depth square. */
export function createRockGeometry(variant = 0) {
  const random = createDeterministicRandom(`6a:fracture:${variant}`),
    mesh = new MeshWriter()
  for (let slab = 0; slab < 3; slab++) {
    const radius = slab === 0 ? 0.43 : variant === 1 && slab === 2 ? 0.12 : 0.19 + random() * 0.06,
      x = (slab - 1) * 0.18,
      z = (random() - 0.5) * 0.35,
      h = slab === 0 ? (variant === 0 ? 0.72 : 0.52) : variant === 1 && slab === 2 ? 0.15 : 0.19 + random() * 0.3,
      n = variant === 0 ? 5 : 6
    const bottom: Point[] = [],
      shoulder: Point[] = [],
      fracture: Point[] = [],
      top: Point[] = []
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + 0.2,
        r = radius * (0.86 + random() * 0.14)
      bottom.push([x + Math.cos(a) * r, -0.1, z + Math.sin(a) * r * 0.76])
      shoulder.push([x + Math.cos(a) * r * 0.97, h * (0.1 + random() * 0.06), z + Math.sin(a) * r * 0.74])
      fracture.push([x + Math.cos(a) * r * (0.82 + random() * 0.12) + 0.025, h * (0.42 + random() * 0.13), z + Math.sin(a) * r * 0.65])
      top.push([x + Math.cos(a) * r * (variant === 0 ? 0.61 : 0.74) + 0.035, h * (0.81 + random() * 0.19), z + Math.sin(a) * r * 0.53])
    }
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n,
        tint = j % 2 ? '#c4beb0' : '#a9a28f'
      mesh.triangle(bottom[j]!, bottom[k]!, shoulder[j]!, tint, 0.75)
      mesh.triangle(bottom[k]!, shoulder[k]!, shoulder[j]!, tint, 0.82)
      mesh.triangle(shoulder[j]!, shoulder[k]!, fracture[j]!, tint, 0.9)
      mesh.triangle(shoulder[k]!, fracture[k]!, fracture[j]!, '#c8c0aa', 0.9)
      mesh.triangle(fracture[j]!, fracture[k]!, top[j]!, tint)
      mesh.triangle(fracture[k]!, top[k]!, top[j]!, tint, 0.94)
      if (j > 0 && j < n - 1) {
        mesh.triangle(top[0]!, top[j]!, top[k]!, '#d2c9b7', 0.94 + random() * 0.06)
        mesh.triangle(bottom[0]!, bottom[k]!, bottom[j]!, '#a9a28f', 0.8)
      }
    }
  }
  for (let i = 0; i < mesh.positions.length; i += 9)
    for (let axis = 0; axis < 3; axis++) {
      const k = i + 3 + axis,
        l = i + 6 + axis
      ;[mesh.positions[k], mesh.positions[l]] = [mesh.positions[l]!, mesh.positions[k]!]
      ;[mesh.colors[k], mesh.colors[l]] = [mesh.colors[l]!, mesh.colors[k]!]
    }
  return fitWidth(mesh.geometry())
}

export type TreeForm = 'upright' | 'wind'
export function createTreeGeometry(form: TreeForm, variant: number) {
  const random = createDeterministicRandom(`6a:tree:${form}:${variant}`),
    wood = new MeshWriter(),
    leaves = new MeshWriter()
  const lean = form === 'wind' ? 0.2 : 0.055
  const trunk: Point[] = [
    [0, -0.065, 0],
    [0.025, 0.32, 0.008],
    [lean * 0.65, 0.59, 0.025],
    [lean, 0.84, 0.04],
  ]
  for (let i = 0; i < 3; i++) wood.branch(trunk[i]!, trunk[i + 1]!, [0.032, 0.023, 0.012][i]!, [0.023, 0.012, 0.004][i]!, '#887b64', 5)
  // Root flares terminate below the terrain datum; no detached canopy lobes.
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.4
    wood.branch([0, 0.08, 0], [Math.cos(a) * 0.11, -0.065, Math.sin(a) * 0.11], 0.025, 0.008, '#847359')
  }
  for (let i = 0; i < 7; i++) {
    const a = i * 2.399 + variant * 0.9,
      y = 0.4 + i * 0.055,
      reach = 0.18 + random() * 0.16,
      end: Point = [lean + Math.cos(a) * reach, y + 0.16 + random() * 0.13, Math.sin(a) * reach * 0.82]
    const from: Point = [lean * y, y, 0.02]
    wood.branch(from, end, 0.013 - i * 0.0009, 0.004, '#97856a', 4)
    for (let j = 0; j < 2; j++) {
      const b = a + (j - 0.5) * 1.1,
        tip: Point = [end[0] + Math.cos(b) * 0.13, end[1] + 0.08 + random() * 0.05, end[2] + Math.sin(b) * 0.1]
      wood.branch(end, tip, 0.005, 0.0015, '#a7977a')
      for (let k = 0; k < 3; k++) {
        const u = 0.55 + k * 0.18,
          c: Point = [end[0] + (tip[0] - end[0]) * u, end[1] + (tip[1] - end[1]) * u, end[2] + (tip[2] - end[2]) * u]
        leaves.leaf(c, b + k * 1.9, 0.12 + random() * 0.07, 0.05 + random() * 0.04, k % 2 ? '#b2ac82' : '#7b8960', 0.018)
      }
    }
  }
  return { wood: wood.geometry(), leaves: leaves.geometry() }
}
