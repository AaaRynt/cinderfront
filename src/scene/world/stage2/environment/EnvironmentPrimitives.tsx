import { useLayoutEffect, useMemo, useRef } from 'react'
import { BoxGeometry, BufferGeometry, CylinderGeometry, DodecahedronGeometry, Euler, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, StaticDrawUsage, Vector3 } from 'three'

import type { WorldPosition } from '../../worldData.ts'
import type { EnvironmentResponseGroup, EnvironmentResponseInstance } from './responseGroups.ts'

import { matrixBetween, offsetPolyline, samplePolyline, transformMatrix } from './primitiveLayout.ts'
import { createEnvironmentUserData } from './responseGroups.ts'
import { createDeterministicRandom, type DeterministicSeed } from './seededLayout.ts'

const UNIT_BOX_GEOMETRY = new BoxGeometry(1, 1, 1)
const UNIT_CYLINDER_GEOMETRY = new CylinderGeometry(0.5, 0.5, 1, 8)
const ROCK_GEOMETRY = new DodecahedronGeometry(1, 0)

const FENCE_MATERIAL = new MeshStandardMaterial({ color: '#5b605b', metalness: 0.34, roughness: 0.72 })
const UTILITY_MATERIAL = new MeshStandardMaterial({ color: '#4b4940', metalness: 0.08, roughness: 0.88 })
const WIRE_MATERIAL = new MeshStandardMaterial({ color: '#343938', metalness: 0.55, roughness: 0.54 })
const LIGHT_STRUCTURE_MATERIAL = new MeshStandardMaterial({ color: '#626965', metalness: 0.48, roughness: 0.52 })
const LIGHT_LENS_MATERIAL = new MeshStandardMaterial({
  color: '#d7b56d',
  emissive: '#8f5a20',
  emissiveIntensity: 1.1,
  metalness: 0.04,
  roughness: 0.5,
})
const PIPE_MATERIAL = new MeshStandardMaterial({ color: '#7a7d70', metalness: 0.46, roughness: 0.58 })
const PIPE_SUPPORT_MATERIAL = new MeshStandardMaterial({ color: '#505954', metalness: 0.35, roughness: 0.68 })
const CONCRETE_MATERIAL = new MeshStandardMaterial({ color: '#77766c', metalness: 0, roughness: 0.96 })
const EQUIPMENT_MATERIAL = new MeshStandardMaterial({ color: '#596057', metalness: 0.12, roughness: 0.82 })
const EQUIPMENT_DARK_MATERIAL = new MeshStandardMaterial({ color: '#303633', metalness: 0.24, roughness: 0.72 })
const INSULATOR_MATERIAL = new MeshStandardMaterial({ color: '#81745f', metalness: 0.02, roughness: 0.64 })
const ROCK_MATERIAL = new MeshStandardMaterial({ color: '#716750', flatShading: true, metalness: 0, roughness: 1 })

type StaticInstancedRunProps = Readonly<{
  castShadow?: boolean
  geometry: BufferGeometry
  material: MeshStandardMaterial
  matrices: readonly Matrix4[]
  name: string
  receiveShadow?: boolean
  userData: Record<string, unknown>
}>

function StaticInstancedRun({ castShadow = false, geometry, material, matrices, name, receiveShadow = true, userData }: StaticInstancedRunProps) {
  const meshRef = useRef<InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current

    if (!mesh) {
      return
    }

    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix))
    mesh.count = matrices.length
    mesh.instanceMatrix.setUsage(StaticDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingBox()
    mesh.computeBoundingSphere()
  }, [matrices])

  if (matrices.length === 0) {
    return null
  }

  return <instancedMesh ref={meshRef} args={[geometry, material, Math.max(1, matrices.length)]} castShadow={castShadow} dispose={null} frustumCulled name={name} receiveShadow={receiveShadow} userData={userData} />
}

export type SecurityFenceProps = Readonly<{
  id: string
  points: readonly WorldPosition[]
  postSpacingM?: number
  responseGroup?: EnvironmentResponseGroup
  rowSeparationM?: number
  rows?: 1 | 2
  visible?: boolean
}>

