import { createHash } from 'node:crypto'
import { isValidElement, type ReactNode } from 'react'
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'

import { deriveSecondaryPantsirState, secondaryPantsirMuzzlePosition } from '@/simulation/secondaryPantsir'

import { PantsirModel, type PantsirModelProps } from './PantsirModel'

interface ObjectProps {
  readonly children?: ReactNode
  readonly geometry?: THREE.BufferGeometry
  readonly material?: THREE.Material
  readonly name?: string
  readonly position?: readonly [number, number, number]
  readonly rotation?: readonly [number, number, number, THREE.EulerOrder?]
  readonly scale?: readonly [number, number, number]
}

/** Materializes the actual declarative meshes, including nested wheel/weapon components. */
function appendElement(parent: THREE.Object3D, node: ReactNode) {
  if (Array.isArray(node)) {
    node.forEach((child) => appendElement(parent, child))
    return
  }
  if (!isValidElement<ObjectProps>(node)) return
  if (typeof node.type === 'function') {
    appendElement(parent, (node.type as (props: ObjectProps) => ReactNode)(node.props))
    return
  }
  const elementType: unknown = node.type
  if (typeof elementType === 'object' && elementType !== null && 'type' in elementType && typeof elementType.type === 'function') {
    appendElement(parent, (elementType.type as (props: ObjectProps) => ReactNode)(node.props))
    return
  }
  if (typeof node.type !== 'string') {
    appendElement(parent, node.props.children)
    return
  }
  const props = node.props
  const object = node.type === 'mesh' ? new THREE.Mesh(props.geometry, props.material) : new THREE.Group()
  object.name = props.name ?? ''
  if (props.position) object.position.set(...props.position)
  if (props.rotation) object.rotation.set(props.rotation[0], props.rotation[1], props.rotation[2], props.rotation[3] ?? 'XYZ')
  if (props.scale) object.scale.set(...props.scale)
  parent.add(object)
  appendElement(object, props.children)
}

function model(props: PantsirModelProps = {}) {
  const root = new THREE.Group()
  appendElement(root, PantsirModel(props))
  root.updateMatrixWorld(true)
  return root
}

function named(root: THREE.Object3D, name: string) {
  const objects: THREE.Object3D[] = []
  root.traverse((object) => {
    if (object.name === name) objects.push(object)
  })
  return objects
}

function fingerprint(root: THREE.Object3D) {
  const hash = createHash('sha256')
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    const material = object.material as THREE.MeshStandardMaterial
    hash.update(JSON.stringify({ matrix: object.matrixWorld.elements.map((value) => Number(value.toFixed(10))), color: material.color.getHex(), metalness: material.metalness ?? null, roughness: material.roughness ?? null, transparent: material.transparent, opacity: material.opacity }))
    hash.update(Buffer.from(object.geometry.getAttribute('position').array.buffer))
    if (object.geometry.index) hash.update(Buffer.from(object.geometry.index.array.buffer))
  })
  return hash.digest('hex')
}

