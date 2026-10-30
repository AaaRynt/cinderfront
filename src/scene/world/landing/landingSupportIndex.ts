import type { BufferGeometry } from 'three'

import { finishConstruction, type Construction } from '../../../initialization/cooperative'
import { inLandingGrade } from './landingSiteData'

// The uploaded geometry is immutable. Float64 constants retain the original
// subtraction, denominator and barycentric operation order without rounding.
interface SurfaceCells {
  readonly minX: number
  readonly minZ: number
  readonly width: number
  readonly height: number
  readonly offsets: Uint32Array
  readonly triangles: Uint32Array
}
export interface SurfaceIndex {
  readonly geometry: BufferGeometry
  readonly constants: Float64Array
  readonly cells: SurfaceCells
  readonly exteriorCells?: SurfaceCells
}
/** A compact, immutable row index replaces hundreds of thousands of string
 * keys and per-cell arrays. Candidate triangle order is exactly the historical
 * insertion order, so barycentric selection and every support value stay exact. */
function* surfaceCellsWork(ranges: readonly (readonly [number, number, number, number, number])[]): Construction<SurfaceCells> {
  let visited = 0
  if (!ranges.length) return { minX: 0, minZ: 0, width: 0, height: 0, offsets: new Uint32Array(1), triangles: new Uint32Array() }
  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity
  for (const [, x0, x1, z0, z1] of ranges) {
    if (++visited % 256 === 0) yield
    minX = Math.min(minX, x0)
    maxX = Math.max(maxX, x1)
    minZ = Math.min(minZ, z0)
    maxZ = Math.max(maxZ, z1)
  }
  const width = maxX - minX + 1,
    height = maxZ - minZ + 1,
    offsets = new Uint32Array(width * height + 1)
  for (const [, x0, x1, z0, z1] of ranges) {
    if (++visited % 256 === 0) yield
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) offsets[(x - minX) * height + z - minZ + 1]!++
  }
  for (let i = 1; i < offsets.length; i++) {
    if (i % 1024 === 0) yield
    offsets[i]! += offsets[i - 1]!
  }
  const triangles = new Uint32Array(offsets[offsets.length - 1]!),
    cursor = offsets.slice(0, -1)
  for (const [triangle, x0, x1, z0, z1] of ranges) {
    if (++visited % 256 === 0) yield
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) triangles[cursor[(x - minX) * height + z - minZ]!++] = triangle
  }
  return { minX, minZ, width, height, offsets, triangles }
}
export function* indexSurfaceWork(geometry: BufferGeometry, localOnly = true): Construction<SurfaceIndex> {
  const p = geometry.getAttribute('position'),
    count = geometry.index?.count ?? p.count,
    constants = new Float64Array((count / 3) * 10)
  const local: (readonly [number, number, number, number, number])[] = [],
    exterior: (readonly [number, number, number, number, number])[] = []
  const vertexIndex = (n: number) => geometry.index?.getX(n) ?? n
  for (let i = 0; i < count; i += 3) {
    if (i % 768 === 0) yield
    const ids = [vertexIndex(i), vertexIndex(i + 1), vertexIndex(i + 2)],
      xs = ids.map((k) => p.getX(k)),
      zs = ids.map((k) => p.getZ(k))
    const range = (step: number): readonly [number, number, number, number, number] => [i, Math.floor(Math.min(...xs) / step), Math.floor(Math.max(...xs) / step), Math.floor(Math.min(...zs) / step), Math.floor(Math.max(...zs) / step)]
    const [a, b, c] = ids as [number, number, number],
      ax = p.getX(a),
      az = p.getZ(a),
      bx = p.getX(b),
      bz = p.getZ(b),
      cx = p.getX(c),
      cz = p.getZ(c)
    constants.set([cx, cz, bz - cz, cx - bx, cz - az, ax - cx, (bz - cz) * (ax - cx) + (cx - bx) * (az - cz), p.getY(a), p.getY(b), p.getY(c)], (i / 3) * 10)
    if (ids.some((k) => inLandingGrade(p.getX(k), p.getZ(k), 2))) local.push(range(2))
    if (!localOnly) exterior.push(range(64))
  }
  return { geometry, constants, cells: yield* surfaceCellsWork(local), exteriorCells: localOnly ? undefined : yield* surfaceCellsWork(exterior) }
}
export function indexSurface(geometry: BufferGeometry, localOnly = true): SurfaceIndex {
  return finishConstruction(indexSurfaceWork(geometry, localOnly))
}
export function sampleSurface(surface: SurfaceIndex, x: number, z: number): number | undefined {
  const exterior = !inLandingGrade(x, z) && surface.exteriorCells,
    step = exterior ? 64 : 2,
    cells = exterior || surface.cells,
    ix = Math.floor(x / step) - cells.minX,
    iz = Math.floor(z / step) - cells.minZ
  if (!Number.isFinite(ix) || !Number.isFinite(iz) || ix < 0 || ix >= cells.width || iz < 0 || iz >= cells.height) return undefined
  const cell = ix * cells.height + iz,
    values = surface.constants
  // Iterate the original compact range directly, without allocating a cell view.
  for (let n = cells.offsets[cell]!; n < cells.offsets[cell + 1]!; n++) {
    const i = (cells.triangles[n]! / 3) * 10,
      den = values[i + 6]!
    if (Math.abs(den) < 1e-10) continue
    const cx = values[i]!,
      cz = values[i + 1]!,
      wa = (values[i + 2]! * (x - cx) + values[i + 3]! * (z - cz)) / den,
      wb = (values[i + 4]! * (x - cx) + values[i + 5]! * (z - cz)) / den,
      wc = 1 - wa - wb
    if (wa >= -1e-6 && wb >= -1e-6 && wc >= -1e-6) return wa * values[i + 7]! + wb * values[i + 8]! + wc * values[i + 9]!
  }
  return undefined
}
