import { Euler, Vector3 as ThreeVector3 } from 'three'

import type { SecondaryPantsirState } from './secondaryPantsirTypes'
import type { Pose3, Vector3 } from './types'

import { getTerrainHeight } from '../scene/world/stage2/terrainModel'
import { createGroundedPose, createPath, samplePath } from './groundMotion'
import { clamp, lerp, smoothstep } from './math'
import { clampSimulationTime } from './time'

export const SECONDARY_PANTSIR_TIMING = { relocate: 112, stop: 117.2, ready: 118.8, shots: [119, 119.6], destroyed: 121 } as const
export const SECONDARY_PANTSIR_ROUTE_CONTRACT = {
  pathId: 'path_pantsir_relocation',
  featureIds: ['corridor_pull_off_east', 'road_eastern_trunk', 'corridor_inland_junction'],
  // A local shoulder stop; this round does not reach the distant junction.
  controls: [
    [5450, -1745],
    [5444, -1746.2],
    [5438, -1749.1],
    [5432, -1749.8],
  ],
} as const
const curvePoints = Array.from({ length: 129 }, (_, i): readonly [number, number] => {
  const t = i / 128,
    u = 1 - t
  const [a, b, c, d] = SECONDARY_PANTSIR_ROUTE_CONTRACT.controls
  return [u ** 3 * a[0] + 3 * u ** 2 * t * b[0] + 3 * u * t ** 2 * c[0] + t ** 3 * d[0], u ** 3 * a[1] + 3 * u ** 2 * t * b[1] + 3 * u * t ** 2 * c[1] + t ** 3 * d[1]]
})
export const SECONDARY_PANTSIR_LOCAL_PATH = createPath(curvePoints)
// Existing pull-off mesh lies 0.4 m above the triangulated terrain datum.
export function getSecondaryPantsirSurfaceHeight(x: number, z: number) {
  return getTerrainHeight(x, z) + 0.4
}

function motionAt(timeSeconds: number) {
  const duration = SECONDARY_PANTSIR_TIMING.stop - SECONDARY_PANTSIR_TIMING.relocate
  const u = clamp((timeSeconds - SECONDARY_PANTSIR_TIMING.relocate) / duration, 0, 1)
  const length = SECONDARY_PANTSIR_LOCAL_PATH.lengthMeters
  const distance = length * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5)
  const speed = (length * 30 * u ** 2 * (1 - u) ** 2) / duration
  const acceleration = (length * 60 * u * (1 - u) * (1 - 2 * u)) / duration ** 2
  const sample = samplePath(SECONDARY_PANTSIR_LOCAL_PATH, distance)
  const pose = createGroundedPose({ position: [sample.x, sample.z], hullTangent: [sample.tangentX, sample.tangentZ], heightMeters: 0, halfLengthMeters: 4.15, halfWidthMeters: 1.38, groundClearanceMeters: 0, surfaceHeightAt: getSecondaryPantsirSurfaceHeight })
  const before = samplePath(SECONDARY_PANTSIR_LOCAL_PATH, Math.max(0, distance - 0.4))
  const after = samplePath(SECONDARY_PANTSIR_LOCAL_PATH, Math.min(length, distance + 0.4))
  const turn = Math.atan2(before.tangentX * after.tangentZ - before.tangentZ * after.tangentX, before.tangentX * after.tangentX + before.tangentZ * after.tangentZ)
  const span = Math.min(length, distance + 0.4) - Math.max(0, distance - 0.4)
  const steering = speed > 0.02 ? clamp(-Math.atan((6.8 * turn) / Math.max(0.001, span)), -0.45, 0.45) : 0
  return { pose, distance, speed, acceleration, steering }
}

export function secondaryPantsirLocalToWorld(pose: Pose3, local: Vector3): Vector3 {
  const r = pose.rotation
  const result = new ThreeVector3(local.x, local.y, local.z).applyEuler(new Euler(r.x, r.y, r.z, 'YXZ'))
  return { x: result.x + pose.position.x, y: result.y + pose.position.y, z: result.z + pose.position.z }
}

const STOP = motionAt(SECONDARY_PANTSIR_TIMING.stop)
// Fixed western attacker air sector, with two short outgoing flight segments.
// No acquisition AI or aircraft hit is inferred from this authored bearing.
export const SECONDARY_PANTSIR_AIR_SECTOR: Vector3 = { x: 4870, y: 160, z: -1660 }
const sectorDelta = { x: SECONDARY_PANTSIR_AIR_SECTOR.x - STOP.pose.position.x, y: SECONDARY_PANTSIR_AIR_SECTOR.y - STOP.pose.position.y - 3.55, z: SECONDARY_PANTSIR_AIR_SECTOR.z - STOP.pose.position.z }
const aimYaw = Math.atan2(-sectorDelta.x, -sectorDelta.z)
const turretYaw = Math.atan2(Math.sin(aimYaw - STOP.pose.rotation.y), Math.cos(aimYaw - STOP.pose.rotation.y))
const launcherElevation = clamp(Math.atan2(sectorDelta.y, Math.hypot(sectorDelta.x, sectorDelta.z)) - STOP.pose.rotation.x, 0.08, 0.55)

