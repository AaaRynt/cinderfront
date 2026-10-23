import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import type { SupportVehicleId } from '@/simulation/supportConvoyTypes'
import type { GroundVehicleId } from '@/simulation/types'

import { sampleRuntimeGroundVehicle, sampleRuntimeSupportVehicle } from '@/simulation/aftermathSurvivors'
import { getBtr80PresentationSurfaceHeight, getT72PresentationSurfaceHeight } from '@/simulation/groundVehicles'
import { getSupportPresentationSurfaceHeight } from '@/simulation/supportConvoy'

import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from '../stage3/sharedResources'
import { AFTERMATH_DUST_SLOTS_PER_ACTOR, sampleRecentGroundDust } from './groundDust'

export function AftermathGroundDust({ family, ids, time }: { family: 'btr' | 't72' | 'support'; ids: readonly string[]; time: number }) {
  const resources = useMemo(() => {
    const mesh = new InstancedMesh(STAGE3_GEOMETRIES.puff, STAGE3_MATERIALS.dust, ids.length * AFTERMATH_DUST_SLOTS_PER_ACTOR)
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.frustumCulled = false
    mesh.name = `aftermath-${family}-recent-contact-dust`
    mesh.userData.poolCapacity = ids.length * AFTERMATH_DUST_SLOTS_PER_ACTOR
    mesh.userData.slotsPerActor = AFTERMATH_DUST_SLOTS_PER_ACTOR
    mesh.count = 0
    return { mesh, object: new Object3D() }
  }, [family, ids.length])
  const resourceRef = useRef(resources)
  useLayoutEffect(() => {
    resourceRef.current = resources
  }, [resources])
  useLayoutEffect(() => {
    const { mesh, object } = resourceRef.current
    let count = 0
    if (time > 180)
      for (const id of ids) {
        const puffs =
          family === 'support'
            ? sampleRecentGroundDust(id, time, (at) => sampleRuntimeSupportVehicle(id as SupportVehicleId, at), 1.05, 2.6, getSupportPresentationSurfaceHeight)
            : sampleRecentGroundDust(id, time, (at) => sampleRuntimeGroundVehicle(id as GroundVehicleId, at), family === 'btr' ? 1.18 : 1.42, family === 'btr' ? 2.1 : 2.25, family === 'btr' ? getBtr80PresentationSurfaceHeight : getT72PresentationSurfaceHeight)
        for (const puff of puffs) {
          object.position.set(puff.position.x, puff.position.y, puff.position.z)
          object.rotation.set(0, puff.birthAtSeconds % (Math.PI * 2), 0)
          object.scale.set(puff.scale * 1.3, puff.scale * 0.58, puff.scale)
          object.updateMatrix()
          mesh.setMatrixAt(count++, object.matrix)
        }
      }
    mesh.count = count
    mesh.visible = count > 0
    mesh.instanceMatrix.needsUpdate = true
  }, [family, ids, resources, time])
  useEffect(() => () => resources.mesh.dispose(), [resources])
  return <primitive object={resources.mesh} dispose={null} />
}
