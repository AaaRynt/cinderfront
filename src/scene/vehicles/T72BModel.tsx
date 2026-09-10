import type { ThreeElements } from '@react-three/fiber'

import { memo } from 'react'
import * as THREE from 'three'

import { clamp01 } from './modelGeometry.ts'

export interface T72BModelProps extends Omit<ThreeElements['group'], 'children'> {
  damageProgress?: number
  destroyed?: boolean
  roadWheelRotationRadians?: number
  trackTravelMeters?: number
  turretYawRadians?: number
}

interface HullSection {
  readonly bottomHalfWidth: number
  readonly roofHalfWidth: number
  readonly roofY: number
  readonly shoulderHalfWidth: number
  readonly z: number
}

const HULL_SECTIONS = [
  { bottomHalfWidth: 1.18, roofHalfWidth: 1.18, roofY: -0.02, shoulderHalfWidth: 1.48, z: -3.43 },
  { bottomHalfWidth: 1.32, roofHalfWidth: 1.38, roofY: 0.31, shoulderHalfWidth: 1.57, z: -2.63 },
  { bottomHalfWidth: 1.35, roofHalfWidth: 1.42, roofY: 0.34, shoulderHalfWidth: 1.6, z: -1.55 },
  { bottomHalfWidth: 1.35, roofHalfWidth: 1.42, roofY: 0.34, shoulderHalfWidth: 1.6, z: 2.62 },
  { bottomHalfWidth: 1.28, roofHalfWidth: 1.38, roofY: 0.31, shoulderHalfWidth: 1.55, z: 3.43 },
] as const satisfies readonly HullSection[]

function createHullGeometry() {
  const positions: number[] = []
  const indices: number[] = []
  for (const section of HULL_SECTIONS) {
    positions.push(-section.bottomHalfWidth, -0.58, section.z, section.bottomHalfWidth, -0.58, section.z, section.shoulderHalfWidth, -0.29, section.z, section.roofHalfWidth, section.roofY, section.z, -section.roofHalfWidth, section.roofY, section.z, -section.shoulderHalfWidth, -0.29, section.z)
  }

  const ringSize = 6
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

const HULL = createHullGeometry()
const BOX = new THREE.BoxGeometry(1, 1, 1)
const ROAD_WHEEL = new THREE.CylinderGeometry(0.435, 0.435, 0.18, 18)
const ROAD_WHEEL_HUB = new THREE.CylinderGeometry(0.16, 0.16, 0.195, 12)
const ROAD_WHEEL_MARKER = new THREE.BoxGeometry(0.035, 0.29, 0.055)
const TURRET_BASE = new THREE.CylinderGeometry(1.18, 1.28, 0.38, 12)
const TURRET_DOME = new THREE.SphereGeometry(1, 12, 6)
const TURRET_HATCH = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12)
const GUN_BARREL = new THREE.CylinderGeometry(0.062, 0.082, 4.85, 10)
const BORE_EVACUATOR = new THREE.CylinderGeometry(0.135, 0.145, 1.05, 10)
const MUZZLE_SLEEVE = new THREE.CylinderGeometry(0.09, 0.09, 0.45, 10)
const TREAD_MARKER = new THREE.BoxGeometry(0.5, 0.035, 0.24)

const MATERIALS = {
  armor: new THREE.MeshStandardMaterial({ color: '#596143', metalness: 0.17, roughness: 0.88 }),
  armorDark: new THREE.MeshStandardMaterial({ color: '#444a35', metalness: 0.2, roughness: 0.9 }),
  armorLight: new THREE.MeshStandardMaterial({ color: '#68704e', metalness: 0.13, roughness: 0.85 }),
  char: new THREE.MeshStandardMaterial({ color: '#171a17', metalness: 0.14, roughness: 0.98 }),
  optics: new THREE.MeshStandardMaterial({ color: '#08171a', metalness: 0.82, roughness: 0.13 }),
  scorched: new THREE.MeshStandardMaterial({ color: '#34382d', metalness: 0.12, roughness: 0.97 }),
  track: new THREE.MeshStandardMaterial({ color: '#171a18', metalness: 0.45, roughness: 0.8 }),
  wheel: new THREE.MeshStandardMaterial({ color: '#30352c', metalness: 0.22, roughness: 0.86 }),
} as const

const ROAD_WHEEL_Z = [-2.35, -1.4, -0.45, 0.5, 1.45, 2.4] as const
const TREAD_INDICES = Array.from({ length: 14 }, (_, index) => index)
const TRACK_PITCH_METERS = 0.154

function wrappedUnit(value: number) {
  return ((value % 1) + 1) % 1
}

interface TrackAssemblyProps {
  readonly destroyed: boolean
  readonly roadWheelRotationRadians: number
  readonly side: -1 | 1
  readonly trackTravelMeters: number
}

