/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { Group, Mesh, Vector3 } from 'three'
import { afterAll, describe, expect, it } from 'vitest'

import { deriveSimulationWorldState } from '../../../simulation/derive'
import { BTR80_DIMENSIONS_METERS, T72_DIMENSIONS_METERS, deriveBtr80GroupState, deriveT72GroupState } from '../../../simulation/groundVehicles'
import { deriveLandingWorldState } from '../../../simulation/landingCraft'
import { deriveSecondaryPantsirState } from '../../../simulation/secondaryPantsir'
import { deriveSupportConvoyState, SUPPORT_DIMENSIONS } from '../../../simulation/supportConvoy'
import { appendModel } from '../../../test/inspectModel'
import { Btr80Model } from '../../vehicles/Btr80Model'
import { createLandingModelResources } from '../../vehicles/landingModelResources'
import { LandingVehicleModels } from '../../vehicles/LandingModels'
import { PantsirModel } from '../../vehicles/PantsirModel'
import { SupportVehicleModel } from '../../vehicles/SupportVehicleModel'
import { T72BModel } from '../../vehicles/T72BModel'
import { ROAD_DEFINITIONS } from '../stage2/stage2Data'
import { distanceToPolyline } from '../stage2/terrainModel'
import { intersectsReservation } from '../stage4c/spatialReservations'
import { getLandscapeMovementReservations, LANDSCAPE_ACTOR_RADII } from './landscapeReservations'
import { createTreeLayout } from './treeLayout'
const resources = createLandingModelResources()
afterAll(() => resources.dispose())
function radius(root: Group, center: Vector3) {
  root.updateMatrixWorld(true)
  let r = 0
  root.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.computeBoundingBox()
      const b = o.geometry.boundingBox!
      for (const x of [b.min.x, b.max.x])
        for (const y of [b.min.y, b.max.y])
          for (const z of [b.min.z, b.max.z]) {
            const v = new Vector3(x, y, z).applyMatrix4(o.matrixWorld).sub(center)
            r = Math.max(r, Math.hypot(v.x, v.z))
          }
    }
  })
  return r
}
describe('Stage 6A actual complete moving envelopes', () => {
  it('encloses the rendered ramp, cargo, wheels, suspension, guns and deployed mechanics at their full extrema', () => {
    const maxima = { lcac: 0, lav: 0, pantsir: 0, btr: 0, t72: 0, support: 0 }
    for (const t of [0, 110, 112, 115, 117.2, 118.8, 119.6, 121, 140, 148, 155, 158.8, 160, 162, 163.15, 165.2, 166, 168.2, 169, 172, 175, 176, 178.2, 180]) {
      const world = deriveLandingWorldState(t),
        scene = new Group()
      appendModel(scene, <LandingVehicleModels landing={world} resources={resources} />)
      scene.updateMatrixWorld(true)
      for (const c of Object.values(world.crafts)) {
        const r = radius(scene.getObjectByName(c.id)! as Group, new Vector3(c.pose.position.x, c.pose.position.y, c.pose.position.z))
        maxima.lcac = Math.max(maxima.lcac, r)
        expect(r + 1).toBeLessThan(LANDSCAPE_ACTOR_RADII.lcac)
      }
      for (const v of Object.values(world.payload)) {
        const r = radius(scene.getObjectByName(v.id)! as Group, new Vector3(v.pose.position.x, v.pose.position.y, v.pose.position.z))
        maxima.lav = Math.max(maxima.lav, r)
        expect(r + 1).toBeLessThan(LANDSCAPE_ACTOR_RADII.lav)
      }
      const p = deriveSecondaryPantsirState(t),
        m = p.mechanical,
        root = new Group()
      root.rotation.set(p.pose.rotation.x, p.pose.rotation.y, p.pose.rotation.z, 'YXZ')
      appendModel(
        root,
        <PantsirModel
          turretYaw={m.turretYawRadians}
          radarRotation={m.radarRotationRadians}
          launcherElevation={m.launcherElevationRadians}
          wheelTravelMeters={m.wheelTravelMeters}
          steeringRadians={m.steeringRadians}
          stabilizerDeployment={m.stabilizerDeployment}
          radarDeployment={m.radarDeployment}
          destroyed={p.condition === 'destroyed'}
          destructionAge={p.destruction.ageSeconds}
        />,
      )
      maxima.pantsir = Math.max(maxima.pantsir, radius(root, new Vector3()))
      expect(radius(root, new Vector3()) + 1).toBeLessThan(LANDSCAPE_ACTOR_RADII.pantsir)
    }
    for (const turretYaw of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      const btr = new Group(),
        tank = new Group()
      appendModel(btr, <Btr80Model turretYawRadians={turretYaw} />)
      appendModel(tank, <T72BModel turretYawRadians={turretYaw} />)
      maxima.btr = Math.max(maxima.btr, radius(btr, new Vector3()))
      maxima.t72 = Math.max(maxima.t72, radius(tank, new Vector3()))
    }
    expect(maxima.btr + 1).toBeLessThan(Math.hypot(BTR80_DIMENSIONS_METERS.length, BTR80_DIMENSIONS_METERS.width) / 2 + 2)
    expect(maxima.t72 + 0.5).toBeLessThan(Math.hypot(T72_DIMENSIONS_METERS.gunForwardLength - T72_DIMENSIONS_METERS.hullLength / 2, T72_DIMENSIONS_METERS.width / 2) + 2)
    for (const v of Object.values(deriveSupportConvoyState(0).convoy.vehicles)) {
      const root = new Group()
      appendModel(root, <SupportVehicleModel subtype={v.subtype} alternateLoad={false} wheelRotationRadians={0} steeringRadians={0.58} lighting={v.lighting} />)
      const r = radius(root, new Vector3()),
        d = SUPPORT_DIMENSIONS[v.subtype]
      maxima.support = Math.max(maxima.support, r)
      expect(r + 0.5).toBeLessThan(Math.hypot(d.length, d.width) / 2 + 2)
    }
    if (process.env.CINDERFRONT_STAGE6A_MEASUREMENTS === '1') writeFileSync('stage6a-review.local/model-envelopes.json', JSON.stringify(maxima, null, 2))
  })
  it('covers unsampled midpoints and retains actual crown clearance throughout 0–180, including the last four seconds', () => {
    const trees = createTreeLayout(),
      rs = getLandscapeMovementReservations()
    let minClearance = Infinity,
      maxChordError = 0
    for (let tick = 0; tick <= 1440; tick++) {
      const t = tick / 8,
        world = deriveSimulationWorldState(t),
        actors = [...Object.values(deriveBtr80GroupState(t, () => 0).vehicles), ...Object.values(deriveT72GroupState(t, () => 0).vehicles), ...Object.values(deriveSupportConvoyState(t).convoy.vehicles), world.secondaryPantsir, ...Object.values(world.landing.crafts), ...Object.values(world.landing.payload)]
      for (const actor of actors) {
        const r = rs.find((r) => r.id === actor.id)!
        expect(r?.kind).toBe('path')
        if (r.kind !== 'path') throw new Error(actor.id)
        const p = actor.pose.position,
          points = r.segments.flatMap((s) => s.points)
        const error = distanceToPolyline(p.x, p.z, points)
        maxChordError = Math.max(maxChordError, error)
        expect(error).toBeLessThan(0.2)
        // A 32-point ring tests the whole conservative body envelope along the
        // interpolated sweep, not only its center at seed-sampling timestamps.
        for (let k = 0; k < 32; k++) {
          const a = (k / 32) * Math.PI * 2
          expect(intersectsReservation(p.x + Math.cos(a) * (r.radius - 0.25), p.z + Math.sin(a) * (r.radius - 0.25), 0, r)).toBe(true)
        }
        for (const tree of trees) {
          const gap = Math.hypot(tree.position[0] - p.x, tree.position[2] - p.z) - tree.radius - r.radius
          minClearance = Math.min(minClearance, gap)
          expect(gap).toBeGreaterThan(2)
        }
      }
    }
    let roadClearance = Infinity
    for (const road of ROAD_DEFINITIONS.filter((r) => ['road_beach_exit', 'road_beach_access_east'].includes(r.id)))
      for (const tree of trees) {
        const gap = distanceToPolyline(tree.position[0], tree.position[2], road.points) - tree.radius - road.widthM / 2 - 7
        roadClearance = Math.min(roadClearance, gap)
        expect(gap).toBeGreaterThan(2)
      }
    if (process.env.CINDERFRONT_STAGE6A_MEASUREMENTS === '1') writeFileSync('stage6a-review.local/movement-clearance.json', JSON.stringify({ samples: 1441, step: 0.125, minClearance, roadClearance, maxChordError }, null, 2))
  }, 20000)
})
