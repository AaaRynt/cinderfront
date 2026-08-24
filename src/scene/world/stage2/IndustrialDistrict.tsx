import type { InstancedMesh, Material } from 'three'

import { memo, useLayoutEffect, useRef } from 'react'
import { BoxGeometry, Matrix4, Quaternion, StaticDrawUsage, Vector3 } from 'three'

import { useSimulationStore, type SimulationStoreState } from '@/simulation'

import type { WorldPosition, XZPoint } from '../worldData.ts'
import type { Stage2Materials } from './stage2Materials.ts'

import { DistrictEquipmentBatch, DistrictLightPoleBatch, PipelineRun, PipeRack, SecurityFence, createEnvironmentResponseGroup, type DistrictGeneratorInstance, type DistrictLightPoleInstance, type DistrictTransformerBankInstance } from './environment/index.ts'
import { AMMUNITION_BUNKERS, FUEL_BUND_CELLS, FUEL_DISTRICT_DAMAGE_TIMES, FUEL_PIPE_DEFINITIONS, FUEL_TANKS, INDUSTRIAL_FEATURES, PIPELINE_HARBOR_FUEL_TRUNK, SECURITY_FENCES, getFuelDistrictDamagePhase } from './stage2Data.ts'
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
const SERVICE_WALK_BOX_GEOMETRY = new BoxGeometry(1, 1, 1)
const Y_AXIS = new Vector3(0, 1, 0)
const Z_AXIS = new Vector3(0, 0, 1)
const FUEL_SERVICE_WALK_RUNS = [
  {
    elevationM: 8.6,
    id: 'fuel-header-service-catwalk',
    points: [
      [-1200, 2300],
      [100, 2300],
      [250, 2300],
      [250, 1800],
    ],
  },
  {
    elevationM: 7.4,
    id: 'fuel-west-lateral-service-catwalk',
    points: [
      [-800, 2700],
      [-800, 1800],
    ],
  },
  {
    elevationM: 7.4,
    id: 'fuel-east-lateral-service-catwalk',
    points: [
      [-300, 2700],
      [-300, 1800],
    ],
  },
] as const satisfies readonly { readonly elevationM: number; readonly id: string; readonly points: readonly XZPoint[] }[]

function splitServiceWalks() {
  return FUEL_SERVICE_WALK_RUNS.flatMap((run) =>
    run.points.slice(1).flatMap((end, pointIndex) => {
      const start = run.points[pointIndex]!
      const length = Math.hypot(end[0] - start[0], end[1] - start[1])
      const segmentCount = Math.max(1, Math.ceil(length / 85))
      return Array.from({ length: segmentCount }, (_, segmentIndex) => {
        const startProgress = segmentIndex / segmentCount
        const endProgress = (segmentIndex + 1) / segmentCount
        return {
          elevationM: run.elevationM,
          end: [start[0] + (end[0] - start[0]) * endProgress, start[1] + (end[1] - start[1]) * endProgress] as XZPoint,
          id: `${run.id}:${pointIndex}:${segmentIndex}`,
          start: [start[0] + (end[0] - start[0]) * startProgress, start[1] + (end[1] - start[1]) * startProgress] as XZPoint,
        }
      })
    }),
  )
}

const FUEL_SERVICE_WALK_SEGMENTS = splitServiceWalks()

function serviceWalkBoxMatrix(position: Vector3, quaternion: Quaternion, scale: readonly [x: number, y: number, z: number]) {
  return new Matrix4().compose(position, quaternion, new Vector3(...scale))
}

