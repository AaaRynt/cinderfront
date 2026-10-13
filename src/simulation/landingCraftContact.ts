import { Euler, Quaternion, Vector3 as ThreeVector3 } from 'three'

import type { LcacId } from './landingCraftTypes'
import type { Pose3, Vector3 } from './types'

import { getLandingSupportHeight } from '../scene/world/landing/landingTerrain'
import { pointInPolygon } from '../scene/world/stage2/terrainModel'
import { MAINLAND_POLYGON_XZ } from '../scene/world/worldData'
import { createGroundedPose } from './groundMotion'
import { LCAC_DECK_HEIGHT, LCAC_SETTLED_DECK_HEIGHT, LCAC_RAMP, LCAC_SKIRT_PERIMETER } from './landingCraftData'
import { LCAC_APPROACHES, sampleLandingMotion } from './landingCraftPaths'
import { clamp, smoothstep } from './math'

export const LANDING_CONTACT_POINTS = [...LCAC_SKIRT_PERIMETER, ...Array.from({ length: 7 }, (_, i) => Array.from({ length: 5 }, (_, j) => [-6 + j * 3, -12 + i * 4] as const)).flat()] as const

export function landingQuaternion(pose: Pose3) {
  return new Quaternion().setFromEuler(new Euler(pose.rotation.x, pose.rotation.y, pose.rotation.z, 'YXZ'))
}
export function transformLandingPoint(pose: Pose3, point: Vector3): Vector3 {
  const p = new ThreeVector3(point.x, point.y, point.z).applyQuaternion(landingQuaternion(pose)).add(new ThreeVector3(pose.position.x, pose.position.y, pose.position.z))
  return { x: p.x, y: p.y, z: p.z }
}

/** Datum is the skirt's actual lower edge, not the center of a boat hull. */
export function sampleLandingContact(id: LcacId, time: number) {
  const motion = sampleLandingMotion(id, time)
  const arrival = LCAC_APPROACHES[motion.index]!.beachAtSeconds
  const raw = createGroundedPose({ position: [motion.x, motion.z], hullTangent: [motion.tangentX, motion.tangentZ], halfLengthMeters: 12, halfWidthMeters: 6.8, heightMeters: 0, groundClearanceMeters: 0, surfaceHeightAt: getLandingSupportHeight })
  const rotation = { x: clamp(raw.rotation.x, -0.13, 0.13), y: raw.rotation.y, z: clamp(raw.rotation.z, -0.08, 0.08) }
  // Settle to the crossfall at the eventual ramp landing, rather than leaving
  // one end of a wide rigid tip hanging above a different local beach slope.
  let terminalRoll = rotation.z
  for (let i = 0; i < 4; i++) {
    const trial = { position: { x: motion.x, y: 0, z: motion.z }, rotation: { ...rotation, z: terminalRoll } }
    const left = transformLandingPoint(trial, { x: -LCAC_RAMP.width / 2, y: 0, z: -16 })
    const right = transformLandingPoint(trial, { x: LCAC_RAMP.width / 2, y: 0, z: -16 })
    terminalRoll = clamp(Math.asin(clamp((getLandingSupportHeight(right.x, right.z) - getLandingSupportHeight(left.x, left.z)) / (LCAC_RAMP.width * Math.cos(rotation.x)), -1, 1)), -0.08, 0.08)
  }
  rotation.z += (terminalRoll - rotation.z) * smoothstep(arrival - 4, arrival + 0.75, time)
  const quaternion = landingQuaternion({ position: { x: 0, y: 0, z: 0 }, rotation })
  let supportY = -Infinity,
    onLand = 0
  for (const [x, z] of LANDING_CONTACT_POINTS) {
    const point = new ThreeVector3(x, 0, z).applyQuaternion(quaternion)
    const wx = motion.x + point.x,
      wz = motion.z + point.z
    supportY = Math.max(supportY, getLandingSupportHeight(wx, wz) - point.y)
    onLand += Number(pointInPolygon(wx, wz, MAINLAND_POLYGON_XZ))
  }
  const landContactFraction = onLand / LANDING_CONTACT_POINTS.length
  const skirtCompression = smoothstep(arrival - 1.5, arrival + 0.75, time) * landContactFraction
  const gap = 0.2 - 0.18 * smoothstep(arrival - 2.5, arrival + 0.75, time)
  const pose = { position: { x: motion.x, y: supportY + gap, z: motion.z }, rotation }
  const deckLocalY = LCAC_DECK_HEIGHT + (LCAC_SETTLED_DECK_HEIGHT - LCAC_DECK_HEIGHT) * skirtCompression
  return { motion, pose, landContactFraction, skirtCompression, deckLocalY }
}

/** Top/bottom panel coordinates use the very same hinge and thickness as JSX. */
export function landingRampPoint(pose: Pose3, deckY: number, angle: number, x: number, station: number = LCAC_RAMP.length, underside = true) {
  const y = underside ? -LCAC_RAMP.thickness : 0
  return transformLandingPoint(pose, { x, y: deckY + y * Math.cos(angle) + station * Math.sin(angle), z: LCAC_RAMP.hingeZ + y * Math.sin(angle) - station * Math.cos(angle) })
}
export function landingRampClearance(pose: Pose3, deckY: number, angle: number) {
  return Math.min(
    ...Array.from({ length: 17 }, (_, i) => {
      const p = landingRampPoint(pose, deckY, angle, -LCAC_RAMP.width / 2 + (LCAC_RAMP.width * i) / 16)
      return p.y - getLandingSupportHeight(p.x, p.z)
    }),
  )
}
export function solveLandingRampAngle(pose: Pose3, deckY: number) {
  let low = -0.55,
    high = 0.1
  for (let i = 0; i < 40; i++) {
    const angle = (low + high) / 2
    if (landingRampClearance(pose, deckY, angle) < 0.003) low = angle
    else high = angle
  }
  return (low + high) / 2
}
