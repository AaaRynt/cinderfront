import { writeFileSync } from 'node:fs'
import { Box3, CylinderGeometry, Group, Matrix4, Mesh, Triangle, Vector3, type Object3D } from 'three'
import { afterAll, describe, expect, it, vi } from 'vitest'

import { deriveRuntimeLandingWorldState } from '@/simulation/landingAftermath'
import { LCAC_IDS, LCAC_RAMP, LCAC_SKIRT_PERIMETER, LAV_DIMENSIONS } from '@/simulation/landingCraftData'
import { appendModel } from '@/test/inspectModel'

import { getLandingSupportHeight } from '../world/landing/landingTerrain'
import { ROAD_DEFINITIONS } from '../world/stage2/stage2Data'
import { distanceToPolyline } from '../world/stage2/terrainModel'
import { createLandingModelResources } from './landingModelResources'
import { LandingVehicleModels, LcacModel } from './LandingModels'

const resources = createLandingModelResources()
afterAll(() => resources.dispose())

function meshBounds(mesh: Mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
  return mesh.geometry.boundingBox!
}

/** Bounding every transformed leaf keeps rotated hubs and barrel ends in the audit. */
function boundsIn(object: Object3D, fromWorld: Matrix4) {
  const bounds = new Box3()
  const transformed = new Box3()
  const matrix = new Matrix4()
  object.traverse((leaf) => {
    if (leaf instanceof Mesh) bounds.union(transformed.copy(meshBounds(leaf)).applyMatrix4(matrix.multiplyMatrices(fromWorld, leaf.matrixWorld)))
  })
  return bounds
}

function separation(a: Box3, b: Box3) {
  return Math.max(a.min.x - b.max.x, b.min.x - a.max.x, a.min.y - b.max.y, b.min.y - a.max.y, a.min.z - b.max.z, b.min.z - a.max.z)
}

function coversPanel(box: Box3) {
  return box.min.x <= 0.5 && box.max.x >= -0.5 && box.min.z <= 0.5 && box.max.z >= -0.5
}

function clip(polygon: Vector3[], axis: 'x' | 'z', bound: number, direction: number) {
  return polygon.flatMap((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!
    const inside = (a[axis] - bound) * direction >= 0
    const nextInside = (b[axis] - bound) * direction >= 0
    if (inside === nextInside) return inside ? [a] : []
    const cross = a.clone().lerp(b, (bound - a[axis]) / (b[axis] - a[axis]))
    return inside ? [a, cross] : [cross]
  })
}

function panelPatch(polygon: Vector3[], halfWidth: number, near: number, far: number) {
  const width = clip(clip(polygon, 'x', -halfWidth, 1), 'x', halfWidth, -1)
  return clip(clip(width, 'z', near, 1), 'z', far, -1)
}

function surfaceGap(mesh: Mesh, projection: Box3, matrix: Matrix4, thickness: number) {
  if (!coversPanel(projection)) return Infinity
  const intervalGap = (lo: number, hi: number) => Math.max(lo - 0.5, -0.5 - hi) * thickness
  const boundsGap = intervalGap(projection.min.y, projection.max.y)
  if (boundsGap > 0) return boundsGap
  // A rolled hub's bounding box can cross the plane outside the real rim.
  // Clip actual triangles to the finite panel when the boxes cannot separate.
  const vertices = mesh.geometry.getAttribute('position')
  const points = Array.from({ length: vertices.count }, (_, i) => new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(matrix))
  const index = mesh.geometry.index
  let gap = Infinity
  for (let i = 0; i < (index?.count ?? vertices.count); i += 3) {
    const patch = panelPatch([points[index?.getX(i) ?? i]!, points[index?.getX(i + 1) ?? i + 1]!, points[index?.getX(i + 2) ?? i + 2]!], 0.5, -0.5, 0.5)
    if (patch.length) gap = Math.min(gap, intervalGap(Math.min(...patch.map((p) => p.y)), Math.max(...patch.map((p) => p.y))))
  }
  return gap
}

