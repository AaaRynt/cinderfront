import type { ThreeElements } from '@react-three/fiber'

import { useMemo } from 'react'
import { DoubleSide, MeshStandardMaterial } from 'three'

import type { WorldPosition, XZPoint } from './worldData.ts'

import {
  AAA_SITE,
  COMMUNICATIONS_MAST_SITE,
  HARBOR_WAREHOUSE_POLYGONS,
  HARBOR_WAREHOUSE_POSITIONS,
  MAINLAND_POLYGON_XZ,
  MAP_BOUNDS,
  RADAR_PAD_POLYGONS,
  RADAR_SEARCH_SITE,
  RADAR_SUPPORT_BUILDINGS,
  RADAR_SUPPORT_POLYGONS,
  RADAR_TRACKING_SITE,
  SAM_PAD_POSITIONS,
  TERRAIN_POLYGONS,
  TERRAIN_Y,
  WORLD_ROADS,
} from './worldData.ts'
import { createPolygonPrismGeometry, createPolygonSurfaceGeometry, createRoadRibbonGeometry } from './worldGeometry.ts'

type WorldMaterial = MeshStandardMaterial

type PolygonPrismProps = {
  bottomY: number
  castShadow?: boolean
  material: WorldMaterial
  points: readonly XZPoint[]
  receiveShadow?: boolean
  topY: number
}

function PolygonPrism({ bottomY, castShadow = false, material, points, receiveShadow = true, topY }: PolygonPrismProps) {
  const geometry = useMemo(() => createPolygonPrismGeometry(points, bottomY, topY), [bottomY, points, topY])

  return <mesh castShadow={castShadow} frustumCulled geometry={geometry} material={material} receiveShadow={receiveShadow} />
}

type PolygonSurfaceProps = {
  material: WorldMaterial
  points: readonly XZPoint[]
  y: number
}

function PolygonSurface({ material, points, y }: PolygonSurfaceProps) {
  const geometry = useMemo(() => createPolygonSurfaceGeometry(points, y), [points, y])

  return <mesh frustumCulled geometry={geometry} material={material} receiveShadow />
}

type RoadRibbonProps = {
  material: WorldMaterial
  points: readonly WorldPosition[]
  widthM: number
}

function RoadRibbon({ material, points, widthM }: RoadRibbonProps) {
  const geometry = useMemo(() => createRoadRibbonGeometry(points, widthM), [points, widthM])

  return <mesh frustumCulled geometry={geometry} material={material} receiveShadow />
}

type CommunicationsMastProps = {
  accentMaterial: WorldMaterial
  structureMaterial: WorldMaterial
}

function CommunicationsMast({ accentMaterial, structureMaterial }: CommunicationsMastProps) {
  const [x, baseY, z] = COMMUNICATIONS_MAST_SITE.position
  const height = COMMUNICATIONS_MAST_SITE.heightM

  return (
    <group name={COMMUNICATIONS_MAST_SITE.id} position={[x, baseY, z]}>
      <mesh castShadow material={structureMaterial} position={[0, 2, 0]} receiveShadow>
        <boxGeometry args={[44, 4, 44]} />
      </mesh>
      <mesh castShadow material={structureMaterial} position={[0, height / 2, 0]}>
        <cylinderGeometry args={[1.4, 3.4, height, 6]} />
      </mesh>
      <mesh castShadow material={structureMaterial} position={[0, 26, 0]}>
        <boxGeometry args={[24, 1.5, 1.5]} />
      </mesh>
      <mesh castShadow material={structureMaterial} position={[0, 44, 0]}>
        <boxGeometry args={[1.5, 1.5, 21]} />
      </mesh>
      <mesh material={accentMaterial} position={[0, height + 1.8, 0]}>
        <octahedronGeometry args={[2.7, 0]} />
      </mesh>
    </group>
  )
}

