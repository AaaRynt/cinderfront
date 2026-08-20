import { useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import type { Stage3Vec3 } from './types.ts'

import { STAGE3_WIND_XZ, createSmokePuffs, cyclicParticleEnvelope } from './effectMath.ts'
import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from './sharedResources.ts'

export interface BoundedSmokeColumnProps {
  readonly ageSeconds: number
  readonly heightM?: number
  readonly origin: Stage3Vec3
  readonly profile?: 'fuel' | 'ammunition' | 'local'
  readonly puffCount?: number
  readonly seed?: number | string
}

/** A fixed-size smoke pool whose transforms are a pure function of source age. */
export function BoundedSmokeColumn({ ageSeconds, heightM, origin, profile = 'fuel', puffCount, seed = 'ash-harbor-stage3-smoke' }: BoundedSmokeColumnProps) {
  const coreRef = useRef<InstancedMesh>(null)
  const edgeRef = useRef<InstancedMesh>(null)
  const resolvedCount = puffCount ?? (profile === 'fuel' ? 30 : profile === 'ammunition' ? 22 : 8)
  const descriptors = useMemo(() => createSmokePuffs(seed, resolvedCount, profile), [profile, resolvedCount, seed])
  const resolvedHeight = heightM ?? (profile === 'fuel' ? 245 : profile === 'ammunition' ? 145 : 42)
  const scratchObject = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const core = coreRef.current
    const edge = edgeRef.current
    if (!core || !edge) return
    const object = scratchObject
    let coreCount = 0
    let edgeCount = 0

    if (ageSeconds >= 0) {
      for (const descriptor of descriptors) {
        const emittedAge = ageSeconds - descriptor.delaySeconds
        if (emittedAge < 0) continue
        const cycleAge = emittedAge % descriptor.lifetimeSeconds
        const progress = cycleAge / descriptor.lifetimeSeconds
        const cycleEnvelope = cyclicParticleEnvelope(progress)
        const curl = Math.sin(cycleAge * 0.72 + descriptor.phase) * descriptor.curl * (8 + progress * 18)
        const rise = 5 + progress * resolvedHeight
        const windTravel = cycleAge * 4
        const x = origin[0] + STAGE3_WIND_XZ[0] * windTravel + curl
        const z = origin[2] + STAGE3_WIND_XZ[1] * windTravel - curl * 0.36
        const size = Math.max(0.001, descriptor.size * (0.55 + progress * 1.75) * cycleEnvelope)
        object.position.set(x, origin[1] + rise, z)
        object.rotation.set(descriptor.phase * 0.2, descriptor.phase + progress * 1.4, descriptor.curl * 0.18)
        object.scale.set(size * (0.72 + Math.abs(descriptor.curl) * 0.16), size, size * 0.78)
        object.updateMatrix()

        if (descriptor.core) {
          core.setMatrixAt(coreCount, object.matrix)
          coreCount += 1
        } else {
          edge.setMatrixAt(edgeCount, object.matrix)
          edgeCount += 1
        }
      }
    }

    core.count = coreCount
    edge.count = edgeCount
    for (const mesh of [core, edge]) {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [ageSeconds, descriptors, origin, resolvedHeight, scratchObject])

  const material = profile === 'local' ? STAGE3_MATERIALS.smokeLocal : undefined
  return (
    <group name={`stage3-${profile}-bounded-smoke`}>
      <instancedMesh ref={coreRef} args={[STAGE3_GEOMETRIES.puff, material ?? STAGE3_MATERIALS.smokeCore, Math.max(1, descriptors.length)]} dispose={null} frustumCulled={false} renderOrder={4} />
      <instancedMesh ref={edgeRef} args={[STAGE3_GEOMETRIES.puff, material ?? STAGE3_MATERIALS.smokeEdge, Math.max(1, descriptors.length)]} dispose={null} frustumCulled={false} renderOrder={3} />
    </group>
  )
}