function createServiceWalkLayout() {
  const deckMatrices: Matrix4[] = []
  const railMatrices: Matrix4[] = []
  const steelMatrices: Matrix4[] = []

  for (const segment of FUEL_SERVICE_WALK_SEGMENTS) {
    const { elevationM, end, start } = segment
    const startGroundY = getTerrainHeight(start[0], start[1])
    const endGroundY = getTerrainHeight(end[0], end[1])
    const startDeck = new Vector3(start[0], startGroundY + elevationM, start[1])
    const endDeck = new Vector3(end[0], endGroundY + elevationM, end[1])
    const direction = endDeck.clone().sub(startDeck)
    const length = direction.length()
    const position = startDeck.clone().add(endDeck).multiplyScalar(0.5)
    const quaternion = new Quaternion().setFromUnitVectors(Z_AXIS, direction.normalize())
    const horizontalLength = Math.hypot(end[0] - start[0], end[1] - start[1]) || 1
    const normalX = -(end[1] - start[1]) / horizontalLength
    const normalZ = (end[0] - start[0]) / horizontalLength
    const heading = Math.atan2(end[0] - start[0], end[1] - start[1])

    deckMatrices.push(serviceWalkBoxMatrix(position, quaternion, [4.6, 0.5, length + 0.6]))
    for (const side of [-1, 1]) {
      railMatrices.push(serviceWalkBoxMatrix(position.clone().add(new Vector3(normalX * side * 2.15, 1.2, normalZ * side * 2.15)), quaternion, [0.22, 1.9, length + 0.6]))
      steelMatrices.push(serviceWalkBoxMatrix(new Vector3(start[0] + normalX * side * 1.9, startGroundY + elevationM / 2, start[1] + normalZ * side * 1.9), new Quaternion(), [0.42, elevationM, 0.42]))
    }
    steelMatrices.push(serviceWalkBoxMatrix(startDeck, new Quaternion().setFromAxisAngle(Y_AXIS, heading), [5.4, 0.42, 0.42]))
  }

  return { deckMatrices, railMatrices, steelMatrices }
}

const FUEL_SERVICE_WALK_LAYOUT = createServiceWalkLayout()
const FUEL_TANK_FAILURE_PHASES: Readonly<Partial<Record<(typeof FUEL_TANKS)[number]['id'], number>>> = {
  fuel_tank_02: getFuelDistrictDamagePhase(FUEL_DISTRICT_DAMAGE_TIMES.tank02),
  fuel_tank_04: getFuelDistrictDamagePhase(FUEL_DISTRICT_DAMAGE_TIMES.tank04),
  fuel_tank_05: getFuelDistrictDamagePhase(FUEL_DISTRICT_DAMAGE_TIMES.tank05),
  fuel_tank_06: getFuelDistrictDamagePhase(FUEL_DISTRICT_DAMAGE_TIMES.tank06),
}

function selectFuelDistrictDamagePhase(state: SimulationStoreState) {
  return getFuelDistrictDamagePhase(state.timeSeconds)
}

function StaticServiceWalkPool({ castShadow = false, material, matrices, name, receiveShadow = false }: { castShadow?: boolean; material: Material; matrices: readonly Matrix4[]; name: string; receiveShadow?: boolean }) {
  const meshRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
    mesh.count = matrices.length
    mesh.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
  }, [matrices])

  return <instancedMesh ref={meshRef} args={[SERVICE_WALK_BOX_GEOMETRY, material, matrices.length]} castShadow={castShadow} dispose={null} frustumCulled name={name} receiveShadow={receiveShadow} />
}

function terrainVertices(points: readonly XZPoint[], yOffset = 0): WorldPosition[] {
  return points.map(([x, z]) => [x, getTerrainHeight(x, z) + yOffset, z])
}

const FUEL_TRUNK_TERRAIN_POINTS = terrainVertices(PIPELINE_HARBOR_FUEL_TRUNK)

function TerrainBundSegment({ end, heightM, materials, start }: { end: XZPoint; heightM: number; materials: Stage2Materials; start: XZPoint }) {
  const startGround = new Vector3(start[0], getTerrainHeight(start[0], start[1]), start[1])
  const endGround = new Vector3(end[0], getTerrainHeight(end[0], end[1]), end[1])
  const direction = endGround.clone().sub(startGround)
  const length = direction.length()
  const capHeightM = Math.min(0.42, heightM * 0.18)
  const groundMidpoint = startGround.clone().add(endGround).multiplyScalar(0.5)
  const position = groundMidpoint.clone().add(new Vector3(0, (heightM - capHeightM) / 2, 0))
  const quaternion = new Quaternion().setFromUnitVectors(Z_AXIS, direction.normalize())
  const capPosition = groundMidpoint.clone().add(new Vector3(0, heightM - capHeightM / 2, 0))

  return (
    <group>
      <mesh castShadow material={materials.berm} position={position} quaternion={quaternion} receiveShadow>
        <boxGeometry args={[34, heightM - capHeightM, length + 2]} />
      </mesh>
      <mesh castShadow material={materials.weatheredConcrete} position={capPosition} quaternion={quaternion} receiveShadow>
        <boxGeometry args={[11, capHeightM, length + 2]} />
      </mesh>
    </group>
  )
}

