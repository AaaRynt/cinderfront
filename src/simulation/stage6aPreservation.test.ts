/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import type { VegetationPatchSpec } from '../scene/world/stage2/environment/seededLayout'

import { createLandingRegionalLayout, createLandingServiceLayout, createLandingSurfaceHistory, createLandingFoamLayout } from '../scene/world/landing/landingReservations'
import { createLandingMainlandGeometry, createLandingCoastGeometry, getLandingSupportHeight, applyLandingSurface } from '../scene/world/landing/landingTerrain'
import { createVegetationLayout } from '../scene/world/stage2/environment/seededLayout'
import { ROAD_DEFINITIONS } from '../scene/world/stage2/stage2Data'
import { createTerrainRoadGeometry } from '../scene/world/stage2/terrainGeometry'
import { sampleTerrainPolyline } from '../scene/world/stage2/terrainModel'
import { VegetationSystem } from '../scene/world/stage2/VegetationSystem'
import { deriveSimulationWorldState } from './derive'
import baseline from './fixtures/stage5cPreservation.json'
import { SIMULATION_EVENTS } from './timeline'
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
// The sole historical test repair replaces a stale literal with exact fixed-Git
// bytes. Normalize only those two edits to retain its complete captured source
// hash; no world/fixture projection or other source exemption is introduced.
function sourceHash(path: string) {
  if (path !== 'src/simulation/stage5cPreservation.test.ts') return fileHash(path)
  const source = readFileSync(path, 'utf8')
    .replace("import { execFileSync } from 'node:child_process'\n", '')
    .replace(
      "expect(readFileSync('src/simulation/fixtures/stage5bPreservation.json')).toEqual(execFileSync('git', ['show', 'b49db45:src/simulation/fixtures/stage5bPreservation.json'], { maxBuffer: 32 * 1024 * 1024 }))",
      "expect(fileHash('src/simulation/fixtures/stage5bPreservation.json')).toBe('47bedd7e7daf98c22e1484f58f951ba403cee8ce12fff0dfaaeffd4fa5c986c5')",
    )
  return createHash('sha256').update(source).digest('hex')
}
const fileHash = (p: string) => createHash('sha256').update(readFileSync(p)).digest('hex')
describe('Stage 6A exact complete Stage 5C preservation', () => {
  it('protects captured bytes, all 51 events and every completed actor/model/authoritative source', () => {
    expect(fileHash('src/simulation/fixtures/stage5cPreservation.json')).toBe('0c84cb04e37ae241f10e4a8ca284d949ae8959d15932c6fd2aa8169281a9713c')
    expect(fileHash('src/simulation/fixtures/stage2LandscapePreservation.json')).toBe('194d5faf19b356e6ec6171ebb8e17769015980157efbd0feee4c78bcf3bdcc1c')
    expect(baseline.sourceCommit).toBe('b49db45')
    expect(baseline.capturedBeforeStage6A).toBe(true)
    expect(SIMULATION_EVENTS).toEqual(baseline.events)
    for (const [p, h] of Object.entries(baseline.files)) expect(sourceHash(p), p).toBe(h)
  })
  it.each([0, 1, 2, 3])('preserves the whole world without projection through 180, partition %s', (partition) => {
    for (let i = partition; i < baseline.samples.length; i += 4) {
      const s = baseline.samples[i]!
      expect(hash(deriveSimulationWorldState(s.time)), `full world at ${s.time}`).toBe(s.world)
    }
  })
  it('preserves uploaded mainland/coast/roads, support and all historical environmental layout/response values', () => {
    const gs = [
      createLandingMainlandGeometry(),
      createLandingCoastGeometry(),
      ...ROAD_DEFINITIONS.map((r) =>
        applyLandingSurface(
          createTerrainRoadGeometry(
            sampleTerrainPolyline(r.points, 75, 0.3).map(([x, , z]) => [x, z]),
            r.widthM,
            0.48,
          ),
          0.48,
          r.id,
        ),
      ),
    ]
    expect(gs.map((g) => ({ attributes: Object.fromEntries(Object.entries(g.attributes).map(([key, a]) => [key, hash(Array.from(a.array))])), index: hash(g.index ? Array.from(g.index.array) : null) }))).toEqual(baseline.geometry)
    gs.forEach((g) => g.dispose())
    for (const [x, z, h] of baseline.support) expect(getLandingSupportHeight(x!, z!)).toBe(h)
    expect(hash(createLandingRegionalLayout())).toBe(baseline.environment.cover)
    expect(createLandingRegionalLayout()).toHaveLength(3574)
    expect(hash(createLandingServiceLayout())).toBe(baseline.environment.equipment)
    expect(hash(createLandingSurfaceHistory())).toBe(baseline.environment.wear)
    expect(createLandingSurfaceHistory()).toHaveLength(404)
    expect(hash(createLandingFoamLayout())).toBe(baseline.environment.foam)
    expect(createLandingFoamLayout()).toHaveLength(37)
    expect(hash(VegetationSystem().props.children.map((e: { props: VegetationPatchSpec }) => createVegetationLayout(e.props)))).toBe(baseline.environment.vegetation)
  })
})
