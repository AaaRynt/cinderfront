import type { ComponentRef } from 'react'

import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'

import type { Vec3 } from '@/scene/effects/BattleEffects'

import { deriveSimulationWorldState, simulationStore } from '@/simulation'

import type { CameraPreset } from './cameraStore'

import { useCameraStore } from './cameraStore'

interface CameraRigProps {
  btrPosition: Vec3
  f35Position: Vec3
  f35SecondaryPosition: Vec3
  molniyaPosition: Vec3
  su30Position: Vec3
  su30FramingScale: number
  su30YawRadians: number
  t72HullYawRadians: number
  t72Position: Vec3
  supportPosition: Vec3
  supportYawRadians: number
  supportFramingScale: number
}

type FollowPreset = 'btr' | 'f35-01' | 'f35-02' | 'molniya' | 'su30' | 't72' | 'support-convoy'

const CAMERA_PRESETS = {
  overview: {
    position: [900, 3_300, -6_900] as Vec3,
    target: [-150, 105, 850] as Vec3,
  },
  wasp: {
    position: [-4_540, 130, -3_020] as Vec3,
    target: [-4_800, 18, -2_700] as Vec3,
  },
  harbor: {
    position: [-4_860, 105, 2_850] as Vec3,
    target: [-3_720, 24, 3_610] as Vec3,
  },
  talwar: {
    position: [-4_050, 58, 3_620] as Vec3,
    target: [-3_766, 10, 3_847] as Vec3,
  },
  industrial: {
    position: [620, 210, 650] as Vec3,
    target: [120, 58, 2_160] as Vec3,
  },
  'fuel-storage': {
    position: [-1_750, 120, 1_300] as Vec3,
    target: [-900, 58, 2_300] as Vec3,
  },
  ammunition: {
    position: [960, 118, 1_360] as Vec3,
    target: [1_810, 54, 2_120] as Vec3,
  },
  'radar-hill': {
    position: [2_280, 315, 2_300] as Vec3,
    target: [3_830, 198, 3_850] as Vec3,
  },
  'search-radar': {
    position: [3_370, 260, 3_900] as Vec3,
    target: [3_550, 216, 4_150] as Vec3,
  },
  corridor: {
    position: [1_850, 210, 520] as Vec3,
    target: [1_050, 48, 1_430] as Vec3,
  },
  beachhead: {
    position: [4_050, 175, -1_950] as Vec3,
    target: [4_930, 18, -2_980] as Vec3,
  },
  'beach-offshore': {
    position: [4_820, 74, -4_050] as Vec3,
    target: [4_900, 14, -2_740] as Vec3,
  },
} as const

const WORLD_UP = new Vector3(0, 1, 0)

function isFollowPreset(preset: CameraPreset): preset is FollowPreset {
  return preset === 'support-convoy' || preset === 'btr' || preset === 'f35-01' || preset === 'f35-02' || preset === 'molniya' || preset === 'su30' || preset === 't72'
}

function setVector(target: Vector3, source: Vec3) {
  target.set(source[0], source[1], source[2])
}

function useStableVector3() {
  const vector = useRef<Vector3 | null>(null)
  if (vector.current === null) vector.current = new Vector3()
  return vector.current
}

function updateObservedDirection(current: Vector3, previous: Vector3, direction: Vector3, scratch: Vector3) {
  scratch.copy(current).sub(previous)
  const distance = scratch.length()
  if (distance > 0.05 && distance < 180)
    direction
      .copy(scratch)
      .setY(scratch.y * 0.2)
      .normalize()
  previous.copy(current)
}

function directionFromYaw(direction: Vector3, yawRadians: number) {
  return direction.set(-Math.sin(yawRadians), 0, -Math.cos(yawRadians)).normalize()
}

