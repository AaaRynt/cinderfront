import { useMemo } from 'react'

import type { Stage3Vec3 } from '../stage3/types.ts'

import { AnalyticalDebris } from '../stage3/AnalyticalDebris.tsx'
import { DustShockFront } from '../stage3/BlastLayers.tsx'
import { CinematicFuelSmokeField, type CinematicFuelSmokeSource } from './CinematicFuelSmokeField.tsx'
import { FuelDamageAftermath } from './FuelDamageAftermath.tsx'
import { STAGE4A_FUEL_ESCALATION_SCHEDULE, STAGE4A_FUEL_HERO_TIME_SECONDS, STAGE4A_FUEL_POOL_FIRE_SCHEDULE, createStage4AFuelDebris, resolveStage4AFuelEventPosition, sampleStage4AFuelFireIntensity } from './fuelDisasterMath.ts'
import { FuelEscalationBurst } from './FuelEscalationBurst.tsx'
import { LayeredFuelFireField, type LayeredFuelFireSource } from './LayeredFuelFireField.tsx'

export interface Stage4AFuelDisasterProps {
  readonly surfaceHeightAt: (x: number, z: number) => number
  readonly timeSeconds: number
}

const DEBRIS_LAYOUTS = STAGE4A_FUEL_ESCALATION_SCHEDULE.filter((event) => event.debrisCount > 0).map((event) => {
  const descriptors = createStage4AFuelDebris(`ash-harbor-stage4a:${event.id}`, event.debrisCount, event.elevationOffsetM)
  return {
    descriptors,
    event,
    maximumLifetimeSeconds: descriptors.reduce((maximum, descriptor) => Math.max(maximum, descriptor.lifetimeSeconds), 0),
  }
})

/**
 * Complete Stage 4A replacement for Stage3BattleEffects' LocalIndustrialDamage
 * and FuelStorageHeroEffect. Keep the existing blast-response field and power
 * indicators, but do not mount the Stage 3 fuel components at the same time.
 */
export function Stage4AFuelDisaster({ surfaceHeightAt, timeSeconds }: Stage4AFuelDisasterProps) {
  const resolvedEvents = useMemo(
    () =>
      STAGE4A_FUEL_ESCALATION_SCHEDULE.map((descriptor) => {
        const [x, z] = descriptor.positionXZ
        const groundPosition: Stage3Vec3 = [x, surfaceHeightAt(x, z), z]
        return {
          descriptor,
          groundPosition,
          position: resolveStage4AFuelEventPosition(descriptor, surfaceHeightAt),
        }
      }),
    [surfaceHeightAt],
  )
  const eventById = useMemo(() => new Map(resolvedEvents.map((event) => [event.descriptor.id, event])), [resolvedEvents])
  const smokeSources = useMemo<readonly CinematicFuelSmokeSource[]>(
    () =>
      resolvedEvents.map(({ descriptor, position }) => ({
        eventTimeSeconds: descriptor.atSeconds,
        heightM: descriptor.smokeHeightM,
        id: descriptor.id,
        origin: position,
        puffCount: descriptor.smokePuffCount,
      })),
    [resolvedEvents],
  )
  const fireSources = useMemo<readonly LayeredFuelFireSource[]>(() => {
    const eventSources = resolvedEvents.map(({ descriptor, groundPosition, position }, index) => ({
      eventTimeSeconds: descriptor.atSeconds + (descriptor.kind === 'hero-cascade' ? 0.25 : 0.12),
      id: descriptor.id,
      phase: index * 1.47 + 0.35,
      position: descriptor.kind === 'bund-pool-ignition' || descriptor.kind === 'hero-cascade' ? groundPosition : position,
      scale: descriptor.fireScale,
    }))
    const poolSources = STAGE4A_FUEL_POOL_FIRE_SCHEDULE.map((fire, index): LayeredFuelFireSource => {
      const [x, z] = fire.positionXZ
      return {
        eventTimeSeconds: fire.igniteAtSeconds,
        id: `central-bund-pool-fire-${index + 1}`,
        phase: fire.phase,
        position: [x, surfaceHeightAt(x, z), z],
        scale: fire.scale,
      }
    })
    return [...eventSources, ...poolSources]
  }, [resolvedEvents, surfaceHeightAt])

  const hero = eventById.get('central-bund-hero-cascade')!
  const westernFlashover = eventById.get('tank-04-shell-flashover')!
  const heroFireLight = sampleStage4AFuelFireIntensity(STAGE4A_FUEL_HERO_TIME_SECONDS + 0.25, timeSeconds, 0.7)
  const secondaryFireLight = sampleStage4AFuelFireIntensity(95.32, timeSeconds, 2.1)

  return (
    <group name="ash-harbor-stage4a-fuel-disaster">
      {resolvedEvents.map(({ descriptor, position }) => (
        <FuelEscalationBurst key={descriptor.id} descriptor={descriptor} position={position} timeSeconds={timeSeconds} />
      ))}

      <DustShockFront ageSeconds={timeSeconds - STAGE4A_FUEL_HERO_TIME_SECONDS} durationSeconds={1.8} maximumRadiusM={620} origin={hero.groundPosition} profile="fuel" />

      {DEBRIS_LAYOUTS.map((layout) => {
        const eventAge = timeSeconds - layout.event.atSeconds
        if (eventAge < 0 || eventAge > layout.maximumLifetimeSeconds) return null
        const resolved = eventById.get(layout.event.id)!
        return <AnalyticalDebris key={layout.event.id} descriptors={layout.descriptors} eventTimeSeconds={layout.event.atSeconds} origin={resolved.groundPosition} timeSeconds={timeSeconds} />
      })}

      <LayeredFuelFireField sources={fireSources} timeSeconds={timeSeconds} />
      <CinematicFuelSmokeField sources={smokeSources} timeSeconds={timeSeconds} />
      <FuelDamageAftermath surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />

      <pointLight castShadow={false} color="#ff7b28" decay={2} distance={520} intensity={520 * heroFireLight} position={[hero.position[0], hero.groundPosition[1] + 34, hero.position[2]]} />
      <pointLight castShadow={false} color="#e85b1f" decay={2} distance={380} intensity={310 * secondaryFireLight} position={[westernFlashover.position[0], westernFlashover.groundPosition[1] + 26, westernFlashover.position[2]]} />
    </group>
  )
}