/** Project-scale single or double security fencing with instanced posts. */
export function SecurityFence({ id, points, postSpacingM = 18, responseGroup, rowSeparationM = 12, rows = 1, visible = true }: SecurityFenceProps) {
  const layout = useMemo(() => {
    const offsets = rows === 2 ? [-rowSeparationM / 2, rowSeparationM / 2] : [0]
    const postMatrices: Matrix4[] = []
    const railMatrices: Matrix4[] = []

    for (const offset of offsets) {
      const rowPoints = offsetPolyline(points, offset)
      for (const sample of samplePolyline(rowPoints, postSpacingM)) {
        const [x, y, z] = sample.position
        postMatrices.push(matrixBetween([x, y, z], [x, y + 2.8, z], 0.18))
      }

      for (let index = 0; index < rowPoints.length - 1; index += 1) {
        const start = rowPoints[index]!
        const end = rowPoints[index + 1]!
        railMatrices.push(matrixBetween([start[0], start[1] + 1, start[2]], [end[0], end[1] + 1, end[2]], 0.09), matrixBetween([start[0], start[1] + 2.25, start[2]], [end[0], end[1] + 2.25, end[2]], 0.09))
      }
    }

    return { postMatrices, railMatrices }
  }, [points, postSpacingM, rowSeparationM, rows])
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, layout.postMatrices.length + layout.railMatrices.length), [id, layout.postMatrices.length, layout.railMatrices.length, responseGroup])

  return (
    <group name={id} visible={visible}>
      <StaticInstancedRun geometry={UNIT_CYLINDER_GEOMETRY} material={FENCE_MATERIAL} matrices={layout.postMatrices} name={`${id}:posts`} userData={userData} />
      <StaticInstancedRun geometry={UNIT_BOX_GEOMETRY} material={FENCE_MATERIAL} matrices={layout.railMatrices} name={`${id}:rails`} userData={userData} />
    </group>
  )
}

export type UtilityPoleProps = Readonly<{
  headingDeg?: number
  heightM?: number
  id: string
  position: WorldPosition
  responseGroup?: EnvironmentResponseGroup
  visible?: boolean
}>

export function UtilityPole({ headingDeg = 0, heightM = 12, id, position, responseGroup, visible = true }: UtilityPoleProps) {
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, 1), [id, responseGroup])

  return (
    <group name={id} position={position} rotation={[0, (headingDeg * Math.PI) / 180, 0]} userData={userData} visible={visible}>
      <mesh dispose={null} geometry={UNIT_CYLINDER_GEOMETRY} material={UTILITY_MATERIAL} position={[0, heightM / 2, 0]} scale={[0.52, heightM, 0.52]} />
      <mesh dispose={null} geometry={UNIT_BOX_GEOMETRY} material={UTILITY_MATERIAL} position={[0, heightM, 0]} scale={[5.8, 0.24, 0.28]} />
      {[-2.2, 0, 2.2].map((x) => (
        <mesh key={x} dispose={null} geometry={UNIT_CYLINDER_GEOMETRY} material={INSULATOR_MATERIAL} position={[x, heightM + 0.4, 0]} scale={[0.2, 0.8, 0.2]} />
      ))}
    </group>
  )
}

export type UtilityPoleRunProps = Readonly<{
  heightM?: number
  id: string
  points: readonly WorldPosition[]
  responseGroup?: EnvironmentResponseGroup
  visible?: boolean
  wireSpacingM?: number
}>

