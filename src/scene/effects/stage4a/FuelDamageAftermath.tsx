import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import type { Stage3Vec3 } from '../stage3/types.ts'

import { FUEL_TANKS } from '../../world/stage2/stage2Data.ts'
import { STAGE4A_FUEL_ESCALATION_SCHEDULE } from './fuelDisasterMath.ts'
import { STAGE4A_FUEL_GEOMETRIES, STAGE4A_FUEL_MATERIALS } from './sharedResources.ts'

interface FuelDamageAftermathProps {
  readonly surfaceHeightAt: (x: number, z: number) => number
  readonly timeSeconds: number
}

interface ScorchDescriptor {
  readonly eventTimeSeconds: number
  readonly position: Stage3Vec3
  readonly rotationY: number
  readonly scale: readonly [x: number, z: number]
}

const SCORCH_PATCH_LAYOUT = [
  { offsetX: 0, offsetZ: 0, scaleX: 0.5, scaleZ: 0.46 },
  { offsetX: 0.42, offsetZ: 0.04, scaleX: 0.42, scaleZ: 0.32 },
  { offsetX: -0.42, offsetZ: -0.04, scaleX: 0.42, scaleZ: 0.32 },
  { offsetX: 0.04, offsetZ: 0.4, scaleX: 0.34, scaleZ: 0.38 },
  { offsetX: -0.04, offsetZ: -0.4, scaleX: 0.34, scaleZ: 0.38 },
  { offsetX: 0.28, offsetZ: 0.28, scaleX: 0.3, scaleZ: 0.28 },
  { offsetX: -0.28, offsetZ: -0.28, scaleX: 0.3, scaleZ: 0.28 },
] as const

const DAMAGED_TANK_BEAM_OFFSETS = [-0.42, 0.03, 0.48] as const
const RUPTURED_PIPE_LANES = [-1, 0, 1] as const
const TRANSFER_RACK_SPANS = [-58, 0, 61] as const
const BUND_BREACH_OFFSETS = [-34, 0, 38] as const

interface DamagedTankProps {
  readonly collapseAtSeconds: number
  readonly eventTimeSeconds: number
  readonly id: string
  readonly surfaceHeightAt: FuelDamageAftermathProps['surfaceHeightAt']
  readonly timeSeconds: number
  readonly yawRadians: number
}

const TANK_DAMAGE = [
  { collapseAtSeconds: 92, eventTimeSeconds: 86, id: 'fuel_tank_05', yawRadians: 0.38 },
  { collapseAtSeconds: 97.1, eventTimeSeconds: 95.2, id: 'fuel_tank_04', yawRadians: 2.12 },
  { collapseAtSeconds: 103.2, eventTimeSeconds: 101.4, id: 'fuel_tank_06', yawRadians: -1.08 },
  { collapseAtSeconds: 112, eventTimeSeconds: 109.8, id: 'fuel_tank_02', yawRadians: 1.46 },
] as const

function damageRadius(kind: (typeof STAGE4A_FUEL_ESCALATION_SCHEDULE)[number]['kind'], burstRadiusM: number) {
  if (kind === 'hero-cascade') return [135, 108] as const
  if (kind === 'bund-pool-ignition') return [82, 52] as const
  if (kind === 'pipe-rupture') return [Math.max(28, burstRadiusM * 1.7), Math.max(14, burstRadiusM * 0.72)] as const
  if (kind === 'manifold-burst') return [68, 46] as const
  return [Math.max(52, burstRadiusM * 1.65), Math.max(42, burstRadiusM * 1.25)] as const
}

