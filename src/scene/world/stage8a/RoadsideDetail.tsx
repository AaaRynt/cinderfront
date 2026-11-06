import { useEffect, useMemo } from 'react'
import { Color, DoubleSide, InstancedMesh, MeshStandardMaterial, StaticDrawUsage } from 'three'

import { applyLandscapeSurface } from '../landscape/landscapeMaterial'
import { createDetailGeometries, createSignFace } from './detailGeometry'
import { createDetailGround } from './detailGround'
import { createDetailLayout, fitDetailPlacement, type DetailKind, type DetailPlacement, type DetailSite } from './detailLayout'
import { createSignAtlas } from './signAtlas'

const CASTERS = new Set<DetailKind>(['shelter', 'upright', 'wind', 'wash-sign', 'route-sign', 'remnant'])
const SITES: readonly DetailSite[] = ['corridor', 'beach']

function createResources() {
  const geometries = createDetailGeometries()
  const texture = createSignAtlas()
  const solid = new MeshStandardMaterial({ roughness: 0.94, vertexColors: true, flatShading: true, side: DoubleSide })
  const signs = new MeshStandardMaterial({ roughness: 0.9, map: texture })
  const ground = applyLandscapeSurface(new MeshStandardMaterial({ roughness: 0.98, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }), 0.55)
  const sites = SITES.map((site) => {
    const groups = new Map<DetailKind, DetailPlacement[]>()
    for (const placement of createDetailLayout(site)) {
      const group = groups.get(placement.kind)
      if (group) group.push(placement)
      else groups.set(placement.kind, [placement])
    }
    const plate = createSignFace(site)
    const drape = createDetailGround(site)
    const batches = [...groups].flatMap(([kind, placements]) => {
      const geometry = geometries[kind]
      const sign = kind === 'wash-sign' || kind === 'route-sign'
      const mesh = new InstancedMesh(geometry, solid, placements.length)
      const face = sign ? new InstancedMesh(plate, signs, placements.length) : null
      mesh.name = `8a-${site}-${kind}`
      mesh.castShadow = CASTERS.has(kind)
      mesh.userData.detailIds = placements.map((p) => p.id)
      if (face) face.name = `8a-${site}-sign-face`
      placements.forEach((placement, i) => {
        const matrix = fitDetailPlacement(geometry, site, placement)
        mesh.setMatrixAt(i, matrix)
        mesh.setColorAt(i, new Color(placement.tint))
        face?.setMatrixAt(i, matrix)
      })
      const pools = face ? [mesh, face] : [mesh]
      for (const pool of pools) {
        pool.receiveShadow = true
        pool.instanceMatrix.setUsage(StaticDrawUsage)
        pool.instanceMatrix.needsUpdate = true
        if (pool.instanceColor) pool.instanceColor.needsUpdate = true
        pool.computeBoundingBox()
        pool.computeBoundingSphere()
      }
      return pools
    })
    return { site, drape, plate, batches }
  })

  return {
    ground,
    sites,
    dispose() {
      for (const { drape, plate, batches } of sites) {
        batches.forEach((batch) => batch.dispose())
        drape.dispose()
        plate.dispose()
      }
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      solid.dispose()
      signs.dispose()
      ground.dispose()
      texture.dispose()
    },
  }
}

export function RoadsideDetail() {
  const resources = useMemo(() => createResources(), [])
  useEffect(() => () => resources.dispose(), [resources])
  return (
    <group name="stage8a-roadside-detail" dispose={null}>
      {resources.sites.map(({ site, drape, batches }) => (
        <group key={site} name={`stage8a-${site}`}>
          <mesh name={`8a-${site}-surface`} geometry={drape} material={resources.ground} receiveShadow renderOrder={2} />
          {batches.map((batch) => (
            <primitive key={batch.name} object={batch} />
          ))}
        </group>
      ))}
    </group>
  )
}
