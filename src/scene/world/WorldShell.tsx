import type { ThreeElements } from '@react-three/fiber'

import { useEffect, useMemo } from 'react'

import { createLegacyRockResources, LegacyRockResourcesContext } from './landscape/legacyRockResources'
import { SparseTrees } from './landscape/SparseTrees'
import { BeachheadEnvironment } from './stage2/BeachheadEnvironment.tsx'
import { ConvoyCorridor } from './stage2/ConvoyCorridor.tsx'
import { HarborDistrict } from './stage2/HarborDistrict.tsx'
import { IndustrialDistrict } from './stage2/IndustrialDistrict.tsx'
import { RadarHillEnvironment } from './stage2/RadarHillEnvironment.tsx'
import { RoadRailUtilities } from './stage2/RoadRailUtilities.tsx'
import { createStage2Materials } from './stage2/stage2Materials.ts'
import { TerrainAndWater } from './stage2/TerrainAndWater.tsx'
import { RegionalCover } from './stage4c/RegionalCover.tsx'
import { ServiceEquipment } from './stage4c/ServiceEquipment.tsx'
import { SurfaceHistory } from './stage4c/SurfaceHistory.tsx'

export type WorldShellProps = Pick<ThreeElements['group'], 'visible'>

/** Static Ash Harbor districts and environmental presentation in map meters. */
export function WorldShell({ visible = true }: WorldShellProps) {
  const materials = useMemo(createStage2Materials, [])
  const rocks = useMemo(() => createLegacyRockResources(), [])
  useEffect(() => () => rocks.dispose(), [rocks])

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose())
    },
    [materials],
  )

  return (
    <LegacyRockResourcesContext.Provider value={rocks}>
      <group name="ash-harbor-stage2-world" visible={visible}>
        <TerrainAndWater materials={materials} />
        <RoadRailUtilities materials={materials} />
        <HarborDistrict materials={materials} />
        <IndustrialDistrict materials={materials} />
        <RadarHillEnvironment materials={materials} />
        <ConvoyCorridor materials={materials} />
        <BeachheadEnvironment materials={materials} />
        <RegionalCover />
        <SparseTrees />
        <ServiceEquipment />
        <SurfaceHistory />
      </group>
    </LegacyRockResourcesContext.Provider>
  )
}
