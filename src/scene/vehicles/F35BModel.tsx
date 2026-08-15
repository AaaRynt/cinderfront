import type { ThreeElements } from '@react-three/fiber'

import * as THREE from 'three'

import { clamp01, createPrismGeometryXZ, createSectionedBodyGeometry } from './modelGeometry'

export interface F35BModelProps extends Omit<ThreeElements['group'], 'children'> {
  /** 0 = shut, 1 = fully open. */
  liftFanDoor?: number
  /** 0 = forward-flight nozzle, 1 = fully deflected for vertical lift. */
  nozzleDeflection?: number
  /** 0 = retracted, 1 = fully deployed. */
  gearDeployment?: number
  /** 0..1 visual fan/exhaust power. */
  enginePower?: number
  /** Deterministic lift-fan rotor angle in radians. */
  fanRotationRadians?: number
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 10)
const FAN_DISC = new THREE.CylinderGeometry(0.82, 0.82, 0.1, 24)
const NOZZLE = new THREE.CylinderGeometry(0.43, 0.6, 1.2, 12, 1, true)
const WHEEL = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12)
const MAIN_WHEEL = new THREE.CylinderGeometry(0.29, 0.29, 0.14, 12)
const CANOPY = new THREE.SphereGeometry(1, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2)

const MATERIALS = {
  airframe: new THREE.MeshStandardMaterial({
    color: '#4b555d',
    roughness: 0.62,
    metalness: 0.42,
    flatShading: true,
  }),
  airframeLight: new THREE.MeshStandardMaterial({
    color: '#606b72',
    roughness: 0.68,
    metalness: 0.34,
    flatShading: true,
  }),
  dark: new THREE.MeshStandardMaterial({ color: '#11181d', roughness: 0.48, metalness: 0.6 }),
  canopy: new THREE.MeshStandardMaterial({
    color: '#101a22',
    roughness: 0.08,
    metalness: 0.88,
  }),
  gear: new THREE.MeshStandardMaterial({ color: '#9ba3a5', roughness: 0.58, metalness: 0.66 }),
  tire: new THREE.MeshStandardMaterial({ color: '#101214', roughness: 0.94, metalness: 0.04 }),
  fan: new THREE.MeshStandardMaterial({ color: '#7b8589', roughness: 0.38, metalness: 0.82 }),
}

const FUSELAGE = createSectionedBodyGeometry(
  [
    { z: -7.8, halfWidth: 0.04, halfHeight: 0.04, centerY: 0.08 },
    { z: -6.25, halfWidth: 0.56, halfHeight: 0.42, centerY: 0.08 },
    { z: -4.2, halfWidth: 1.02, halfHeight: 0.66, centerY: 0.1 },
    { z: -2.25, halfWidth: 1.45, halfHeight: 0.82, centerY: 0.06 },
    { z: 0.25, halfWidth: 1.58, halfHeight: 0.86, centerY: 0.02 },
    { z: 3.25, halfWidth: 1.22, halfHeight: 0.72, centerY: 0.04 },
    { z: 5.8, halfWidth: 0.68, halfHeight: 0.54, centerY: 0.08 },
    { z: 6.65, halfWidth: 0.52, halfHeight: 0.48, centerY: 0.05 },
  ],
  8,
)

const LEFT_WING = createPrismGeometryXZ(
  [
    [-1.12, -1.85],
    [-5.35, 0.28],
    [-5.35, 1.26],
    [-1.52, 2.92],
  ],
  0.16,
  0.08,
)
const RIGHT_WING = createPrismGeometryXZ(
  [
    [1.12, -1.85],
    [1.52, 2.92],
    [5.35, 1.26],
    [5.35, 0.28],
  ],
  0.16,
  0.08,
)
const LEFT_STABILIZER = createPrismGeometryXZ(
  [
    [-0.62, 3.35],
    [-3.45, 4.55],
    [-3.15, 5.75],
    [-0.5, 5.2],
  ],
  0.12,
  0.1,
)
const RIGHT_STABILIZER = createPrismGeometryXZ(
  [
    [0.62, 3.35],
    [0.5, 5.2],
    [3.15, 5.75],
    [3.45, 4.55],
  ],
  0.12,
  0.1,
)
const VERTICAL_FIN = createPrismGeometryXZ(
  [
    [0, 3.05],
    [1.74, 3.72],
    [1.47, 5.38],
    [0, 5.75],
  ],
  0.14,
)

const FAN_BLADES = Array.from({ length: 10 }, (_, index) => (index / 10) * Math.PI * 2)

interface GearAssemblyProps {
  deployment: number
}

