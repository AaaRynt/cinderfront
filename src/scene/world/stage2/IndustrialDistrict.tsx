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

function terrainVertices(points: readonly XZPoint[], yOffset = 0): WorldPosition[] {
  return points.map(([x, z]) => [x, getTerrainHeight(x, z) + yOffset, z])
}

function BundRing({ points, heightM, materials }: { heightM: number; materials: Stage2Materials; points: readonly XZPoint[] }) {
  const xs = points.map((point) => point[0])
  const zs = points.map((point) => point[1])
  const minimumX = Math.min(...xs)
  const maximumX = Math.max(...xs)
  const minimumZ = Math.min(...zs)
  const maximumZ = Math.max(...zs)
  const centerX = (minimumX + maximumX) / 2
  const centerZ = (minimumZ + maximumZ) / 2
  const baseY = getTerrainHeight(centerX, centerZ)
  const wallWidth = 12
  return (
    <group>
      <mesh material={materials.berm} position={[centerX, baseY + heightM / 2, minimumZ]} receiveShadow>
        <boxGeometry args={[maximumX - minimumX, heightM, wallWidth]} />
      </mesh>
      <mesh material={materials.berm} position={[centerX, baseY + heightM / 2, maximumZ]} receiveShadow>
        <boxGeometry args={[maximumX - minimumX, heightM, wallWidth]} />
      </mesh>
      <mesh material={materials.berm} position={[minimumX, baseY + heightM / 2, centerZ]} receiveShadow>
        <boxGeometry args={[wallWidth, heightM, maximumZ - minimumZ]} />
      </mesh>
      <mesh material={materials.berm} position={[maximumX, baseY + heightM / 2, centerZ]} receiveShadow>
        <boxGeometry args={[wallWidth, heightM, maximumZ - minimumZ]} />
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
      <PolygonSurface material={materials.hardstand} points={transferRack.points} y={baseY} />
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

      <PolygonSurface material={materials.hardstand} name="fuel-pump-yard" points={INDUSTRIAL_FEATURES.pumpYard} y={31.05} />
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
      <PolygonSurface material={materials.hardstand} name="ammunition-loading-yard" points={INDUSTRIAL_FEATURES.ammunitionLoadingYard} y={31.2} />
      <PolygonPrism bottomY={30.9} material={materials.concrete} name="ammunition-rail-transfer-platform" points={INDUSTRIAL_FEATURES.ammunitionRailPlatform} topY={32.4} />
      <SecurityFence id="fuel-compound-security" points={terrainVertices(SECURITY_FENCES[0], 0.3)} responseGroup={STORAGE_FENCE} rows={1} />
      <SecurityFence id="ammunition-compound-security" points={terrainVertices(SECURITY_FENCES[1], 0.3)} responseGroup={STORAGE_FENCE} rowSeparationM={8} rows={2} />

      <DistrictLightPoleBatch id="storage-industrial-lights" instances={STORAGE_LIGHTS} responseGroup={STORAGE_FIXTURES} />

      <TerrainRoad material={materials.gravel} name="industrial-drainage-channel" points={INDUSTRIAL_FEATURES.drainage} widthM={14} yOffset={-0.1} />
    </group>
  )
}
