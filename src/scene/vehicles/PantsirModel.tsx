import type { ThreeElements } from '@react-three/fiber'

import * as THREE from 'three'

import { clamp01 } from './modelGeometry'

export interface PantsirModelProps extends Omit<ThreeElements['group'], 'children'> {
  /** Turret azimuth in radians, measured from local forward (-Z). */
  turretYaw?: number
  /** Search-radar azimuth in radians relative to the turret. */
  radarRotation?: number
  /** Launcher elevation in radians. */
  launcherElevation?: number
  /** Number of opened/expended tubes across both six-tube banks (0..12). */
  firedTubeCount?: number
  destroyed?: boolean
  /** Seconds since destruction, used only for deterministic wreck settling. */
  destructionAge?: number
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 10)
const WHEEL = new THREE.CylinderGeometry(0.72, 0.72, 0.38, 16)
const MISSILE_TUBE = new THREE.CylinderGeometry(0.145, 0.145, 2.85, 10)
const GUN_BARREL = new THREE.CylinderGeometry(0.035, 0.045, 3.25, 7)
const TRACKING_RADAR = new THREE.CylinderGeometry(0.57, 0.57, 0.12, 24)
const TUBE_CAP = new THREE.CircleGeometry(0.125, 10)

const MATERIALS = {
  body: new THREE.MeshStandardMaterial({ color: '#697250', roughness: 0.86, metalness: 0.14 }),
  bodyDark: new THREE.MeshStandardMaterial({
    color: '#4c543b',
    roughness: 0.88,
    metalness: 0.12,
  }),
  wreck: new THREE.MeshStandardMaterial({ color: '#262824', roughness: 0.96, metalness: 0.1 }),
  scorchedOlive: new THREE.MeshStandardMaterial({
    color: '#3d4234',
    roughness: 0.95,
    metalness: 0.08,
  }),
  tire: new THREE.MeshStandardMaterial({ color: '#111312', roughness: 0.98, metalness: 0.02 }),
  glass: new THREE.MeshStandardMaterial({ color: '#10232a', roughness: 0.12, metalness: 0.72 }),
  metal: new THREE.MeshStandardMaterial({ color: '#202521', roughness: 0.55, metalness: 0.66 }),
  radar: new THREE.MeshStandardMaterial({ color: '#7d865e', roughness: 0.76, metalness: 0.2 }),
  tubeMouth: new THREE.MeshStandardMaterial({ color: '#090b0a', roughness: 0.92, metalness: 0.05 }),
  tubeCap: new THREE.MeshStandardMaterial({ color: '#79815c', roughness: 0.82, metalness: 0.14 }),
  ember: new THREE.MeshBasicMaterial({ color: '#ff7b25' }),
}

const AXLE_Z = [-4.15, -2.72, 2.66, 4.08] as const
const STABILIZER_POSITIONS = [
  [-1.39, -2.55],
  [1.39, -2.55],
  [-1.39, 3.55],
  [1.39, 3.55],
] as const
const TUBE_POSITIONS = Array.from({ length: 6 }, (_, index) => ({
  x: (index % 2 === 0 ? -1 : 1) * 0.19,
  y: (Math.floor(index / 2) - 1) * 0.31,
}))

interface LauncherBankProps {
  bankIndex: number
  side: -1 | 1
  elevation: number
  firedTubeCount: number
  destroyed: boolean
  settled: number
}