/** Exact intact launcher transform: tube cap, bank elevation, turret, hull. */
export function secondaryPantsirMuzzlePosition(tubeIndex: number): Vector3 {
  const tube = new ThreeVector3(tubeIndex % 2 === 0 ? -0.19 : 0.19, (Math.floor(tubeIndex / 2) - 1) * 0.31, -2.855)
  tube.applyAxisAngle(new ThreeVector3(1, 0, 0), launcherElevation).add(new ThreeVector3(-1.18, 3.55, 0.8))
  tube.applyAxisAngle(new ThreeVector3(0, 1, 0), turretYaw).add(new ThreeVector3(0, 0, 0.7))
  return secondaryPantsirLocalToWorld(STOP.pose, { x: tube.x, y: tube.y, z: tube.z })
}
const SHOTS = SECONDARY_PANTSIR_TIMING.shots.map((launchAtSeconds, i) => {
  const origin = secondaryPantsirMuzzlePosition(i)
  const direction = new ThreeVector3(0, 0, -1).applyEuler(new Euler(launcherElevation, turretYaw, 0, 'YXZ')).applyEuler(new Euler(STOP.pose.rotation.x, STOP.pose.rotation.y, STOP.pose.rotation.z, 'YXZ'))
  const end = { x: origin.x + direction.x * 390, y: origin.y + direction.y * 390, z: origin.z + direction.z * 390 }
  return { id: `pantsir02-defensive-${i + 1}`, launchAtSeconds, durationSeconds: 1.15, origin, control: { x: lerp(origin.x, end.x, 0.5), y: lerp(origin.y, end.y, 0.5), z: lerp(origin.z, end.z, 0.5) }, end, hit: false as const }
})
const IMPACT_POSITION = secondaryPantsirLocalToWorld(STOP.pose, { x: 0.45, y: 2.9, z: 1.1 })
const GROUND_POSITION = { x: STOP.pose.position.x, y: getSecondaryPantsirSurfaceHeight(STOP.pose.position.x, STOP.pose.position.z), z: STOP.pose.position.z }

export function deriveSecondaryPantsirState(timeSeconds: number): SecondaryPantsirState {
  const time = clampSimulationTime(timeSeconds)
  const destroyed = time >= SECONDARY_PANTSIR_TIMING.destroyed
  const motion = motionAt(Math.min(time, SECONDARY_PANTSIR_TIMING.destroyed))
  const deployment = smoothstep(SECONDARY_PANTSIR_TIMING.stop, SECONDARY_PANTSIR_TIMING.ready, time)
  const scanTime = Math.max(0, Math.min(time, SECONDARY_PANTSIR_TIMING.destroyed) - SECONDARY_PANTSIR_TIMING.ready)
  const age = destroyed ? time - SECONDARY_PANTSIR_TIMING.destroyed : 0
  const phase = destroyed ? 'destroyed' : time < 112 ? 'reserve' : time < 117.2 ? 'relocating' : time < 118.8 ? 'deploying' : 'engaging'
  const activity = phase === 'relocating' && motion.acceleration < 0 ? 'braking' : phase === 'deploying' ? 'deploying-alignment' : phase
  return {
    id: 'defender_pantsir_02',
    factionId: 'island_defender',
    pathId: 'path_pantsir_relocation',
    initialFeatureId: 'corridor_pull_off_east',
    roles: ['relocation', 'secondary air-defense support'],
    phase,
    activity,
    condition: destroyed ? 'destroyed' : 'operational',
    outcome: destroyed ? 'lost' : 'active',
    status: destroyed ? 'destroyed / lost' : activity.replaceAll('-', ' '),
    pose: motion.pose,
    speedMetersPerSecond: motion.speed,
    accelerationMetersPerSecondSquared: motion.acceleration,
    travelDistanceMeters: motion.distance,
    movementDust: destroyed ? 0 : clamp(motion.speed / 7, 0, 1) * 0.25,
    mechanical: {
      wheelTravelMeters: motion.distance,
      steeringRadians: motion.steering,
      stabilizerDeployment: deployment,
      radarDeployment: deployment,
      turretYawRadians: turretYaw * deployment,
      radarRotationRadians: scanTime * 0.7,
      launcherElevationRadians: lerp(0.06, launcherElevation, deployment),
      firedTubeCount: SHOTS.filter((s) => time >= s.launchAtSeconds).length,
    },
    defensiveShots: SHOTS.map((s) => ({ ...s, active: !destroyed && time >= s.launchAtSeconds && time < s.launchAtSeconds + s.durationSeconds, ageSeconds: Math.max(0, time - s.launchAtSeconds) })),
    destruction: {
      active: destroyed,
      ageSeconds: age,
      sourceAircraftId: 'attacker_f35_01',
      impactPosition: IMPACT_POSITION,
      groundPosition: GROUND_POSITION,
      flashIntensity: destroyed ? 1 - smoothstep(0, 0.65, age) : 0,
      dustIntensity: destroyed ? 1 - smoothstep(0, 2.8, age) : 0,
      fireIntensity: destroyed ? 0.55 + 0.08 * Math.sin(age * 4.2) : 0,
      smokeIntensity: destroyed ? 0.42 + 0.16 * smoothstep(0, 3, age) : 0,
    },
  }
}