function TrackAssembly({ destroyed, roadWheelRotationRadians, side, trackTravelMeters }: TrackAssemblyProps) {
  const phase = trackTravelMeters / TRACK_PITCH_METERS
  const material = destroyed ? MATERIALS.char : MATERIALS.track
  return (
    <group position={[side * 1.48, 0, 0]}>
      <mesh castShadow geometry={BOX} material={material} position={[0, -0.29, 0]} scale={[0.63, 0.18, 5.45]} />
      <mesh geometry={BOX} material={material} position={[0, -1.015, 0]} scale={[0.63, 0.2, 5.45]} />
      <mesh geometry={BOX} material={material} position={[0, -0.65, -2.78]} rotation={[0.42, 0, 0]} scale={[0.63, 0.17, 0.92]} />
      <mesh geometry={BOX} material={material} position={[0, -0.65, 2.78]} rotation={[-0.42, 0, 0]} scale={[0.63, 0.17, 0.92]} />

      {ROAD_WHEEL_Z.map((z) => (
        <group key={z} position={[0, -0.68, z]} rotation={[-roadWheelRotationRadians, 0, 0]}>
          <mesh castShadow geometry={ROAD_WHEEL} material={destroyed ? MATERIALS.char : MATERIALS.wheel} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={ROAD_WHEEL_HUB} material={destroyed ? MATERIALS.char : MATERIALS.armorDark} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={ROAD_WHEEL_MARKER} material={MATERIALS.armorLight} position={[side * 0.105, 0.25, 0]} />
        </group>
      ))}

      {TREAD_INDICES.map((index) => {
        const topProgress = wrappedUnit(index / TREAD_INDICES.length - phase)
        const bottomProgress = wrappedUnit(index / TREAD_INDICES.length + phase)
        return (
          <group key={index}>
            <mesh geometry={TREAD_MARKER} material={material} position={[0, -0.188, -2.62 + topProgress * 5.24]} />
            <mesh geometry={TREAD_MARKER} material={material} position={[0, -1.0975, -2.62 + bottomProgress * 5.24]} />
          </group>
        )
      })}
    </group>
  )
}

interface StaticBodyProps {
  readonly damage: number
  readonly destroyed: boolean
  readonly turretYawRadians: number
}

const StaticBody = memo(function StaticBody({ damage, destroyed, turretYawRadians }: StaticBodyProps) {
  const armorMaterial = destroyed ? MATERIALS.scorched : MATERIALS.armor
  const detailMaterial = destroyed ? MATERIALS.char : MATERIALS.armorDark
  return (
    <>
      <mesh castShadow geometry={HULL} material={armorMaterial} receiveShadow />
      <mesh castShadow geometry={BOX} material={detailMaterial} position={[0, 0.39, 2.35]} scale={[2.72, 0.12, 1.75]} />
      {[-0.6, -0.2, 0.2, 0.6].map((x) => (
        <mesh key={x} geometry={BOX} material={MATERIALS.char} position={[x, 0.458, 2.35]} scale={[0.18, 0.025, 1.42]} />
      ))}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} castShadow geometry={BOX} material={detailMaterial} position={[side * 1.56, -0.08, 0.15]} scale={[0.14, 0.39, 5.75]} />
      ))}

      <group position={[0, 0, -0.28]} rotation={[destroyed ? damage * 0.012 : 0, turretYawRadians, destroyed ? damage * -0.018 : 0]}>
        <mesh castShadow geometry={TURRET_BASE} material={armorMaterial} position={[0, 0.53, 0]} />
        <mesh castShadow geometry={TURRET_DOME} material={armorMaterial} position={[0, 0.7, 0]} scale={[1.29, 0.33, 1.17]} />
        {[-1, 1].map((side) => (
          <mesh key={`front-era-${side}`} geometry={BOX} material={destroyed ? MATERIALS.char : MATERIALS.armorLight} position={[side * 0.53, 0.69, -1.03]} rotation={[0.08, side * 0.18, 0]} scale={[0.72, 0.22, 0.22]} />
        ))}
        {([-1, 1] as const).map((side) => (
          <mesh key={`side-era-${side}`} geometry={BOX} material={destroyed ? MATERIALS.char : MATERIALS.armorLight} position={[side * 1.12, 0.66, -0.08]} rotation={[0, side * 0.13, side * -0.08]} scale={[0.24, 0.22, 0.72]} />
        ))}

        <mesh geometry={TURRET_HATCH} material={detailMaterial} position={[0.43, 1.09, 0.08]} />
        <mesh geometry={TURRET_HATCH} material={detailMaterial} position={[-0.43, 1.066, 0.16]} scale={[0.88, 1, 0.88]} />
        <mesh geometry={BOX} material={MATERIALS.optics} position={[-0.32, 0.92, -1.02]} scale={[0.2, 0.13, 0.06]} />

        <mesh castShadow geometry={GUN_BARREL} material={MATERIALS.char} position={[0, 0.76, -2.945]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh castShadow geometry={BORE_EVACUATOR} material={detailMaterial} position={[0, 0.76, -3.07]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={MUZZLE_SLEEVE} material={MATERIALS.char} position={[0, 0.76, -5.595]} rotation={[Math.PI / 2, 0, 0]} />
      </group>

      {destroyed ? (
        <>
          <mesh geometry={BOX} material={MATERIALS.char} position={[0.72, 0.14, -1.5]} rotation={[0.08, 0.18, -0.16]} scale={[0.8 + damage * 0.28, 0.035, 1.22]} />
          <mesh geometry={BOX} material={MATERIALS.char} position={[-0.58, 0.43, 1.72]} rotation={[-0.06, -0.28, 0.04]} scale={[0.85, 0.035, 0.92]} />
        </>
      ) : null}
    </>
  )
})

/** Exact-scale, centered T-72B approximation with local -Z forward and no interior. */
export function T72BModel({ damageProgress = 0, destroyed = false, roadWheelRotationRadians = 0, trackTravelMeters = 0, turretYawRadians = 0, ...groupProps }: T72BModelProps) {
  const damage = clamp01(damageProgress)
  return (
    <group {...groupProps} dispose={null}>
      <TrackAssembly destroyed={destroyed} roadWheelRotationRadians={roadWheelRotationRadians} side={-1} trackTravelMeters={trackTravelMeters} />
      <TrackAssembly destroyed={destroyed} roadWheelRotationRadians={roadWheelRotationRadians} side={1} trackTravelMeters={trackTravelMeters} />
      <StaticBody damage={damage} destroyed={destroyed} turretYawRadians={turretYawRadians} />
    </group>
  )
}
