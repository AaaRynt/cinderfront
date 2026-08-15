import { BoxGeometry, CylinderGeometry, MeshStandardMaterial } from 'three'

import { AAA_SITE, RADAR_SEARCH_SITE, RADAR_TRACKING_SITE } from '@/scene/world'

interface PrimarySearchRadarProps {
  destroyed: boolean
  rotation: number
  time: number
}

interface TrackingRadarProps {
  rotation: number
  tracking: boolean
}

interface FixedAaaProps {
  firing: boolean
  turretYaw: number
}

const UNIT_BOX = new BoxGeometry(1, 1, 1)
const UNIT_CYLINDER = new CylinderGeometry(1, 1, 1, 12)
const TRACKING_DISH_RIBS = [-0.8, -0.4, 0, 0.4, 0.8] as const

const MATERIALS = {
  concrete: new MeshStandardMaterial({ color: '#66665d', roughness: 0.95, metalness: 0.02 }),
  equipment: new MeshStandardMaterial({ color: '#586257', roughness: 0.74, metalness: 0.34 }),
  equipmentDark: new MeshStandardMaterial({ color: '#26312d', roughness: 0.82, metalness: 0.25 }),
  radarFace: new MeshStandardMaterial({ color: '#76867d', roughness: 0.58, metalness: 0.48 }),
  wreck: new MeshStandardMaterial({ color: '#242722', roughness: 0.96, metalness: 0.08 }),
  gun: new MeshStandardMaterial({ color: '#242b28', roughness: 0.63, metalness: 0.62 }),
  lamp: new MeshStandardMaterial({
    color: '#d49b45',
    emissive: '#d4751e',
    emissiveIntensity: 1.2,
    roughness: 0.55,
  }),
}

function RadarLattice({ damaged }: { damaged: boolean }) {
  return (
    <group rotation={[0, 0, damaged ? -0.17 : 0]}>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh geometry={UNIT_CYLINDER} material={damaged ? MATERIALS.wreck : MATERIALS.equipmentDark} position={[side * 3.4, 9.5, 0]} rotation={[0, 0, side * -0.24]} scale={[0.25, 10, 0.25]} />
          <mesh geometry={UNIT_CYLINDER} material={damaged ? MATERIALS.wreck : MATERIALS.equipmentDark} position={[side * 1.55, 9.5, 0]} rotation={[0, 0, side * 0.24]} scale={[0.23, 10, 0.23]} />
        </group>
      ))}
      {[3, 8, 13, 18].map((height) => (
        <mesh key={height} geometry={UNIT_BOX} material={damaged ? MATERIALS.wreck : MATERIALS.equipmentDark} position={[0, height, 0]} scale={[5.5, 0.28, 0.32]} />
      ))}
    </group>
  )
}

export function PrimarySearchRadar({ destroyed, rotation, time }: PrimarySearchRadarProps) {
  const [x, y, z] = RADAR_SEARCH_SITE.position
  const finalTilt = destroyed ? 0.58 : 0
  const warningPulse = 0.6 + Math.sin(time * 3.2) * 0.22

  return (
    <group name="primary-search-radar" position={[x, y, z]}>
      <mesh geometry={UNIT_CYLINDER} material={MATERIALS.concrete} position={[0, 1.1, 0]} scale={[13, 2.2, 13]} receiveShadow />
      <mesh geometry={UNIT_BOX} material={destroyed ? MATERIALS.wreck : MATERIALS.equipment} position={[0, 3.6, 0]} scale={[10, 5, 8]} castShadow />
      <RadarLattice damaged={destroyed} />
      <group position={[0, 20, 0]} rotation={[0, rotation, finalTilt]}>
        <mesh geometry={UNIT_BOX} material={destroyed ? MATERIALS.wreck : MATERIALS.radarFace} position={[0, 3.8, 0]} scale={[28, 8.5, 0.75]} castShadow />
        {!destroyed && (
          <>
            {[-10.5, -7, -3.5, 0, 3.5, 7, 10.5].map((offset) => (
              <mesh key={offset} geometry={UNIT_BOX} material={MATERIALS.equipmentDark} position={[offset, 3.8, -0.48]} scale={[0.16, 8, 0.12]} />
            ))}
            <mesh geometry={UNIT_BOX} material={MATERIALS.equipmentDark} position={[0, 3.8, -0.54]} scale={[27.6, 0.17, 0.13]} />
          </>
        )}
        <mesh geometry={UNIT_CYLINDER} material={destroyed ? MATERIALS.wreck : MATERIALS.equipmentDark} position={[0, -0.5, 0]} scale={[0.8, 5.2, 0.8]} />
      </group>
      {!destroyed && (
        <mesh geometry={UNIT_CYLINDER} material={MATERIALS.lamp} position={[0, 30.2, 0]} scale={[0.58, 1, 0.58]}>
          <meshStandardMaterial color="#d49b45" emissive="#d4751e" emissiveIntensity={warningPulse} roughness={0.55} />
        </mesh>
      )}
    </group>
  )
}

