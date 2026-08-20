import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, DynamicDrawUsage, InstancedMesh, MeshStandardMaterial, Object3D, Shape, ShapeGeometry } from 'three'

import type { SimulationWorldState, Vector3 } from '@/simulation'

import { AIR_GROUND_STRIKE_BY_ID, AMMUNITION_COOKOFF_SCHEDULE, FUEL_GROUND_FIRE_SCHEDULE, deriveMolniyaState, transformLocalOffsetByPose } from '@/simulation'

import type { AmmunitionCookoffBurstDescriptor, GroundFireDescriptor, Stage3Vec3 } from './stage3/index.ts'

import { AMMUNITION_BUNKERS, FUEL_TANKS, HARBOR_FEATURES } from '../world/stage2/stage2Data.ts'
import { getTerrainHeight } from '../world/stage2/terrainModel.ts'
import { ImpactEffect } from './BattleEffects.tsx'
import { AmmunitionCookoffEffect, BlastResponseField, BoundedSmokeColumn, FuelStorageHeroEffect, GuidedBomb, PersistentBlastDamage, PersistentGroundFires, createBlastResponseLayout } from './stage3/index.ts'

const PIPELINE_HIT: Stage3Vec3 = [-1_450, 26.66, 2_500]
const TANK_05_HIT: Stage3Vec3 = [-550, getTerrainHeight(-550, 2_050) + 22, 2_050]
const FUEL_RESPONSE_ORIGIN: Stage3Vec3 = [-545, getTerrainHeight(-545, 2_050), 2_050]
const FUEL_BLAST_ORIGIN: Stage3Vec3 = [FUEL_RESPONSE_ORIGIN[0], FUEL_RESPONSE_ORIGIN[1] + 8, FUEL_RESPONSE_ORIGIN[2]]

const WAREHOUSE_01 = HARBOR_FEATURES.warehouses[0]
const WAREHOUSE_01_CENTER_X = WAREHOUSE_01.points.reduce((sum, point) => sum + point[0], 0) / WAREHOUSE_01.points.length
const WAREHOUSE_01_CENTER_Z = WAREHOUSE_01.points.reduce((sum, point) => sum + point[1], 0) / WAREHOUSE_01.points.length
const WAREHOUSE_HIT: Stage3Vec3 = [WAREHOUSE_01_CENTER_X, getTerrainHeight(WAREHOUSE_01_CENTER_X, WAREHOUSE_01_CENTER_Z) + WAREHOUSE_01.heightM, WAREHOUSE_01_CENTER_Z]

const TALWAR_DECK_FIRE_LOCAL: Vector3 = { x: 0, y: 4.4, z: -31 }
const TALWAR_HANGAR_FIRE_LOCAL: Vector3 = { x: 0, y: 9.1, z: 30 }
const TALWAR_FUNNEL_SMOKE_LOCAL: Vector3 = { x: 0, y: 18.2, z: 10.5 }
const MOLNIYA_FIRE_LOCAL: Vector3 = { x: -3, y: 4.1, z: 10 }
const MOLNIYA_SMOKE_LOCAL: Vector3 = { x: 0, y: 5.4, z: 15 }

const LOCAL_FIRE: readonly GroundFireDescriptor[] = [{ delaySeconds: 0.18, offset: [0, 0, 0], phase: 1.4, scale: 0.72 }]
const HEAVY_FIRE: readonly GroundFireDescriptor[] = [
  { delaySeconds: 0.22, offset: [0, 0, 0], phase: 0.7, scale: 0.95 },
  { delaySeconds: 0.75, offset: [5, 0, -3], phase: 3.1, scale: 0.68 },
]
const SURFACE_FIRES: readonly GroundFireDescriptor[] = [
  { delaySeconds: 0.15, offset: [0, 0, 0], phase: 0.4, scale: 0.82 },
  { delaySeconds: 0.65, offset: [0, 0, 0], phase: 2.2, scale: 0.62 },
  { delaySeconds: 1.25, offset: [0, 0, 0], phase: 4.8, scale: 0.7 },
]