function deterministicFollowDirection(preset: FollowPreset, direction: Vector3, t72HullYawRadians?: number) {
  if (preset === 't72' && t72HullYawRadians !== undefined) return directionFromYaw(direction, t72HullYawRadians)
  const world = deriveSimulationWorldState(simulationStore.getState().timeSeconds)
  const yaw =
    preset === 'support-convoy'
      ? world.stage4b2c.camera.anchor.rotation.y
      : preset === 't72'
        ? world.stage4b.t72Group.vehicles.defender_t72_02.pose.rotation.y
        : preset === 'su30'
          ? world.stage4b2b.anchor.rotation.y
          : preset === 'btr'
            ? world.stage4b.btrGroup.vehicles.defender_btr_03.pose.rotation.y
            : preset === 'f35-01'
              ? world.aircraft.attacker_f35_01.pose.rotation.y
              : preset === 'f35-02'
                ? world.aircraft.attacker_f35_02.pose.rotation.y
                : world.stage3.molniya.pose.rotation.y
  return directionFromYaw(direction, yaw)
}

function yawBetweenDirections(start: Vector3, end: Vector3): number {
  const startYaw = Math.atan2(-start.x, -start.z)
  const endYaw = Math.atan2(-end.x, -end.z)
  return Math.atan2(Math.sin(endYaw - startYaw), Math.cos(endYaw - startYaw))
}