describe('shared Pantsir transport, deployed and wreck geometry', () => {
  it('preserves the old stationary primary model exactly through aiming, expenditure and damage', () => {
    const poses: PantsirModelProps[] = [{}, { turretYaw: 0.72, radarRotation: 1.8, launcherElevation: 0.46, firedTubeCount: 2 }, { destroyed: true, destructionAge: 0.4, turretYaw: 0.53, radarRotation: 2.8, launcherElevation: 0.28, firedTubeCount: 3 }, { destroyed: true, destructionAge: 30 }]
    // Captured from the unmodified Stage 4C model, before adding transport mechanics.
    const original = ['4ead39b988d174acd66a0565b70f4739ebee20838468fd760f6c0742c0287dfd', '2cf4e0cbd387ff7f0a3954d6a103d20fdc094be2bfa44591fb3ea3b2ad0309bb', '453c52d19b2cbd125c4104a7d7eea9b0a3b7087282cd58ce222c7302f67c1594', '67d3cfd819efb33517103ba3f3d3a4797fd5f87cb3bc37aded1c02e8194c2517']
    expect(poses.map((props) => fingerprint(model(props)))).toEqual(original)
  })

  it('measures eight actual grounded wheel pairs and a recognizable sealed meter-scale truck', () => {
    const root = model()
    const bounds = new THREE.Box3().setFromObject(root, true)
    expect(bounds.min.y).toBeCloseTo(0, 6)
    expect(bounds.max.y).toBeCloseTo(5.65, 6)
    expect(bounds.getSize(new THREE.Vector3()).x).toBeCloseTo(3.26, 5)
    expect(bounds.getSize(new THREE.Vector3()).z).toBeGreaterThanOrEqual(10.3)
    expect(bounds.getSize(new THREE.Vector3()).z).toBeLessThan(10.35)
    for (const side of [-1, 1]) {
      for (let axle = 0; axle < 4; axle += 1) {
        const wheel = root.getObjectByName(`pantsir-wheel-${side}-${axle}`)!
        expect(wheel).toBeDefined()
        expect(new THREE.Box3().setFromObject(wheel, true).min.y).toBeCloseTo(0, 6)
      }
    }
    const glazing: THREE.Mesh[] = []
    root.traverse((object) => {
      if (object instanceof THREE.Mesh && (object.material as THREE.MeshStandardMaterial).color.getHexString() === '10232a') glazing.push(object)
    })
    expect(glazing).toHaveLength(5)
    expect(
      glazing.every((mesh) => {
        const material = mesh.material as THREE.MeshStandardMaterial
        return !material.transparent && material.opacity === 1 && material.metalness > 0.7
      }),
    ).toBe(true)
  })

  it('folds continuously to the reference transport profile with road-safe stabilizers', () => {
    let previousTop = 0
    for (let deployment = 0; deployment <= 1.00001; deployment += 0.025) {
      const root = model({ radarDeployment: deployment, stabilizerDeployment: deployment, launcherElevation: 0, wheelTravelMeters: 0 })
      const bounds = new THREE.Box3().setFromObject(root, true)
      expect(bounds.max.y).toBeGreaterThanOrEqual(previousTop - 0.00001)
      expect(bounds.max.y).toBeLessThanOrEqual(5.65001)
      if (previousTop > 0) expect(bounds.max.y - previousTop).toBeLessThan(0.075)
      previousTop = bounds.max.y
      for (const pad of named(root, 'pantsir-stabilizer-pad')) expect(new THREE.Box3().setFromObject(pad, true).min.y).toBeGreaterThanOrEqual(0.02999)
    }
    const travel = model({ radarDeployment: 0, stabilizerDeployment: 0, launcherElevation: 0 })
    expect(new THREE.Box3().setFromObject(travel, true).max.y).toBeCloseTo(4.37, 6)
    expect(named(travel, 'pantsir-stabilizer-pad')).toHaveLength(4)
    for (const pad of named(travel, 'pantsir-stabilizer-pad')) expect(new THREE.Box3().setFromObject(pad, true).min.y).toBeCloseTo(0.74, 6)
  })

  it('shows signed wheel rotation while steering only the forward four wheels', () => {
    for (const travel of [-4.5, 0, 3.6]) {
      const root = model({ wheelTravelMeters: travel, steeringRadians: 0.28 })
      expect(named(root, 'pantsir-wheel-travel-marker')).toHaveLength(8)
      for (const side of [-1, 1]) {
        for (let axle = 0; axle < 4; axle += 1) {
          const wheel = root.getObjectByName(`pantsir-wheel-${side}-${axle}`)!
          expect(wheel.rotation.y).toBe(axle < 2 ? 0.28 : 0)
          expect(wheel.children[0]!.rotation.x).toBe(-travel / 0.72)
          expect(Math.abs(new THREE.Box3().setFromObject(wheel, true).min.y)).toBeLessThan(0.015)
        }
      }
    }
    expect(named(model(), 'pantsir-wheel-travel-marker')).toHaveLength(0)
  })

  it('retains the same eight-wheel silhouette through bounded attached wreck settling', () => {
    const props = { wheelTravelMeters: 14.5, stabilizerDeployment: 1, radarDeployment: 1, launcherElevation: 0.4, firedTubeCount: 2, destroyed: true }
    for (const age of [0, 0.1, 0.4, 1.2, 4, 55]) {
      const root = model({ ...props, destructionAge: age })
      for (const side of [-1, 1]) for (let axle = 0; axle < 4; axle += 1) expect(root.getObjectByName(`pantsir-wheel-${side}-${axle}`)).toBeDefined()
      const bounds = new THREE.Box3().setFromObject(root, true)
      expect(bounds.min.y).toBeGreaterThan(-0.11)
      expect(bounds.max.y).toBeLessThan(5.9)
      expect(bounds.getSize(new THREE.Vector3()).z).toBeLessThan(10.6)
      expect(bounds.getSize(new THREE.Vector3()).z).toBeGreaterThan(10.3)
    }
    expect(fingerprint(model({ ...props, destructionAge: 55 }))).toBe(fingerprint(model({ ...props, destructionAge: 55 })))
  })

  it('preserves scripted wreck rocking exactly and keeps late rendered transforms finite', () => {
    for (let tick = 0; tick <= 1800; tick++) {
      const age = tick / 10
      const body = PantsirModel({ destroyed: true, destructionAge: age }).props.children
      const settled = Math.max(0, Math.min(1, age / 1.2))
      expect(body.props.rotation[2]).toBe(Math.sin(age * 18) * Math.exp(-age * 2.8) * 0.06 - settled * 0.035)
    }
    for (const age of [180.0001, 240, 7200, Number.MAX_VALUE / 2, Number.MAX_VALUE]) {
      const root = model({ destroyed: true, destructionAge: age })
      root.traverse((object) => {
        expect(object.matrixWorld.elements.every(Number.isFinite)).toBe(true)
        expect([object.rotation.x, object.rotation.y, object.rotation.z].every(Number.isFinite)).toBe(true)
      })
      const bounds = new THREE.Box3().setFromObject(root, true)
      expect(bounds.min.y).toBeGreaterThan(-0.11)
      expect(bounds.max.y).toBeLessThan(5.9)
    }
    expect(fingerprint(model({ destroyed: true, destructionAge: Number.MAX_VALUE }))).toBe(fingerprint(model({ destroyed: true, destructionAge: 7200 })))
  })

  it('keeps two complete six-tube banks and opens only the fixed expended mouths', () => {
    for (const expenditure of [0, 1, 2, 6, 12, 20]) {
      const root = model({ firedTubeCount: expenditure })
      const mouths: THREE.Mesh[] = []
      root.traverse((object) => {
        if (object instanceof THREE.Mesh && object.geometry instanceof THREE.CircleGeometry) mouths.push(object)
      })
      expect(mouths).toHaveLength(12)
      expect(mouths.filter((mesh) => (mesh.material as THREE.MeshStandardMaterial).color.getHexString() === '090b0a')).toHaveLength(Math.min(12, expenditure))
      expect(mouths.slice(0, 6).every((mesh) => mesh.getWorldPosition(new THREE.Vector3()).x < 0)).toBe(true)
      expect(mouths.slice(6).every((mesh) => mesh.getWorldPosition(new THREE.Vector3()).x > 0)).toBe(true)
    }
  })

  it('launches the secondary shots from the actual selected tube caps along their normals', () => {
    const state = deriveSecondaryPantsirState(119.6)
    const r = state.pose.rotation
    const p = state.pose.position
    const mechanical = state.mechanical
    const root = model({
      position: [p.x, p.y, p.z],
      rotation: [r.x, r.y, r.z, 'YXZ'],
      turretYaw: mechanical.turretYawRadians,
      launcherElevation: mechanical.launcherElevationRadians,
      firedTubeCount: mechanical.firedTubeCount,
    })
    const mouths: THREE.Mesh[] = []
    root.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry instanceof THREE.CircleGeometry) mouths.push(object)
    })
    for (let tube = 0; tube < 2; tube += 1) {
      const cap = mouths[tube]!
      const actual = cap.getWorldPosition(new THREE.Vector3())
      const authored = secondaryPantsirMuzzlePosition(tube)
      expect(actual.distanceTo(new THREE.Vector3(authored.x, authored.y, authored.z))).toBeLessThan(0.00000001)
      const shot = state.defensiveShots[tube]!
      const flightDirection = new THREE.Vector3(shot.end.x - shot.origin.x, shot.end.y - shot.origin.y, shot.end.z - shot.origin.z).normalize()
      const capNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(cap.getWorldQuaternion(new THREE.Quaternion()))
      expect(flightDirection.dot(capNormal)).toBeGreaterThan(0.99999999)
    }
  })
})