const AMMO_POSITIONS = AMMUNITION_BUNKERS.map((bunker): Stage3Vec3 => {
  const [x, z] = bunker.center
  return [x, getTerrainHeight(x, z) + 8.2, z]
})
const AMMO_PRIMARY_POSITION = AMMO_POSITIONS[3]!
const AMMO_SECONDARY_POSITIONS = AMMO_POSITIONS.slice(1)
const AMMO_COOKOFF_BURSTS: readonly AmmunitionCookoffBurstDescriptor[] = AMMUNITION_COOKOFF_SCHEDULE.map((pulse) => {
  const bunkerIndex = AMMUNITION_BUNKERS.findIndex((bunker) => bunker.id === pulse.targetId)
  return {
    diameterM: 9 + pulse.strength * 9,
    eventTimeSeconds: pulse.atSeconds,
    position: AMMO_POSITIONS[bunkerIndex] ?? [pulse.position.x, pulse.position.y, pulse.position.z],
    sharpness: pulse.strength,
  }
})
const FUEL_GROUND_FIRE_POSITIONS = FUEL_GROUND_FIRE_SCHEDULE.map((fire): Stage3Vec3 => [fire.position.x, getTerrainHeight(fire.position.x, fire.position.z), fire.position.z])
const MOLNIYA_IMPACT = tuple(transformLocalOffsetByPose(deriveMolniyaState(128).pose, MOLNIYA_FIRE_LOCAL))

const INDUSTRIAL_LIGHTS = [
  [-1_320, 2_920],
  [250, 2_920],
  [-1_320, 1_320],
  [520, 1_350],
  [980, 2_750],
  [2_630, 2_700],
  [2_630, 1_400],
  [980, 1_400],
] as const
const INDUSTRIAL_LIGHT_POSITIONS = INDUSTRIAL_LIGHTS.map(([x, z]): Stage3Vec3 => [x, getTerrainHeight(x, z) + 13, z])

const RESPONSE_LAYOUT = createBlastResponseLayout({
  origin: FUEL_RESPONSE_ORIGIN,
  responseRadiusM: 320,
  seed: 52_730,
  surfaceHeightAt: getTerrainHeight,
}).filter((descriptor) => FUEL_TANKS.every((tank) => Math.hypot(descriptor.position[0] - tank.center[0], descriptor.position[2] - tank.center[1]) > tank.radiusM + 18))

const HARBOR_DEBRIS_GEOMETRY = new BoxGeometry(1, 1, 1)
const HARBOR_DEBRIS_MATERIAL = new MeshStandardMaterial({ color: '#2a302e', metalness: 0.42, roughness: 0.76 })
const WAREHOUSE_ROOF_HEIGHT = () => WAREHOUSE_HIT[1]

function tuple(value: Vector3): Stage3Vec3 {
  return [value.x, value.y, value.z]
}

