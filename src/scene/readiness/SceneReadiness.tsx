import { useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'

import { simulationStore } from '@/simulation'

import { startPreparation } from './preparation'
import { readinessStore, useReadiness } from './readinessStore'
import { createRendererPreparation } from './rendererPreparation'

/** Preparation never calls a world derivation, clock tick or camera request. */
export function SceneReadiness() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const retryVersion = useReadiness((s) => s.retryVersion)
  const [contextGeneration, setContextGeneration] = useState(0)
  useEffect(() => {
    simulationStore.getState().pause()
    const ownerGeneration = readinessStore.getState().generation + 1
    readinessStore.setState({ generation: ownerGeneration, phase: 'preparing', completed: 0, total: 0, message: 'Preparing graphics · playback will be available shortly' })
    let operation: ReturnType<typeof startPreparation> | undefined
    let abandoned = false
    // A frame lets the existing paused scene and HUD become usable before jobs.
    const frame = requestAnimationFrame(() => {
      if (abandoned) return
      if (gl.getContext().isContextLost()) {
        readinessStore.setState({ phase: 'cancelled', message: 'Graphics context unavailable · retry after recovery' })
        return
      }
      try {
        const resources = createRendererPreparation(gl, scene, camera)
        operation = startPreparation(resources)
      } catch {
        readinessStore.setState({ phase: 'failed', message: 'Scene preparation failed. Retry to play.' })
      }
    })
    const lost = (event: Event) => {
      event.preventDefault()
      simulationStore.getState().pause()
      operation?.cancel('Graphics context lost · waiting for recovery')
      if (!operation) readinessStore.setState({ phase: 'cancelled', message: 'Graphics context lost · waiting for recovery' })
    }
    const restored = () => setContextGeneration((n) => n + 1)
    gl.domElement.addEventListener('webglcontextlost', lost)
    gl.domElement.addEventListener('webglcontextrestored', restored)
    return () => {
      abandoned = true
      cancelAnimationFrame(frame)
      operation?.cancel()
      if (!operation && readinessStore.getState().generation === ownerGeneration && readinessStore.getState().phase === 'preparing') readinessStore.setState({ phase: 'cancelled', message: 'Scene preparation cancelled. Retry to play.' })
      gl.domElement.removeEventListener('webglcontextlost', lost)
      gl.domElement.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl, scene, camera, retryVersion, contextGeneration])
  return null
}
