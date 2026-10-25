import { isValidElement, type ReactNode } from 'react'
import { InstancedMesh, Matrix4, Quaternion, Vector3, type BufferGeometry, type Material } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { CinematicFuelSmokeField } from '../stage4a/CinematicFuelSmokeField'
import { LayeredFuelFireField } from '../stage4a/LayeredFuelFireField'
import { BoundedSmokeColumn } from './BoundedSmoke'
import { PersistentGroundFires } from './PersistentGroundFires'
import { createSoftFlameMaterial, createSoftSmokeMaterial, SMOKE_PRESENTATION_EXTENT, SOFT_CENTERED_FLAME_GEOMETRY, SOFT_FLAME_GEOMETRY, SOFT_SMOKE_GEOMETRY } from './softParticles'
const layout = vi.hoisted(() => ({ effects: [] as (() => void)[] }))
vi.mock('react', async (original) => ({ ...(await original<typeof import('react')>()), useMemo: <T,>(factory: () => T) => factory(), useRef: (current: unknown) => ({ current }), useLayoutEffect: (fn: () => void) => layout.effects.push(fn) }))
interface PoolProps {
  children?: ReactNode
  args?: [BufferGeometry, Material, number]
  ref?: { current: InstancedMesh | null }
  frustumCulled?: boolean
}
function pools(node: ReactNode): InstancedMesh[] {
  const output: InstancedMesh[] = []
  const append = (node: ReactNode) => {
    if (Array.isArray(node)) {
      node.forEach(append)
      return
    }
    if (!isValidElement<PoolProps>(node)) return
    if (node.type === 'instancedMesh') {
      const mesh = new InstancedMesh(...node.props.args!)
      mesh.frustumCulled = node.props.frustumCulled ?? true
      if (node.props.ref) node.props.ref.current = mesh
      output.push(mesh)
    }
    append(node.props.children)
  }
  append(node)
  layout.effects.splice(0).forEach((fn) => fn())
  return output
}
const sources = [{ id: 'central-bund-hero-cascade', eventTimeSeconds: 92, heightM: 340, origin: [-545, 60, 2050] as const, puffCount: 52 }]
describe('actual shared soft smoke/fire render inputs', () => {
  it('uses two triangles per puff, a bounded 1.35×1.65 visual envelope and owned shared resources', () => {
    expect(SOFT_SMOKE_GEOMETRY.index!.count / 3).toBe(2)
    expect(SOFT_FLAME_GEOMETRY.index!.count / 3).toBe(2)
    expect(SMOKE_PRESENTATION_EXTENT).toEqual([1.35, 1.65])
    expect(SOFT_SMOKE_GEOMETRY.boundingSphere!.radius).toBeCloseTo(Math.hypot(1.35, 1.65), 12)
  })
  it('supports ordinary vehicle wreck meshes and retains their centered flame bases within valid bounds', () => {
    SOFT_CENTERED_FLAME_GEOMETRY.computeBoundingBox()
    expect(SOFT_CENTERED_FLAME_GEOMETRY.boundingBox!.min.toArray()).toEqual([-1, -0.5, 0])
    expect(SOFT_CENTERED_FLAME_GEOMETRY.boundingBox!.max.toArray()).toEqual([1, 0.5, 0])
    expect(SOFT_CENTERED_FLAME_GEOMETRY.boundingSphere!.radius).toBeCloseTo(Math.hypot(1, 0.5), 12)
    for (const material of [createSoftSmokeMaterial('#414944', 0.28), createSoftFlameMaterial('#ed651f', 0.8)]) {
      expect(material.vertexShader).toContain('mat4 particle=modelMatrix;')
      expect(material.vertexShader).toContain('#ifdef USE_INSTANCING')
      expect(material.depthWrite).toBe(false)
      expect(material.depthTest).toBe(true)
      expect(material.forceSinglePass).toBe(true)
      material.dispose()
    }
  })
  it('keeps every authored smoke slot, source anchor, finite bound and backward-seek reconstruction', () => {
    const geometryIds = new Set(),
      materialIds = new Set(),
      snapshots = new Map<number, number[][]>()
    for (const time of [0, 91.9, 92, 109, 132.4, 180, 240, 600, 7200, 132.4, 109, 0]) {
      const meshes = pools(CinematicFuelSmokeField({ sources, timeSeconds: time }))
      expect(meshes).toHaveLength(3)
      expect(meshes.reduce((n, m) => n + m.count, 0)).toBeLessThanOrEqual(52)
      const matrices: number[][] = []
      for (const mesh of meshes) {
        geometryIds.add(mesh.geometry.uuid)
        materialIds.add((mesh.material as Material).uuid)
        expect(mesh.instanceMatrix.count).toBe(52)
        expect((mesh.material as Material).depthWrite).toBe(false)
        expect((mesh.material as Material).depthTest).toBe(true)
        expect((mesh.material as Material).transparent).toBe(true)
        expect(mesh.frustumCulled).toBe(true)
        for (let i = 0; i < mesh.count; i++) {
          const matrix = new Matrix4()
          mesh.getMatrixAt(i, matrix)
          matrices.push([...matrix.elements])
          expect(matrix.elements.every(Number.isFinite)).toBe(true)
          const center = new Vector3(),
            scale = new Vector3()
          matrix.decompose(center, new Quaternion(), scale)
          expect(center.y).toBeGreaterThanOrEqual(65)
          expect(center.y).toBeLessThanOrEqual(405)
          expect(center.distanceTo(new Vector3(...sources[0]!.origin))).toBeLessThan(650)
          for (let yaw = 0; yaw < Math.PI * 2; yaw += Math.PI / 6)
            for (const x of [-1, 1])
              for (const y of [-1, 1]) {
                const p = center
                  .clone()
                  .add(new Vector3(Math.cos(yaw), 0, Math.sin(yaw)).multiplyScalar(x * 1.35 * Math.max(scale.x, scale.z)))
                  .add(new Vector3(0, y * 1.65 * scale.y, 0))
                expect(mesh.boundingSphere!.distanceToPoint(p)).toBeLessThanOrEqual(1e-4)
              }
        }
        mesh.dispose()
      }
      if (snapshots.has(time)) expect(matrices).toEqual(snapshots.get(time))
      else snapshots.set(time, matrices)
    }
    expect(geometryIds.size).toBe(1)
    expect(materialIds.size).toBe(3)
  })
  it('retains local/fuel/ammunition pool limits and departure cutoff', () => {
    for (const profile of ['local', 'fuel', 'ammunition'] as const)
      for (const age of [-1, 0, 6, 80, 600, 7200]) {
        const meshes = pools(BoundedSmokeColumn({ profile, ageSeconds: age, origin: [0, 0, 0], emissionEndAgeSeconds: 270 }))
        expect(meshes.reduce((n, m) => n + m.count, 0)).toBeLessThanOrEqual(profile === 'local' ? 8 : profile === 'fuel' ? 30 : 22)
        if (age === 7200) expect(meshes.every((mesh) => mesh.count === 0)).toBe(true)
        for (const mesh of meshes) {
          expect(mesh.geometry).toBe(SOFT_SMOKE_GEOMETRY)
          mesh.dispose()
        }
      }
  })
  it('keeps persistent flame bases anchored and the existing fixed capacities at late seeks', () => {
    for (const time of [80, 92, 109, 180, 600, 7200]) {
      const fuel = pools(LayeredFuelFireField({ sources: [{ id: 'fire', eventTimeSeconds: 92, phase: 0.7, position: [10, 20, 30], scale: 4.3 }], timeSeconds: time }))
      const ground = pools(PersistentGroundFires({ descriptors: [{ delaySeconds: 0, offset: [0, 0, 0], phase: 0.7, scale: 2 }], origin: [10, 20, 30], eventTimeSeconds: 92, timeSeconds: time }))
      for (const meshes of [fuel, ground]) {
        expect(meshes).toHaveLength(3)
        for (const mesh of meshes) {
          expect(mesh.count).toBe(time < 92 ? 0 : 1)
          expect(mesh.instanceMatrix.count).toBe(1)
        }
        if (time >= 92) {
          const m = new Matrix4()
          meshes[0]!.getMatrixAt(0, m)
          expect(new Vector3().setFromMatrixPosition(m).toArray()).toEqual([10, 20, 30])
          expect(meshes[0]!.geometry).toBe(SOFT_FLAME_GEOMETRY)
        }
        meshes.forEach((mesh) => mesh.dispose())
      }
    }
  })
})
