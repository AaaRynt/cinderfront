import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, InstancedMesh, MeshStandardMaterial, StaticDrawUsage, type BufferGeometry } from 'three'

import { fitLandscapeBase } from './groundFit'
import { createTreeGeometry } from './landscapeGeometry'
import { createTreeLayout, treeBaseMatrix, type LandscapeTree } from './treeLayout'

function TreePool({ geometry, material, instances, wood, baseGeometry }: { geometry: BufferGeometry; material: MeshStandardMaterial; instances: readonly LandscapeTree[]; wood: boolean; baseGeometry: BufferGeometry }) {
  const ref = useRef<InstancedMesh>(null)
  const fitted = useMemo(() => instances.map((t) => fitLandscapeBase(baseGeometry, treeBaseMatrix(t), 0.13).matrix), [instances, baseGeometry])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    instances.forEach((tree, i) => {
      mesh.setMatrixAt(i, fitted[i]!)
      mesh.setColorAt(i, new Color('#ffffff').multiplyScalar(0.86 + tree.colorMix * 0.2))
    })
    mesh.count = instances.length
    mesh.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
    return () => mesh.dispose()
  }, [instances, fitted])
  return <instancedMesh ref={ref} args={[geometry, material, Math.max(1, instances.length)]} name={`6a-tree-${wood ? 'branches' : 'foliage'}`} castShadow={wood} receiveShadow dispose={null} userData={{ landscapeIds: instances.map((t) => t.id) }} />
}
/** Four shared silhouettes, three small regional bounds; no timeline or camera
 * subscription, wind, LOD mutation, per-branch draws or per-frame allocation. */
export function SparseTrees() {
  const resources = useMemo(
    () => ({
      layout: createTreeLayout(),
      wood: new MeshStandardMaterial({ vertexColors: true, color: '#ffffff', roughness: 1, flatShading: true }),
      leaves: new MeshStandardMaterial({ vertexColors: true, color: '#ffffff', roughness: 0.98, side: DoubleSide, flatShading: true }),
      forms: (['upright', 'wind'] as const).flatMap((form) => [0, 1].map((variant) => ({ form, variant, ...createTreeGeometry(form, variant) }))),
    }),
    [],
  )
  const batches = useMemo(() => resources.forms.flatMap((f) => (['corridor', 'radar', 'beach'] as const).map((region) => ({ form: f, region, instances: resources.layout.filter((t) => t.region === region && t.form === f.form && t.variant === f.variant) }))).filter((b) => b.instances.length), [resources])
  useEffect(
    () => () => {
      resources.forms.forEach((f) => {
        f.wood.dispose()
        f.leaves.dispose()
      })
      resources.wood.dispose()
      resources.leaves.dispose()
    },
    [resources],
  )
  return (
    <group name="stage6a-dryland-trees">
      {batches.map((b) => (
        <group key={`${b.region}:${b.form.form}:${b.form.variant}`} name={`6a-trees-${b.region}-${b.form.form}-${b.form.variant}`}>
          <TreePool geometry={b.form.wood} baseGeometry={b.form.wood} material={resources.wood} instances={b.instances} wood />
          <TreePool geometry={b.form.leaves} baseGeometry={b.form.wood} material={resources.leaves} instances={b.instances} wood={false} />
        </group>
      ))}
    </group>
  )
}