function LauncherBank({ bankIndex, side, elevation, firedTubeCount, destroyed, settled }: LauncherBankProps) {
  const bankDamage = destroyed ? side * settled * 0.08 : 0
  const structureMaterial = destroyed ? MATERIALS.scorchedOlive : MATERIALS.bodyDark

  return (
    <group position={[side * 1.18, 3.55, 0.8]} rotation={[elevation + bankDamage, 0, destroyed ? side * settled * 0.055 : 0]}>
      <mesh geometry={UNIT_BOX} material={structureMaterial} position={[0, 0, -1.25]} scale={[0.9, 1.18, 2.8]} />
      {TUBE_POSITIONS.map((tube, tubeIndex) => {
        const globalTubeIndex = bankIndex * 6 + tubeIndex
        const fired = globalTubeIndex < firedTubeCount
        return (
          <group key={tubeIndex} position={[tube.x, tube.y, -1.42]}>
            <mesh geometry={MISSILE_TUBE} material={destroyed ? MATERIALS.wreck : MATERIALS.body} rotation={[-Math.PI / 2, 0, 0]} castShadow />
            <mesh geometry={TUBE_CAP} material={fired || destroyed ? MATERIALS.tubeMouth : MATERIALS.tubeCap} position={[0, 0, -1.435]} rotation={[0, Math.PI, 0]} />
          </group>
        )
      })}
    </group>
  )
}

interface PairedGunProps {
  side: -1 | 1
  elevation: number
  destroyed: boolean
  settled: number
}

function PairedGun({ side, elevation, destroyed, settled }: PairedGunProps) {
  return (
    <group position={[side * 0.64, 3.58, 0.62]} rotation={[Math.max(0.18, elevation + 0.1) - (destroyed ? settled * 0.18 : 0), 0, 0]}>
      <mesh geometry={UNIT_BOX} material={destroyed ? MATERIALS.wreck : MATERIALS.bodyDark} position={[0, 0, -0.08]} scale={[0.34, 0.48, 0.72]} />
      {([-0.07, 0.07] as const).map((x) => (
        <mesh key={x} geometry={GUN_BARREL} material={MATERIALS.metal} position={[x, 0.05, -1.72]} rotation={[-Math.PI / 2, 0, 0]} castShadow />
      ))}
    </group>
  )
}

