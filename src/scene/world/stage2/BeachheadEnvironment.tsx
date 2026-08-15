import { useEffect, useMemo } from 'react'

import type { XZPoint } from '../worldData.ts'
import type { Stage2Materials } from './stage2Materials.ts'

import { BarrierRun, RockCluster, createEnvironmentResponseGroup } from './environment/index.ts'
import { BEACH_FEATURES } from './stage2Data.ts'
import { PolygonPrism, TerrainPolygonSurface } from './Stage2Meshes.tsx'
import { createTerrainSurfaceGeometry } from './terrainGeometry.ts'
import { getTerrainHeight, sampleTerrainPolyline } from './terrainModel.ts'

const BEACH_REMAINS = createEnvironmentResponseGroup('beachhead-remains', 'region_e_remote_beachhead', 'barrier')
const BEACH_ROCKS = createEnvironmentResponseGroup('beachhead-rocks', 'region_e_remote_beachhead', 'rock')

function distanceToSegment(x: number, z: number, start: XZPoint, end: XZPoint) {
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  const lengthSquared = dx * dx + dz * dz
  const progress = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((x - start[0]) * dx + (z - start[1]) * dz) / lengthSquared))
  return Math.hypot(x - (start[0] + dx * progress), z - (start[1] + dz * progress))
}

function distanceToPolygonBoundary(x: number, z: number, points: readonly XZPoint[]) {
  let distance = Number.POSITIVE_INFINITY
  for (let index = 0; index < points.length; index += 1) {
    distance = Math.min(distance, distanceToSegment(x, z, points[index]!, points[(index + 1) % points.length]!))
  }
  return distance
}

function TerrainFittedDune({ id, liftM, materials, phase, points }: { id: string; liftM: number; materials: Stage2Materials; phase: number; points: readonly XZPoint[] }) {
  const geometry = useMemo(() => {
    const duneGeometry = createTerrainSurfaceGeometry(points, 0.24)
    const positions = duneGeometry.getAttribute('position')

    for (let index = 0; index < positions.count; index += 1) {
      const x = positions.getX(index)
      const z = positions.getZ(index)
      const edgeProgress = Math.min(1, distanceToPolygonBoundary(x, z, points) / 55)
      const easedEdge = edgeProgress * edgeProgress * (3 - 2 * edgeProgress)
      const undulation = 0.86 + Math.sin(x * 0.024 + z * 0.019 + phase) * 0.14
      positions.setY(index, positions.getY(index) + liftM * easedEdge * undulation)
    }

    positions.needsUpdate = true
    duneGeometry.computeVertexNormals()
    duneGeometry.computeBoundingBox()
    duneGeometry.computeBoundingSphere()
    return duneGeometry
  }, [liftM, phase, points])

  useEffect(() => () => geometry.dispose(), [geometry])

  return <mesh castShadow geometry={geometry} material={materials.sand} name={id} receiveShadow />
}

export function BeachheadEnvironment({ materials }: { materials: Stage2Materials }) {
  return (
    <group name="region-e-remote-beachhead">
      <TerrainFittedDune id="beach_dune_west" liftM={4} materials={materials} phase={0.4} points={BEACH_FEATURES.duneWest} />
      <TerrainFittedDune id="beach_dune_central" liftM={6.5} materials={materials} phase={1.7} points={BEACH_FEATURES.duneCentral} />
      <TerrainFittedDune id="beach_dune_east" liftM={5} materials={materials} phase={2.9} points={BEACH_FEATURES.duneEast} />
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
