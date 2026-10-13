import type { BufferGeometry } from 'three'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, FrontSide, InstancedMesh, MeshStandardMaterial, Object3D, StaticDrawUsage } from 'three'

import { createLandingRegionalLayout } from '../landing/landingReservations'
import { createCoverGeometry } from './coverGeometry'
import { REGIONAL_BOUNDS, type CoverInstance, type CoverKind, type Region } from './regionalLayout'

const PALETTE: Record<Region, readonly [grass: string, scrub: string, rock: string]> = {
  radar: ['#8b8060', '#565b45', '#827967'],
  corridor: ['#8c805b', '#616345', '#8b8068'],
  beach: ['#a89b6c', '#74795b', '#8e8774'],
  harbor: ['#8d8969', '#656c51', '#787b71'],
  industrial: ['#95886a', '#62684b', '#8a806c'],
}
function CoverPool({ geometry, instances, kind, material }: { geometry: BufferGeometry; instances: readonly CoverInstance[]; kind: CoverKind; material: MeshStandardMaterial }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const object = new Object3D()
    const color = new Color()
    for (const [i, instance] of instances.entries()) {
      object.position.set(...instance.position)
      object.scale.set(...instance.scale)
      object.rotation.set(0, instance.yaw, 0)
      object.updateMatrix()
      mesh.setMatrixAt(i, object.matrix)
      const paletteIndex = kind === 'grass' ? 0 : kind === 'scrub' ? 1 : 2
      color.set(PALETTE[instance.region][paletteIndex]).multiplyScalar(0.84 + instance.colorMix * 0.3)
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
    return () => mesh.dispose()
  }, [instances, kind])
  return <instancedMesh ref={ref} args={[geometry, material, instances.length]} castShadow={kind === 'rock'} dispose={null} name={`4c-${kind}-clumps`} receiveShadow />
}

/** Static layout has no timeline/camera subscription. Six shared resources,
 * with regional instance bounds so distant cover can leave the view frustum. */
export function RegionalCover() {
  const resources = useMemo(() => {
    const layout = createLandingRegionalLayout()
    return (['grass', 'scrub', 'rock'] as const).flatMap((kind) =>
      [0, 1].map((variant) => ({
        kind,
        variant,
        regions: (Object.keys(REGIONAL_BOUNDS) as Region[]).map((region) => ({ region, instances: layout.filter((i) => i.kind === kind && i.variant === variant && i.region === region) })),
        geometry: createCoverGeometry(kind, variant),
        material: new MeshStandardMaterial({ color: '#ffffff', roughness: 0.98, flatShading: true, side: kind === 'grass' ? DoubleSide : FrontSide }),
      })),
    )
  }, [])
  useEffect(
    () => () =>
      resources.forEach((r) => {
        r.geometry.dispose()
        r.material.dispose()
      }),
    [resources],
  )
  return <group name="stage4c-regional-cover">{resources.flatMap((r) => r.regions.map((batch) => <CoverPool key={`${batch.region}:${r.kind}:${r.variant}`} geometry={r.geometry} material={r.material} kind={r.kind} instances={batch.instances} />))}</group>
}
