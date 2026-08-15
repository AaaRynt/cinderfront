import type { ThreeElements } from '@react-three/fiber'

import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

import { createPrismGeometryXZ } from './modelGeometry'
import { TALWAR_ATTACHMENT_POINTS, TALWAR_HULL_SECTIONS } from './navalModelData'
import { createNavalHullGeometry, NAVAL_GEOMETRIES, NAVAL_MATERIALS } from './navalModelShared'

export interface TalwarModelProps extends Omit<ThreeElements['group'], 'children'> {}

const HULL_GEOMETRY = createNavalHullGeometry(TALWAR_HULL_SECTIONS)
const FOREDECK_GEOMETRY = createPrismGeometryXZ(
  [
    [0, -61.7],
    [-6.6, -48],
    [-7.25, -31],
    [7.25, -31],
    [6.6, -48],
  ],
  0.18,
  4.55,
)
const MAIN_DECK_GEOMETRY = createPrismGeometryXZ(
  [
    [-7.25, -31],
    [-7.35, 34],
    [7.35, 34],
    [7.25, -31],
  ],
  0.18,
  3.96,
)
const FLIGHT_DECK_GEOMETRY = createPrismGeometryXZ(
  [
    [-7.25, 31],
    [-7.05, 62],
    [7.05, 62],
    [7.25, 31],
  ],
  0.22,
  3.98,
)
const LOWER_SUPERSTRUCTURE = createPrismGeometryXZ(
  [
    [-4.65, -27],
    [-5.75, -19],
    [-5.35, 12],
    [5.35, 12],
    [5.75, -19],
    [4.65, -27],
  ],
  5.4,
  6.72,
)
const BRIDGE_GEOMETRY = createPrismGeometryXZ(
  [
    [-3.9, -23.5],
    [-4.65, -17],
    [-3.75, -8],
    [3.75, -8],
    [4.65, -17],
    [3.9, -23.5],
  ],
  4.25,
  11.55,
)
const HANGAR_GEOMETRY = createPrismGeometryXZ(
  [
    [-4.45, 18],
    [-5.15, 23],
    [-5.15, 37],
    [5.15, 37],
    [5.15, 23],
    [4.45, 18],
  ],
  6.1,
  7.08,
)
const FLIGHT_DECK_RING = new THREE.RingGeometry(4.25, 4.55, 32)
const GUN_BARREL = new THREE.CylinderGeometry(0.13, 0.17, 7.2, 10)
const SHAFT = new THREE.CylinderGeometry(0.12, 0.12, 7.2, 10)
const PROPELLER = new THREE.CylinderGeometry(1.05, 1.05, 0.16, 5)
const TALWAR_VLS_CELL_MATRICES = Array.from({ length: 8 }, (_, index) => new THREE.Matrix4().compose(new THREE.Vector3(((index % 4) - 1.5) * 0.9, 0, (Math.floor(index / 4) - 0.5) * 1.05), new THREE.Quaternion(), new THREE.Vector3(0.7, 0.09, 0.82)))
const TALWAR_ATTACHMENT_ENTRIES = Object.entries(TALWAR_ATTACHMENT_POINTS)

function TalwarHull() {
  return (
    <group name="talwar-hull-assembly">
      <mesh geometry={HULL_GEOMETRY} material={NAVAL_MATERIALS.hull} castShadow receiveShadow />
      <mesh geometry={FOREDECK_GEOMETRY} material={NAVAL_MATERIALS.deck} receiveShadow />
      <mesh geometry={MAIN_DECK_GEOMETRY} material={NAVAL_MATERIALS.deck} receiveShadow />
      <mesh geometry={FLIGHT_DECK_GEOMETRY} material={NAVAL_MATERIALS.deck} receiveShadow />

      {/* Twin-shaft cues remain below the Y=0 design waterline. */}
      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 2.35, -2.55, 58]}>
          <mesh geometry={SHAFT} material={NAVAL_MATERIALS.metal} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={PROPELLER} material={NAVAL_MATERIALS.underwater} position={[0, 0, 3.65]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.underwater} position={[0, -0.25, 1.4]} scale={[0.16, 2.2, 1.5]} />
        </group>
      ))}
    </group>
  )
}

function NavalGun({ position, compact = false }: { position: [number, number, number]; compact?: boolean }) {
  const scale = compact ? 0.58 : 1
  return (
    <group position={position} scale={scale}>
      <mesh geometry={NAVAL_GEOMETRIES.cylinder12} material={NAVAL_MATERIALS.superstructureDark} scale={[1.5, 0.48, 1.5]} castShadow />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.superstructure} position={[0, 0.58, -0.2]} rotation={[0.1, 0, 0]} scale={[2.3, 1.15, 2.55]} castShadow />
      <mesh geometry={GUN_BARREL} material={NAVAL_MATERIALS.metal} position={[0, 1.05, -3.7]} rotation={[Math.PI / 2 + 0.06, 0, 0]} castShadow />
    </group>
  )
}

function TalwarVlsCells() {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current

    if (!mesh) {
      return
    }

    TALWAR_VLS_CELL_MATRICES.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
    mesh.count = TALWAR_VLS_CELL_MATRICES.length
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
  }, [])

  return <instancedMesh ref={meshRef} args={[NAVAL_GEOMETRIES.box, NAVAL_MATERIALS.launchCap, TALWAR_VLS_CELL_MATRICES.length]} dispose={null} frustumCulled name="talwar-vls-cells" />
}

