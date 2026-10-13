import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, MeshStandardMaterial, ShaderMaterial } from 'three'

import { simulationStore } from '@/simulation/store'

import { createLandingFoamLayout } from '../landing/landingReservations'
import { applyLandingSurface } from '../landing/landingTerrain'
import { createCoastalWaterGeometry, createFoamGeometry, createWetShoreGeometry, FOAM_ALPHA_GLSL, FOAM_SHAPE_GLSL, WATER_NORMAL_GLSL, WETNESS_GLSL } from './coastalWater'

export function CoastalWater() {
  const timeRef = useRef<{ value: number } | null>(null)
  const resources = useMemo(() => {
    const time = { value: simulationStore.getState().timeSeconds }
    const water = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.42, metalness: 0.045, side: DoubleSide })
    water.onBeforeCompile = (shader) => {
      shader.uniforms.uCoastalTime = time
      shader.uniforms.uDeepColor = { value: new Color('#294955') }
      shader.uniforms.uShallowColor = { value: new Color('#52756d') }
      shader.uniforms.uHarborColor = { value: new Color('#3b5860') }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec3 coastalRegion;\nattribute float coastalAttenuation;\nvarying vec3 vCoastalRegion;\nvarying vec2 vCoastalXZ;\nvarying float vCoastalAttenuation;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCoastalXZ = position.xz; vCoastalRegion = coastalRegion; vCoastalAttenuation = coastalAttenuation;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uCoastalTime;\nuniform vec3 uDeepColor;\nuniform vec3 uShallowColor;\nuniform vec3 uHarborColor;\nvarying vec3 vCoastalRegion;\nvarying vec2 vCoastalXZ;\nvarying float vCoastalAttenuation;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(mix(uDeepColor, uHarborColor, vCoastalRegion.x), uShallowColor, vCoastalRegion.y * 0.75 + vCoastalRegion.z * 0.2);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = 0.42 + vCoastalRegion.x * 0.12 + vCoastalRegion.z * 0.08;')
        .replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>
          vec2 slope = vec2(0.0);
          ${WATER_NORMAL_GLSL}
          slope *= vCoastalAttenuation;
          normal = normalize(mat3(viewMatrix) * vec3(-slope.x, 1.0, -slope.y));`,
        )
    }
    water.customProgramCacheKey = () => 'stage4c-coastal-normal-v1'
    const foam = new ShaderMaterial({
      uniforms: { uCoastalTime: time },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      vertexShader: 'attribute float foamPhase; varying vec2 vFoamUv; varying float vFoamPhase; void main(){ vFoamUv=uv; vFoamPhase=foamPhase; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float uCoastalTime; varying vec2 vFoamUv; varying float vFoamPhase; void main(){${FOAM_SHAPE_GLSL}\ngl_FragColor=vec4(0.57,0.65,0.61,${FOAM_ALPHA_GLSL});\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,
    })
    const wet = new MeshStandardMaterial({ color: '#5e6857', roughness: 0.7, opacity: 0.5, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })
    wet.onBeforeCompile = (shader) => {
      shader.uniforms.uCoastalTime = time
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float wetEdge; varying float vWetEdge; varying vec2 vCoastalXZ;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWetEdge=wetEdge; vCoastalXZ=position.xz;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uCoastalTime; varying float vWetEdge; varying vec2 vCoastalXZ;')
        .replace('#include <alphamap_fragment>', `#include <alphamap_fragment>\ndiffuseColor.a *= (1.0-smoothstep(0.15,1.0,vWetEdge)) * (${WETNESS_GLSL});`)
    }
    wet.customProgramCacheKey = () => 'stage4c-wet-shore-v1'
    return { time, water, foam, wet, oceanGeometry: createCoastalWaterGeometry(), foamGeometry: createFoamGeometry(createLandingFoamLayout()), wetGeometry: applyLandingSurface(createWetShoreGeometry(), 0.018) }
  }, [])
  useLayoutEffect(() => {
    timeRef.current = resources.time
  }, [resources])
  useFrame(() => {
    if (timeRef.current) timeRef.current.value = simulationStore.getState().timeSeconds
  })
  useEffect(
    () => () => {
      resources.oceanGeometry.dispose()
      resources.foamGeometry.dispose()
      resources.wetGeometry.dispose()
      resources.water.dispose()
      resources.foam.dispose()
      resources.wet.dispose()
    },
    [resources],
  )
  return (
    <group name="stage4c-coastal-water">
      <mesh geometry={resources.oceanGeometry} material={resources.water} name="4c-continuous-sea" dispose={null} receiveShadow />
      <mesh geometry={resources.foamGeometry} material={resources.foam} name="4c-broken-shore-foam" dispose={null} renderOrder={1} />
      <mesh geometry={resources.wetGeometry} material={resources.wet} name="4c-wet-dry-shore" dispose={null} receiveShadow renderOrder={1} />
    </group>
  )
}
