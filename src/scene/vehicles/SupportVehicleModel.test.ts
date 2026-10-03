import * as THREE from 'three'
import { describe, expect, it } from 'vitest'

import type { SupportSubtype } from '../../simulation/supportConvoyTypes'

import { SUPPORT_DIMENSIONS, SUPPORT_WHEEL_RADIUS_METERS } from '../../simulation/supportConvoy'
import { SUPPORT_AXLE_Z, SUPPORT_MATERIALS, supportModelParts } from './SupportVehicleGeometry'

describe('support vehicle geometry and human visibility contract', () => {
  it('measures every subtype at truck scale with grounded wheels, closed cabs and distinct stowed equipment', () => {
    const cues = { fire_engine: 'stowed-hose-reel', engineering_truck: 'folded-engineering-boom', recovery_vehicle: 'folded-tow-boom', logistics_truck: 'sealed-tarp-load' }
    for (const subtype of Object.keys(SUPPORT_DIMENSIONS) as SupportSubtype[]) {
      const dimensions = SUPPORT_DIMENSIONS[subtype]
      const parts = supportModelParts(subtype)
      const group = new THREE.Group()
      for (const part of parts) {
        const mesh = new THREE.Mesh(part.geometry ?? new THREE.BoxGeometry(1, 1, 1), part.material)
        mesh.position.set(...part.position)
        mesh.scale.set(...part.scale)
        if (part.rotation) mesh.rotation.set(...part.rotation)
        group.add(mesh)
      }
      for (const side of [-1, 1])
        for (const z of SUPPORT_AXLE_Z) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(SUPPORT_WHEEL_RADIUS_METERS, SUPPORT_WHEEL_RADIUS_METERS, 0.3, 16))
          wheel.rotation.z = Math.PI / 2
          wheel.position.set(side * (dimensions.width / 2 - 0.15), SUPPORT_WHEEL_RADIUS_METERS - dimensions.height / 2, z)
          group.add(wheel)
        }
      const bounds = new THREE.Box3().setFromObject(group, true)
      const size = bounds.getSize(new THREE.Vector3())
      expect(size.x).toBeCloseTo(dimensions.width, 5)
      expect(size.z).toBeCloseTo(dimensions.length, 5)
      expect(bounds.min.y).toBeCloseTo(-dimensions.height / 2, 5)
      expect(bounds.max.y).toBeLessThan(dimensions.height / 2)
      expect(parts.map((part) => part.name)).toContain(cues[subtype])
      expect(parts.some((part) => /seat|driver|occupant|crew|worker|human|turret|weapon/.test(part.name))).toBe(false)
      expect(parts.filter((part) => part.name.includes('opaque')).length).toBe(3)
    }
  })

  it('uses entirely opaque reflective glazing and shared restrained materials with two cargo variations', () => {
    expect(SUPPORT_MATERIALS.glass.transparent).toBe(false)
    expect(SUPPORT_MATERIALS.glass.opacity).toBe(1)
    expect(SUPPORT_MATERIALS.glass.metalness).toBeGreaterThan(0.8)
    expect(SUPPORT_MATERIALS.fire.roughness).toBeGreaterThan(0.7)
    const load = (alternate: boolean) => supportModelParts('logistics_truck', alternate).find((part) => part.name === 'sealed-tarp-load')!
    expect(load(false).material).toBe(SUPPORT_MATERIALS.tarp)
    expect(load(true).material).toBe(SUPPORT_MATERIALS.tarpAlternate)
    expect(load(false).scale).toEqual(load(true).scale)
  })
})
