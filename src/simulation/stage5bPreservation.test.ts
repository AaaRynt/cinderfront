import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { createLandingFoamLayout, createLandingRegionalLayout, createLandingServiceLayout, createLandingSurfaceHistory, LANDING_FOAM_RESERVATIONS, overlapsLanding } from '../scene/world/landing/landingReservations'
import { inLandingGrade } from '../scene/world/landing/landingSiteData'
import { applyLandingSurface, getLandingGroundHeight } from '../scene/world/landing/landingTerrain'
import { getTerrainHeight, TERRAIN_GRID_X_VALUES, TERRAIN_GRID_Z_VALUES } from '../scene/world/stage2/terrainModel'
import { createShoreFoamLayout, createWetShoreGeometry, sampleCoastalMotion } from '../scene/world/stage4c/coastalWater'
import { createRegionalLayout } from '../scene/world/stage4c/regionalLayout'
import { createServiceEquipmentLayout } from '../scene/world/stage4c/serviceLayout'
import { intersectsReservation } from '../scene/world/stage4c/spatialReservations'
import { createSurfaceHistory } from '../scene/world/stage4c/surfaceHistory'
import { deriveSimulationWorldState } from './derive'
import baseline from './fixtures/stage5aPreservation.json'
import { projectCompletedStage5aWorld, isStage5BAddedEvent } from './fixtures/stage5bPreservationProjection'
/// <reference types="node" />
import { isStage5CAddedEvent } from './fixtures/stage5cPreservationProjection'
import { SIMULATION_EVENTS } from './timeline'

