import * as THREE from 'three'
import { describe, expect, it } from 'vitest'

import { SU30_DAMAGE_OFFSET, SU30_DIMENSIONS, SU30_ENGINE_OFFSETS } from '../../simulation/su30ModelData.ts'
import { SU30_MODEL_PARTS } from './Su30MkkGeometry.ts'

function modelBounds() {
  const root = new THREE.Group()
  for (const part of SU30_MODEL_PARTS) {
    const mesh = new THREE.Mesh(part.geometry, part.material)
    if (part.position) mesh.position.set(...part.position)
    if (part.rotation) mesh.rotation.set(...part.rotation)
    if (part.scale) mesh.scale.set(...part.scale)
    root.add(mesh)
  }
  return new THREE.Box3().setFromObject(root, true)
}

describe('Su-30MKK reusable airframe', () => {
  it('measures the actual geometry at authoritative centered meter-scale bounds', () => {
    const bounds = modelBounds()
    const size = bounds.getSize(new THREE.Vector3())
    expect(size.x).toBeCloseTo(SU30_DIMENSIONS.wingspan, 5)
    expect(size.y).toBeCloseTo(SU30_DIMENSIONS.height, 5)
    expect(size.z).toBeCloseTo(SU30_DIMENSIONS.length, 5)
    expect(bounds.getCenter(new THREE.Vector3()).length()).toBeLessThan(0.00001)
    expect(bounds.min.z).toBeCloseTo(-10.97, 5)
  })

  it('shares mirrored resources and preserves the twin-engine channel and extended boom', () => {
    const part = (name: string) => SU30_MODEL_PARTS.find((entry) => entry.name === name)!
    for (const name of ['wing-root', 'wing', 'stabilizer', 'fin', 'intake', 'nacelle', 'nozzle']) {
      expect(part(`left-${name}`).geometry).toBe(part(`right-${name}`).geometry)
      expect(part(`left-${name}`).material).toBe(part(`right-${name}`).material)
    }
    expect(SU30_ENGINE_OFFSETS.right.x - SU30_ENGINE_OFFSETS.left.x).toBe(3.7)
    expect(part('tail-boom').geometry.boundingBox!.max.z).toBeGreaterThan(SU30_ENGINE_OFFSETS.right.z + 2)
    expect(part('left-nacelle').geometry.boundingBox!.max.x).toBeLessThan(1)
    expect(part('right-nacelle').geometry.boundingBox!.max.x).toBeLessThan(1)
    expect(part('left-fin').rotation).toEqual(part('right-fin').rotation)
  })

  it('keeps glazing opaque and damage confined to the attached starboard aft engine', () => {
    const canopy = SU30_MODEL_PARTS.find((part) => part.name === 'canopy')!
    expect(canopy.material.transparent).toBe(false)
    expect(canopy.material.opacity).toBe(1)
    expect(SU30_MODEL_PARTS.filter((part) => part.damagedSurface).map((part) => part.name)).toEqual(['right-aft-nacelle', 'right-nozzle'])
    expect(SU30_DAMAGE_OFFSET.x).toBe(SU30_ENGINE_OFFSETS.right.x)
    expect(SU30_DAMAGE_OFFSET.z).toBeLessThan(SU30_ENGINE_OFFSETS.right.z)
    expect(SU30_MODEL_PARTS.some((part) => /canard|seat|pilot|occupant|crew|gear/.test(part.name))).toBe(false)
  })
})
