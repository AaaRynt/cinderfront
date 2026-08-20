import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferGeometry, DynamicDrawUsage, InstancedMesh, Material, Object3D, Quaternion, Vector3 } from 'three'

import type { BlastResponseDescriptor, Stage3BlastObjectKind, Stage3Vec3 } from './types.ts'

import { FUEL_HERO_TIME_SECONDS, FUEL_RESPONSE_RADIUS_M, createBlastResponseLayout, cyclicParticleEnvelope, sampleBlastResponse, smoothstep01 } from './effectMath.ts'
import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from './sharedResources.ts'

const UP = new Vector3(0, 1, 0)

interface ResponseKindInstancesProps {
  readonly blastTimeSeconds: number
  readonly descriptors: readonly BlastResponseDescriptor[]
  readonly geometry: BufferGeometry
  readonly kind: Stage3BlastObjectKind
  readonly material: Material
  readonly origin: Stage3Vec3
  readonly responseRadiusM: number
  readonly timeSeconds: number
}

function ResponseKindInstances({ blastTimeSeconds, descriptors, geometry, kind, material, origin, responseRadiusM, timeSeconds }: ResponseKindInstancesProps) {
  const normalRef = useRef<InstancedMesh>(null)
  const charredRef = useRef<InstancedMesh>(null)
  const kindDescriptors = useMemo(() => descriptors.filter((descriptor) => descriptor.kind === kind), [descriptors, kind])
  const scratch = useMemo(
    () => ({
      away: new Vector3(),
      bendAxis: new Vector3(),
      bendQuaternion: new Quaternion(),
      object: new Object3D(),
      yawQuaternion: new Quaternion(),
    }),
    [],
  )

  useLayoutEffect(() => {
    const normal = normalRef.current
    const charred = charredRef.current
    if (!normal || !charred) return

    const { away, bendAxis, bendQuaternion, object, yawQuaternion } = scratch
    let normalCount = 0
    let charredCount = 0

    for (const descriptor of kindDescriptors) {
      const sample = sampleBlastResponse(descriptor, timeSeconds, blastTimeSeconds, responseRadiusM)
      away.set(descriptor.position[0] - origin[0], 0, descriptor.position[2] - origin[2])
      if (away.lengthSq() < 1e-8) away.set(1, 0, 0)
      away.normalize()
      bendAxis.crossVectors(UP, away).normalize()
      bendQuaternion.setFromAxisAngle(bendAxis, sample.bendRadians)
      yawQuaternion.setFromAxisAngle(UP, descriptor.yawRadians)

      object.position.set(...descriptor.position)
      object.quaternion.copy(bendQuaternion).multiply(yawQuaternion)
      object.scale.set(...descriptor.scale)
      object.updateMatrix()
      if (sample.charred) {
        charred.setMatrixAt(charredCount, object.matrix)
        charredCount += 1
      } else {
        normal.setMatrixAt(normalCount, object.matrix)
        normalCount += 1
      }
    }

    normal.count = normalCount
    charred.count = charredCount
    for (const mesh of [normal, charred]) {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [blastTimeSeconds, kindDescriptors, origin, responseRadiusM, scratch, timeSeconds])

  const capacity = Math.max(1, kindDescriptors.length)
  return (
    <group name={`stage3-blast-response-${kind}`}>
      <instancedMesh ref={normalRef} args={[geometry, material, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={charredRef} args={[geometry, STAGE3_MATERIALS.charred, capacity]} dispose={null} frustumCulled={false} />
    </group>
  )
}

interface ResponseIgnitionPoolProps {
  readonly blastTimeSeconds: number
  readonly descriptors: readonly BlastResponseDescriptor[]
  readonly responseRadiusM: number
  readonly timeSeconds: number
}

function ResponseIgnitionPool({ blastTimeSeconds, descriptors, responseRadiusM, timeSeconds }: ResponseIgnitionPoolProps) {
  const flameRef = useRef<InstancedMesh>(null)
  const emberRef = useRef<InstancedMesh>(null)
  const smokeRef = useRef<InstancedMesh>(null)
  const burnable = useMemo(() => descriptors.filter((descriptor) => descriptor.burns), [descriptors])
  const scratchObject = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const flame = flameRef.current
    const ember = emberRef.current
    const smoke = smokeRef.current
    if (!flame || !ember || !smoke) return
    const object = scratchObject
    let activeCount = 0

    for (const descriptor of burnable) {
      const sample = sampleBlastResponse(descriptor, timeSeconds, blastTimeSeconds, responseRadiusM)
      if (!sample.ignitionActive) continue
      const flicker = 0.86 + Math.sin(timeSeconds * 9.4 + descriptor.phase) * 0.12
      const ignitionGrowth = smoothstep01(sample.ignitionAgeSeconds / 0.24)
      const base = (descriptor.kind === 'scrub' ? 2.7 : 1.35) * ignitionGrowth

      object.position.set(...descriptor.position)
      object.rotation.set(0, descriptor.phase + timeSeconds * 0.13, 0)
      object.scale.set(base, base * 4.1 * flicker, base)
      object.updateMatrix()
      flame.setMatrixAt(activeCount, object.matrix)

      object.position.set(descriptor.position[0], descriptor.position[1] + 0.12, descriptor.position[2])
      object.rotation.y = -descriptor.phase + timeSeconds * 0.19
      object.scale.set(base * 0.52, base * 2.8 * flicker, base * 0.52)
      object.updateMatrix()
      ember.setMatrixAt(activeCount, object.matrix)

      const smokeCycle = sample.ignitionAgeSeconds % 5.8
      const smokeEnvelope = cyclicParticleEnvelope(smokeCycle / 5.8, 0.12, 0.22)
      const smokeSize = Math.max(0.001, base * (1.4 + smokeCycle * 0.55) * smokeEnvelope)
      object.position.set(descriptor.position[0] + smokeCycle * 0.9, descriptor.position[1] + 4 + smokeCycle * 2.8, descriptor.position[2] + smokeCycle * 0.92)
      object.rotation.set(0, descriptor.phase + smokeCycle * 0.2, 0)
      object.scale.set(smokeSize * 0.74, smokeSize, smokeSize * 0.78)
      object.updateMatrix()
      smoke.setMatrixAt(activeCount, object.matrix)
      activeCount += 1
    }

    for (const mesh of [flame, ember, smoke]) {
      mesh.count = activeCount
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.instanceMatrix.needsUpdate = true
    }
  }, [blastTimeSeconds, burnable, responseRadiusM, scratchObject, timeSeconds])

  const capacity = Math.max(1, burnable.length)
  return (
    <group name="stage3-blast-response-persistent-ignitions">
      <instancedMesh ref={flameRef} args={[STAGE3_GEOMETRIES.fire, STAGE3_MATERIALS.fireOuter, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={emberRef} args={[STAGE3_GEOMETRIES.fire, STAGE3_MATERIALS.fireInner, capacity]} dispose={null} frustumCulled={false} />
      <instancedMesh ref={smokeRef} args={[STAGE3_GEOMETRIES.puff, STAGE3_MATERIALS.smokeLocal, capacity]} dispose={null} frustumCulled={false} renderOrder={3} />
    </group>
  )
}

export interface BlastResponseFieldProps {
  readonly blastTimeSeconds?: number
  readonly descriptors?: readonly BlastResponseDescriptor[]
  readonly origin: Stage3Vec3
  readonly responseRadiusM?: number
  readonly seed?: number | string
  readonly surfaceHeightAt?: (x: number, z: number) => number
  readonly timeSeconds: number
}

/** Local deterministic industrial objects that bend only after the physical shock arrives. */
export function BlastResponseField({ blastTimeSeconds = FUEL_HERO_TIME_SECONDS, descriptors, origin, responseRadiusM = FUEL_RESPONSE_RADIUS_M, seed = 'ash-harbor-stage3-industrial-response', surfaceHeightAt, timeSeconds }: BlastResponseFieldProps) {
  const generatedDescriptors = useMemo(() => createBlastResponseLayout({ origin, responseRadiusM, seed, surfaceHeightAt }), [origin, responseRadiusM, seed, surfaceHeightAt])
  const layout = descriptors ?? generatedDescriptors

  return (
    <group name="stage3-local-blast-response-field">
      <ResponseKindInstances blastTimeSeconds={blastTimeSeconds} descriptors={layout} geometry={STAGE3_GEOMETRIES.grass} kind="grass" material={STAGE3_MATERIALS.grass} origin={origin} responseRadiusM={responseRadiusM} timeSeconds={timeSeconds} />
      <ResponseKindInstances blastTimeSeconds={blastTimeSeconds} descriptors={layout} geometry={STAGE3_GEOMETRIES.scrub} kind="scrub" material={STAGE3_MATERIALS.scrub} origin={origin} responseRadiusM={responseRadiusM} timeSeconds={timeSeconds} />
      <ResponseKindInstances blastTimeSeconds={blastTimeSeconds} descriptors={layout} geometry={STAGE3_GEOMETRIES.lightPole} kind="light-pole" material={STAGE3_MATERIALS.lightPole} origin={origin} responseRadiusM={responseRadiusM} timeSeconds={timeSeconds} />
      <ResponseKindInstances blastTimeSeconds={blastTimeSeconds} descriptors={layout} geometry={STAGE3_GEOMETRIES.fence} kind="fence" material={STAGE3_MATERIALS.fence} origin={origin} responseRadiusM={responseRadiusM} timeSeconds={timeSeconds} />
      <ResponseKindInstances blastTimeSeconds={blastTimeSeconds} descriptors={layout} geometry={STAGE3_GEOMETRIES.antenna} kind="antenna" material={STAGE3_MATERIALS.antenna} origin={origin} responseRadiusM={responseRadiusM} timeSeconds={timeSeconds} />
      <ResponseIgnitionPool blastTimeSeconds={blastTimeSeconds} descriptors={layout} responseRadiusM={responseRadiusM} timeSeconds={timeSeconds} />
    </group>
  )
}
