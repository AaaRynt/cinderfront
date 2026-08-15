import { describe, expect, it } from 'vitest'

import { MOLNIYA_DIMENSIONS_METERS, MOLNIYA_HULL_SECTIONS, TALWAR_DIMENSIONS_METERS, TALWAR_HULL_SECTIONS } from './navalModelData'
import { createNavalHullGeometry } from './navalModelShared'

describe('naval hull geometry', () => {
  it.each([
    ['Talwar', TALWAR_HULL_SECTIONS, TALWAR_DIMENSIONS_METERS],
    ['Molniya', MOLNIYA_HULL_SECTIONS, MOLNIYA_DIMENSIONS_METERS],
  ] as const)('keeps the %s hull in raw meters with bow on -Z and waterline at Y=0', (_name, sections, dimensions) => {
    const geometry = createNavalHullGeometry(sections)
    const bounds = geometry.boundingBox

    expect(bounds).not.toBeNull()
    expect(bounds?.min.z).toBeCloseTo(-dimensions.length / 2, 5)
    expect(bounds?.max.z).toBeCloseTo(dimensions.length / 2, 5)
    expect(bounds?.min.x).toBeCloseTo(-dimensions.beam / 2, 5)
    expect(bounds?.max.x).toBeCloseTo(dimensions.beam / 2, 5)
    expect(bounds?.min.y).toBeCloseTo(-dimensions.draft, 5)
    expect(bounds?.max.y).toBeGreaterThan(0)

    geometry.dispose()
  })
})
