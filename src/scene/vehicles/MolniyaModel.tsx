import type { ThreeElements } from '@react-three/fiber'

import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

import { createPrismGeometryXZ } from './modelGeometry'
import { MOLNIYA_ATTACHMENT_POINTS, MOLNIYA_HULL_SECTIONS } from './navalModelData'
import { createNavalHullGeometry, NAVAL_GEOMETRIES, NAVAL_MATERIALS } from './navalModelShared'

export interface MolniyaModelProps extends Omit<ThreeElements['group'], 'children'> {}

const HULL_GEOMETRY = createNavalHullGeometry(MOLNIYA_HULL_SECTIONS)
const FOREDECK_GEOMETRY = createPrismGeometryXZ(
  [
    [0, -28.05],
    [-4.55, -18.5],
    [-4.95, -8],
    [4.95, -8],
    [4.55, -18.5],
  ],
  0.16,
  3.02,
)
const AFT_DECK_GEOMETRY = createPrismGeometryXZ(
  [
    [-4.95, -8],
    [-4.78, 28.1],
    [4.78, 28.1],
    [4.95, -8],
  ],
  0.16,
  2.58,
)
const BRIDGE_LOWER = createPrismGeometryXZ(
  [
    [-3.2, -10.5],
    [-4.15, -6.2],
    [-3.9, 5.5],
    [3.9, 5.5],
    [4.15, -6.2],
    [3.2, -10.5],
  ],
  4.6,
  4.86,
)
const BRIDGE_UPPER = createPrismGeometryXZ(
  [
    [-2.55, -8],
    [-3.05, -4.2],
    [-2.45, 1.8],
    [2.45, 1.8],
    [3.05, -4.2],
    [2.55, -8],
  ],
  3.4,
  8.12,
)
const MAIN_GUN_BARREL = new THREE.CylinderGeometry(0.1, 0.13, 4.8, 9)
const SMALL_GUN_BARREL = new THREE.CylinderGeometry(0.055, 0.07, 2.6, 8)
const MISSILE_CANISTER = new THREE.CylinderGeometry(0.31, 0.31, 5.3, 8)
const MISSILE_CAP = new THREE.CircleGeometry(0.29, 8)
const MOLNIYA_CANISTER_POSITIONS = Array.from({ length: 4 }, (_, index) => ({
  x: ((index % 2) - 0.5) * 0.78,
  y: (Math.floor(index / 2) - 0.5) * 0.78,
}))
const MOLNIYA_CANISTER_ROTATION = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))
const MOLNIYA_CAP_ROTATION = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0))
const MOLNIYA_CANISTER_MATRICES = MOLNIYA_CANISTER_POSITIONS.map(({ x, y }) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, 0), MOLNIYA_CANISTER_ROTATION, new THREE.Vector3(1, 1, 1)))
const MOLNIYA_CAP_MATRICES = MOLNIYA_CANISTER_POSITIONS.map(({ x, y }) => new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.31, -2.66), MOLNIYA_CAP_ROTATION, new THREE.Vector3(1, 1, 1)))
const MOLNIYA_ATTACHMENT_ENTRIES = Object.entries(MOLNIYA_ATTACHMENT_POINTS)

function MolniyaHull() {
  return (
    <group name="molniya-hull-assembly">
      <mesh geometry={HULL_GEOMETRY} material={NAVAL_MATERIALS.hull} castShadow receiveShadow />
      <mesh geometry={FOREDECK_GEOMETRY} material={NAVAL_MATERIALS.deck} receiveShadow />
      <mesh geometry={AFT_DECK_GEOMETRY} material={NAVAL_MATERIALS.deck} receiveShadow />
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 1.65, -1.55, 25.7]}>
          <mesh geometry={NAVAL_GEOMETRIES.cylinder8} material={NAVAL_MATERIALS.metal} rotation={[Math.PI / 2, 0, 0]} scale={[0.08, 3.9, 0.08]} />
          <mesh geometry={NAVAL_GEOMETRIES.cylinder8} material={NAVAL_MATERIALS.underwater} position={[0, 0, 2.05]} rotation={[Math.PI / 2, 0, 0]} scale={[0.7, 0.12, 0.7]} />
        </group>
      ))}
    </group>
  )
}

function MolniyaGun({ position, aft = false }: { position: [number, number, number]; aft?: boolean }) {
  const barrel = aft ? SMALL_GUN_BARREL : MAIN_GUN_BARREL
  const scale = aft ? 0.65 : 1
  return (
    <group position={position} scale={scale}>
      <mesh geometry={NAVAL_GEOMETRIES.cylinder12} material={NAVAL_MATERIALS.superstructureDark} scale={[1.25, 0.42, 1.25]} />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.superstructure} position={[0, 0.48, -0.15]} scale={[1.8, 0.95, 2]} castShadow />
      <mesh geometry={barrel} material={NAVAL_MATERIALS.metal} position={[0, 0.85, -2.45]} rotation={[Math.PI / 2 + 0.08, 0, 0]} castShadow />
    </group>
  )
}

