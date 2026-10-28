/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isValidElement, type ReactNode } from 'react'
import { Box3, BoxGeometry, CircleGeometry, CylinderGeometry, Group, Mesh, Object3D, Vector3 as ThreeVector3, type BufferGeometry, type Material } from 'three'
import { afterAll, describe, expect, it } from 'vitest'

import type { SecondaryPantsirState } from './secondaryPantsirTypes'

import { PantsirModel } from '../scene/vehicles/PantsirModel'
import { CORRIDOR_FEATURES, ROAD_DEFINITIONS } from '../scene/world/stage2/stage2Data'
import { distanceToPolyline, getTerrainHeight, pointInPolygon } from '../scene/world/stage2/terrainModel'
import { createRegionalLayout } from '../scene/world/stage4c/regionalLayout'
import { createServiceEquipmentLayout } from '../scene/world/stage4c/serviceLayout'
import { getVehicleSweptReservations, intersectsReservation } from '../scene/world/stage4c/spatialReservations'
import { SIMULATION_DURATION_SECONDS } from './constants'
import { deriveSimulationWorldState } from './derive'
import { deriveSecondaryPantsirState, getSecondaryPantsirSurfaceHeight, SECONDARY_PANTSIR_LOCAL_PATH, SECONDARY_PANTSIR_ROUTE_CONTRACT, secondaryPantsirMuzzlePosition } from './secondaryPantsir'
import { createSimulationStore, getSimulationWorldState } from './store'
import { SIMULATION_EVENTS, STAGE5A_EVENTS } from './timeline'

const BOUNDARIES = [0, 111.9, 112, 112.1, 114.6, 117.1999, 117.2, 117.2001, 118.7999, 118.8, 118.8001, 118.9999, 119, 119.0001, 119.5999, 119.6, 119.6001, 120.15, 120.75, 120.9, 120.9999, 121, 121.1, 125, 132.4, 172, 176]
const distanceXZ = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z)
const angleDifference = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))
const measured: Record<string, number> = {}
afterAll(() => {
  if (process.env.CINDERFRONT_STAGE5A_MEASUREMENTS === '1') writeFileSync('/tmp/cinderfront-stage5a-secondary-measurements.json', `${JSON.stringify(measured, null, 2)}\n`)
})

interface ObjectProps {
  readonly children?: ReactNode
  readonly geometry?: BufferGeometry
  readonly material?: Material
  readonly name?: string
  readonly position?: readonly [number, number, number]
  readonly rotation?: readonly [number, number, number]
  readonly scale?: readonly [number, number, number]
}

// Evaluate the actual pure model components into Three transforms. Grounding
// and muzzle assertions below inspect their real geometry, not copied contacts.
function appendElement(parent: Object3D, node: ReactNode) {
  if (Array.isArray(node)) {
    node.forEach((child) => appendElement(parent, child))
    return
  }
  if (!isValidElement<ObjectProps>(node)) return
  if (typeof node.type === 'function') {
    appendElement(parent, (node.type as (props: ObjectProps) => ReactNode)(node.props))
    return
  }
  const elementType: unknown = node.type
  if (typeof elementType === 'object' && elementType !== null && 'type' in elementType && typeof elementType.type === 'function') {
    appendElement(parent, (elementType.type as (props: ObjectProps) => ReactNode)(node.props))
    return
  }
  if (typeof node.type !== 'string') {
    appendElement(parent, node.props.children)
    return
  }
  const props = node.props
  const object = node.type === 'mesh' ? new Mesh(props.geometry, props.material) : new Group()
  object.name = props.name ?? ''
  if (props.position) object.position.set(...props.position)
  if (props.rotation) object.rotation.set(...props.rotation)
  if (props.scale) object.scale.set(...props.scale)
  parent.add(object)
  appendElement(object, props.children)
}