function ScorchedFuelFootprint({ surfaceHeightAt, timeSeconds }: FuelDamageAftermathProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const scratchObject = useMemo(() => new Object3D(), [])
  const descriptors = useMemo<readonly ScorchDescriptor[]>(
    () =>
      STAGE4A_FUEL_ESCALATION_SCHEDULE.flatMap((event, eventIndex) => {
        const [x, z] = event.positionXZ
        const [radiusX, radiusZ] = damageRadius(event.kind, event.burstRadiusM)
        const rotationY = eventIndex * 1.73 + 0.31
        const cosine = Math.cos(rotationY)
        const sine = Math.sin(rotationY)

        return SCORCH_PATCH_LAYOUT.map((patch, patchIndex): ScorchDescriptor => {
          const localX = patch.offsetX * radiusX
          const localZ = patch.offsetZ * radiusZ
          const patchX = x + localX * cosine - localZ * sine
          const patchZ = z + localX * sine + localZ * cosine
          return {
            eventTimeSeconds: event.atSeconds,
            position: [patchX, surfaceHeightAt(patchX, patchZ) + 0.38, patchZ],
            rotationY: rotationY + patchIndex * 0.17,
            scale: [radiusX * patch.scaleX, radiusZ * patch.scaleZ],
          }
        })
      }),
    [surfaceHeightAt],
  )
  const visibleCount = descriptors.reduce((count, descriptor) => count + Number(timeSeconds >= descriptor.eventTimeSeconds), 0)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const object = scratchObject
    for (let index = 0; index < visibleCount; index += 1) {
      const descriptor = descriptors[index]!
      object.position.set(...descriptor.position)
      object.rotation.set(-Math.PI / 2, 0, descriptor.rotationY)
      object.scale.set(descriptor.scale[0], descriptor.scale[1], 1)
      object.updateMatrix()
      mesh.setMatrixAt(index, object.matrix)
    }
    mesh.count = visibleCount
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
  }, [descriptors, scratchObject, visibleCount])

  return <instancedMesh ref={meshRef} args={[STAGE4A_FUEL_GEOMETRIES.disc, STAGE4A_FUEL_MATERIALS.scorch, Math.max(1, descriptors.length)]} dispose={null} frustumCulled={false} renderOrder={1} />
}

function DamagedTank({ collapseAtSeconds, eventTimeSeconds, id, surfaceHeightAt, timeSeconds, yawRadians }: DamagedTankProps) {
  const tank = FUEL_TANKS.find((candidate) => candidate.id === id)
  if (!tank || timeSeconds < eventTimeSeconds) return null
  const [x, z] = tank.center
  const baseY = surfaceHeightAt(x, z)
  const collapsed = timeSeconds >= collapseAtSeconds

  return (
    <group name={`stage4a-damaged-${id}`} position={[x, baseY, z]} rotation={[0, yawRadians, 0]}>
      <mesh castShadow dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.tankShellArc} material={STAGE4A_FUEL_MATERIALS.charredMetal} position={[0, tank.heightM * 0.5, 0]} receiveShadow scale={[tank.radiusM + 0.72, tank.heightM + 0.5, tank.radiusM + 0.72]} />
      <mesh
        castShadow
        dispose={null}
        geometry={STAGE4A_FUEL_GEOMETRIES.tankRoof}
        material={STAGE4A_FUEL_MATERIALS.charredMetal}
        position={[tank.radiusM * 0.2, tank.heightM + 1.05, -tank.radiusM * 0.08]}
        rotation={[collapsed ? 0.5 : 0.16, 0.24, collapsed ? -0.3 : -0.08]}
        scale={[tank.radiusM * 0.56, 1.2, tank.radiusM * 0.56]}
      />
      {DAMAGED_TANK_BEAM_OFFSETS.map((offset, index) => (
        <mesh
          key={offset}
          castShadow
          dispose={null}
          geometry={STAGE4A_FUEL_GEOMETRIES.beam}
          material={STAGE4A_FUEL_MATERIALS.charredMetal}
          position={[tank.radiusM * (0.66 + index * 0.04), tank.heightM * (0.28 + index * 0.2), tank.radiusM * offset]}
          rotation={[0.18 * index, 0.2, collapsed ? 0.48 + index * 0.17 : 0.16]}
          scale={[8 + index * 2, 2.4, 17 + index * 4]}
        />
      ))}
      {collapsed ? <mesh castShadow dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.beam} material={STAGE4A_FUEL_MATERIALS.charredMetal} position={[tank.radiusM * 0.34, 2.1, -tank.radiusM * 0.72]} rotation={[0.24, 0.8, -0.36]} scale={[tank.radiusM * 0.36, 2.2, tank.radiusM * 0.18]} /> : null}
    </group>
  )
}

function RupturedPipeCluster({ eventTimeSeconds, position, timeSeconds, yawRadians = 0 }: { eventTimeSeconds: number; position: Stage3Vec3; timeSeconds: number; yawRadians?: number }) {
  if (timeSeconds < eventTimeSeconds) return null
  return (
    <group name={`stage4a-ruptured-pipe:${eventTimeSeconds}`} position={position} rotation={[0, yawRadians, 0]}>
      {RUPTURED_PIPE_LANES.map((lane, index) => (
        <mesh key={lane} castShadow dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.pipe} material={STAGE4A_FUEL_MATERIALS.charredMetal} position={[index * 9 - 9, 1.8 + index * 0.8, lane * 3.2]} rotation={[0.08 * lane, 0, Math.PI / 2 + lane * 0.22]} scale={[1.1, 22 - index * 3, 1.1]} />
      ))}
      <mesh castShadow dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.beam} material={STAGE4A_FUEL_MATERIALS.charredMetal} position={[4, -1.2, 0]} rotation={[0.18, 0.4, -0.28]} scale={[13, 2.6, 5]} />
    </group>
  )
}