function createSheenGeometry() {
  const shape = new Shape()
  const count = 36
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2
    const radius = 0.84 + Math.sin(index * 1.91 + 0.3) * 0.11 + Math.sin(index * 0.67 + 1.8) * 0.06
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (index === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new ShapeGeometry(shape)
}

function HarborFuelSheen({ center, progress, surfaceFireVisible, timeSeconds }: { center: Stage3Vec3; progress: number; surfaceFireVisible: boolean; timeSeconds: number }) {
  const geometry = useMemo(createSheenGeometry, [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const radius = Math.max(0.01, progress * 170)
  const firePositions = useMemo<readonly Stage3Vec3[]>(
    () => [
      [center[0] - radius * 0.22, 0.2, center[2] + radius * 0.08],
      [center[0] + radius * 0.17, 0.2, center[2] - radius * 0.14],
      [center[0] + radius * 0.03, 0.2, center[2] + radius * 0.24],
    ],
    [center, radius],
  )

  if (progress <= 0) return null
  return (
    <group name="stage3-talwar-harbor-contamination">
      <mesh geometry={geometry} position={[center[0], 0.12, center[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[radius, radius * 0.72, 1]}>
        <meshBasicMaterial color="#151b1b" depthWrite={false} opacity={0.58} transparent />
      </mesh>
      <mesh geometry={geometry} position={[center[0] + radius * 0.07, 0.135, center[2] - radius * 0.03]} rotation={[-Math.PI / 2, 0, 0.8]} scale={[radius * 0.62, radius * 0.33, 1]}>
        <meshBasicMaterial color="#3b3630" depthWrite={false} opacity={0.29} transparent />
      </mesh>
      {surfaceFireVisible ? <PersistentGroundFires descriptors={SURFACE_FIRES} eventTimeSeconds={115} origin={center} positions={firePositions} timeSeconds={timeSeconds} /> : null}
    </group>
  )
}

function HarborFloatingDebris({ count, origin, timeSeconds }: { count: number; origin: Stage3Vec3; timeSeconds: number }) {
  const meshRef = useRef<InstancedMesh>(null)
  const scratchObject = useMemo(() => new Object3D(), [])
  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const object = scratchObject
    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.17 + 0.4
      const driftAge = Math.max(0, timeSeconds - (index < 2 ? 48 : index < 5 ? 72 : 115))
      const distance = 18 + index * 7 + Math.min(50, driftAge * (0.08 + (index % 3) * 0.025))
      object.position.set(origin[0] + Math.sin(angle) * distance, 0.34 + Math.sin(timeSeconds * 0.4 + index) * 0.08, origin[2] + Math.cos(angle) * distance)
      object.rotation.set(0.08 * Math.sin(index), angle + timeSeconds * 0.015, 0.06 * Math.cos(index * 1.7))
      object.scale.set(3 + (index % 4) * 1.7, 0.35 + (index % 2) * 0.2, 1.4 + (index % 3) * 0.9)
      object.updateMatrix()
      mesh.setMatrixAt(index, object.matrix)
    }
    mesh.count = count
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
  }, [count, origin, scratchObject, timeSeconds])

  return <instancedMesh ref={meshRef} args={[HARBOR_DEBRIS_GEOMETRY, HARBOR_DEBRIS_MATERIAL, 12]} dispose={null} frustumCulled={false} />
}

function IndustrialIndicatorLights({ blackoutFraction }: { blackoutFraction: number }) {
  return (
    <group name="stage3-industrial-power-indicators">
      {INDUSTRIAL_LIGHT_POSITIONS.map((position, index) => {
        const outageThreshold = 0.08 + index * 0.075
        const emergency = index === 1 || index === 6
        const energized = emergency || blackoutFraction < outageThreshold
        return (
          <mesh key={`${position[0]}:${position[2]}`} position={position} visible={energized}>
            <sphereGeometry args={[1.35, 8, 6]} />
            <meshBasicMaterial color={emergency && blackoutFraction > 0 ? '#d9432b' : '#ffe3a4'} toneMapped={false} />
          </mesh>
        )
      })}
    </group>
  )
}

function LocalIndustrialDamage({ timeSeconds }: { timeSeconds: number }) {
  return (
    <group name="stage3-industrial-local-strike-damage">
      <ImpactEffect impactTime={78} persistent={false} position={PIPELINE_HIT} time={timeSeconds} variant="boundary-hit" />
      <PersistentGroundFires descriptors={HEAVY_FIRE} eventTimeSeconds={78} origin={PIPELINE_HIT} timeSeconds={timeSeconds} />
      <BoundedSmokeColumn ageSeconds={timeSeconds - 78.35} heightM={88} origin={PIPELINE_HIT} profile="local" puffCount={11} seed="pipeline-hit-smoke" />

      <ImpactEffect impactTime={86} persistent={false} position={TANK_05_HIT} time={timeSeconds} variant="vehicle-kill" />
      <PersistentGroundFires descriptors={HEAVY_FIRE} eventTimeSeconds={86} origin={TANK_05_HIT} timeSeconds={timeSeconds} />
      <BoundedSmokeColumn ageSeconds={timeSeconds - 86.25} heightM={118} origin={TANK_05_HIT} profile="local" puffCount={14} seed="tank-05-hit-smoke" />
    </group>
  )
}

function HarborDamage({ world }: { world: SimulationWorldState }) {
  const time = world.timeSeconds
  const { harbor, molniya, talwar } = world.stage3
  const talwarDeckFire = tuple(transformLocalOffsetByPose(talwar.pose, TALWAR_DECK_FIRE_LOCAL))
  const talwarHangarFire = tuple(transformLocalOffsetByPose(talwar.pose, TALWAR_HANGAR_FIRE_LOCAL))
  const talwarSmoke = tuple(transformLocalOffsetByPose(talwar.pose, TALWAR_FUNNEL_SMOKE_LOCAL))
  const leakCenter: Stage3Vec3 = [talwar.fuelLeakOrigin.x, 0.12, talwar.fuelLeakOrigin.z]
  const molniyaFire = tuple(transformLocalOffsetByPose(molniya.pose, MOLNIYA_FIRE_LOCAL))
  const molniyaSmoke = tuple(transformLocalOffsetByPose(molniya.pose, MOLNIYA_SMOKE_LOCAL))
  const debrisOrigin = talwar.firstHit ? leakCenter : WAREHOUSE_HIT

  return (
    <group name="stage3-harbor-damage-and-pollution">
      <PersistentBlastDamage eventTimeSeconds={48} origin={WAREHOUSE_HIT} profile="ammunition" seed="warehouse-harbor-01" surfaceHeightAt={WAREHOUSE_ROOF_HEIGHT} timeSeconds={time} />
      <PersistentGroundFires descriptors={LOCAL_FIRE} eventTimeSeconds={48} origin={WAREHOUSE_HIT} timeSeconds={time} />
      <BoundedSmokeColumn ageSeconds={time - 48.4} heightM={72} origin={WAREHOUSE_HIT} profile="local" puffCount={10} seed="warehouse-harbor-01-smoke" />

      <ImpactEffect impactTime={72} persistent={false} position={tuple(AIR_GROUND_STRIKE_BY_ID.talwar_first_hit.targetPosition)} time={time} variant="boundary-hit" />
      <ImpactEffect impactTime={115} persistent={false} position={tuple(AIR_GROUND_STRIKE_BY_ID.talwar_second_hit.targetPosition)} time={time} variant="boundary-hit" />
      {talwar.firstHit ? (
        <>
          <PersistentGroundFires descriptors={HEAVY_FIRE} eventTimeSeconds={72} origin={talwarDeckFire} timeSeconds={time} />
          <BoundedSmokeColumn ageSeconds={time - 72.25} heightM={135} origin={talwarSmoke} profile="local" puffCount={15} seed="talwar-first-hit-smoke" />
          <mesh position={talwarDeckFire} rotation={[0.2, talwar.pose.rotation.y, -0.4]}>
            <boxGeometry args={[14, 1.1, 9]} />
            <meshStandardMaterial color="#202321" metalness={0.45} roughness={0.86} />
          </mesh>
        </>
      ) : null}
      {talwar.secondHit ? (
        <>
          <PersistentGroundFires descriptors={HEAVY_FIRE} eventTimeSeconds={115} origin={talwarHangarFire} timeSeconds={time} />
          <BoundedSmokeColumn ageSeconds={time - 115.2} heightM={150} origin={talwarHangarFire} profile="local" puffCount={16} seed="talwar-second-hit-smoke" />
          <mesh position={talwarHangarFire} rotation={[-0.35, talwar.pose.rotation.y, 0.25]}>
            <boxGeometry args={[18, 1.3, 12]} />
            <meshStandardMaterial color="#191c1b" metalness={0.48} roughness={0.88} />
          </mesh>
        </>
      ) : null}

      <HarborFuelSheen center={leakCenter} progress={harbor.fuelSheenProgress} surfaceFireVisible={harbor.surfaceFuelFireVisible} timeSeconds={time} />
      <HarborFloatingDebris count={harbor.floatingDebrisCount} origin={debrisOrigin} timeSeconds={time} />

      <ImpactEffect impactTime={128} persistent={false} position={MOLNIYA_IMPACT} time={time} variant="vehicle-kill" />
      {molniya.damaged ? (
        <>
          <PersistentGroundFires descriptors={LOCAL_FIRE} eventTimeSeconds={128} origin={molniyaFire} timeSeconds={time} />
          <BoundedSmokeColumn ageSeconds={time - 128.1} heightM={64} origin={molniyaSmoke} profile="local" puffCount={10} seed="molniya-fragment-damage" />
        </>
      ) : null}
    </group>
  )
}

export function Stage3BattleEffects({ world }: { world: SimulationWorldState }) {
  const time = world.timeSeconds

  return (
    <group name="ash-harbor-stage3-effects">
      <group name="stage3-lower-bay-guided-bombs">
        {Object.values(world.stage3.weapons).map((weapon) => (
          <GuidedBomb key={weapon.id} position={tuple(weapon.position)} tangent={tuple(weapon.tangent)} visible={weapon.visible} />
        ))}
      </group>

      {time >= 48 ? <HarborDamage world={world} /> : null}
      {time >= 78 ? <LocalIndustrialDamage timeSeconds={time} /> : null}
      {time >= 92 ? <FuelStorageHeroEffect groundFirePositions={FUEL_GROUND_FIRE_POSITIONS} position={FUEL_BLAST_ORIGIN} seed={52_730} surfaceHeightAt={getTerrainHeight} timeSeconds={time} /> : null}
      <BlastResponseField descriptors={RESPONSE_LAYOUT} origin={FUEL_RESPONSE_ORIGIN} seed={52_730} surfaceHeightAt={getTerrainHeight} timeSeconds={time} />
      <IndustrialIndicatorLights blackoutFraction={world.stage3.industrial.blackoutFraction} />
      {time >= 116 ? (
        <AmmunitionCookoffEffect cookoffPositions={AMMO_POSITIONS} groundFirePositions={AMMO_POSITIONS} preliminaryBursts={AMMO_COOKOFF_BURSTS} primaryPosition={AMMO_PRIMARY_POSITION} secondaryPositions={AMMO_SECONDARY_POSITIONS} seed={52_730} surfaceHeightAt={getTerrainHeight} timeSeconds={time} />
      ) : null}
    </group>
  )
}