function TalwarForwardWeapons() {
  return (
    <group name="talwar-forward-weapons">
      <NavalGun position={[0, 5.05, -45.5]} />
      <group name="talwar-forward-launcher-area" position={[0, 4.72, -33.5]}>
        <TalwarVlsCells />
      </group>
    </group>
  )
}

function TalwarMast() {
  return (
    <group name="talwar-mast" position={[0, 0, -2]}>
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.superstructureDark} position={[0, 16.15, 0]} scale={[3.3, 4.7, 3.4]} castShadow />
      <mesh geometry={NAVAL_GEOMETRIES.cylinder8} material={NAVAL_MATERIALS.metal} position={[0, 22.55, 0]} scale={[0.24, 8.4, 0.24]} />
      {[19.2, 22.1, 25.2].map((y, index) => (
        <group key={y} position={[0, y, 0]}>
          <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.metal} scale={[index === 0 ? 8.2 : 5.6, 0.22, 0.25]} />
          <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.radar} position={[index % 2 === 0 ? -2.1 : 1.8, 0.5, 0]} rotation={[0, index * 0.55, 0]} scale={[2.3, 1.15, 0.16]} />
        </group>
      ))}
      <mesh geometry={NAVAL_GEOMETRIES.radarDish} material={NAVAL_MATERIALS.radar} position={[0, 27.25, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={NAVAL_GEOMETRIES.cylinder8} material={NAVAL_MATERIALS.metal} position={[0, 28.15, 0]} scale={[0.1, 0.7, 0.1]} />
    </group>
  )
}

function TalwarSuperstructure() {
  return (
    <group name="talwar-superstructure">
      <mesh geometry={LOWER_SUPERSTRUCTURE} material={NAVAL_MATERIALS.superstructure} castShadow />
      <mesh geometry={BRIDGE_GEOMETRY} material={NAVAL_MATERIALS.superstructure} castShadow />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.glazing} position={[0, 12.15, -23.58]} scale={[6.2, 0.78, 0.12]} />
      {([-1, 1] as const).map((side) => (
        <mesh key={side} geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.glazing} position={[side * 4.12, 12.15, -20]} rotation={[0, side * 0.2, 0]} scale={[0.12, 0.7, 4.2]} />
      ))}

      <TalwarMast />

      <group name="talwar-funnel" position={[0, 0, 11]}>
        <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.superstructureDark} position={[0, 12.7, 0]} rotation={[0.05, 0, 0]} scale={[4.2, 8.1, 5.5]} castShadow />
        <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.metal} position={[0, 17.05, 0.25]} scale={[3.55, 0.8, 4.5]} />
      </group>

      <mesh geometry={HANGAR_GEOMETRY} material={NAVAL_MATERIALS.superstructure} castShadow />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.hullDark} position={[0, 7.2, 37.08]} scale={[7.5, 4.55, 0.16]} />

      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 5.65, 5.35, 8]}>
          <mesh geometry={NAVAL_GEOMETRIES.cylinder12} material={NAVAL_MATERIALS.superstructureDark} scale={[0.82, 0.35, 0.82]} />
          <mesh geometry={NAVAL_GEOMETRIES.cylinder8} material={NAVAL_MATERIALS.metal} position={[0, 0.6, -0.95]} rotation={[Math.PI / 2, 0, 0]} scale={[0.1, 2, 0.1]} />
        </group>
      ))}
      {([-1, 1] as const).map((side) => (
        <mesh key={`dome-${side}`} geometry={NAVAL_GEOMETRIES.sphere} material={NAVAL_MATERIALS.radar} position={[side * 4.7, 10.1, 21]} scale={[1.05, 1.05, 1.05]} />
      ))}
    </group>
  )
}

function TalwarFlightDeck() {
  return (
    <group name="talwar-flight-deck">
      <mesh geometry={FLIGHT_DECK_RING} material={NAVAL_MATERIALS.marking} position={[0, 4.105, 49]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.marking} position={[0, 4.11, 49]} scale={[0.28, 0.025, 14.5]} />
      <mesh geometry={NAVAL_GEOMETRIES.box} material={NAVAL_MATERIALS.marking} position={[0, 4.11, 56.2]} scale={[10.3, 0.025, 0.28]} />
    </group>
  )
}

function AttachmentAnchors() {
  return (
    <group name="talwar-attachment-anchors">
      {TALWAR_ATTACHMENT_ENTRIES.map(([name, position]) => (
        <group key={name} name={`talwar-${name}`} position={position} />
      ))}
    </group>
  )
}

/**
 * Raw-meter Talwar-class approximation. The intact ship is centered at its
 * design waterline (Y=0), with its bow pointing local -Z and starboard +X.
 */
export function TalwarModel(groupProps: TalwarModelProps) {
  return (
    <group {...groupProps} dispose={null}>
      <group name="talwar-motion-root">
        <TalwarHull />
        <TalwarForwardWeapons />
        <TalwarSuperstructure />
        <TalwarFlightDeck />
        <AttachmentAnchors />
      </group>
    </group>
  )
}
