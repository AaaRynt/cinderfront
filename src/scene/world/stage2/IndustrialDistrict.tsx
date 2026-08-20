import { Quaternion, Vector3 } from 'three'

import type { WorldPosition, XZPoint } from '../worldData.ts'
import type { Stage2Materials } from './stage2Materials.ts'

import { DistrictEquipmentBatch, DistrictLightPoleBatch, PipelineRun, PipeRack, SecurityFence, createEnvironmentResponseGroup, type DistrictGeneratorInstance, type DistrictLightPoleInstance, type DistrictTransformerBankInstance } from './environment/index.ts'
import { AMMUNITION_BUNKERS, FUEL_BUND_CELLS, FUEL_PIPE_RUNS, FUEL_TANKS, INDUSTRIAL_FEATURES, PIPELINE_HARBOR_FUEL_TRUNK, SECURITY_FENCES } from './stage2Data.ts'
import { PolygonPrism, PolygonSurface, TerrainPolygonSurface, TerrainRoad } from './Stage2Meshes.tsx'
import { FuelTank } from './Stage2Structures.tsx'
import { getTerrainHeight } from './terrainModel.ts'

const STORAGE_FIXTURES = createEnvironmentResponseGroup('storage-industrial-fixtures', 'region_b_storage_district', 'industrial_fixture')
const STORAGE_FENCE = createEnvironmentResponseGroup('storage-security-fence', 'region_b_storage_district', 'fence')
const STORAGE_GENERATORS = [
  { id: 'fuel-pump-generator', position: [345, getTerrainHeight(345, 1610) + 0.2, 1610] },
  { headingDeg: 90, id: 'ammunition-yard-generator', position: [2050, getTerrainHeight(2050, 1460), 1460] },
] satisfies readonly DistrictGeneratorInstance[]
const STORAGE_TRANSFORMERS = [
  {
    headingDeg: 90,
    id: 'fuel-transfer-transformers',
    position: [465, getTerrainHeight(465, 1680) + 0.2, 1680],
    unitCount: 3,
  },
] satisfies readonly DistrictTransformerBankInstance[]
const STORAGE_LIGHTS = [
  [-1320, 2920],
  [250, 2920],
  [-1320, 1320],
  [520, 1350],
  [980, 2750],
  [2630, 2700],
  [2630, 1400],
  [980, 1400],
].map(([x, z], index) => ({
  heightM: 13,
  id: `storage-light-${index + 1}`,
  position: [x!, getTerrainHeight(x!, z!), z!] as WorldPosition,
})) satisfies readonly DistrictLightPoleInstance[]
const Z_AXIS = new Vector3(0, 0, 1)

function terrainVertices(points: readonly XZPoint[], yOffset = 0): WorldPosition[] {
  return points.map(([x, z]) => [x, getTerrainHeight(x, z) + yOffset, z])
}

function TerrainBundSegment({ end, heightM, materials, start }: { end: XZPoint; heightM: number; materials: Stage2Materials; start: XZPoint }) {
  const startVector = new Vector3(start[0], getTerrainHeight(start[0], start[1]) + heightM / 2, start[1])
  const endVector = new Vector3(end[0], getTerrainHeight(end[0], end[1]) + heightM / 2, end[1])
  const direction = endVector.clone().sub(startVector)
  const length = direction.length()
  const position = startVector.clone().add(endVector).multiplyScalar(0.5)
  const quaternion = new Quaternion().setFromUnitVectors(Z_AXIS, direction.normalize())

  return (
    <mesh castShadow material={materials.berm} position={position} quaternion={quaternion} receiveShadow>
      <boxGeometry args={[20, heightM, length + 2]} />
    </mesh>
  )
}

function BundRing({ points, heightM, materials }: { heightM: number; materials: Stage2Materials; points: readonly XZPoint[] }) {
  const segments = points.flatMap((start, edgeIndex) => {
    const end = points[(edgeIndex + 1) % points.length]!
    const length = Math.hypot(end[0] - start[0], end[1] - start[1])
    const segmentCount = Math.max(1, Math.ceil(length / 120))
    return Array.from({ length: segmentCount }, (_, segmentIndex) => {
      const startProgress = segmentIndex / segmentCount
      const endProgress = (segmentIndex + 1) / segmentCount
      return {
        end: [start[0] + (end[0] - start[0]) * endProgress, start[1] + (end[1] - start[1]) * endProgress] as XZPoint,
        key: `${edgeIndex}:${segmentIndex}`,
        start: [start[0] + (end[0] - start[0]) * startProgress, start[1] + (end[1] - start[1]) * startProgress] as XZPoint,
      }
    })
  })

  return (
    <group>
      <TerrainPolygonSurface material={materials.hardstand} points={points} yOffset={0.16} />
      {segments.map((segment) => (
        <TerrainBundSegment key={segment.key} end={segment.end} heightM={heightM} materials={materials} start={segment.start} />
      ))}
    </group>
  )
}