const FuelServiceWalkGrid = memo(function FuelServiceWalkGrid({ materials }: { materials: Stage2Materials }) {
  return (
    <group name="fuel-elevated-service-walk-grid">
      <StaticServiceWalkPool castShadow material={materials.darkSteel} matrices={FUEL_SERVICE_WALK_LAYOUT.deckMatrices} name="fuel-service-walk-decks" receiveShadow />
      <StaticServiceWalkPool material={materials.paintedSteel} matrices={FUEL_SERVICE_WALK_LAYOUT.railMatrices} name="fuel-service-walk-rails" />
      <StaticServiceWalkPool castShadow material={materials.steel} matrices={FUEL_SERVICE_WALK_LAYOUT.steelMatrices} name="fuel-service-walk-supports" />
    </group>
  )
})

function FuelProcessTower({ materials }: { materials: Stage2Materials }) {
  const x = 220
  const z = 2240
  const baseY = getTerrainHeight(x, z)
  const towerHeightM = 24

  return (
    <group name="fuel-transfer-manifold-tower" position={[x, baseY, z]}>
      {[-6, 6].flatMap((offsetX) =>
        [-6, 6].map((offsetZ) => (
          <mesh key={`${offsetX}:${offsetZ}`} castShadow material={materials.steel} position={[offsetX, towerHeightM / 2, offsetZ]}>
            <boxGeometry args={[0.75, towerHeightM, 0.75]} />
          </mesh>
        )),
      )}
      {[7.5, 15, 23].map((height) => (
        <group key={height} position={[0, height, 0]}>
          <mesh castShadow material={materials.darkSteel}>
            <boxGeometry args={[15, 0.7, 15]} />
          </mesh>
          {[-6.6, 6.6].flatMap((offsetX) =>
            [-6.6, 6.6].map((offsetZ) => (
              <mesh key={`${offsetX}:${offsetZ}`} material={materials.paintedSteel} position={[offsetX, 1.15, offsetZ]}>
                <boxGeometry args={[0.32, 2.3, 0.32]} />
              </mesh>
            )),
          )}
        </group>
      ))}
      {[-3.2, 3.2].map((offsetX) => (
        <group key={offsetX} position={[offsetX, 0, 0]}>
          <mesh castShadow material={materials.pipeline} position={[0, 8.5, 0]}>
            <cylinderGeometry args={[2.1, 2.1, 14, 14]} />
          </mesh>
          <mesh castShadow material={materials.darkSteel} position={[0, 16.8, 0]}>
            <cylinderGeometry args={[0.55, 0.75, 4.6, 10]} />
          </mesh>
        </group>
      ))}
      <mesh castShadow material={materials.pipeline} position={[0, 19, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 10, 10]} />
      </mesh>
      <mesh material={materials.warning} position={[0, 24.8, 0]}>
        <sphereGeometry args={[0.75, 8, 6]} />
      </mesh>
    </group>
  )
}