function actualModel(state: SecondaryPantsirState) {
  const root = new Group()
  const m = state.mechanical
  appendElement(
    root,
    PantsirModel({
      turretYaw: m.turretYawRadians,
      radarRotation: m.radarRotationRadians,
      launcherElevation: m.launcherElevationRadians,
      firedTubeCount: m.firedTubeCount,
      wheelTravelMeters: m.wheelTravelMeters,
      steeringRadians: m.steeringRadians,
      stabilizerDeployment: m.stabilizerDeployment,
      radarDeployment: m.radarDeployment,
      destroyed: state.condition === 'destroyed',
      destructionAge: state.destruction.ageSeconds,
    }),
  )
  root.position.set(state.pose.position.x, state.pose.position.y, state.pose.position.z)
  root.rotation.set(state.pose.rotation.x, state.pose.rotation.y, state.pose.rotation.z, 'YXZ')
  root.updateMatrixWorld(true)
  return root
}

function matching(root: Object3D, predicate: (object: Object3D) => boolean) {
  const result: Object3D[] = []
  root.traverse((object) => {
    if (predicate(object)) result.push(object)
  })
  return result
}

function geometryPoints(object: Object3D) {
  const points: ThreeVector3[] = []
  object.traverse((child) => {
    if (!(child instanceof Mesh)) return
    const positions = child.geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) points.push(new ThreeVector3().fromBufferAttribute(positions, i).applyMatrix4(child.matrixWorld))
  })
  return points
}

function minimumSurfaceClearance(object: Object3D) {
  return Math.min(...geometryPoints(object).map((point) => point.y - getSecondaryPantsirSurfaceHeight(point.x, point.z)))
}

describe('Stage 5A secondary Pantsir authority and lifecycle', () => {
  it('has the exact reserve identity, roles, route features and independent final loss', () => {
    const yaml = readFileSync(resolve(process.cwd(), 'assets/scenario/scenario-spec.yaml'), 'utf8')
    const actor = yaml.split("- id: 'defender_pantsir_02'")[1]!.split('\n  - id:')[0]!
    expect(actor).toContain("map_feature_id: 'corridor_pull_off_east'")
    expect(actor).toContain("- 'relocation'")
    expect(actor).toContain("- 'secondary air-defense support'")
    const initial = deriveSecondaryPantsirState(0)
    expect(initial).toMatchObject({ id: 'defender_pantsir_02', factionId: 'island_defender', initialFeatureId: 'corridor_pull_off_east', roles: ['relocation', 'secondary air-defense support'], pathId: 'path_pantsir_relocation', phase: 'reserve', activity: 'reserve', condition: 'operational', outcome: 'active' })
    expect(SECONDARY_PANTSIR_ROUTE_CONTRACT.featureIds).toEqual(['corridor_pull_off_east', 'road_eastern_trunk', 'corridor_inland_junction'])
    expect(pointInPolygon(initial.pose.position.x, initial.pose.position.z, CORRIDOR_FEATURES.pullOffEast)).toBe(true)
    expect(deriveSecondaryPantsirState(176)).toMatchObject({ id: initial.id, factionId: initial.factionId, phase: 'destroyed', activity: 'destroyed', condition: 'destroyed', outcome: 'lost' })
  })

  it('adds exactly the two authoritative events, their source and chronological 51-event scope', () => {
    expect(STAGE5A_EVENTS).toEqual([
      { id: 'pantsir_02_relocate', atSeconds: 112, localTime: '05:28:52', event: 'relocate_to_secondary_firing_position', actorId: 'defender_pantsir_02', pathId: 'path_pantsir_relocation' },
      { id: 'pantsir_02_destroyed', atSeconds: 121, localTime: '05:29:01', event: 'destroy_after_secondary_engagement', actorId: 'defender_pantsir_02', sourceAircraftId: 'attacker_f35_01', effectProfile: 'vehicle_kill_medium' },
    ])
    expect(SIMULATION_EVENTS).toHaveLength(51)
    expect(new Set(SIMULATION_EVENTS.map((event) => event.id)).size).toBe(51)
    expect(SIMULATION_EVENTS.map((event) => event.atSeconds)).toEqual(SIMULATION_EVENTS.map((event) => event.atSeconds).toSorted((a, b) => a - b))
    expect(SIMULATION_DURATION_SECONDS).toBe(180)
    expect(SIMULATION_EVENTS.filter((event) => /lav_|scripted_phase_complete/.test(event.id))).toHaveLength(4)
    for (const event of STAGE5A_EVENTS) {
      expect(deriveSimulationWorldState(event.atSeconds - 0.0001).reachedEvents).not.toContainEqual(event)
      expect(deriveSimulationWorldState(event.atSeconds).reachedEvents).toContainEqual(event)
      expect(deriveSimulationWorldState(event.atSeconds + 0.0001).reachedEvents).toContainEqual(event)
    }
  })

  it('moves locally, brakes, deploys and engages before the exact impact boundary', () => {
    expect(deriveSecondaryPantsirState(111.9).activity).toBe('reserve')
    expect(deriveSecondaryPantsirState(112).activity).toBe('relocating')
    expect(deriveSecondaryPantsirState(112.1).speedMetersPerSecond).toBeGreaterThan(0)
    expect(deriveSecondaryPantsirState(116).activity).toBe('braking')
    expect(deriveSecondaryPantsirState(117.2)).toMatchObject({ activity: 'deploying-alignment', speedMetersPerSecond: 0 })
    expect(deriveSecondaryPantsirState(118.8)).toMatchObject({ activity: 'engaging', mechanical: { stabilizerDeployment: 1, radarDeployment: 1 } })
    expect(deriveSecondaryPantsirState(120.9).condition).toBe('operational')
    expect(deriveSecondaryPantsirState(121)).toMatchObject({ condition: 'destroyed', outcome: 'lost', speedMetersPerSecond: 0 })
    const initial = deriveSecondaryPantsirState(0).pose.position
    const final = deriveSecondaryPantsirState(121).pose.position
    expect(distanceXZ(initial, final)).toBeGreaterThan(15)
    expect(distanceXZ(initial, final)).toBeLessThan(25)
    expect(distanceXZ(final, { x: 4000, z: -1100 })).toBeGreaterThan(1500)
  })
})

