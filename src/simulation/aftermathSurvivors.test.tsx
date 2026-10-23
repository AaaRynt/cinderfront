/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { Euler, Group, Mesh, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import type { SupportVehicleState } from './supportConvoyTypes'
import type { Btr80GroundVehicleState, GroundVehicleMotionState, T72GroundVehicleState } from './types'

import { MOLNIYA_HULL_SECTIONS } from '../scene/vehicles/navalModelData'
import { WaspModel } from '../scene/vehicles/WaspModel'
import { createExistingLandscapeEnvelopes } from '../scene/world/landscape/landscapeReservations'
import { createTreeLayout } from '../scene/world/landscape/treeLayout'
import { AMMUNITION_BUNKERS, CORRIDOR_FEATURES, FUEL_BUND_CELLS, FUEL_PIPE_DEFINITIONS, HARBOR_FEATURES, INDUSTRIAL_FEATURES, PIPELINE_HARBOR_FUEL_TRUNK, POWER_LINES, RAIL_DEFINITIONS, ROAD_DEFINITIONS, SECURITY_FENCES } from '../scene/world/stage2/stage2Data'
import { distanceToPolyline, pointInPolygon } from '../scene/world/stage2/terrainModel'
import { AAA_SITE, COMMUNICATIONS_MAST_SITE, MAINLAND_POLYGON_XZ, MAP_BOUNDS, RADAR_SEARCH_SITE, RADAR_SUPPORT_POLYGONS, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../scene/world/worldData'
import { appendModel } from '../test/inspectModel'
import { deriveRuntimeBtrGroupState, deriveRuntimeMolniyaState, deriveRuntimeSupportConvoyState, deriveRuntimeSurvivors, deriveRuntimeT72GroupState, deriveRuntimeWaspState, getMolniyaRuntimePresentation, sampleSurvivorBraking, SURVIVOR_CONTINUATION_LIMITS } from './aftermathSurvivors'
import { deriveSimulationWorldState } from './derive'
import { BTR80_DIMENSIONS_METERS, deriveBtr80GroupState, deriveT72GroupState, getBtr80PresentationSurfaceHeight, getT72PresentationSurfaceHeight, T72_DIMENSIONS_METERS } from './groundVehicles'
import { deriveMolniyaState } from './stage3'
import { deriveSupportConvoyState, getSupportPresentationSurfaceHeight, SUPPORT_DIMENSIONS, SUPPORT_WHEEL_RADIUS_METERS } from './supportConvoy'

const boundary = deriveSimulationWorldState(180)
const distance = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z)
const angularDistance = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
type ContinuedGround = Btr80GroundVehicleState | T72GroundVehicleState | SupportVehicleState
function ground(time: number): ContinuedGround[] {
  return [...Object.values(deriveRuntimeBtrGroupState(time).vehicles), ...Object.values(deriveRuntimeT72GroupState(time).vehicles), ...Object.values(deriveRuntimeSupportConvoyState(time).convoy.vehicles)]
}
function radius(v: ContinuedGround) {
  if (v.vehicleType === 'BTR-80') return Math.hypot(BTR80_DIMENSIONS_METERS.length, BTR80_DIMENSIONS_METERS.width) / 2 + 2
  if (v.vehicleType === 'T-72B') return Math.hypot(T72_DIMENSIONS_METERS.gunForwardLength - T72_DIMENSIONS_METERS.hullLength / 2, T72_DIMENSIONS_METERS.width / 2) + 2
  const d = SUPPORT_DIMENSIONS[v.subtype]
  return Math.hypot(d.length, d.width) / 2 + 2
}
function worldPoint(v: GroundVehicleMotionState, x: number, y: number, z: number) {
  const p = v.pose.position,
    r = v.pose.rotation
  return new Vector3(x, y, z).applyEuler(new Euler(r.x, r.y, r.z, 'YXZ')).add(new Vector3(p.x, p.y, p.z))
}

describe('Stage 6B bounded survivor continuation', () => {
  it('returns every original actor field exactly through the scripted endpoint', () => {
    for (const time of [0, 74.9, 75, 118, 128, 133, 158, 163, 174, 179.9, 180]) {
      const original = deriveSimulationWorldState(time),
        result = deriveRuntimeSurvivors(time, original)
      expect(result.wasp).toBe(original.wasp)
      expect(result.molniya).toBe(original.stage3.molniya)
      expect(result.stage4b).toBe(original.stage4b)
      expect(result.stage4b2c).toBe(original.stage4b2c)
      expect(deriveRuntimeBtrGroupState(time)).toEqual(deriveBtr80GroupState(time))
      expect(deriveRuntimeT72GroupState(time)).toEqual(deriveT72GroupState(time))
      expect(deriveRuntimeSupportConvoyState(time)).toEqual(deriveSupportConvoyState(time))
    }
  })

  it('preserves handoff position, signed wheels, speed, damage age and machinery phase', () => {
    const epsilon = 0.00001,
      before = ground(180),
      after = ground(180 + epsilon)
    for (let i = 0; i < before.length; i++) {
      const a = before[i]!,
        b = after[i]!
      expect(b.id).toBe(a.id)
      expect(distance(a.pose.position, b.pose.position)).toBeLessThan(0.00017)
      expect(Math.abs(a.pose.position.y - b.pose.position.y)).toBeLessThan(0.0001)
      expect(angularDistance(a.pose.rotation.y, b.pose.rotation.y)).toBeLessThan(0.00001)
      expect(Math.abs(a.speedMetersPerSecond - b.speedMetersPerSecond)).toBeLessThan(0.00001)
      expect(Math.abs(a.traveledDistanceMeters - b.traveledDistanceMeters)).toBeLessThan(0.00017)
      expect(b.physicalCondition).toBe(a.physicalCondition)
      expect(b.outcome).toBe(a.outcome)
      if ('damage' in a && 'damage' in b) {
        expect(b.damage.ageSeconds).toBeCloseTo(a.damage.ageSeconds + (a.damage.causeEventId ? epsilon : 0), 8)
        expect(b.damage.hullDamageProgress).toBe(a.damage.hullDamageProgress)
      }
      if ('lighting' in a && 'lighting' in b) expect(b.lighting.beaconIntensity).toBe(a.lighting.beaconIntensity)
    }
    const wasp = deriveRuntimeWaspState(180 + epsilon, boundary.wasp),
      molniya = deriveRuntimeMolniyaState(180 + epsilon)
    for (const [a, b] of [
      [boundary.wasp, wasp],
      [boundary.stage3.molniya, molniya],
    ]) {
      expect(distance(a.pose.position, b.pose.position)).toBeLessThan(0.00016)
      expect(Math.abs(a.pose.position.y - b.pose.position.y)).toBeLessThan(0.00001)
      expect(angularDistance(a.pose.rotation.y, b.pose.rotation.y)).toBeLessThan(0.00001)
      expect(Math.abs(a.pose.rotation.x - b.pose.rotation.x)).toBeLessThan(0.00001)
      expect(Math.abs(a.pose.rotation.z - b.pose.rotation.z)).toBeLessThan(0.00001)
    }
  })

  it('integrates bounded braking, actual translation and signed running gear without path-end spinning', () => {
    const maxima = { speed: 0, acceleration: 0, headingRate: 0, speedError: 0, wheelError: 0 }
    for (let tick = 0; tick <= 880; tick++) {
      const t = 180 + tick * 0.05,
        list = ground(t),
        next = ground(t + 0.05)
      for (let i = 0; i < list.length; i++) {
        const v = list[i]!,
          n = next[i]!,
          averageSpeed = (v.speedMetersPerSecond + n.speedMetersPerSecond) / 2
        maxima.speed = Math.max(maxima.speed, v.speedMetersPerSecond)
        maxima.acceleration = Math.max(maxima.acceleration, Math.abs(v.accelerationMetersPerSecondSquared))
        maxima.headingRate = Math.max(maxima.headingRate, angularDistance(v.pose.rotation.y, n.pose.rotation.y) / 0.05)
        maxima.speedError = Math.max(maxima.speedError, Math.abs(distance(v.pose.position, n.pose.position) / 0.05 - averageSpeed))
        const signedAverage = (v.longitudinalSpeedMetersPerSecond + n.longitudinalSpeedMetersPerSecond) / 2
        maxima.wheelError = Math.max(maxima.wheelError, Math.abs((n.traveledDistanceMeters - v.traveledDistanceMeters) / 0.05 - signedAverage))
        if (v.drivetrain.kind === 'wheeled') expect(v.drivetrain.wheelRotationRadians).toBe(v.traveledDistanceMeters / (v.vehicleType === 'BTR-80' ? BTR80_DIMENSIONS_METERS.wheelRadius : SUPPORT_WHEEL_RADIUS_METERS))
        else {
          expect(v.drivetrain.trackTravelMeters).toBe(v.traveledDistanceMeters)
          expect(v.drivetrain.roadWheelRotationRadians).toBe(v.traveledDistanceMeters / T72_DIMENSIONS_METERS.roadWheelRadius)
        }
        if (v.speedMetersPerSecond > 0.001) {
          const hullDot = -Math.sin(v.pose.rotation.y) * v.routeTangent.x - Math.cos(v.pose.rotation.y) * v.routeTangent.z
          expect(hullDot).toBeCloseTo(v.motionDirection === 'reverse' ? -1 : 1, 5)
        }
      }
    }
    expect(maxima.speed).toBeLessThanOrEqual(16)
    expect(maxima.acceleration).toBeLessThanOrEqual(3.375)
    expect(maxima.headingRate).toBeLessThan(0.0001)
    expect(maxima.speedError).toBeLessThan(0.003)
    expect(maxima.wheelError).toBeLessThan(0.003)
    for (const time of [224, 240, 360, 600, 1800, 3600, 7200])
      for (const [i, vehicle] of ground(time).entries()) {
        const held = ground(224)[i]!
        expect(vehicle.pose).toEqual(held.pose)
        expect(vehicle.drivetrain).toEqual(held.drivetrain)
        expect(vehicle).toMatchObject({ speedMetersPerSecond: 0, longitudinalSpeedMetersPerSecond: 0, motionDirection: 'stationary', dustIntensity: 0 })
      }
    expect(deriveRuntimeBtrGroupState(187.5).withdrawingCount).toBe(0)
    expect(deriveRuntimeT72GroupState(182).withdrawingCount).toBe(0)
    expect(deriveRuntimeSupportConvoyState(224).convoy).toMatchObject({ holdingCount: 6, repositioningCount: 0, withdrawingCount: 0 })
    for (const [seconds, cruise] of [
      [7.5, 0],
      [2, 0],
      [6, 0],
      [6, 38],
    ]) {
      expect(sampleSurvivorBraking(cruise!, seconds!, cruise!)).toMatchObject({ equivalentSeconds: cruise, velocityScale: 1, accelerationScale: 0 })
      expect(sampleSurvivorBraking(cruise! + seconds!, seconds!, cruise!)).toMatchObject({ equivalentSeconds: cruise! + seconds! / 2, velocityScale: 0, accelerationScale: 0, stopped: true })
    }
    if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1') writeFileSync('stage6b-review.local/survivor-motion.json', JSON.stringify({ maxima, limits: SURVIVOR_CONTINUATION_LIMITS, anchors: ground(180), holds: ground(224) }, null, 2))
  })

  it('retains destroyed/disabled anchors and irreversible damage during arbitrary seeks', () => {
    const btr = boundary.stage4b.btrGroup.vehicles.defender_btr_01,
      tank = boundary.stage4b.t72Group.vehicles.defender_t72_01
    for (const time of [180, 180.1, 188, 240, 600, 1800, 3600, 7200]) {
      for (const [old, current] of [
        [btr, deriveRuntimeBtrGroupState(time).vehicles.defender_btr_01],
        [tank, deriveRuntimeT72GroupState(time).vehicles.defender_t72_01],
      ]) {
        expect(current.pose).toEqual(old.pose)
        expect(current.drivetrain).toEqual(old.drivetrain)
        expect(current.damage).toEqual({ ...old.damage, ageSeconds: old.damage.ageSeconds + time - 180 })
        expect(current.outcome).toBe('lost')
      }
      const direct = deriveRuntimeSurvivors(time, boundary)
      deriveRuntimeSurvivors(7200, boundary)
      deriveRuntimeSurvivors(0, deriveSimulationWorldState(0))
      expect(deriveRuntimeSurvivors(time, boundary)).toEqual(direct)
      expect(direct.stage4b.btrGroup.survivorCount).toBe(3)
      expect(direct.stage4b.t72Group.survivorCount).toBe(2)
      expect(direct.stage4b2c.convoy.survivorCount).toBe(6)
    }
  })

  it('keeps complete ground hull/gun/wheel envelopes clear of all scenery, infrastructure and each other', () => {
    const scenery = [...createExistingLandscapeEnvelopes(), ...createTreeLayout().map((t) => ({ kind: 'circle' as const, id: t.id, center: [t.position[0], t.position[2]] as const, radius: t.radius }))]
    const obstacles = [
      CORRIDOR_FEATURES.bridge,
      CORRIDOR_FEATURES.substation,
      [
        [5520, 370],
        [5750, 370],
        [5750, 190],
        [5520, 190],
      ] as const,
      ...HARBOR_FEATURES.warehouses.map((v) => v.points),
      ...[...HARBOR_FEATURES.piers, ...HARBOR_FEATURES.jetties, ...HARBOR_FEATURES.breakwaters, HARBOR_FEATURES.electricalServiceFacility, HARBOR_FEATURES.defenseEmplacement].map((v) => v.points),
      ...FUEL_BUND_CELLS.map((v) => v.points),
      ...AMMUNITION_BUNKERS.map((v) => v.berm),
      ...INDUSTRIAL_FEATURES.utilities.map((v) => v.points),
      ...RADAR_SUPPORT_POLYGONS,
    ]
    const linearObstacles = [
      ...SECURITY_FENCES,
      ...RAIL_DEFINITIONS.map((v) => v.points),
      ...FUEL_PIPE_DEFINITIONS.map((v) => v.points),
      PIPELINE_HARBOR_FUEL_TRUNK,
      [
        [5425, 430],
        [6075, 430],
      ] as const,
    ]
    const equipment = [
      ...[RADAR_SEARCH_SITE, RADAR_TRACKING_SITE, ...SAM_PAD_POSITIONS, AAA_SITE, COMMUNICATIONS_MAST_SITE].map((v) => ({ x: v.position[0], z: v.position[2], radius: 'radiusM' in v ? v.radiusM : 2 })),
      ...[
        [5580, 170],
        [5450, 390],
        [6000, 390],
        [6200, 650],
        [5900, 400],
      ].map(([x, z]) => ({ x: x!, z: z!, radius: 2 })),
    ]
    const min = { scenery: Infinity, actors: Infinity, infrastructure: Infinity, btrScenery: Infinity, t72Scenery: Infinity, supportScenery: Infinity, t72RearRouteMargin: Infinity }
    for (let tick = 0; tick <= 352; tick++) {
      const list = ground(180 + tick / 8)
      for (const [i, v] of list.entries()) {
        const p = v.pose.position,
          r = radius(v)
        for (const s of scenery) {
          if (s.kind !== 'circle') throw new Error('Unexpected non-circular scenery envelope')
          const gap = Math.hypot(p.x - s.center[0], p.z - s.center[1]) - r - s.radius
          min.scenery = Math.min(min.scenery, gap)
          const key = v.vehicleType === 'BTR-80' ? 'btrScenery' : v.vehicleType === 'T-72B' ? 't72Scenery' : 'supportScenery'
          min[key] = Math.min(min[key], gap)
        }
        for (const polygon of obstacles) {
          expect(pointInPolygon(p.x, p.z, polygon)).toBe(false)
          min.infrastructure = Math.min(min.infrastructure, distanceToPolyline(p.x, p.z, [...polygon, polygon[0]!]) - r)
        }
        for (const line of linearObstacles) min.infrastructure = Math.min(min.infrastructure, distanceToPolyline(p.x, p.z, line) - r - 1)
        for (const fixture of equipment) min.infrastructure = Math.min(min.infrastructure, distance(p, fixture) - r - fixture.radius)
        for (const other of list.slice(i + 1)) min.actors = Math.min(min.actors, distance(p, other.pose.position) - r - radius(other))
        if (v.vehicleType === 'T-72B') min.t72RearRouteMargin = Math.min(min.t72RearRouteMargin, p.x - T72_DIMENSIONS_METERS.hullLength / 2 - 5967)
        if (v.vehicleType === 'support_vehicle') {
          const road = ROAD_DEFINITIONS.find((r) => r.id === 'road_rescue_branch')!
          expect(distanceToPolyline(p.x, p.z, road.points) + SUPPORT_DIMENSIONS[v.subtype].width / 2).toBeLessThan(road.widthM / 2)
          expect(distanceToPolyline(p.x, p.z, POWER_LINES[0]) - r).toBeGreaterThan(5)
        }
      }
    }
    expect(scenery).toHaveLength(5748)
    expect(min.scenery).toBeGreaterThan(40)
    expect(min.actors).toBeGreaterThan(4)
    expect(min.infrastructure).toBeGreaterThan(20)
    expect(min.t72RearRouteMargin).toBeGreaterThan(0.9)
    if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1') writeFileSync('stage6b-review.local/survivor-clearance.json', JSON.stringify({ samples: 353, stepSeconds: 0.125, sceneryEnvelopes: scenery.length, conservativeRadiiInclude: 'hull, gun, wheels, suspension/cant plus 2 m margin', min }, null, 2))
  }, 20000)

  it('keeps wheels, tracks and chassis grounded on their existing rendered support surfaces', () => {
    let maxContactError = 0,
      maxPitch = 0,
      maxRoll = 0
    for (let tick = 0; tick <= 176; tick++)
      for (const v of ground(180 + tick / 4)) {
        const isBtr = v.vehicleType === 'BTR-80',
          isTank = v.vehicleType === 'T-72B'
        const height = isBtr ? BTR80_DIMENSIONS_METERS.height : isTank ? T72_DIMENSIONS_METERS.height : SUPPORT_DIMENSIONS[v.subtype].height
        const halfWidth = isBtr ? 1.255 : isTank ? 1.48 : SUPPORT_DIMENSIONS[v.subtype].width / 2 - 0.15
        const contacts = isBtr ? [-2.55, -1.25, 1.05, 2.4] : isTank ? [-2.32, -1.4, -0.47, 0.47, 1.4, 2.32] : [-2.6, 1.25, 2.6]
        const surface = isBtr ? getBtr80PresentationSurfaceHeight : isTank ? getT72PresentationSurfaceHeight : getSupportPresentationSurfaceHeight
        maxPitch = Math.max(maxPitch, Math.abs(v.pose.rotation.x))
        maxRoll = Math.max(maxRoll, Math.abs(v.pose.rotation.z))
        if (v.physicalCondition === 'operational')
          for (const side of [-1, 1])
            for (const z of contacts) {
              const contact = worldPoint(v, side * halfWidth, -height / 2, z)
              maxContactError = Math.max(maxContactError, Math.abs(contact.y - surface(contact.x, contact.z)))
            }
        const bottom = worldPoint(v, 0, isBtr ? -0.72 : isTank ? -0.58 : -height / 2 + 0.62, 0)
        expect(bottom.y).toBeGreaterThan(surface(bottom.x, bottom.z))
      }
    expect(maxContactError).toBeLessThan(0.16)
    expect(maxPitch).toBeLessThan(0.18)
    expect(maxRoll).toBeLessThan(0.18)
    if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1') writeFileSync('stage6b-review.local/survivor-contact.json', JSON.stringify({ maxContactError, maxPitch, maxRoll }, null, 2))
  })

  it('patrols with continuous velocity/seams and keeps the complete rendered Wasp and wake offshore', () => {
    const model = new Group()
    appendModel(model, <WaspModel wakeStrength={0.72} />)
    model.updateMatrixWorld(true)
    const vertices: Vector3[] = []
    model.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.computeBoundingBox()
        const b = o.geometry.boundingBox!
        for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) vertices.push(new Vector3(x, y, z).applyMatrix4(o.matrixWorld))
      }
    })
    let coastGap = Infinity,
      mapGap = Infinity,
      vesselGap = Infinity,
      maxSpeedError = 0,
      maxYawRate = 0
    const { periodSeconds, speedMetersPerSecond } = SURVIVOR_CONTINUATION_LIMITS.wasp
    for (let tick = 0; tick <= 1440; tick++) {
      const time = 180 + (tick / 1440) * periodSeconds,
        current = deriveRuntimeWaspState(time, boundary.wasp),
        after = deriveRuntimeWaspState(time + 0.01, boundary.wasp),
        p = current.pose.position,
        r = current.pose.rotation
      maxSpeedError = Math.max(maxSpeedError, Math.abs(distance(p, after.pose.position) / 0.01 - speedMetersPerSecond))
      maxYawRate = Math.max(maxYawRate, angularDistance(r.y, after.pose.rotation.y) / 0.01)
      vesselGap = Math.min(vesselGap, distance(p, boundary.stage3.talwar.pose.position) - 240 - 80, distance(p, boundary.stage3.molniya.pose.position) - 240 - 35)
      const transform = new Euler(r.x, r.y, r.z, 'XYZ')
      for (const local of vertices) {
        const v = local
          .clone()
          .applyEuler(transform)
          .add(new Vector3(p.x, p.y, p.z))
        expect(pointInPolygon(v.x, v.z, MAINLAND_POLYGON_XZ)).toBe(false)
        coastGap = Math.min(coastGap, distanceToPolyline(v.x, v.z, [...MAINLAND_POLYGON_XZ, MAINLAND_POLYGON_XZ[0]!]))
        mapGap = Math.min(mapGap, v.x - MAP_BOUNDS.xMin, MAP_BOUNDS.xMax - v.x, v.z - MAP_BOUNDS.zMin, MAP_BOUNDS.zMax - v.z)
      }
    }
    expect(maxSpeedError).toBeLessThan(0.00001)
    expect(maxYawRate).toBeLessThan(0.014)
    expect(coastGap).toBeGreaterThan(1000)
    expect(mapGap).toBeGreaterThan(500)
    expect(vesselGap).toBeGreaterThan(4000)
    for (const seam of [180, 180 + periodSeconds, 180 + 2 * periodSeconds, 180 + 10 * periodSeconds]) {
      const before = seam === 180 ? deriveSimulationWorldState(179.999).wasp : deriveRuntimeWaspState(seam - 0.001, boundary.wasp),
        at = deriveRuntimeWaspState(seam, boundary.wasp),
        after = deriveRuntimeWaspState(seam + 0.001, boundary.wasp)
      expect(distance(before.pose.position, at.pose.position)).toBeCloseTo(speedMetersPerSecond * 0.001, 6)
      expect(distance(after.pose.position, at.pose.position)).toBeCloseTo(speedMetersPerSecond * 0.001, 6)
      expect(angularDistance(before.pose.rotation.y, after.pose.rotation.y)).toBeLessThan(0.00003)
    }
    if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1') writeFileSync('stage6b-review.local/wasp-clearance.json', JSON.stringify({ samples: 1441, completeRenderedEnvelopeVertices: vertices.length, coastGap, mapGap, vesselGap, maxSpeedError, maxYawRate, speedMetersPerSecond, periodSeconds }, null, 2))
  }, 20000)

  it('finishes Molniya damaged withdrawal with a measured full-hull departure and finite survivor hold', () => {
    const { firstHullExitSeconds: first, fullHullExitSeconds: full, terminalSeconds: terminal, xEnvelopeMeters: extent } = SURVIVOR_CONTINUATION_LIMITS.molniya
    expect(first).toBeGreaterThan(180)
    expect(full).toBeGreaterThan(first)
    expect(terminal).toBeGreaterThan(full)
    expect(deriveRuntimeMolniyaState(first).pose.position.x - extent).toBeCloseTo(MAP_BOUNDS.xMin, 8)
    expect(deriveRuntimeMolniyaState(full).pose.position.x + extent).toBeCloseTo(MAP_BOUNDS.xMin, 8)
    expect(getMolniyaRuntimePresentation(first)).toMatchObject({ visible: true, opacity: 1, mapPresence: 'present' })
    expect(getMolniyaRuntimePresentation((first + full) / 2).opacity).toBeCloseTo(0.5, 8)
    expect(getMolniyaRuntimePresentation(full)).toMatchObject({ visible: false, opacity: 0, mapPresence: 'departed', emissionEndSeconds: full })
    for (const time of [180, 240, first, (first + full) / 2, full, terminal, 600, 1800, 3600, 7200]) {
      const state = deriveRuntimeMolniyaState(time),
        p = state.pose.position,
        r = state.pose.rotation
      expect(state).toMatchObject({ damaged: true, escaped: true, phase: 'escaped-into-open-water' })
      expect(p.x).toBeGreaterThanOrEqual(-7100.000001)
      for (const section of MOLNIYA_HULL_SECTIONS)
        for (const side of [-1, 1]) {
          const v = new Vector3(side * section.deckHalfWidth, section.deckY, section.z).applyEuler(new Euler(r.x, r.y, r.z)).add(new Vector3(p.x, p.y, p.z))
          expect(pointInPolygon(v.x, v.z, MAINLAND_POLYGON_XZ)).toBe(false)
          expect(Math.abs(v.x - p.x)).toBeLessThan(extent)
          if (time >= full) expect(v.x).toBeLessThan(MAP_BOUNDS.xMin)
        }
      if (time >= terminal) {
        expect(state.pose).toEqual(deriveRuntimeMolniyaState(terminal).pose)
        expect(state).toMatchObject({ speedMetersPerSecond: 0, wakeStrength: 0, smokeIntensity: 0, localFireIntensity: 0 })
      }
    }
    expect(deriveRuntimeMolniyaState(179)).toEqual(deriveMolniyaState(179))
  })

  it('keeps only periodic ship phases bounded at enormous finite observation times', () => {
    for (const time of [7200, 1e12, 1e100, Number.MAX_VALUE]) {
      const state = deriveRuntimeWaspState(time, boundary.wasp),
        p = state.pose.position,
        r = state.pose.rotation
      expect(Object.values(p).every(Number.isFinite)).toBe(true)
      expect(Object.values(r).every(Number.isFinite)).toBe(true)
      expect(Math.hypot(p.x - SURVIVOR_CONTINUATION_LIMITS.wasp.center.x, p.z - SURVIVOR_CONTINUATION_LIMITS.wasp.center.z)).toBeCloseTo(850, 8)
      expect(Math.abs(r.x)).toBeLessThanOrEqual(0.004)
      expect(Math.abs(r.z)).toBeLessThanOrEqual(0.007)
      expect(Math.abs(p.y)).toBeLessThanOrEqual(0.3)
    }
  })
})