/** Instanced poles, crossarms, and three restrained overhead conductors. */
export function UtilityPoleRun({ heightM = 12, id, points, responseGroup, visible = true, wireSpacingM = 2.2 }: UtilityPoleRunProps) {
  const layout = useMemo(() => {
    const poleMatrices: Matrix4[] = []
    const crossarmMatrices: Matrix4[] = []
    const wireMatrices: Matrix4[] = []

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index]!
      const previous = points[Math.max(0, index - 1)] ?? point
      const next = points[Math.min(points.length - 1, index + 1)] ?? point
      const tangentX = next[0] - previous[0]
      const tangentZ = next[2] - previous[2]
      const tangentLength = Math.hypot(tangentX, tangentZ) || 1
      const normalX = -tangentZ / tangentLength
      const normalZ = tangentX / tangentLength
      poleMatrices.push(matrixBetween(point, [point[0], point[1] + heightM, point[2]], 0.52))
      crossarmMatrices.push(matrixBetween([point[0] - normalX * 3, point[1] + heightM, point[2] - normalZ * 3], [point[0] + normalX * 3, point[1] + heightM, point[2] + normalZ * 3], 0.24))
    }

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index]!
      const end = points[index + 1]!
      const tangentX = end[0] - start[0]
      const tangentZ = end[2] - start[2]
      const tangentLength = Math.hypot(tangentX, tangentZ) || 1
      const normalX = -tangentZ / tangentLength
      const normalZ = tangentX / tangentLength

      for (const offset of [-wireSpacingM, 0, wireSpacingM]) {
        wireMatrices.push(matrixBetween([start[0] + normalX * offset, start[1] + heightM + 0.48, start[2] + normalZ * offset], [end[0] + normalX * offset, end[1] + heightM + 0.48, end[2] + normalZ * offset], 0.055))
      }
    }

    return { crossarmMatrices, poleMatrices, wireMatrices }
  }, [heightM, points, wireSpacingM])
  const instanceCount = layout.crossarmMatrices.length + layout.poleMatrices.length + layout.wireMatrices.length
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, instanceCount), [id, instanceCount, responseGroup])

  return (
    <group name={id} visible={visible}>
      <StaticInstancedRun geometry={UNIT_CYLINDER_GEOMETRY} material={UTILITY_MATERIAL} matrices={layout.poleMatrices} name={`${id}:poles`} userData={userData} />
      <StaticInstancedRun geometry={UNIT_BOX_GEOMETRY} material={UTILITY_MATERIAL} matrices={layout.crossarmMatrices} name={`${id}:crossarms`} userData={userData} />
      <StaticInstancedRun castShadow={false} geometry={UNIT_CYLINDER_GEOMETRY} material={WIRE_MATERIAL} matrices={layout.wireMatrices} name={`${id}:conductors`} receiveShadow={false} userData={userData} />
    </group>
  )
}

export type LightPoleProps = Readonly<{
  headingDeg?: number
  heightM?: number
  id: string
  position: WorldPosition
  responseGroup?: EnvironmentResponseGroup
  visible?: boolean
}>

export type DistrictLightPoleInstance = Readonly<Omit<LightPoleProps, 'responseGroup' | 'visible'>>

export type DistrictLightPoleBatchProps = Readonly<{
  id: string
  instances: readonly DistrictLightPoleInstance[]
  responseGroup?: EnvironmentResponseGroup
  visible?: boolean
}>

/** Emissive-only area light fixture; it deliberately adds no runtime light source. */
export function LightPole({ headingDeg = 0, heightM = 14, id, position, responseGroup, visible = true }: LightPoleProps) {
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, 1), [id, responseGroup])

  return (
    <group name={id} position={position} rotation={[0, (headingDeg * Math.PI) / 180, 0]} userData={userData} visible={visible}>
      <mesh dispose={null} geometry={UNIT_CYLINDER_GEOMETRY} material={LIGHT_STRUCTURE_MATERIAL} position={[0, heightM / 2, 0]} scale={[0.34, heightM, 0.34]} />
      <mesh dispose={null} geometry={UNIT_BOX_GEOMETRY} material={LIGHT_STRUCTURE_MATERIAL} position={[0, heightM - 0.2, 1.6]} scale={[0.24, 0.24, 3.2]} />
      <mesh dispose={null} geometry={UNIT_BOX_GEOMETRY} material={LIGHT_LENS_MATERIAL} position={[0, heightM - 0.62, 3.05]} scale={[1.15, 0.22, 0.78]} />
    </group>
  )
}