describe('secondary Pantsir measured motion and ground geometry', () => {
  it('has smooth physically bounded motion, tangent hull heading and signed wheel distance', () => {
    let maximumSpeed = 0,
      maximumAcceleration = 0,
      maximumTurnRate = 0,
      traveled = 0
    const dt = 0.01
    for (let tick = 0; tick <= 600; tick++) {
      const time = 111.6 + tick * dt
      const current = deriveSecondaryPantsirState(time),
        next = deriveSecondaryPantsirState(time + dt)
      const movement = distanceXZ(current.pose.position, next.pose.position)
      const measuredSpeed = movement / dt
      const measuredAcceleration = (next.speedMetersPerSecond - current.speedMetersPerSecond) / dt
      maximumSpeed = Math.max(maximumSpeed, measuredSpeed, current.speedMetersPerSecond)
      maximumAcceleration = Math.max(maximumAcceleration, Math.abs(measuredAcceleration), Math.abs(current.accelerationMetersPerSecondSquared))
      const turn = angleDifference(next.pose.rotation.y, current.pose.rotation.y)
      maximumTurnRate = Math.max(maximumTurnRate, Math.abs(turn) / dt)
      traveled += movement
      expect(Math.abs(measuredSpeed - (current.speedMetersPerSecond + next.speedMetersPerSecond) / 2)).toBeLessThan(0.004)
      expect(Math.abs(measuredAcceleration - (current.accelerationMetersPerSecondSquared + next.accelerationMetersPerSecondSquared) / 2)).toBeLessThan(0.006)
      expect(current.mechanical.wheelTravelMeters).toBe(current.travelDistanceMeters)
      expect(next.mechanical.wheelTravelMeters).toBeGreaterThanOrEqual(current.mechanical.wheelTravelMeters)
      expect(Math.abs(current.mechanical.steeringRadians)).toBeLessThanOrEqual(0.45)
      if (movement > 0.002) {
        const dx = (next.pose.position.x - current.pose.position.x) / movement,
          dz = (next.pose.position.z - current.pose.position.z) / movement
        expect(-Math.sin(current.pose.rotation.y) * dx - Math.cos(current.pose.rotation.y) * dz).toBeGreaterThan(0.9999)
      }
    }
    expect(maximumSpeed).toBeLessThanOrEqual(7)
    expect(maximumSpeed).toBeGreaterThan(5)
    expect(maximumAcceleration).toBeLessThanOrEqual(4.1)
    expect(maximumTurnRate).toBeLessThan(0.3)
    expect(traveled).toBeGreaterThan(18)
    expect(traveled).toBeLessThan(20)
    expect(Math.abs(traveled - deriveSecondaryPantsirState(117.2).travelDistanceMeters)).toBeLessThan(0.001)
    expect(Math.abs(traveled - SECONDARY_PANTSIR_LOCAL_PATH.lengthMeters)).toBeLessThan(0.001)
    Object.assign(measured, { localPathLengthMeters: SECONDARY_PANTSIR_LOCAL_PATH.lengthMeters, integratedTravelMeters: traveled, maximumSpeedMetersPerSecond: maximumSpeed, maximumAccelerationMetersPerSecondSquared: maximumAcceleration, maximumHeadingRateRadiansPerSecond: maximumTurnRate })
    for (const boundary of [112, 114.6, 117.2, 118.8, 119, 119.6, 121]) {
      const before = deriveSecondaryPantsirState(boundary - 0.00001),
        at = deriveSecondaryPantsirState(boundary),
        after = deriveSecondaryPantsirState(boundary + 0.00001)
      expect(distanceXZ(before.pose.position, after.pose.position)).toBeLessThan(0.0002)
      expect(Math.abs(angleDifference(before.pose.rotation.y, after.pose.rotation.y))).toBeLessThan(0.00002)
      expect(Math.abs(before.speedMetersPerSecond - at.speedMetersPerSecond)).toBeLessThan(0.0001)
    }
  })

  it('grounds all eight actual wheel meshes and keeps chassis above the rendered pull-off', () => {
    let worstContactError = 0
    for (let tick = 0; tick <= 104; tick++) {
      const state = deriveSecondaryPantsirState(112 + tick * 0.05)
      const root = actualModel(state)
      const wheels = matching(root, (object) => object.name.startsWith('pantsir-wheel-') && object.name !== 'pantsir-wheel-travel-marker')
      expect(wheels).toHaveLength(8)
      expect(new Set(wheels.map((wheel) => wheel.name)).size).toBe(8)
      for (const wheel of wheels) {
        const clearance = minimumSurfaceClearance(wheel)
        worstContactError = Math.max(worstContactError, Math.abs(clearance))
        expect(Math.abs(clearance)).toBeLessThan(0.055)
        expect(wheel.children[0]!.rotation.x).toBeLessThanOrEqual(0)
        if (state.speedMetersPerSecond > 0) expect(wheel.children[0]!.rotation.x).toBeLessThan(0)
        const actualRadius = Math.max(...matching(wheel, (object) => object instanceof Mesh && object.geometry instanceof CylinderGeometry).map((object) => ((object as Mesh).geometry as CylinderGeometry).parameters.radiusTop))
        expect(actualRadius).toBeGreaterThan(0.65)
        expect(-wheel.children[0]!.rotation.x * actualRadius).toBeCloseTo(state.travelDistanceMeters, 9)
      }
      const chassis = matching(root, (object) => object instanceof Mesh && object.geometry instanceof BoxGeometry && Math.abs(object.scale.z - 10.3) < 0.00001)
      expect(chassis).toHaveLength(1)
      expect(minimumSurfaceClearance(chassis[0]!)).toBeGreaterThan(0.5)
      expect(state.pose.position.y - getTerrainHeight(state.pose.position.x, state.pose.position.z)).toBeCloseTo(0.4, 9)
    }
    expect(worstContactError).toBeLessThan(0.055)
    measured.maximumActualWheelSurfaceErrorMeters = worstContactError
  })

  it('keeps actual stabilizers road-safe and lowers them continuously only after stopping', () => {
    let previousRadarDeployment = 0,
      previousStabilizerDeployment = 0
    for (let tick = 0; tick <= 136; tick++) {
      const time = 112 + tick * 0.05,
        state = deriveSecondaryPantsirState(time),
        root = actualModel(state)
      const pads = matching(root, (object) => object.name === 'pantsir-stabilizer-pad')
      expect(pads).toHaveLength(4)
      const m = state.mechanical
      expect(m.radarDeployment).toBeGreaterThanOrEqual(previousRadarDeployment)
      expect(m.stabilizerDeployment).toBeGreaterThanOrEqual(previousStabilizerDeployment)
      expect(m.radarDeployment).toBeGreaterThanOrEqual(0)
      expect(m.radarDeployment).toBeLessThanOrEqual(1)
      expect(m.stabilizerDeployment).toBeGreaterThanOrEqual(0)
      expect(m.stabilizerDeployment).toBeLessThanOrEqual(1)
      expect(Math.abs(m.turretYawRadians)).toBeLessThan(Math.PI)
      expect(m.launcherElevationRadians).toBeGreaterThanOrEqual(0.05)
      expect(m.launcherElevationRadians).toBeLessThanOrEqual(0.55)
      const inverse = root.matrixWorld.clone().invert()
      const localBounds = new Box3().setFromPoints(geometryPoints(root).map((point) => point.applyMatrix4(inverse)))
      if (state.speedMetersPerSecond > 0.001) {
        expect(m.stabilizerDeployment).toBe(0)
        expect(m.radarDeployment).toBe(0)
        expect(m.radarRotationRadians).toBe(0)
        expect(Math.abs(m.turretYawRadians)).toBe(0)
        expect(m.launcherElevationRadians).toBeLessThan(0.1)
        expect(localBounds.max.y).toBeCloseTo(4.37, 5)
        for (const pad of pads) expect(minimumSurfaceClearance(pad)).toBeGreaterThan(0.65)
      } else {
        for (const pad of pads) expect(minimumSurfaceClearance(pad)).toBeGreaterThan(-0.03)
      }
      if (time >= 118.8) expect(localBounds.max.y).toBeCloseTo(5.65, 5)
      if (previousRadarDeployment > 0) expect(m.radarDeployment - previousRadarDeployment).toBeLessThan(0.05)
      previousRadarDeployment = m.radarDeployment
      previousStabilizerDeployment = m.stabilizerDeployment
    }
    const ready = actualModel(deriveSecondaryPantsirState(118.8))
    for (const pad of matching(ready, (object) => object.name === 'pantsir-stabilizer-pad')) expect(Math.abs(minimumSurfaceClearance(pad))).toBeLessThan(0.05)
    for (const time of [117.2, 118, 118.8]) {
      const before = deriveSecondaryPantsirState(time - 0.0001).mechanical,
        after = deriveSecondaryPantsirState(time + 0.0001).mechanical
      expect(Math.abs(before.turretYawRadians - after.turretYawRadians)).toBeLessThan(0.001)
      expect(Math.abs(before.launcherElevationRadians - after.launcherElevationRadians)).toBeLessThan(0.001)
    }
  })

  it('keeps the actual thin guns clear of the cab, equipment body and ground during alignment', () => {
    for (let tick = 0; tick <= 32; tick++) {
      const root = actualModel(deriveSecondaryPantsirState(117.2 + tick * 0.05))
      const guns = matching(root, (object) => object instanceof Mesh && object.geometry instanceof CylinderGeometry && Math.abs(object.geometry.parameters.height - 3.25) < 0.00001)
      expect(guns).toHaveLength(4)
      const bodies = matching(root, (object) => object instanceof Mesh && object.geometry instanceof BoxGeometry && ((Math.abs(object.scale.y - 2.18) < 0.00001 && Math.abs(object.scale.z - 2.8) < 0.00001) || (Math.abs(object.scale.y - 1.82) < 0.00001 && Math.abs(object.scale.z - 7.5) < 0.00001))) as Mesh[]
      expect(bodies).toHaveLength(2)
      for (const gun of guns) {
        expect(minimumSurfaceClearance(gun)).toBeGreaterThan(3)
        for (const body of bodies) {
          body.geometry.computeBoundingBox()
          const inverse = body.matrixWorld.clone().invert()
          expect(geometryPoints(gun).some((point) => body.geometry.boundingBox!.containsPoint(point.applyMatrix4(inverse)))).toBe(false)
        }
      }
    }
  })

  it('keeps the complete hull inside the reserve and clear of road traffic, cover, equipment and fixtures', () => {
    const cover = createRegionalLayout(),
      equipment = createServiceEquipmentLayout(),
      sweeps = getVehicleSweptReservations()
    expect(sweeps).toHaveLength(13)
    const corridorSource = readFileSync(resolve(process.cwd(), 'src/scene/world/stage2/ConvoyCorridor.tsx'), 'utf8')
    const lightArray = corridorSource.match(/const CORRIDOR_LIGHTS = (\[[\s\S]*?\])\.map/)![1]!
    const lights = JSON.parse(lightArray.replace(/,\s*\]/g, ']')) as number[][]
    expect(lights.length).toBeGreaterThan(0)
    const road = ROAD_DEFINITIONS.find((road) => road.id === 'road_eastern_trunk')!
    const fixedPolygons = [CORRIDOR_FEATURES.substation, CORRIDOR_FEATURES.serviceYard, CORRIDOR_FEATURES.bridge]
    let minimumCoverMargin = Infinity,
      minimumEquipmentMargin = Infinity,
      minimumLightMargin = Infinity
    for (let tick = 0; tick <= 104; tick++) {
      const state = deriveSecondaryPantsirState(112 + tick * 0.05),
        { x, z } = state.pose.position
      const root = actualModel(state),
        inverse = root.matrixWorld.clone().invert()
      const localBounds = new Box3().setFromPoints(geometryPoints(root).map((point) => point.applyMatrix4(inverse)))
      const radius = Math.hypot(Math.max(Math.abs(localBounds.min.x), Math.abs(localBounds.max.x)), Math.max(Math.abs(localBounds.min.z), Math.abs(localBounds.max.z)))
      for (const px of [localBounds.min.x, localBounds.max.x])
        for (const pz of [localBounds.min.z, localBounds.max.z]) {
          const corner = new ThreeVector3(px, 0, pz).applyMatrix4(root.matrixWorld)
          expect(pointInPolygon(corner.x, corner.z, CORRIDOR_FEATURES.pullOffEast)).toBe(true)
        }
      expect(distanceToPolyline(x, z, road.points)).toBeGreaterThan(radius + road.widthM / 2 + 1)
      for (const reservation of sweeps) expect(intersectsReservation(x, z, radius + 1, reservation)).toBe(false)
      for (const polygon of fixedPolygons) expect(pointInPolygon(x, z, polygon)).toBe(false)
      for (const instance of cover) minimumCoverMargin = Math.min(minimumCoverMargin, Math.hypot(x - instance.position[0], z - instance.position[2]) - radius - instance.footprintRadius)
      for (const matrices of Object.values(equipment))
        for (const matrix of matrices) {
          const position = new ThreeVector3().setFromMatrixPosition(matrix),
            scale = new ThreeVector3().setFromMatrixScale(matrix)
          minimumEquipmentMargin = Math.min(minimumEquipmentMargin, Math.hypot(x - position.x, z - position.z) - radius - Math.hypot(scale.x, scale.z))
        }
      for (const light of lights) minimumLightMargin = Math.min(minimumLightMargin, Math.hypot(x - light[0]!, z - light[1]!) - radius - 1)
    }
    expect(minimumCoverMargin).toBeGreaterThan(2)
    expect(minimumEquipmentMargin).toBeGreaterThan(20)
    expect(minimumLightMargin).toBeGreaterThan(20)
    Object.assign(measured, { minimumFullHullToCoverMarginMeters: minimumCoverMargin, minimumConservativeEquipmentMarginMeters: minimumEquipmentMargin, minimumLightPoleMarginMeters: minimumLightMargin })
  })
})

