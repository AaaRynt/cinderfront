import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'

import { STAGE6C_SOURCE_CHANGES, stage6cAuditedSourceHash } from '../test/stage6cSourceAudit'
import boundaries from './fixtures/stage6cBoundaryPreservation.json'
import baseline from './fixtures/stage6cRuntimePreservation.json'
import transfers from './fixtures/stage6cTransferPreservation.json'
import { deriveRuntimeWorldState } from './runtime'
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
beforeAll(() => {
  deriveRuntimeWorldState(0)
})
beforeAll(() => {
  deriveRuntimeWorldState(188)
})
beforeAll(() => {
  deriveRuntimeWorldState(210)
})
beforeAll(() => {
  deriveRuntimeWorldState(240)
})
describe('Stage6C exact full active world preservation against pre-edit 5f940b5', () => {
  it('protects the original capture, including unprojected aftermath state through 7200', () => {
    expect(hash(readFileSync('src/simulation/fixtures/stage6cRuntimePreservation.json'))).toBe('e216deabbe9eb7a923437ec1d9bcf1d66351d783b376c90f7d3a6cfb7517e3a5')
    expect(baseline.sourceCommit).toBe('5f940b5')
    expect(baseline.capturedBeforeStage6C).toBe(true)
    expect(baseline.samples.length).toBeGreaterThan(1500)
    expect(baseline.samples.at(-1)!.time).toBe(7200)
    for (const [path, reason] of Object.entries(STAGE6C_SOURCE_CHANGES)) {
      expect(Object.hasOwn(baseline.files, path), path).toBe(true)
      expect(reason.length).toBeGreaterThan(30)
    }
  })
  it.each([0, 1, 2, 3])('retains exact historical bytes and all unrelated live sources, partition %s', (partition) => {
    for (const [i, [path, expected]] of Object.entries(baseline.files).entries())
      if (i % 4 === partition) {
        expect(stage6cAuditedSourceHash(path), path).toBe(expected)
        if (path.includes('/fixtures/')) expect(readFileSync(path).equals(execFileSync('git', ['show', `5f940b5:${path}`], { maxBuffer: 32 * 1024 * 1024 })), path).toBe(true)
      }
  })
  it.each(Array.from({ length: 32 }, (_, i) => i))('preserves every current actor, contact, wheel, weapon, runtime and effect state field, partition %s', (partition) => {
    const chunk = Math.ceil(baseline.samples.length / 32)
    for (const s of baseline.samples.slice(partition * chunk, (partition + 1) * chunk)) {
      expect(hash(JSON.stringify(deriveRuntimeWorldState(s.time))), `complete active world T+${s.time}`).toBe(s.world)
    }
  })
  it('protects the fixed-commit supplement at all 98 exact transfer, bend, brake and hold samples', () => {
    expect(hash(readFileSync('src/simulation/fixtures/stage6cBoundaryPreservation.json'))).toBe('431a660dcbcd5fa1754a424ffb3f834b3e051efb837e75a21d698f501340ed8a')
    expect(boundaries.sourceCommit).toBe('5f940b5')
    expect(boundaries.fixedCommitSupplement).toBe(true)
    expect(boundaries.samples).toHaveLength(98)
    for (const sample of boundaries.samples) {
      const overlap = baseline.samples.find((row) => row.time === sample.time)
      if (overlap) expect(sample.world).toBe(overlap.world)
    }
  })
  it.each([0, 1, 2, 3])('retains exact complete active world state at every supplementary boundary, partition %s', (partition) => {
    for (let i = partition; i < boundaries.samples.length; i += 4) {
      const sample = boundaries.samples[i]!
      expect(hash(JSON.stringify(deriveRuntimeWorldState(sample.time))), `full boundary world ${sample.time}`).toBe(sample.world)
    }
  })
  it('protects all five exact active-runtime contact transitions for every LAV', () => {
    expect(hash(readFileSync('src/simulation/fixtures/stage6cTransferPreservation.json'))).toBe('a63a7587e5d684babdc8e02ba65a498c048ac944f917e3914f272abfd5c773a4')
    expect(transfers.sourceCommit).toBe('5f940b5')
    expect(transfers.fixedCommitSupplement).toBe(true)
    expect(transfers.boundaries).toHaveLength(40)
    expect(new Set(transfers.boundaries.map((row) => row.id)).size).toBe(8)
    expect(new Set(transfers.boundaries.map((row) => row.transition)).size).toBe(5)
    expect(transfers.samples).toHaveLength(120)
    for (const boundary of transfers.boundaries) for (const delta of [-0.001, 0, 0.001]) expect(transfers.samples.some((row) => row.time === boundary.time + delta)).toBe(true)
  })
  it.each([0, 1, 2, 3])('retains every complete active-world field around all eight LAV contact transfers, partition %s', (partition) => {
    const count = transfers.samples.length / 4
    for (const sample of transfers.samples.slice(partition * count, (partition + 1) * count)) expect(hash(JSON.stringify(deriveRuntimeWorldState(sample.time))), `full transfer world ${sample.time}`).toBe(sample.world)
  })
})
