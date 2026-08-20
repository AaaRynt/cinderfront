import type { WorldPosition } from '../worldData.ts'
import type { Stage2Materials } from './stage2Materials.ts'

import { UtilityPoleRun, createEnvironmentResponseGroup } from './environment/index.ts'
import { AMMUNITION_GATE_SPURS, POWER_LINES, RAIL_DEFINITIONS, ROAD_DEFINITIONS } from './stage2Data.ts'
import { RoadRibbon, TerrainRoad } from './Stage2Meshes.tsx'
import { sampleTerrainPolyline } from './terrainModel.ts'

const UTILITY_RESPONSE = createEnvironmentResponseGroup('ash-harbor-power-distribution', 'region_b_storage_district', 'utility')

function offsetPoints(points: readonly WorldPosition[], offsetM: number): WorldPosition[] {
  return points.map((point, index) => {
    const previous = points[Math.max(0, index - 1)]!
    const next = points[Math.min(points.length - 1, index + 1)]!
    const dx = next[0] - previous[0]
    const dz = next[2] - previous[2]
    const length = Math.hypot(dx, dz) || 1
    return [point[0] - (dz / length) * offsetM, point[1], point[2] + (dx / length) * offsetM]
  })
}

export function RoadRailUtilities({ materials }: { materials: Stage2Materials }) {
  return (
    <group name="stage2-road-rail-utility-network">
      {ROAD_DEFINITIONS.map((road) => (
        <TerrainRoad key={road.id} material={materials[road.surface]} name={road.id} points={road.points} spacingM={65} widthM={road.widthM} />
      ))}
      {AMMUNITION_GATE_SPURS.map((points, index) => (
        <TerrainRoad key={`ammunition-gate-spur-${index + 1}`} material={materials.gravel} name={`ammunition-gate-spur-${index + 1}`} points={points} spacingM={35} widthM={7} />
      ))}

      {RAIL_DEFINITIONS.map((rail) => {
        const centerline = sampleTerrainPolyline(rail.points, 62, 0.34)
        return (
          <group key={rail.id} name={rail.id}>
            <RoadRibbon material={materials.gravel} points={centerline} widthM={7} />
            <RoadRibbon material={materials.rail} points={offsetPoints(centerline, -1.08)} widthM={0.28} />
            <RoadRibbon material={materials.rail} points={offsetPoints(centerline, 1.08)} widthM={0.28} />
          </group>
        )
      })}

      {POWER_LINES.map((line, index) => (
        <UtilityPoleRun key={`power-line-${index + 1}`} heightM={12} id={`power-line-${index + 1}`} points={sampleTerrainPolyline(line, index === 1 ? 80 : 90)} responseGroup={UTILITY_RESPONSE} />
      ))}
    </group>
  )
}
