/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { Group, Mesh, Vector3 } from 'three'
import { afterAll, describe, expect, it } from 'vitest'

import type { EmbarkedLavState } from './landingCraftTypes'

import { createLandingModelResources } from '../scene/vehicles/landingModelResources'
import { LandingPayloadModel, LcacModel } from '../scene/vehicles/LandingModels'
import { getLandingSupportHeight } from '../scene/world/landing/landingTerrain'
import { createExistingLandscapeEnvelopes } from '../scene/world/landscape/landscapeReservations'
import { createLegacyVegetationLayouts } from '../scene/world/landscape/legacyVegetation'
import { createTreeLayout } from '../scene/world/landscape/treeLayout'
import { AMMUNITION_BUNKERS, BEACH_FEATURES, CORRIDOR_FEATURES, FUEL_BUND_CELLS, FUEL_PIPE_DEFINITIONS, HARBOR_FEATURES, INDUSTRIAL_FEATURES, PIPELINE_HARBOR_FUEL_TRUNK, POWER_LINES, RAIL_DEFINITIONS, SECURITY_FENCES } from '../scene/world/stage2/stage2Data'
import { distanceToPolyline, pointInPolygon } from '../scene/world/stage2/terrainModel'
import { AAA_SITE, COMMUNICATIONS_MAST_SITE, RADAR_SEARCH_SITE, RADAR_SUPPORT_POLYGONS, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../scene/world/worldData'
import { appendModel } from '../test/inspectModel'
import { deriveLandingWorldState } from './landingCraft'
import { LAV_IDS } from './landingCraftData'
import { deriveRuntimeLavPayload, lavRoadTiming } from './lavAftermath'

const resources = createLandingModelResources()
afterAll(() => resources.dispose())
const existing = createExistingLandscapeEnvelopes(),
  trees = createTreeLayout(),
  unmountedLegacyIds = new Set(createLegacyVegetationLayouts().flatMap((l) => [...l.grass, ...l.scrub].map((i) => i.responseId))),
  allScenery = [...existing, ...trees.map((t) => ({ id: t.id, kind: 'circle' as const, center: [t.position[0], t.position[2]] as const, radius: t.radius }))]
function update(root: Group, state: EmbarkedLavState) {
  const actor = root.getObjectByName(state.id)!,
    p = state.pose.position,
    r = state.pose.rotation
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

describe('Stage 6B complete rendered LAV and grounded craft envelopes', () => {
  it.each(LAV_IDS)('%s continuation clears the actual existing scenery, crowns and infrastructure', (id) => {
    const ordinal = LAV_IDS.indexOf(id),
      index = Math.floor(ordinal / 4),
      slot = ordinal % 4,
      end = deriveLandingWorldState(180),
      craft = end.crafts[index === 0 ? 'attacker_lcac_01' : 'attacker_lcac_02']
    // WorldShell mounts RegionalCover, SparseTrees and the legacy rock clusters.
    // VegetationSystem remains unmounted; its exact records are retained for
    // historical seed/reservation audits, rather than treated as rendered props.
    const activeScenery = allScenery.filter((s) => !unmountedLegacyIds.has(s.id)),
      scenery = activeScenery.filter((s) => s.kind === 'circle' && s.center[0] > (index === 0 ? 3900 : 5250) && s.center[0] < (index === 0 ? 4500 : 6150) && s.center[1] > -3200 && s.center[1] < -2000)
    const polygons = [
      CORRIDOR_FEATURES.bridge,
      CORRIDOR_FEATURES.substation,
      ...HARBOR_FEATURES.warehouses.map((v) => v.points),
      ...[...HARBOR_FEATURES.piers, ...HARBOR_FEATURES.jetties, ...HARBOR_FEATURES.breakwaters, HARBOR_FEATURES.electricalServiceFacility, HARBOR_FEATURES.defenseEmplacement].map((v) => v.points),
      ...FUEL_BUND_CELLS.map((v) => v.points),
      ...AMMUNITION_BUNKERS.map((v) => v.berm),
      ...INDUSTRIAL_FEATURES.utilities.map((v) => v.points),
      ...RADAR_SUPPORT_POLYGONS,
      ...BEACH_FEATURES.defensiveRemains,
    ]
    const lines = [...SECURITY_FENCES, ...RAIL_DEFINITIONS.map((v) => v.points), ...FUEL_PIPE_DEFINITIONS.map((v) => v.points), PIPELINE_HARBOR_FUEL_TRUNK, ...POWER_LINES]
    const equipment = [RADAR_SEARCH_SITE, RADAR_TRACKING_SITE, ...SAM_PAD_POSITIONS, AAA_SITE, COMMUNICATIONS_MAST_SITE]
    let minSceneryGap = Infinity,
      minTreeCrownGap = Infinity,
      minInfrastructureGap = Infinity,
      maxRenderedRadius = 0,
      minHullGap = Infinity,
      minBarrelGap = Infinity,
      maxSampleStepMeters = 0
    let vertexSamples = 0,
      worstScenery: unknown = null
    {
      const timing = lavRoadTiming(index, slot, craft),
        root = new Group(),
        initial = deriveRuntimeLavPayload(craft, id, slot, 180)
      appendModel(root, <LandingPayloadModel payload={initial} resources={resources} />)
      const actor = root.getObjectByName(id)!,
        meshes: Mesh[] = []
      actor.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.computeBoundingBox()
          meshes.push(o)
        }
      })
      const uuid = actor.uuid
      let previous = initial.pose.position
      for (let tick = 0; tick <= Math.ceil((timing.holdAtSeconds - 180) * 4); tick++) {
        const s = deriveRuntimeLavPayload(craft, id, slot, Math.min(timing.holdAtSeconds, 180 + tick / 4)),
          p = s.pose.position
        update(root, s)
        expect(actor.uuid).toBe(uuid)
        maxSampleStepMeters = Math.max(maxSampleStepMeters, Math.hypot(p.x - previous.x, p.z - previous.z))
        previous = p
        let radius = 0
        for (const mesh of meshes) {
          const b = mesh.geometry.boundingBox!
          for (const x of [b.min.x, b.max.x])
            for (const y of [b.min.y, b.max.y])
              for (const z of [b.min.z, b.max.z]) {
                const v = new Vector3(x, y, z).applyMatrix4(mesh.matrixWorld)
                radius = Math.max(radius, Math.hypot(v.x - p.x, v.z - p.z))
                vertexSamples++
              }
          if (s.roadStationMeters !== undefined && (mesh.name === 'lav25-hull' || mesh.name === 'lav25-cannon')) {
            const vertices = mesh.geometry.getAttribute('position')
            for (let n = 0; n < vertices.count; n++) {
              const v = new Vector3().fromBufferAttribute(vertices, n).applyMatrix4(mesh.matrixWorld),
                gap = v.y - getLandingSupportHeight(v.x, v.z)
              if (mesh.name === 'lav25-hull') minHullGap = Math.min(minHullGap, gap)
              else minBarrelGap = Math.min(minBarrelGap, gap)
            }
          }
        }
        maxRenderedRadius = Math.max(maxRenderedRadius, radius)
        // The additional 1.2 m encloses the <=1.13 m intersample motion as
        // well as all complete rendered-model corners, without seed masks.
        const sweptRadius = radius + 1.2
        for (const obstacle of scenery) {
          if (obstacle.kind !== 'circle') throw new Error('Unexpected scenery envelope')
          const gap = Math.hypot(p.x - obstacle.center[0], p.z - obstacle.center[1]) - sweptRadius - obstacle.radius
          if (gap < minSceneryGap) worstScenery = { id, t: 180 + tick / 4, obstacle, pose: s.pose, radius }
          minSceneryGap = Math.min(minSceneryGap, gap)
        }
        for (const tree of trees) minTreeCrownGap = Math.min(minTreeCrownGap, Math.hypot(p.x - tree.position[0], p.z - tree.position[2]) - sweptRadius - tree.radius)
        for (const polygon of polygons) {
          expect(pointInPolygon(p.x, p.z, polygon)).toBe(false)
          minInfrastructureGap = Math.min(minInfrastructureGap, distanceToPolyline(p.x, p.z, [...polygon, polygon[0]!]) - sweptRadius)
        }
        for (const line of lines) minInfrastructureGap = Math.min(minInfrastructureGap, distanceToPolyline(p.x, p.z, line) - sweptRadius - 2)
        for (const fixture of equipment) minInfrastructureGap = Math.min(minInfrastructureGap, Math.hypot(p.x - fixture.position[0], p.z - fixture.position[2]) - sweptRadius - ('radiusM' in fixture ? fixture.radiusM : 2))
      }
    }
    const carrierRoot = new Group(),
      cp = craft.pose.position,
      cr = craft.pose.rotation
    carrierRoot.position.set(cp.x, cp.y, cp.z)
    carrierRoot.rotation.set(cr.x, cr.y, cr.z, 'YXZ')
    appendModel(carrierRoot, <LcacModel mechanics={craft.mechanics} resources={resources} />)
    carrierRoot.updateMatrixWorld(true)
    let maxOpenCraftRadius = 0
    carrierRoot.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.computeBoundingBox()
        const b = o.geometry.boundingBox!
        for (const x of [b.min.x, b.max.x])
          for (const y of [b.min.y, b.max.y])
            for (const z of [b.min.z, b.max.z]) {
              const v = new Vector3(x, y, z).applyMatrix4(o.matrixWorld)
              maxOpenCraftRadius = Math.max(maxOpenCraftRadius, Math.hypot(v.x - cp.x, v.z - cp.z))
            }
      }
    })
    let minCraftTreeGap = Infinity
    for (const tree of trees) minCraftTreeGap = Math.min(minCraftTreeGap, Math.hypot(cp.x - tree.position[0], cp.z - tree.position[2]) - maxOpenCraftRadius - tree.radius)
    const measured = {
      sceneryRecords: allScenery.length,
      activeSceneryEnvelopes: activeScenery.length,
      preservedUnmountedLegacyRecords: unmountedLegacyIds.size,
      nearbySceneryEnvelopes: scenery.length,
      treeCrowns: trees.length,
      vertexSamples,
      maxSampleStepMeters,
      maxRenderedRadius,
      maxOpenCraftRadius,
      minSceneryGap,
      minTreeCrownGap,
      minCraftTreeGap,
      minInfrastructureGap,
      minHullGap,
      minBarrelGap,
      worstScenery,
    }
    if (process.env.CINDERFRONT_STAGE6B_MEASUREMENTS === '1') writeFileSync(`stage6b-review.local/lav-envelopes-${id}.json`, JSON.stringify(measured, null, 2))
    expect(allScenery).toHaveLength(5748)
    expect(trees).toHaveLength(32)
    expect(maxSampleStepMeters).toBeLessThan(1.13)
    expect(maxRenderedRadius).toBeLessThan(5.2)
    expect(maxOpenCraftRadius).toBeLessThan(22)
    expect(minSceneryGap).toBeGreaterThan(0.5)
    expect(minTreeCrownGap).toBeGreaterThan(10)
    expect(minCraftTreeGap).toBeGreaterThan(10)
    expect(minInfrastructureGap).toBeGreaterThan(10)
    expect(minHullGap).toBeGreaterThan(0.05)
    expect(minBarrelGap).toBeGreaterThan(1.9)
  })
})