/** Three draw calls cover every static light pole in a district, regardless of pole count. */
export function DistrictLightPoleBatch({ id, instances, responseGroup, visible = true }: DistrictLightPoleBatchProps) {
  const layout = useMemo(() => {
    const armMatrices: Matrix4[] = []
    const lensMatrices: Matrix4[] = []
    const poleMatrices: Matrix4[] = []
    const responseInstances: EnvironmentResponseInstance[] = []

    instances.forEach((instance, instanceIndex) => {
      const headingRadians = ((instance.headingDeg ?? 0) * Math.PI) / 180
      const heightM = instance.heightM ?? 14
      const rootMatrix = transformMatrix(instance.position, [1, 1, 1], headingRadians)
      const childMatrix = (position: WorldPosition, scale: WorldPosition) => rootMatrix.clone().multiply(transformMatrix(position, scale))

      poleMatrices.push(childMatrix([0, heightM / 2, 0], [0.34, heightM, 0.34]))
      armMatrices.push(childMatrix([0, heightM - 0.2, 1.6], [0.24, 0.24, 3.2]))
      lensMatrices.push(childMatrix([0, heightM - 0.62, 3.05], [1.15, 0.22, 0.78]))

      if (responseGroup) {
        responseInstances.push({
          id: instance.id,
          instanceIndex,
          kind: responseGroup.kind,
          position: instance.position,
          responseGroupId: responseGroup.id,
        })
      }
    })

    return { armMatrices, lensMatrices, poleMatrices, responseInstances }
  }, [instances, responseGroup])
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, instances.length, layout.responseInstances), [id, instances.length, layout.responseInstances, responseGroup])

  return (
    <group name={id} userData={userData} visible={visible}>
      <StaticInstancedRun geometry={UNIT_CYLINDER_GEOMETRY} material={LIGHT_STRUCTURE_MATERIAL} matrices={layout.poleMatrices} name={`${id}:poles`} receiveShadow={false} userData={userData} />
      <StaticInstancedRun geometry={UNIT_BOX_GEOMETRY} material={LIGHT_STRUCTURE_MATERIAL} matrices={layout.armMatrices} name={`${id}:arms`} receiveShadow={false} userData={userData} />
      <StaticInstancedRun geometry={UNIT_BOX_GEOMETRY} material={LIGHT_LENS_MATERIAL} matrices={layout.lensMatrices} name={`${id}:lenses`} receiveShadow={false} userData={userData} />
    </group>
  )
}

export type PipeRackProps = Readonly<{
  clearanceM?: number
  corridorWidthM?: number
  id: string
  pipeCount?: number
  pipeDiameterM?: number
  points: readonly WorldPosition[]
  responseGroup?: EnvironmentResponseGroup
  supportSpacingM?: number
  visible?: boolean
}>

