import { describe, expect, it } from 'vitest'

import { addRoadShoulder, applyRoadShoulder } from '../landscape/roadShoulder'
import { createStage2Materials } from '../stage2/stage2Materials'
import { createTerrainRoadGeometry } from '../stage2/terrainGeometry'
import { createDistantSeaGeometry } from './distantSea'

describe('render-only surface finish preserves support geometry', () => {
  it('adds road color shoulder data without replacing any support vertex, index or normal', () => {
    const points = [
        [3200, -300],
        [3240, -300],
      ] as const,
      geometry = createTerrainRoadGeometry(points, 10, 0.48)
    const oldAttributes = { ...geometry.attributes },
      index = geometry.index
    const arrays = Object.fromEntries(Object.entries(oldAttributes).map(([name, a]) => [name, Array.from(a.array)]))
    addRoadShoulder(geometry, points, 10)
    expect(geometry.index).toBe(index)
    for (const [name, a] of Object.entries(oldAttributes)) {
      expect(geometry.getAttribute(name)).toBe(a)
      expect(Array.from(a.array)).toEqual(arrays[name])
    }
    expect(geometry.getAttribute('roadShoulder').count).toBe(geometry.getAttribute('position').count)
    expect(Array.from(geometry.getAttribute('roadShoulder').array).every((value) => value >= 0 && value <= 1)).toBe(true)
    geometry.dispose()
  })
  it('owns only eight distant triangles outside the unchanged finite coastal mesh and all land', () => {
    const geometry = createDistantSeaGeometry(),
      p = geometry.getAttribute('position')
    expect(p.count / 3).toBe(8)
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        z = p.getZ(i)
      expect(p.getY(i)).toBeCloseTo(-0.12, 7)
      expect(Math.abs(x) >= 7000 || Math.abs(z) >= 5000).toBe(true)
    }
    for (let i = 0; i < p.count; i += 3) {
      const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3,
        z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3
      expect(Math.abs(x) >= 7000 || Math.abs(z) >= 5000).toBe(true)
    }
    expect(geometry.boundingSphere!.radius).toBeLessThan(85000)
    geometry.dispose()
  })
  it('reuses finite material resources and preserves terrain-normal shader inputs', () => {
    const resources = createStage2Materials(),
      material = resources.asphalt
    expect(material.customProgramCacheKey()).toContain('6c-dusty-edge')
    expect(material.transparent).toBe(false)
    expect(material.displacementMap).toBeNull()
    expect(resources.terrain.flatShading).toBe(false)
    Object.values(resources).forEach((material) => material.dispose())
    expect(typeof applyRoadShoulder).toBe('function')
  })
})
