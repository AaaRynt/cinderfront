import { useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import type { GroundFireDescriptor, Stage3Vec3 } from './types.ts'

import { cyclicParticleEnvelope } from './effectMath.ts'
import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from './sharedResources.ts'

export interface PersistentGroundFiresProps {
  readonly descriptors: readonly GroundFireDescriptor[]
  readonly eventTimeSeconds: number
  readonly origin: Stage3Vec3
  readonly positions?: readonly Stage3Vec3[]
  readonly surfaceHeightAt?: (x: number, z: number) => number
  readonly timeSeconds: number
}

function resolveFirePosition(descriptor: GroundFireDescriptor, index: number, origin: Stage3Vec3, positions: readonly Stage3Vec3[] | undefined, surfaceHeightAt: PersistentGroundFiresProps['surfaceHeightAt']): Stage3Vec3 {
  const supplied = positions?.[index]
  if (supplied) return supplied
  const x = origin[0] + descriptor.offset[0]
  const z = origin[2] + descriptor.offset[2]
  return [x, surfaceHeightAt ? surfaceHeightAt(x, z) : origin[1] + descriptor.offset[1], z]
}

/** A fixed pool of varied fires and soot plumes that survives timeline seeking. */
export function PersistentGroundFires({ descriptors, eventTimeSeconds, origin, positions, surfaceHeightAt, timeSeconds }: PersistentGroundFiresProps) {
  const innerRef = useRef<InstancedMesh>(null)
  const outerRef = useRef<InstancedMesh>(null)
  const smokeRef = useRef<InstancedMesh>(null)
  const scratchObject = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const inner = innerRef.current
    const outer = outerRef.current
    const smoke = smokeRef.current
    if (!inner || !outer || !smoke) return

    const object = scratchObject
    let activeCount = 0

    for (let index = 0; index < descriptors.length; index += 1) {
      const descriptor = descriptors[index]
      const age = timeSeconds - eventTimeSeconds - descriptor.delaySeconds
      if (age < 0) continue

      const position = resolveFirePosition(descriptor, index, origin, positions, surfaceHeightAt)
      const flicker = 0.86 + Math.sin(age * 8.2 + descriptor.phase) * 0.1 + Math.sin(age * 13.7 + descriptor.phase * 0.4) * 0.04
      const baseRadius = 3.2 * descriptor.scale
      const height = 8.5 * descriptor.scale * flicker

      object.position.set(...position)
      object.rotation.set(0, descriptor.phase + age * 0.16, 0)
      object.scale.set(baseRadius, height, baseRadius)
      object.updateMatrix()
      outer.setMatrixAt(activeCount, object.matrix)

      object.position.set(position[0], position[1] + 0.25, position[2])
      object.rotation.y = -descriptor.phase + age * 0.22
      object.scale.set(baseRadius * 0.55, height * 0.72, baseRadius * 0.55)
      object.updateMatrix()
      inner.setMatrixAt(activeCount, object.matrix)

      const smokeCycle = age % 5.6
      const smokeEnvelope = cyclicParticleEnvelope(smokeCycle / 5.6, 0.12, 0.22)
      const smokeScale = Math.max(0.001, (2.8 + smokeCycle * 1.25) * descriptor.scale * smokeEnvelope)
      object.position.set(position[0] + smokeCycle * 1.1, position[1] + height * 0.72 + smokeCycle * 3.3, position[2] + smokeCycle * 1.15)
      object.rotation.set(descriptor.phase * 0.2, descriptor.phase + smokeCycle * 0.18, 0)
      object.scale.set(smokeScale * 0.78, smokeScale, smokeScale * 0.8)
      object.updateMatrix()
      smoke.setMatrixAt(activeCount, object.matrix)
      activeCount += 1
    }

    for (const mesh of [inner, outer, smoke]) {
      mesh.count = activeCount
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [descriptors, eventTimeSeconds, origin, positions, scratchObject, surfaceHeightAt, timeSeconds])

  const capacity = Math.max(1, descriptors.length)
  return (
    <group name="stage3-persistent-ground-fires">
      <instancedMesh ref={outerRef} args={[STAGE3_GEOMETRIES.fire, STAGE3_MATERIALS.fireOuter, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={innerRef} args={[STAGE3_GEOMETRIES.fire, STAGE3_MATERIALS.fireInner, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={smokeRef} args={[STAGE3_GEOMETRIES.puff, STAGE3_MATERIALS.smokeLocal, capacity]} dispose={null} frustumCulled={false} renderOrder={3} />
    </group>
  )
}
