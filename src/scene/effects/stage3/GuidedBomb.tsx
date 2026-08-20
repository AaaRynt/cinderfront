import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'

import type { Stage3Vec3 } from './types.ts'

import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from './sharedResources.ts'

export interface GuidedBombProps {
  readonly position: Stage3Vec3
  readonly scale?: number
  readonly tangent: Stage3Vec3
  readonly visible?: boolean
}

const LOCAL_FORWARD = new Vector3(0, 0, -1)

/** A dark physical munition body. Trajectory and release timing remain simulation-owned. */
export function GuidedBomb({ position, scale = 1, tangent, visible = true }: GuidedBombProps) {
  const [tangentX, tangentY, tangentZ] = tangent
  const quaternion = useMemo(() => {
    const direction = new Vector3(tangentX, tangentY, tangentZ)
    if (direction.lengthSq() < 1e-8) direction.copy(LOCAL_FORWARD)
    return new Quaternion().setFromUnitVectors(LOCAL_FORWARD, direction.normalize())
  }, [tangentX, tangentY, tangentZ])

  return (
    <group name="stage3-guided-bomb" position={position} quaternion={quaternion} scale={scale} visible={visible}>
      <mesh dispose={null} geometry={STAGE3_GEOMETRIES.bombBody} material={STAGE3_MATERIALS.bombBody} rotation={[Math.PI / 2, 0, 0]} />
      <mesh dispose={null} geometry={STAGE3_GEOMETRIES.box} material={STAGE3_MATERIALS.bombFin} position={[0, 0, 1.25]} scale={[1.5, 0.08, 0.62]} />
      <mesh dispose={null} geometry={STAGE3_GEOMETRIES.box} material={STAGE3_MATERIALS.bombFin} position={[0, 0, 1.25]} rotation={[0, 0, Math.PI / 2]} scale={[1.5, 0.08, 0.62]} />
    </group>
  )
}
