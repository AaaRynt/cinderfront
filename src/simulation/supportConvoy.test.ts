/// <reference types="node" />
import { createHash } from 'node:crypto'
import { Euler, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import { CORRIDOR_FEATURES, POWER_LINES } from '../scene/world/stage2/stage2Data'
import { distanceToPolyline, pointInPolygon } from '../scene/world/stage2/terrainModel'
import { SIMULATION_DURATION_SECONDS } from './constants'
import { deriveSimulationWorldState } from './derive'
import completedWorldHashes from './fixtures/stage4b2bPreservation.json'
import { projectCompletedStage4cWorld } from './fixtures/stage5aPreservationProjection'
import { SUPPORT_CONVOY_ROUTE_CONTRACT } from './groundVehicleRoutes'
import { deriveT72GroupState } from './groundVehicles'
import { createSimulationStore, getSimulationWorldState } from './store'
import { deriveSupportConvoyState, getSupportPresentationSurfaceHeight, sampleSupportRoute, SUPPORT_DIMENSIONS, SUPPORT_VEHICLE_IDS, SUPPORT_WHEEL_RADIUS_METERS } from './supportConvoy'
import { SIMULATION_EVENTS, STAGE4B2C_EVENTS } from './timeline'

const BOUNDARIES = [0, 74.9, 75, 75.1, 107.9, 108, 108.1, 124.9, 125, 125.1, 171.9, 172, 173.9, 174, 174.1, 176]
const rescueRoad = [
  [3_100, -300],
  [4_050, 100],
  [5_050, 450],
  [6_300, 400],
] as const
const distance = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z)

