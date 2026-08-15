import { Line } from '@react-three/drei'
import { useMemo } from 'react'
import { Color, QuadraticBezierCurve3, Vector3 } from 'three'

export type Vec3 = readonly [number, number, number]

type ImpactVariant = 'near-hit' | 'vehicle-kill' | 'radar-hit' | 'boundary-hit'

interface ImpactEffectProps {
  impactTime: number
  persistent?: boolean
  position: Vec3
  time: number
  variant: ImpactVariant
}

interface MissileFlightProps {
  control: Vec3
  duration: number
  end: Vec3
  launchTime: number
  origin: Vec3
  time: number
  tone?: 'air-defense' | 'strike'
}

interface TracerBurstProps {
  end: Vec3
  origin: Vec3
  shotTimes: readonly number[]
  time: number
}

interface StovlExhaustProps {
  doorOpen: number
  enginePower: number
  nozzleDeflection: number
  time: number
}

const WIND_X = 0.7
const WIND_Z = 0.71

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function seededNoise(index: number, salt: number) {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return value - Math.floor(value)
}

function toVector(value: Vec3) {
  return new Vector3(value[0], value[1], value[2])
}

function DebrisCloud({ age, position, scale }: { age: number; position: Vec3; scale: number }) {
  const fragments = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        spin: [seededNoise(index, 1) * 4 - 2, seededNoise(index, 2) * 4 - 2, seededNoise(index, 3) * 4 - 2] as Vec3,
        velocity: [(seededNoise(index, 4) - 0.5) * 18 * scale, (9 + seededNoise(index, 5) * 14) * scale, (seededNoise(index, 6) - 0.5) * 18 * scale] as Vec3,
      })),
    [scale],
  )

  if (age < 0 || age > 4.5) return null

  return (
    <group position={position}>
      {fragments.map((fragment, index) => {
        const flightAge = Math.min(age, 2.6 + seededNoise(index, 8))
        const x = fragment.velocity[0] * flightAge
        const y = Math.max(0.3, fragment.velocity[1] * flightAge - 4.9 * flightAge * flightAge)
        const z = fragment.velocity[2] * flightAge
        return (
          <mesh key={index} position={[x, y, z]} rotation={[fragment.spin[0] * flightAge, fragment.spin[1] * flightAge, fragment.spin[2] * flightAge]} scale={[1.8 * scale, 0.45 * scale, 0.7 * scale]}>
            <boxGeometry />
            <meshStandardMaterial color={index % 3 === 0 ? '#7d4926' : '#252a28'} roughness={0.88} />
          </mesh>
        )
      })}
    </group>
  )
}

function DustBurst({ age, position, scale }: { age: number; position: Vec3; scale: number }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => ({
        direction: seededNoise(index, 11) * Math.PI * 2,
        distance: 10 + seededNoise(index, 12) * 22,
        size: 5 + seededNoise(index, 13) * 9,
      })),
    [],
  )

  if (age < 0 || age > 2.4) return null
  const progress = clamp01(age / 2.4)

  return (
    <group position={position}>
      {clouds.map((cloud, index) => (
        <mesh key={index} position={[Math.sin(cloud.direction) * cloud.distance * progress * scale, (2 + progress * 6) * scale, Math.cos(cloud.direction) * cloud.distance * progress * scale]} scale={(cloud.size + progress * 11) * scale}>
          <icosahedronGeometry args={[1, 1]} />
          <meshBasicMaterial color="#9a8164" depthWrite={false} opacity={(1 - progress) * 0.28} transparent />
        </mesh>
      ))}
    </group>
  )
}

function PersistentFire({ age, position, scale }: { age: number; position: Vec3; scale: number }) {
  if (age < 0) return null
  const pulse = 0.84 + Math.sin(age * 8.2) * 0.12 + Math.sin(age * 3.7) * 0.07

  return (
    <group position={position}>
      <pointLight color="#ff6a21" decay={2} distance={70 * scale} intensity={90 * scale * pulse} />
      {[0, 1, 2].map((index) => {
        const offset = (index - 1) * 2.2 * scale
        const height = (5.5 + index * 1.4) * scale * pulse
        return (
          <mesh key={index} position={[offset, height * 0.42, index % 2 ? -1.1 * scale : 1.1 * scale]}>
            <coneGeometry args={[(2.4 - index * 0.3) * scale, height, 7]} />
            <meshBasicMaterial color={index === 1 ? '#ffd166' : '#ff5c1a'} depthWrite={false} opacity={0.74} toneMapped={false} transparent />
          </mesh>
        )
      })}
    </group>
  )
}