describe('authored secondary engagement and persistent destruction', () => {
  it('fires only two ready, fixed-sector misses with correct actual tube origins and directions', () => {
    for (const time of BOUNDARIES) {
      const state = deriveSecondaryPantsirState(time),
        m = state.mechanical
      expect(state.defensiveShots).toHaveLength(2)
      expect(state.defensiveShots.every((shot) => shot.hit === false)).toBe(true)
      expect(m.firedTubeCount).toBe(time < 119 ? 0 : time < 119.6 ? 1 : 2)
      if (state.defensiveShots.some((shot) => shot.active)) {
        expect(m.stabilizerDeployment).toBe(1)
        expect(m.radarDeployment).toBe(1)
        expect(state.speedMetersPerSecond).toBe(0)
        expect(state.condition).toBe('operational')
      }
      if (time < 119 || time >= 121) expect(state.defensiveShots.every((shot) => !shot.active)).toBe(true)
    }
    const shots = deriveSecondaryPantsirState(119.6).defensiveShots
    expect(shots.map((shot) => shot.launchAtSeconds)).toEqual([119, 119.6])
    for (const [index, shot] of shots.entries()) {
      const root = actualModel(deriveSecondaryPantsirState(shot.launchAtSeconds))
      const caps = matching(root, (object) => object instanceof Mesh && object.geometry instanceof CircleGeometry)
      expect(caps).toHaveLength(12)
      const cap = caps[index]!,
        origin = cap.getWorldPosition(new ThreeVector3()),
        direction = new ThreeVector3(0, 0, 1).transformDirection(cap.matrixWorld)
      expect(origin.distanceTo(new ThreeVector3(shot.origin.x, shot.origin.y, shot.origin.z))).toBeLessThan(0.00001)
      const helperOrigin = secondaryPantsirMuzzlePosition(index)
      expect(origin.distanceTo(new ThreeVector3(helperOrigin.x, helperOrigin.y, helperOrigin.z))).toBeLessThan(0.00001)
      const shotDirection = new ThreeVector3(shot.end.x - shot.origin.x, shot.end.y - shot.origin.y, shot.end.z - shot.origin.z)
      expect(shotDirection.length()).toBeGreaterThan(300)
      expect(shotDirection.length()).toBeLessThan(450)
      expect(direction.dot(shotDirection.normalize())).toBeGreaterThan(0.999999)
      for (let sample = 0; sample <= 20; sample++) {
        const t = sample / 20,
          point = origin.clone().lerp(new ThreeVector3(shot.end.x, shot.end.y, shot.end.z), t)
        expect(point.y - getTerrainHeight(point.x, point.z)).toBeGreaterThan(3)
      }
      expect(deriveSecondaryPantsirState(shot.launchAtSeconds - 0.0001).defensiveShots[index]!.active).toBe(false)
      expect(deriveSecondaryPantsirState(shot.launchAtSeconds).defensiveShots[index]!.active).toBe(true)
      expect(deriveSecondaryPantsirState(shot.launchAtSeconds + shot.durationSeconds).defensiveShots[index]!.active).toBe(false)
    }
  })

  it('anchors the exact strike inside the actual stopped vehicle and freezes travel and scanning', () => {
    const before = deriveSecondaryPantsirState(120.9999),
      impact = deriveSecondaryPantsirState(121)
    expect(impact.pose).toEqual(before.pose)
    expect(impact.destruction).toMatchObject({ active: true, ageSeconds: 0, sourceAircraftId: 'attacker_f35_01', flashIntensity: 1, dustIntensity: 1 })
    const root = actualModel(impact),
      point = new ThreeVector3(impact.destruction.impactPosition.x, impact.destruction.impactPosition.y, impact.destruction.impactPosition.z)
    expect(
      matching(root, (object) => {
        if (!(object instanceof Mesh)) return false
        object.geometry.computeBoundingBox()
        return object.geometry.boundingBox!.containsPoint(point.clone().applyMatrix4(object.matrixWorld.clone().invert()))
      }).length,
    ).toBeGreaterThan(0)
    expect(impact.destruction.groundPosition).toEqual({ x: impact.pose.position.x, y: getSecondaryPantsirSurfaceHeight(impact.pose.position.x, impact.pose.position.z), z: impact.pose.position.z })
    for (const time of [121, 121.1, 125, 132.4, 172, 176]) {
      const state = deriveSecondaryPantsirState(time)
      expect(state.pose).toEqual(impact.pose)
      expect(state.travelDistanceMeters).toBe(impact.travelDistanceMeters)
      expect(state.mechanical).toEqual(impact.mechanical)
      expect(state.destruction.impactPosition).toEqual(impact.destruction.impactPosition)
      expect(state.destruction.groundPosition).toEqual(impact.destruction.groundPosition)
      expect(state.speedMetersPerSecond).toBe(0)
      expect(state.accelerationMetersPerSecondSquared).toBeCloseTo(0, 12)
      expect(state.movementDust).toBe(0)
      expect(state.defensiveShots.every((shot) => !shot.active)).toBe(true)
    }
  })

  it('has no future hit before 121 and bounded transients with fire/smoke persisting through 176', () => {
    for (const time of BOUNDARIES.filter((time) => time < 121)) expect(deriveSecondaryPantsirState(time).destruction).toMatchObject({ active: false, ageSeconds: 0, flashIntensity: 0, dustIntensity: 0, fireIntensity: 0, smokeIntensity: 0 })
    for (let tick = 0; tick <= 550; tick++) {
      const state = deriveSecondaryPantsirState(121 + tick * 0.1),
        d = state.destruction
      expect(d.active).toBe(true)
      expect(d.flashIntensity).toBeGreaterThanOrEqual(0)
      expect(d.flashIntensity).toBeLessThanOrEqual(1)
      expect(d.dustIntensity).toBeGreaterThanOrEqual(0)
      expect(d.dustIntensity).toBeLessThanOrEqual(1)
      expect(d.fireIntensity).toBeGreaterThan(0.45)
      expect(d.fireIntensity).toBeLessThan(0.65)
      expect(d.smokeIntensity).toBeGreaterThanOrEqual(0.4)
      expect(d.smokeIntensity).toBeLessThanOrEqual(0.6)
      if (tick >= 40) {
        expect(d.flashIntensity).toBe(0)
        expect(d.dustIntensity).toBe(0)
      }
    }
    for (const time of [121.1, 125, 172, 176]) {
      const root = actualModel(deriveSecondaryPantsirState(time))
      expect(matching(root, (object) => object.name.startsWith('pantsir-wheel-') && object.name !== 'pantsir-wheel-travel-marker')).toHaveLength(8)
      expect(minimumSurfaceClearance(root)).toBeGreaterThan(-0.16)
    }
  })
})

