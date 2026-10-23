import type { GroundVehicleMotionState, Vector3 } from '@/simulation/types'

export const AFTERMATH_DUST_SLOTS_PER_ACTOR = 6
export const AFTERMATH_DUST_INTERVAL_SECONDS = 0.24
export const AFTERMATH_DUST_LIFETIME_SECONDS = 1.4
export const AFTERMATH_DUST_CACHE_LIMIT = 128
export interface DustContactActor extends Pick<GroundVehicleMotionState, 'pose' | 'speedMetersPerSecond' | 'dustIntensity' | 'motionDirection'> {
  readonly id: string
}
export interface RecentGroundDust {
  readonly birthAtSeconds: number
  readonly ageSeconds: number
  readonly position: Vector3
  readonly scale: number
}
interface DustBirth {
  readonly position: Vector3
  readonly intensity: number
}
const births = new Map<string, DustBirth>()
export const getAftermathDustCacheSize = () => births.size

/** Each actor reconstructs only six possible recent births. The shared cache
 * is an eviction-only optimization, never source state or emission history. */
export function sampleRecentGroundDust(id: string, runtime: number, sampleActor: (time: number) => DustContactActor, halfTrack: number, halfLength: number, surfaceHeightAt: (x: number, z: number) => number): readonly RecentGroundDust[] {
  if (!Number.isFinite(runtime) || runtime <= 180) return []
  const tick = Math.floor((runtime - 180) / AFTERMATH_DUST_INTERVAL_SECONDS)
  const blend = Math.min(1, (runtime - 180) / 0.6)
  const puffs: RecentGroundDust[] = []
  for (let slot = 0; slot < AFTERMATH_DUST_SLOTS_PER_ACTOR; slot++) {
    const birthIndex = tick - slot
    const birthAtSeconds = 180 + birthIndex * AFTERMATH_DUST_INTERVAL_SECONDS
    const ageSeconds = runtime - birthAtSeconds
    if (birthIndex < 0 || ageSeconds < 0 || ageSeconds >= AFTERMATH_DUST_LIFETIME_SECONDS) continue
    const key = `${id}:${halfTrack}:${halfLength}:${birthIndex}`
    let birth = births.get(key)
    if (!birth) {
      const actor = sampleActor(birthAtSeconds)
      const { position, rotation } = actor.pose
      const side = birthIndex % 2 === 0 ? -1 : 1
      const rear = actor.motionDirection === 'reverse' ? -halfLength : halfLength
      const x = position.x + Math.cos(rotation.y) * halfTrack * side + Math.sin(rotation.y) * rear
      const z = position.z - Math.sin(rotation.y) * halfTrack * side + Math.cos(rotation.y) * rear
      birth = { position: { x, y: surfaceHeightAt(x, z), z }, intensity: actor.speedMetersPerSecond > 0.05 ? actor.dustIntensity : 0 }
      births.set(key, birth)
      if (births.size > AFTERMATH_DUST_CACHE_LIMIT) births.delete(births.keys().next().value!)
    }
    if (birth.intensity <= 0.001) continue
    const envelope = Math.sin((Math.PI * ageSeconds) / AFTERMATH_DUST_LIFETIME_SECONDS)
    const scale = (0.32 + ageSeconds * 1.2) * Math.sqrt(birth.intensity / 0.28) * envelope * blend
    puffs.push({ birthAtSeconds, ageSeconds, scale, position: { x: birth.position.x + ageSeconds * 0.28, y: birth.position.y + 0.14 + ageSeconds * 0.4, z: birth.position.z + ageSeconds * 0.18 } })
  }
  return puffs
}
