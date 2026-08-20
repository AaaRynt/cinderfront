import type { Stage2Materials } from './stage2Materials.ts'

import { DistrictEquipmentBatch, createEnvironmentResponseGroup, type DistrictGeneratorInstance, type DistrictTransformerBankInstance } from './environment/index.ts'
import { HARBOR_FEATURES } from './stage2Data.ts'
import { PolygonPrism, PolygonSurface, RoadRibbon, TerrainPolygonSurface } from './Stage2Meshes.tsx'
import { GantryCrane, Warehouse } from './Stage2Structures.tsx'
import { getTerrainHeight, sampleTerrainPolyline } from './terrainModel.ts'

const HARBOR_FIXTURES = createEnvironmentResponseGroup('harbor-maintenance-fixtures', 'region_a_harbor_district', 'industrial_fixture')
const HARBOR_GENERATORS = [{ headingDeg: 84, id: 'harbor-maintenance-generator', position: [-3190, getTerrainHeight(-3190, 4190) + 0.28, 4190] }] satisfies readonly DistrictGeneratorInstance[]
const HARBOR_TRANSFORMERS = [{ headingDeg: 84, id: 'harbor-maintenance-transformers', position: [-3070, getTerrainHeight(-3070, 4185) + 0.28, 4185], unitCount: 2 }] satisfies readonly DistrictTransformerBankInstance[]

function CargoStack({ materials, position, yaw = 0 }: { materials: Stage2Materials; position: readonly [number, number, number]; yaw?: number }) {
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh castShadow material={materials.paintedSteel} position={[0, 2.8, 0]}>
        <boxGeometry args={[24, 5.6, 7]} />
      </mesh>
      <mesh castShadow material={materials.darkSteel} position={[2, 8.4, 0]}>
        <boxGeometry args={[20, 5.6, 7]} />
      </mesh>
    </group>
  )
}

function headingBetween(start: readonly [number, number], end: readonly [number, number]) {
  return Math.atan2(end[0] - start[0], end[1] - start[1])
}

function HarborElectricalServiceFacility({ materials }: { materials: Stage2Materials }) {
  const facility = HARBOR_FEATURES.electricalServiceFacility
  const baseY = getTerrainHeight(-2550, 3100) + 0.18

  return (
    <group name={facility.id}>
      <PolygonPrism bottomY={baseY} castShadow material={materials.warehouseWall} points={facility.points} topY={baseY + facility.heightM} />
      <PolygonSurface material={materials.warehouseRoof} points={facility.points} y={baseY + facility.heightM + 0.12} />
      <mesh castShadow material={materials.darkSteel} position={[-2550, baseY + facility.heightM + 1.4, 3100]}>
        <boxGeometry args={[52, 2.4, 18]} />
      </mesh>
    </group>
  )
}

