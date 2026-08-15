import type { Group } from 'three'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MeshStandardMaterial } from 'three'

import { simulationStore } from '@/simulation'

import { MolniyaModel, TalwarModel } from '../../vehicles/index.ts'
import { HARBOR_FEATURES } from './stage2Data.ts'
import { SegmentCylinder } from './Stage2Structures.tsx'

const MOORING_MATERIAL = new MeshStandardMaterial({ color: '#252725', metalness: 0, roughness: 0.96 })

function headingToModelYaw(headingDeg: number) {
  return Math.PI + (headingDeg * Math.PI) / 180
}

export function HarborNavalAssets() {
  const talwarMotion = useRef<Group>(null)
  const molniyaMotion = useRef<Group>(null)
  const talwar = HARBOR_FEATURES.talwarBerth
  const molniya = HARBOR_FEATURES.molniyaBerth

  useFrame(() => {
    const timeSeconds = simulationStore.getState().timeSeconds
    if (talwarMotion.current) {
      talwarMotion.current.position.y = 0.22 + Math.sin(timeSeconds * 0.38) * 0.11
      talwarMotion.current.rotation.z = Math.sin(timeSeconds * 0.23 + 0.7) * 0.0018
    }
    if (molniyaMotion.current) {
      molniyaMotion.current.position.y = 0.2 + Math.sin(timeSeconds * 0.55 + 1.4) * 0.08
      molniyaMotion.current.rotation.z = Math.sin(timeSeconds * 0.31 + 0.2) * 0.0025
    }
  })

  return (
    <group name="stage2-moored-harbor-vessels">
      <group ref={talwarMotion} name="defender-talwar-01" position={[talwar.position[0], 0.22, talwar.position[2]]} rotation={[0, headingToModelYaw(talwar.headingDeg), 0]}>
        <TalwarModel />
      </group>
      <group ref={molniyaMotion} name="defender-molniya-01" position={[molniya.position[0], 0.2, molniya.position[2]]} rotation={[0, headingToModelYaw(molniya.headingDeg), 0]}>
        <MolniyaModel />
      </group>

      <group name="talwar-mooring-lines">
        <SegmentCylinder end={[-3820, 2.4, 3910]} material={MOORING_MATERIAL} radius={0.3} start={[-3812, 3.2, 3865]} />
        <SegmentCylinder end={[-3690, 2.4, 3935]} material={MOORING_MATERIAL} radius={0.3} start={[-3715, 3.2, 3842]} />
      </group>
      <group name="molniya-mooring-lines">
        <SegmentCylinder end={[-4020, 2.2, 3385]} material={MOORING_MATERIAL} radius={0.22} start={[-4040, 2.7, 3282]} />
        <SegmentCylinder end={[-4070, 2.2, 3220]} material={MOORING_MATERIAL} radius={0.22} start={[-4075, 2.7, 3252]} />
      </group>
    </group>
  )
}
