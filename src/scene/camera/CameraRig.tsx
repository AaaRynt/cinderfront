import type { ComponentRef } from 'react'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'

import { simulationStore } from '@/simulation'

import { cameraFrame, followYawDelta, viewportFov, type CameraFrame } from './cameraFraming'
import { useCameraStore } from './cameraStore'

const UP = new Vector3(0, 1, 0)
/** Frame-relative deltas preserve manual orbit, zoom and pan through playback and
 * direct seeks. Every heading comes from runtime pose, including reverse/stops. */
export function CameraRig() {
  const get = useThree((state) => state.get)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const preset = useCameraStore((state) => state.preset)
  const requestId = useCameraStore((state) => state.requestId)
  const previous = useRef<CameraFrame | null>(null)
  const lastTime = useRef(0)
  const lastHeight = useRef(0)
  const settle = useRef(0)
  const cameraOffset = useRef(new Vector3())
  const targetOffset = useRef(new Vector3())

  useLayoutEffect(() => {
    const { camera, size } = get()
    const orbit = controls.current
    if (!orbit) return
    const time = simulationStore.getState().timeSeconds
    const frame = cameraFrame(preset, time, size.width / size.height, size.height)
    // A short 4% dolly settles along the final unobstructed sight line. Cross-map
    // switches cut directly to that line, never fly through hills or actors.
    const initial = previous.current === null
    camera.position.copy(frame.position)
    if (!initial) camera.position.sub(frame.target).multiplyScalar(1.04).add(frame.target)
    orbit.target.copy(frame.target)
    if (camera instanceof PerspectiveCamera) {
      camera.fov = frame.fov
      camera.updateProjectionMatrix()
    }
    previous.current = frame
    lastTime.current = time
    lastHeight.current = size.height
    settle.current = initial ? 0 : 0.22
    orbit.update()
  }, [get, preset, requestId])

  useFrame(({ camera, size }, delta) => {
    const orbit = controls.current,
      old = previous.current
    if (!orbit || !old) return
    const time = simulationStore.getState().timeSeconds
    const next = time === lastTime.current && size.height === lastHeight.current && Math.abs(old.fov - viewportFov(size.width / size.height)) < 0.001 ? old : cameraFrame(preset, time, size.width / size.height, size.height)
    const discontinuity = time < lastTime.current || time - lastTime.current > 0.25
    if (next.follows) {
      const yaw = followYawDelta(old.yaw, next.yaw),
        ratio = next.scale / old.scale
      const translation = targetOffset.current.copy(next.anchor).sub(old.anchor)
      camera.position.add(translation)
      orbit.target.add(translation)
      if (Math.abs(yaw) > 1e-12 || Math.abs(ratio - 1) > 1e-12) {
        const offset = cameraOffset.current.copy(camera.position).sub(next.anchor)
        const pan = targetOffset.current.copy(orbit.target).sub(next.anchor)
        offset.applyAxisAngle(UP, yaw).multiplyScalar(ratio)
        pan.applyAxisAngle(UP, yaw).multiplyScalar(ratio)
        camera.position.copy(next.anchor).add(offset)
        orbit.target.copy(next.anchor).add(pan)
      }
    }
    if (discontinuity && settle.current > 0) {
      camera.position.copy(next.position)
      orbit.target.copy(next.target)
      settle.current = 0
    } else if (settle.current > 0) {
      const remaining = Math.max(0, settle.current - Math.min(delta, 0.05))
      const oldScale = 1 + 0.04 * (settle.current / 0.22) ** 2
      const newScale = 1 + 0.04 * (remaining / 0.22) ** 2
      camera.position
        .sub(orbit.target)
        .multiplyScalar(newScale / oldScale)
        .add(orbit.target)
      if (remaining === 0) camera.position.copy(next.position)
      settle.current = remaining
    }
    if (camera instanceof PerspectiveCamera && Math.abs(camera.fov - next.fov) > 0.001) {
      camera.fov = next.fov
      camera.updateProjectionMatrix()
    }
    previous.current = next
    lastTime.current = time
    lastHeight.current = size.height
  }, -2)
  return (
    <OrbitControls
      ref={controls}
      dampingFactor={0.075}
      enableDamping
      enablePan
      enableRotate
      enableZoom
      keyPanSpeed={18}
      makeDefault
      maxDistance={18000}
      maxPolarAngle={Math.PI * 0.485}
      minDistance={6}
      minPolarAngle={0.04}
      onStart={() => {
        settle.current = 0
      }}
      panSpeed={1.1}
      rotateSpeed={0.55}
      screenSpacePanning
      zoomSpeed={0.85}
    />
  )
}
