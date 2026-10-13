import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { MeshStandardMaterial } from 'three'

import { simulationStore } from '@/simulation/store'

import { createLandingSurfaceHistory } from '../landing/landingReservations'
import { createWearGeometry, type WearKind } from './surfaceHistory'

const WEAR_MATERIALS: Record<WearKind, readonly [color: string, opacity: number]> = {
  repair: ['#353d3d', 0.65],
  gravel: ['#a09579', 0.35],
  runoff: ['#42483d', 0.38],
  tire: ['#2f3430', 0.28],
  salt: ['#bdc1ab', 0.38],
}
export function SurfaceHistory() {
  const timeRef = useRef<{ value: number } | null>(null)
  const resources = useMemo(() => {
    const patches = createLandingSurfaceHistory()
    const time = { value: simulationStore.getState().timeSeconds }
    const pools = (Object.keys(WEAR_MATERIALS) as WearKind[]).map((kind) => {
      const [color, opacity] = WEAR_MATERIALS[kind]
      const material = new MeshStandardMaterial({ color, opacity, transparent: true, depthWrite: false, roughness: 0.98, polygonOffset: true, polygonOffsetFactor: -1 })
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uWearTime = time
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vWearUv; attribute float wearHideAt; varying float vWearHideAt;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWearUv = uv; vWearHideAt = wearHideAt;')
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vWearUv; uniform float uWearTime; varying float vWearHideAt;').replace(
          '#include <alphamap_fragment>',
          `#include <alphamap_fragment>
          vec2 edge = min(vWearUv, 1.0 - vWearUv);
          diffuseColor.a *= smoothstep(0.0, 0.14, min(edge.x, edge.y));
          diffuseColor.a *= (0.76 + 0.24 * sin(vWearUv.y * 24.0 + sin(vWearUv.x * 31.0))) * (1.0 - step(vWearHideAt, uWearTime));`,
        )
      }
      material.customProgramCacheKey = () => 'stage4c-feathered-wear-v1'
      return { kind, material, geometry: createWearGeometry(patches.filter((p) => p.kind === kind)) }
    })
    return { pools, time }
  }, [])
  useLayoutEffect(() => {
    timeRef.current = resources.time
  }, [resources])
  useFrame(() => {
    if (timeRef.current) timeRef.current.value = simulationStore.getState().timeSeconds
  })
  useEffect(
    () => () =>
      resources.pools.forEach((r) => {
        r.material.dispose()
        r.geometry.dispose()
      }),
    [resources],
  )
  return (
    <group name="stage4c-surface-history">
      {resources.pools.map((r) => (
        <mesh key={r.kind} geometry={r.geometry} material={r.material} name={`4c-${r.kind}`} dispose={null} receiveShadow renderOrder={1} />
      ))}
    </group>
  )
}
