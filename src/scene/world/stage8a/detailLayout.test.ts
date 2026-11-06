import { Vector3 } from 'three'
import { afterAll, describe, expect, it } from 'vitest'

import type { XZPoint } from '../worldData'

import { BTR80_DIMENSIONS_METERS, T72_DIMENSIONS_METERS } from '../../../simulation/groundVehicles'
import { deriveRuntimeWorldState } from '../../../simulation/runtime'
import { SUPPORT_DIMENSIONS } from '../../../simulation/supportConvoy'
import { getLandingGroundHeight, getLandingSupportHeight } from '../landing/landingTerrain'
import { createExistingLandscapeEnvelopes, isNewLandscapeAllowed, LANDSCAPE_ACTOR_RADII } from '../landscape/landscapeReservations'
import { createTreeLayout } from '../landscape/treeLayout'
import { BEACH_FEATURES } from '../stage2/stage2Data'
import { pointInPolygon } from '../stage2/terrainModel'
import { intersectsReservation, reservePath, type Reservation } from '../stage4c/spatialReservations'
import { createDetailGeometries } from './detailGeometry'
import { createDetailGround } from './detailGround'
import { createDetailLayout, DETAIL_SITES, detailXZ, fitDetailPlacement, type DetailSite } from './detailLayout'

const geometries = createDetailGeometries()
afterAll(() => Object.values(geometries).forEach((geometry) => geometry.dispose()))

function aftermathSweeps() {
  const tracks = new Map<string, { points: XZPoint[]; radius: number }>()
  const append = (id: string, x: number, z: number, radius: number) => {
    const track = tracks.get(id)
    if (!track) tracks.set(id, { points: [[x, z]], radius })
    else if (Math.hypot(x - track.points.at(-1)![0], z - track.points.at(-1)![1]) > 0.005) track.points.push([x, z])
  }
  // Cover every active continuation, including the last LAV hold at T+344.104.
  // The conservative radii include body/wheel corners and deployed weapons.
  for (let t = 180; t <= 345; t += 0.25) {
    const w = deriveRuntimeWorldState(t)
    for (const a of Object.values(w.stage4b2c.convoy.vehicles)) {
      const d = SUPPORT_DIMENSIONS[a.subtype]
      append(a.id, a.pose.position.x, a.pose.position.z, Math.hypot(d.length, d.width) * 0.5 + 2)
    }
    for (const a of Object.values(w.stage4b.btrGroup.vehicles)) {
      append(a.id, a.pose.position.x, a.pose.position.z, Math.hypot(BTR80_DIMENSIONS_METERS.length, BTR80_DIMENSIONS_METERS.width) * 0.5 + 2)
    }
    for (const a of Object.values(w.stage4b.t72Group.vehicles)) {
      const d = T72_DIMENSIONS_METERS
      append(a.id, a.pose.position.x, a.pose.position.z, Math.hypot(d.gunForwardLength - d.hullLength * 0.5, d.width * 0.5) + 2)
    }
    for (const a of Object.values(w.landing.payload)) append(a.id, a.pose.position.x, a.pose.position.z, LANDSCAPE_ACTOR_RADII.lav)
    for (const a of Object.values(w.landing.crafts)) append(a.id, a.pose.position.x, a.pose.position.z, LANDSCAPE_ACTOR_RADII.lcac)
  }
  return Array.from(tracks, ([id, { points, radius }]) => reservePath(id, points, radius))
}

describe('local Stage 8A landscape', () => {
  it('keeps the full rendered footprints clear of authored scenery and both operation phases', () => {
    const scenery: readonly Reservation[] = [...createExistingLandscapeEnvelopes(), ...createTreeLayout().map(({ id, position, radius }) => ({ id, kind: 'circle' as const, center: [position[0], position[2]] as XZPoint, radius }))]
    const reservations = [...scenery, ...aftermathSweeps()]
    const collisions: string[] = []
    for (const site of ['corridor', 'beach'] as const) {
      const layout = createDetailLayout(site)
      expect(createDetailLayout(site)).toEqual(layout)
      expect(new Set(layout.map((p) => p.id)).size).toBe(layout.length)
      expect(layout.length).toBeLessThan(230)
      for (const placement of layout) {
        const geometry = geometries[placement.kind]
        const [x, z] = detailXZ(site, placement.local)
        const matrix = fitDetailPlacement(geometry, site, placement)
        const positions = geometry.getAttribute('position')
        const p = new Vector3()
        let radius = 0
        for (let i = 0; i < positions.count; i++) {
          p.fromBufferAttribute(positions, i).applyMatrix4(matrix)
          radius = Math.max(radius, Math.hypot(p.x - x, p.z - z))
        }
        if (!isNewLandscapeAllowed(x, z, radius)) collisions.push(placement.id + ' intersects an authored or scripted reservation')
        for (const reservation of reservations) {
          if (intersectsReservation(x, z, radius, reservation)) collisions.push(placement.id + ' overlaps ' + reservation.id)
        }
        const [u, v] = placement.local
        const [loU, hiU, loV, hiV] = DETAIL_SITES[site].bounds
        if (u - radius < loU || u + radius > hiU || v - radius < loV || v + radius > hiV) collisions.push(placement.id + ' leaves the sample boundary')
      }
    }
    expect(collisions).toEqual([])
  }, 20_000)

  it.each<DetailSite>(['corridor', 'beach'])('fits the %s grounds and buried roots to their local surface', (site) => {
    const { surfaceOffset } = DETAIL_SITES[site]
    const plane = createDetailGround(site)
    try {
      const drape = plane.getAttribute('position')
      const drapeColor = plane.getAttribute('color')
      for (let i = 0; i < drape.count; i++) {
        const x = drape.getX(i),
          z = drape.getZ(i)
        expect(drape.getY(i) - getLandingGroundHeight(x, z) - surfaceOffset).toBeCloseTo(0.035, 3)
        expect(drapeColor.getW(i)).toBeGreaterThanOrEqual(0)
        expect(drapeColor.getW(i)).toBeLessThanOrEqual(1)
        if (site === 'beach') expect(pointInPolygon(x, z, BEACH_FEATURES.duneEast)).toBe(true)
      }

      const p = new Vector3()
      for (const placement of createDetailLayout(site)) {
        const geometry = geometries[placement.kind]
        geometry.computeBoundingBox()
        const bottom = geometry.boundingBox!.min.y
        const positions = geometry.getAttribute('position')
        const matrix = fitDetailPlacement(geometry, site, placement)
        expect(matrix.elements.every(Number.isFinite), placement.id).toBe(true)
        for (let i = 0; i < positions.count; i++) {
          if ((positions.getY(i) - bottom) * placement.scale[1] > 0.012) continue
          p.fromBufferAttribute(positions, i).applyMatrix4(matrix)
          const relativeY = p.y - getLandingSupportHeight(p.x, p.z) - surfaceOffset
          expect(relativeY, placement.id).toBeLessThan(0.015)
          expect(relativeY, placement.id).toBeGreaterThan(-0.18)
        }
      }
    } finally {
      plane.dispose()
    }
  })
})