/** Elevated multi-product pipe rack matching the authoritative harbor trunk. */
export function PipeRack({ clearanceM = 5.5, corridorWidthM = 18, id, pipeCount = 4, pipeDiameterM = 0.8, points, responseGroup, supportSpacingM = 28, visible = true }: PipeRackProps) {
  const layout = useMemo(() => {
    const pipeMatrices: Matrix4[] = []
    const supportMatrices: Matrix4[] = []
    const resolvedPipeCount = Math.max(1, Math.floor(pipeCount))
    const pipeSpread = corridorWidthM * 0.68

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index]!
      const end = points[index + 1]!
      const tangentX = end[0] - start[0]
      const tangentZ = end[2] - start[2]
      const tangentLength = Math.hypot(tangentX, tangentZ) || 1
      const normalX = -tangentZ / tangentLength
      const normalZ = tangentX / tangentLength

      for (let pipeIndex = 0; pipeIndex < resolvedPipeCount; pipeIndex += 1) {
        const alpha = resolvedPipeCount === 1 ? 0.5 : pipeIndex / (resolvedPipeCount - 1)
        const offset = -pipeSpread / 2 + alpha * pipeSpread
        pipeMatrices.push(matrixBetween([start[0] + normalX * offset, start[1] + clearanceM, start[2] + normalZ * offset], [end[0] + normalX * offset, end[1] + clearanceM, end[2] + normalZ * offset], pipeDiameterM))
      }
    }

    for (const sample of samplePolyline(points, supportSpacingM)) {
      const [x, y, z] = sample.position
      const tangentLength = Math.hypot(sample.tangent[0], sample.tangent[2]) || 1
      const normalX = -sample.tangent[2] / tangentLength
      const normalZ = sample.tangent[0] / tangentLength
      const halfWidth = corridorWidthM * 0.47
      const left = [x - normalX * halfWidth, y, z - normalZ * halfWidth] as const
      const right = [x + normalX * halfWidth, y, z + normalZ * halfWidth] as const
      supportMatrices.push(matrixBetween(left, [left[0], y + clearanceM + 0.65, left[2]], 0.38), matrixBetween(right, [right[0], y + clearanceM + 0.65, right[2]], 0.38), matrixBetween([left[0], y + clearanceM - 0.2, left[2]], [right[0], y + clearanceM - 0.2, right[2]], 0.36))
    }

    return { pipeMatrices, supportMatrices }
  }, [clearanceM, corridorWidthM, pipeCount, pipeDiameterM, points, supportSpacingM])
  const instanceCount = layout.pipeMatrices.length + layout.supportMatrices.length
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, instanceCount), [id, instanceCount, responseGroup])

  return (
    <group name={id} visible={visible}>
      <StaticInstancedRun geometry={UNIT_CYLINDER_GEOMETRY} material={PIPE_MATERIAL} matrices={layout.pipeMatrices} name={`${id}:pipes`} userData={userData} />
      <StaticInstancedRun geometry={UNIT_BOX_GEOMETRY} material={PIPE_SUPPORT_MATERIAL} matrices={layout.supportMatrices} name={`${id}:supports`} userData={userData} />
    </group>
  )
}

export type PipelineRunProps = Readonly<{
  diameterM?: number
  elevationM?: number
  id: string
  points: readonly WorldPosition[]
  responseGroup?: EnvironmentResponseGroup
  supportSpacingM?: number
  visible?: boolean
}>

export function PipelineRun({ diameterM = 0.5, elevationM = 1.4, id, points, responseGroup, supportSpacingM = 22, visible = true }: PipelineRunProps) {
  const layout = useMemo(() => {
    const pipeMatrices: Matrix4[] = []
    const supportMatrices: Matrix4[] = []

    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index]!
      const end = points[index + 1]!
      pipeMatrices.push(matrixBetween([start[0], start[1] + elevationM, start[2]], [end[0], end[1] + elevationM, end[2]], diameterM))
    }

    for (const sample of samplePolyline(points, supportSpacingM)) {
      const [x, y, z] = sample.position
      const tangentLength = Math.hypot(sample.tangent[0], sample.tangent[2]) || 1
      const normalX = -sample.tangent[2] / tangentLength
      const normalZ = sample.tangent[0] / tangentLength
      const saddleHalfWidth = Math.max(0.7, diameterM * 1.8)
      supportMatrices.push(matrixBetween([x, y, z], [x, y + elevationM - diameterM * 0.6, z], 0.16), matrixBetween([x - normalX * saddleHalfWidth, y + elevationM - diameterM * 0.6, z - normalZ * saddleHalfWidth], [x + normalX * saddleHalfWidth, y + elevationM - diameterM * 0.6, z + normalZ * saddleHalfWidth], 0.16))
    }

    return { pipeMatrices, supportMatrices }
  }, [diameterM, elevationM, points, supportSpacingM])
  const instanceCount = layout.pipeMatrices.length + layout.supportMatrices.length
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, instanceCount), [id, instanceCount, responseGroup])

  return (
    <group name={id} visible={visible}>
      <StaticInstancedRun geometry={UNIT_CYLINDER_GEOMETRY} material={PIPE_MATERIAL} matrices={layout.pipeMatrices} name={`${id}:pipe`} userData={userData} />
      <StaticInstancedRun geometry={UNIT_BOX_GEOMETRY} material={PIPE_SUPPORT_MATERIAL} matrices={layout.supportMatrices} name={`${id}:saddles`} userData={userData} />
    </group>
  )
}

export type BarrierRunProps = Readonly<{
  blockLengthM?: number
  id: string
  points: readonly WorldPosition[]
  responseGroup?: EnvironmentResponseGroup
  spacingM?: number
  visible?: boolean
}>

