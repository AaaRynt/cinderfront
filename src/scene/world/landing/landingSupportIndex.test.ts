import { BufferGeometry, Float32BufferAttribute } from 'three'
import { describe, expect, it } from 'vitest'

import { LANDING_SITES, inLandingGrade } from './landingSiteData'
import { indexSurface, sampleSurface } from './landingSupportIndex'

/** Test-only historical attribute-based arithmetic and candidate insertion order. */
function historical(geometry: BufferGeometry, localOnly: boolean, x: number, z: number) {
  const exterior = !inLandingGrade(x, z) && !localOnly,
    step = exterior ? 64 : 2,
    cellX = Math.floor(x / step),
    cellZ = Math.floor(z / step),
    p = geometry.getAttribute('position')
  for (let i = 0; i < (geometry.index?.count ?? p.count); i += 3) {
    const a = geometry.index?.getX(i) ?? i,
      b = geometry.index?.getX(i + 1) ?? i + 1,
      c = geometry.index?.getX(i + 2) ?? i + 2,
      ax = p.getX(a),
      az = p.getZ(a),
      bx = p.getX(b),
      bz = p.getZ(b),
      cx = p.getX(c),
      cz = p.getZ(c)
    if (!exterior && ![a, b, c].some((n) => inLandingGrade(p.getX(n), p.getZ(n), 2))) continue
    if (cellX < Math.floor(Math.min(ax, bx, cx) / step) || cellX > Math.floor(Math.max(ax, bx, cx) / step) || cellZ < Math.floor(Math.min(az, bz, cz) / step) || cellZ > Math.floor(Math.max(az, bz, cz) / step)) continue
    const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz)
    if (Math.abs(den) < 1e-10) continue
    const wa = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / den,
      wb = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / den,
      wc = 1 - wa - wb
    if (wa >= -1e-6 && wb >= -1e-6 && wc >= -1e-6) return wa * p.getY(a) + wb * p.getY(b) + wc * p.getY(c)
  }
  return undefined
}

describe('immutable exact support constants and compact candidate ranges', () => {
  it.each([false, true])('preserves indexed=%s dense, degenerate, shared-edge, overlapping-height and cell-boundary selection', (indexed) => {
    for (const origin of [LANDING_SITES[0]!.beach, LANDING_SITES[1]!.beach, [-128, -64] as const])
      for (const localOnly of [false, true]) {
        const [x, z] = origin,
          values: number[] = []
        // Degenerate first candidate, then sloped adjacent triangles, then a higher
        // overlapping copy. Source order wins; choosing the highest would be wrong.
        values.push(x, 4, z, x, 9, z, x, 12, z)
        for (let dx = -4; dx < 4; dx += 2)
          for (let dz = -4; dz < 4; dz += 2) {
            const a = [x + dx, dx * 0.131 - dz * 0.217, z + dz],
              b = [x + dx + 2, dx * 0.141 + 0.31, z + dz],
              c = [x + dx, dz * -0.219 + 0.43, z + dz + 2],
              d = [x + dx + 2, dx * 0.14 - dz * 0.2 + 0.7, z + dz + 2]
            values.push(...a, ...b, ...c, ...b, ...d, ...c, a[0]!, a[1]! + 100, a[2]!, b[0]!, b[1]! + 100, b[2]!, c[0]!, c[1]! + 100, c[2]!)
          }
        const geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(values, 3))
        if (indexed) geometry.setIndex(Array.from({ length: values.length / 3 }, (_, i) => i))
        const before = Buffer.from(geometry.getAttribute('position').array.buffer).toString('hex'),
          surface = indexSurface(geometry, localOnly)
        for (let dx = -5; dx <= 5; dx += 0.125) for (let dz = -5; dz <= 5; dz += 0.125) expect(sampleSurface(surface, x + dx, z + dz)).toBe(historical(geometry, localOnly, x + dx, z + dz))
        for (const step of [2, 64])
          for (const e of [-1e-7, -1e-12, 0, 1e-12, 1e-7])
            for (let offset = -2; offset <= 2; offset++) {
              const qx = Math.floor(x / step) * step + offset * step + e,
                qz = Math.floor(z / step) * step + e
              expect(sampleSurface(surface, qx, qz)).toBe(historical(geometry, localOnly, qx, qz))
            }
        for (const n of [NaN, Infinity, -Infinity]) expect(sampleSurface(surface, n, z)).toBeUndefined()
        expect(Buffer.from(geometry.getAttribute('position').array.buffer).toString('hex')).toBe(before)
        expect(surface.constants.byteLength).toBe((values.length / 9) * 80)
        geometry.dispose()
      }
  })
  it('owns new constants for replacement geometry without altering retained query results', () => {
    const [x, z] = LANDING_SITES[0]!.beach
    const create = (y: number) => new BufferGeometry().setAttribute('position', new Float32BufferAttribute([x, y, z, x + 4, y, z, x, y, z + 4], 3))
    const a = indexSurface(create(2)),
      b = indexSurface(create(8)),
      old = sampleSurface(a, x + 1, z + 1)
    expect(sampleSurface(b, x + 1, z + 1)).toBe(8)
    expect(sampleSurface(a, x + 1, z + 1)).toBe(old)
    expect(a.constants).not.toBe(b.constants)
    a.geometry.dispose()
    b.geometry.dispose()
  })
})
