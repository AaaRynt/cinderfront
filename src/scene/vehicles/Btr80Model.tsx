import type { ThreeElements } from '@react-three/fiber'

import { memo } from 'react'
import * as THREE from 'three'

import { clamp01 } from './modelGeometry'

export interface Btr80ModelProps extends Omit<ThreeElements['group'], 'children'> {
  /** Deterministic tire travel in radians. */
  wheelRotationRadians?: number
  /** Front-two-axle steering angle in radians. */
  steeringRadians?: number
  /** Turret azimuth relative to local forward (-Z). */
  turretYawRadians?: number
  disabled?: boolean
  damageProgress?: number
}

interface HullSection {
  readonly z: number
  readonly bottomHalfWidth: number
  readonly sideHalfWidth: number
  readonly upperHalfWidth: number
  readonly roofHalfWidth: number
  readonly noseLift?: number
}

const HULL_SECTIONS = [
  { z: -3.825, bottomHalfWidth: 0.38, sideHalfWidth: 0.64, upperHalfWidth: 0.5, roofHalfWidth: 0.34, noseLift: 0.22 },
  { z: -3.24, bottomHalfWidth: 1.03, sideHalfWidth: 1.32, upperHalfWidth: 1.12, roofHalfWidth: 0.9, noseLift: 0.06 },
  { z: -2.42, bottomHalfWidth: 1.13, sideHalfWidth: 1.36, upperHalfWidth: 1.17, roofHalfWidth: 0.96 },
  { z: 2.7, bottomHalfWidth: 1.13, sideHalfWidth: 1.36, upperHalfWidth: 1.17, roofHalfWidth: 0.96 },
  { z: 3.825, bottomHalfWidth: 0.96, sideHalfWidth: 1.17, upperHalfWidth: 1.08, roofHalfWidth: 0.91 },
] as const satisfies readonly HullSection[]