export function BarrierRun({ blockLengthM = 2.8, id, points, responseGroup, spacingM = 3.2, visible = true }: BarrierRunProps) {
  const matrices = useMemo(
    () =>
      samplePolyline(points, spacingM).map((sample) => {
        const yaw = Math.atan2(sample.tangent[0], sample.tangent[2])
        return transformMatrix([sample.position[0], sample.position[1] + 0.55, sample.position[2]], [1.05, 1.1, blockLengthM], yaw)
      }),
    [blockLengthM, points, spacingM],
  )
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, matrices.length), [id, matrices.length, responseGroup])

  return (
    <group name={id} visible={visible}>
      <StaticInstancedRun castShadow geometry={UNIT_BOX_GEOMETRY} material={CONCRETE_MATERIAL} matrices={matrices} name={`${id}:blocks`} userData={userData} />
    </group>
  )
}

export type GeneratorUnitProps = Readonly<{
  dimensionsM?: WorldPosition
  headingDeg?: number
  id: string
  position: WorldPosition
  responseGroup?: EnvironmentResponseGroup
  visible?: boolean
}>

export type DistrictGeneratorInstance = Readonly<Omit<GeneratorUnitProps, 'responseGroup' | 'visible'>>

export function GeneratorUnit({ dimensionsM = [6, 3, 2.8], headingDeg = 0, id, position, responseGroup, visible = true }: GeneratorUnitProps) {
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, 1), [id, responseGroup])
  const [width, height, depth] = dimensionsM

  return (
    <group name={id} position={position} rotation={[0, (headingDeg * Math.PI) / 180, 0]} userData={userData} visible={visible}>
      <mesh castShadow dispose={null} geometry={UNIT_BOX_GEOMETRY} material={EQUIPMENT_MATERIAL} position={[0, height / 2 + 0.25, 0]} receiveShadow scale={[width, height, depth]} />
      <mesh dispose={null} geometry={UNIT_BOX_GEOMETRY} material={EQUIPMENT_DARK_MATERIAL} position={[0, height * 0.62, depth / 2 + 0.03]} scale={[width * 0.62, height * 0.5, 0.08]} />
      <mesh dispose={null} geometry={UNIT_CYLINDER_GEOMETRY} material={EQUIPMENT_DARK_MATERIAL} position={[width * 0.32, height + 1.25, 0]} scale={[0.3, 2, 0.3]} />
      <mesh dispose={null} geometry={UNIT_BOX_GEOMETRY} material={CONCRETE_MATERIAL} position={[0, 0.12, 0]} receiveShadow scale={[width + 1, 0.24, depth + 1]} />
    </group>
  )
}

export type TransformerBankProps = Readonly<{
  headingDeg?: number
  id: string
  position: WorldPosition
  responseGroup?: EnvironmentResponseGroup
  unitCount?: 2 | 3
  visible?: boolean
}>

export type DistrictTransformerBankInstance = Readonly<Omit<TransformerBankProps, 'responseGroup' | 'visible'>>

export type DistrictEquipmentBatchProps = Readonly<{
  generators: readonly DistrictGeneratorInstance[]
  id: string
  responseGroup?: EnvironmentResponseGroup
  transformerBanks: readonly DistrictTransformerBankInstance[]
  visible?: boolean
}>

