/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { createLandingRegionalLayout, createLandingServiceLayout, createLandingSurfaceHistory, createLandingFoamLayout } from '../scene/world/landing/landingReservations'
import { createLandingMainlandGeometry, createLandingCoastGeometry, getLandingSupportHeight } from '../scene/world/landing/landingTerrain'
import { deriveSimulationWorldState } from './derive'
import baseline from './fixtures/stage5bPreservation.json'
import { isStage5CAddedEvent, projectStage5bPayload } from './fixtures/stage5cPreservationProjection'
import { restoreStage5bNarrative, restoreStage5bScenario } from './fixtures/stage5cReferenceProjection'
import { LCAC_IDS, LAV_IDS } from './landingCraftData'
import { SIMULATION_EVENTS } from './timeline'

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const fileHash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')
const immutable = ['id', 'groupId', 'carrierId', 'factionId', 'vehicleType', 'condition', 'outcome'] as const
describe('Stage 5C immutable completed Stage 5B baseline', () => {
  it('protects its captured bytes, all 47 prior records and all original terrain/model source files', () => {
    expect(fileHash('src/simulation/fixtures/stage5bPreservation.json')).toBe('47bedd7e7daf98c22e1484f58f951ba403cee8ce12fff0dfaaeffd4fa5c986c5')
    expect(baseline.sourceCommit).toBe('2a3fffc')
    expect(baseline.capturedBeforeStage5C).toBe(true)
    expect(SIMULATION_EVENTS.filter((e) => !isStage5CAddedEvent(e))).toEqual(baseline.events)
    for (const [path, expected] of Object.entries(baseline.files)) if (!path.includes('/scenario/')) expect(fileHash(path), path).toBe(expected)
    const source = readFileSync('assets/scenario/scenario-spec.yaml', 'utf8')
    const narrative = readFileSync('assets/scenario/scenario-timeline.md', 'utf8')
    expect(createHash('sha256').update(restoreStage5bScenario(source)).digest('hex')).toBe(baseline.files['assets/scenario/scenario-spec.yaml'])
    expect(createHash('sha256').update(restoreStage5bNarrative(narrative)).digest('hex')).toBe(baseline.files['assets/scenario/scenario-timeline.md'])
  })
  // Split this new dense baseline into bounded cases without changing any old
  // timeout or reducing coverage. Every captured timestamp is still checked.
  it.each([0, 1, 2, 3])('compares all old actors/weapons, complete LCACs and valid payload fields, partition %s', (partition) => {
    const source = baseline.snapshots[0]!.landing.payload
    for (let n = partition; n < baseline.samples.length; n += 4) {
      const sample = baseline.samples[n]!,
        world = deriveSimulationWorldState(sample.time),
        { landing, ...prior } = world
      expect(hash({ ...prior, reachedEvents: prior.reachedEvents.filter((e) => !isStage5CAddedEvent(e)) }), `old world ${sample.time}`).toBe(sample.prior)
      for (const [i, id] of LCAC_IDS.entries()) expect(hash(landing.crafts[id]), `${id} ${sample.time}`).toBe(sample.crafts[i])
      for (const [i, id] of LAV_IDS.entries()) {
        const payload = landing.payload[id]
        if (sample.time <= payload.departureAtSeconds) expect(hash(projectStage5bPayload(payload)), `${id} pre-departure ${sample.time}`).toBe(sample.payload[i])
        for (const field of immutable) expect(payload[field]).toBe(source[id][field])
      }
    }
  })
  it('retains every uploaded terrain/coast attribute, contact sample and environmental layout', () => {
    const geometry = [createLandingMainlandGeometry(), createLandingCoastGeometry()].map((g) => ({ attributes: Object.fromEntries(Object.entries(g.attributes).map(([key, a]) => [key, hash(Array.from(a.array))])), index: hash(g.index ? Array.from(g.index.array) : null) }))
    expect(geometry).toEqual(baseline.geometry)
    for (const samples of baseline.support) for (const [x, z, height] of samples) expect(getLandingSupportHeight(x!, z!)).toBe(height)
    expect(hash(createLandingRegionalLayout())).toBe(baseline.environment.cover)
    expect(hash(createLandingServiceLayout())).toBe(baseline.environment.equipment)
    expect(hash(createLandingSurfaceHistory())).toBe(baseline.environment.wear)
    const foam = createLandingFoamLayout()
    expect(foam).toHaveLength(37)
    expect(hash(foam)).toBe(baseline.environment.foam)
  })
})