function createWorldMaterials() {
  const terrainBase = {
    flatShading: true,
    metalness: 0,
    roughness: 0.94,
  } as const

  return {
    ocean: new MeshStandardMaterial({
      color: '#28515f',
      metalness: 0.06,
      roughness: 0.42,
      side: DoubleSide,
    }),
    mainland: new MeshStandardMaterial({ color: '#5f594b', ...terrainBase }),
    easternPlain: new MeshStandardMaterial({ color: '#625d4c', ...terrainBase }),
    industrial: new MeshStandardMaterial({ color: '#59574d', ...terrainBase }),
    harborPavement: new MeshStandardMaterial({ color: '#555954', ...terrainBase }),
    storageHardstand: new MeshStandardMaterial({ color: '#69675d', ...terrainBase }),
    beachSand: new MeshStandardMaterial({ color: '#897653', ...terrainBase }),
    beachIntertidal: new MeshStandardMaterial({ color: '#645f50', ...terrainBase }),
    beachShallows: new MeshStandardMaterial({
      color: '#28515b',
      metalness: 0.03,
      opacity: 0.86,
      roughness: 0.48,
      transparent: true,
    }),
    ridge: new MeshStandardMaterial({ color: '#685e49', ...terrainBase }),
    lowerBench: new MeshStandardMaterial({ color: '#72634a', ...terrainBase }),
    midSlope: new MeshStandardMaterial({ color: '#7c684a', ...terrainBase }),
    upperPlateau: new MeshStandardMaterial({ color: '#88734f', ...terrainBase }),
    summit: new MeshStandardMaterial({ color: '#957b54', ...terrainBase }),
    pad: new MeshStandardMaterial({
      color: '#6b6b63',
      metalness: 0.02,
      roughness: 0.88,
    }),
    road: new MeshStandardMaterial({ color: '#8e8777', metalness: 0, roughness: 0.98 }),
    bunker: new MeshStandardMaterial({ color: '#434943', metalness: 0.02, roughness: 0.92 }),
    warehouse: new MeshStandardMaterial({ color: '#4d514d', metalness: 0.04, roughness: 0.88 }),
    mast: new MeshStandardMaterial({ color: '#59605e', metalness: 0.3, roughness: 0.62 }),
    warningLight: new MeshStandardMaterial({
      color: '#9b3e2a',
      emissive: '#5c160b',
      emissiveIntensity: 0.6,
      roughness: 0.7,
    }),
  }
}

export type WorldShellProps = Pick<ThreeElements['group'], 'visible'>

