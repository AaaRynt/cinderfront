import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { BufferGeometry } from 'three'
import { describe, expect, it, vi } from 'vitest'

import { prepareLandingTerrain } from '../scene/world/landing/landingTerrain'
import reference from '../simulation/fixtures/stage7cConstructionPreservation.json'
import presentationReference from '../simulation/fixtures/stage7cPresentationPreservation.json'
import sourceReference from '../simulation/fixtures/stage7cSourcePreservation.json'
import { captureConstruction } from '../test/stage7cConstructionFingerprint'
import { STAGE7C_SOURCE_CHANGES, stage7cAuditedSourceHash } from '../test/stage7cSourceAudit'

describe('fixed Stage 7B construction bytes', () => {
  it('keeps all synchronous geometry, support candidate/constants and layout bytes exact', () => {
    expect(captureConstruction()).toEqual(reference)
  })
  it('keeps the prepared result equal to independently captured synchronous outputs', async () => {
    await prepareLandingTerrain({ signal: new AbortController().signal, sliceMs: 1, yieldWork: async () => {} })
    expect(captureConstruction()).toEqual(reference)
  })
})

describe('prepared construction ownership', () => {
  it.each([0.5, 8, 24])('publishes exact complete surfaces with %s ms slices', async (sliceMs) => {
    vi.resetModules()
    const gate = await import('./terrainGate'),
      terrain = await import('../scene/world/landing/landingTerrain')
    gate.requireTerrainPreparation()
    expect(() => terrain.getLandingSupportHeight(4400, -2600)).toThrow('not finished')
    expect(terrain.getLandingSupportIndexBounds()).toHaveLength(0)
    const yieldWork = vi.fn(async () => {})
    await terrain.prepareLandingTerrain({ signal: new AbortController().signal, sliceMs, yieldWork })
    expect(yieldWork).toHaveBeenCalled()
    const { fingerprintGeometry } = await import('../test/stage7cConstructionFingerprint')
    const meshes = terrain.getPreparedTerrainMeshes()!
    expect(fingerprintGeometry(meshes.terrain)).toEqual(reference.geometries['landing-mainland'])
    expect(fingerprintGeometry(meshes.coast)).toEqual(reference.geometries['coast-minus3'])
    expect(terrain.getLandingSupportIndexBounds()).toHaveLength(4)
    expect(terrain.getLandingPreparationBounds()).toMatchObject({ complete: true, stagingOwners: 0, stagingGeometries: 0 })
    const old = fingerprintGeometry(meshes.terrain)
    await terrain.prepareLandingTerrain({ signal: new AbortController().signal, yieldWork })
    expect(terrain.getPreparedTerrainMeshes()?.terrain).toBe(meshes.terrain)
    expect(fingerprintGeometry(meshes.terrain)).toEqual(old)
  })
  it('releases an abandoned private build and retries without exposing partial geometry', async () => {
    vi.resetModules()
    const terrain = await import('../scene/world/landing/landingTerrain'),
      gate = await import('./terrainGate')
    gate.requireTerrainPreparation()
    const controller = new AbortController(),
      disposed: string[] = []
    const original = BufferGeometry.prototype.dispose
    const spy = vi.spyOn(BufferGeometry.prototype, 'dispose').mockImplementation(function (this: BufferGeometry) {
      disposed.push(this.uuid)
      original.call(this)
    })
    try {
      let privateSlices = 0
      await expect(
        terrain.prepareLandingTerrain({
          signal: controller.signal,
          sliceMs: 0.1,
          yieldWork: async () => {
            expect(terrain.getLandingSupportIndexBounds()).toHaveLength(0)
            if (terrain.getLandingPreparationBounds().stagingGeometries > 0 && ++privateSlices === 3) controller.abort(new Error('cancel inside refinement'))
          },
        }),
      ).rejects.toThrow('cancel inside refinement')
      expect(disposed.length).toBeGreaterThan(0)
      expect(new Set(disposed).size).toBe(disposed.length)
      expect(terrain.getLandingPreparationBounds()).toMatchObject({ complete: false, stagingOwners: 0, stagingGeometries: 0 })
      expect(() => terrain.createLandingMainlandGeometry()).toThrow('not finished')
      await terrain.prepareLandingTerrain({ signal: new AbortController().signal, yieldWork: async () => {} })
      expect(terrain.getLandingPreparationBounds().complete).toBe(true)
      expect(new Set(disposed).size).toBe(disposed.length)
    } finally {
      spy.mockRestore()
    }
  })
  it('mounts finite exact presentation geometry without duplicate templates or incomplete publication', async () => {
    const presentation = await import('../scene/world/stage2/terrainPresentation'),
      specs = await import('../scene/world/stage2/terrainPresentationSpecs'),
      { fingerprintGeometry } = await import('../test/stage7cConstructionFingerprint')
    const signal = new AbortController().signal
    await presentation.prepareTerrainPresentation({
      signal,
      sliceMs: 1,
      yieldWork: async () => {
        expect(presentation.getTerrainPresentationBounds().geometries).toBe(0)
      },
    })
    const roads = specs.TERRAIN_ROAD_SPECS.map((s) => presentation.preparedTerrainRoad(s.id, s.points, s.width, s.spacing, s.offset)!)
    const surfaces = specs.TERRAIN_SURFACE_SPECS.map((s) => presentation.preparedTerrainSurface(s.points, s.offset)!)
    expect(roads.map(fingerprintGeometry)).toEqual(presentationReference.roads)
    expect(surfaces.map(fingerprintGeometry)).toEqual(presentationReference.surfaces)
    expect(presentation.getTerrainPresentationBounds()).toMatchObject({ geometries: 41, capacity: 41, stagingOwners: 0 })
    const first = specs.TERRAIN_ROAD_SPECS[0]!
    expect(presentation.preparedTerrainRoad(first.id, [...first.points], first.width, first.spacing, first.offset)).toBeUndefined()
    expect(presentation.preparedTerrainRoad(first.id, first.points, first.width + 1, first.spacing, first.offset)).toBeUndefined()
    await presentation.prepareTerrainPresentation({ signal })
    expect(presentation.preparedTerrainRoad(first.id, first.points, first.width, first.spacing, first.offset)).toBe(roads[0])
  })
})