function applyStaticInstances(mesh: THREE.InstancedMesh | null, matrices: readonly THREE.Matrix4[]) {
  if (!mesh) {
    return
  }

  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
  mesh.count = matrices.length
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingBox()
  mesh.computeBoundingSphere()
}

function MissileBank({ side }: { side: -1 | 1 }) {
  const canistersRef = useRef<THREE.InstancedMesh>(null)
  const capsRef = useRef<THREE.InstancedMesh>(null)
  const bankName = side < 0 ? 'molniya-port-missile-bank' : 'molniya-starboard-missile-bank'

  useLayoutEffect(() => {
    applyStaticInstances(canistersRef.current, MOLNIYA_CANISTER_MATRICES)
    applyStaticInstances(capsRef.current, MOLNIYA_CAP_MATRICES)
  }, [])

  return (
    <group name={bankName} position={[side * 3.15, 4.45, 10.5]} rotation={[0.13, 0, side * -0.08]}>
      <instancedMesh ref={canistersRef} args={[MISSILE_CANISTER, NAVAL_MATERIALS.superstructureDark, MOLNIYA_CANISTER_MATRICES.length]} castShadow dispose={null} frustumCulled name={`${bankName}-canisters`} />
      <instancedMesh ref={capsRef} args={[MISSILE_CAP, NAVAL_MATERIALS.launchCap, MOLNIYA_CAP_MATRICES.length]} dispose={null} frustumCulled name={`${bankName}-caps`} />
    </group>
  )
}

function MolniyaMast() {
  return (
    <group name="molniya-mast" position={[0, 0, 1.6]}>
      <mesh geometry={NAVAL_GEOMETRIES.cylinder8} material={NAVAL_MATERIALS.metal} position={[0, 11.55, 0]} scale={[0.18, 6.8, 0.18]} />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.metal} position={[0, 11.4, 0]} scale={[5.7, 0.18, 0.22]} />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.radar} position={[-1.65, 12.05, 0]} rotation={[0, 0.35, 0]} scale={[1.8, 1.05, 0.14]} />
      <mesh geometry={NAVAL_GEOMETRIES.radarDish} material={NAVAL_MATERIALS.radar} position={[0, 14.05, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.05, 1.05, 1.05]} />
      <mesh geometry={NAVAL_GEOMETRIES.cylinder8} material={NAVAL_MATERIALS.metal} position={[0, 14.55, 0]} scale={[0.07, 1.1, 0.07]} />
    </group>
  )
}

function MolniyaSuperstructure() {
  return (
    <group name="molniya-superstructure">
      <mesh geometry={BRIDGE_LOWER} material={NAVAL_MATERIALS.superstructure} castShadow />
      <mesh geometry={BRIDGE_UPPER} material={NAVAL_MATERIALS.superstructure} castShadow />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.glazing} position={[0, 8.55, -8.08]} scale={[4.3, 0.68, 0.12]} />
      {([-1, 1] as const).map((side) => (
        <mesh key={side} geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.glazing} position={[side * 2.7, 8.55, -5.8]} rotation={[0, side * 0.18, 0]} scale={[0.11, 0.62, 2.5]} />
      ))}
      <MolniyaMast />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.superstructureDark} position={[0, 5.6, 8]} scale={[2.5, 3.35, 4.2]} castShadow />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.metal} position={[0, 7.45, 8.2]} scale={[2.1, 0.38, 3.4]} />
    </group>
  )
}

function AttachmentAnchors() {
  return (
    <group name="molniya-attachment-anchors">
      {MOLNIYA_ATTACHMENT_ENTRIES.map(([name, position]) => (
        <group key={name} name={`molniya-${name}`} position={position} />
      ))}
    </group>
  )
}

/**
 * Raw-meter Project 12418 approximation. Its design waterline is local Y=0,
 * bow points local -Z, starboard is +X, and no visible occupants are modeled.
 */
export function MolniyaModel(groupProps: MolniyaModelProps) {
  return (
    <group {...groupProps} dispose={null}>
      <group name="molniya-motion-root">
        <MolniyaHull />
        <MolniyaGun position={[0, 3.55, -18.3]} />
        <MolniyaSuperstructure />
        <MissileBank side={-1} />
        <MissileBank side={1} />
        <MolniyaGun position={[0, 3.05, 22.5]} aft />
        <AttachmentAnchors />
      </group>
    </group>
  )
}
