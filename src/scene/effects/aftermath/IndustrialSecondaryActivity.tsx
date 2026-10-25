import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import { getTerrainHeight } from '../../world/stage2/terrainModel'
import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from '../stage3/sharedResources'
import { SOFT_SMOKE_GEOMETRY } from '../stage3/softParticles'
import { INDUSTRIAL_SECONDARY_SITES, sampleIndustrialSecondary, SECONDARY_PUFFS_PER_SITE } from './industrialSecondary'

/** Fixed slots reuse existing industrial effect resources. Short local flashes
 * and puffs never produce a shockwave, debris launch, event or actor mutation. */
export function IndustrialSecondaryActivity({ time }: { time: number }) {
  const resources = useMemo(() => {
    const flash = new InstancedMesh(STAGE3_GEOMETRIES.puff, STAGE3_MATERIALS.fireInner, INDUSTRIAL_SECONDARY_SITES.length)
    const puff = new InstancedMesh(SOFT_SMOKE_GEOMETRY, STAGE3_MATERIALS.smokeLocal, INDUSTRIAL_SECONDARY_SITES.length * SECONDARY_PUFFS_PER_SITE)
    for (const mesh of [flash, puff]) {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage)
      mesh.frustumCulled = false
      mesh.count = 0
    }
    flash.name = 'aftermath-minor-industrial-flash-pool'
    puff.name = 'aftermath-minor-industrial-puff-pool'
    flash.userData.poolCapacity = INDUSTRIAL_SECONDARY_SITES.length
    puff.userData.poolCapacity = INDUSTRIAL_SECONDARY_SITES.length * SECONDARY_PUFFS_PER_SITE
    puff.renderOrder = 3
    return { flash, puff, object: new Object3D() }
  }, [])
  const resourceRef = useRef(resources)
  useLayoutEffect(() => {
    resourceRef.current = resources
  }, [resources])
  useLayoutEffect(() => {
    let flashes = 0
    let puffs = 0
    const { flash, puff, object } = resourceRef.current
    for (const site of INDUSTRIAL_SECONDARY_SITES) {
      const sample = sampleIndustrialSecondary(site, time)
      if (!sample) continue
      const y = getTerrainHeight(sample.x, sample.z) + 1
      if (sample.flash > 0) {
        object.position.set(sample.x, y + 0.8, sample.z)
        object.rotation.set(0, sample.cycle * 0.7, 0)
        object.scale.setScalar((0.35 + sample.flash * 1.8) * sample.scale)
        object.updateMatrix()
        flash.setMatrixAt(flashes++, object.matrix)
      }
      for (let slot = 0; slot < SECONDARY_PUFFS_PER_SITE; slot++) {
        const angle = slot * 2.399 + sample.offsetX
        const spread = sample.age * (0.28 + slot * 0.11)
        const size = sample.puffScale * (0.65 + slot * 0.12)
        object.position.set(sample.x + Math.cos(angle) * spread, y + sample.age * (0.9 + slot * 0.16), sample.z + Math.sin(angle) * spread)
        object.rotation.set(0.1 * slot, angle, 0.2 * slot)
        object.scale.set(size, size * 1.1, size)
        object.updateMatrix()
        puff.setMatrixAt(puffs++, object.matrix)
      }
    }
    flash.count = flashes
    puff.count = puffs
    flash.visible = flashes > 0
    puff.visible = puffs > 0
    flash.instanceMatrix.needsUpdate = true
    puff.instanceMatrix.needsUpdate = true
    puff.computeBoundingSphere()
    puff.frustumCulled = true
  }, [resources, time])
  useEffect(
    () => () => {
      resources.flash.dispose()
      resources.puff.dispose()
    },
    [resources],
  )
  return (
    <group name="aftermath-minor-industrial-secondary-activity">
      <primitive object={resources.flash} dispose={null} />
      <primitive object={resources.puff} dispose={null} />
    </group>
  )
}
