import type { LandingCraftState, LandingParticle, LandingWorldState, LcacId } from './landingCraftTypes'

import { LANDING_SITES } from '../scene/world/landing/landingSiteData'
import { landingCoastZ } from '../scene/world/landing/landingTerrain'
import { WATER_POLYGONS } from '../scene/world/stage2/stage2Data'
import { pointInPolygon } from '../scene/world/stage2/terrainModel'
import { MAINLAND_POLYGON_XZ } from '../scene/world/worldData'
import { landingRampPoint, sampleLandingContact, solveLandingRampAngle, transformLandingPoint } from './landingCraftContact'
import { LCAC_IDS, LCAC_RAMP, LAV_GROUP_IDS, LAV_IDS } from './landingCraftData'
import { LCAC_APPROACHES } from './landingCraftPaths'
import { deriveLavPayload } from './lavDeployment'
import { smoothstep } from './math'
import { clampSimulationTime } from './time'

export const LANDING_PARTICLE_LIMIT = 48
export const LANDING_PARTICLE_LIFETIME = 3.2
export const LANDING_PARTICLE_INTERVAL = 0.22
const birthContacts = new Map<string, ReturnType<typeof sampleLandingContact>>()
const settledRampAngles = new Map<LcacId, number>()

export function classifyLandingWater(x: number, z: number): LandingCraftState['waterRegion'] {
  if (pointInPolygon(x, z, MAINLAND_POLYGON_XZ)) return 'land'
  if (pointInPolygon(x, z, WATER_POLYGONS.beachIntertidal)) return 'intertidal'
  if (pointInPolygon(x, z, WATER_POLYGONS.beachShallows)) return 'broad-shallows'
  return 'open-water'
}

function particlesFor(id: LcacId, time: number): readonly LandingParticle[] {
  if (time <= 110) return []
  const particles: LandingParticle[] = []
  const tick = Math.floor((time - 110) / LANDING_PARTICLE_INTERVAL)
  for (let offset = 0; offset < LANDING_PARTICLE_LIMIT / 3; offset++) {
    const birthIndex = tick - offset
    if (birthIndex < 0) continue
    const birth = 110 + birthIndex * LANDING_PARTICLE_INTERVAL,
      age = time - birth
    if (age >= LANDING_PARTICLE_LIFETIME) continue
    const key = `${id}:${birthIndex}`
    let contact = birthContacts.get(key)
    if (!contact) {
      contact = sampleLandingContact(id, birth)
      birthContacts.set(key, contact)
      if (birthContacts.size > 64) birthContacts.delete(birthContacts.keys().next().value!)
    }
    const route = LCAC_APPROACHES[contact.motion.index]!
    const side = birthIndex % 2 ? -1 : 1
    for (const kind of ['water', 'spray', 'sand'] as const) {
      const local = { x: kind === 'water' ? 0 : side * 7, y: kind === 'spray' ? 0.5 : 0, z: kind === 'sand' ? -7 : 11 }
      const p = transformLandingPoint(contact.pose, local)
      const onLand = p.z >= landingCoastZ(p.x)
      if (kind === 'sand' ? !onLand : onLand) continue
      const moving = smoothstep(0, 4, contact.motion.speedMetersPerSecond)
      const strength = kind === 'sand' ? (0.08 + moving * 0.25) * contact.landContactFraction : moving * (1 - contact.landContactFraction * 0.8) * 0.22
      if (strength <= 0 || birth > route.rampReadyAtSeconds + 1) continue
      const fade = Math.sin((Math.PI * age) / LANDING_PARTICLE_LIFETIME) ** 2
      particles.push({
        id: `${id}-${kind}-${birthIndex}`,
        kind,
        birthAtSeconds: birth,
        ageSeconds: age,
        position: { x: p.x + side * age * (kind === 'water' ? 0.1 : 1.3), y: kind === 'water' ? -0.085 : p.y + age * (kind === 'spray' ? 1.05 : 0.45), z: p.z },
        scale: kind === 'water' ? { x: 5 + age * 1.8, y: 0.035, z: 3 + age * 3.2 } : { x: 0.55 + age * 0.8, y: 0.3 + age * 0.55, z: 0.6 + age },
        opacity: strength * fade,
      })
    }
  }
  return particles
}