describe('Stage 4B.2C support convoy authority', () => {
  it('has exactly the specified stable roster, order, subtypes and independent lifecycle dimensions', () => {
    expect(SUPPORT_VEHICLE_IDS).toEqual(['defender_support_fire_01', 'defender_support_engineering_01', 'defender_support_recovery_01', 'defender_support_fire_02', 'defender_support_logistics_01', 'defender_support_logistics_02'])
    for (const time of BOUNDARIES) {
      const { convoy } = deriveSupportConvoyState(time)
      expect(convoy).toMatchObject({ id: 'defender_support_convoy_01', factionId: 'island_defender', role: 'generic_support_convoy', pathId: 'path_support_convoy_industrial', operationalCount: 6, survivorCount: time >= 174 ? 6 : 0 })
      const list = Object.values(convoy.vehicles)
      expect(list.map((vehicle) => vehicle.subtype)).toEqual(['fire_engine', 'engineering_truck', 'recovery_vehicle', 'fire_engine', 'logistics_truck', 'logistics_truck'])
      expect(list.map((vehicle) => vehicle.convoyOrder)).toEqual([1, 2, 3, 4, 5, 6])
      for (const vehicle of list) {
        expect(vehicle).toMatchObject({ physicalCondition: 'operational', outcome: time >= 174 ? 'survived' : 'active', visible: true, mapPresence: 'present', drivetrain: { kind: 'wheeled' } })
        for (const meaningless of ['turretYawRadians', 'damage', 'weapon', 'armor', 'trackPhase']) expect(vehicle).not.toHaveProperty(meaningless)
      }
    }
  })

  it('adds exactly four domain events, preserving unattributed causality and excluding the endpoint amphibious event', () => {
    expect(STAGE4B2C_EVENTS.map((event) => [event.id, event.atSeconds, event.localTime])).toEqual([
      ['rescue_convoy_redirect', 75, '05:28:15'],
      ['rescue_convoy_chokepoint', 108, '05:28:48'],
      ['rescue_route_secondary_hit', 125, '05:29:05'],
      ['rescue_convoy_abandon_approach', 174, '05:29:54'],
    ])
    for (const event of STAGE4B2C_EVENTS) {
      expect(deriveSupportConvoyState(event.atSeconds - 0.1).reachedEvents).not.toContainEqual(event)
      expect(deriveSupportConvoyState(event.atSeconds).reachedEvents.at(-1)).toEqual(event)
      expect(deriveSupportConvoyState(event.atSeconds + 0.1).reachedEvents.at(-1)).toEqual(event)
    }
    const hit = STAGE4B2C_EVENTS[2]
    expect(hit.targetFeatureId).toBe('dry_wash_bridge')
    for (const attribution of ['sourceActorId', 'actorId', 'weaponId', 'munitionId', 'killCredit']) expect(hit).not.toHaveProperty(attribution)
    expect(SIMULATION_DURATION_SECONDS).toBe(176)
    expect(SIMULATION_EVENTS).toHaveLength(42)
    expect(SIMULATION_EVENTS.filter((event) => event.atSeconds >= 176)).toEqual([])
    expect(JSON.stringify(deriveSimulationWorldState(176))).not.toMatch(/lcac|lav_25|amphibious/i)
  })

  it('follows the authoritative road contract with real initial motion clear of the completed yard and tanks', () => {
    expect(SUPPORT_CONVOY_ROUTE_CONTRACT).toEqual({
      pathId: 'path_support_convoy_industrial',
      featureIds: ['corridor_service_yard', 'road_rescue_branch', 'road_eastern_trunk'],
      connectorWaypoints: [
        [5750, 250],
        [6075, 250],
        [6300, 400],
      ],
    })
    const initial = deriveSupportConvoyState(0).convoy
    const rear = initial.vehicles.defender_support_logistics_02
    expect(rear.pose.position.x).toBeGreaterThan(5400)
    expect(rear.pose.position.x).toBeLessThan(5425)
    expect(rear.pose.position.z).toBeGreaterThan(430)
    for (const id of SUPPORT_VEHICLE_IDS) {
      expect(initial.vehicles[id].speedMetersPerSecond).toBe(17)
      expect(distance(initial.vehicles[id].pose.position, deriveSupportConvoyState(0.1).convoy.vehicles[id].pose.position)).toBeCloseTo(1.7, 3)
    }
    const staticPolygons = [
      [
        [5520, 370],
        [5750, 370],
        [5750, 190],
        [5520, 190],
      ] as const,
      CORRIDOR_FEATURES.substation,
    ]
    for (let time = 0; time <= 176; time += 0.5) {
      const list = Object.values(deriveSupportConvoyState(time).convoy.vehicles)
      const tanks = Object.values(deriveT72GroupState(time).vehicles)
      for (const vehicle of list) {
        const { x, z } = vehicle.pose.position
        expect(distanceToPolyline(x, z, rescueRoad)).toBeLessThan(3.8)
        expect(x).toBeGreaterThan(3220)
        expect(pointInPolygon(x, z, CORRIDOR_FEATURES.bridge)).toBe(false)
        for (const polygon of staticPolygons) expect(pointInPolygon(x, z, polygon)).toBe(false)
        // North barrier begins at x=5425; all occupied envelopes are north/west of it.
        if (x + SUPPORT_DIMENSIONS[vehicle.subtype].length / 2 >= 5425) expect(z - SUPPORT_DIMENSIONS[vehicle.subtype].width / 2).toBeGreaterThan(431)
        for (const [sx, sz] of [
          [5580, 170],
          [5450, 390],
          [6000, 390],
          [6200, 650],
        ])
          expect(Math.hypot(x - sx!, z - sz!)).toBeGreaterThan(15)
        expect(distanceToPolyline(x, z, POWER_LINES[0])).toBeGreaterThan(5.5)
        for (const rail of [
          [
            [3020, -210],
            [3175, -330],
          ],
          [
            [3028, -292],
            [3182, -412],
          ],
        ] as const)
          expect(distanceToPolyline(x, z, rail)).toBeGreaterThan(50)
        for (const tank of tanks) expect(distance(vehicle.pose.position, tank.pose.position)).toBeGreaterThan(100)
      }
      for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) expect(distance(list[a]!.pose.position, list[b]!.pose.position)).toBeGreaterThan(20)
    }
  })

  it('uses physically bounded, continuous acceleration, braking, tangent heading and signed wheels', () => {
    let maximumSpeed = 0
    let maximumAcceleration = 0
    let maximumHeadingRate = 0
    for (let tick = 0; tick < 3520; tick++) {
      const time = tick * 0.05
      const current = deriveSupportConvoyState(time).convoy
      const after = deriveSupportConvoyState(time + 0.05).convoy
      for (const id of SUPPORT_VEHICLE_IDS) {
        const v = current.vehicles[id]
        const next = after.vehicles[id]
        maximumSpeed = Math.max(maximumSpeed, v.speedMetersPerSecond)
        maximumAcceleration = Math.max(maximumAcceleration, Math.abs(v.accelerationMetersPerSecondSquared))
        const actualSpeed = distance(v.pose.position, next.pose.position) / 0.05
        expect(Math.abs(actualSpeed - (v.speedMetersPerSecond + next.speedMetersPerSecond) / 2)).toBeLessThan(0.14)
        const turn = Math.atan2(Math.sin(next.pose.rotation.y - v.pose.rotation.y), Math.cos(next.pose.rotation.y - v.pose.rotation.y))
        maximumHeadingRate = Math.max(maximumHeadingRate, Math.abs(turn) / 0.05)
        const sample = sampleSupportRoute(v.routeStationMeters)
        expect(-Math.sin(v.pose.rotation.y)).toBeCloseTo(sample.tangentX, 5)
        expect(-Math.cos(v.pose.rotation.y)).toBeCloseTo(sample.tangentZ, 5)
        expect(v.drivetrain.wheelRotationRadians).toBe(v.traveledDistanceMeters / SUPPORT_WHEEL_RADIUS_METERS)
        expect(Math.abs(v.drivetrain.steeringRadians)).toBeLessThanOrEqual(0.5)
        if (v.motionDirection === 'reverse') {
          expect(v.longitudinalSpeedMetersPerSecond).toBeLessThan(0)
          expect(v.routeTangent.x * sample.tangentX + v.routeTangent.z * sample.tangentZ).toBeCloseTo(-1)
          expect(next.drivetrain.wheelRotationRadians).toBeLessThan(v.drivetrain.wheelRotationRadians)
        }
      }
    }
    expect(maximumSpeed).toBeLessThanOrEqual(28)
    expect(maximumAcceleration).toBeLessThan(4)
    expect(maximumHeadingRate).toBeLessThan(0.25)
    for (const boundary of [75, 108, 119, 125, 140, 146, 174])
      for (const id of SUPPORT_VEHICLE_IDS) {
        const before = deriveSupportConvoyState(boundary - 0.0001).convoy.vehicles[id]
        const at = deriveSupportConvoyState(boundary).convoy.vehicles[id]
        expect(distance(before.pose.position, at.pose.position)).toBeLessThan(0.003)
      }
  })

  it('grounds the actual six wheel contacts and chassis throughout the rendered terrain', () => {
    for (let time = 0; time <= 176; time += 0.5)
      for (const vehicle of Object.values(deriveSupportConvoyState(time).convoy.vehicles)) {
        const { position: p, rotation: r } = vehicle.pose
        const dimensions = SUPPORT_DIMENSIONS[vehicle.subtype]
        expect(Math.abs(r.x)).toBeLessThan(0.18)
        expect(Math.abs(r.z)).toBeLessThan(0.18)
        for (const side of [-1, 1])
          for (const z of [-2.6, 1.25, 2.6]) {
            const contact = new Vector3(side * (dimensions.width / 2 - 0.15), -dimensions.height / 2, z).applyEuler(new Euler(r.x, r.y, r.z, 'YXZ')).add(new Vector3(p.x, p.y, p.z))
            expect(Math.abs(contact.y - getSupportPresentationSurfaceHeight(contact.x, contact.z))).toBeLessThan(0.16)
          }
        expect(p.y - dimensions.height / 2 + 0.62).toBeGreaterThan(getSupportPresentationSurfaceHeight(p.x, p.z))
      }
  })

  it('propagates smoke braking, pauses, resumes cautiously and responds to the bridge hit', () => {
    expect(deriveSupportConvoyState(74.9).convoy.phase).toBe('routine_transit')
    expect(deriveSupportConvoyState(75).convoy.phase).toBe('emergency_response')
    expect(deriveSupportConvoyState(108).convoy.phase).toBe('visibility_hesitation')
    const braking = deriveSupportConvoyState(108.5).convoy.vehicles
    expect(braking.defender_support_fire_01.accelerationMetersPerSecondSquared).toBeLessThan(0)
    expect(braking.defender_support_logistics_02.accelerationMetersPerSecondSquared).toBe(0)
    expect(deriveSupportConvoyState(119).convoy.vehicles.defender_support_fire_01.speedMetersPerSecond).toBe(0)
    expect(deriveSupportConvoyState(124.9).convoy.phase).toBe('cautious_advance')
    expect(deriveSupportConvoyState(125).convoy.phase).toBe('obstruction_stop')
    expect(deriveSupportConvoyState(125.1).convoy.vehicles.defender_support_fire_01.lighting.brakeLights).toBe(true)
    expect(deriveSupportConvoyState(127.5).convoy.vehicles.defender_support_fire_01.speedMetersPerSecond).toBe(0)
    expect(deriveSupportConvoyState(145).convoy.vehicles.defender_support_engineering_01.activity).toBe('limited_reposition')
    expect(deriveSupportConvoyState(173.9).convoy.phase).toBe('route_assessment')
    const start = deriveSupportConvoyState(174).convoy
    const final = deriveSupportConvoyState(176).convoy
    expect(final).toMatchObject({ phase: 'withdrawal_in_progress', holdingCount: 1, repositioningCount: 2, withdrawingCount: 3, survivorCount: 6, outcome: 'survived' })
    expect(final.vehicles.defender_support_fire_01.pose).toEqual(start.vehicles.defender_support_fire_01.pose)
    for (const id of SUPPORT_VEHICLE_IDS.slice(1)) {
      const moved = distance(start.vehicles[id].pose.position, final.vehicles[id].pose.position)
      expect(moved).toBeGreaterThan(0.9)
      expect(moved).toBeLessThanOrEqual(3.01)
      expect(final.vehicles[id].motionDirection).toBe('reverse')
      expect(final.vehicles[id].pose.rotation.y).toBeCloseTo(start.vehicles[id].pose.rotation.y, 6)
    }
  })

  it('derives lighting phases, bounded haze and unattributed bridge residue entirely from time', () => {
    for (const time of BOUNDARIES) {
      const state = deriveSupportConvoyState(time)
      for (const id of SUPPORT_VEHICLE_IDS) {
        const v = state.convoy.vehicles[id]
        expect(v.lighting.beaconEnabled).toBe(time >= 75)
        expect(v.lighting.headlights).toBe(true)
        expect(v.dustIntensity).toBeLessThanOrEqual(0.22)
        expect(v.lighting).toEqual(deriveSupportConvoyState(time).convoy.vehicles[id].lighting)
        if (v.accelerationMetersPerSecondSquared < -0.03 && v.longitudinalSpeedMetersPerSecond > 0) expect(v.lighting.brakeLights).toBe(true)
      }
      expect(new Set(Object.values(state.convoy.vehicles).map((v) => v.lighting.beaconPhaseOffsetSeconds)).size).toBe(6)
      expect(state.bridge.blocked).toBe(time >= 125)
      expect(state.bridge.persistentDamage).toBe(time >= 125)
    }
    expect(deriveSupportConvoyState(124.9).bridge.flashIntensity).toBe(0)
    expect(deriveSupportConvoyState(125).bridge.flashIntensity).toBe(1)
    expect(deriveSupportConvoyState(125.6).bridge.flashIntensity).toBe(0)
    expect(deriveSupportConvoyState(133).bridge).toMatchObject({ blocked: true, persistentDamage: true, flashIntensity: 0, dustIntensity: 0, shockProgress: 0, debrisActive: false })
    expect(deriveSupportConvoyState(108.1).visibilityIntensity).toBeGreaterThan(0)
    expect(deriveSupportConvoyState(140).visibilityIntensity).toBe(0)
  })

  it('reconstructs full world state on direct seeks, pauses, restarts and all playback speeds', () => {
    for (const time of BOUNDARIES) expect(deriveSimulationWorldState(time)).toEqual(deriveSimulationWorldState(time))
    for (const speed of [0.5, 1, 2] as const) {
      const store = createSimulationStore({ speed })
      store.getState().play()
      for (const target of BOUNDARIES) {
        const remaining = target - store.getState().timeSeconds
        store.getState().tick(remaining / speed)
        expect(getSimulationWorldState(store)).toEqual(deriveSimulationWorldState(target))
      }
      expect(store.getState().isPlaying).toBe(false)
      store.getState().seek(124.9)
      expect(getSimulationWorldState(store).stage4b2c.bridge.blocked).toBe(false)
      store.getState().seek(176)
      expect(getSimulationWorldState(store)).toEqual(deriveSimulationWorldState(176))
      store.getState().restart()
      expect(getSimulationWorldState(store)).toEqual(deriveSimulationWorldState(0))
    }
  })

  it('preserves the exact entire pre-existing world at captured timestamps including T+172', () => {
    // Immutable SHA-256 baselines captured with all 303 tests passing before
    // refactoring. Every old actor, effect, event field and numeric value counts.
    for (const [time, hash] of Object.entries(completedWorldHashes)) {
      const { stage4b2c: added, ...oldWorld } = projectCompletedStage4cWorld(deriveSimulationWorldState(Number(time)))
      expect(added.convoy.operationalCount).toBe(6)
      oldWorld.reachedEvents = oldWorld.reachedEvents.filter((event) => !STAGE4B2C_EVENTS.some((addedEvent) => addedEvent.id === event.id))
      expect(createHash('sha256').update(JSON.stringify(oldWorld)).digest('hex'), `completed world at T+${time}`).toBe(hash)
    }
  })

  it('continues old actors through 176 without resurrecting exits or replaying strikes', () => {
    const endpoint = deriveSimulationWorldState(172)
    for (const time of [172.1, 174, 175, 176]) {
      const world = deriveSimulationWorldState(time)
      expect(world.stage3.molniya).toMatchObject({ phase: 'escaped-into-open-water', escaped: true, damaged: true })
      expect(world.stage3.molniya.pose.position.x).toBeLessThan(endpoint.stage3.molniya.pose.position.x)
      expect(distance(world.stage3.molniya.pose.position, endpoint.stage3.molniya.pose.position)).toBeCloseTo(endpoint.stage3.molniya.speedMetersPerSecond * (time - 172), 6)
      expect(world.stage4b.btrGroup.disabledCount).toBe(1)
      expect(world.stage4b.t72Group.destroyedCount).toBe(1)
      expect(world.stage4b.t72Group.survivorCount).toBe(2)
      expect(world.stage3.talwar.phase).toBe(endpoint.stage3.talwar.phase)
      expect(world.stage3.industrial.ammunitionCompoundDestroyed).toBe(true)
      expect(Object.values(world.stage3.weapons).every((weapon) => !weapon.visible)).toBe(true)
      expect(world.aircraft.defender_su30_01.damage.surfaceDarkened).toBe(true)
      for (const id of ['attacker_f35_01', 'attacker_f35_02'] as const) expect(distance(world.aircraft[id].pose.position, endpoint.aircraft[id].pose.position)).toBeGreaterThan(0)
    }
    expect(deriveSimulationWorldState(176).aircraft.defender_su30_01.visible).toBe(false)
    expect(deriveSimulationWorldState(176).aircraft.defender_su30_02.visible).toBe(false)
    for (const time of [174, 175, 176]) expect(deriveSimulationWorldState(time).aircraft.defender_su30_01.visible).toBe(false)
  })
})
