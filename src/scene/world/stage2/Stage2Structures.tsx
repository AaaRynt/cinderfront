import type { Material } from 'three'

import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'

import type { WorldPosition, XZPoint } from '../worldData.ts'
import type { Stage2Materials } from './stage2Materials.ts'

import { PolygonPrism, PolygonSurface } from './Stage2Meshes.tsx'

const Y_AXIS = new Vector3(0, 1, 0)

export function SegmentCylinder({ end, material, name, radius, radialSegments = 8, start }: { end: WorldPosition; material: Material; name?: string; radius: number; radialSegments?: number; start: WorldPosition }) {
  const transform = useMemo(() => {
    const startVector = new Vector3(...start)
    const endVector = new Vector3(...end)
    const direction = endVector.clone().sub(startVector)
    const length = Math.max(0.01, direction.length())
    return {
      length,
      position: startVector.add(endVector).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(Y_AXIS, direction.normalize()),
    }
  }, [end, start])

  return (
    <mesh castShadow={false} material={material} name={name} position={transform.position} quaternion={transform.quaternion} receiveShadow>
      <cylinderGeometry args={[radius, radius, transform.length, radialSegments, 1]} />
    </mesh>
  )
}

export function Warehouse({ baseY, heightM, id, materials, points }: { baseY: number; heightM: number; id: string; materials: Stage2Materials; points: readonly XZPoint[] }) {
  return (
    <group name={id}>
      <PolygonPrism bottomY={baseY} castShadow material={materials.warehouseWall} points={points} topY={baseY + heightM} />
      <PolygonSurface material={materials.warehouseRoof} points={points} y={baseY + heightM + 0.12} />
      <group name={`${id}:future-damage-attachments`}>
        <group name={`${id}:roof-fire-anchor`} />
        <group name={`${id}:smoke-anchor`} />
      </group>
    </group>
  )
}

export function GantryCrane({ headingRadians, id, materials, position, scale = 1 }: { headingRadians: number; id: string; materials: Stage2Materials; position: WorldPosition; scale?: number }) {
  const span = 54 * scale
  const height = 38 * scale
  return (
    <group name={id} position={position} rotation={[0, headingRadians, 0]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * span * 0.43, 0, 0]}>
          <mesh castShadow material={materials.paintedSteel} position={[0, height * 0.5, -10 * scale]}>
            <boxGeometry args={[3.2 * scale, height, 3.2 * scale]} />
          </mesh>
          <mesh castShadow material={materials.paintedSteel} position={[0, height * 0.5, 10 * scale]}>
            <boxGeometry args={[3.2 * scale, height, 3.2 * scale]} />
          </mesh>
        </group>
      ))}
      <mesh castShadow material={materials.paintedSteel} position={[0, height, 0]}>
        <boxGeometry args={[span, 4 * scale, 5 * scale]} />
      </mesh>
      <mesh castShadow material={materials.darkSteel} position={[0, height + 1.5 * scale, -30 * scale]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[3 * scale, 3 * scale, 70 * scale]} />
      </mesh>
      <mesh material={materials.warning} position={[0, height - 10 * scale, -1 * scale]}>
        <boxGeometry args={[7 * scale, 5 * scale, 7 * scale]} />
      </mesh>
    </group>
  )
}

export function FuelTank({ center, heightM, id, materials, radiusM }: { center: WorldPosition; heightM: number; id: string; materials: Stage2Materials; radiusM: number }) {
  return (
    <group name={id} position={center}>
      <mesh castShadow material={materials.tankWall} position={[0, heightM / 2, 0]} receiveShadow>
        <cylinderGeometry args={[radiusM, radiusM, heightM, 28, 1, false]} />
      </mesh>
      <mesh castShadow material={materials.tankTop} position={[0, heightM + 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[radiusM * 0.985, radiusM * 0.985, 1, 28]} />
      </mesh>
      <mesh material={materials.darkSteel} position={[0, heightM + 1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radiusM * 0.79, 0.7, 5, 28]} />
      </mesh>
      <group name={`${id}:future-effects`}>
        <group name={`${id}:fire-anchor`} position={[0, heightM, 0]} />
        <group name={`${id}:smoke-anchor`} position={[0, heightM + 2, 0]} />
        <group name={`${id}:debris-origin`} position={[radiusM * 0.6, heightM * 0.7, 0]} />
      </group>
    </group>
  )
}

export function CommunicationsMast({ materials, position, heightM }: { heightM: number; materials: Stage2Materials; position: WorldPosition }) {
  return (
    <group name="communications_mast" position={position}>
      <mesh castShadow material={materials.concrete} position={[0, 2, 0]} receiveShadow>
        <boxGeometry args={[44, 4, 44]} />
      </mesh>
      <mesh castShadow material={materials.steel} position={[0, heightM / 2, 0]}>
        <cylinderGeometry args={[1.4, 3.4, heightM, 6]} />
      </mesh>
      <mesh castShadow material={materials.steel} position={[0, 26, 0]}>
        <boxGeometry args={[24, 1.5, 1.5]} />
      </mesh>
      <mesh castShadow material={materials.steel} position={[0, 44, 0]}>
        <boxGeometry args={[1.5, 1.5, 21]} />
      </mesh>
      <mesh material={materials.warning} position={[0, heightM + 1.8, 0]}>
        <octahedronGeometry args={[2.7, 0]} />
      </mesh>
    </group>
  )
}
