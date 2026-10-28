import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'

import { STAGE7A_SOURCE_CHANGES, stage7aAuditedSourceHash } from '../test/stage7aSourceAudit'
import baseline from './fixtures/stage7aRuntimePreservation.json'
import { deriveRuntimeWorldState } from './runtime'
const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex')
beforeAll(() => {
  deriveRuntimeWorldState(0)
})
beforeAll(() => {
  deriveRuntimeWorldState(188)
})
beforeAll(() => {
  deriveRuntimeWorldState(240)
})
describe('Stage7A fixed completed Stage6C preservation', () => {
  it('protects the pre-edit capture and enumerated source exceptions', () => {
    expect(hash(readFileSync('src/simulation/fixtures/stage7aRuntimePreservation.json'))).toBe('456e732b6e0989875cfd3e5ac8dc245449bdfe94ea805ae414cc5b4e47e690c6')
    expect(baseline.sourceCommit).toBe('1bc6bdc')
    expect(baseline.capturedBeforeStage7A).toBe(true)
    expect(baseline.samples).toHaveLength(4963)
    expect(baseline.samples.at(-1)!.time).toBe(7200)
    for (const [path, reason] of Object.entries(STAGE7A_SOURCE_CHANGES)) {
      expect(Object.hasOwn(baseline.files, path), path).toBe(true)
      expect(reason.length).toBeGreaterThan(40)
    }
    expect(readFileSync('STAGE6C_ACCEPTANCE.md').equals(execFileSync('git', ['show', '1bc6bdc:STAGE6C_ACCEPTANCE.md']))).toBe(true)
  })
  it('keeps the complete fixed-step driver byte-identical to completed Stage6C', () => {
    const section = (source: string) => source.slice(source.indexOf('function SimulationDriver()'), source.indexOf('function DawnEnvironment()'))
    const current = readFileSync('src/scene/BattlefieldScene.tsx', 'utf8')
    const fixed = execFileSync('git', ['show', '1bc6bdc:src/scene/BattlefieldScene.tsx'], { encoding: 'utf8' })
    expect(section(current)).toBe(section(fixed))
  })
  it.each([0, 1, 2, 3])('retains every unrelated source and fixed historical byte, partition %s', (partition) => {
    for (const [i, [path, expected]] of Object.entries(baseline.files).entries()) if (i % 4 === partition) expect(stage7aAuditedSourceHash(path), path).toBe(expected)
  })
  it.each(Array.from({ length: 64 }, (_, i) => i))('retains full unprojected active runtime, partition %s', (partition) => {
    const size = Math.ceil(baseline.samples.length / 64)
    for (const sample of baseline.samples.slice(partition * size, (partition + 1) * size)) expect(hash(JSON.stringify(deriveRuntimeWorldState(sample.time))), `full world ${sample.time}`).toBe(sample.world)
  })
})
