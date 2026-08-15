import { RADAR_SEARCH_SITE, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../worldData.ts'
import { SparseVegetationPatch, createEnvironmentResponseGroup } from './environment/index.ts'
import { BEACH_FEATURES, RADAR_TERRAIN_POLYGONS, TERRAIN_STAGE2_POLYGONS } from './stage2Data.ts'
import { getTerrainHeight } from './terrainModel.ts'

const PLAIN_VEGETATION = createEnvironmentResponseGroup('eastern-plain-vegetation', 'region_d_convoy_corridor', 'vegetation', true)
const RADAR_VEGETATION = createEnvironmentResponseGroup('radar-hill-vegetation', 'region_c_radar_hill', 'vegetation', true)
const BEACH_VEGETATION = createEnvironmentResponseGroup('remote-beach-vegetation', 'region_e_remote_beachhead', 'vegetation', true)

export function VegetationSystem() {
  return (
    <group name="stage2-instanced-sparse-vegetation">
      <SparseVegetationPatch
        exclusions={[
          { centerXZ: [3100, -300], radiusM: 260, type: 'circle' },
          { centerXZ: [5750, 250], radiusM: 430, type: 'circle' },
          { centerXZ: [6200, 650], radiusM: 280, type: 'circle' },
        ]}
        grassCount={620}
        id="eastern-plain-sparse-cover"
        polygonXZ={TERRAIN_STAGE2_POLYGONS.easternPlain}
        profile="dry_plain"
        responseGroup={PLAIN_VEGETATION}
        scrubCount={210}
        seed="ash-harbor:eastern-plain"
        surfaceY={getTerrainHeight}
      />
      <SparseVegetationPatch
        exclusions={[
          { centerXZ: [RADAR_SEARCH_SITE.position[0], RADAR_SEARCH_SITE.position[2]], radiusM: RADAR_SEARCH_SITE.radiusM + 65, type: 'circle' },
          { centerXZ: [RADAR_TRACKING_SITE.position[0], RADAR_TRACKING_SITE.position[2]], radiusM: RADAR_TRACKING_SITE.radiusM + 55, type: 'circle' },
          ...SAM_PAD_POSITIONS.map((site) => ({ centerXZ: [site.position[0], site.position[2]] as const, radiusM: site.radiusM + 35, type: 'circle' as const })),
        ]}
        grassCount={440}
        id="radar-hill-sparse-cover"
        polygonXZ={RADAR_TERRAIN_POLYGONS.ridge}
        profile="radar_hill"
        responseGroup={RADAR_VEGETATION}
        scrubCount={170}
        seed="ash-harbor:radar-hill"
        surfaceY={getTerrainHeight}
      />
      <SparseVegetationPatch
        exclusions={[
          { polygonXZ: BEACH_FEATURES.exitApron, type: 'polygon' },
          { polygonXZ: BEACH_FEATURES.inlandHardstand, type: 'polygon' },
        ]}
        grassCount={380}
        id="remote-beach-coastal-cover"
        polygonXZ={TERRAIN_STAGE2_POLYGONS.beachDunes}
        profile="coastal_dune"
        responseGroup={BEACH_VEGETATION}
        scrubCount={145}
        seed="ash-harbor:remote-beach"
        surfaceY={getTerrainHeight}
      />
    </group>
  )
}