export function WorldShell({ visible = true }: WorldShellProps) {
  const materials = useMemo(createWorldMaterials, [])
  const oceanCenterX = (MAP_BOUNDS.xMin + MAP_BOUNDS.xMax) / 2
  const oceanCenterZ = (MAP_BOUNDS.zMin + MAP_BOUNDS.zMax) / 2
  const oceanWidth = MAP_BOUNDS.xMax - MAP_BOUNDS.xMin
  const oceanDepth = MAP_BOUNDS.zMax - MAP_BOUNDS.zMin

  return (
    <group name="ash-harbor-world-shell" visible={visible}>
      <mesh frustumCulled material={materials.ocean} position={[oceanCenterX, TERRAIN_Y.ocean, oceanCenterZ]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[oceanWidth, oceanDepth, 1, 1]} />
      </mesh>

      <PolygonPrism bottomY={0.05} material={materials.mainland} points={MAINLAND_POLYGON_XZ} topY={TERRAIN_Y.mainland} />

      <PolygonPrism bottomY={TERRAIN_Y.mainland - 0.2} material={materials.easternPlain} points={TERRAIN_POLYGONS.easternPlain} topY={TERRAIN_Y.easternPlain} />
      <PolygonPrism bottomY={TERRAIN_Y.mainland - 0.2} material={materials.industrial} points={TERRAIN_POLYGONS.industrialPlateau} topY={TERRAIN_Y.industrialPlateau} />
      <PolygonPrism bottomY={TERRAIN_Y.mainland - 0.2} material={materials.harborPavement} points={TERRAIN_POLYGONS.harborPavement} topY={TERRAIN_Y.harborLowland} />
      <PolygonSurface material={materials.storageHardstand} points={TERRAIN_POLYGONS.storageHardstand} y={TERRAIN_Y.industrialPlateau + 0.2} />

      <PolygonPrism bottomY={TERRAIN_Y.mainland - 0.2} material={materials.ridge} points={TERRAIN_POLYGONS.radarRidge} topY={TERRAIN_Y.radarRidge} />
      <PolygonPrism bottomY={80} material={materials.lowerBench} points={TERRAIN_POLYGONS.radarLowerBench} topY={TERRAIN_Y.radarLowerBench} />
      <PolygonPrism bottomY={118} material={materials.midSlope} points={TERRAIN_POLYGONS.radarMidSlope} topY={TERRAIN_Y.radarMidSlope} />
      <PolygonPrism bottomY={165} material={materials.upperPlateau} points={TERRAIN_POLYGONS.radarUpperPlateau} topY={TERRAIN_Y.radarUpperPlateau} />
      <PolygonPrism bottomY={185} material={materials.summit} points={TERRAIN_POLYGONS.radarSummitLobe} topY={TERRAIN_Y.radarSummitLobe} />

      <PolygonPrism bottomY={TERRAIN_Y.radarSummitLobe} material={materials.pad} points={RADAR_PAD_POLYGONS.search} topY={RADAR_SEARCH_SITE.position[1]} />
      <PolygonPrism bottomY={TERRAIN_Y.radarUpperPlateau} material={materials.pad} points={RADAR_PAD_POLYGONS.tracking} topY={RADAR_TRACKING_SITE.position[1]} />
      <PolygonPrism bottomY={SAM_PAD_POSITIONS[0].terrainY} material={materials.pad} points={RADAR_PAD_POLYGONS.sam01} topY={SAM_PAD_POSITIONS[0].position[1]} />
      <PolygonPrism bottomY={SAM_PAD_POSITIONS[1].terrainY} material={materials.pad} points={RADAR_PAD_POLYGONS.sam02} topY={SAM_PAD_POSITIONS[1].position[1]} />
      <PolygonPrism bottomY={SAM_PAD_POSITIONS[2].terrainY} material={materials.pad} points={RADAR_PAD_POLYGONS.sam03} topY={SAM_PAD_POSITIONS[2].position[1]} />
      <PolygonPrism bottomY={SAM_PAD_POSITIONS[3].terrainY} material={materials.pad} points={RADAR_PAD_POLYGONS.sam04} topY={SAM_PAD_POSITIONS[3].position[1]} />
      <PolygonPrism bottomY={AAA_SITE.terrainY} material={materials.pad} points={RADAR_PAD_POLYGONS.aaa} topY={AAA_SITE.position[1]} />

      {RADAR_SUPPORT_POLYGONS.map((polygon, index) => {
        const building = RADAR_SUPPORT_BUILDINGS[index]!
        return <PolygonPrism key={building.id} bottomY={building.terrainY} castShadow material={materials.bunker} points={polygon} topY={building.terrainY + building.heightM} />
      })}
      <CommunicationsMast accentMaterial={materials.warningLight} structureMaterial={materials.mast} />

      <RoadRibbon material={materials.road} {...WORLD_ROADS.harborIndustrialLink} />
      <RoadRibbon material={materials.road} {...WORLD_ROADS.ridgeAccess} />
      <RoadRibbon material={materials.road} {...WORLD_ROADS.radarRing} />
      <RoadRibbon material={materials.road} {...WORLD_ROADS.easternTrunk} />
      <RoadRibbon material={materials.road} {...WORLD_ROADS.beachExit} />
      <RoadRibbon material={materials.road} {...WORLD_ROADS.beachAccessEast} />

      <PolygonPrism bottomY={0.02} material={materials.beachShallows} points={TERRAIN_POLYGONS.beachShallows} receiveShadow={false} topY={TERRAIN_Y.beachShallows} />
      <PolygonPrism bottomY={TERRAIN_Y.beachShallows} material={materials.beachIntertidal} points={TERRAIN_POLYGONS.beachIntertidal} topY={TERRAIN_Y.beachIntertidal} />
      <PolygonPrism bottomY={TERRAIN_Y.beachIntertidal} material={materials.beachSand} points={TERRAIN_POLYGONS.beachSand} topY={TERRAIN_Y.beachSand} />

      {HARBOR_WAREHOUSE_POLYGONS.map((polygon, index) => {
        const warehouse = HARBOR_WAREHOUSE_POSITIONS[index]!
        return <PolygonPrism key={warehouse.id} bottomY={warehouse.terrainY} castShadow material={materials.warehouse} points={polygon} topY={warehouse.terrainY + warehouse.heightM} />
      })}
    </group>
  )
}
