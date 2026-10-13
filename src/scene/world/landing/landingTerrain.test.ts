/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3, type BufferGeometry } from 'three'
import { describe, expect, it } from 'vitest'

import { LANDING_CONTACT_POINTS, sampleLandingContact, transformLandingPoint } from '../../../simulation/landingCraftContact'
import { LCAC_IDS } from '../../../simulation/landingCraftData'
import { ROAD_DEFINITIONS } from '../stage2/stage2Data'
import { createCoastSkirtGeometry, createContinuousMainlandGeometry, createTerrainRoadGeometry } from '../stage2/terrainGeometry'
import { pointInPolygon } from '../stage2/terrainModel'
import { sampleTerrainPolyline } from '../stage2/terrainModel'
import { MAINLAND_POLYGON_XZ } from '../worldData'
import { LANDING_SEA_LEVEL, LANDING_SITES } from './landingSiteData'
import { applyLandingSurface, createLandingCoastGeometry, createLandingMainlandGeometry, getLandingGroundHeight, getLandingSupportHeight, landingCoastZ, landingRoadClearance } from './landingTerrain'

function faces(geometry: BufferGeometry) {
  const p = geometry.getAttribute('position'),
    count = geometry.index?.count ?? p.count
  return Array.from({ length: count / 3 }, (_, face) =>
    Array.from({ length: 3 }, (_, corner) => {
      const index = geometry.index?.getX(face * 3 + corner) ?? face * 3 + corner
      return Object.fromEntries(Object.entries(geometry.attributes).map(([key, attribute]) => [key, Array.from({ length: attribute.itemSize }, (_, n) => attribute.array[index * attribute.itemSize + n])]))
    }),
  )
}
function area(geometry: BufferGeometry) {
  const p = geometry.getAttribute('position'),
    count = geometry.index?.count ?? p.count
  let area = 0,
    minSigned = Infinity
  for (let i = 0; i < count; i += 3) {
    const a = geometry.index?.getX(i) ?? i,
      b = geometry.index?.getX(i + 1) ?? i + 1,
      c = geometry.index?.getX(i + 2) ?? i + 2
    const signed = ((p.getZ(b) - p.getZ(a)) * (p.getX(c) - p.getX(a)) - (p.getX(b) - p.getX(a)) * (p.getZ(c) - p.getZ(a))) / 2
    area += signed
    minSigned = Math.min(minSigned, signed)
  }
  return { area, minSigned, triangles: count / 3 }
}
function rayHeight(mesh: Mesh, x: number, z: number) {
  const ray = new Raycaster(new Vector3(x, 3000, z), new Vector3(0, -1, 0))
  return ray.intersectObject(mesh)[0]?.point.y
}
describe('approved local landing surface and exact exterior', () => {
  it('retains every fully exterior source triangle/attribute and the total mainland footprint', () => {
    const old = createContinuousMainlandGeometry(),
      actual = createLandingMainlandGeometry()
    const expected = new Map<string, number>()
    const attributeNames = Object.keys(old.attributes)
    const scratch = new Float32Array(attributeNames.reduce((sum, n) => sum + old.attributes[n]!.itemSize, 0) * 3)
    const bytes = Buffer.from(scratch.buffer)
    const scan = (geometry: BufferGeometry, collect: boolean) => {
      const p = geometry.getAttribute('position'),
        count = geometry.index?.count ?? p.count
      let exterior = 0
      for (let i = 0; i < count; i += 3) {
        const a = geometry.index?.getX(i) ?? i,
          b = geometry.index?.getX(i + 1) ?? i + 1,
          c = geometry.index?.getX(i + 2) ?? i + 2
        const minX = Math.min(p.getX(a), p.getX(b), p.getX(c)),
          maxX = Math.max(p.getX(a), p.getX(b), p.getX(c)),
          minZ = Math.min(p.getZ(a), p.getZ(b), p.getZ(c)),
          maxZ = Math.max(p.getZ(a), p.getZ(b), p.getZ(c))
        if (LANDING_SITES.some(({ bounds: [x0, x1, z0, z1] }) => maxX > x0 && minX < x1 && maxZ > z0 && minZ < z1)) continue
        exterior++
        let offset = 0
        for (const id of [a, b, c])
          for (const name of attributeNames) {
            const attr = geometry.attributes[name]!
            for (let k = 0; k < attr.itemSize; k++) scratch[offset++] = attr.array[id * attr.itemSize + k] as number
          }
        const key = bytes.toString('base64')
        if (collect) expected.set(key, (expected.get(key) ?? 0) + 1)
        else {
          const remaining = expected.get(key)
          if (remaining === 1) expected.delete(key)
          else if (remaining) expected.set(key, remaining - 1)
        }
      }
      return exterior
    }
    const outside = scan(old, true)
    scan(actual, false)
    expect(expected.size).toBe(0)
    expect(outside).toBeGreaterThan(30000)
    const before = area(old),
      after = area(actual)
    expect(Math.abs(after.area - before.area)).toBeLessThan(0.1)
    expect(after.minSigned).toBeGreaterThan(-0.00002)
    expect(after.triangles).toBeGreaterThan(before.triangles)
    if (process.env.CINDERFRONT_STAGE5B_MEASUREMENTS === '1') writeFileSync('stage5b-review.local/geometry-measurements.json', JSON.stringify({ before, after, exactExteriorTriangles: outside }, null, 2) + '\n')
    old.dispose()
    actual.dispose()
  })
  it('samples the same actual uploaded mainland and road triangles, including the water edge', () => {
    const geometry = createLandingMainlandGeometry(),
      material = new MeshBasicMaterial({ side: DoubleSide }),
      mesh = new Mesh(geometry, material)
    mesh.updateMatrixWorld(true)
    for (const site of LANDING_SITES)
      for (const dx of [-12, 0, 12])
        for (const depth of [0.1, 1, 2, 5, 15, 30, 60, 100]) {
          const x = site.gate[0] + dx,
            z = landingCoastZ(x) + depth
          expect(rayHeight(mesh, x, z)).toBeDefined()
          expect(Math.abs(rayHeight(mesh, x, z)! - getLandingGroundHeight(x, z))).toBeLessThan(0.000002)
        }
    for (const site of LANDING_SITES) {
      const road = ROAD_DEFINITIONS.find((r) => r.id === site.roadId)!,
        points = sampleTerrainPolyline(road.points, 65, 0.3).map(([x, , z]) => [x, z] as const)
      const roadGeometry = applyLandingSurface(createTerrainRoadGeometry(points, road.widthM, 0.48), 0.48, road.id),
        roadMesh = new Mesh(roadGeometry, material)
      roadMesh.updateMatrixWorld(true)
      for (const distance of [0.5, 3, 8, 16, 19, 24, 40]) {
        const dx = site.roadNext[0] - site.beach[0],
          dz = site.roadNext[1] - site.beach[1],
          length = Math.hypot(dx, dz),
          x = site.beach[0] + (dx / length) * distance,
          z = site.beach[1] + (dz / length) * distance
        expect(Math.abs(rayHeight(roadMesh, x, z)! - getLandingSupportHeight(x, z))).toBeLessThan(0.000002)
      }
      expect(landingRoadClearance(site.beach[0], site.beach[1], site)).toBe(0)
      // The same support API is ready for later grounding on the unchanged
      // portions of these two roads; no vehicle leaves the carrier in 5B.
      for (let i = 1; i < road.points.length; i++) {
        const a = road.points[i - 1]!,
          b = road.points[i]!,
          x = (a[0] + b[0]) / 2,
          z = (a[1] + b[1]) / 2
        expect(Math.abs(rayHeight(roadMesh, x, z)! - getLandingSupportHeight(x, z))).toBeLessThan(0.000002)
      }
      roadGeometry.dispose()
    }
    geometry.dispose()
    material.dispose()
  })
  it('aligns the local coast skirt to the uploaded shore while retaining all other shore faces', () => {
    const old = createCoastSkirtGeometry(),
      actual = createLandingCoastGeometry(),
      oldFaces = faces(old),
      actualFaces = new Set(faces(actual).map((f) => JSON.stringify(f)))
    let outside = 0
    for (const face of oldFaces) {
      const vertices = face.map((v) => v.position!)
      const intersects = LANDING_SITES.some(({ bounds: [a, b, c, d] }) => Math.max(...vertices.map((p) => p[0]!)) >= a && Math.min(...vertices.map((p) => p[0]!)) <= b && Math.max(...vertices.map((p) => p[2]!)) >= c && Math.min(...vertices.map((p) => p[2]!)) <= d)
      if (!intersects) {
        outside++
        expect(actualFaces.has(JSON.stringify(face))).toBe(true)
      }
    }
    expect(outside).toBeGreaterThan(20)
    const p = actual.getAttribute('position')
    let shoreline = 0
    for (let i = 0; i < p.count; i++)
      if (p.getY(i) > -2.9 && LANDING_SITES.some(({ bounds: [a, b, c, d] }) => p.getX(i) > a + 0.01 && p.getX(i) < b - 0.01 && p.getZ(i) > c + 0.01 && p.getZ(i) < d - 0.01)) {
        expect(Math.abs(p.getY(i) - getLandingGroundHeight(p.getX(i), p.getZ(i)))).toBeLessThan(0.0001)
        shoreline++
      }
    expect(shoreline).toBeGreaterThan(100)
    old.dispose()
    actual.dispose()
  })
  it('contains the entire rotated land-contact sweep with a measured margin and continuous sea edge', () => {
    let margin = Infinity,
      maxNearCoastHeight = 0
    for (const [index, id] of LCAC_IDS.entries())
      for (let time = 138; time < 166; time += 0.05) {
        const contact = sampleLandingContact(id, time),
          site = LANDING_SITES[index]!,
          [a, b, c, d] = site.bounds
        for (const [x, z] of LANDING_CONTACT_POINTS) {
          const p = transformLandingPoint(contact.pose, { x, y: 0, z })
          if (pointInPolygon(p.x, p.z, MAINLAND_POLYGON_XZ)) margin = Math.min(margin, p.x - a, b - p.x, p.z - c, d - p.z)
        }
      }
    expect(margin).toBeGreaterThan(25)
    for (const site of LANDING_SITES)
      for (const dx of [-20, 0, 20]) {
        const x = site.gate[0] + dx,
          z = landingCoastZ(x)
        expect(getLandingGroundHeight(x, z - 0.001)).toBe(LANDING_SEA_LEVEL)
        maxNearCoastHeight = Math.max(maxNearCoastHeight, Math.abs(getLandingGroundHeight(x, z + 0.001) - LANDING_SEA_LEVEL))
      }
    expect(maxNearCoastHeight).toBeLessThan(0.0002)
    if (process.env.CINDERFRONT_STAGE5B_MEASUREMENTS === '1') writeFileSync('stage5b-review.local/grade-margins.json', JSON.stringify({ minimumLandContactMargin: margin, featherMeters: 25, maxNearCoastHeight }, null, 2) + '\n')
  })
})
