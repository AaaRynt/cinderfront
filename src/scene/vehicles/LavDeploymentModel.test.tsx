import { Box3, Group, Matrix4, Mesh, Triangle, Vector3 } from 'three'
import { afterAll, describe, expect, it } from 'vitest'

import type { EmbarkedLavState } from '@/simulation/landingCraftTypes'

import { deriveLandingCraft, deriveLandingWorldState } from '@/simulation/landingCraft'
import { landingQuaternion } from '@/simulation/landingCraftContact'
import { LCAC_IDS, LAV_IDS } from '@/simulation/landingCraftData'
import { deriveLavPayload, lavDepartureAt } from '@/simulation/lavDeployment'
import { appendModel } from '@/test/inspectModel'
/// <reference types="node" />
import { writeStage5cMeasurement } from '@/test/stage5cMeasurements'

import { createLandingRegionalLayout, createLandingServiceLayout } from '../world/landing/landingReservations'
import { getLandingSupportHeight } from '../world/landing/landingTerrain'
import { createLandingModelResources } from './landingModelResources'
import { LandingPayloadModel, LandingVehicleModels, LcacModel } from './LandingModels'

const resources = createLandingModelResources()
afterAll(() => resources.dispose())
const records: unknown[] = []
const triangle = new Triangle(),
  localPoint = new Vector3(),
  closest = new Vector3()
