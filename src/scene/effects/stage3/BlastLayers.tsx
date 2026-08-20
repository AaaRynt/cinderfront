import { useLayoutEffect, useMemo, useRef } from 'react'
import { DynamicDrawUsage, InstancedMesh, Object3D } from 'three'

import type { Stage3Vec3 } from './types.ts'

import { clamp01, createStage3Random, shockRadiusAt, smoothstep01 } from './effectMath.ts'
import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from './sharedResources.ts'

export type Stage3BlastProfile = 'fuel' | 'ammunition'

export interface LayeredBlastProps {
  readonly eventTimeSeconds: number
  readonly fireballRadiusM?: number
  readonly position: Stage3Vec3
  readonly profile: Stage3BlastProfile
  readonly shockDurationSeconds?: number
  readonly shockRadiusM?: number
  readonly timeSeconds: number
}

interface DustShockFrontProps {
  readonly ageSeconds: number
  readonly durationSeconds: number
  readonly maximumRadiusM: number
  readonly origin: Stage3Vec3
  readonly profile: Stage3BlastProfile
}

/** A physical dust front: low, broad, and fully bounded to the authored shock duration. */
export function DustShockFront({ ageSeconds, durationSeconds, maximumRadiusM, origin, profile }: DustShockFrontProps) {
  const puffsRef = useRef<InstancedMesh>(null)
  const puffCount = profile === 'fuel' ? 30 : 24
  const radius = shockRadiusAt(ageSeconds, maximumRadiusM, durationSeconds)
  const visible = ageSeconds >= 0 && ageSeconds <= durationSeconds
  const scratchObject = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    const puffs = puffsRef.current
    if (!puffs) return
    const object = scratchObject
    const progress = clamp01(ageSeconds / durationSeconds)

    if (!visible) {
      puffs.count = 0
      puffs.instanceMatrix.needsUpdate = true
      return
    }

    for (let index = 0; index < puffCount; index += 1) {
      const angle = (index / puffCount) * Math.PI * 2 + Math.sin(index * 2.17) * 0.07
      const stagger = 0.93 + Math.sin(index * 3.91 + 0.7) * 0.055
      const localRadius = radius * stagger
      const size = (profile === 'fuel' ? 10 : 8) + progress * (profile === 'fuel' ? 25 : 19) + (index % 4) * 1.4
      object.position.set(origin[0] + Math.sin(angle) * localRadius, origin[1] + 1.4 + size * 0.12, origin[2] + Math.cos(angle) * localRadius)
      object.rotation.set(0.08 * Math.sin(index), angle, 0.04 * Math.cos(index * 1.7))
      object.scale.set(size * 1.7, size * 0.42, size)
      object.updateMatrix()
      puffs.setMatrixAt(index, object.matrix)
    }

    puffs.count = puffCount
    puffs.instanceMatrix.setUsage(DynamicDrawUsage)
    puffs.instanceMatrix.needsUpdate = true
  }, [ageSeconds, durationSeconds, origin, profile, puffCount, radius, scratchObject, visible])

  return (
    <group name={`stage3-${profile}-dust-shock`}>
      <mesh dispose={null} geometry={STAGE3_GEOMETRIES.ring} material={STAGE3_MATERIALS.dust} position={[origin[0], origin[1] + 0.3, origin[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={[Math.max(0.01, radius), Math.max(0.01, radius), 1]} visible={visible} />
      <instancedMesh ref={puffsRef} args={[STAGE3_GEOMETRIES.puff, STAGE3_MATERIALS.dust, puffCount]} dispose={null} frustumCulled={false} renderOrder={2} />
    </group>
  )
}

/** Layered event flash, irregular fireball, and outward ground-coupled dust front. */
export function LayeredBlast({ eventTimeSeconds, fireballRadiusM, position, profile, shockDurationSeconds, shockRadiusM, timeSeconds }: LayeredBlastProps) {
  const age = timeSeconds - eventTimeSeconds
  const isFuel = profile === 'fuel'
  const radius = fireballRadiusM ?? (isFuel ? 70 : 52)
  const growthSeconds = isFuel ? 1.4 : 0.72
  const lingerSeconds = isFuel ? 3.5 : 1.65
  const visibleSeconds = growthSeconds + lingerSeconds
  const growth = smoothstep01(age / growthSeconds)
  const transitionProgress = smoothstep01((age - growthSeconds) / lingerSeconds)
  const terminalFade = 1 - smoothstep01((transitionProgress - 0.56) / 0.44)
  const scale = Math.max(0.001, radius * growth * terminalFade)
  const fireballVisible = age >= 0 && age <= visibleSeconds
  const flashSeconds = isFuel ? 0.08 : 0.055
  const flashVisible = age >= 0 && age < flashSeconds
  const flashProgress = clamp01(age / flashSeconds)
  const resolvedShockRadius = shockRadiusM ?? (isFuel ? 620 : 500)
  const resolvedShockDuration = shockDurationSeconds ?? (isFuel ? 1.8 : 1.35)
  const fireballPosition: Stage3Vec3 = [position[0], position[1] + radius * (0.56 + transitionProgress * 0.58), position[2]]
  const fireballScale: Stage3Vec3 = [scale * (1 - transitionProgress * 0.12), scale * (1 + transitionProgress * 0.38), scale * (1 - transitionProgress * 0.08)]

  return (
    <group name={`stage3-${profile}-layered-blast`}>
      <group position={fireballPosition} scale={fireballScale} visible={fireballVisible}>
        <mesh dispose={null} geometry={STAGE3_GEOMETRIES.puff} material={STAGE3_MATERIALS.fireOuter} scale={[0.88, 0.68, 0.82]} />
        <mesh dispose={null} geometry={STAGE3_GEOMETRIES.puff} material={STAGE3_MATERIALS.fireOuter} position={[-0.28, 0.34, 0.18]} scale={[0.58, 0.62, 0.54]} />
        <mesh dispose={null} geometry={STAGE3_GEOMETRIES.puff} material={STAGE3_MATERIALS.fireOuter} position={[0.32, 0.18, -0.24]} scale={[0.62, 0.5, 0.6]} />
        <mesh dispose={null} geometry={STAGE3_GEOMETRIES.puff} material={STAGE3_MATERIALS.fireInner} position={[0.04, 0.1, 0.03]} scale={[0.56, 0.52, 0.58]} />
        <mesh dispose={null} geometry={STAGE3_GEOMETRIES.puff} material={STAGE3_MATERIALS.fireInner} position={[-0.18, -0.16, -0.24]} scale={[0.39, 0.36, 0.42]} />
      </group>

      <mesh dispose={null} geometry={STAGE3_GEOMETRIES.puff} material={STAGE3_MATERIALS.ember} position={fireballPosition} scale={radius * 1.35} visible={flashVisible} />
      <pointLight castShadow={false} color={isFuel ? '#ffab55' : '#ffd39a'} decay={2} distance={isFuel ? 270 : 230} intensity={flashVisible ? (isFuel ? 1450 : 1900) * (1 - flashProgress) : 0} position={fireballPosition} />
      <DustShockFront ageSeconds={age} durationSeconds={resolvedShockDuration} maximumRadiusM={resolvedShockRadius} origin={position} profile={profile} />
    </group>
  )
}

interface DamagePiece {
  readonly position: Stage3Vec3
  readonly rotation: Stage3Vec3
  readonly scale: Stage3Vec3
}

export interface PersistentBlastDamageProps {
  readonly eventTimeSeconds: number
  readonly origin: Stage3Vec3
  readonly profile: Stage3BlastProfile
  readonly seed?: number | string
  readonly surfaceHeightAt?: (x: number, z: number) => number
  readonly timeSeconds: number
}

/** Fixed damaged panels and an irregular ground scorch, revealed by absolute event time. */
export function PersistentBlastDamage({ eventTimeSeconds, origin, profile, seed = 'ash-harbor-stage3-damage', surfaceHeightAt, timeSeconds }: PersistentBlastDamageProps) {
  const damageRef = useRef<InstancedMesh>(null)
  const visible = timeSeconds >= eventTimeSeconds
  const scratchObject = useMemo(() => new Object3D(), [])
  const pieces = useMemo<readonly DamagePiece[]>(() => {
    const random = createStage3Random(`${seed}:${profile}:damage`)
    const count = profile === 'fuel' ? 12 : 9
    const radiusM = profile === 'fuel' ? 72 : 46
    return Array.from({ length: count }, () => {
      const angle = random() * Math.PI * 2
      const distance = 10 + Math.sqrt(random()) * radiusM
      const x = origin[0] + Math.sin(angle) * distance
      const z = origin[2] + Math.cos(angle) * distance
      const y = surfaceHeightAt ? surfaceHeightAt(x, z) : origin[1]
      return {
        position: [x, y + 0.5 + random() * 2.8, z],
        rotation: [random() * 1.1, random() * Math.PI * 2, random() * 1.1],
        scale: [2.5 + random() * 8, 0.7 + random() * 2.2, 2 + random() * 7],
      }
    })
  }, [origin, profile, seed, surfaceHeightAt])

  useLayoutEffect(() => {
    const mesh = damageRef.current
    if (!mesh) return
    const object = scratchObject
    if (visible) {
      for (let index = 0; index < pieces.length; index += 1) {
        const piece = pieces[index]
        object.position.set(...piece.position)
        object.rotation.set(...piece.rotation)
        object.scale.set(...piece.scale)
        object.updateMatrix()
        mesh.setMatrixAt(index, object.matrix)
      }
    }
    mesh.count = visible ? pieces.length : 0
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    mesh.instanceMatrix.needsUpdate = true
  }, [pieces, scratchObject, visible])

  const scorchDiameter = profile === 'fuel' ? 176 : 112
  return (
    <group name={`stage3-${profile}-persistent-damage`}>
      <mesh dispose={null} geometry={STAGE3_GEOMETRIES.irregularDisc} material={STAGE3_MATERIALS.scorch} position={[origin[0], origin[1] + 0.12, origin[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={scorchDiameter * 0.5} visible={visible} />
      <instancedMesh ref={damageRef} args={[STAGE3_GEOMETRIES.box, STAGE3_MATERIALS.charred, Math.max(1, pieces.length)]} dispose={null} frustumCulled={false} />
    </group>
  )
}
