import { useEffect, useMemo } from 'react'
import { Color, DoubleSide, InstancedMesh, MeshDepthMaterial, MeshStandardMaterial, StaticDrawUsage, type BufferGeometry } from 'three'

import type { MotionClock } from '../stage8b/motionClock'

import { applyLandscapeSurface } from '../landscape/landscapeMaterial'
import { applyLocalWind, expandWindBounds, isWindKind, WIND_PROFILES, type WindKind } from '../stage8b/wind'
import { createRescueApproachLayout, createRescueShoulder } from '../stage8d/rescueApproach'
import { createDetailGeometries, createSignFace } from './detailGeometry'
import { createDetailGround } from './detailGround'
import { createDetailLayout, fitDetailPlacement, type DetailKind, type DetailPlacement, type DetailSite } from './detailLayout'
import { createSignAtlas } from './signAtlas'

const CASTERS = new Set<DetailKind>(['shelter', 'upright', 'wind', 'wash-sign', 'route-sign', 'remnant'])
const SITES: readonly DetailSite[] = ['corridor', 'beach']

function createResources(clock: MotionClock) {
  const geometries = createDetailGeometries()
  const texture = createSignAtlas()
  const solid = new MeshStandardMaterial({ roughness: 0.94, vertexColors: true, flatShading: true, side: DoubleSide })
  const plants = new Map((Object.keys(WIND_PROFILES) as WindKind[]).map((kind) => [kind, applyLocalWind(solid.clone(), kind, clock)]))
  const treeDepth = {
    upright: applyLocalWind(new MeshDepthMaterial(), 'upright', clock),
    wind: applyLocalWind(new MeshDepthMaterial(), 'wind', clock),
  }
  const signs = new MeshStandardMaterial({ roughness: 0.9, map: texture })
  const ground = applyLandscapeSurface(new MeshStandardMaterial({ roughness: 0.98, vertexColors: true, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }), 0.55)
  function createBatches(site: DetailSite, prefix: string, layout: readonly DetailPlacement[], plate?: BufferGeometry) {
    const groups = new Map<DetailKind, DetailPlacement[]>()
    for (const placement of layout) {
      const group = groups.get(placement.kind)
      if (group) group.push(placement)
      else groups.set(placement.kind, [placement])
    }
    return [...groups].flatMap(([kind, placements]) => {
      const geometry = geometries[kind]
      const sign = kind === 'wash-sign' || kind === 'route-sign'
      const mesh = new InstancedMesh(geometry, isWindKind(kind) ? plants.get(kind)! : solid, placements.length)
      const face = sign && plate ? new InstancedMesh(plate, signs, placements.length) : null
      mesh.name = `${prefix}-${kind}`
      mesh.castShadow = CASTERS.has(kind)
      if (kind === 'upright' || kind === 'wind') mesh.customDepthMaterial = treeDepth[kind]
      mesh.userData.detailIds = placements.map((p) => p.id)
      if (face) face.name = `${prefix}-sign-face`
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
      if (isWindKind(kind)) expandWindBounds(mesh, kind)
      return pools
    })
  }
  const sites = SITES.map((site) => {
    const plate = createSignFace(site)
    const prefix = `8a-${site}`
    return { name: `stage8a-${site}`, prefix, drape: createDetailGround(site), plate, batches: createBatches(site, prefix, createDetailLayout(site), plate) }
  })
  const approach = { name: 'stage8d-rescue-approach', prefix: '8d-rescue', drape: createRescueShoulder(), plate: null, batches: createBatches('corridor', '8d-rescue', createRescueApproachLayout()) }
  const sections = [...sites, approach]

  return {
    ground,
    sections,
    dispose() {
      for (const { drape, plate, batches } of sections) {
        batches.forEach((batch) => batch.dispose())
        drape.dispose()
        plate?.dispose()
      }
      Object.values(geometries).forEach((geometry) => geometry.dispose())
      plants.forEach((material) => material.dispose())
      Object.values(treeDepth).forEach((material) => material.dispose())
      solid.dispose()
      signs.dispose()
      ground.dispose()
      texture.dispose()
    },
  }
}

export function RoadsideDetail({ clock }: { clock: MotionClock }) {
  const resources = useMemo(() => createResources(clock), [clock])
  useEffect(() => () => resources.dispose(), [resources])
  return (
    <group name="stage8a-roadside-detail" dispose={null}>
      {resources.sections.map(({ name, prefix, drape, batches }) => (
        <group key={name} name={name}>
          <mesh name={`${prefix}-surface`} geometry={drape} material={resources.ground} receiveShadow renderOrder={2} />
          {batches.map((batch) => (
            <primitive key={batch.name} object={batch} />
          ))}
        </group>
      ))}
    </group>
  )
}
