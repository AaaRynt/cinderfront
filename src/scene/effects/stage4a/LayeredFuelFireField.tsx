import { useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import type { Stage3Vec3 } from '../stage3/types.ts'

import { periodicAngle } from '../aftermath/effectClocks'
import { cyclicParticleEnvelope } from '../stage3/effectMath.ts'
import { sampleStage4AFuelFireIntensity } from './fuelDisasterMath.ts'
import { STAGE4A_FUEL_GEOMETRIES, STAGE4A_FUEL_MATERIALS } from './sharedResources.ts'

export interface LayeredFuelFireSource {
  readonly eventTimeSeconds: number
  readonly id: string
  readonly phase: number
  readonly position: Stage3Vec3
  readonly scale: number
}

export interface LayeredFuelFireFieldProps {
  readonly sources: readonly LayeredFuelFireSource[]
  readonly timeSeconds: number
}

/** One bounded instance pool for sustained source fires and liquid-fuel pool fires. */
export function LayeredFuelFireField({ sources, timeSeconds }: LayeredFuelFireFieldProps) {
  const innerRef = useRef<InstancedMesh>(null)
  const outerRef = useRef<InstancedMesh>(null)
  const sootRef = useRef<InstancedMesh>(null)
  const scratchObject = useMemo(() => new Object3D(), [])
  const capacity = Math.max(1, sources.length)

  useLayoutEffect(() => {
    const inner = innerRef.current
    const outer = outerRef.current
    const soot = sootRef.current
    if (!inner || !outer || !soot) return

    const object = scratchObject
    let activeCount = 0

    for (const source of sources) {
      const age = timeSeconds - source.eventTimeSeconds
      if (age < 0) continue
      const intensity = timeSeconds <= 180 ? sampleStage4AFuelFireIntensity(source.eventTimeSeconds, timeSeconds, source.phase) : 0.82 + Math.sin(periodicAngle(age, 4.7, source.phase)) * 0.1 + Math.sin(periodicAngle(age, 8.9, source.phase * 0.37)) * 0.04
      const radius = 4.15 * source.scale * (0.9 + intensity * 0.1)
      const height = 11.5 * source.scale * intensity

      object.position.set(...source.position)
      object.rotation.set(0, periodicAngle(age, 0.14, source.phase), 0)
      object.scale.set(radius, Math.max(0.001, height), radius)
      object.updateMatrix()
      outer.setMatrixAt(activeCount, object.matrix)

      object.position.set(source.position[0], source.position[1] + 0.35, source.position[2])
      object.rotation.set(0, periodicAngle(age, 0.19, -source.phase), 0)
      object.scale.set(radius * 0.54, Math.max(0.001, height * 0.72), radius * 0.54)
      object.updateMatrix()
      inner.setMatrixAt(activeCount, object.matrix)

      const smokeCycle = age % 6.8
      const smokeEnvelope = cyclicParticleEnvelope(smokeCycle / 6.8, 0.1, 0.24)
      const smokeScale = Math.max(0.001, (4 + smokeCycle * 1.75) * source.scale * smokeEnvelope)
      object.position.set(source.position[0] + smokeCycle * 1.35, source.position[1] + height * 0.68 + smokeCycle * 4.2, source.position[2] + smokeCycle * 1.25)
      object.rotation.set(source.phase * 0.18, source.phase + smokeCycle * 0.15, 0)
      object.scale.set(smokeScale * 0.72, smokeScale, smokeScale * 0.78)
      object.updateMatrix()
      soot.setMatrixAt(activeCount, object.matrix)
      activeCount += 1
    }

    inner.count = activeCount
    outer.count = activeCount
    soot.count = activeCount
    inner.instanceMatrix.setUsage(DynamicDrawUsage)
    outer.instanceMatrix.setUsage(DynamicDrawUsage)
    soot.instanceMatrix.setUsage(DynamicDrawUsage)
    inner.instanceMatrix.needsUpdate = true
    outer.instanceMatrix.needsUpdate = true
    soot.instanceMatrix.needsUpdate = true
  }, [scratchObject, sources, timeSeconds])

  return (
    <group name="stage4a-bounded-liquid-fuel-fire-field">
      <instancedMesh ref={outerRef} args={[STAGE4A_FUEL_GEOMETRIES.fire, STAGE4A_FUEL_MATERIALS.fireOuter, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={innerRef} args={[STAGE4A_FUEL_GEOMETRIES.fire, STAGE4A_FUEL_MATERIALS.fireInner, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={sootRef} args={[STAGE4A_FUEL_GEOMETRIES.smoke, STAGE4A_FUEL_MATERIALS.hotSoot, capacity]} dispose={null} frustumCulled={false} renderOrder={4} />
    </group>
  )
}