function distanceToMesh(mesh: Mesh, point: Vector3) {
  localPoint.copy(point).applyMatrix4(mesh.matrixWorld.clone().invert())
  const positions = mesh.geometry.getAttribute('position'),
    indices = mesh.geometry.index
  let distance = Infinity
  for (let i = 0; i < (indices?.count ?? positions.count); i += 3) {
    triangle.a.fromBufferAttribute(positions, indices?.getX(i) ?? i)
    triangle.b.fromBufferAttribute(positions, indices?.getX(i + 1) ?? i + 1)
    triangle.c.fromBufferAttribute(positions, indices?.getX(i + 2) ?? i + 2)
    triangle.closestPointToPoint(localPoint, closest)
    // Convert the closest point back to world space for scaled panel meshes.
    distance = Math.min(distance, closest.applyMatrix4(mesh.matrixWorld).distanceTo(point))
  }
  return distance
}
function update(root: Group, state: EmbarkedLavState) {
  const actor = root.getObjectByName(state.id)!,
    { position: p, rotation: r } = state.pose
  actor.position.set(p.x, p.y, p.z)
  actor.rotation.set(r.x, r.y, r.z, 'YXZ')
  for (const wheel of state.wheels) {
    const object = actor.getObjectByName(`lav25-wheel-${wheel.side}-${wheel.axle}`)!
    object.position.y = 0.49 + wheel.suspensionMeters
    object.rotation.y = wheel.steeringRadians
    object.getObjectByName('lav25-wheel-roll')!.rotation.x = wheel.rotationRadians
  }
  root.updateMatrixWorld(true)
}
describe('actual rendered LAV support and complete envelopes', () => {
  it.each(LAV_IDS)(
    '%s rolls over the real deck, hinge, panel top and toe without hull penetration',
    (id) => {
      const ordinal = LAV_IDS.indexOf(id),
        index = Math.floor(ordinal / 4),
        slot = ordinal % 4,
        depart = lavDepartureAt(index, slot)
      const craft = deriveLandingCraft(LCAC_IDS[index]!, depart),
        root = new Group()
      const initial = deriveLavPayload(craft, id, slot, depart)
      appendModel(root, <LandingPayloadModel payload={initial} resources={resources} />)
      const carrier = new Group(),
        p = craft.pose.position,
        r = craft.pose.rotation
      carrier.position.set(p.x, p.y, p.z)
      carrier.rotation.set(r.x, r.y, r.z, 'YXZ')
      appendModel(carrier, <LcacModel mechanics={craft.mechanics} resources={resources} />)
      carrier.updateMatrixWorld(true)
      const deck = carrier.getObjectByName('lcac-cargo-deck')! as Mesh,
        ramp = carrier.getObjectByName('lcac-bow-ramp-panel')! as Mesh
      const deckInverse = deck.matrixWorld.clone().invert(),
        rampInverse = ramp.matrixWorld.clone().invert()
      const carrierInverse = new Matrix4().makeRotationFromQuaternion(landingQuaternion(craft.pose).invert())
      const actor = root.getObjectByName(id)!,
        hull = actor.getObjectByName('lav25-hull')! as Mesh,
        cannon = actor.getObjectByName('lav25-cannon')! as Mesh
      const wheels: Mesh[] = []
      actor.traverse((o) => {
        if (o instanceof Mesh && o.geometry === resources.geometry.wheel) wheels.push(o)
      })
      expect(wheels).toHaveLength(8)
      const actorUuid = actor.uuid,
        geometryIds = wheels.map((w) => w.geometry.uuid)
      const point = new Vector3(),
        scratch = new Vector3()
      const gap = (v: Vector3) => {
        let value = v.y - getLandingSupportHeight(v.x, v.z)
        for (const [inverse, thickness] of [
          [deckInverse, 0.28],
          [rampInverse, 0.12],
        ] as const) {
          scratch.copy(v).applyMatrix4(inverse)
          if (Math.abs(scratch.x) <= 0.5 && Math.abs(scratch.z) <= 0.5) value = Math.min(value, (scratch.y - 0.5) * thickness)
        }
        return value
      }
      let minWheelGap = Infinity,
        maxWheelGap = 0,
        minHullGap = Infinity,
        minBarrelGap = Infinity,
        minRampSide = Infinity,
        maxContactError = 0,
        maxSuspension = 0,
        maxWheelContactGap = 0,
        maxPanelContactError = 0
      const contacts: Record<string, number> = {}
      for (let tick = 0; tick <= Math.round((180 - depart) * 40); tick++) {
        const t = depart + tick / 40,
          state = deriveLavPayload(craft, id, slot, t)
        update(root, state)
        expect(actor.uuid).toBe(actorUuid)
        expect(wheels.map((w) => w.geometry.uuid)).toEqual(geometryIds)
        for (const [wheelIndex, wheel] of state.wheels.entries()) {
          const actualContact = new Vector3(wheel.contact.x, wheel.contact.y, wheel.contact.z)
          maxWheelContactGap = Math.max(maxWheelContactGap, distanceToMesh(wheels[wheelIndex]!, actualContact))
          if (wheel.surface !== 'ground') {
            const surfaces = wheel.surface === 'deck' ? [deck] : (carrier.getObjectByName('lcac-bow-ramp-hinge')!.children as Mesh[])
            maxPanelContactError = Math.max(maxPanelContactError, Math.min(...surfaces.map((mesh) => distanceToMesh(mesh, actualContact))))
          }
          maxSuspension = Math.max(maxSuspension, Math.abs(wheel.suspensionMeters))
          if (wheel.surface === 'ground') maxContactError = Math.max(maxContactError, Math.abs(wheel.contact.y - getLandingSupportHeight(wheel.contact.x, wheel.contact.z)))
          for (const [name, surface] of [
            ['firstRamp', 'ramp'],
            ['firstGround', 'ground'],
          ] as const)
            if (!contacts[name] && wheel.surface === surface) contacts[name] = t
        }
        for (const mesh of wheels) {
          const positions = mesh.geometry.getAttribute('position')
          let closest = Infinity
          for (let v = 0; v < positions.count; v++) {
            point.fromBufferAttribute(positions, v).applyMatrix4(mesh.matrixWorld)
            closest = Math.min(closest, gap(point))
            if (state.wheels.some((w) => w.surface === 'ramp')) {
              point.sub(new Vector3(p.x, p.y, p.z)).applyMatrix4(carrierInverse)
              minRampSide = Math.min(minRampSide, 4.1 - Math.abs(point.x))
            }
          }
          minWheelGap = Math.min(minWheelGap, closest)
          maxWheelGap = Math.max(maxWheelGap, closest)
        }
        for (const [mesh, isHull] of [
          [hull, true],
          [cannon, false],
        ] as const) {
          const positions = mesh.geometry.getAttribute('position')
          for (let v = 0; v < positions.count; v++) {
            point.fromBufferAttribute(positions, v).applyMatrix4(mesh.matrixWorld)
            const clearance = gap(point)
            if (isHull) minHullGap = Math.min(minHullGap, clearance)
            else minBarrelGap = Math.min(minBarrelGap, clearance)
          }
        }
        for (const x of [-1.12, 0, 1.12])
          for (let z = -3.195; z <= 3.195; z += 0.5325) {
            point.set(x, 0.68, z).applyMatrix4(hull.matrixWorld)
            minHullGap = Math.min(minHullGap, gap(point))
          }
        if (!contacts.lastDeck && !state.wheels.some((w) => w.surface === 'deck')) contacts.lastDeck = t
        if (!contacts.lastRamp && state.wheels.every((w) => w.surface === 'ground')) contacts.lastRamp = t
      }
      const measured = { id, minWheelGap, maxWheelGap, minHullGap, minBarrelGap, minRampSide, maxContactError, maxSuspension, maxWheelContactGap, maxPanelContactError, contacts }
      records.push(measured)
      writeStage5cMeasurement('actual-model-contact.json', records)
      expect(minWheelGap).toBeGreaterThan(-0.004)
      // The geometric gap is measured against triangle faces, including an edge
      // between rim vertices. A vertical vertex-only test overstates toe gaps.
      expect(maxWheelContactGap).toBeLessThan(0.008)
      expect(maxPanelContactError).toBeLessThan(0.001)
      expect(minHullGap).toBeGreaterThan(0.3)
      expect(minBarrelGap).toBeGreaterThan(1.5)
      expect(minRampSide).toBeGreaterThan(0.7)
      expect(maxContactError).toBeLessThan(0.004)
      expect(maxSuspension).toBeLessThan(0.27)
    },
    20000,
  )
  it('renders each persistent ID exactly once and retains full same-lane, column and road clearance', () => {
    const cover = createLandingRegionalLayout(),
      equipment = Object.values(createLandingServiceLayout()).flat()
    let minCover = Infinity,
      minEquipment = Infinity
    let minSameLane = Infinity,
      minColumns = Infinity,
      minRoadShoulder = Infinity
    const point = new Vector3(),
      q = new Matrix4(),
      origin = new Vector3()
    for (let tick = 0; tick <= 200; tick++) {
      const t = 160 + tick / 10,
        landing = deriveLandingWorldState(t)
      for (const id of LAV_IDS) {
        const p = landing.payload[id].pose.position,
          radius = 5.2
        for (const item of cover) minCover = Math.min(minCover, Math.hypot(p.x - item.position[0], p.z - item.position[2]) - radius - item.footprintRadius)
        for (const item of equipment) {
          const e = item.elements
          minEquipment = Math.min(minEquipment, Math.hypot(p.x - e[12]!, p.z - e[14]!) - radius - 2 * Math.hypot(e[0]!, e[2]!, e[8]!, e[10]!))
        }
      }
      const boxes = Object.fromEntries(
        LAV_IDS.map((id) => {
          const state = landing.payload[id],
            box = new Box3()
          q.makeRotationFromQuaternion(landingQuaternion(state.localPose))
          origin.set(state.localPose.position.x, state.localPose.position.y, state.localPose.position.z)
          for (const x of [-1.471, 1.471]) for (const y of [-0.27, 2.69]) for (const z of [-3.75, 3.195]) box.expandByPoint(point.set(x, y, z).applyMatrix4(q).add(origin))
          minRoadShoulder = Math.min(minRoadShoulder, 5 - Math.max(Math.abs(box.min.x), Math.abs(box.max.x)))
          return [id, box]
        }),
      ) as Record<(typeof LAV_IDS)[number], Box3>
      for (const start of [0, 4]) {
        const [a, b, c, d] = LAV_IDS.slice(start, start + 4).map((id) => boxes[id]) as [Box3, Box3, Box3, Box3]
        minSameLane = Math.min(minSameLane, c.min.z - a.max.z, d.min.z - b.max.z)
        minColumns = Math.min(minColumns, b.min.x - a.max.x, d.min.x - c.max.x)
      }
      if (tick % 10 === 0) {
        const root = new Group()
        appendModel(root, <LandingVehicleModels landing={landing} resources={resources} />)
        root.updateMatrixWorld(true)
        for (const id of [...LCAC_IDS, ...LAV_IDS]) {
          let count = 0
          root.traverse((o) => {
            if (o.name === id) count++
          })
          expect(count).toBe(1)
        }
        for (const id of LAV_IDS) {
          const hull = root.getObjectByName(id)!.getObjectByName('lav25-hull')! as Mesh
          expect(hull.geometry).toBe(resources.geometry.hull)
          expect(hull.material).toBe(resources.material.lav)
        }
      }
    }
    writeStage5cMeasurement('vehicle-clearances.json', { minSameLane, minColumns, minRoadShoulder, minCover, minEquipment })
    expect(minCover).toBeGreaterThan(2)
    expect(minEquipment).toBeGreaterThan(2)
    expect(minSameLane).toBeGreaterThan(1)
    expect(minColumns).toBeGreaterThan(0.55)
    expect(minRoadShoulder).toBeGreaterThan(1.5)
  })
})
