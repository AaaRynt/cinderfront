/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Euler, Vector3, type BufferGeometry } from 'three'
import { describe, expect, it } from 'vitest'

import { BTR80_DIMENSIONS_METERS, deriveBtr80GroupState, deriveT72GroupState, T72_DIMENSIONS_METERS } from '../../../simulation/groundVehicles'
import { deriveSupportConvoyState, SUPPORT_DIMENSIONS } from '../../../simulation/supportConvoy'
import { BEACH_FEATURES, ROAD_DEFINITIONS } from '../stage2/stage2Data'
import { getTerrainHeight, pointInPolygon } from '../stage2/terrainModel'
import { MAINLAND_POLYGON_XZ } from '../worldData'
import { createCoverGeometry } from './coverGeometry'
import { createRegionalLayout, REGIONAL_BOUNDS } from './regionalLayout'
import { createServiceEquipmentLayout, SERVICE_CLUSTERS } from './serviceLayout'
import { DAMAGE_RESERVATIONS, FUTURE_LANDING_DIMENSIONS, FUTURE_LAV_CONNECTORS, FUTURE_LCAC_APPROACHES, getVehicleSweptReservations, intersectsReservation, isDecorationAllowed, reservePath, reservePolygon } from './spatialReservations'
import { createSurfaceHistory, createWearGeometry } from './surfaceHistory'

