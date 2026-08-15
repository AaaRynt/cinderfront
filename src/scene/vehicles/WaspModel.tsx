import type { ThreeElements } from '@react-three/fiber'

import * as THREE from 'three'

import { clamp01, createPrismGeometryXZ } from './modelGeometry'

export interface WaspModelProps extends Omit<ThreeElements['group'], 'children'> {
  /** Visual wake intensity. The hull itself remains in raw meters. */
  wakeStrength?: number
}

interface HullSection {
  z: number
  topHalfWidth: number
  bottomHalfWidth: number
  topY: number
  bottomY: number
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 8)
const DECK_RING = new THREE.RingGeometry(5.5, 5.9, 32)

const MATERIALS = {
  hull: new THREE.MeshStandardMaterial({ color: '#929da2', roughness: 0.72, metalness: 0.28 }),
  hullDark: new THREE.MeshStandardMaterial({
    color: '#263238',
    roughness: 0.78,
    metalness: 0.18,
  }),
  deck: new THREE.MeshStandardMaterial({ color: '#343c40', roughness: 0.9, metalness: 0.08 }),
  island: new THREE.MeshStandardMaterial({
    color: '#a0aaae',
    roughness: 0.76,
    metalness: 0.24,
  }),
  windows: new THREE.MeshStandardMaterial({
    color: '#101b22',
    roughness: 0.2,
    metalness: 0.65,
  }),
  marking: new THREE.MeshBasicMaterial({ color: '#d8d8cf' }),
}

function createHullGeometry(): THREE.BufferGeometry {
  const sections: readonly HullSection[] = [
    { z: -126.6, topHalfWidth: 0.8, bottomHalfWidth: 0.25, topY: 10.4, bottomY: -0.5 },
    { z: -113, topHalfWidth: 11.7, bottomHalfWidth: 6.4, topY: 12, bottomY: -5.2 },
    { z: -91, topHalfWidth: 15.2, bottomHalfWidth: 10.2, topY: 12, bottomY: -7.5 },
    { z: 92, topHalfWidth: 15.4, bottomHalfWidth: 10.8, topY: 12, bottomY: -8.2 },
    { z: 126.6, topHalfWidth: 15.4, bottomHalfWidth: 11, topY: 12, bottomY: -6.1 },
  ]
  const positions: number[] = []
  const indices: number[] = []

  for (const section of sections) {
    positions.push(section.topHalfWidth, section.topY, section.z, -section.topHalfWidth, section.topY, section.z, -section.bottomHalfWidth, section.bottomY, section.z, section.bottomHalfWidth, section.bottomY, section.z)
  }

  for (let sectionIndex = 0; sectionIndex < sections.length - 1; sectionIndex += 1) {
    const ring = sectionIndex * 4
    const nextRing = (sectionIndex + 1) * 4
    for (let side = 0; side < 4; side += 1) {
      const nextSide = (side + 1) % 4
      const a = ring + side
      const b = ring + nextSide
      const c = nextRing + nextSide
      const d = nextRing + side
      indices.push(a, b, d, b, c, d)
    }
  }

  indices.push(0, 2, 1, 0, 3, 2)
  const rear = (sections.length - 1) * 4
  indices.push(rear, rear + 1, rear + 2, rear, rear + 2, rear + 3)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

const HULL_GEOMETRY = createHullGeometry()
const DECK_GEOMETRY = createPrismGeometryXZ(
  [
    [0, -126.6],
    [-11.8, -113],
    [-15.9, -91],
    [-15.9, 126.6],
    [15.9, 126.6],
    [15.9, -91],
    [11.8, -113],
  ],
  1.15,
  12.6,
)
const WAKE_GEOMETRY = createPrismGeometryXZ(
  [
    [-14, 124],
    [-42, 232],
    [42, 232],
    [14, 124],
  ],
  0.05,
  0.08,
)

const CENTERLINE_DASHES = Array.from({ length: 15 }, (_, index) => -102 + index * 14.5)

/**
 * A meter-scale Wasp-class approximation. Its waterline is local Y=0, bow points -Z,
 * and the starboard island sits on +X.
 */
export function WaspModel({ wakeStrength = 0.3, ...groupProps }: WaspModelProps) {
  const wake = clamp01(wakeStrength)

  return (
    <group {...groupProps} dispose={null}>
      <mesh geometry={HULL_GEOMETRY} material={MATERIALS.hull} castShadow receiveShadow />
      <mesh geometry={DECK_GEOMETRY} material={MATERIALS.deck} receiveShadow />

      {/* Broad, nearly square stern and dark well-deck opening. */}
      <mesh geometry={UNIT_BOX} material={MATERIALS.hullDark} position={[0, 3.2, 126.62]} scale={[13.2, 8.8, 0.18]} />

      {/* Side aircraft elevators remain subtle projections beyond the deck edge. */}
      <mesh geometry={UNIT_BOX} material={MATERIALS.deck} position={[-16.8, 12.72, 48]} scale={[5.4, 0.5, 18]} />
      <mesh geometry={UNIT_BOX} material={MATERIALS.deck} position={[16.8, 12.72, -54]} scale={[5.4, 0.5, 18]} />

      {/* Starboard (+X), forward-half island and bridge. */}
      <mesh geometry={UNIT_BOX} material={MATERIALS.island} position={[9.7, 17.25, -19]} scale={[8.6, 8.5, 27]} castShadow />
      <mesh geometry={UNIT_BOX} material={MATERIALS.island} position={[9.1, 23.2, -26]} scale={[7.4, 4.2, 13]} castShadow />
      <mesh geometry={UNIT_BOX} material={MATERIALS.windows} position={[9.1, 23.85, -32.55]} scale={[6.3, 1.15, 0.18]} />
      <mesh geometry={UNIT_BOX} material={MATERIALS.island} position={[9.6, 27.3, -19]} scale={[5.2, 4.2, 8.5]} castShadow />
      <mesh geometry={UNIT_CYLINDER} material={MATERIALS.hullDark} position={[9.5, 36.2, -18]} scale={[0.34, 14.5, 0.34]} />
      <mesh geometry={UNIT_BOX} material={MATERIALS.island} position={[9.5, 40.5, -18]} scale={[8.4, 0.55, 1.2]} />
      <mesh geometry={UNIT_BOX} material={MATERIALS.island} position={[9.5, 44.1, -18]} scale={[5.8, 0.5, 0.95]} />
      <mesh geometry={UNIT_CYLINDER} material={MATERIALS.hullDark} position={[9.5, 46.15, -18]} scale={[0.14, 4.1, 0.14]} />

      {/* Restrained deck markings that remain readable at spectator distance. */}
      {CENTERLINE_DASHES.map((z) => (
        <mesh key={z} geometry={UNIT_BOX} material={MATERIALS.marking} position={[0, 13.2, z]} scale={[0.55, 0.035, 6.4]} />
      ))}
      {[-66, 14, 82].map((z) => (
        <mesh key={z} geometry={DECK_RING} material={MATERIALS.marking} position={[-4.2, 13.24, z]} rotation={[-Math.PI / 2, 0, 0]} />
      ))}
      <mesh geometry={UNIT_BOX} material={MATERIALS.marking} position={[0, 13.22, -117]} scale={[12, 0.035, 0.55]} />

      {/* Wake trails aft (+Z); it is environmental and does not alter hull dimensions. */}
      <mesh geometry={WAKE_GEOMETRY} visible={wake > 0.01} renderOrder={-1}>
        <meshBasicMaterial color="#dceff3" depthWrite={false} opacity={0.08 + wake * 0.24} transparent />
      </mesh>
    </group>
  )
}