const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
describe('Stage 5B immutable prior world and scoped environmental exceptions', () => {
  it('retains the pre-edit fixture bytes and all 42 prior event records', () => {
    // The previous literal checksum disagreed with the committed 2a3fffc file.
    // Compare exact bytes against that fixed commit; never regenerate this
    // fixture or replace any of its captured world/environment hashes.
    const fixtureBytes = readFileSync('src/simulation/fixtures/stage5aPreservation.json')
    const committedBytes = execFileSync('git', ['show', '2a3fffc:src/simulation/fixtures/stage5aPreservation.json'], { maxBuffer: 32 * 1024 * 1024 })
    expect(fixtureBytes.equals(committedBytes)).toBe(true)
    expect(baseline.sourceCommit.startsWith('4c89a93')).toBe(true)
    expect(baseline.capturedBeforeStage5B).toBe(true)
    expect(SIMULATION_EVENTS.filter((e) => !isStage5BAddedEvent(e) && !isStage5CAddedEvent(e))).toEqual(baseline.events)
    expect(SIMULATION_EVENTS).toHaveLength(51)
  })
  it('compares every prior actor/weapon field, including secondary Pantsir and support convoy', () => {
    expect(baseline.worldKeys).toContain('secondaryPantsir')
    expect(baseline.worldKeys).toContain('stage4b2c')
    expect(Object.keys(baseline.worldHashes).length).toBeGreaterThanOrEqual(815)
    for (const [time, expected] of Object.entries(baseline.worldHashes)) {
      const world = deriveSimulationWorldState(Number(time)),
        old = projectCompletedStage5aWorld(world)
      expect(Object.keys(old)).toEqual(baseline.worldKeys)
      expect(Object.keys(world)).toEqual([...baseline.worldKeys, 'landing'])
      expect(old.secondaryPantsir).toBe(world.secondaryPantsir)
      expect(old.stage4b2c).toBe(world.stage4b2c)
      expect(hash(old), `every old field at T+${time}`).toBe(expected)
    }
  })
  it('retains every captured coastal sample and historical seeded layout exactly', () => {
    for (const [time, expected] of Object.entries(baseline.coastalHashes)) expect(hash(baseline.coastalPoints.map(([x, z]) => sampleCoastalMotion(x!, z!, Number(time))))).toBe(expected)
    expect(createRegionalLayout()).toEqual(baseline.cover)
    expect(JSON.parse(JSON.stringify(createServiceEquipmentLayout()))).toEqual(baseline.equipment)
    expect(createSurfaceHistory()).toEqual(baseline.wear)
    expect(createShoreFoamLayout()).toEqual(baseline.foam)
    expect(hash([TERRAIN_GRID_X_VALUES, TERRAIN_GRID_Z_VALUES])).toBe(baseline.terrainGridHash)
  })
  it('post-filters only explicitly overlapping records, with exact survivor values and no rerolls', () => {
    const cover = createLandingRegionalLayout(),
      wear = createLandingSurfaceHistory(),
      foam = createLandingFoamLayout(),
      equipment = createLandingServiceLayout()
    const removedCover = baseline.cover.filter((i) => !cover.some((v) => v.id === i.id)),
      removedWear = baseline.wear.filter((p) => !wear.some((v) => v.id === p.id)),
      removedFoam = baseline.foam.filter((f) => !foam.some((v) => v.phase === f.phase))
    expect(cover).toEqual(baseline.cover.filter((i) => !removedCover.some((v) => v.id === i.id)))
    expect(removedCover).toEqual([])
    for (const i of removedCover) expect(overlapsLanding(i.position[0]!, i.position[2]!, i.footprintRadius)).toBe(true)
    expect(cover.every((i) => !overlapsLanding(i.position[0], i.position[2], i.footprintRadius))).toBe(true)
    expect(wear).toEqual(baseline.wear.filter((i) => !removedWear.some((v) => v.id === i.id)))
    expect(removedWear).toEqual([])
    expect(JSON.parse(JSON.stringify(equipment))).toEqual(baseline.equipment)
    expect(foam).toEqual(baseline.foam.filter((f) => !removedFoam.some((v) => v.phase === f.phase)))
    expect(removedFoam.map((f) => f.phase)).toEqual([5.073432454677445])
    for (const f of removedFoam) {
      const x = f.points.reduce((a, p) => a + p[0]!, 0) / 4,
        z = f.points.reduce((a, p) => a + p[1]!, 0) / 4,
        radius = Math.max(...f.points.map((p) => Math.hypot(p[0]! - x, p[1]! - z)))
      expect(LANDING_FOAM_RESERVATIONS.some((r) => intersectsReservation(x, z, radius, r))).toBe(true)
    }
    if (process.env.CINDERFRONT_STAGE5B_MEASUREMENTS === '1')
      writeFileSync('stage5b-review.local/environment-records.json', JSON.stringify({ removedCover, removedWear, removedFoam, coverBefore: baseline.cover.length, coverAfter: cover.length, foamBefore: baseline.foam.length, foamAfter: foam.length, equipmentUnchanged: true }, null, 2) + '\n')
  })
  it('keeps historical wet geometry and exact exterior heights while measuring each permitted local delta', () => {
    const wet = createWetShoreGeometry(),
      p = wet.getAttribute('position'),
      edge = wet.getAttribute('wetEdge')
    expect(Array.from(p.array)).toEqual(baseline.wet.position)
    expect(Array.from(edge.array)).toEqual(baseline.wet.wetEdge)
    expect(Array.from(wet.index!.array)).toEqual(baseline.wet.index)
    const deltas: number[][] = []
    for (const [x, z, before] of baseline.terrainSamples) {
      expect(getTerrainHeight(x!, z!)).toBe(before)
      const after = getLandingGroundHeight(x!, z!)
      if (!inLandingGrade(x!, z!)) expect(after).toBe(before)
      else if (Math.abs(after - before!) > 1e-6) deltas.push([x!, z!, before!, after, after - before!])
    }
    expect(deltas.length).toBeGreaterThan(100)
    const actual = applyLandingSurface(wet, 0.018),
      positions = actual.getAttribute('position'),
      wetEdge = actual.getAttribute('wetEdge')
    const vertexRecord = (geometry: typeof actual, i: number) =>
      Object.values(geometry.attributes)
        .flatMap((a) => Array.from({ length: a.itemSize }, (_, k) => a.array[i * a.itemSize + k]))
        .join(',')
    const actualVertices = new Set(Array.from({ length: positions.count }, (_, i) => vertexRecord(actual, i)))
    for (let i = 0; i < p.count; i++) if (!inLandingGrade(p.getX(i), p.getZ(i))) expect(actualVertices.has(vertexRecord(wet, i))).toBe(true)
    let changed = 0,
      exterior = 0
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        z = positions.getZ(i)
      if (inLandingGrade(x, z)) {
        expect(Math.abs(positions.getY(i) - getLandingGroundHeight(x, z) - 0.018)).toBeLessThan(0.00005)
        changed++
      } else exterior++
      expect(wetEdge.getX(i)).toBeGreaterThanOrEqual(0)
      expect(wetEdge.getX(i)).toBeLessThanOrEqual(1)
    }
    expect(exterior).toBeGreaterThan(0)
    // Old raw reservations already masked the west contact; remaining local
    // overlay refinement, if any, must be bound to the approved grade only.
    if (process.env.CINDERFRONT_STAGE5B_MEASUREMENTS === '1') writeFileSync('stage5b-review.local/terrain-deltas.json', JSON.stringify({ deltas, wetVerticesInside: changed, wetVerticesOutside: exterior }, null, 2) + '\n')
    actual.dispose()
  })
})
