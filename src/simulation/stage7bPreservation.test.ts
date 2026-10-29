import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'

import { LANDING_SITES } from '../scene/world/landing/landingSiteData'
import { createLandingMainlandGeometry, getLandingSupportHeight, getLandingSupportIndexBounds } from '../scene/world/landing/landingTerrain'
import { STAGE7B_SOURCE_CHANGES, stage7bAuditedSourceHash } from '../test/stage7bSourceAudit'
import baseline from './fixtures/stage7bRuntimePreservation.json'
import { deriveRuntimeWorldState } from './runtime'

const hash = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex')
const supportHash = (points: readonly number[][]) => hash(Buffer.from(Float64Array.from(points, ([x, z]) => getLandingSupportHeight(x!, z!)).buffer))
beforeAll(() => {
  deriveRuntimeWorldState(0)
})
beforeAll(() => {
  deriveRuntimeWorldState(188)
})
beforeAll(() => {
  deriveRuntimeWorldState(240)
})

describe('Stage7B fixed completed Stage7A preservation', () => {
  it('retains the pre-edit full capture, dated acceptances and source exception boundaries', () => {
    expect(hash(readFileSync('src/simulation/fixtures/stage7bRuntimePreservation.json'))).toBe('c12fd0aa45d82930cfc334ce7ebac8a6cf75366140044e9dd581a553c78ee3ca')
    expect(baseline.sourceCommit).toBe('62edc66072554c0734928153937f0c98359af62d')
    expect(baseline.capturedBeforeStage7B).toBe(true)
    expect(baseline.samples).toHaveLength(386)
    for (const [path, reason] of Object.entries(STAGE7B_SOURCE_CHANGES)) {
      expect(Object.hasOwn(baseline.files, path), path).toBe(true)
      expect(reason.length).toBeGreaterThan(40)
    }
    for (const path of ['STAGE6C_ACCEPTANCE.md', 'STAGE7A_ACCEPTANCE.md', 'src/simulation/fixtures/stage7aRuntimePreservation.json']) {
      expect(readFileSync(path).equals(execFileSync('git', ['show', `62edc66:${path}`], { maxBuffer: 32 * 1024 * 1024 })), path).toBe(true)
    }
    const section = (source: string) => source.slice(source.indexOf('function SimulationDriver()'), source.indexOf('function DawnEnvironment()'))
    expect(section(readFileSync('src/scene/BattlefieldScene.tsx', 'utf8'))).toBe(section(execFileSync('git', ['show', '62edc66:src/scene/BattlefieldScene.tsx'], { encoding: 'utf8' })))
  })
  it.each([0, 1, 2, 3])('retains fixed source audits and every unrelated live file, partition %s', (partition) => {
    for (const [i, [path, expected]] of Object.entries(baseline.files).entries()) if (i % 4 === partition) expect(stage7bAuditedSourceHash(path), path).toBe(expected)
  })
  it.each([0, 1, 2, 3, 4, 5, 6, 7])('retains full unprojected moving/contact/busy worlds, partition %s', (partition) => {
    for (const [i, sample] of baseline.samples.entries()) if (i % 8 === partition) expect(hash(JSON.stringify(deriveRuntimeWorldState(sample.time))), `full world ${sample.time}`).toBe(sample.world)
  })
  it.each([0, 1, 2, 3, 4, 5, 6, 7])('retains dense moving wheel-center/contact support queries, partition %s', (partition) => {
    for (const [i, sample] of baseline.supportGroups.entries()) {
      if (i % 8 !== partition) continue
      const world = deriveRuntimeWorldState(sample.time),
        points: number[][] = []
      for (const payload of Object.values(world.landing.payload))
        for (const wheel of payload.wheels)
          for (const at of [wheel.center, wheel.contact])
            for (const [dx, dz] of [
              [0, 0],
              [0.1, 0],
              [-0.1, 0],
              [0, 0.1],
              [0, -0.1],
            ])
              points.push([at.x + dx!, at.z + dz!])
      expect(points).toHaveLength(sample.count)
      expect(supportHash(points), `support ${sample.time}`).toBe(sample.sha256)
    }
  })
  it('retains uploaded-vertex and compact-cell boundary support at signed epsilons', () => {
    const points: number[][] = []
    for (const site of LANDING_SITES) for (let dx = -24; dx <= 24; dx += 2) for (let dz = -10; dz <= 100; dz += 2) for (const e of [-1e-7, 0, 1e-7]) points.push([Math.floor(site.beach[0] / 2) * 2 + dx + e, Math.floor(site.beach[1] / 2) * 2 + dz - e])
    const geometry = createLandingMainlandGeometry(),
      p = geometry.getAttribute('position')
    for (let i = 0; i < p.count; i += 179) for (const e of [-1e-7, 0, 1e-7]) points.push([p.getX(i) + e, p.getZ(i) - e])
    geometry.dispose()
    expect(points).toHaveLength(baseline.boundary.count)
    expect(supportHash(points)).toBe(baseline.boundary.sha256)
  })
  it('keeps exactly four immutable support-index owners through moving and late backseeks', () => {
    const before = getLandingSupportIndexBounds()
    expect(before).toHaveLength(4)
    for (const time of [176.2718, 7200, 206, 0, 350, 78]) {
      deriveRuntimeWorldState(time)
      expect(getLandingSupportIndexBounds()).toEqual(before)
    }
  })
  it('keeps prior complete snapshots immutable through alternating actors and shuffled backseeks', () => {
    const selected = baseline.samples.filter((_, i) => i % 17 === 0),
      retained = selected.map((sample) => ({ sample, world: deriveRuntimeWorldState(sample.time) }))
    for (const sample of [...selected].reverse()) expect(hash(JSON.stringify(deriveRuntimeWorldState(sample.time)))).toBe(sample.world)
    for (const { sample, world } of retained) expect(hash(JSON.stringify(world)), `retained ${sample.time}`).toBe(sample.world)
  })
})
