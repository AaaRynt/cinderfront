/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { createShoreFoamLayout, sampleCoastalMotion } from '../scene/world/stage4c/coastalWater'
import { createRegionalLayout } from '../scene/world/stage4c/regionalLayout'
import { createServiceEquipmentLayout } from '../scene/world/stage4c/serviceLayout'
import { createSurfaceHistory } from '../scene/world/stage4c/surfaceHistory'
import { SIMULATION_DURATION_SECONDS } from './constants'
import { deriveSimulationWorldState } from './derive'
import baseline from './fixtures/stage4cPreservation.json'
import { isStage5AAddedEvent, projectCompletedStage4cWorld, STAGE5A_ADDED_EVENT_IDS } from './fixtures/stage5aPreservationProjection'
import { isStage5BAddedEvent } from './fixtures/stage5bPreservationProjection'
import { SIMULATION_EVENTS } from './timeline'

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

describe('Stage 5A immutable completed-world preservation', () => {
  it('keeps all 40 existing event records exact and adds only the two official Pantsir events', () => {
    expect(baseline.sourceCommit).toBe('6fb70b6d283814cbf5c16492505bc56f980d8c57')
    expect(baseline.capturedBeforeStage5A).toBe(true)
    expect(baseline.events).toHaveLength(40)
    expect(SIMULATION_EVENTS).toHaveLength(47)
    expect(SIMULATION_EVENTS.filter((event) => !isStage5AAddedEvent(event) && !isStage5BAddedEvent(event))).toEqual(baseline.events)
    expect(SIMULATION_EVENTS.filter(isStage5AAddedEvent).map((event) => [event.id, event.atSeconds])).toEqual([
      ['pantsir_02_relocate', 112],
      ['pantsir_02_destroyed', 121],
    ])
    expect(SIMULATION_DURATION_SECONDS).toBe(176)
  })

  it('compares every completed world field, weapon and support-convoy state through T+176', () => {
    expect(Object.keys(baseline.worldHashes)).toHaveLength(815)
    expect(baseline.worldKeys).toContain('stage4b2c')
    for (const [time, expectedHash] of Object.entries(baseline.worldHashes)) {
      const world = deriveSimulationWorldState(Number(time))
      const completed = projectCompletedStage4cWorld(world)
      expect(Object.keys(completed), `old-world shape at T+${time}`).toEqual(baseline.worldKeys)
      expect(Object.keys(world).toSorted(), `only additive actor fields at T+${time}`).toEqual([...baseline.worldKeys, 'secondaryPantsir', 'landing'].toSorted())
      expect(completed.stage4b2c, `support convoy retained at T+${time}`).toBe(world.stage4b2c)
      expect(completed.stage3.weapons, `all old weapons retained at T+${time}`).toBe(world.stage3.weapons)
      expect(Object.keys(completed.stage3.weapons)).toEqual(baseline.weaponIds)
      expect(completed.reachedEvents.every((event) => !STAGE5A_ADDED_EVENT_IDS.some((id) => id === event.id))).toBe(true)
      expect(hash(completed), `exact completed world at T+${time}`).toBe(expectedHash)
    }
  })

  it('preserves the exact seeded regional cover, equipment, wear and shoreline layouts', () => {
    expect(hash(createRegionalLayout())).toBe(baseline.environmentHashes.regionalCover)
    expect(hash(createServiceEquipmentLayout())).toBe(baseline.environmentHashes.serviceEquipment)
    expect(hash(createSurfaceHistory())).toBe(baseline.environmentHashes.surfaceHistory)
    expect(hash(createShoreFoamLayout())).toBe(baseline.environmentHashes.shoreFoam)
  })

  it('preserves every captured absolute-time coastal sample through the endpoint', () => {
    expect(Object.keys(baseline.coastalHashes)).toHaveLength(815)
    for (const [time, expectedHash] of Object.entries(baseline.coastalHashes)) {
      const samples = baseline.coastalPoints.map(([x, z]) => sampleCoastalMotion(x, z, Number(time)))
      expect(hash(samples), `coastal sampler at T+${time}`).toBe(expectedHash)
    }
  })

  it('retains the original fixtures and the additive pre-edit baseline without regeneration', () => {
    const fixtureHashes = {
      'stage4b2aPreservation.ts': '030ef305a63935ad037562f7857c26830b775cf356080fb1f86fe3014045cf16',
      'stage4b2bPreservation.json': 'd2427bbec38ccb9c01a18f29c82cb9eb9c86319b64f317adfc886887f563b25d',
      'stage4cPreservation.json': '14d103149f5ca7f9e3383d1ebd4c8573789d15ab485a040089fc6943894e72e9',
    }
    for (const [file, expectedHash] of Object.entries(fixtureHashes)) {
      const bytes = readFileSync(resolve(process.cwd(), 'src/simulation/fixtures', file))
      expect(createHash('sha256').update(bytes).digest('hex'), file).toBe(expectedHash)
    }
    // Stage 5A reformatted this file. Keep both its committed bytes and its
    // original historical encoding protected; neither baseline is regenerated.
    const historicalEncoding = `${JSON.stringify(baseline, null, 2)}\n`
    expect(createHash('sha256').update(historicalEncoding).digest('hex')).toBe('452e0ab23a66ce073be34e424bbeb2c33137c5b44f023725a9c50dad4c8f7f79')
  })
})
