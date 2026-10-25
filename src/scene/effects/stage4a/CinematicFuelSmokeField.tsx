import { useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import type { Stage3Vec3 } from '../stage3/types.ts'

import { cyclicParticleEnvelope } from '../stage3/effectMath.ts'
import { createStage4ASmokePuffs } from './fuelDisasterMath.ts'
import { STAGE4A_FUEL_GEOMETRIES, STAGE4A_FUEL_MATERIALS } from './sharedResources.ts'

export interface CinematicFuelSmokeSource {
  readonly eventTimeSeconds: number
  readonly heightM: number
  readonly id: string
  readonly origin: Stage3Vec3
  readonly puffCount: number
}

export interface CinematicFuelSmokeFieldProps {
  readonly sources: readonly CinematicFuelSmokeSource[]
  readonly timeSeconds: number
}

/** Fixed-capacity, multi-source smoke with a dense core, body, and broken edge layer. */
export function CinematicFuelSmokeField({ sources, timeSeconds }: CinematicFuelSmokeFieldProps) {
  const bodyRef = useRef<InstancedMesh>(null)
  const coreRef = useRef<InstancedMesh>(null)
  const edgeRef = useRef<InstancedMesh>(null)
  const scratchObject = useMemo(() => new Object3D(), [])
  const layouts = useMemo(
    () =>
      sources.map((source) => ({
        descriptors: createStage4ASmokePuffs(source.id, source.puffCount, 0.52 + Math.sqrt(source.heightM / 340) * 0.62),
        source,
      })),
    [sources],
  )
  const capacity = Math.max(
    1,
    layouts.reduce((total, layout) => total + layout.descriptors.length, 0),
  )

  useLayoutEffect(() => {
    const body = bodyRef.current
    const core = coreRef.current
    const edge = edgeRef.current
    if (!body || !core || !edge) return

    const object = scratchObject
    let bodyCount = 0
    let coreCount = 0
    let edgeCount = 0

    for (const { descriptors, source } of layouts) {
      const sourceAge = timeSeconds - source.eventTimeSeconds - 0.18
      if (sourceAge < 0) continue
      const windSpeed = source.heightM >= 300 ? 5.5 : 3.7

      for (const descriptor of descriptors) {
        const emittedAge = sourceAge - descriptor.delaySeconds
        if (emittedAge < 0) continue
        const cycleAge = emittedAge % descriptor.lifetimeSeconds
        const progress = cycleAge / descriptor.lifetimeSeconds
        const envelope = cyclicParticleEnvelope(progress, 0.1, 0.24)
        const curl = Math.sin(cycleAge * 0.55 + descriptor.phase) * descriptor.curl * (10 + progress * 28)
        const windTravel = cycleAge * windSpeed
        const rise = 5 + progress * source.heightM
        const size = Math.max(0.001, descriptor.sizeM * (0.48 + progress * 1.92) * envelope)
        const crownSpread = progress * progress * (source.heightM >= 300 ? 48 : 22)

        object.position.set(source.origin[0] + windTravel * 0.71 + curl + Math.sin(descriptor.phase) * crownSpread, source.origin[1] + rise, source.origin[2] + windTravel * 0.7 - curl * 0.31 + Math.cos(descriptor.phase) * crownSpread * 0.78)
        object.rotation.set(descriptor.curl * 0.16, descriptor.phase + progress * 1.55, descriptor.curl * 0.21)
        object.scale.set(size * (0.7 + Math.abs(descriptor.curl) * 0.18), size, size * (0.75 + Math.abs(descriptor.curl) * 0.12))
        object.updateMatrix()

        if (descriptor.layer === 'core') {
          core.setMatrixAt(coreCount, object.matrix)
          coreCount += 1
        } else if (descriptor.layer === 'body') {
          body.setMatrixAt(bodyCount, object.matrix)
          bodyCount += 1
        } else {
          edge.setMatrixAt(edgeCount, object.matrix)
          edgeCount += 1
        }
      }
    }

    body.count = bodyCount
    core.count = coreCount
    edge.count = edgeCount
    body.instanceMatrix.setUsage(DynamicDrawUsage)
    core.instanceMatrix.setUsage(DynamicDrawUsage)
    edge.instanceMatrix.setUsage(DynamicDrawUsage)
    body.instanceMatrix.needsUpdate = true
    core.instanceMatrix.needsUpdate = true
    edge.instanceMatrix.needsUpdate = true
    for (const mesh of [body, core, edge]) mesh.computeBoundingSphere()
  }, [layouts, scratchObject, timeSeconds])

  return (
    <group name="stage4a-layered-fuel-smoke-field">
      <instancedMesh ref={coreRef} args={[STAGE4A_FUEL_GEOMETRIES.smoke, STAGE4A_FUEL_MATERIALS.smokeCore, capacity]} dispose={null} frustumCulled renderOrder={5} />
      <instancedMesh ref={bodyRef} args={[STAGE4A_FUEL_GEOMETRIES.smoke, STAGE4A_FUEL_MATERIALS.smokeBody, capacity]} dispose={null} frustumCulled renderOrder={4} />
      <instancedMesh ref={edgeRef} args={[STAGE4A_FUEL_GEOMETRIES.smoke, STAGE4A_FUEL_MATERIALS.smokeEdge, capacity]} dispose={null} frustumCulled renderOrder={3} />
    </group>
  )
}
