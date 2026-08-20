import type { Stage2Materials } from './stage2Materials.ts'

import { BarrierRun, RockCluster, createEnvironmentResponseGroup } from './environment/index.ts'
import { BEACH_FEATURES } from './stage2Data.ts'
import { PolygonPrism, TerrainPolygonSurface } from './Stage2Meshes.tsx'
import { getTerrainHeight, sampleTerrainPolyline } from './terrainModel.ts'

const BEACH_REMAINS = createEnvironmentResponseGroup('beachhead-remains', 'region_e_remote_beachhead', 'barrier')
const BEACH_ROCKS = createEnvironmentResponseGroup('beachhead-rocks', 'region_e_remote_beachhead', 'rock')

export function BeachheadEnvironment({ materials }: { materials: Stage2Materials }) {
  return (
    <group name="region-e-remote-beachhead">
      <TerrainPolygonSurface material={materials.sand} name="beach_dune_west" points={BEACH_FEATURES.duneWest} yOffset={0.22} />
      <TerrainPolygonSurface material={materials.sand} name="beach_dune_central" points={BEACH_FEATURES.duneCentral} yOffset={0.22} />
      <TerrainPolygonSurface material={materials.sand} name="beach_dune_east" points={BEACH_FEATURES.duneEast} yOffset={0.22} />
      <TerrainPolygonSurface material={materials.gravel} name="beach-exit-apron" points={BEACH_FEATURES.exitApron} yOffset={0.38} />
      <TerrainPolygonSurface material={materials.hardstand} name="beach-inland-hardstand" points={BEACH_FEATURES.inlandHardstand} yOffset={0.38} />
      {BEACH_FEATURES.defensiveRemains.map((points, index) => {
        const [x, z] = points[0]!
        const baseY = getTerrainHeight(x, z)
        return <PolygonPrism key={`beach-defensive-remain-${index}`} bottomY={baseY} material={materials.weatheredConcrete} name={`beach-defensive-remain-${index + 1}`} points={points} topY={baseY + 2.8} />
      })}
      <BarrierRun
        blockLengthM={4}
        id="beach-west-remnant-barriers"
        points={sampleTerrainPolyline(
          [
            [3400, -2600],
            [3700, -2660],
          ],
          18,
          0.4,
        )}
        responseGroup={BEACH_REMAINS}
        spacingM={5}
      />
      <BarrierRun
        blockLengthM={4}
        id="beach-east-remnant-barriers"
        points={sampleTerrainPolyline(
          [
            [5850, -2780],
            [6100, -2910],
          ],
          18,
          0.4,
        )}
        responseGroup={BEACH_REMAINS}
        spacingM={5}
      />
      {[
        [3100, -2480, 111],
        [3800, -2500, 125],
        [4470, -2350, 139],
        [5350, -2360, 151],
        [6100, -2500, 167],
        [6450, -2730, 181],
      ].map(([x, z, seed], index) => (
        <RockCluster key={`beach-rocks-${index}`} count={6} id={`beach-rocks-${index + 1}`} position={[x!, getTerrainHeight(x!, z!), z!]} radiusM={32} responseGroup={BEACH_ROCKS} seed={seed!} />
      ))}
    </group>
  )
}