describe('fixed Stage 7C source/authority scope', () => {
  it.each([0, 1, 2, 3])('protects every unrelated live source/asset, partition %s', (partition) => {
    for (const [i, [path, expected]] of Object.entries(sourceReference.files).entries()) if (i % 4 === partition) expect(stage7cAuditedSourceHash(path), path).toBe(expected)
  })
  it('retains dated acceptance, original fixture bytes and precise source exceptions', () => {
    for (const path of ['STAGE6C_ACCEPTANCE.md', 'STAGE7A_ACCEPTANCE.md', 'STAGE7B_ACCEPTANCE.md']) expect(readFileSync(path).equals(execFileSync('git', ['show', `9c0208b:${path}`])), path).toBe(true)
    for (const [path, reason] of Object.entries(STAGE7C_SOURCE_CHANGES)) {
      expect(Object.hasOwn(sourceReference.files, path)).toBe(true)
      expect(reason.length).toBeGreaterThan(40)
    }
    expect(createHash('sha256').update(readFileSync('src/simulation/fixtures/stage7cConstructionPreservation.json')).digest('hex')).toBe('8fd42db977266f73474c3b5170e7eac8a4d1343cf043de1e9702631d42aef7f8')
    expect(createHash('sha256').update(readFileSync('src/simulation/fixtures/stage7cPresentationPreservation.json')).digest('hex')).toBe('b9b2edaa99a7a2ad8cea44e9e643be0e478c8edeb7d034cadc7aa2caed1e0df3')
    const main = readFileSync('src/main.tsx', 'utf8'),
      shell = readFileSync('src/initialization/Bootstrap.tsx', 'utf8'),
      bootstrap = readFileSync('src/initialization/initializeApplication.ts', 'utf8')
    expect(main).toContain('<StrictMode>')
    expect(main).toContain('<Bootstrap />')
    expect(main).not.toContain("from './App")
    expect(shell).not.toMatch(/from ['"].*(?:scene|simulation)/)
    expect(bootstrap).not.toMatch(/^import .*from ['"].*(?:scene|simulation)/m)
  })
})
