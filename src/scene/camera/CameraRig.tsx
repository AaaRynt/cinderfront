import type { ComponentRef } from 'react'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'

import type { Vec3 } from '@/scene/effects/BattleEffects'

import { useCameraStore } from './cameraStore'

interface CameraRigProps {
  f35Position: Vec3
}

const CAMERA_PRESETS = {
  overview: {
    position: [900, 6_900, -7_900] as Vec3,
    target: [650, 60, 650] as Vec3,
  },
  wasp: {
    position: [-4_550, 145, -3_030] as Vec3,
    target: [-4_800, 18, -2_700] as Vec3,
  },
  harbor: {
    position: [-4_650, 180, 2_900] as Vec3,
    target: [-3_800, 8, 3_550] as Vec3,
  },
  industrial: {
    position: [550, 780, 500] as Vec3,
    target: [550, 30, 2_100] as Vec3,
  },
  'radar-hill': {
    position: [2_500, 450, 2_600] as Vec3,
    target: [3_800, 160, 3_800] as Vec3,
  },
  'search-radar': {
    position: [3_440, 270, 3_980] as Vec3,
    target: [3_550, 212, 4_150] as Vec3,
  },
  corridor: {
    position: [2_500, 360, -900] as Vec3,
    target: [3_300, 28, -250] as Vec3,
  },
  beachhead: {
    position: [4_200, 480, -1_900] as Vec3,
    target: [4_900, 6, -3_050] as Vec3,
  },
  'beach-offshore': {
    position: [4_900, 100, -4_050] as Vec3,
    target: [4_900, 10, -2_750] as Vec3,
  },
} as const

function setVector(target: Vector3, source: Vec3) {
  target.set(source[0], source[1], source[2])
}

function useStableVector3() {
  const vector = useRef<Vector3 | null>(null)
  if (vector.current === null) vector.current = new Vector3()
  return vector.current
}

export function CameraRig({ f35Position }: CameraRigProps) {
  const camera = useThree((state) => state.camera)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const preset = useCameraStore((state) => state.preset)
  const requestId = useCameraStore((state) => state.requestId)
  const f35PositionRef = useRef(f35Position)
  const lastFollowPosition = useStableVector3()
  const followPositionScratch = useStableVector3()
  const followDeltaScratch = useStableVector3()
  f35PositionRef.current = f35Position

  useEffect(() => {
    const orbitControls = controls.current
    if (!orbitControls) return

    if (preset === 'f35-01') {
      const target = followPositionScratch.set(...f35PositionRef.current)
      camera.position.set(target.x + 58, target.y + 28, target.z + 82)
      orbitControls.target.copy(target)
      lastFollowPosition.copy(target)
    } else {
      const selected = CAMERA_PRESETS[preset]
      setVector(camera.position, selected.position)
      setVector(orbitControls.target, selected.target)
    }
    camera.updateProjectionMatrix()
    orbitControls.update()
  }, [camera, followPositionScratch, lastFollowPosition, preset, requestId])

  useFrame(() => {
    if (preset !== 'f35-01' || !controls.current) return
    const current = followPositionScratch.set(...f35Position)
    const delta = followDeltaScratch.copy(current).sub(lastFollowPosition)
    camera.position.add(delta)
    controls.current.target.add(delta)
    lastFollowPosition.copy(current)
  }, -2)

  return <OrbitControls ref={controls} dampingFactor={0.075} enableDamping enablePan enableRotate enableZoom keyPanSpeed={18} makeDefault maxDistance={18_000} maxPolarAngle={Math.PI * 0.485} minDistance={6} minPolarAngle={0.04} panSpeed={1.1} rotateSpeed={0.55} screenSpacePanning zoomSpeed={0.85} />
}