function LandingGear({ deployment }: GearAssemblyProps) {
  const visible = deployment > 0.015
  const fold = 1 - deployment

  return (
    <group visible={visible}>
      <group position={[0, -0.6, -4.65]} rotation={[fold * -1.2, 0, 0]}>
        <mesh geometry={UNIT_CYLINDER} material={MATERIALS.gear} position={[0, -0.68, 0]} scale={[0.055, 1.36, 0.055]} />
        <mesh geometry={WHEEL} material={MATERIALS.tire} position={[0, -1.38, 0]} rotation={[0, 0, Math.PI / 2]} />
        <mesh geometry={UNIT_BOX} material={MATERIALS.airframeLight} position={[0, -0.28, -0.12]} rotation={[0.25, 0, 0]} scale={[0.36, 0.7, 0.06]} />
      </group>

      {([-1, 1] as const).map((side) => (
        <group key={side} position={[side * 1.18, -0.38, 0.65]} rotation={[0, 0, side * fold * 1.05]}>
          <mesh geometry={UNIT_CYLINDER} material={MATERIALS.gear} position={[side * 0.28, -0.68, 0]} rotation={[0, 0, side * -0.38]} scale={[0.065, 1.48, 0.065]} />
          <mesh geometry={MAIN_WHEEL} material={MATERIALS.tire} position={[side * 0.55, -1.36, 0]} rotation={[0, 0, Math.PI / 2]} />
          <mesh geometry={UNIT_BOX} material={MATERIALS.airframeLight} position={[side * 0.18, -0.25, 0.04]} rotation={[0, 0, side * -0.2]} scale={[0.46, 0.82, 0.06]} />
        </group>
      ))}
    </group>
  )
}

/** A raw-meter F-35B approximation with its bow on local -Z. */
export function F35BModel({ liftFanDoor = 0, nozzleDeflection = 0, gearDeployment = 1, enginePower = 0, fanRotationRadians = 0, ...groupProps }: F35BModelProps) {
  const fanDoor = clamp01(liftFanDoor)
  const nozzle = clamp01(nozzleDeflection)
  const gear = clamp01(gearDeployment)
  const power = clamp01(enginePower)

  return (
    <group {...groupProps} dispose={null}>
      <mesh geometry={FUSELAGE} material={MATERIALS.airframe} castShadow receiveShadow />
      <mesh geometry={LEFT_WING} material={MATERIALS.airframe} castShadow />
      <mesh geometry={RIGHT_WING} material={MATERIALS.airframe} castShadow />
      <mesh geometry={LEFT_STABILIZER} material={MATERIALS.airframeLight} castShadow />
      <mesh geometry={RIGHT_STABILIZER} material={MATERIALS.airframeLight} castShadow />

      {/* Twin tails share a tapered profile and cant outward from the centerline. */}
      <group position={[1.36, 0.38, 0]} rotation={[0, 0, -0.22]}>
        <mesh geometry={VERTICAL_FIN} material={MATERIALS.airframeLight} rotation={[0, 0, Math.PI / 2]} castShadow />
      </group>
      <group position={[-1.36, 0.38, 0]} rotation={[0, 0, 0.22]}>
        <mesh geometry={VERTICAL_FIN} material={MATERIALS.airframeLight} rotation={[0, 0, Math.PI / 2]} castShadow />
      </group>

      {/* The opaque reflective canopy intentionally contains no cockpit or occupant. */}
      <mesh geometry={CANOPY} material={MATERIALS.canopy} position={[0, 0.78, -3.75]} scale={[0.9, 0.86, 1.62]} castShadow />

      {/* Deep contrasting side intakes preserve the broad-shouldered front silhouette. */}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} geometry={UNIT_BOX} material={MATERIALS.dark} position={[side * 1.32, 0.04, -2.28]} rotation={[0, side * 0.18, side * 0.08]} scale={[0.28, 0.62, 1.45]} />
      ))}

      {/* Visible lift fan and blades under a door hinged at its aft edge. */}
      <mesh geometry={FAN_DISC} material={MATERIALS.dark} position={[0, 0.91, -0.28]} />
      <group position={[0, 0.99, -0.28]} rotation={[0, fanRotationRadians, 0]}>
        {FAN_BLADES.map((angle) => (
          <mesh key={angle} geometry={UNIT_BOX} material={MATERIALS.fan} position={[Math.cos(angle) * 0.36, 0, Math.sin(angle) * 0.36]} rotation={[0, -angle, 0]} scale={[0.58, 0.045, 0.12]} />
        ))}
      </group>
      <group position={[0, 1.04, 0.62]} rotation={[fanDoor * 1.18, 0, 0]}>
        <mesh geometry={UNIT_BOX} material={MATERIALS.airframeLight} position={[0, 0.05, -0.9]} scale={[1.72, 0.1, 1.82]} castShadow />
      </group>

      {/* Single three-bearing-style exhaust pivots from aft (+Z) toward -Y. */}
      <group position={[0, 0.04, 6.6]} rotation={[nozzle * 1.34, 0, 0]}>
        <mesh geometry={NOZZLE} material={MATERIALS.dark} position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        <mesh geometry={UNIT_CYLINDER} position={[0, 0, 1.25 + power * 0.55]} rotation={[Math.PI / 2, 0, 0]} scale={[0.25 + power * 0.12, 0.2 + power * 1.6, 0.25 + power * 0.12]} visible={power > 0.02}>
          <meshBasicMaterial color="#91d7ee" opacity={0.18 + power * 0.42} transparent />
        </mesh>
      </group>

      <LandingGear deployment={gear} />
    </group>
  )
}