describe('absolute-time secondary Pantsir reconstruction', () => {
  it('repeats exactly through nonmonotonic seeks and reconstruction of every boundary', () => {
    const expected = new Map(BOUNDARIES.map((time) => [time, deriveSecondaryPantsirState(time)]))
    for (const sequence of [BOUNDARIES, [...BOUNDARIES].reverse(), [176, 119, 0, 121.1, 112.1, 172, 111.9, 118.8, 121]]) {
      for (const time of sequence) {
        expect(deriveSecondaryPantsirState(time)).toEqual(expected.get(time))
        expect(deriveSimulationWorldState(time).secondaryPantsir).toEqual(expected.get(time))
      }
    }
    expect(deriveSecondaryPantsirState(-1)).toEqual(expected.get(0))
    expect(deriveSecondaryPantsirState(180).pose).toEqual(expected.get(176)!.pose)
    expect(deriveSecondaryPantsirState(999)).toEqual(deriveSecondaryPantsirState(180))
  })

  it('freezes while paused and reconstructs restart/backward seek at every supported speed', () => {
    for (const speed of [0.5, 1, 2] as const) {
      const store = createSimulationStore({ speed })
      store.getState().play()
      for (const target of BOUNDARIES) {
        store.getState().tick((target - store.getState().timeSeconds) / speed)
        expect(store.getState().timeSeconds).toBeCloseTo(target, 10)
        expect(getSimulationWorldState(store).secondaryPantsir).toEqual(deriveSecondaryPantsirState(target))
      }
      expect(store.getState().isPlaying).toBe(true)
      store.getState().tick((180 - store.getState().timeSeconds) / speed)
      expect(store.getState()).toMatchObject({ timeSeconds: 180, isPlaying: true })
      expect(getSimulationWorldState(store).secondaryPantsir).toEqual(deriveSecondaryPantsirState(180))
      expect(getSimulationWorldState(store).runtime).toMatchObject({ scriptedSeconds: 180, aftermathSeconds: 0, phase: 'aftermath' })
      store.getState().seek(119.6)
      store.getState().pause()
      const paused = getSimulationWorldState(store).secondaryPantsir
      store.getState().tick(100)
      expect(getSimulationWorldState(store).secondaryPantsir).toEqual(paused)
      store.getState().seek(111.9)
      expect(getSimulationWorldState(store).secondaryPantsir).toMatchObject({ activity: 'reserve', condition: 'operational', mechanical: { firedTubeCount: 0 }, destruction: { active: false, fireIntensity: 0, smokeIntensity: 0 } })
      store.getState().seek(121)
      expect(getSimulationWorldState(store).secondaryPantsir).toEqual(deriveSecondaryPantsirState(121))
      store.getState().restart()
      expect(store.getState().timeSeconds).toBe(0)
      expect(getSimulationWorldState(store).secondaryPantsir).toEqual(deriveSecondaryPantsirState(0))
    }
  })
})