/** A deployed, meter-scale Pantsir-S1 approximation with the cab facing local -Z. */
export function PantsirModel({ turretYaw = 0, radarRotation = 0, launcherElevation = Math.PI / 10, firedTubeCount = 0, destroyed = false, destructionAge = 0, ...groupProps }: PantsirModelProps) {
  const age = Math.max(0, destructionAge)
  const settled = destroyed ? clamp01(age / 1.2) : 0
  const impactRock = destroyed ? Math.sin(age * 18) * Math.exp(-age * 2.8) * 0.06 : 0
  const elevation = Math.max(-0.12, Math.min(1.15, launcherElevation))
  const fired = Math.max(0, Math.min(12, Math.floor(firedTubeCount)))
  const bodyMaterial = destroyed ? MATERIALS.scorchedOlive : MATERIALS.body
  const weaponMaterial = destroyed ? MATERIALS.wreck : MATERIALS.bodyDark

  return (
    <group {...groupProps} dispose={null}>
      <group rotation={[0, 0, impactRock - settled * 0.035]}>
        {/* 10.30 m chassis: cab front -5.15, equipment-body rear +5.15. */}
        <mesh geometry={UNIT_BOX} material={destroyed ? MATERIALS.wreck : MATERIALS.bodyDark} position={[0, 0.82, 0]} scale={[2.65, 0.36, 10.3]} castShadow />
        <mesh geometry={UNIT_BOX} material={bodyMaterial} position={[0, 1.85, -3.75]} scale={[2.5, 2.18, 2.8]} castShadow />
        <mesh geometry={UNIT_BOX} material={bodyMaterial} position={[0, 1.87, 1.4]} scale={[2.55, 1.82, 7.5]} castShadow />

        {/* Opaque cab glazing carries no interior or occupants. */}
        {([-1, 1] as const).map((side) => (
          <mesh key={`front-${side}`} geometry={UNIT_BOX} material={MATERIALS.glass} position={[side * 0.62, 2.25, -5.16]} scale={[1.05, 0.65, 0.04]} />
        ))}
        {([-1, 1] as const).map((side) => (
          <mesh key={`side-${side}`} geometry={UNIT_BOX} material={MATERIALS.glass} position={[side * 1.255, 2.25, -4.08]} scale={[0.04, 0.62, 0.86]} />
        ))}
        <mesh geometry={UNIT_BOX} material={MATERIALS.bodyDark} position={[0, 1.46, -5.17]} scale={[1.72, 0.32, 0.05]} />

        {/* Exactly four wheels on each side, arranged as two forward and two rear axles. */}
        {([-1, 1] as const).flatMap((side) => AXLE_Z.map((z) => <mesh key={`${side}-${z}`} geometry={WHEEL} material={MATERIALS.tire} position={[side * 1.38, 0.72, z]} rotation={[0, 0, Math.PI / 2]} castShadow />))}

        {/* Four deployed stabilizer legs and pads. */}
        {STABILIZER_POSITIONS.map(([x, z]) => (
          <group key={`${x}-${z}`} position={[x, 0.56, z]}>
            <mesh geometry={UNIT_CYLINDER} material={MATERIALS.metal} scale={[0.075, 1.02, 0.075]} />
            <mesh geometry={UNIT_CYLINDER} material={MATERIALS.metal} position={[0, -0.5, 0]} scale={[0.24, 0.06, 0.24]} />
          </group>
        ))}

        {/* Whole combat module tracks in azimuth while launchers and guns elevate. */}
        <group position={[0, 0, 0.7]} rotation={[0, turretYaw, destroyed ? settled * 0.05 : 0]}>
          <mesh geometry={UNIT_CYLINDER} material={weaponMaterial} position={[0, 2.83, 0]} scale={[0.86, 0.42, 0.86]} />
          <mesh geometry={UNIT_BOX} material={weaponMaterial} position={[0, 3.22, 0.12]} scale={[1.34, 0.75, 1.52]} castShadow />

          <LauncherBank bankIndex={0} side={-1} elevation={elevation} firedTubeCount={fired} destroyed={destroyed} settled={settled} />
          <LauncherBank bankIndex={1} side={1} elevation={elevation} firedTubeCount={fired} destroyed={destroyed} settled={settled} />
          <PairedGun side={-1} elevation={elevation} destroyed={destroyed} settled={settled} />
          <PairedGun side={1} elevation={elevation} destroyed={destroyed} settled={settled} />

          {/* Circular front tracking radar and central electro-optical housing. */}
          <mesh geometry={TRACKING_RADAR} material={destroyed ? MATERIALS.wreck : MATERIALS.radar} position={[0, 3.42, -0.75]} rotation={[Math.PI / 2, 0, 0]} castShadow />
          <mesh geometry={UNIT_BOX} material={MATERIALS.glass} position={[0, 3.55, -1.0]} scale={[0.28, 0.23, 0.2]} />

          {/* Independently rotating raised rectangular search radar, top at 5.65 m. */}
          <group position={[0, 0, 0.05]} rotation={[0, radarRotation, destroyed ? settled * 0.18 : 0]}>
            <mesh geometry={UNIT_CYLINDER} material={MATERIALS.metal} position={[0, 4.42, 0.22]} scale={[0.1, 1.25, 0.1]} />
            <mesh geometry={UNIT_BOX} material={destroyed ? MATERIALS.wreck : MATERIALS.radar} position={[0, 5.15, 0.22]} scale={[2.12, 1.0, 0.16]} castShadow />
            <mesh geometry={UNIT_BOX} material={MATERIALS.metal} position={[0, 5.15, 0.13]} scale={[1.82, 0.7, 0.04]} />
          </group>
        </group>

        {/* Damage overlays leave the complete vehicle silhouette readable as a wreck. */}
        {destroyed && (
          <>
            <mesh geometry={UNIT_BOX} material={MATERIALS.wreck} position={[0.7, 2.82, 1.2]} rotation={[0.18, 0.32, 0.12]} scale={[1.1, 0.08, 1.45]} />
            <mesh geometry={UNIT_CYLINDER} material={MATERIALS.ember} position={[0.45, 2.86, 1.12]} scale={[0.2 + settled * 0.1, 0.28 + settled * 0.12, 0.2 + settled * 0.1]} />
          </>
        )}
      </group>
    </group>
  )
}