function createBtrHullGeometry() {
  const positions: number[] = []
  const indices: number[] = []
  for (const section of HULL_SECTIONS) {
    const lift = 'noseLift' in section ? section.noseLift : 0
    positions.push(
      -section.bottomHalfWidth,
      -0.72 + lift * 0.2,
      section.z,
      section.bottomHalfWidth,
      -0.72 + lift * 0.2,
      section.z,
      section.sideHalfWidth,
      -0.34 + lift * 0.38,
      section.z,
      section.upperHalfWidth,
      0.31 + lift * 0.72,
      section.z,
      section.roofHalfWidth,
      0.62 + lift,
      section.z,
      -section.roofHalfWidth,
      0.62 + lift,
      section.z,
      -section.upperHalfWidth,
      0.31 + lift * 0.72,
      section.z,
      -section.sideHalfWidth,
      -0.34 + lift * 0.38,
      section.z,
    )
  }

  const ringSize = 8
  for (let sectionIndex = 0; sectionIndex < HULL_SECTIONS.length - 1; sectionIndex += 1) {
    const ring = sectionIndex * ringSize
    const nextRing = ring + ringSize
    for (let vertex = 0; vertex < ringSize; vertex += 1) {
      const nextVertex = (vertex + 1) % ringSize
      indices.push(ring + vertex, ring + nextVertex, nextRing + vertex, ring + nextVertex, nextRing + nextVertex, nextRing + vertex)
    }
  }
  for (let vertex = 1; vertex < ringSize - 1; vertex += 1) indices.push(0, vertex + 1, vertex)
  const rearRing = (HULL_SECTIONS.length - 1) * ringSize
  for (let vertex = 1; vertex < ringSize - 1; vertex += 1) indices.push(rearRing, rearRing + vertex, rearRing + vertex + 1)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

const BTR_HULL = createBtrHullGeometry()
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const TIRE = new THREE.CylinderGeometry(0.59, 0.59, 0.38, 18)
const HUB = new THREE.CylinderGeometry(0.245, 0.245, 0.405, 12)
const TURRET_RING = new THREE.CylinderGeometry(0.57, 0.57, 0.2, 12)
const TURRET_BODY = new THREE.CylinderGeometry(0.43, 0.53, 0.43, 8)
const MACHINE_GUN = new THREE.CylinderGeometry(0.047, 0.065, 1.65, 8)
const MUZZLE = new THREE.CylinderGeometry(0.08, 0.08, 0.13, 8)
const HATCH = new THREE.CylinderGeometry(0.29, 0.29, 0.035, 12)
const WATERJET = new THREE.CylinderGeometry(0.18, 0.18, 0.04, 12)
const SEARCHLIGHT = new THREE.SphereGeometry(0.075, 10, 6)
const HUB_MARKER = new THREE.BoxGeometry(0.035, 0.24, 0.055)

const MATERIALS = {
  olive: new THREE.MeshStandardMaterial({ color: '#626b45', metalness: 0.16, roughness: 0.86 }),
  oliveDark: new THREE.MeshStandardMaterial({ color: '#48513a', metalness: 0.17, roughness: 0.89 }),
  oliveLight: new THREE.MeshStandardMaterial({ color: '#727a52', metalness: 0.12, roughness: 0.84 }),
  tire: new THREE.MeshStandardMaterial({ color: '#121412', metalness: 0.01, roughness: 0.98 }),
  hub: new THREE.MeshStandardMaterial({ color: '#384034', metalness: 0.32, roughness: 0.72 }),
  metal: new THREE.MeshStandardMaterial({ color: '#242a25', metalness: 0.68, roughness: 0.54 }),
  optics: new THREE.MeshStandardMaterial({ color: '#0b2026', metalness: 0.72, roughness: 0.16 }),
  grille: new THREE.MeshStandardMaterial({ color: '#1b211c', metalness: 0.42, roughness: 0.78 }),
  scorched: new THREE.MeshStandardMaterial({ color: '#35382d', metalness: 0.09, roughness: 0.96 }),
  char: new THREE.MeshStandardMaterial({ color: '#191b19', metalness: 0.12, roughness: 0.98 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#a9b5a0', emissive: '#293228', emissiveIntensity: 0.25, metalness: 0.18, roughness: 0.38 }),
}

const AXLE_Z = [-2.55, -1.25, 1.05, 2.4] as const
const GRILLE_Z = [1.64, 1.98, 2.32, 2.66] as const

interface WheelProps {
  axleIndex: number
  disabled: boolean
  side: -1 | 1
  steeringRadians: number
  wheelRotationRadians: number
}

function Wheel({ axleIndex, disabled, side, steeringRadians, wheelRotationRadians }: WheelProps) {
  const collapsed = disabled && axleIndex === 0 && side === 1
  return (
    <group position={[side * 1.255, -0.585, AXLE_Z[axleIndex]]} rotation={[0, axleIndex < 2 ? steeringRadians : 0, 0]} scale={[1, collapsed ? 0.78 : 1, collapsed ? 0.84 : 1]}>
      <group rotation={[wheelRotationRadians, 0, 0]}>{WHEEL_PARTS[disabled ? 1 : 0]![side > 0 ? 1 : 0]}</group>
    </group>
  )
}

/** Meter-scale BTR-80 approximation with a centered origin and local -Z forward. */
export function Btr80Model({ wheelRotationRadians = 0, steeringRadians = 0, turretYawRadians = 0, disabled = false, damageProgress = 0, ...groupProps }: Btr80ModelProps) {
  const damage = clamp01(damageProgress)

  return (
    <group {...groupProps} dispose={null}>
      <StaticFront disabled={disabled} />

      {/* Eight tires: paired forward and rear axle groups with a larger center gap. */}
      {([-1, 1] as const).flatMap((side) => AXLE_Z.map((_, axleIndex) => <Wheel key={`${side}:${axleIndex}`} axleIndex={axleIndex} disabled={disabled} side={side} steeringRadians={steeringRadians} wheelRotationRadians={-wheelRotationRadians} />))}

      <StaticRear disabled={disabled} damage={damage} turretYawRadians={turretYawRadians} />
    </group>
  )
}

const StaticFront = memo(function StaticFront({ disabled }: { disabled: boolean }) {
  const bodyMaterial = disabled ? MATERIALS.scorched : MATERIALS.olive
  const detailMaterial = disabled ? MATERIALS.char : MATERIALS.oliveDark
  return (
    <>
      <mesh castShadow geometry={BTR_HULL} material={bodyMaterial} receiveShadow />

      {/* Raised rear engine deck and grouped armored grilles. */}
      <mesh castShadow geometry={UNIT_BOX} material={detailMaterial} position={[0, 0.69, 2.25]} scale={[1.92, 0.18, 1.88]} />
      {GRILLE_Z.map((z) => (
        <mesh key={z} geometry={UNIT_BOX} material={MATERIALS.grille} position={[0, 0.792, z]} rotation={[0.08, 0, 0]} scale={[1.5, 0.025, 0.16]} />
      ))}

      {/* Closed roof panels and opaque vision blocks contain no visible interior. */}
      <mesh geometry={HATCH} material={detailMaterial} position={[-0.46, 0.655, -1.3]} scale={[1, 1, 0.84]} />
      <mesh geometry={HATCH} material={detailMaterial} position={[0.42, 0.655, -1.04]} scale={[0.88, 1, 0.72]} />
      {([-1, 1] as const).map((side) => (
        <mesh key={`front-optic-${side}`} geometry={UNIT_BOX} material={MATERIALS.optics} position={[side * 0.38, 0.48, -3.29]} rotation={[-0.19, 0, 0]} scale={[0.48, 0.17, 0.035]} />
      ))}
      {([-1, 1] as const).map((side) => (
        <mesh key={`side-optic-${side}`} geometry={UNIT_BOX} material={MATERIALS.optics} position={[side * 1.185, 0.42, -2.76]} rotation={[0, 0, side * -0.18]} scale={[0.035, 0.18, 0.4]} />
      ))}
    </>
  )
})
const StaticRear = memo(function StaticRear({ disabled, damage, turretYawRadians }: { disabled: boolean; damage: number; turretYawRadians: number }) {
  const bodyMaterial = disabled ? MATERIALS.scorched : MATERIALS.olive
  const detailMaterial = disabled ? MATERIALS.char : MATERIALS.oliveDark
  return (
    <>
      {/* Compact central heavy-machine-gun turret. */}
      <group position={[0, 0, -0.22]} rotation={[disabled ? damage * 0.035 : 0, turretYawRadians, disabled ? damage * -0.025 : 0]}>
        <mesh castShadow geometry={TURRET_RING} material={detailMaterial} position={[0, 0.68, 0]} />
        <mesh castShadow geometry={TURRET_BODY} material={bodyMaterial} position={[0, 0.91, 0]} />
        <group rotation={[disabled ? damage * -0.09 : 0, 0, 0]}>
          <mesh castShadow geometry={MACHINE_GUN} material={MATERIALS.metal} position={[0, 0.98, -1.32]} rotation={[Math.PI / 2, 0, 0]} />
          <mesh geometry={MUZZLE} material={MATERIALS.char} position={[0, 0.98, -2.16]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
        <mesh geometry={UNIT_BOX} material={MATERIALS.optics} position={[0.22, 0.98, -0.4]} scale={[0.16, 0.13, 0.07]} />
        <mesh geometry={SEARCHLIGHT} material={MATERIALS.lamp} position={[-0.34, 1.1, -0.22]} />
      </group>

      {([-0.53, 0.53] as const).map((x) => (
        <mesh key={`waterjet-${x}`} geometry={WATERJET} material={MATERIALS.grille} position={[x, -0.27, 3.806]} rotation={[Math.PI / 2, 0, 0]} />
      ))}

      {disabled ? (
        <>
          <mesh geometry={UNIT_BOX} material={MATERIALS.char} position={[0.83, 0.31, -1.92]} rotation={[0.1, 0.2, -0.18]} scale={[0.68 + damage * 0.24, 0.045, 1.12]} />
          <mesh geometry={UNIT_BOX} material={MATERIALS.char} position={[-0.58, 0.65, 0.18]} rotation={[-0.08, -0.32, 0.06]} scale={[0.72, 0.04, 0.84]} />
        </>
      ) : null}
    </>
  )
})

const WHEEL_PARTS = [false, true].map((disabled) =>
  [-1, 1].map((side) => (
    <>
      <mesh castShadow geometry={TIRE} material={MATERIALS.tire} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={HUB} material={disabled ? MATERIALS.char : MATERIALS.hub} rotation={[0, 0, Math.PI / 2]} />
      <mesh geometry={HUB_MARKER} material={MATERIALS.oliveLight} position={[side * 0.208, 0.28, 0]} />
    </>
  )),
)
