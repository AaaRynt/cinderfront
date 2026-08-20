import { useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Matrix4, Object3D } from 'three'

import type { BallisticFragmentDescriptor, Stage3Vec3 } from './types.ts'

import { addVec3, sampleBallisticFragment } from './effectMath.ts'
import { STAGE3_GEOMETRIES, STAGE3_MATERIALS, setSegmentMatrix } from './sharedResources.ts'

export interface AnalyticalDebrisProps {
  readonly descriptors: readonly BallisticFragmentDescriptor[]
  readonly eventTimeSeconds: number
  readonly origin: Stage3Vec3
  readonly timeSeconds: number
}

const EMPTY_POSITION: Stage3Vec3 = [0, 0, 0]

/** Fixed-count, analytical fragments that reconstruct directly from absolute time. */
export function AnalyticalDebris({ descriptors, eventTimeSeconds, origin, timeSeconds }: AnalyticalDebrisProps) {
  const debrisRef = useRef<InstancedMesh>(null)
  const emberRef = useRef<InstancedMesh>(null)
  const flameRef = useRef<InstancedMesh>(null)
  const scratch = useMemo(() => ({ object: new Object3D(), segmentMatrix: new Matrix4() }), [])

  useLayoutEffect(() => {
    const debris = debrisRef.current
    const ember = emberRef.current
    const flame = flameRef.current
    if (!debris || !ember || !flame) return

    const eventAge = timeSeconds - eventTimeSeconds
    const { object, segmentMatrix } = scratch
    let debrisCount = 0
    let trailCount = 0

    if (eventAge >= 0) {
      for (const descriptor of descriptors) {
        if (eventAge > descriptor.lifetimeSeconds) continue
        const sample = sampleBallisticFragment(descriptor, eventAge)
        if (sample.position[1] < 0.2) continue

        object.position.set(origin[0] + sample.position[0], origin[1] + sample.position[1], origin[2] + sample.position[2])
        object.rotation.set(...sample.rotation)
        object.scale.set(...descriptor.scale)
        object.updateMatrix()
        debris.setMatrixAt(debrisCount, object.matrix)
        debrisCount += 1

        if (!descriptor.burning) continue
        const previousAge = Math.max(0, eventAge - 0.18)
        const previous = sampleBallisticFragment(descriptor, previousAge)
        const head = addVec3(origin, sample.position)
        const tail = addVec3(origin, previous.position)
        setSegmentMatrix(segmentMatrix, tail, head, 0.7)
        flame.setMatrixAt(trailCount, segmentMatrix)
        setSegmentMatrix(segmentMatrix, tail, head, 0.25)
        ember.setMatrixAt(trailCount, segmentMatrix)
        trailCount += 1
      }
    }

    debris.count = debrisCount
    flame.count = trailCount
    ember.count = trailCount
    for (const mesh of [debris, flame, ember]) {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [descriptors, eventTimeSeconds, origin, scratch, timeSeconds])

  const capacity = Math.max(1, descriptors.length)
  return (
    <group name="stage3-analytical-ballistic-debris" position={EMPTY_POSITION}>
      <instancedMesh ref={debrisRef} args={[STAGE3_GEOMETRIES.debris, STAGE3_MATERIALS.debris, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={flameRef} args={[STAGE3_GEOMETRIES.flameTrail, STAGE3_MATERIALS.flame, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={emberRef} args={[STAGE3_GEOMETRIES.emberTrail, STAGE3_MATERIALS.ember, capacity]} dispose={null} frustumCulled={false} />
    </group>
  )
}
