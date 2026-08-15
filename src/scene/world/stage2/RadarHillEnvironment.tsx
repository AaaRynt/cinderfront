import type { WorldPosition, XZPoint } from '../worldData.ts'
import type { Stage2Materials } from './stage2Materials.ts'

import { AAA_SITE, COMMUNICATIONS_MAST_SITE, RADAR_PAD_POLYGONS, RADAR_SEARCH_SITE, RADAR_SUPPORT_BUILDINGS, RADAR_SUPPORT_POLYGONS, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../worldData.ts'
import { DistrictEquipmentBatch, DistrictLightPoleBatch, RockCluster, SecurityFence, createEnvironmentResponseGroup, type DistrictGeneratorInstance, type DistrictLightPoleInstance, type DistrictTransformerBankInstance } from './environment/index.ts'
import { SECURITY_FENCES } from './stage2Data.ts'
import { PolygonPrism } from './Stage2Meshes.tsx'
import { CommunicationsMast } from './Stage2Structures.tsx'
import { getTerrainHeight } from './terrainModel.ts'

const RADAR_FIXTURES = createEnvironmentResponseGroup('radar-hill-fixtures', 'region_c_radar_hill', 'industrial_fixture')
const RADAR_FENCE = createEnvironmentResponseGroup('radar-hill-fence', 'region_c_radar_hill', 'fence')
const RADAR_ROCKS = createEnvironmentResponseGroup('radar-hill-rocks', 'region_c_radar_hill', 'rock')
const RADAR_GENERATORS = [
  { headingDeg: 35, id: 'radar-hill-generator-west', position: [3710, getTerrainHeight(3710, 3570), 3570] },
  { headingDeg: 15, id: 'radar-hill-generator-east', position: [4390, getTerrainHeight(4390, 3650), 3650] },
] satisfies readonly DistrictGeneratorInstance[]
const RADAR_TRANSFORMERS = [
  {
    headingDeg: 20,
    id: 'radar-hill-transformer-bank',
    position: [4450, getTerrainHeight(4450, 3580), 3580],
    unitCount: 2,
  },
] satisfies readonly DistrictTransformerBankInstance[]
const RADAR_LIGHTS = [
  [3200, 4280],
  [3900, 4510],
  [4570, 4060],
  [4680, 3380],
  [3900, 3020],
  [3100, 3330],
].map(([x, z], index) => ({
  heightM: 12,
  id: `radar-light-${index + 1}`,
  position: [x!, getTerrainHeight(x!, z!), z!] as WorldPosition,
})) satisfies readonly DistrictLightPoleInstance[]

function terrainVertices(points: readonly XZPoint[]): WorldPosition[] {
  return points.map(([x, z]) => [x, getTerrainHeight(x, z) + 0.25, z])
}

export function RadarHillEnvironment({ materials }: { materials: Stage2Materials }) {
  return (
    <group name="region-c-radar-hill">
      <PolygonPrism bottomY={209.25} material={materials.concrete} name="radar-search-platform" points={RADAR_PAD_POLYGONS.search} topY={RADAR_SEARCH_SITE.position[1]} />
      <PolygonPrism bottomY={194.25} material={materials.concrete} name="radar-tracking-platform" points={RADAR_PAD_POLYGONS.tracking} topY={RADAR_TRACKING_SITE.position[1]} />
      <PolygonPrism bottomY={SAM_PAD_POSITIONS[0].terrainY - 0.35} material={materials.concrete} points={RADAR_PAD_POLYGONS.sam01} topY={SAM_PAD_POSITIONS[0].position[1]} />
      <PolygonPrism bottomY={SAM_PAD_POSITIONS[1].terrainY - 0.35} material={materials.concrete} points={RADAR_PAD_POLYGONS.sam02} topY={SAM_PAD_POSITIONS[1].position[1]} />
      <PolygonPrism bottomY={SAM_PAD_POSITIONS[2].terrainY - 0.35} material={materials.concrete} points={RADAR_PAD_POLYGONS.sam03} topY={SAM_PAD_POSITIONS[2].position[1]} />
      <PolygonPrism bottomY={SAM_PAD_POSITIONS[3].terrainY - 0.35} material={materials.concrete} points={RADAR_PAD_POLYGONS.sam04} topY={SAM_PAD_POSITIONS[3].position[1]} />
      <PolygonPrism bottomY={AAA_SITE.terrainY - 0.35} material={materials.concrete} name="fixed-aaa-platform" points={RADAR_PAD_POLYGONS.aaa} topY={AAA_SITE.position[1]} />

      {RADAR_SUPPORT_POLYGONS.map((polygon, index) => {
        const building = RADAR_SUPPORT_BUILDINGS[index]!
        return <PolygonPrism key={building.id} bottomY={building.terrainY} castShadow material={materials.bunker} name={building.id} points={polygon} topY={building.terrainY + building.heightM} />
      })}
      <CommunicationsMast heightM={COMMUNICATIONS_MAST_SITE.heightM} materials={materials} position={COMMUNICATIONS_MAST_SITE.position} />

      <DistrictEquipmentBatch generators={RADAR_GENERATORS} id="radar-hill-equipment" responseGroup={RADAR_FIXTURES} transformerBanks={RADAR_TRANSFORMERS} />
      <SecurityFence id="radar-hill-security-perimeter" points={terrainVertices(SECURITY_FENCES[2])} responseGroup={RADAR_FENCE} rows={1} />

      <DistrictLightPoleBatch id="radar-hill-lights" instances={RADAR_LIGHTS} responseGroup={RADAR_FIXTURES} />
      {[
        [2860, 4100, 41],
        [2700, 3450, 53],
        [4770, 3860, 67],
        [4380, 2870, 79],
        [5070, 3310, 91],
      ].map(([x, z, seed], index) => (
        <RockCluster key={`radar-rocks-${index}`} count={7} id={`radar-rocks-${index + 1}`} position={[x!, getTerrainHeight(x!, z!), z!]} radiusM={24} responseGroup={RADAR_ROCKS} seed={seed!} />
      ))}
    </group>
  )
}
