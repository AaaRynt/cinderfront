import { describe, expect, it } from 'vitest'

import { createRoadRibbonGeometry } from './worldGeometry.ts'

describe('world ribbon geometry', () => {
  it('faces upward so roads remain visible from spectator cameras', () => {
    const geometry = createRoadRibbonGeometry(
      [
        [0, 10, 0],
        [0, 12, 100],
      ],
      12,
    )
    const positions = geometry.getAttribute('position')
    const index = geometry.index!
    for (let offset = 0; offset < index.count; offset += 3) {
      const a = index.getX(offset)
      const b = index.getX(offset + 1)
      const c = index.getX(offset + 2)
      const abX = positions.getX(b) - positions.getX(a)
      const abZ = positions.getZ(b) - positions.getZ(a)
      const acX = positions.getX(c) - positions.getX(a)
      const acZ = positions.getZ(c) - positions.getZ(a)
      expect(abZ * acX - abX * acZ).toBeGreaterThan(0)
    }
  })
})