function SmokeColumn({ age, position, scale }: { age: number; position: Vec3; scale: number }) {
  if (age < 0) return null
  const puffCount = 11
  const interval = 0.7
  const lifetime = puffCount * interval

  return (
    <group position={position}>
      {Array.from({ length: puffCount }, (_, index) => {
        const emittedAge = age - index * interval
        if (emittedAge < 0) return null
        const puffAge = emittedAge % lifetime
        const progress = puffAge / lifetime
        const curl = Math.sin((puffAge + index) * 0.83) * 2.1 * scale
        const size = (2.8 + progress * 11.5) * scale
        return (
          <mesh key={index} position={[(puffAge * WIND_X * 2.6 + curl) * scale, (4 + puffAge * 9.2) * scale, (puffAge * WIND_Z * 2.6 - curl * 0.35) * scale]} scale={[size * 0.82, size, size * 0.82]}>
            <icosahedronGeometry args={[1, 1]} />
            <meshBasicMaterial color={index < 3 ? '#151b1c' : '#263033'} depthWrite={false} opacity={0.17 * (1 - progress * 0.72)} transparent />
          </mesh>
        )
      })}
    </group>
  )
}

function Shockwave({ age, position, scale }: { age: number; position: Vec3; scale: number }) {
  if (age < 0 || age > 1.35) return null
  const progress = clamp01(age / 1.35)
  const radius = (4 + progress * 38) * scale
  return (
    <mesh position={[position[0], position[1] + 0.25, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.92, radius, 48]} />
      <meshBasicMaterial color="#f2d4a0" depthWrite={false} opacity={(1 - progress) * 0.34} side={2} transparent />
    </mesh>
  )
}

