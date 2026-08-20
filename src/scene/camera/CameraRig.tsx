import type { ComponentRef } from 'react'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'

import type { Vec3 } from '@/scene/effects/BattleEffects'

import type { CameraPreset } from './cameraStore'

import { useCameraStore } from './cameraStore'

interface CameraRigProps {
  f35Position: Vec3
  f35SecondaryPosition: Vec3
  molniyaPosition: Vec3
}

const CAMERA_PRESETS = {
  overview: {
    position: [700, 5_000, -7_800] as Vec3,
    target: [500, 80, 650] as Vec3,
  },
  wasp: {
    position: [-4_550, 145, -3_030] as Vec3,
    target: [-4_800, 18, -2_700] as Vec3,
  },
  harbor: {
    position: [-4_780, 125, 2_920] as Vec3,
    target: [-3_760, 10, 3_580] as Vec3,
  },
  talwar: {
    position: [-4_020, 66, 3_670] as Vec3,
    target: [-3_766, 8, 3_847] as Vec3,
  },
  industrial: {
    position: [260, 365, 760] as Vec3,
    target: [240, 34, 2_120] as Vec3,
  },
  'fuel-storage': {
    position: [-1_250, 135, 1_350] as Vec3,
    target: [-545, 38, 2_050] as Vec3,
  },
  ammunition: {
    position: [950, 145, 1_350] as Vec3,
    target: [1_800, 42, 2_080] as Vec3,
  },
  'radar-hill': {
    position: [2_470, 335, 2_520] as Vec3,
    target: [3_820, 166, 3_830] as Vec3,
  },
  'search-radar': {
    position: [3_440, 270, 3_980] as Vec3,
    target: [3_550, 212, 4_150] as Vec3,
  },
  corridor: {
    position: [2_520, 255, -980] as Vec3,
    target: [3_300, 28, -250] as Vec3,
  },
  beachhead: {
    position: [4_160, 300, -1_950] as Vec3,
    target: [4_920, 9, -3_020] as Vec3,
  },
  'beach-offshore': {
    position: [4_900, 82, -4_020] as Vec3,
    target: [4_900, 10, -2_750] as Vec3,
  },
} as const

function isFollowPreset(preset: CameraPreset): preset is 'f35-01' | 'f35-02' | 'molniya' {
  return preset === 'f35-01' || preset === 'f35-02' || preset === 'molniya'
}

function setVector(target: Vector3, source: Vec3) {
  target.set(source[0], source[1], source[2])
}

function useStableVector3() {
  const vector = useRef<Vector3 | null>(null)
  if (vector.current === null) vector.current = new Vector3()
  return vector.current
}

export function CameraRig({ f35Position, f35SecondaryPosition, molniyaPosition }: CameraRigProps) {
  const camera = useThree((state) => state.camera)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const preset = useCameraStore((state) => state.preset)
  const requestId = useCameraStore((state) => state.requestId)
  const f35PositionRef = useRef(f35Position)
  const f35SecondaryPositionRef = useRef(f35SecondaryPosition)
  const molniyaPositionRef = useRef(molniyaPosition)
  const lastFollowPosition = useStableVector3()
  const followPositionScratch = useStableVector3()
  const followDeltaScratch = useStableVector3()
  f35PositionRef.current = f35Position
  f35SecondaryPositionRef.current = f35SecondaryPosition
  molniyaPositionRef.current = molniyaPosition

  useEffect(() => {
    const orbitControls = controls.current
    if (!orbitControls) return

    if (isFollowPreset(preset)) {
      const targetPosition = preset === 'f35-01' ? f35PositionRef.current : preset === 'f35-02' ? f35SecondaryPositionRef.current : molniyaPositionRef.current
      const target = followPositionScratch.set(...targetPosition)
      const distance = preset === 'molniya' ? 105 : 58
      camera.position.set(target.x + distance, target.y + (preset === 'molniya' ? 38 : 28), target.z + distance * 1.4)
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
    if (!isFollowPreset(preset) || !controls.current) return
    const targetPosition = preset === 'f35-01' ? f35Position : preset === 'f35-02' ? f35SecondaryPosition : molniyaPosition
    const current = followPositionScratch.set(...targetPosition)
    const delta = followDeltaScratch.copy(current).sub(lastFollowPosition)
    camera.position.add(delta)
    controls.current.target.add(delta)
    lastFollowPosition.copy(current)
  }, -2)

  return <OrbitControls ref={controls} dampingFactor={0.075} enableDamping enablePan enableRotate enableZoom keyPanSpeed={18} makeDefault maxDistance={18_000} maxPolarAngle={Math.PI * 0.485} minDistance={6} minPolarAngle={0.04} panSpeed={1.1} rotateSpeed={0.55} screenSpacePanning zoomSpeed={0.85} />
}