export function TransformerBank({ headingDeg = 0, id, position, responseGroup, unitCount = 3, visible = true }: TransformerBankProps) {
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, unitCount), [id, responseGroup, unitCount])
  const offsets = unitCount === 2 ? [-2.3, 2.3] : [-4.4, 0, 4.4]

  return (
    <group name={id} position={position} rotation={[0, (headingDeg * Math.PI) / 180, 0]} userData={userData} visible={visible}>
      <mesh dispose={null} geometry={UNIT_BOX_GEOMETRY} material={CONCRETE_MATERIAL} position={[0, 0.14, 0]} receiveShadow scale={[offsets.length * 4.5, 0.28, 5]} />
      {offsets.map((x, index) => (
        <group key={`${id}:transformer:${index}`} position={[x, 0, 0]}>
          <mesh castShadow dispose={null} geometry={UNIT_BOX_GEOMETRY} material={EQUIPMENT_DARK_MATERIAL} position={[0, 1.7, 0]} receiveShadow scale={[3.2, 3.2, 2.4]} />
          <mesh dispose={null} geometry={UNIT_BOX_GEOMETRY} material={EQUIPMENT_MATERIAL} position={[0, 1.8, 1.35]} scale={[3.6, 2.6, 0.28]} />
          {[-0.9, 0, 0.9].map((bushingX) => (
            <mesh key={bushingX} dispose={null} geometry={UNIT_CYLINDER_GEOMETRY} material={INSULATOR_MATERIAL} position={[bushingX, 4, 0]} scale={[0.22, 1.4, 0.22]} />
          ))}
        </group>
      ))}
    </group>
  )
}

/**
 * Batches generator and transformer parts by geometry/material while retaining a
 * logical response entry for each generator and transformer unit.
 */
export function DistrictEquipmentBatch({ generators, id, responseGroup, transformerBanks, visible = true }: DistrictEquipmentBatchProps) {
  const layout = useMemo(() => {
    const concreteMatrices: Matrix4[] = []
    const darkBoxMatrices: Matrix4[] = []
    const darkCylinderMatrices: Matrix4[] = []
    const equipmentMatrices: Matrix4[] = []
    const insulatorMatrices: Matrix4[] = []
    const responseInstances: EnvironmentResponseInstance[] = []
    let logicalInstanceCount = 0

    generators.forEach((generator) => {
      const [width, height, depth] = generator.dimensionsM ?? [6, 3, 2.8]
      const headingRadians = ((generator.headingDeg ?? 0) * Math.PI) / 180
      const rootMatrix = transformMatrix(generator.position, [1, 1, 1], headingRadians)
      const childMatrix = (position: WorldPosition, scale: WorldPosition) => rootMatrix.clone().multiply(transformMatrix(position, scale))

      equipmentMatrices.push(childMatrix([0, height / 2 + 0.25, 0], [width, height, depth]))
      darkBoxMatrices.push(childMatrix([0, height * 0.62, depth / 2 + 0.03], [width * 0.62, height * 0.5, 0.08]))
      darkCylinderMatrices.push(childMatrix([width * 0.32, height + 1.25, 0], [0.3, 2, 0.3]))
      concreteMatrices.push(childMatrix([0, 0.12, 0], [width + 1, 0.24, depth + 1]))

      if (responseGroup) {
        responseInstances.push({
          id: generator.id,
          instanceIndex: logicalInstanceCount,
          kind: responseGroup.kind,
          position: generator.position,
          responseGroupId: responseGroup.id,
        })
      }
      logicalInstanceCount += 1
    })

    transformerBanks.forEach((bank) => {
      const headingRadians = ((bank.headingDeg ?? 0) * Math.PI) / 180
      const rootMatrix = transformMatrix(bank.position, [1, 1, 1], headingRadians)
      const childMatrix = (position: WorldPosition, scale: WorldPosition) => rootMatrix.clone().multiply(transformMatrix(position, scale))
      const offsets = (bank.unitCount ?? 3) === 2 ? [-2.3, 2.3] : [-4.4, 0, 4.4]

      concreteMatrices.push(childMatrix([0, 0.14, 0], [offsets.length * 4.5, 0.28, 5]))

      offsets.forEach((offset, unitIndex) => {
        darkBoxMatrices.push(childMatrix([offset, 1.7, 0], [3.2, 3.2, 2.4]))
        equipmentMatrices.push(childMatrix([offset, 1.8, 1.35], [3.6, 2.6, 0.28]))
        for (const bushingX of [-0.9, 0, 0.9]) {
          insulatorMatrices.push(childMatrix([offset + bushingX, 4, 0], [0.22, 1.4, 0.22]))
        }

        if (responseGroup) {
          responseInstances.push({
            id: `${bank.id}:transformer:${unitIndex}`,
            instanceIndex: logicalInstanceCount,
            kind: responseGroup.kind,
            position: [bank.position[0] + Math.cos(headingRadians) * offset, bank.position[1], bank.position[2] - Math.sin(headingRadians) * offset],
            responseGroupId: responseGroup.id,
          })
        }
        logicalInstanceCount += 1
      })
    })

    return {
      concreteMatrices,
      darkBoxMatrices,
      darkCylinderMatrices,
      equipmentMatrices,
      insulatorMatrices,
      logicalInstanceCount,
      responseInstances,
    }
  }, [generators, responseGroup, transformerBanks])
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, layout.logicalInstanceCount, layout.responseInstances), [id, layout.logicalInstanceCount, layout.responseInstances, responseGroup])

  return (
    <group name={id} userData={userData} visible={visible}>
      <StaticInstancedRun castShadow geometry={UNIT_BOX_GEOMETRY} material={EQUIPMENT_MATERIAL} matrices={layout.equipmentMatrices} name={`${id}:equipment-shells`} userData={userData} />
      <StaticInstancedRun castShadow geometry={UNIT_BOX_GEOMETRY} material={EQUIPMENT_DARK_MATERIAL} matrices={layout.darkBoxMatrices} name={`${id}:dark-equipment`} userData={userData} />
      <StaticInstancedRun geometry={UNIT_CYLINDER_GEOMETRY} material={EQUIPMENT_DARK_MATERIAL} matrices={layout.darkCylinderMatrices} name={`${id}:exhausts`} userData={userData} />
      <StaticInstancedRun geometry={UNIT_BOX_GEOMETRY} material={CONCRETE_MATERIAL} matrices={layout.concreteMatrices} name={`${id}:equipment-pads`} userData={userData} />
      <StaticInstancedRun geometry={UNIT_CYLINDER_GEOMETRY} material={INSULATOR_MATERIAL} matrices={layout.insulatorMatrices} name={`${id}:insulators`} userData={userData} />
    </group>
  )
}