/** Clip the curved bow skin to the ramp footprint before checking its underside. */
function skirtToRamp(skirt: Mesh, hinge: Object3D) {
  const transform = new Matrix4().copy(hinge.matrixWorld).invert().multiply(skirt.matrixWorld)
  const vertices = skirt.geometry.getAttribute('position')
  const points = Array.from({ length: vertices.count }, (_, i) => new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(transform))
  const index = skirt.geometry.index!
  let gap = Infinity
  for (let i = 0; i < index.count; i += 3) {
    const patch = panelPatch([points[index.getX(i)]!, points[index.getX(i + 1)]!, points[index.getX(i + 2)]!], LCAC_RAMP.width / 2, -LCAC_RAMP.length, 0)
    for (const point of patch) gap = Math.min(gap, -LCAC_RAMP.thickness - point.y)
  }
  return gap
}

function segmentDistance(a: Vector3, b: Vector3) {
  const x = b.x - a.x
  const y = b.y - a.y
  const lengthSquared = x * x + y * y
  const t = lengthSquared > 0 ? Math.min(1, Math.max(0, -(a.x * x + a.y * y) / lengthSquared)) : 0
  return Math.hypot(a.x + t * x, a.y + t * y)
}

describe('landing visual finish', () => {
  it('retains the tire triangles and original skirt anchors under the new finish', () => {
    const { wheelRadius, wheelWidth } = LAV_DIMENSIONS
    const reference = new CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 20)
    for (const name of ['position', 'normal', 'uv']) expect(resources.geometry.wheel.getAttribute(name).array).toEqual(reference.getAttribute(name).array)
    expect(resources.geometry.wheel.index?.array).toEqual(reference.index?.array)
    reference.dispose()
    const points = resources.geometry.skirt.getAttribute('position')
    const bottom = Array.from({ length: points.count }, (_, i) => [points.getX(i), points.getY(i), points.getZ(i)]).filter(([, y]) => y === 0)
    expect(bottom).toEqual([...LCAC_SKIRT_PERIMETER, LCAC_SKIRT_PERIMETER[0]!].map(([x, z]) => [Math.fround(x), 0, Math.fround(z)]))
    for (const [x, z] of LCAC_SKIRT_PERIMETER) {
      const top = z < -12 && Math.abs(x) < 4.2 ? 0.55 : 1.35
      const anchor = Array.from({ length: points.count }, (_, i) => i).find((i) => points.getY(i) === Math.fround(top) && points.getX(i) === Math.fround(x * 0.97) && points.getZ(i) === Math.fround(z * 0.985))
      expect(anchor).toBeDefined()
    }
  })

  it('keeps the fixed ducts and guards clear of the complete live rotor sweep', () => {
    const root = new Group()
    appendModel(root, <LcacModel resources={resources} mechanics={deriveRuntimeLandingWorldState(0).crafts.attacker_lcac_01.mechanics} />)
    root.updateMatrixWorld(true)
    const fan = root.getObjectByName('lcac-fan-1')!
    const rotor = fan.getObjectByName('lcac-fan-rotor')!
    const inverse = fan.matrixWorld.clone().invert()
    const point = new Vector3()
    let rotorRadius = 0
    let rotorDepth = 0
    rotor.traverse((o) => {
      if (!(o instanceof Mesh)) return
      const vertices = o.geometry.getAttribute('position')
      const matrix = inverse.clone().multiply(o.matrixWorld)
      for (let i = 0; i < vertices.count; i++) {
        point.fromBufferAttribute(vertices, i).applyMatrix4(matrix)
        rotorRadius = Math.max(rotorRadius, Math.hypot(point.x, point.y))
        rotorDepth = Math.max(rotorDepth, Math.abs(point.z))
      }
    })
    const duct = fan.getObjectByName('lcac-fan-duct')! as Mesh
    const bounds = meshBounds(duct)
    expect(bounds.min.toArray()).toEqual([-2.25, -2.25, Math.fround(-0.175)])
    expect(bounds.max.toArray()).toEqual([2.25, 2.25, Math.fround(0.175)])
    const positions = duct.geometry.getAttribute('position')
    const triangle = new Triangle()
    const origin = new Vector3()
    let bladeGap = Infinity
    let hubGap = Infinity
    for (let i = 0; i < positions.count; i += 3) {
      const corners = [triangle.a, triangle.b, triangle.c].map((v, j) => v.fromBufferAttribute(positions, i + j))
      const z = corners.map((v) => v.z)
      corners.forEach((v) => (v.z = 0))
      const radialGap = triangle.getArea() > 1e-12 ? triangle.closestPointToPoint(origin, point).length() : Math.min(segmentDistance(triangle.a, triangle.b), segmentDistance(triangle.b, triangle.c), segmentDistance(triangle.c, triangle.a))
      if (Math.min(...z) <= rotorDepth && Math.max(...z) >= -rotorDepth) bladeGap = Math.min(bladeGap, radialGap - rotorRadius)
      hubGap = Math.min(hubGap, radialGap - 0.26)
    }
    expect(bladeGap).toBeGreaterThan(0.04)
    expect(hubGap).toBeGreaterThan(0.035)
  })

  it('keeps all wheel arches and hubs within the prior running-gear sweep', () => {
    const { lavArches, wheelFace } = resources.geometry
    lavArches.computeBoundingBox()
    expect(lavArches.boundingBox!.min.y - (2 * LAV_DIMENSIONS.wheelRadius + 0.27)).toBeGreaterThan(0.039)
    const vertices = wheelFace.getAttribute('position')
    for (let i = 0; i < vertices.count; i++) {
      expect(vertices.getX(i)).toBeLessThanOrEqual(0.171)
      expect(Math.hypot(vertices.getY(i), vertices.getZ(i))).toBeLessThan(0.29)
    }
  })

  it('keeps complete mounted envelopes clear through both ramps and the road turns', () => {
    const times = [0, 110, ...Array.from({ length: 195 }, (_, i) => 140 + i / 4), ...Array.from({ length: 158 }, (_, i) => 189 + i)]
    const results = LCAC_IDS.map((id) => ({ id, minMachinery: Infinity, minNeighbor: Infinity, minRampSide: Infinity, minSkirtRamp: Infinity, minNonTirePanel: Infinity, minNonTireGround: Infinity, minRoadShoulder: Infinity, maxSteering: 0, maxSuspension: 0, roadSamples: 0, rampSamples: 0 }))
    const point = new Vector3()
    const projection = new Box3()
    const matrix = new Matrix4()
    for (const time of times) {
      const landing = deriveRuntimeLandingWorldState(time)
      const root = new Group()
      appendModel(root, <LandingVehicleModels resources={resources} landing={landing} />)
      root.updateMatrixWorld(true)
      for (const metrics of results) {
        const craft = root.getObjectByName(metrics.id)!
        const craftInverse = craft.matrixWorld.clone().invert()
        const hinge = craft.getObjectByName('lcac-bow-ramp-hinge')!
        const deck = craft.getObjectByName('lcac-cargo-deck')!
        const ramp = craft.getObjectByName('lcac-bow-ramp-panel')!
        const surfaces = [
          [deck.matrixWorld.clone().invert(), 0.28],
          [ramp.matrixWorld.clone().invert(), LCAC_RAMP.thickness],
        ] as const
        metrics.minSkirtRamp = Math.min(metrics.minSkirtRamp, skirtToRamp(craft.getObjectByName('lcac-flexible-skirt')! as Mesh, hinge))
        const machinery = ['lcac-side-machinery', 'lcac-sealed-control-cabin', 'lcac-stern-ramp-closed', 'lcac-fan--1', 'lcac-fan-1'].flatMap((name) => craft.getObjectsByProperty('name', name).map((o) => boundsIn(o, craftInverse)))
        const cargo = landing.crafts[metrics.id].payloadIds.map((id) => {
          const actor = root.getObjectByName(id)!
          const payload = landing.payload[id]
          const bounds = boundsIn(actor, craftInverse)
          metrics.minMachinery = Math.min(metrics.minMachinery, ...machinery.map((obstacle) => separation(bounds, obstacle)))
          if (payload.wheels.some((wheel) => wheel.surface === 'ramp')) {
            metrics.minRampSide = Math.min(metrics.minRampSide, LCAC_RAMP.width / 2 - Math.max(-bounds.min.x, bounds.max.x))
            metrics.rampSamples++
          }
          metrics.maxSteering = Math.max(metrics.maxSteering, ...payload.wheels.map((wheel) => Math.abs(wheel.steeringRadians)))
          metrics.maxSuspension = Math.max(metrics.maxSuspension, ...payload.wheels.map((wheel) => Math.abs(wheel.suspensionMeters)))
          const road = payload.roadStationMeters === undefined ? undefined : ROAD_DEFINITIONS.find(({ id }) => id === payload.roadId)!
          if (road) metrics.roadSamples++
          actor.traverse((o) => {
            if (!(o instanceof Mesh)) return
            const box = meshBounds(o)
            const tire = o.geometry === resources.geometry.wheel
            if (!tire && payload.occupancy !== 'ashore') {
              for (const [inverse, thickness] of surfaces) {
                projection.copy(box).applyMatrix4(matrix.multiplyMatrices(inverse, o.matrixWorld))
                metrics.minNonTirePanel = Math.min(metrics.minNonTirePanel, surfaceGap(o, projection, matrix, thickness))
              }
            }
            let groundGap = Infinity
            for (const x of [box.min.x, box.max.x]) {
              for (const y of [box.min.y, box.max.y]) {
                for (const z of [box.min.z, box.max.z]) {
                  point.set(x, y, z).applyMatrix4(o.matrixWorld)
                  if (!tire) groundGap = Math.min(groundGap, point.y - getLandingSupportHeight(point.x, point.z))
                  if (road) metrics.minRoadShoulder = Math.min(metrics.minRoadShoulder, road.widthM / 2 - distanceToPolyline(point.x, point.z, road.points))
                }
              }
            }
            if (!tire && groundGap <= 0) {
              groundGap = Infinity
              const vertices = o.geometry.getAttribute('position')
              for (let i = 0; i < vertices.count; i++) {
                point.fromBufferAttribute(vertices, i).applyMatrix4(o.matrixWorld)
                groundGap = Math.min(groundGap, point.y - getLandingSupportHeight(point.x, point.z))
              }
            }
            metrics.minNonTireGround = Math.min(metrics.minNonTireGround, groundGap)
          })
          return { actor, bounds }
        })
        for (const [i, a] of cargo.entries()) {
          const inverse = a.actor.matrixWorld.clone().invert()
          const own = boundsIn(a.actor, inverse)
          for (const b of cargo.slice(i + 1)) metrics.minNeighbor = Math.min(metrics.minNeighbor, Math.max(separation(a.bounds, b.bounds), separation(own, boundsIn(b.actor, inverse))))
        }
      }
    }
    if (process.env.CINDERFRONT_STAGE9B_MEASUREMENTS === '1') writeFileSync('stage9b-review.local/clearances.json', JSON.stringify({ times: times.length, results }, null, 2) + '\n')
    for (const result of results) {
      expect(result.minMachinery, result.id).toBeGreaterThan(0.75)
      expect(result.minNeighbor, result.id).toBeGreaterThan(0.5)
      expect(result.minRampSide, result.id).toBeGreaterThan(0.7)
      expect(result.minSkirtRamp, result.id).toBeGreaterThan(0)
      expect(result.minNonTirePanel, result.id).toBeGreaterThan(0)
      expect(result.minNonTireGround, result.id).toBeGreaterThan(0)
      expect(result.minRoadShoulder, result.id).toBeGreaterThan(0)
      expect(result.maxSteering, result.id).toBeGreaterThan(0)
      expect(result.rampSamples).toBeGreaterThan(20)
      expect(result.roadSamples).toBeGreaterThan(200)
    }
  }, 20000)

  it('shares the flush materials across both craft and releases all owned resources', () => {
    const local = createLandingModelResources()
    const disposals = [...Object.values(local.geometry), ...Object.values(local.material), ...Object.values(local.textures)].map((owner) => vi.spyOn(owner, 'dispose'))
    const root = new Group()
    appendModel(root, <LandingVehicleModels resources={local} landing={deriveRuntimeLandingWorldState(110)} />)
    for (const name of ['lcac-cargo-deck', 'lcac-bow-ramp-panel', 'lcac-flexible-skirt', 'lav25-wheel-hub']) {
      const mounted = root.getObjectsByProperty('name', name) as Mesh[]
      expect(mounted).toHaveLength(name === 'lav25-wheel-hub' ? 64 : 2)
      expect(mounted.every((mesh) => mesh.material === mounted[0]!.material && mesh.geometry === mounted[0]!.geometry)).toBe(true)
    }
    expect(local.material.deck.map).toBe(local.textures.deck)
    expect(local.material.ramp.map).toBe(local.textures.ramp)
    expect(local.material.skirt.map).toBe(local.textures.skirt)
    local.dispose()
    expect(disposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true)
  })
})
