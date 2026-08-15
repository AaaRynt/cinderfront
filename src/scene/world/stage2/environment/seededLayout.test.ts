import { describe, expect, it } from 'vitest'

import type { XZPoint } from '../../worldData.ts'

import { createEnvironmentResponseGroup } from './responseGroups.ts'
import { createVegetationLayout, isPointInsidePolygon } from './seededLayout.ts'

const TEST_POLYGON = [
  [0, 0],
  [160, 0],
  [160, 120],
  [0, 120],
] as const satisfies readonly XZPoint[]

describe('createVegetationLayout', () => {
  it('reconstructs exactly the same transforms from the same seed', () => {
    const spec = {
      grassCount: 18,
      id: 'test-dry-plain',
      polygonXZ: TEST_POLYGON,
      profile: 'dry_plain' as const,
      scrubCount: 7,
      seed: 'ash-harbor-seed',
      surfaceY: 28,
    }

    expect(createVegetationLayout(spec)).toEqual(createVegetationLayout(spec))
  })

  it('keeps instances inside the patch and outside authored exclusions', () => {
    const exclusionCenter = [80, 60] as const
    const layout = createVegetationLayout({
      exclusions: [{ centerXZ: exclusionCenter, radiusM: 30, type: 'circle' }],
      grassCount: 40,
      id: 'test-exclusion',
      polygonXZ: TEST_POLYGON,
      scrubCount: 15,
      seed: 17,
      surfaceY: (x, z) => 20 + (x + z) * 0.001,
    })

    expect(layout.grass).toHaveLength(40)
    expect(layout.scrub).toHaveLength(15)

    for (const instance of [...layout.grass, ...layout.scrub]) {
      const point = [instance.position[0], instance.position[2]] as const
      expect(isPointInsidePolygon(point, TEST_POLYGON)).toBe(true)
      expect(Math.hypot(point[0] - exclusionCenter[0], point[1] - exclusionCenter[1])).toBeGreaterThan(30)
    }
  })

  it('publishes stable per-instance addresses for a future local response group', () => {
    const responseGroup = createEnvironmentResponseGroup('radar-hill-selected-scrub', 'region_c_radar_hill', 'vegetation', true)
    const layout = createVegetationLayout({
      grassCount: 3,
      id: 'radar-south-slope-cover',
      polygonXZ: TEST_POLYGON,
      responseGroup,
      scrubCount: 2,
      seed: 91,
      surfaceY: 126,
    })

    expect(layout.responseInstances).toHaveLength(5)
    expect(new Set(layout.responseInstances.map((instance) => instance.id)).size).toBe(5)
    expect(layout.responseInstances.every((instance) => instance.responseGroupId === responseGroup.id)).toBe(true)
  })

  it('changes the authored distribution when the seed changes', () => {
    const common = {
      grassCount: 8,
      id: 'seed-comparison',
      polygonXZ: TEST_POLYGON,
      scrubCount: 3,
      surfaceY: 4,
    }

    expect(createVegetationLayout({ ...common, seed: 1 })).not.toEqual(createVegetationLayout({ ...common, seed: 2 }))
  })
})
