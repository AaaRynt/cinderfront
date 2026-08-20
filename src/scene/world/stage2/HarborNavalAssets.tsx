import type { Group } from 'three'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { BufferGeometry, DoubleSide, Float32BufferAttribute, MeshBasicMaterial, MeshStandardMaterial } from 'three'

import { deriveMolniyaState, deriveTalwarState, simulationStore } from '@/simulation'

import { MolniyaModel, TalwarModel } from '../../vehicles/index.ts'
import { SegmentCylinder } from './Stage2Structures.tsx'

const MOORING_MATERIAL = new MeshStandardMaterial({ color: '#252725', metalness: 0, roughness: 0.96 })
const MOLNIYA_WAKE_WASH_MATERIAL = new MeshBasicMaterial({
  color: '#8baaaa',
  depthWrite: false,
  opacity: 0,
  side: DoubleSide,
  transparent: true,
})
const MOLNIYA_WAKE_FOAM_MATERIAL = new MeshBasicMaterial({
  color: '#d6e6df',
  depthWrite: false,
  opacity: 0,
  side: DoubleSide,
  transparent: true,
})

function createWakeWedgeGeometry(nearHalfWidth: number, farHalfWidth: number, lengthMeters: number) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([-nearHalfWidth, 0, 0, nearHalfWidth, 0, 0, farHalfWidth, 0, lengthMeters, -nearHalfWidth, 0, 0, farHalfWidth, 0, lengthMeters, -farHalfWidth, 0, lengthMeters], 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

const MOLNIYA_WAKE_WASH_GEOMETRY = createWakeWedgeGeometry(3.3, 15, 98)
const MOLNIYA_WAKE_FOAM_GEOMETRY = createWakeWedgeGeometry(2.5, 7.5, 74)
const INITIAL_TALWAR_STATE = deriveTalwarState(0)
const INITIAL_MOLNIYA_STATE = deriveMolniyaState(0)
const MOLNIYA_STERN_WAKE_OFFSET_METERS = 27
const INITIAL_MOLNIYA_WAKE_POSITION = [INITIAL_MOLNIYA_STATE.pose.position.x + Math.sin(INITIAL_MOLNIYA_STATE.pose.rotation.y) * MOLNIYA_STERN_WAKE_OFFSET_METERS, 0.035, INITIAL_MOLNIYA_STATE.pose.position.z + Math.cos(INITIAL_MOLNIYA_STATE.pose.rotation.y) * MOLNIYA_STERN_WAKE_OFFSET_METERS] as const

export function HarborNavalAssets() {
  const talwarMotion = useRef<Group>(null)
  const molniyaMotion = useRef<Group>(null)
  const molniyaMoorings = useRef<Group>(null)
  const molniyaWake = useRef<Group>(null)

  useFrame(() => {
    const timeSeconds = simulationStore.getState().timeSeconds
    const talwarState = deriveTalwarState(timeSeconds)
    const molniyaState = deriveMolniyaState(timeSeconds)

    if (talwarMotion.current) {
      const bobStrength = 1 - talwarState.floodingProgress * 0.55
      const bob = Math.sin(timeSeconds * 0.38) * 0.11 * bobStrength
      const roll = Math.sin(timeSeconds * 0.23 + 0.7) * 0.0018 * bobStrength
      talwarMotion.current.position.set(talwarState.pose.position.x, talwarState.pose.position.y + bob, talwarState.pose.position.z)
      talwarMotion.current.rotation.set(talwarState.pose.rotation.x, talwarState.pose.rotation.y, talwarState.pose.rotation.z + roll)
    }

    if (molniyaMotion.current) {
      const bob = Math.sin(timeSeconds * 0.55 + 1.4) * 0.08
      const roll = Math.sin(timeSeconds * 0.31 + 0.2) * 0.0025
      molniyaMotion.current.position.set(molniyaState.pose.position.x, molniyaState.pose.position.y + bob, molniyaState.pose.position.z)
      molniyaMotion.current.rotation.set(molniyaState.pose.rotation.x, molniyaState.pose.rotation.y, molniyaState.pose.rotation.z + roll)
    }

    if (molniyaMoorings.current) {
      molniyaMoorings.current.visible = !molniyaState.mobile
    }

    if (molniyaWake.current) {
      const wakeStrength = molniyaState.wakeStrength
      const wakePulse = 0.92 + Math.sin(timeSeconds * 2.4) * 0.08
      const yaw = molniyaState.pose.rotation.y
      molniyaWake.current.visible = wakeStrength > 0.01
      molniyaWake.current.position.set(molniyaState.pose.position.x + Math.sin(yaw) * MOLNIYA_STERN_WAKE_OFFSET_METERS, 0.035, molniyaState.pose.position.z + Math.cos(yaw) * MOLNIYA_STERN_WAKE_OFFSET_METERS)
      molniyaWake.current.rotation.set(0, yaw, 0)
      molniyaWake.current.scale.set(0.72 + wakeStrength * 0.28, 1, 0.5 + wakeStrength * 0.5)
      MOLNIYA_WAKE_WASH_MATERIAL.opacity = wakeStrength * 0.075 * wakePulse
      MOLNIYA_WAKE_FOAM_MATERIAL.opacity = wakeStrength * 0.19 * wakePulse
    }
  })

  return (
    <group name="stage2-moored-harbor-vessels">
      <group ref={talwarMotion} name="defender-talwar-01" position={[INITIAL_TALWAR_STATE.pose.position.x, INITIAL_TALWAR_STATE.pose.position.y, INITIAL_TALWAR_STATE.pose.position.z]} rotation={[INITIAL_TALWAR_STATE.pose.rotation.x, INITIAL_TALWAR_STATE.pose.rotation.y, INITIAL_TALWAR_STATE.pose.rotation.z]}>
        <TalwarModel />
      </group>
      <group ref={molniyaMotion} name="defender-molniya-01" position={[INITIAL_MOLNIYA_STATE.pose.position.x, INITIAL_MOLNIYA_STATE.pose.position.y, INITIAL_MOLNIYA_STATE.pose.position.z]} rotation={[INITIAL_MOLNIYA_STATE.pose.rotation.x, INITIAL_MOLNIYA_STATE.pose.rotation.y, INITIAL_MOLNIYA_STATE.pose.rotation.z]}>
        <MolniyaModel />
      </group>

      <group ref={molniyaWake} name="molniya-procedural-wake" position={INITIAL_MOLNIYA_WAKE_POSITION} rotation={[0, INITIAL_MOLNIYA_STATE.pose.rotation.y, 0]} visible={false}>
        <mesh dispose={null} geometry={MOLNIYA_WAKE_WASH_GEOMETRY} material={MOLNIYA_WAKE_WASH_MATERIAL} renderOrder={2} />
        <mesh dispose={null} geometry={MOLNIYA_WAKE_FOAM_GEOMETRY} material={MOLNIYA_WAKE_FOAM_MATERIAL} position={[0, 0.018, 0]} renderOrder={3} />
      </group>

      <group name="talwar-mooring-lines">
        <SegmentCylinder end={[-3820, 2.4, 3910]} material={MOORING_MATERIAL} radius={0.3} start={[-3812, 3.2, 3865]} />
        <SegmentCylinder end={[-3690, 2.4, 3935]} material={MOORING_MATERIAL} radius={0.3} start={[-3715, 3.2, 3842]} />
      </group>
      <group ref={molniyaMoorings} name="molniya-mooring-lines">
        <SegmentCylinder end={[-4020, 2.2, 3385]} material={MOORING_MATERIAL} radius={0.22} start={[-4040, 2.7, 3282]} />
        <SegmentCylinder end={[-4070, 2.2, 3220]} material={MOORING_MATERIAL} radius={0.22} start={[-4075, 2.7, 3252]} />
      </group>
    </group>
  )
}