function TrackingDish() {
  return (
    <group rotation={[-0.28, 0, 0]}>
      <mesh material={MATERIALS.radarFace} scale={[7.5, 5.4, 1.35]}>
        <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {TRACKING_DISH_RIBS.map((rib) => (
        <mesh key={rib} geometry={UNIT_BOX} material={MATERIALS.equipmentDark} position={[rib * 7, 0.8, -0.95]} scale={[0.12, 5, 0.16]} />
      ))}
      <mesh geometry={UNIT_CYLINDER} material={MATERIALS.equipmentDark} position={[0, -0.3, -3]} rotation={[Math.PI / 2, 0, 0]} scale={[0.35, 3.4, 0.35]} />
      <mesh geometry={UNIT_BOX} material={MATERIALS.equipmentDark} position={[0, -0.2, -6.1]} scale={[1.2, 1.2, 1.4]} />
    </group>
  )
}

export function TrackingRadar({ rotation, tracking }: TrackingRadarProps) {
  const [x, y, z] = RADAR_TRACKING_SITE.position
  return (
    <group name="tracking-radar" position={[x, y, z]}>
      <mesh geometry={UNIT_CYLINDER} material={MATERIALS.concrete} position={[0, 0.9, 0]} scale={[9, 1.8, 9]} receiveShadow />
      <mesh geometry={UNIT_BOX} material={MATERIALS.equipment} position={[0, 3.4, 0]} scale={[8, 5, 7]} castShadow />
      <group position={[0, 8.4, 0]} rotation={[0, rotation, 0]}>
        <mesh geometry={UNIT_CYLINDER} material={MATERIALS.equipmentDark} position={[0, 1, 0]} scale={[0.72, 4.2, 0.72]} />
        <group position={[0, 4.7, 0]} rotation={[tracking ? -0.08 : 0, 0, 0]}>
          <TrackingDish />
        </group>
      </group>
    </group>
  )
}

export function FixedAaa({ firing, turretYaw }: FixedAaaProps) {
  const [x, y, z] = AAA_SITE.position
  return (
    <group name="fixed-aaa" position={[x, y, z]}>
      <mesh geometry={UNIT_CYLINDER} material={MATERIALS.concrete} position={[0, 0.7, 0]} scale={[14, 1.4, 14]} receiveShadow />
      <mesh geometry={UNIT_CYLINDER} material={MATERIALS.equipment} position={[0, 2.6, 0]} scale={[5.2, 3.4, 5.2]} castShadow />
      <group position={[0, 4.8, 0]} rotation={[0, turretYaw, 0]}>
        <mesh geometry={UNIT_BOX} material={MATERIALS.equipmentDark} position={[0, 0.6, 0]} scale={[6.4, 2.2, 5.6]} castShadow />
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 1.7, 1.2, -1.7]} rotation={[-0.38, 0, 0]}>
            <mesh geometry={UNIT_CYLINDER} material={MATERIALS.gun} position={[0, 0, -5.2]} rotation={[Math.PI / 2, 0, 0]} scale={[0.24, 6.5, 0.24]} />
            {firing && (
              <mesh position={[0, 0, -11.6]} scale={1.1}>
                <sphereGeometry args={[1, 8, 6]} />
                <meshBasicMaterial color="#ffd58a" toneMapped={false} />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  )
}