export function ImpactEffect({ impactTime, persistent = true, position, time, variant }: ImpactEffectProps) {
  const age = time - impactTime
  if (age < 0) return null

  const isVehicle = variant === 'vehicle-kill'
  const isRadar = variant === 'radar-hit'
  const isBoundary = variant === 'boundary-hit'
  const scale = isVehicle ? 0.72 : isRadar ? 0.9 : isBoundary ? 1.25 : 0.56
  const flashProgress = clamp01(age / 0.22)
  const fireballProgress = clamp01((age - 0.04) / (isBoundary ? 1.1 : 0.78))
  const fireballVisible = age >= 0.04 && age < (isBoundary ? 1.15 : 0.88)

  return (
    <group>
      {age < 0.22 && (
        <group position={position}>
          <mesh scale={(1 + flashProgress * 7) * scale}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color="#fff2c1" depthWrite={false} opacity={1 - flashProgress} toneMapped={false} transparent />
          </mesh>
          <pointLight color="#ffb35a" decay={2} distance={260 * scale} intensity={(1 - flashProgress) * 1300 * scale} />
        </group>
      )}

      {fireballVisible && (
        <group position={[position[0], position[1] + 3 * scale, position[2]]}>
          <mesh scale={(3 + fireballProgress * 12) * scale}>
            <icosahedronGeometry args={[1, 2]} />
            <meshBasicMaterial color={fireballProgress < 0.5 ? '#ffcf63' : '#e94d16'} depthWrite={false} opacity={0.88 - fireballProgress * 0.58} toneMapped={false} transparent />
          </mesh>
          <mesh position={[3 * scale, 2 * scale, -2 * scale]} scale={(2 + fireballProgress * 8) * scale}>
            <icosahedronGeometry args={[1, 1]} />
            <meshBasicMaterial color="#ff6b1a" depthWrite={false} opacity={0.66 - fireballProgress * 0.42} toneMapped={false} transparent />
          </mesh>
        </group>
      )}

      {!isBoundary && <DebrisCloud age={age} position={position} scale={scale} />}
      <DustBurst age={age} position={position} scale={scale} />
      <Shockwave age={age} position={position} scale={scale} />

      {persistent && (
        <>
          <mesh position={[position[0], position[1] + 0.08, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[14 * scale, 36]} />
            <meshBasicMaterial color="#15130f" depthWrite={false} opacity={0.7} transparent />
          </mesh>
          <PersistentFire age={age - 0.32} position={position} scale={scale * (isRadar ? 0.55 : 0.72)} />
          <SmokeColumn age={age - 0.55} position={position} scale={scale} />
        </>
      )}
    </group>
  )
}

export function MissileFlight({ control, duration, end, launchTime, origin, time, tone = 'air-defense' }: MissileFlightProps) {
  const curve = useMemo(() => new QuadraticBezierCurve3(toVector(origin), toVector(control), toVector(end)), [control, end, origin])
  const age = time - launchTime
  if (age < 0 || age > duration) return null

  const progress = clamp01(age / duration)
  const head = curve.getPoint(progress)
  const trailStart = Math.max(0, progress - (tone === 'strike' ? 0.12 : 0.24))
  const points = Array.from({ length: 15 }, (_, index) => curve.getPoint(trailStart + (progress - trailStart) * (index / 14)))
  const color = tone === 'strike' ? '#ffb450' : '#e7eee8'

  return (
    <group>
      <Line color={color} lineWidth={tone === 'strike' ? 1.6 : 2.1} opacity={0.7} points={points} transparent />
      <mesh position={head} scale={tone === 'strike' ? 1.35 : 1}>
        <sphereGeometry args={[1.3, 10, 8]} />
        <meshBasicMaterial color="#fff5d8" toneMapped={false} />
      </mesh>
      <pointLight color="#ffb15c" decay={2} distance={45} intensity={55} position={head} />
    </group>
  )
}

export function TracerBurst({ end, origin, shotTimes, time }: TracerBurstProps) {
  const originVector = useMemo(() => toVector(origin), [origin])
  const endVector = useMemo(() => toVector(end), [end])

  return (
    <group>
      {shotTimes.map((shotTime, index) => {
        const age = time - shotTime
        const lifetime = 1.25
        if (age < 0 || age > lifetime) return null
        const progress = clamp01(age / lifetime)
        const deviation = new Vector3((seededNoise(index, 30) - 0.5) * 90, (seededNoise(index, 31) - 0.5) * 55, (seededNoise(index, 32) - 0.5) * 90)
        const target = endVector.clone().add(deviation)
        const head = originVector.clone().lerp(target, progress)
        const tail = originVector.clone().lerp(target, Math.max(0, progress - 0.035))
        return <Line key={`${shotTime}-${index}`} color={index % 3 === 0 ? '#ffcf6b' : '#ff8d3d'} lineWidth={1.5} opacity={0.82} points={[tail, head]} transparent />
      })}
    </group>
  )
}

export function StovlExhaust({ doorOpen, enginePower, nozzleDeflection, time }: StovlExhaustProps) {
  const liftStrength = clamp01(doorOpen * enginePower)
  const rearStrength = clamp01(enginePower * (0.35 + nozzleDeflection * 0.65))
  if (Math.max(liftStrength, rearStrength) < 0.03) return null
  const flicker = 0.9 + Math.sin(time * 19) * 0.08

  return (
    <group>
      {liftStrength > 0.03 && (
        <group position={[0, -1.25, -0.55]}>
          <mesh position={[0, -4.5 * liftStrength, 0]} scale={[1.4, 5.8 * liftStrength * flicker, 1.4]}>
            <coneGeometry args={[1, 1, 12, 1, true]} />
            <meshBasicMaterial color="#d6f3ff" depthWrite={false} opacity={0.13 * liftStrength} side={2} toneMapped={false} transparent />
          </mesh>
          <pointLight color="#9ddcff" decay={2} distance={18} intensity={9 * liftStrength} />
        </group>
      )}
      <group position={[0, -1.1, 6.7]} rotation={[nozzleDeflection * 1.1, 0, 0]}>
        <mesh position={[0, 0, 4 * rearStrength]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 5 * rearStrength, 1]}>
          <coneGeometry args={[0.9, 1, 12, 1, true]} />
          <meshBasicMaterial color="#ffae62" depthWrite={false} opacity={0.2 * rearStrength} side={2} toneMapped={false} transparent />
        </mesh>
      </group>
    </group>
  )
}

export function UnderwayWake({ time }: { time: number }) {
  const wakeColor = useMemo(() => new Color('#b8d4d2'), [])
  return (
    <group position={[0, 0.16, 112]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((index) => {
        const pulse = 1 + Math.sin(time * 0.7 + index * 1.8) * 0.08
        return (
          <mesh key={index} position={[(index - 1) * 10, 20 + index * 17, 0]} scale={[pulse, pulse, 1]}>
            <ringGeometry args={[8 + index * 7, 10 + index * 8, 36, 1, 0.25, Math.PI * 0.72]} />
            <meshBasicMaterial color={wakeColor} depthWrite={false} opacity={0.18 - index * 0.035} transparent />
          </mesh>
        )
      })}
    </group>
  )
}