export function deriveLandingCraft(id: LcacId, timeSeconds: number): LandingCraftState {
  const time = clampSimulationTime(timeSeconds),
    contact = sampleLandingContact(id, time),
    { motion, pose, landContactFraction, skirtCompression, deckLocalY } = contact
  const route = LCAC_APPROACHES[motion.index]!,
    site = LANDING_SITES[motion.index]!
  const bowRampProgress = smoothstep(route.beachAtSeconds, route.rampReadyAtSeconds, time)
  let contactAngle = LCAC_RAMP.closedAngle
  if (bowRampProgress > 0) {
    contactAngle = time >= route.beachAtSeconds + 0.75 ? (settledRampAngles.get(id) ?? solveLandingRampAngle(pose, deckLocalY)) : solveLandingRampAngle(pose, deckLocalY)
    if (time >= route.beachAtSeconds + 0.75) settledRampAngles.set(id, contactAngle)
  }
  const bowRampAngleRadians = LCAC_RAMP.closedAngle + (contactAngle - LCAC_RAMP.closedAngle) * bowRampProgress
  const activity = time < 110 ? 'holding' : time < 113 ? 'departing' : time >= route.rampReadyAtSeconds ? 'beached-ready' : time >= route.beachAtSeconds ? 'ramp-lowering' : landContactFraction > 0 ? 'shore-contact' : time >= route.gateAtSeconds ? 'final-nearshore' : 'approaching'
  return {
    id,
    factionId: 'landings_attacker',
    vehicleType: 'LCAC',
    payloadGroupId: LAV_GROUP_IDS[motion.index]!,
    payloadIds: LAV_IDS.slice(motion.index * 4, motion.index * 4 + 4),
    activity,
    condition: 'operational',
    outcome: 'active',
    pathId: route.pathId as LandingCraftState['pathId'],
    stagingRegionId: 'region_e_remote_beachhead',
    stagingFeatureId: site.holdingFeatureId,
    nearshoreFeatureId: site.gateFeatureId,
    waterRegion: classifyLandingWater(pose.position.x, pose.position.z),
    nearshoreGateReached: time >= route.gateAtSeconds,
    pose,
    speedMetersPerSecond: motion.speedMetersPerSecond,
    accelerationMetersPerSecondSquared: motion.accelerationMetersPerSecondSquared,
    travelDistanceMeters: motion.distanceMeters,
    landContactFraction,
    mechanics: {
      fanRotationRadians: time * 8 + motion.distanceMeters * 5,
      fanPower: 0.18 + smoothstep(0, 15, motion.speedMetersPerSecond) * 0.82,
      skirtCompression,
      deckLocalY,
      bowRampAngleRadians,
      bowRampProgress,
      bowRampReady: time >= route.rampReadyAtSeconds,
      rampTipPosition: landingRampPoint(pose, deckLocalY, bowRampAngleRadians, 0),
      sternRampClosed: true,
      navigationLight: 0.55 + 0.45 * Math.sin(time * 2.5) ** 2,
    },
    particles: particlesFor(id, time),
  }
}

export function deriveLandingWorldState(timeSeconds: number): LandingWorldState {
  const craftList = LCAC_IDS.map((id) => deriveLandingCraft(id, timeSeconds))
  const crafts = Object.fromEntries(craftList.map((craft) => [craft.id, craft])) as LandingWorldState['crafts']
  const time = clampSimulationTime(timeSeconds)
  const payload = Object.fromEntries(craftList.flatMap((craft) => craft.payloadIds.map((id, slot) => [id, deriveLavPayload(craft, id, slot, time)]))) as LandingWorldState['payload']
  const groups = Object.fromEntries(
    craftList.map((craft) => {
      const vehicles = craft.payloadIds.map((id) => payload[id])
      const embarkedCount = vehicles.filter((v) => v.occupancy === 'embarked').length
      const ashoreCount = vehicles.filter((v) => v.occupancy === 'ashore').length
      return [
        craft.payloadGroupId,
        {
          id: craft.payloadGroupId,
          payloadIds: craft.payloadIds,
          activity: ashoreCount === 4 ? 'deployed' : ashoreCount > 0 ? 'inland-advance' : vehicles.some((v) => v.activity !== 'embarked') ? 'unloading' : 'embarked',
          embarkedCount,
          transferringCount: 4 - embarkedCount - ashoreCount,
          ashoreCount,
          operationalCount: 4,
        },
      ]
    }),
  ) as LandingWorldState['groups']
  const values = Object.values(groups)
  return {
    orderedCraftIds: LCAC_IDS,
    crafts,
    orderedPayloadIds: LAV_IDS,
    payload,
    groups,
    embarkedCount: values.reduce((n, g) => n + g.embarkedCount, 0),
    transferringCount: values.reduce((n, g) => n + g.transferringCount, 0),
    ashoreCount: values.reduce((n, g) => n + g.ashoreCount, 0),
    operationalCraftCount: 2,
    operationalPayloadCount: 8,
  }
}
