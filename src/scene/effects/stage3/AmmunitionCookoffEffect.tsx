import { useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import type { Stage3Vec3 } from './types.ts'

import { AnalyticalDebris } from './AnalyticalDebris.tsx'
import { LayeredBlast, PersistentBlastDamage } from './BlastLayers.tsx'
import { BoundedSmokeColumn } from './BoundedSmoke.tsx'
import { AMMUNITION_COOKOFF_OFFSETS_SECONDS, AMMUNITION_COOKOFF_START_SECONDS, AMMUNITION_PRIMARY_TIME_SECONDS, AMMUNITION_SECONDARY_OFFSETS_SECONDS, clamp01, createBallisticFragments, createGroundFires, createStage3Random, cyclicParticleEnvelope, smoothstep01 } from './effectMath.ts'
import { PersistentGroundFires } from './PersistentGroundFires.tsx'
import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from './sharedResources.ts'

export interface AmmunitionCookoffBurstDescriptor {
  readonly diameterM: number
  readonly eventTimeSeconds: number
  readonly position: Stage3Vec3
  readonly sharpness: number
}

type TimedCookoffBurst = AmmunitionCookoffBurstDescriptor

interface CookoffBurstPoolProps {
  readonly bursts: readonly TimedCookoffBurst[]
  readonly timeSeconds: number
}

/** All minor cookoff bursts share three fixed instance pools, including their lingering soot. */
function CookoffBurstPool({ bursts, timeSeconds }: CookoffBurstPoolProps) {
  const debrisRef = useRef<InstancedMesh>(null)
  const dustRef = useRef<InstancedMesh>(null)
  const flameRef = useRef<InstancedMesh>(null)
  const sparkRef = useRef<InstancedMesh>(null)
  const smokeRef = useRef<InstancedMesh>(null)
  const scratchObject = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const debris = debrisRef.current
    const dust = dustRef.current
    const flame = flameRef.current
    const spark = sparkRef.current
    const smoke = smokeRef.current
    if (!debris || !dust || !flame || !spark || !smoke) return

    const object = scratchObject
    let debrisCount = 0
    let dustCount = 0
    let flameCount = 0
    let smokeCount = 0

    for (let burstIndex = 0; burstIndex < bursts.length; burstIndex += 1) {
      const burst = bursts[burstIndex]
      const age = timeSeconds - burst.eventTimeSeconds
      if (age < 0) continue

      if (age <= 1.45) {
        const growth = smoothstep01(age / (0.18 + burst.sharpness * 0.14))
        const decay = 1 - smoothstep01((age - 0.42) / 1.03) * 0.72
        const scale = Math.max(0.01, burst.diameterM * 0.5 * growth * decay)
        object.position.set(burst.position[0], burst.position[1] + burst.diameterM * 0.2, burst.position[2])
        object.rotation.set(age * 0.4, burst.sharpness * 2.3, age * 0.25)
        object.scale.set(scale * 0.86, scale, scale * 0.82)
        object.updateMatrix()
        flame.setMatrixAt(flameCount, object.matrix)

        const sparkHeight = burst.diameterM * (1.2 + (1 - clamp01(age / 0.42)) * 1.1)
        object.position.set(burst.position[0], burst.position[1] + sparkHeight * 0.5, burst.position[2])
        object.rotation.set(0, burst.sharpness * Math.PI, 0)
        object.scale.set(0.4 + burst.sharpness * 0.55, sparkHeight, 0.4 + burst.sharpness * 0.55)
        object.updateMatrix()
        spark.setMatrixAt(flameCount, object.matrix)
        flameCount += 1
      }

      if (age <= 1.25) {
        const dustProgress = clamp01(age / 1.25)
        const dustEnvelope = Math.sin(dustProgress * Math.PI)
        const dustSize = Math.max(0.001, burst.diameterM * (0.12 + dustProgress * 0.38) * dustEnvelope)
        object.position.set(burst.position[0], burst.position[1] + 0.45 + dustProgress * 1.8, burst.position[2])
        object.rotation.set(0, burst.sharpness * 2.7, 0)
        object.scale.set(dustSize * 1.6, dustSize * 0.42, dustSize * 1.35)
        object.updateMatrix()
        dust.setMatrixAt(dustCount, object.matrix)
        dustCount += 1
      }

      for (let fragmentIndex = 0; fragmentIndex < 3; fragmentIndex += 1) {
        const phase = burstIndex * 1.91 + fragmentIndex * 2.37 + burst.sharpness
        const horizontalSpeed = 7 + ((burstIndex + fragmentIndex * 2) % 5) * 2.1
        const verticalSpeed = 10 + ((burstIndex * 3 + fragmentIndex) % 6) * 1.5
        const initialHeight = 1.2 + fragmentIndex * 0.35
        const lifetimeSeconds = (verticalSpeed + Math.sqrt(verticalSpeed * verticalSpeed + 2 * 9.81 * initialHeight)) / 9.81
        if (age > lifetimeSeconds) continue
        const fragmentHeight = initialHeight + verticalSpeed * age - 9.81 * age * age * 0.5
        object.position.set(burst.position[0] + Math.sin(phase) * horizontalSpeed * age, burst.position[1] + Math.max(0.05, fragmentHeight), burst.position[2] + Math.cos(phase) * horizontalSpeed * age)
        object.rotation.set(age * (2.1 + fragmentIndex), phase + age * 1.4, age * (1.3 + burst.sharpness))
        object.scale.set(1.1 + fragmentIndex * 0.3, 0.28 + burst.sharpness * 0.16, 0.44 + fragmentIndex * 0.1)
        object.updateMatrix()
        debris.setMatrixAt(debrisCount, object.matrix)
        debrisCount += 1
      }

      if (age >= 0.32) {
        const cycle = (age - 0.32) % 9
        const progress = cycle / 9
        const drift = cycle * 3.2
        const smokeEnvelope = cyclicParticleEnvelope(progress, 0.12, 0.22)
        const size = Math.max(0.001, (4.5 + progress * 13 + burst.diameterM * 0.08) * smokeEnvelope)
        object.position.set(burst.position[0] + drift * 0.7, burst.position[1] + 5 + progress * 58, burst.position[2] + drift * 0.71)
        object.rotation.set(0.12 * burst.sharpness, cycle * 0.16 + burst.sharpness, 0)
        object.scale.set(size * 0.76, size, size * 0.8)
        object.updateMatrix()
        smoke.setMatrixAt(smokeCount, object.matrix)
        smokeCount += 1
      }
    }

    debris.count = debrisCount
    dust.count = dustCount
    flame.count = flameCount
    spark.count = flameCount
    smoke.count = smokeCount
    for (const mesh of [debris, dust, flame, spark, smoke]) {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [bursts, scratchObject, timeSeconds])

  const capacity = Math.max(1, bursts.length)
  const fragmentCapacity = Math.max(1, bursts.length * 3)
  return (
    <group name="stage3-ammunition-minor-cookoff-pool">
      <instancedMesh ref={debrisRef} args={[STAGE3_GEOMETRIES.debris, STAGE3_MATERIALS.debris, fragmentCapacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={dustRef} args={[STAGE3_GEOMETRIES.puff, STAGE3_MATERIALS.dust, capacity]} dispose={null} frustumCulled={false} renderOrder={2} />
      <instancedMesh ref={flameRef} args={[STAGE3_GEOMETRIES.puff, STAGE3_MATERIALS.fireOuter, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={sparkRef} args={[STAGE3_GEOMETRIES.emberTrail, STAGE3_MATERIALS.ember, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={smokeRef} args={[STAGE3_GEOMETRIES.puff, STAGE3_MATERIALS.smokeCore, capacity]} dispose={null} frustumCulled={false} renderOrder={3} />
    </group>
  )
}

function createCookoffPositions(primaryPosition: Stage3Vec3, count: number, seed: number | string, surfaceHeightAt?: (x: number, z: number) => number) {
  const random = createStage3Random(`${seed}:minor-cookoff-positions`)
  return Array.from({ length: count }, (_, index): Stage3Vec3 => {
    const angle = random() * Math.PI * 2 + index * 1.73
    const radius = 9 + random() * 39
    const x = primaryPosition[0] + Math.sin(angle) * radius
    const z = primaryPosition[2] + Math.cos(angle) * radius
    return [x, surfaceHeightAt ? surfaceHeightAt(x, z) : primaryPosition[1], z]
  })
}

export interface AmmunitionCookoffEffectProps {
  readonly cookoffPositions?: readonly Stage3Vec3[]
  readonly cookoffStartSeconds?: number
  readonly groundFirePositions?: readonly Stage3Vec3[]
  readonly preliminaryBursts?: readonly AmmunitionCookoffBurstDescriptor[]
  readonly primaryPosition: Stage3Vec3
  readonly primaryTimeSeconds?: number
  readonly secondaryPositions?: readonly Stage3Vec3[]
  readonly seed?: number | string
  readonly surfaceHeightAt?: (x: number, z: number) => number
  readonly timeSeconds: number
}

/** Irregular T+116 cookoffs culminating in the sharp, fragment-heavy T+132 primary. */
export function AmmunitionCookoffEffect({
  cookoffPositions,
  cookoffStartSeconds = AMMUNITION_COOKOFF_START_SECONDS,
  groundFirePositions,
  preliminaryBursts,
  primaryPosition,
  primaryTimeSeconds = AMMUNITION_PRIMARY_TIME_SECONDS,
  secondaryPositions,
  seed = 'ash-harbor-ammunition-cookoff',
  surfaceHeightAt,
  timeSeconds,
}: AmmunitionCookoffEffectProps) {
  const fallbackCookoffPositions = useMemo(() => createCookoffPositions(primaryPosition, AMMUNITION_COOKOFF_OFFSETS_SECONDS.length, seed, surfaceHeightAt), [primaryPosition, seed, surfaceHeightAt])
  const fallbackSecondaryPositions = useMemo(() => createCookoffPositions(primaryPosition, AMMUNITION_SECONDARY_OFFSETS_SECONDS.length, `${seed}:secondary`, surfaceHeightAt), [primaryPosition, seed, surfaceHeightAt])
  const bursts = useMemo<readonly TimedCookoffBurst[]>(() => {
    const preliminary =
      preliminaryBursts ??
      AMMUNITION_COOKOFF_OFFSETS_SECONDS.map((offset, index) => ({
        diameterM: 10 + (index % 3) * 3.5,
        eventTimeSeconds: cookoffStartSeconds + offset,
        position: cookoffPositions?.[index] ?? fallbackCookoffPositions[index],
        sharpness: ((index * 37) % 11) / 10,
      }))
    const secondary = AMMUNITION_SECONDARY_OFFSETS_SECONDS.map((offset, index) => ({
      diameterM: 18 + index * 3,
      eventTimeSeconds: primaryTimeSeconds + offset,
      position: secondaryPositions?.[index] ?? fallbackSecondaryPositions[index],
      sharpness: 0.72 + index * 0.08,
    }))
    return [...preliminary, ...secondary]
  }, [cookoffPositions, cookoffStartSeconds, fallbackCookoffPositions, fallbackSecondaryPositions, preliminaryBursts, primaryTimeSeconds, secondaryPositions])
  const primaryDebris = useMemo(() => createBallisticFragments(`${seed}:primary`, 26, 'ammunition'), [seed])
  const compoundFires = useMemo(() => createGroundFires(`${seed}:compound`, 8, 92), [seed])
  const primaryAge = timeSeconds - primaryTimeSeconds

  return (
    <group name="stage3-ammunition-cookoff-effect">
      <CookoffBurstPool bursts={bursts} timeSeconds={timeSeconds} />
      <LayeredBlast eventTimeSeconds={primaryTimeSeconds} fireballRadiusM={52} position={primaryPosition} profile="ammunition" shockDurationSeconds={1.35} shockRadiusM={500} timeSeconds={timeSeconds} />
      <AnalyticalDebris descriptors={primaryDebris} eventTimeSeconds={primaryTimeSeconds} origin={primaryPosition} timeSeconds={timeSeconds} />
      <PersistentGroundFires descriptors={compoundFires} eventTimeSeconds={primaryTimeSeconds} origin={primaryPosition} positions={groundFirePositions} surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />
      <BoundedSmokeColumn ageSeconds={primaryAge - 0.18} heightM={155} origin={primaryPosition} profile="ammunition" puffCount={24} seed={`${seed}:primary-column`} />
      <PersistentBlastDamage eventTimeSeconds={primaryTimeSeconds} origin={primaryPosition} profile="ammunition" seed={seed} surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />
    </group>
  )
}
