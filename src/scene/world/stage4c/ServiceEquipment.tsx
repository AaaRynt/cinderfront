import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, CylinderGeometry, DoubleSide, InstancedMesh, MeshStandardMaterial, StaticDrawUsage, TorusGeometry, type BufferGeometry, type Matrix4 } from 'three'

import { createLandingServiceLayout } from '../landing/landingReservations'
import { type Family } from './serviceLayout'
import { applyIndustrialWeathering } from './weathering'
function EquipmentPool({ geometry, material, matrices, name }: { geometry: BufferGeometry; material: MeshStandardMaterial; matrices: readonly Matrix4[]; name: string }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix))
    mesh.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
    return () => mesh.dispose()
  }, [matrices])
  return <instancedMesh ref={ref} args={[geometry, material, Math.max(1, matrices.length)]} count={matrices.length} dispose={null} name={name} receiveShadow />
}
export function ServiceEquipment() {
  const resources = useMemo(() => {
    const layout = createLandingServiceLayout()
    const box = new BoxGeometry(1, 1, 1)
    const reel = new CylinderGeometry(0.5, 0.5, 1, 12)
    const hose = new TorusGeometry(0.9, 0.24, 6, 16).rotateX(Math.PI / 2)
    const pipe = new CylinderGeometry(0.5, 0.5, 1, 12, 1, true).rotateX(Math.PI / 2)
    const materials = [
      applyIndustrialWeathering(new MeshStandardMaterial({ color: '#606a65', metalness: 0.18, roughness: 0.8 }), 0.45),
      new MeshStandardMaterial({ color: '#81755e', roughness: 1 }),
      new MeshStandardMaterial({ color: '#898d80', roughness: 0.98 }),
      new MeshStandardMaterial({ color: '#4a4c40', roughness: 0.85 }),
      new MeshStandardMaterial({ color: '#2f3734', roughness: 0.92 }),
      applyIndustrialWeathering(new MeshStandardMaterial({ color: '#77796a', roughness: 0.78, metalness: 0.3, side: DoubleSide }), 0.42),
    ]
    const families: Family[] = ['steelBox', 'timberBox', 'concreteBox', 'reel', 'hose', 'pipe']
    const geometries = [box, box, box, reel, hose, pipe]
    return { ownedGeometries: [box, reel, hose, pipe], materials, pools: families.map((family, i) => ({ name: `4c-${family}`, geometry: geometries[i]!, material: materials[i]!, matrices: layout[family] })) }
  }, [])
  useEffect(
    () => () => {
      resources.ownedGeometries.forEach((g) => g.dispose())
      resources.materials.forEach((m) => m.dispose())
    },
    [resources],
  )
  return (
    <group name="stage4c-functional-service-clusters">
      {resources.pools.map((p) => (
        <EquipmentPool key={p.name} {...p} />
      ))}
    </group>
  )
}
