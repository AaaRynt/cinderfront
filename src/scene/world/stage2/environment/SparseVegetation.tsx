import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, ConeGeometry, DodecahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D, StaticDrawUsage } from 'three'

import type { EnvironmentResponseInstance } from './responseGroups.ts'
import type { VegetationInstanceTransform, VegetationPatchSpec } from './seededLayout.ts'

import { createEnvironmentUserData } from './responseGroups.ts'
import { createVegetationLayout } from './seededLayout.ts'

const GRASS_GEOMETRY = new ConeGeometry(0.5, 1, 3, 1)
const SCRUB_GEOMETRY = new DodecahedronGeometry(0.5, 0)

const GRASS_MATERIAL = new MeshStandardMaterial({
  color: '#ffffff',
  flatShading: true,
  metalness: 0,
  roughness: 0.98,
})

const SCRUB_MATERIAL = new MeshStandardMaterial({
  color: '#ffffff',
  flatShading: true,
  metalness: 0,
  roughness: 1,
})

const VEGETATION_COLORS = {
  coastal_dune: {
    grass: [new Color('#9a8754'), new Color('#c1a765')] as const,
    scrub: [new Color('#756e45'), new Color('#99905b')] as const,
  },
  dry_plain: {
    grass: [new Color('#877949'), new Color('#ad9656')] as const,
    scrub: [new Color('#59603c'), new Color('#7c7949')] as const,
  },
  radar_hill: {
    grass: [new Color('#766c43'), new Color('#9a8651')] as const,
    scrub: [new Color('#51563a'), new Color('#6d7047')] as const,
  },
} as const

function responseInstancesFor(instances: readonly VegetationInstanceTransform[], responseGroupId: string | undefined): readonly EnvironmentResponseInstance[] | undefined {
  if (!responseGroupId) {
    return undefined
  }

  return instances.map((instance) => ({
    id: instance.responseId,
    instanceIndex: instance.instanceIndex,
    kind: instance.kind,
    position: instance.position,
    responseGroupId,
  }))
}

function applyInstanceTransforms(mesh: InstancedMesh, instances: readonly VegetationInstanceTransform[], colors: readonly [Color, Color]) {
  const transform = new Object3D()
  const color = new Color()

  for (const instance of instances) {
    transform.position.set(instance.position[0], instance.position[1] + instance.scale[1] * 0.5, instance.position[2])
    transform.rotation.set(0, instance.yaw, 0)
    transform.scale.set(...instance.scale)
    transform.updateMatrix()
    mesh.setMatrixAt(instance.instanceIndex, transform.matrix)

    color.copy(colors[0]).lerp(colors[1], instance.colorMix)
    mesh.setColorAt(instance.instanceIndex, color)
  }

  mesh.count = instances.length
  mesh.instanceMatrix.setUsage(StaticDrawUsage)
  mesh.instanceMatrix.needsUpdate = true

  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true
  }

  mesh.computeBoundingBox()
  mesh.computeBoundingSphere()
}

export type SparseVegetationPatchProps = VegetationPatchSpec &
  Readonly<{
    visible?: boolean
  }>

/**
 * Sparse Ash Harbor cover rendered as two draw-call-scale instance batches.
 * Instance transforms are deterministic and response metadata is published on
 * each InstancedMesh for later authored Stage 3 lookup.
 */
export function SparseVegetationPatch({ exclusions, grassCount, id, polygonXZ, profile = 'dry_plain', responseGroup, scrubCount, seed, surfaceY, visible = true }: SparseVegetationPatchProps) {
  const grassRef = useRef<InstancedMesh>(null)
  const scrubRef = useRef<InstancedMesh>(null)
  const layout = useMemo(
    () =>
      createVegetationLayout({
        exclusions,
        grassCount,
        id,
        polygonXZ,
        profile,
        responseGroup,
        scrubCount,
        seed,
        surfaceY,
      }),
    [exclusions, grassCount, id, polygonXZ, profile, responseGroup, scrubCount, seed, surfaceY],
  )
  const grassResponseInstances = useMemo(() => responseInstancesFor(layout.grass, responseGroup?.id), [layout.grass, responseGroup?.id])
  const scrubResponseInstances = useMemo(() => responseInstancesFor(layout.scrub, responseGroup?.id), [layout.scrub, responseGroup?.id])
  const grassUserData = useMemo(() => createEnvironmentUserData(`${id}:grass`, responseGroup, layout.grass.length, grassResponseInstances), [grassResponseInstances, id, layout.grass.length, responseGroup])
  const scrubUserData = useMemo(() => createEnvironmentUserData(`${id}:scrub`, responseGroup, layout.scrub.length, scrubResponseInstances), [id, layout.scrub.length, responseGroup, scrubResponseInstances])

  useLayoutEffect(() => {
    if (grassRef.current) {
      applyInstanceTransforms(grassRef.current, layout.grass, VEGETATION_COLORS[profile].grass)
    }

    if (scrubRef.current) {
      applyInstanceTransforms(scrubRef.current, layout.scrub, VEGETATION_COLORS[profile].scrub)
    }
  }, [layout, profile])

  return (
    <group name={id} visible={visible}>
      <instancedMesh ref={grassRef} args={[GRASS_GEOMETRY, GRASS_MATERIAL, Math.max(1, layout.grass.length)]} castShadow={false} dispose={null} frustumCulled name={`${id}:dry-grass`} receiveShadow={false} userData={grassUserData} />
      <instancedMesh ref={scrubRef} args={[SCRUB_GEOMETRY, SCRUB_MATERIAL, Math.max(1, layout.scrub.length)]} castShadow={false} dispose={null} frustumCulled name={`${id}:scrub`} receiveShadow={false} userData={scrubUserData} />
    </group>
  )
}