function HarborDefenseEmplacement({ materials }: { materials: Stage2Materials }) {
  const emplacement = HARBOR_FEATURES.defenseEmplacement
  const [x, z] = emplacement.center
  const baseY = getTerrainHeight(x, z) + 0.15

  return (
    <group name={emplacement.id}>
      <PolygonPrism bottomY={baseY} castShadow material={materials.bunker} points={emplacement.points} topY={baseY + 1.4} />
      <PolygonSurface material={materials.weatheredConcrete} points={emplacement.points} y={baseY + 1.48} />
      <group name={`${emplacement.id}:fixed-machinery`} position={[x, baseY + 1.5, z]}>
        <mesh castShadow material={materials.darkSteel} position={[0, 2.2, 0]}>
          <cylinderGeometry args={[10, 13, 4.4, 12]} />
        </mesh>
        <mesh castShadow material={materials.paintedSteel} position={[0, 5.1, 0]}>
          <boxGeometry args={[18, 4, 12]} />
        </mesh>
        {[-4.2, 4.2].map((offsetX) => (
          <mesh key={offsetX} castShadow material={materials.darkSteel} position={[offsetX, 6.2, -13]} rotation={[0.08, 0, 0]}>
            <boxGeometry args={[1.8, 1.8, 30]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function HarborDistrict({ materials }: { materials: Stage2Materials }) {
  return (
    <group name="region-a-harbor-district">
      {HARBOR_FEATURES.breakwaters.map((feature) => (
        <PolygonPrism key={feature.id} bottomY={-2.5} castShadow material={materials.weatheredConcrete} name={feature.id} points={feature.points} topY={3.2} />
      ))}
      {HARBOR_FEATURES.piers.map((feature) => (
        <PolygonPrism key={feature.id} bottomY={-1.5} castShadow material={materials.concrete} name={feature.id} points={feature.points} topY={3.1} />
      ))}
      {HARBOR_FEATURES.jetties.map((feature) => (
        <PolygonPrism key={feature.id} bottomY={-1} castShadow material={materials.darkSteel} name={feature.id} points={feature.points} topY={2.5} />
      ))}
      {HARBOR_FEATURES.aprons.map((feature) => (
        <TerrainPolygonSurface key={feature.id} material={materials.hardstand} name={feature.id} points={feature.points} yOffset={0.24} />
      ))}

      {HARBOR_FEATURES.warehouses.map((warehouse) => {
        const centerX = warehouse.points.reduce((total, point) => total + point[0], 0) / warehouse.points.length
        const centerZ = warehouse.points.reduce((total, point) => total + point[1], 0) / warehouse.points.length
        return <Warehouse key={warehouse.id} baseY={getTerrainHeight(centerX, centerZ) + 0.18} heightM={warehouse.heightM} id={warehouse.id} materials={materials} points={warehouse.points} />
      })}
      <HarborElectricalServiceFacility materials={materials} />
      <HarborDefenseEmplacement materials={materials} />

      {[
        [-4210, 4380, 0.08],
        [-4140, 4310, 0.08],
        [-3240, 4420, 0.04],
        [-3180, 4335, 0.04],
        [-3000, 2770, -0.03],
        [-2850, 2820, -0.03],
      ].map(([x, z, yaw], index) => (
        <CargoStack key={`harbor-cargo-${index}`} materials={materials} position={[x!, getTerrainHeight(x!, z!) + 0.24, z!]} yaw={yaw} />
      ))}
      <DistrictEquipmentBatch generators={HARBOR_GENERATORS} id="harbor-maintenance-equipment" responseGroup={HARBOR_FIXTURES} transformerBanks={HARBOR_TRANSFORMERS} />

      {HARBOR_FEATURES.craneRails.map((rail) => {
        const start = rail.points[0]!
        const end = rail.points[1]!
        const heading = headingBetween(start, end)
        return (
          <group key={rail.id} name={rail.id}>
            <RoadRibbon material={materials.rail} points={sampleTerrainPolyline(rail.points, 45, 0.28)} widthM={4} />
            {rail.cranes.map(([x, z], index) => (
              <GantryCrane key={`${rail.id}:${index}`} headingRadians={heading} id={`${rail.id}:gantry-${index + 1}`} materials={materials} position={[x, getTerrainHeight(x, z) + 0.2, z]} scale={rail.id === 'crane_rail_inner_quay' ? 0.82 : 1} />
            ))}
          </group>
        )
      })}

      {[
        [-5200, 3700],
        [-5050, 3110],
        [-4150, 3900],
        [-3400, 4010],
        [-3070, 4000],
        [-3330, 3010],
        [-4100, 3080],
        [-3750, 3030],
      ].map(([x, z], index) => (
        <group key={`harbor-light-${index}`} name={`harbor-light-${index + 1}`} position={[x!, getTerrainHeight(x!, z!), z!]}>
          <mesh material={materials.steel} position={[0, 7, 0]}>
            <cylinderGeometry args={[0.45, 0.7, 14, 6]} />
          </mesh>
          <mesh material={materials.warning} position={[0, 14.5, 0]}>
            <sphereGeometry args={[1.25, 8, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
