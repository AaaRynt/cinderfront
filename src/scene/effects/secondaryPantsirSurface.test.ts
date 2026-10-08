import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { deriveSecondaryPantsirState } from '@/simulation/secondaryPantsir'

import { getTerrainHeight } from '../world/stage2/terrainModel'
import { createSecondaryPantsirScorch } from './secondaryPantsirSurface'

describe('secondary Pantsir damage surface', () => {
  it('grounds the complete scorch triangles on the actual gravel surface across terrain diagonals', () => {
    const hit = deriveSecondaryPantsirState(121)
    const geometry = createSecondaryPantsirScorch(hit.destruction.groundPosition, hit.pose.rotation.y)
    const position = geometry.getAttribute('position')
    const indices = geometry.index!
    expect(indices.count).toBeGreaterThan(30)
    const sample = (index: number) => new Vector3().fromBufferAttribute(position, indices.getX(index))
    for (let index = 0; index < indices.count; index += 3) {
      const a = sample(index)
      const b = sample(index + 1)
      const c = sample(index + 2)
      expect(b.clone().sub(a).cross(c.clone().sub(a)).y).toBeGreaterThan(0)
      for (const weights of [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [0.33, 0.33, 0.34],
        [0.2, 0.55, 0.25],
        [0.65, 0.05, 0.3],
      ]) {
        const point = a.clone().multiplyScalar(weights[0]!).addScaledVector(b, weights[1]!).addScaledVector(c, weights[2]!)
        expect(Math.abs(point.y - getTerrainHeight(point.x, point.z) - 0.435)).toBeLessThan(0.0001)
      }
    }
    const uv = geometry.getAttribute('uv')
    expect(Array.from(uv.array).every((value) => value >= -0.0001 && value <= 1.0001)).toBe(true)
    geometry.dispose()
  })

  it('reconstructs one fixed wreck stain independent of post-impact seeking age', () => {
    const sample = (time: number) => {
      const state = deriveSecondaryPantsirState(time)
      return createSecondaryPantsirScorch(state.destruction.groundPosition, state.pose.rotation.y)
    }
    const impact = sample(121)
    for (const time of [121.1, 125, 133, 172, 176]) {
      const late = sample(time)
      expect(late.getAttribute('position').array).toEqual(impact.getAttribute('position').array)
      expect(late.index!.array).toEqual(impact.index!.array)
      late.dispose()
    }
    impact.dispose()
  })
})
