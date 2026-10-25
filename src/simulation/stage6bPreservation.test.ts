import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { createTreeLayout } from '../scene/world/landscape/treeLayout'
import { STAGE6B_SOURCE_CHANGES, stage6bAuditedSourceHash } from '../test/stage6bSourceAudit'
import { deriveSimulationWorldState } from './derive'
import baseline from './fixtures/stage6aRuntimePreservation.json'
import { deriveRuntimeWorldState } from './runtime'
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
describe('Stage6B active runtime exact Stage6A preservation', () => {
  it('retains immutable capture and historical tree layout', () => {
    expect(readFileSync('src/simulation/fixtures/stage6aRuntimePreservation.json').equals(execFileSync('git', ['show', '5f940b5:src/simulation/fixtures/stage6aRuntimePreservation.json'], { maxBuffer: 32 * 1024 * 1024 }))).toBe(true)
    expect(baseline.sourceCommit).toBe('75bf46a')
    expect(baseline.capturedBeforeStage6B).toBe(true)
    expect(hash(createTreeLayout())).toBe(baseline.trees)
  })
  it.each([0, 1, 2, 3])('retains fixedGit source audit and unrelated source hashes, partition%s', (partition) => {
    for (const [i, [path, expected]] of Object.entries(baseline.files).entries()) if (i % 4 === partition) expect(stage6bAuditedSourceHash(path), path).toBe(expected)
  })
  it('enumerates precise reasons for each historical source exception', () => {
    for (const [path, reason] of Object.entries(STAGE6B_SOURCE_CHANGES)) {
      expect(reason.length).toBeGreaterThan(15)
      expect(Object.hasOwn(baseline.files, path), path).toBe(true)
    }
  })
  it.each([0, 1, 2, 3])('retains every historical fixture byte against fixed75bf46a, partition%s', (partition) => {
    for (const [i, path] of Object.keys(baseline.files)
      .filter((p) => p.includes('/fixtures/'))
      .entries())
      if (i % 4 === partition) expect(readFileSync(path).equals(execFileSync('git', ['show', `75bf46a:${path}`], { maxBuffer: 32 * 1024 * 1024 })), path).toBe(true)
  })
  it.each([0, 1, 2, 3, 4, 5, 6, 7])('compares every old active world field without removing actor families, partition%s', (partition) => {
    for (let i = partition; i < baseline.samples.length; i += 8) {
      const s = baseline.samples[i]!
      const { runtime, ...world } = deriveRuntimeWorldState(s.time)
      expect(runtime.scriptedSeconds).toBe(s.time)
      expect(hash(world), `active world ${s.time}`).toBe(s.world)
      expect(hash(deriveSimulationWorldState(s.time)), `legacy world ${s.time}`).toBe(s.world)
    }
  })
})