function FuelRiserTower({ materials, position }: { materials: Stage2Materials; position: XZPoint }) {
  const [x, z] = position
  const baseY = getTerrainHeight(x, z)
  const heightM = 25
  return (
    <group name={`fuel-riser-tower-${x}`} position={[x, baseY, z]}>
      {[-2.8, 2.8].flatMap((offsetX) =>
        [-2.8, 2.8].map((offsetZ) => (
          <mesh key={`${offsetX}:${offsetZ}`} castShadow material={materials.steel} position={[offsetX, heightM / 2, offsetZ]}>
            <boxGeometry args={[0.55, heightM, 0.55]} />
          </mesh>
        )),
      )}
      {[8, 16, 24].map((height) => (
        <group key={height} position={[0, height, 0]}>
          <mesh castShadow material={materials.darkSteel}>
            <boxGeometry args={[7.2, 0.5, 7.2]} />
          </mesh>
          <mesh material={materials.paintedSteel} position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.2, 0.16, 4, 12]} />
          </mesh>
        </group>
      ))}
      {[-1.4, 1.4].map((offsetX) => (
        <mesh key={offsetX} castShadow material={materials.pipeline} position={[offsetX, heightM / 2, 0]}>
          <cylinderGeometry args={[0.62, 0.62, heightM, 10]} />
        </mesh>
      ))}
      <mesh material={materials.warning} position={[0, heightM + 0.8, 0]}>
        <sphereGeometry args={[0.62, 8, 6]} />
      </mesh>
    </group>
  )
}

