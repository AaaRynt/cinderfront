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
  const frame = useMemo(() => {
    const edges = points.map((start, index) => {
      const end = points[(index + 1) % points.length]!
      const dx = end[0] - start[0]
      const dz = end[1] - start[1]
      return { end, heading: Math.atan2(dx, dz), length: Math.hypot(dx, dz), start }
    })
    const longLength = Math.max(...edges.map((edge) => edge.length))
    const shortLength = Math.min(...edges.map((edge) => edge.length))
    const primaryEdge = edges.find((edge) => edge.length >= longLength * 0.98)!
    return {
      centerX: points.reduce((total, point) => total + point[0], 0) / points.length,
      centerZ: points.reduce((total, point) => total + point[1], 0) / points.length,
      heading: primaryEdge.heading,
      longEdges: edges.filter((edge) => edge.length >= longLength * 0.9),
      longLength,
      shortLength,
    }
  }, [points])
  const doorHeight = Math.min(10, heightM * 0.44)

  return (
    <group name={id}>
      <PolygonPrism bottomY={baseY} castShadow material={materials.warehouseWall} points={points} topY={baseY + heightM} />
      <PolygonSurface material={materials.warehouseRoof} points={points} y={baseY + heightM + 0.12} />
      <group name={`${id}:loading-bays`}>
        {frame.longEdges.flatMap((edge, edgeIndex) => {
          const bayCount = Math.max(4, Math.round(edge.length / 72))
          const doorWidth = Math.min(34, edge.length / (bayCount * 1.5))
          const features = Array.from({ length: bayCount }, (_, bayIndex) => {
            const progress = (bayIndex + 0.5) / bayCount
            const x = edge.start[0] + (edge.end[0] - edge.start[0]) * progress
            const z = edge.start[1] + (edge.end[1] - edge.start[1]) * progress
            return (
              <group key={`${id}:bay:${edgeIndex}:${bayIndex}`} position={[x, baseY, z]} rotation={[0, edge.heading, 0]}>
                <mesh castShadow material={materials.darkSteel} position={[0, doorHeight / 2, 0]}>
                  <boxGeometry args={[1.2, doorHeight, doorWidth]} />
                </mesh>
                <mesh castShadow material={materials.paintedSteel} position={[0, doorHeight + 0.7, 0]}>
                  <boxGeometry args={[3.4, 1.4, doorWidth + 5]} />
                </mesh>
              </group>
            )
          })
          for (let bayIndex = 0; bayIndex <= bayCount; bayIndex += 1) {
            const progress = bayIndex / bayCount
            const x = edge.start[0] + (edge.end[0] - edge.start[0]) * progress
            const z = edge.start[1] + (edge.end[1] - edge.start[1]) * progress
            features.push(
              <mesh key={`${id}:pilaster:${edgeIndex}:${bayIndex}`} castShadow material={materials.paintedSteel} position={[x, baseY + heightM / 2, z]}>
                <boxGeometry args={[2.4, heightM, 2.4]} />
              </mesh>,
            )
          }
          return features
        })}
      </group>
      <group name={`${id}:roof-services`} position={[frame.centerX, baseY + heightM, frame.centerZ]} rotation={[0, frame.heading, 0]}>
        {[-0.22, 0.22].map((offset) => (
          <mesh key={offset} castShadow material={materials.warehouseRoof} position={[frame.shortLength * offset, 1.7, 0]}>
            <boxGeometry args={[12, 3.4, frame.longLength * 0.76]} />
          </mesh>
        ))}
        {[-0.3, 0, 0.3].map((offset) => (
          <group key={offset} position={[0, 0, frame.longLength * offset]}>
            <mesh castShadow material={materials.darkSteel} position={[0, 2.7, 0]}>
              <cylinderGeometry args={[2.2, 2.7, 5.4, 10]} />
            </mesh>
            <mesh material={materials.paintedSteel} position={[0, 5.7, 0]}>
              <cylinderGeometry args={[3.2, 2.2, 0.6, 10]} />
            </mesh>
          </group>
        ))}
      </group>
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
  const ribAngles = Array.from({ length: 12 }, (_, index) => (index / 12) * Math.PI * 2)
  const stairSteps = Array.from({ length: 9 }, (_, index) => (index + 1) / 10)

  return (
    <group name={id} position={center}>
      <mesh castShadow material={materials.tankWall} position={[0, heightM / 2, 0]} receiveShadow>
        <cylinderGeometry args={[radiusM, radiusM, heightM, 28, 1, false]} />
      </mesh>
      {[0.24, 0.5, 0.76].map((heightFraction) => (
        <mesh key={heightFraction} material={materials.paintedSteel} position={[0, heightM * heightFraction, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radiusM + 0.18, 0.42, 4, 28]} />
        </mesh>
      ))}
      {ribAngles.map((angle) => (
        <mesh key={angle} castShadow material={materials.paintedSteel} position={[Math.cos(angle) * (radiusM + 0.35), heightM / 2, Math.sin(angle) * (radiusM + 0.35)]} rotation={[0, -angle, 0]}>
          <boxGeometry args={[0.85, Math.max(2, heightM - 1.2), 2.1]} />
        </mesh>
      ))}
      <mesh castShadow material={materials.tankTop} position={[0, heightM + 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[radiusM * 0.985, radiusM * 0.985, 1, 28]} />
      </mesh>
      <mesh material={materials.darkSteel} position={[0, heightM + 1.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radiusM * 0.965, 0.82, 5, 28]} />
      </mesh>
      <mesh material={materials.paintedSteel} position={[0, heightM + 3.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radiusM * 0.965, 0.32, 4, 28]} />
      </mesh>
      {ribAngles
        .filter((_, index) => index % 2 === 0)
        .map((angle) => (
          <mesh key={`rail:${angle}`} material={materials.paintedSteel} position={[Math.cos(angle) * radiusM * 0.965, heightM + 2.25, Math.sin(angle) * radiusM * 0.965]}>
            <boxGeometry args={[0.38, 1.9, 0.38]} />
          </mesh>
        ))}
      <group name={`${id}:access-stair`}>
        <SegmentCylinder end={[radiusM + 1.5, heightM + 1.2, -2.2]} material={materials.steel} radius={0.48} start={[radiusM + 17, 0.8, -2.2]} />
        <SegmentCylinder end={[radiusM + 1.5, heightM + 1.2, 2.2]} material={materials.steel} radius={0.48} start={[radiusM + 17, 0.8, 2.2]} />
        {stairSteps.map((progress) => (
          <mesh key={progress} castShadow material={materials.darkSteel} position={[radiusM + 17 - 15.5 * progress, 0.8 + heightM * progress, 0]}>
            <boxGeometry args={[2.5, 0.42, 5.1]} />
          </mesh>
        ))}
        <mesh castShadow material={materials.darkSteel} position={[radiusM + 0.5, heightM + 0.7, 0]}>
          <boxGeometry args={[5.5, 0.65, 8]} />
        </mesh>
      </group>
      {[-0.24, 0, 0.24].map((offset) => (
        <group key={`vent:${offset}`} position={[radiusM * offset, heightM + 1, 0]}>
          <mesh castShadow material={materials.darkSteel} position={[0, 1.8, 0]}>
            <cylinderGeometry args={[1.35, 1.65, 3.6, 10]} />
          </mesh>
          <mesh material={materials.paintedSteel} position={[0, 3.8, 0]}>
            <cylinderGeometry args={[2, 1.4, 0.55, 10]} />
          </mesh>
        </group>
      ))}
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
