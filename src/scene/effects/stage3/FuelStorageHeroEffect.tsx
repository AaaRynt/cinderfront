import { useMemo } from 'react'

import type { Stage3Vec3 } from './types.ts'

import { AnalyticalDebris } from './AnalyticalDebris.tsx'
import { LayeredBlast, PersistentBlastDamage } from './BlastLayers.tsx'
import { BoundedSmokeColumn } from './BoundedSmoke.tsx'
import { FUEL_HERO_TIME_SECONDS, createBallisticFragments, createGroundFires } from './effectMath.ts'
import { PersistentGroundFires } from './PersistentGroundFires.tsx'

export interface FuelStorageHeroEffectProps {
  readonly eventTimeSeconds?: number
  readonly groundFirePositions?: readonly Stage3Vec3[]
  readonly position: Stage3Vec3
  readonly seed?: number | string
  readonly surfaceHeightAt?: (x: number, z: number) => number
  readonly timeSeconds: number
}

/** The Stage 3 T+92 fuel-storage hero event, reconstructed entirely from absolute time. */
export function FuelStorageHeroEffect({ eventTimeSeconds = FUEL_HERO_TIME_SECONDS, groundFirePositions, position, seed = 'ash-harbor-fuel-storage-hero', surfaceHeightAt, timeSeconds }: FuelStorageHeroEffectProps) {
  const debris = useMemo(() => createBallisticFragments(seed, 14, 'fuel'), [seed])
  const groundFires = useMemo(() => createGroundFires(`${seed}:compound`, 10, 168), [seed])
  const age = timeSeconds - eventTimeSeconds

  return (
    <group name="stage3-fuel-storage-hero-effect">
      <LayeredBlast eventTimeSeconds={eventTimeSeconds} fireballRadiusM={70} position={position} profile="fuel" shockDurationSeconds={1.8} shockRadiusM={620} timeSeconds={timeSeconds} />
      <AnalyticalDebris descriptors={debris} eventTimeSeconds={eventTimeSeconds} origin={position} timeSeconds={timeSeconds} />
      <PersistentGroundFires descriptors={groundFires} eventTimeSeconds={eventTimeSeconds} origin={position} positions={groundFirePositions} surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />
      <BoundedSmokeColumn ageSeconds={age - 0.32} heightM={265} origin={position} profile="fuel" puffCount={34} seed={`${seed}:dense-black-column`} />
      <PersistentBlastDamage eventTimeSeconds={eventTimeSeconds} origin={position} profile="fuel" seed={seed} surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />
    </group>
  )
}