function TransferRackCollapse({ surfaceHeightAt, timeSeconds }: Pick<FuelDamageAftermathProps, 'surfaceHeightAt' | 'timeSeconds'>) {
  if (timeSeconds < 97.6) return null
  const baseY = surfaceHeightAt(400, 2_025)
  return (
    <group name="stage4a-collapsed-fuel-transfer-rack" position={[400, baseY, 2_025]}>
      {TRANSFER_RACK_SPANS.map((z, index) => (
        <mesh key={z} castShadow dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.beam} material={STAGE4A_FUEL_MATERIALS.charredMetal} position={[(index - 1) * 20, 5.2 - index, z]} rotation={[0.14 * index, 0.25 + index * 0.42, -0.58 + index * 0.18]} scale={[42, 2.8, 3.2]} />
      ))}
      <mesh castShadow dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.pipe} material={STAGE4A_FUEL_MATERIALS.charredMetal} position={[18, 2.8, -24]} rotation={[0.35, 0.18, Math.PI / 2 + 0.42]} scale={[1.4, 48, 1.4]} />
    </group>
  )
}

function CentralBundBreach({ surfaceHeightAt, timeSeconds }: Pick<FuelDamageAftermathProps, 'surfaceHeightAt' | 'timeSeconds'>) {
  if (timeSeconds < 92) return null
  const baseY = surfaceHeightAt(-760, 2_270)
  return (
    <group name="stage4a-central-bund-breach" position={[-760, baseY, 2_270]}>
      {BUND_BREACH_OFFSETS.map((x, index) => (
        <mesh key={x} castShadow dispose={null} geometry={STAGE4A_FUEL_GEOMETRIES.beam} material={STAGE4A_FUEL_MATERIALS.charredMetal} position={[x, 1.3 + index * 0.35, -2 - index * 8]} rotation={[0.12 * index, 0.1 + index * 0.32, 0.22 - index * 0.17]} scale={[27, 2.8, 9]} />
      ))}
    </group>
  )
}

// Every use of time in this persistent assembly is one of these exact tests.
// Live smoke/fire remain outside this boundary; backseeks compare both sides.
const DAMAGE_BOUNDARIES = [...STAGE4A_FUEL_ESCALATION_SCHEDULE.map((event) => event.atSeconds), ...TANK_DAMAGE.flatMap((tank) => [tank.eventTimeSeconds, tank.collapseAtSeconds]), 78, 81.2, 88.6, 105.6, 97.6, 92]

/** Persistent scorch, tank shell failures, ruptured pipes, and bund/rack collapse. */
export const FuelDamageAftermath = memo(
  function FuelDamageAftermath({ surfaceHeightAt, timeSeconds }: FuelDamageAftermathProps) {
    const rupturePositions = useMemo(
      () => [
        { eventTimeSeconds: 78, position: [-1_450, surfaceHeightAt(-1_450, 2_500) + 5.8, 2_500] as Stage3Vec3, yawRadians: 0.72 },
        { eventTimeSeconds: 81.2, position: [-1_200, surfaceHeightAt(-1_200, 2_300) + 3.2, 2_300] as Stage3Vec3, yawRadians: 0.08 },
        { eventTimeSeconds: 88.6, position: [-670, surfaceHeightAt(-670, 2_050) + 2.4, 2_050] as Stage3Vec3, yawRadians: 0 },
        { eventTimeSeconds: 105.6, position: [-300, surfaceHeightAt(-300, 2_300) + 3.2, 2_300] as Stage3Vec3, yawRadians: 0.06 },
      ],
      [surfaceHeightAt],
    )

    return (
      <group name="stage4a-persistent-fuel-damage-aftermath">
        <ScorchedFuelFootprint surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />
        {TANK_DAMAGE.map((damage) => (
          <DamagedTank key={damage.id} {...damage} surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />
        ))}
        {rupturePositions.map((rupture) => (
          <RupturedPipeCluster key={rupture.eventTimeSeconds} {...rupture} timeSeconds={timeSeconds} />
        ))}
        <TransferRackCollapse surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />
        <CentralBundBreach surfaceHeightAt={surfaceHeightAt} timeSeconds={timeSeconds} />
      </group>
    )
  },
  (a, b) => a.surfaceHeightAt === b.surfaceHeightAt && DAMAGE_BOUNDARIES.every((time) => a.timeSeconds >= time === b.timeSeconds >= time),
)
