import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshBasicMaterial, Quaternion, SphereGeometry, Vector3 } from 'three'

import type { LandingParticle, LandingWorldState } from '@/simulation/landingCraftTypes'

import { LANDING_PARTICLE_LIMIT } from '@/simulation/landingCraft'
import { LAV_DUST_SLOTS } from '@/simulation/lavDeployment'

import { LANDING_EFFECT_MASK_GLSL } from './landingEffectMask'
import { createLandingModelResources } from './landingModelResources'
import { LandingVehicleModels } from './LandingModels'

function CushionParticles({ craft, limit = LANDING_PARTICLE_LIMIT }: { craft: { id: string; particles: readonly LandingParticle[] }; limit?: number }) {
  const resources = useMemo(() => {
    const geometry = new SphereGeometry(1, 10, 6)
    geometry.setAttribute('landingOpacity', new InstancedBufferAttribute(new Float32Array(limit), 1))
    geometry.setAttribute('landingKind', new InstancedBufferAttribute(new Float32Array(limit), 1))
    const material = new MeshBasicMaterial({ color: '#a7bcb8', transparent: true, depthWrite: false })
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float landingOpacity; attribute float landingKind; varying float vLandingOpacity; varying float vLandingKind; varying vec2 vLandingXZ; varying vec2 vLandingLocalXZ;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvLandingLocalXZ=position.xz; vLandingOpacity=landingOpacity; vLandingKind=landingKind; vLandingXZ=(modelMatrix * instanceMatrix * vec4(transformed,1.0)).xz;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vLandingOpacity; varying float vLandingKind; varying vec2 vLandingXZ; varying vec2 vLandingLocalXZ;')
        .replace('#include <alphamap_fragment>', `#include <alphamap_fragment>\ndiffuseColor.a *= vLandingOpacity * (1.0-smoothstep(0.25,1.0,length(vLandingLocalXZ)));\n${LANDING_EFFECT_MASK_GLSL}`)
    }
    material.customProgramCacheKey = () => 'stage5b-bounded-hovercraft-cushion-v1'
    const mesh = new InstancedMesh(geometry, material, limit)
    mesh.name = `${craft.id}-cushion-effects`
    mesh.frustumCulled = false
    mesh.renderOrder = 2
    return { geometry, material, mesh, matrix: new Matrix4(), position: new Vector3(), scale: new Vector3(), quaternion: new Quaternion(), water: new Color('#b0c5c1'), spray: new Color('#8caaa9'), sand: new Color('#a99a76') }
  }, [craft.id, limit])
  const resourceRef = useRef(resources)
  useLayoutEffect(() => {
    resourceRef.current = resources
  }, [resources])
  useLayoutEffect(() => {
    const { geometry, mesh, matrix, position, scale, quaternion } = resourceRef.current
    const opacity = geometry.getAttribute('landingOpacity'),
      kind = geometry.getAttribute('landingKind')
    for (let i = 0; i < limit; i++) {
      const p = craft.particles[i]
      position.set(p?.position.x ?? 0, p?.position.y ?? 0, p?.position.z ?? 0)
      scale.set(p?.scale.x ?? 0, p?.scale.y ?? 0, p?.scale.z ?? 0)
      mesh.setMatrixAt(i, matrix.compose(position, quaternion, scale))
      mesh.setColorAt(i, p ? resources[p.kind] : resources.water)
      opacity.setX(i, p?.opacity ?? 0)
      kind.setX(i, p?.kind === 'sand' ? 1 : 0)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    opacity.needsUpdate = true
    kind.needsUpdate = true
    mesh.visible = craft.particles.length > 0
  }, [craft, resources, limit])
  useEffect(
    () => () => {
      resources.mesh.dispose()
      resources.geometry.dispose()
      resources.material.dispose()
    },
    [resources],
  )
  return <primitive object={resources.mesh} dispose={null} />
}

export function LandingCrafts({ landing }: { landing: LandingWorldState }) {
  const resources = useMemo(() => createLandingModelResources(), [])
  useEffect(() => () => resources.dispose(), [resources])
  return (
    <group name="stage5c-landing-and-deployment">
      <LandingVehicleModels landing={landing} resources={resources} />
      {landing.orderedCraftIds.map((id) => (
        <CushionParticles key={id} craft={landing.crafts[id]} />
      ))}
      <CushionParticles craft={{ id: 'lav-ground-dust', particles: landing.orderedPayloadIds.flatMap((id) => landing.payload[id].dust) }} limit={LAV_DUST_SLOTS * landing.orderedPayloadIds.length} />
    </group>
  )
}
