import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { DirectionalLight, Vector3 } from 'three'

import { shadowCoverage } from './shadowCoverage'
const SUN_OFFSET = new Vector3(-6800, 3900, -5900)

/** One existing 1024 map, focused on the observation rather than 180 km².
 * No actor is culled from the main view; only shadow submissions are regional. */
export function FocusedSun() {
  const light = useRef<DirectionalLight>(null)
  const center = useRef(new Vector3())
  useFrame(({ camera, controls }) => {
    const sun = light.current
    if (!sun) return
    const orbit = controls as unknown as { target?: Vector3 } | null
    const focus = orbit?.target ?? center.current.set(0, 0, 0)
    const span = shadowCoverage(camera.position.distanceTo(focus))
    // Stable world texels prevent subpixel shadow crawling while orbiting.
    const texel = (span * 2) / 1024
    center.current.set(Math.round(focus.x / texel) * texel, focus.y, Math.round(focus.z / texel) * texel)
    sun.target.position.copy(center.current)
    sun.target.updateMatrixWorld()
    sun.position.copy(center.current).add(SUN_OFFSET)
    const c = sun.shadow.camera
    if (c.left !== -span) {
      c.left = -span
      c.right = span
      c.top = span
      c.bottom = -span
      c.updateProjectionMatrix()
    }
  }, -1)
  return (
    <directionalLight ref={light} castShadow color="#ffd4a3" intensity={2.5} position={[-6800, 3900, -5900]} shadow-bias={-0.00004} shadow-mapSize-height={1024} shadow-mapSize-width={1024} shadow-normalBias={0.22}>
      <orthographicCamera attach="shadow-camera" args={[-2200, 2200, 2200, -2200, 50, 22000]} />
    </directionalLight>
  )
}