export type RockClusterProps = Readonly<{
  count?: number
  id: string
  position: WorldPosition
  radiusM?: number
  responseGroup?: EnvironmentResponseGroup
  seed: DeterministicSeed
  visible?: boolean
}>

export function RockCluster({ count = 9, id, position, radiusM = 12, responseGroup, seed, visible = true }: RockClusterProps) {
  const layout = useMemo(() => {
    const random = createDeterministicRandom(`${seed}:${id}`)
    const matrices: Matrix4[] = []
    const responseInstances: EnvironmentResponseInstance[] = []

    for (let index = 0; index < Math.max(0, Math.floor(count)); index += 1) {
      const angle = random() * Math.PI * 2
      const distance = Math.sqrt(random()) * radiusM
      const localX = Math.cos(angle) * distance
      const localZ = Math.sin(angle) * distance
      const size = 0.9 + random() * 2.8
      const localY = size * (0.22 + random() * 0.12)
      const rotation = new Quaternion().setFromEuler(new Euler((random() - 0.5) * 0.65, random() * Math.PI * 2, (random() - 0.5) * 0.65))
      matrices.push(new Matrix4().compose(new Vector3(localX, localY, localZ), rotation, new Vector3(size, size * (0.48 + random() * 0.42), size * (0.7 + random() * 0.55))))

      if (responseGroup) {
        responseInstances.push({
          id: `${id}:rock:${index}`,
          instanceIndex: index,
          kind: 'rock',
          position: [position[0] + localX, position[1], position[2] + localZ],
          responseGroupId: responseGroup.id,
        })
      }
    }

    return { matrices, responseInstances }
  }, [count, id, position, radiusM, responseGroup, seed])
  const userData = useMemo(() => createEnvironmentUserData(id, responseGroup, layout.matrices.length, layout.responseInstances), [id, layout.matrices.length, layout.responseInstances, responseGroup])

  return (
    <group name={id} position={position} visible={visible}>
      <StaticInstancedRun castShadow geometry={ROCK_GEOMETRY} material={ROCK_MATERIAL} matrices={layout.matrices} name={`${id}:rocks`} userData={userData} />
    </group>
  )
}