export function CameraRig({ btrPosition, f35Position, f35SecondaryPosition, molniyaPosition, su30Position, su30FramingScale, su30YawRadians, t72HullYawRadians, t72Position, supportPosition, supportYawRadians, supportFramingScale }: CameraRigProps) {
  const camera = useThree((state) => state.camera)
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const preset = useCameraStore((state) => state.preset)
  const requestId = useCameraStore((state) => state.requestId)
  const btrPositionRef = useRef(btrPosition)
  const f35PositionRef = useRef(f35Position)
  const f35SecondaryPositionRef = useRef(f35SecondaryPosition)
  const molniyaPositionRef = useRef(molniyaPosition)
  const su30PositionRef = useRef(su30Position)
  const su30FramingScaleRef = useRef(su30FramingScale)
  const lastSu30FramingScale = useRef(su30FramingScale)
  const t72PositionRef = useRef(t72Position)
  const supportPositionRef = useRef(supportPosition)
  const supportFramingScaleRef = useRef(supportFramingScale)
  const lastSupportFramingScale = useRef(supportFramingScale)
  const lastFollowPosition = useStableVector3()
  const followPositionScratch = useStableVector3()
  const followDeltaScratch = useStableVector3()
  const followDirectionScratch = useStableVector3()
  const followRightScratch = useStableVector3()
  const observedPrimaryPosition = useStableVector3()
  const observedSecondaryPosition = useStableVector3()
  const observedMolniyaPosition = useStableVector3()
  const observedBtrPosition = useStableVector3()
  const primaryDirection = useStableVector3()
  const secondaryDirection = useStableVector3()
  const molniyaDirection = useStableVector3()
  const btrDirection = useStableVector3()
  const t72Direction = useStableVector3()
  const su30Direction = useStableVector3()
  const supportDirection = useStableVector3()
  const lastFollowDirection = useStableVector3()
  const observationScratch = useStableVector3()
  const followCameraOffset = useStableVector3()
  const followTargetOffset = useStableVector3()
  const observationsInitialized = useRef(false)
  const lastSimulationTime = useRef(simulationStore.getState().timeSeconds)
  btrPositionRef.current = btrPosition
  f35PositionRef.current = f35Position
  f35SecondaryPositionRef.current = f35SecondaryPosition
  molniyaPositionRef.current = molniyaPosition
  su30PositionRef.current = su30Position
  su30FramingScaleRef.current = su30FramingScale
  t72PositionRef.current = t72Position
  useEffect(() => {
    supportPositionRef.current = supportPosition
    supportFramingScaleRef.current = supportFramingScale
  }, [supportPosition, supportFramingScale])

  if (!observationsInitialized.current) {
    observedPrimaryPosition.set(...f35Position)
    observedSecondaryPosition.set(...f35SecondaryPosition)
    observedMolniyaPosition.set(...molniyaPosition)
    observedBtrPosition.set(...btrPosition)
    primaryDirection.set(-0.55, 0, -0.84)
    secondaryDirection.set(-0.55, 0, -0.84)
    molniyaDirection.set(-0.85, 0, -0.52)
    deterministicFollowDirection('btr', btrDirection)
    deterministicFollowDirection('t72', t72Direction, t72HullYawRadians)
    directionFromYaw(su30Direction, su30YawRadians)
    directionFromYaw(supportDirection, supportYawRadians)
    observationsInitialized.current = true
  }

  useEffect(() => {
    const orbitControls = controls.current
    if (!orbitControls) return

    if (isFollowPreset(preset)) {
      const targetPosition =
        preset === 'support-convoy'
          ? supportPositionRef.current
          : preset === 'su30'
            ? su30PositionRef.current
            : preset === 'btr'
              ? btrPositionRef.current
              : preset === 't72'
                ? t72PositionRef.current
                : preset === 'f35-01'
                  ? f35PositionRef.current
                  : preset === 'f35-02'
                    ? f35SecondaryPositionRef.current
                    : molniyaPositionRef.current
      const anchor = followPositionScratch.set(...targetPosition)
      const direction = deterministicFollowDirection(preset, preset === 'support-convoy' ? supportDirection : preset === 'su30' ? su30Direction : preset === 'btr' ? btrDirection : preset === 't72' ? t72Direction : preset === 'f35-01' ? primaryDirection : preset === 'f35-02' ? secondaryDirection : molniyaDirection)
      const followDistance = preset === 'support-convoy' ? 155 : preset === 'su30' ? 350 : preset === 'molniya' ? 142 : preset === 't72' ? 105 : preset === 'btr' ? 58 : 74
      const sideDistance = preset === 'support-convoy' ? 210 : preset === 'su30' ? 115 : preset === 'molniya' ? 62 : preset === 't72' ? 46 : preset === 'btr' ? 25 : 31
      const height = preset === 'support-convoy' ? 135 : preset === 'su30' ? 135 : preset === 'molniya' ? 46 : preset === 't72' ? 36 : preset === 'btr' ? 17 : 29
      const lookAhead = preset === 'support-convoy' ? 0 : preset === 'su30' ? 0 : preset === 'molniya' ? 24 : preset === 't72' ? 2 : preset === 'btr' ? 2 : 18
      const right = followRightScratch.set(direction.z, 0, -direction.x).normalize()
      const framingScale = preset === 'support-convoy' ? supportFramingScaleRef.current : preset === 'su30' ? su30FramingScaleRef.current : 1

      camera.position
        .copy(anchor)
        .addScaledVector(direction, -followDistance * framingScale)
        .addScaledVector(right, sideDistance * framingScale)
      camera.position.y += height * framingScale
      orbitControls.target.copy(anchor).addScaledVector(direction, lookAhead)
      lastFollowPosition.copy(anchor)
      lastFollowDirection.copy(direction)
      lastSu30FramingScale.current = su30FramingScaleRef.current
      lastSupportFramingScale.current = supportFramingScaleRef.current
    } else {
      const selected = CAMERA_PRESETS[preset]
      setVector(camera.position, selected.position)
      setVector(orbitControls.target, selected.target)
    }
    camera.updateProjectionMatrix()
    orbitControls.update()
  }, [btrDirection, camera, followPositionScratch, followRightScratch, lastFollowDirection, lastFollowPosition, molniyaDirection, preset, primaryDirection, requestId, secondaryDirection, su30Direction, supportDirection, t72Direction])

  useFrame(() => {
    const simulationTime = simulationStore.getState().timeSeconds
    const simulationTimeDelta = simulationTime - lastSimulationTime.current
    const timelineDiscontinuity = simulationTimeDelta < -0.000_1 || simulationTimeDelta > 0.25
    lastSimulationTime.current = simulationTime
    const primary = followDirectionScratch.set(...f35Position)
    updateObservedDirection(primary, observedPrimaryPosition, primaryDirection, observationScratch)
    const secondary = followDirectionScratch.set(...f35SecondaryPosition)
    updateObservedDirection(secondary, observedSecondaryPosition, secondaryDirection, observationScratch)
    const molniya = followDirectionScratch.set(...molniyaPosition)
    updateObservedDirection(molniya, observedMolniyaPosition, molniyaDirection, observationScratch)
    const btr = followDirectionScratch.set(...btrPosition)
    updateObservedDirection(btr, observedBtrPosition, btrDirection, observationScratch)
    directionFromYaw(t72Direction, t72HullYawRadians)
    directionFromYaw(su30Direction, su30YawRadians)
    directionFromYaw(supportDirection, supportYawRadians)

    if (!isFollowPreset(preset) || !controls.current) return
    const targetPosition = preset === 'support-convoy' ? supportPosition : preset === 'su30' ? su30Position : preset === 'btr' ? btrPosition : preset === 't72' ? t72Position : preset === 'f35-01' ? f35Position : preset === 'f35-02' ? f35SecondaryPosition : molniyaPosition
    const current = followPositionScratch.set(...targetPosition)
    const delta = followDeltaScratch.copy(current).sub(lastFollowPosition)
    const direction = preset === 'support-convoy' ? supportDirection : preset === 'su30' ? su30Direction : preset === 'btr' ? btrDirection : preset === 't72' ? t72Direction : preset === 'f35-01' ? primaryDirection : preset === 'f35-02' ? secondaryDirection : molniyaDirection
    if (timelineDiscontinuity || delta.length() >= 180) deterministicFollowDirection(preset, direction, t72HullYawRadians)

    camera.position.add(delta)
    controls.current.target.add(delta)
    if (preset === 'su30') {
      // Scale the user's existing orbit/pan offsets by the absolute formation
      // spread, retaining manual control without a target cut during cover.
      const ratio = su30FramingScale / lastSu30FramingScale.current
      followCameraOffset.copy(camera.position).sub(current).multiplyScalar(ratio)
      followTargetOffset.copy(controls.current.target).sub(current).multiplyScalar(ratio)
      camera.position.copy(current).add(followCameraOffset)
      controls.current.target.copy(current).add(followTargetOffset)
      lastSu30FramingScale.current = su30FramingScale
    }
    if (preset === 'support-convoy') {
      const ratio = supportFramingScale / lastSupportFramingScale.current
      followCameraOffset.copy(camera.position).sub(current).multiplyScalar(ratio)
      followTargetOffset.copy(controls.current.target).sub(current).multiplyScalar(ratio)
      camera.position.copy(current).add(followCameraOffset)
      controls.current.target.copy(current).add(followTargetOffset)
      lastSupportFramingScale.current = supportFramingScale
    }
    const yawDelta = yawBetweenDirections(lastFollowDirection, direction)
    if (Math.abs(yawDelta) > 0.000_01) {
      followCameraOffset.copy(camera.position).sub(current).applyAxisAngle(WORLD_UP, yawDelta)
      followTargetOffset.copy(controls.current.target).sub(current).applyAxisAngle(WORLD_UP, yawDelta)
      camera.position.copy(current).add(followCameraOffset)
      controls.current.target.copy(current).add(followTargetOffset)
    }

    lastFollowPosition.copy(current)
    lastFollowDirection.copy(direction)
  }, -2)

  return <OrbitControls ref={controls} dampingFactor={0.075} enableDamping enablePan enableRotate enableZoom keyPanSpeed={18} makeDefault maxDistance={18_000} maxPolarAngle={Math.PI * 0.485} minDistance={6} minPolarAngle={0.04} panSpeed={1.1} rotateSpeed={0.55} screenSpacePanning zoomSpeed={0.85} />
}