const layout = createRegionalLayout()
function assertTriangles(geometry: BufferGeometry) {
  const p = geometry.getAttribute('position'),
    indices = geometry.index
  const count = indices?.count ?? p.count
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i += 3) {
    const vertices = [0, 1, 2].map((offset) => new Vector3().fromBufferAttribute(p, indices ? indices.getX(i + offset) : i + offset))
    expect(vertices.every((v) => [v.x, v.y, v.z].every(Number.isFinite))).toBe(true)
    expect(vertices[1]!.sub(vertices[0]!).cross(vertices[2]!.sub(vertices[0]!)).lengthSq()).toBeGreaterThan(1e-12)
  }
}
describe('Stage 4C static regional environment', () => {
  it('recreates the complete layout with stable unique IDs independent of mounting/time', () => {
    expect(createRegionalLayout()).toEqual(layout)
    expect(new Set(layout.map((i) => i.id)).size).toBe(layout.length)
    expect(createRegionalLayout('alternate-seed')).not.toEqual(layout)
  })
  it('stays within each region, on land and grounded to the actual terrain', () => {
    for (const i of layout) {
      expect(pointInPolygon(i.position[0], i.position[2], REGIONAL_BOUNDS[i.region])).toBe(true)
      expect(pointInPolygon(i.position[0], i.position[2], MAINLAND_POLYGON_XZ)).toBe(true)
      expect(i.position[1]).toBe(getTerrainHeight(i.position[0], i.position[2]))
      expect([...i.position, ...i.scale, i.yaw].every(Number.isFinite)).toBe(true)
      expect(i.scale.every((s) => s > 0)).toBe(true)
      expect(isDecorationAllowed(i.position[0], i.position[2], i.footprintRadius)).toBe(true)
    }
  })
  it('gives the established corridor foreground cover and distinguishes ridge/coastal silhouettes', () => {
    expect(layout.filter((i) => i.region === 'corridor' && i.position[0] < 1750 && i.position[2] < 1000).length).toBeGreaterThan(100)
    const ridgeRocks = layout.filter((i) => i.region === 'radar' && i.kind === 'rock')
    const beachRocks = layout.filter((i) => i.region === 'beach' && i.kind === 'rock')
    expect(Math.max(...ridgeRocks.map((i) => i.scale[0]))).toBeGreaterThan(Math.max(...beachRocks.map((i) => i.scale[0])) * 1.8)
    expect(layout.filter((i) => i.kind === 'scrub').every((i) => i.scale[1] <= 2.05)).toBe(true)
  })
  it('rejects operational ground, water, shoulders, pads, bridge obstruction and future exits', () => {
    for (const [x, z] of [
      [-4800, -2700],
      [3550, 4150],
      [-550, 2050],
      [3100, -300],
      [6000, 250],
      [5500, 430],
      [6200, 650],
      [4950, -2700],
      [4300, -2920],
      [5450, -2860],
    ])
      expect(isDecorationAllowed(x!, z!, 4)).toBe(false)
    expect(isDecorationAllowed(1180, 820, 1)).toBe(true)
    expect(isDecorationAllowed(Number.NaN, 0, 1)).toBe(false)
  })
  it('tests complete footprints against polygon margins and buffered bends', () => {
    const polygon = reservePolygon(
      'pad',
      [
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
      ],
      2,
    )
    expect(intersectsReservation(25, 10, 4, polygon)).toBe(true)
    expect(intersectsReservation(27, 10, 4, polygon)).toBe(false)
    const path = reservePath(
      'bend',
      [
        [0, 0],
        [20, 0],
        [20, 20],
      ],
      3,
    )
    expect(intersectsReservation(24, -2, 2, path)).toBe(true)
    expect(intersectsReservation(30, 10, 2, path)).toBe(false)
  })
  it('contains dense actual hull/gun corners throughout inbound, turn and reverse sweeps', () => {
    const reservations = getVehicleSweptReservations()
    expect(reservations).toHaveLength(13)
    for (let tick = 0; tick <= 704; tick++) {
      const time = tick / 4
      const vehicles = [
        ...Object.values(deriveBtr80GroupState(time, () => 0).vehicles).map((v) => ({ v, length: BTR80_DIMENSIONS_METERS.length, width: BTR80_DIMENSIONS_METERS.width })),
        ...Object.values(deriveT72GroupState(time, () => 0).vehicles).map((v) => ({ v, length: T72_DIMENSIONS_METERS.gunForwardLength * 2 - T72_DIMENSIONS_METERS.hullLength, width: T72_DIMENSIONS_METERS.width })),
        ...Object.values(deriveSupportConvoyState(time).convoy.vehicles).map((v) => ({ v, ...SUPPORT_DIMENSIONS[v.subtype] })),
      ]
      for (const { v, length, width } of vehicles) {
        const reservation = reservations.find((r) => r.id === v.id)!
        for (const sx of [-1, 1])
          for (const sz of [-1, 1]) {
            const corner = new Vector3((sx * width) / 2, 0, (sz * length) / 2).applyEuler(new Euler(0, v.pose.rotation.y, 0)).add(new Vector3(v.pose.position.x, 0, v.pose.position.z))
            expect(intersectsReservation(corner.x, corner.z, 0, reservation)).toBe(true)
          }
      }
    }
  })
  it('matches future dimensions and routes to authoritative YAML without instantiating actors', () => {
    for (const [vehicle, path] of [
      ['lcac', 'assets/vehicle/LCAC/lcac.yaml'],
      ['lav', 'assets/vehicle/LAV-25/lav-25.yaml'],
    ] as const) {
      const source = readFileSync(resolve(process.cwd(), path), 'utf8')
      const block = source.split('dimensions_m:')[1]!.split('normalized_proportions:')[0]!
      expect(Number(block.match(/length: ([\d.]+)/)![1])).toBe(FUTURE_LANDING_DIMENSIONS[vehicle].length)
      expect(Number(block.match(/width: ([\d.]+)/)![1])).toBe(FUTURE_LANDING_DIMENSIONS[vehicle].width)
    }
    const scenario = readFileSync(resolve(process.cwd(), 'assets/scenario/scenario-spec.yaml'), 'utf8')
    for (const [id, points] of [
      ['path_lcac_beach_approach_west', FUTURE_LCAC_APPROACHES[0]!],
      ['path_lcac_beach_approach_east', FUTURE_LCAC_APPROACHES[1]!],
      ['path_lav_inland_west', FUTURE_LAV_CONNECTORS[0]!],
      ['path_lav_inland_east', FUTURE_LAV_CONNECTORS[1]!],
    ] as const) {
      const block = scenario.split(`- id: '${id}'`)[1]!.split('\n    - id:')[0]!.split('\neffect_profiles:')[0]!
      const actual = Array.from(block.matchAll(/- \[(-?\d+), (-?\d+)\]/g), (m) => [Number(m[1]), Number(m[2])])
      expect(actual).toEqual(points)
    }
  })
  it('keeps all new solids clear of full landing/ramp routes and the two inland road envelopes', () => {
    const routes = [...FUTURE_LCAC_APPROACHES.map((p) => reservePath('lcac', p, Math.hypot(13.2, 7.15) + 4)), ...FUTURE_LAV_CONNECTORS.map((p) => reservePath('lav', p, 9)), ...ROAD_DEFINITIONS.filter((r) => r.id === 'road_beach_exit' || r.id === 'road_beach_access_east').map((r) => reservePath(r.id, r.points, 12))]
    for (const i of layout) for (const r of routes) expect(intersectsReservation(i.position[0], i.position[2], i.footprintRadius, r)).toBe(false)
    for (const c of SERVICE_CLUSTERS) for (const r of routes) expect(intersectsReservation(c.x, c.z, 17, r)).toBe(false)
    expect(isDecorationAllowed(4950, -2800, 1)).toBe(false)
    expect(BEACH_FEATURES.exitApron.length).toBe(4)
  })
  it('does not duplicate intact cover or maintenance props over authored response/damage', () => {
    for (const r of DAMAGE_RESERVATIONS) {
      for (const i of layout) expect(intersectsReservation(i.position[0], i.position[2], i.footprintRadius, r)).toBe(false)
      for (const c of SERVICE_CLUSTERS) expect(intersectsReservation(c.x, c.z, 17, r)).toBe(false)
    }
  })
  it('uses six nondegenerate shared silhouettes whose geometry fits the reserved footprints', () => {
    for (const kind of ['grass', 'scrub', 'rock'] as const)
      for (const variant of [0, 1]) {
        const g = createCoverGeometry(kind, variant)
        assertTriangles(g)
        g.computeBoundingBox()
        const b = g.boundingBox!
        expect(Math.max(Math.abs(b.min.x), Math.abs(b.max.x), Math.abs(b.min.z), Math.abs(b.max.z))).toBeLessThanOrEqual(0.51)
        g.dispose()
      }
  })
  it('batches purposeful service equipment with finite positive transforms and clear cluster envelopes', () => {
    const pools = createServiceEquipmentLayout()
    expect(Object.values(pools).every((p) => p.length > 0)).toBe(true)
    for (const matrices of Object.values(pools))
      for (const m of matrices) {
        expect(m.elements.every(Number.isFinite)).toBe(true)
        expect(m.determinant()).toBeGreaterThan(0)
        const p = new Vector3().setFromMatrixPosition(m)
        expect(p.y).toBeGreaterThan(getTerrainHeight(p.x, p.z))
      }
  })
  it('drapes wear to the rendered grid and preserves the original surface clearances', () => {
    const patches = createSurfaceHistory()
    expect(new Set(patches.map((p) => p.kind))).toEqual(new Set(['repair', 'gravel', 'tire', 'runoff', 'salt']))
    for (const patch of patches) {
      const g = createWearGeometry([patch])
      assertTriangles(g)
      const p = g.getAttribute('position')
      for (let i = 0; i < p.count; i++) expect(p.getY(i)).toBeCloseTo(patch.flatY ?? getTerrainHeight(p.getX(i), p.getZ(i)) + patch.clearance, 3)
      g.dispose()
    }
  })
  it('passes destruction cutoffs into the batched render attributes without hiding unrelated wear', () => {
    const patches = createSurfaceHistory()
    const ammo = patches.filter((p) => p.id.startsWith('ammo-loading-'))
    const fuel = patches.filter((p) => p.id === 'pump-old-oil-contact' || p.id === 'transfer-old-runoff')
    expect(ammo).toHaveLength(3)
    expect(fuel).toHaveLength(2)
    for (const [group, cutoff] of [
      [ammo, 132],
      [fuel, 97.6],
      [patches.filter((p) => p.flatY !== undefined), 1000],
    ] as const) {
      const g = createWearGeometry(group),
        time = g.getAttribute('wearHideAt')
      expect(time.count).toBe(g.getAttribute('position').count)
      for (let i = 0; i < time.count; i++) expect(time.getX(i)).toBeCloseTo(cutoff, 4)
      g.dispose()
    }
  })
})