function FuelPumpYard({ materials }: { materials: Stage2Materials }) {
  const baseY = getTerrainHeight(410, 1645) + 0.26
  return (
    <group name="fuel-pump-yard">
      <TerrainPolygonSurface material={materials.hardstand} points={INDUSTRIAL_FEATURES.pumpYard} yOffset={0.26} />
      {[350, 410, 470].map((x) => (
        <group key={x} position={[x, baseY, 1645]}>
          <mesh castShadow material={materials.concrete} position={[0, 0.45, 0]} receiveShadow>
            <boxGeometry args={[38, 0.9, 25]} />
          </mesh>
          <mesh castShadow material={materials.darkSteel} position={[0, 3.2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[5.2, 5.2, 18, 12]} />
          </mesh>
          <mesh castShadow material={materials.paintedSteel} position={[0, 7.3, 0]}>
            <boxGeometry args={[14, 7, 12]} />
          </mesh>
        </group>
      ))}
      {[-60, 60].map((offsetZ) => (
        <mesh key={offsetZ} castShadow material={materials.pipeline} position={[410, baseY + 8.6, 1645 + offsetZ]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[1.25, 1.25, 160, 10]} />
        </mesh>
      ))}
    </group>
  )
}

function AmmunitionTransferPlatform({ materials }: { materials: Stage2Materials }) {
  const baseY = getTerrainHeight(2360, 1480) + 0.24
  const supportXs = [2235, 2360, 2485] as const
  const supportZs = [1410, 1550] as const
  return (
    <group name="ammunition-rail-transfer-platform">
      <PolygonPrism bottomY={baseY} castShadow material={materials.concrete} points={INDUSTRIAL_FEATURES.ammunitionRailPlatform} topY={baseY + 0.8} />
      {supportXs.flatMap((x) =>
        supportZs.map((z) => (
          <mesh key={`${x}:${z}`} castShadow material={materials.steel} position={[x, baseY + 4.1, z]}>
            <boxGeometry args={[2.8, 7.4, 2.8]} />
          </mesh>
        )),
      )}
      <PolygonPrism bottomY={baseY + 7.35} castShadow material={materials.warehouseRoof} points={INDUSTRIAL_FEATURES.ammunitionRailPlatform} topY={baseY + 8} />
      <mesh castShadow material={materials.darkSteel} position={[2360, baseY + 4.4, 1390]}>
        <boxGeometry args={[74, 6.5, 1.4]} />
      </mesh>
    </group>
  )
}

function FuelTransferRack({ materials }: { materials: Stage2Materials }) {
  const transferRack = INDUSTRIAL_FEATURES.transferRack
  const baseY = getTerrainHeight(400, 2025) + 0.24
  const canopyXs = [340, 400, 460] as const
  const supportZs = [1925, 2025, 2125] as const

  return (
    <group name={transferRack.id}>
      <TerrainPolygonSurface material={materials.hardstand} points={transferRack.points} yOffset={0.24} />
      {canopyXs.map((x) => (
        <group key={x} name={`fuel-transfer-bay-${x}`}>
          <mesh castShadow material={materials.paintedSteel} position={[x, baseY + 9.6, 2025]}>
            <boxGeometry args={[34, 1.8, 210]} />
          </mesh>
          {supportZs.map((z) => (
            <mesh key={z} castShadow material={materials.steel} position={[x, baseY + 4.8, z]}>
              <boxGeometry args={[2.2, 9.6, 2.2]} />
            </mesh>
          ))}
        </group>
      ))}
      {[322, 478].map((x) => (
        <mesh key={x} castShadow material={materials.pipeline} position={[x, baseY + 6.3, 2025]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 214, 8]} />
        </mesh>
      ))}
    </group>
  )
}

function FuelUtilityBuilding({ feature, materials }: { feature: (typeof INDUSTRIAL_FEATURES.utilities)[number]; materials: Stage2Materials }) {
  const centerX = feature.points.reduce((total, point) => total + point[0], 0) / feature.points.length
  const centerZ = feature.points.reduce((total, point) => total + point[1], 0) / feature.points.length
  const minimumZ = Math.min(...feature.points.map((point) => point[1]))
  const baseY = getTerrainHeight(centerX, centerZ) + 0.16

  return (
    <group name={feature.id}>
      <PolygonPrism bottomY={baseY} castShadow material={materials.warehouseWall} points={feature.points} topY={baseY + feature.heightM} />
      <PolygonSurface material={materials.warehouseRoof} points={feature.points} y={baseY + feature.heightM + 0.1} />
      <mesh castShadow material={materials.darkSteel} position={[centerX, baseY + feature.heightM * 0.45, minimumZ - 0.2]}>
        <boxGeometry args={[feature.id === 'fuel_utility_north' ? 24 : 20, feature.heightM * 0.64, 1]} />
      </mesh>
    </group>
  )
}

