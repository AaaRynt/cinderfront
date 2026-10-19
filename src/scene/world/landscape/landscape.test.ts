/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { Matrix4, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'

import original from '../../../simulation/fixtures/stage2LandscapePreservation.json'
import { createLandingRegionalLayout } from '../landing/landingReservations'
import { getLandingSupportHeight } from '../landing/landingTerrain'
import { POWER_LINES } from '../stage2/stage2Data'
import { distanceToPolyline } from '../stage2/terrainModel'
import { createCoverGeometry } from '../stage4c/coverGeometry'
import { intersectsReservation } from '../stage4c/spatialReservations'
import { fitLandscapeBase } from './groundFit'
import { createGrassGeometry, createRockGeometry, createScrubGeometry, createTreeGeometry } from './landscapeGeometry'
import { getLandscapeMovementReservations, isNewLandscapeAllowed, createExistingLandscapeEnvelopes, LEGACY_ROCK_SPECS } from './landscapeReservations'
import { createLegacyRockLayout } from './legacyRocks'
import { createLegacyVegetationLayouts } from './legacyVegetation'
import { createTreeLayout, treeBaseMatrix } from './treeLayout'
const layout = createTreeLayout()
function triangles(g: ReturnType<typeof createGrassGeometry>) {
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i += 3) {
    const a = new Vector3().fromBufferAttribute(p, i),
      b = new Vector3().fromBufferAttribute(p, i + 1),
      c = new Vector3().fromBufferAttribute(p, i + 2)
    expect([...a, ...b, ...c].every(Number.isFinite)).toBe(true)
    expect(b.sub(a).cross(c.sub(a)).lengthSq()).toBeGreaterThan(1e-14)
  }
}
describe('Stage 6A static landscape', () => {
  it('uses finite nondegenerate shared silhouettes inside unchanged cover envelopes, with distinct root conventions', () => {
    for (const variant of [0, 1])
      for (const factory of [createGrassGeometry, createScrubGeometry, createRockGeometry]) {
        const g = factory(variant)
        triangles(g)
        g.computeBoundingBox()
        const b = g.boundingBox!
        expect(Math.max(Math.abs(b.min.x), Math.abs(b.max.x), Math.abs(b.min.z), Math.abs(b.max.z))).toBeLessThanOrEqual(0.500001)
        expect(g.getAttribute('color').count).toBe(g.getAttribute('position').count)
        g.dispose()
      }
    for (const factory of [createGrassGeometry, createScrubGeometry]) {
      const root = factory(0),
        center = factory(0, 'center')
      const a = root.getAttribute('position'),
        b = center.getAttribute('position')
      for (let i = 0; i < a.count; i++) {
        expect(b.getX(i)).toBe(a.getX(i))
        expect(b.getZ(i)).toBe(a.getZ(i))
        expect(b.getY(i)).toBeCloseTo(a.getY(i) - 0.5, 6)
      }
      root.dispose()
      center.dispose()
    }
    for (const form of ['upright', 'wind'] as const)
      for (const variant of [0, 1]) {
        const r = createTreeGeometry(form, variant)
        triangles(r.wood)
        triangles(r.leaves)
        r.wood.dispose()
        r.leaves.dispose()
      }
  })
  it('seats the grass roots on the actual uploaded slope while retaining authored horizontal transforms', () => {
    for (const i of createLandingRegionalLayout().filter((i) => i.kind === 'grass')) {
      const g = createGrassGeometry(i.variant),
        m = new Matrix4()
          .makeRotationY(i.yaw)
          .scale(new Vector3(...i.scale))
          .setPosition(...i.position),
        fit = fitLandscapeBase(g, m, 0.025),
        p = g.getAttribute('position')
      for (let j = 0; j < p.count; j++)
        if (p.getY(j) < -0.0549) {
          const v = new Vector3().fromBufferAttribute(p, j).applyMatrix4(fit.matrix)
          expect(v.y - getLandingSupportHeight(v.x, v.z)).toBeLessThanOrEqual(0.001)
        }
      for (const k of [0, 2, 4, 6, 8, 10, 12, 14]) expect(fit.matrix.elements[k]).toBe(m.elements[k])
      g.dispose()
    }
  })
  it('grounds all legacy center-origin grass roots using the unchanged half-height placement convention', () => {
    const g = createGrassGeometry(0, 'center'),
      p = g.getAttribute('position')
    for (const patch of createLegacyVegetationLayouts())
      for (const i of patch.grass) {
        const base = new Matrix4()
            .makeRotationY(i.yaw)
            .scale(new Vector3(...i.scale))
            .setPosition(i.position[0], i.position[1] + i.scale[1] * 0.5, i.position[2]),
          fit = fitLandscapeBase(g, base, 0.025)
        for (let k = 0; k < p.count; k++)
          if (p.getY(k) < -0.5549) {
            const v = new Vector3().fromBufferAttribute(p, k).applyMatrix4(fit.matrix)
            expect(v.y - getLandingSupportHeight(v.x, v.z)).toBeLessThanOrEqual(0.001)
          }
      }
    g.dispose()
  })
  it('contains legacy rock replacement vertices inside the original unit-sphere envelope', () => {
    for (const variant of [0, 1]) {
      const g = createRockGeometry(variant).scale(1.4, 0.85, 1.4),
        p = g.getAttribute('position')
      for (let i = 0; i < p.count; i++) expect(new Vector3().fromBufferAttribute(p, i).length()).toBeLessThanOrEqual(1)
      g.dispose()
    }
  })
  it('fits bases across both approved grade boundaries without changing horizontal geometry', () => {
    for (const [x, z] of [
      [4230, -2920],
      [4390, -2920],
      [5350, -2860],
      [5540, -2860],
    ]) {
      const g = createRockGeometry(0),
        base = new Matrix4().makeScale(14, 4, 10).setPosition(x!, getLandingSupportHeight(x!, z!), z!),
        fit = fitLandscapeBase(g, base, 0.08),
        p = g.getAttribute('position')
      for (let i = 0; i < p.count; i++)
        if (p.getY(i) < g.boundingBox!.min.y + 0.0001) {
          const v = new Vector3().fromBufferAttribute(p, i).applyMatrix4(fit.matrix)
          expect(v.y).toBeLessThanOrEqual(getLandingSupportHeight(v.x, v.z) + 0.001)
        }
      expect(fit.sampleCount).toBeGreaterThan(100)
      g.dispose()
    }
  })
  it('keeps all 71 legacy rock matrices, response IDs, indices and addresses exact before render fitting', () => {
    let count = 0
    for (const spec of LEGACY_ROCK_SPECS) {
      const before = original.rocks.find((r) => r.id === spec.id)!
      const old = createLegacyRockLayout(spec)
      expect(old.responseInstances).toEqual(before.responseInstances)
      expect(old.matrices.map((m) => m.elements)).toEqual(before.matrices)
      count += old.matrices.length
    }
    expect(count).toBe(71)
  })
  it('adds sparse, independently seeded trees at several inland locations with complete crown separation/reservations', () => {
    expect(layout.length).toBeGreaterThanOrEqual(24)
    expect(layout.length).toBeLessThanOrEqual(48)
    expect(createTreeLayout()).toEqual(layout)
    expect(createTreeLayout('different')).not.toEqual(layout)
    expect(new Set(layout.map((t) => t.id)).size).toBe(layout.length)
    const existing = createExistingLandscapeEnvelopes()
    for (const [i, t] of layout.entries()) {
      expect(isNewLandscapeAllowed(t.position[0], t.position[2], t.radius + 2)).toBe(true)
      expect(t.position[1]).toBe(getLandingSupportHeight(t.position[0], t.position[2]))
      expect(t.height).toBeGreaterThan(3)
      expect(t.height).toBeLessThanOrEqual(7)
      for (const e of existing) expect(intersectsReservation(t.position[0], t.position[2], t.radius + 1, e)).toBe(false)
      for (const other of layout.slice(i + 1)) expect(Math.hypot(t.position[0] - other.position[0], t.position[2] - other.position[2])).toBeGreaterThan(t.radius + other.radius + 8)
    }
    expect(['corridor', 'radar', 'beach'].map((r) => layout.filter((t) => t.region === r).length).every((c) => c >= 4)).toBe(true)
    if (process.env.CINDERFRONT_STAGE6A_MEASUREMENTS === '1') writeFileSync('stage6a-review.local/tree-layout.json', JSON.stringify(layout, null, 2))
  })
  it('keeps complete crowns clear of power corridors and all published light/equipment positions', () => {
    for (const tree of layout) {
      for (const line of POWER_LINES) expect(distanceToPolyline(tree.position[0], tree.position[2], line) - tree.radius).toBeGreaterThan(4)
      for (const row of original.browser.filter((row) => /lights|equipment/.test(row.name)))
        for (const fixture of row.metadata.responseInstances ?? []) {
          expect(Math.hypot(tree.position[0] - fixture.position[0], tree.position[2] - fixture.position[2]) - tree.radius).toBeGreaterThan(5)
        }
    }
  })
  it('fits rock bases across actual uploaded slopes without enlarging horizontal envelopes', () => {
    let maxBaseGap = -Infinity,
      maxBurial = 0,
      minTopHeight = Infinity,
      maxFitSamples = 0
    const cases = createLandingRegionalLayout()
      .filter((i) => i.kind === 'rock')
      .map((i) => {
        const m = new Matrix4()
          .makeRotationY(i.yaw)
          .scale(new Vector3(...i.scale))
          .setPosition(...i.position)
        return { g: createCoverGeometry('rock', i.variant), m }
      })
    for (const spec of LEGACY_ROCK_SPECS) for (const m of createLegacyRockLayout(spec).matrices) cases.push({ g: createRockGeometry(spec.id.startsWith('radar') ? 0 : 1).scale(1.4, 0.85, 1.4), m: new Matrix4().makeTranslation(...spec.position).multiply(m) })
    for (const { g, m } of cases) {
      const fit = fitLandscapeBase(g, m, 0.08),
        p = g.getAttribute('position')
      maxFitSamples = Math.max(maxFitSamples, fit.sampleCount)
      for (const k of [0, 2, 4, 6, 8, 10, 12, 14]) expect(fit.matrix.elements[k]).toBe(m.elements[k])
      const top: number[] = []
      g.computeBoundingBox()
      for (let i = 0; i < p.count; i++) {
        const local = new Vector3().fromBufferAttribute(p, i),
          v = local.clone().applyMatrix4(fit.matrix),
          h = getLandingSupportHeight(v.x, v.z)
        if (local.y < g.boundingBox!.min.y + 0.0001) {
          maxBaseGap = Math.max(maxBaseGap, v.y - h)
          maxBurial = Math.max(maxBurial, h - v.y)
          expect(v.y).toBeLessThanOrEqual(h + 0.001)
        } else top.push(v.y - h)
      }
      minTopHeight = Math.min(minTopHeight, Math.max(...top))
      g.dispose()
    }
    expect(minTopHeight).toBeGreaterThan(0.1)
    if (process.env.CINDERFRONT_STAGE6A_MEASUREMENTS === '1') writeFileSync('stage6a-review.local/grounding.json', JSON.stringify({ rocks: cases.length, maxBaseGap, maxBurial, minTopHeight, maxFitSamples }, null, 2))
  })
  it('grounds every tree root and contains actual branches/foliage inside its full reserved envelope', () => {
    for (const t of layout) {
      const r = createTreeGeometry(t.form, t.variant),
        m = fitLandscapeBase(r.wood, treeBaseMatrix(t), 0.13).matrix
      for (const g of [r.wood, r.leaves]) {
        const p = g.getAttribute('position')
        for (let i = 0; i < p.count; i++) {
          const v = new Vector3().fromBufferAttribute(p, i).applyMatrix4(m)
          expect(Math.hypot(v.x - t.position[0], v.z - t.position[2])).toBeLessThanOrEqual(t.radius)
          if (p.getY(i) < -0.064) expect(v.y - getLandingSupportHeight(v.x, v.z)).toBeLessThanOrEqual(0.001)
        }
      }
      r.wood.dispose()
      r.leaves.dispose()
    }
  })
  it('retains all actor families and both complete road corridors in additional reservations', () => {
    const rs = getLandscapeMovementReservations()
    expect(rs).toHaveLength(27)
    for (const id of ['defender_pantsir_02', 'attacker_lcac_01', 'attacker_lcac_02', ...Array.from({ length: 8 }, (_, i) => `attacker_lav_0${i + 1}`), '6b-full-road_beach_exit', '6b-full-road_beach_access_east']) expect(rs.some((r) => r.id === id)).toBe(true)
    expect(isNewLandscapeAllowed(4300, -2920, 1)).toBe(false)
    expect(isNewLandscapeAllowed(5450, -2860, 1)).toBe(false)
  })
})
