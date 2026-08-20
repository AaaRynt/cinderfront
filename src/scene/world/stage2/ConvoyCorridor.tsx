import type { WorldPosition } from '../worldData.ts'
import type { Stage2Materials } from './stage2Materials.ts'

import { BarrierRun, DistrictEquipmentBatch, DistrictLightPoleBatch, createEnvironmentResponseGroup, type DistrictGeneratorInstance, type DistrictLightPoleInstance, type DistrictTransformerBankInstance } from './environment/index.ts'
import { CORRIDOR_FEATURES } from './stage2Data.ts'
import { PolygonPrism, TerrainPolygonSurface, TerrainRoad } from './Stage2Meshes.tsx'
import { getTerrainHeight, sampleTerrainPolyline } from './terrainModel.ts'

const CORRIDOR_FIXTURES = createEnvironmentResponseGroup('convoy-corridor-fixtures', 'region_d_convoy_corridor', 'barrier')
const CORRIDOR_YARD_Y = getTerrainHeight(5750, 250) + 0.35
const CORRIDOR_SUBSTATION_Y = getTerrainHeight(6200, 650) + 0.35
const CORRIDOR_GENERATORS = [{ headingDeg: 90, id: 'corridor-service-generator', position: [5580, CORRIDOR_YARD_Y, 170] }] satisfies readonly DistrictGeneratorInstance[]
const CORRIDOR_TRANSFORMERS = [
  {
    headingDeg: 90,
    id: 'corridor-substation-transformers',
    position: [6200, CORRIDOR_SUBSTATION_Y, 650],
    unitCount: 3,
  },
] satisfies readonly DistrictTransformerBankInstance[]
const CORRIDOR_LIGHTS = [
  [4380, -1390],
  [4640, -1390],
  [5280, -1710],
  [5630, -1710],
  [5450, 390],
  [6000, 390],
  [6100, 740],
  [6330, 740],
].map(([x, z], index) => ({
  heightM: 11,
  id: `corridor-light-${index + 1}`,
  position: [x!, getTerrainHeight(x!, z!), z!] as WorldPosition,
})) satisfies readonly DistrictLightPoleInstance[]

export function ConvoyCorridor({ materials }: { materials: Stage2Materials }) {
  const bridgeY = getTerrainHeight(3100, -300) + 2.2

  return (
    <group name="region-d-convoy-corridor">
      <TerrainRoad material={materials.gravel} name="convoy-corridor-dry-wash" points={CORRIDOR_FEATURES.dryWash} spacingM={55} widthM={112} yOffset={0.24} />
      <PolygonPrism bottomY={bridgeY - 3.2} castShadow material={materials.weatheredConcrete} name="eastern-trunk-wash-bridge" points={CORRIDOR_FEATURES.bridge} topY={bridgeY} />
      <TerrainPolygonSurface material={materials.gravel} name="convoy-pull-off-west" points={CORRIDOR_FEATURES.pullOffWest} yOffset={0.4} />
      <TerrainPolygonSurface material={materials.gravel} name="convoy-pull-off-east" points={CORRIDOR_FEATURES.pullOffEast} yOffset={0.4} />
      <TerrainPolygonSurface material={materials.hardstand} name="corridor-service-yard" points={CORRIDOR_FEATURES.serviceYard} yOffset={0.35} />
      <TerrainPolygonSurface material={materials.concrete} name="corridor-substation" points={CORRIDOR_FEATURES.substation} yOffset={0.35} />

      <BarrierRun
        id="bridge-guardrail-north"
        points={sampleTerrainPolyline(
          [
            [3020, -210],
            [3175, -330],
          ],
          12,
          3.2,
        )}
        responseGroup={CORRIDOR_FIXTURES}
        spacingM={1}
      />
      <BarrierRun
        id="bridge-guardrail-south"
        points={sampleTerrainPolyline(
          [
            [3028, -292],
            [3182, -412],
          ],
          12,
          3.2,
        )}
        responseGroup={CORRIDOR_FIXTURES}
        spacingM={1}
      />
      <BarrierRun
        blockLengthM={7}
        id="service-yard-barriers"
        points={sampleTerrainPolyline(
          [
            [5425, 430],
            [6075, 430],
          ],
          24,
          0.6,
        )}
        responseGroup={CORRIDOR_FIXTURES}
        spacingM={4}
      />

      <DistrictEquipmentBatch generators={CORRIDOR_GENERATORS} id="convoy-corridor-equipment" responseGroup={CORRIDOR_FIXTURES} transformerBanks={CORRIDOR_TRANSFORMERS} />
      <DistrictLightPoleBatch id="convoy-corridor-lights" instances={CORRIDOR_LIGHTS} responseGroup={CORRIDOR_FIXTURES} />
    </group>
  )
}