function BundRing({ breached = false, points, heightM, materials }: { breached?: boolean; heightM: number; materials: Stage2Materials; points: readonly XZPoint[] }) {
  const segments = points
    .flatMap((start, edgeIndex) => {
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
    .filter((segment) => {
      if (!breached) return true
      const isCentralNorthWall = Math.abs(segment.start[1] - 2270) < 0.01 && Math.abs(segment.end[1] - 2270) < 0.01
      const midpointX = (segment.start[0] + segment.end[0]) / 2
      return !isCentralNorthWall || Math.abs(midpointX + 760) >= 60
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
      {[-80, 80].flatMap((offsetX) =>
        [-68, 68].map((offsetZ) => (
          <mesh key={`${offsetX}:${offsetZ}`} castShadow material={materials.steel} position={[410 + offsetX, baseY + 6.4, 1645 + offsetZ]}>
            <boxGeometry args={[1, 12.8, 1]} />
          </mesh>
        )),
      )}
      <mesh castShadow material={materials.warehouseRoof} position={[410, baseY + 13.1, 1645]} receiveShadow>
        <boxGeometry args={[174, 1.2, 146]} />
      </mesh>
      {[-72, 72].map((offsetX) => (
        <group key={`separator:${offsetX}`} position={[410 + offsetX, baseY, 1645]}>
          <mesh castShadow material={materials.paintedSteel} position={[0, 9, 0]}>
            <cylinderGeometry args={[2.7, 2.7, 18, 14]} />
          </mesh>
          <mesh material={materials.darkSteel} position={[0, 18.8, 0]}>
            <cylinderGeometry args={[0.8, 1, 1.6, 10]} />
          </mesh>
        </group>
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

function FuelTransferRack({ intact, materials }: { intact: boolean; materials: Stage2Materials }) {
  const transferRack = INDUSTRIAL_FEATURES.transferRack
  const baseY = getTerrainHeight(400, 2025) + 0.24
  const canopyXs = [340, 400, 460] as const
  const supportZs = [1925, 2025, 2125] as const

  return (
    <group name={transferRack.id}>
      <TerrainPolygonSurface material={materials.hardstand} points={transferRack.points} yOffset={0.24} />
      {intact ? (
        <group name="fuel-transfer-rack-intact-structure">
          {canopyXs.map((x) => (
            <group key={x} name={`fuel-transfer-bay-${x}`}>
              <mesh castShadow material={materials.paintedSteel} position={[x, baseY + 13.2, 2025]}>
                <boxGeometry args={[34, 1.8, 210]} />
              </mesh>
              {supportZs.map((z) => (
                <mesh key={z} castShadow material={materials.steel} position={[x, baseY + 6.6, z]}>
                  <boxGeometry args={[2.2, 13.2, 2.2]} />
                </mesh>
              ))}
            </group>
          ))}
          {[322, 478].map((x) => (
            <mesh key={x} castShadow material={materials.pipeline} position={[x, baseY + 8.1, 2025]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[1.1, 1.1, 214, 8]} />
            </mesh>
          ))}
          <mesh castShadow material={materials.darkSteel} position={[400, baseY + 10.7, 2025]}>
            <boxGeometry args={[172, 0.65, 5.2]} />
          </mesh>
        </group>
      ) : null}
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
      {[-0.26, 0, 0.26].map((offset) => (
        <group key={offset} position={[centerX + offset * 100, baseY + feature.heightM, centerZ]}>
          <mesh castShadow material={materials.darkSteel} position={[0, 1.4, 0]}>
            <cylinderGeometry args={[1.25, 1.5, 2.8, 10]} />
          </mesh>
          <mesh material={materials.paintedSteel} position={[0, 3, 0]}>
            <cylinderGeometry args={[1.8, 1.2, 0.5, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function IndustrialDistrict({ materials }: { materials: Stage2Materials }) {
  const damagePhase = useSimulationStore(selectFuelDistrictDamagePhase)
  const centralBundBreached = damagePhase >= getFuelDistrictDamagePhase(FUEL_DISTRICT_DAMAGE_TIMES.centralBund)
  const transferRackIntact = damagePhase < getFuelDistrictDamagePhase(FUEL_DISTRICT_DAMAGE_TIMES.transferRack)
  return (
    <group name="region-b-storage-district">
      <TerrainPolygonSurface material={materials.gravel} name="fuel-compound-hardstand" points={INDUSTRIAL_FEATURES.fuelCompound} yOffset={0.3} />
      <TerrainPolygonSurface material={materials.gravel} name="ammunition-compound-hardstand" points={INDUSTRIAL_FEATURES.ammunitionCompound} yOffset={0.32} />

      {FUEL_BUND_CELLS.map((cell) => (
        <BundRing key={cell.id} breached={cell.id === 'fuel_bund_cell_central' && centralBundBreached} heightM={cell.heightM} materials={materials} points={cell.points} />
      ))}
      {FUEL_TANKS.map((tank) => {
        const failurePhase = FUEL_TANK_FAILURE_PHASES[tank.id]
        if (failurePhase !== undefined && damagePhase >= failurePhase) return null
        const [x, z] = tank.center
        return <FuelTank key={tank.id} center={[x, getTerrainHeight(x, z), z]} heightM={tank.heightM} id={tank.id} materials={materials} radiusM={tank.radiusM} />
      })}
      <FuelTank center={[-1220, getTerrainHeight(-1220, 1570), 1570]} heightM={INDUSTRIAL_FEATURES.firewaterTank.heightM} id="fuel-firewater-tank" materials={materials} radiusM={INDUSTRIAL_FEATURES.firewaterTank.radiusM} />

      <FuelPumpYard materials={materials} />
      <FuelTransferRack intact={transferRackIntact} materials={materials} />
      <FuelProcessTower materials={materials} />
      <FuelRiserTower materials={materials} position={[-800, 2300]} />
      <FuelRiserTower materials={materials} position={[-300, 2300]} />
      <FuelServiceWalkGrid materials={materials} />
      {INDUSTRIAL_FEATURES.utilities.map((feature) => (
        <FuelUtilityBuilding key={feature.id} feature={feature} materials={materials} />
      ))}
      <DistrictEquipmentBatch generators={STORAGE_GENERATORS} id="storage-industrial-equipment" responseGroup={STORAGE_FIXTURES} transformerBanks={STORAGE_TRANSFORMERS} />

      {FUEL_PIPE_DEFINITIONS.map((definition) => {
        const failureAtSeconds = 'failureAtSeconds' in definition ? definition.failureAtSeconds : undefined
        const visible = failureAtSeconds === undefined || damagePhase < getFuelDistrictDamagePhase(failureAtSeconds)
        return <PipelineRun key={definition.id} diameterM={definition.diameterM} elevationM={definition.elevationM} id={definition.id} points={terrainVertices(definition.points)} responseGroup={STORAGE_FIXTURES} supportSpacingM={definition.diameterM < 0.5 ? 20 : 30} visible={visible} />
      })}
      <PipeRack clearanceM={5.5} corridorWidthM={18} id="harbor-fuel-four-pipe-rack" pipeCount={4} pipeDiameterM={0.8} points={FUEL_TRUNK_TERRAIN_POINTS} responseGroup={STORAGE_FIXTURES} supportSpacingM={28} visible={damagePhase < getFuelDistrictDamagePhase(FUEL_DISTRICT_DAMAGE_TIMES.pipelineTrunk)} />

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