export function IndustrialDistrict({ materials }: { materials: Stage2Materials }) {
  const trunkPoints = terrainVertices(PIPELINE_HARBOR_FUEL_TRUNK)
  return (
    <group name="region-b-storage-district">
      <TerrainPolygonSurface material={materials.gravel} name="fuel-compound-hardstand" points={INDUSTRIAL_FEATURES.fuelCompound} yOffset={0.3} />
      <TerrainPolygonSurface material={materials.gravel} name="ammunition-compound-hardstand" points={INDUSTRIAL_FEATURES.ammunitionCompound} yOffset={0.32} />

      {FUEL_BUND_CELLS.map((cell) => (
        <BundRing key={cell.id} heightM={cell.heightM} materials={materials} points={cell.points} />
      ))}
      {FUEL_TANKS.map((tank) => {
        const [x, z] = tank.center
        return <FuelTank key={tank.id} center={[x, getTerrainHeight(x, z), z]} heightM={tank.heightM} id={tank.id} materials={materials} radiusM={tank.radiusM} />
      })}
      <FuelTank center={[-1220, getTerrainHeight(-1220, 1570), 1570]} heightM={INDUSTRIAL_FEATURES.firewaterTank.heightM} id="fuel-firewater-tank" materials={materials} radiusM={INDUSTRIAL_FEATURES.firewaterTank.radiusM} />

      <FuelPumpYard materials={materials} />
      <FuelTransferRack materials={materials} />
      {INDUSTRIAL_FEATURES.utilities.map((feature) => (
        <FuelUtilityBuilding key={feature.id} feature={feature} materials={materials} />
      ))}
      <DistrictEquipmentBatch generators={STORAGE_GENERATORS} id="storage-industrial-equipment" responseGroup={STORAGE_FIXTURES} transformerBanks={STORAGE_TRANSFORMERS} />

      {FUEL_PIPE_RUNS.map((points, index) => (
        <PipelineRun key={`fuel-pipe-run-${index + 1}`} diameterM={0.7} elevationM={2.2} id={`fuel-pipe-run-${index + 1}`} points={terrainVertices(points)} responseGroup={STORAGE_FIXTURES} supportSpacingM={36} />
      ))}
      <PipeRack clearanceM={5.5} corridorWidthM={18} id="harbor-fuel-four-pipe-rack" pipeCount={4} pipeDiameterM={0.8} points={trunkPoints} responseGroup={STORAGE_FIXTURES} supportSpacingM={28} />

      {AMMUNITION_BUNKERS.map((bunker) => {
        const [x, z] = bunker.center
        const baseY = getTerrainHeight(x, z)
        return (
          <group key={bunker.id} name={bunker.id}>
            <PolygonPrism bottomY={baseY - 0.2} material={materials.berm} points={bunker.berm} topY={baseY + 2.3} />
            <PolygonPrism bottomY={baseY + 2.2} castShadow material={materials.bunker} points={bunker.footprint} topY={baseY + 8.2} />
            <PolygonSurface material={materials.concrete} points={bunker.footprint} y={baseY + 8.3} />
            <group name={`${bunker.id}:future-cookoff-anchor`} position={[x, baseY + 8.2, z]} />
          </group>
        )
      })}
      <TerrainPolygonSurface material={materials.hardstand} name="ammunition-loading-yard" points={INDUSTRIAL_FEATURES.ammunitionLoadingYard} yOffset={0.24} />
      <AmmunitionTransferPlatform materials={materials} />
      <SecurityFence id="fuel-compound-security" points={terrainVertices(SECURITY_FENCES[0], 0.3)} responseGroup={STORAGE_FENCE} rows={1} />
      <SecurityFence id="ammunition-compound-security" points={terrainVertices(SECURITY_FENCES[1], 0.3)} responseGroup={STORAGE_FENCE} rowSeparationM={8} rows={2} />

      <DistrictLightPoleBatch id="storage-industrial-lights" instances={STORAGE_LIGHTS} responseGroup={STORAGE_FIXTURES} />

      <TerrainRoad material={materials.gravel} name="industrial-drainage-channel" points={INDUSTRIAL_FEATURES.drainage} widthM={14} yOffset={-0.1} />
    </group>
  )
}
