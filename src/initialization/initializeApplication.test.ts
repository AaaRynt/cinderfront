import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getInitializationBounds, initializeApplication } from './initializeApplication'

const emptyApp = () => null
function loaders() {
  const terrain = vi.fn(async () => {}),
    landscape = vi.fn(async () => {}),
    presentation = vi.fn(async () => {}),
    app = vi.fn(async () => ({ default: emptyApp }))
  return { terrain, landscape, presentation, app, options: { onProgress: vi.fn(), loadTerrain: async () => ({ prepareLandingTerrain: terrain }), loadLandscape: async () => ({ prepareTreeLayout: landscape }), loadPresentation: async () => ({ prepareTerrainPresentation: presentation }), loadApplication: app } }
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 1))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('bootstrap ownership and handoff', () => {
  it('waits for two paint opportunities before heavy imports and completes every required phase', async () => {
    const f = loaders(),
      task = initializeApplication(f.options)
    expect(f.terrain).not.toHaveBeenCalled()
    expect(f.options.onProgress).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(f.terrain).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(await task.done).toBe(emptyApp)
    expect(f.terrain).toHaveBeenCalledOnce()
    expect(f.presentation).toHaveBeenCalledOnce()
    expect(f.landscape).toHaveBeenCalledOnce()
    expect(f.app).toHaveBeenCalledOnce()
    expect(getInitializationBounds().activeOwners).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
  it('handles cleanup/re-entry and never starts abandoned work after an import resolves', async () => {
    const f = loaders()
    let resolve: ((value: { prepareLandingTerrain: typeof f.terrain }) => void) | undefined
    const first = initializeApplication({
      ...f.options,
      loadTerrain: () =>
        new Promise((r) => {
          resolve = r
        }),
    })
    const failed = first.done.catch((error) => error)
    await vi.advanceTimersByTimeAsync(2)
    const second = initializeApplication(f.options)
    resolve?.({ prepareLandingTerrain: f.terrain })
    await vi.advanceTimersByTimeAsync(2)
    expect(await failed).toBeInstanceOf(Error)
    expect(await second.done).toBe(emptyApp)
    expect(f.terrain).toHaveBeenCalledOnce()
    expect(f.app).toHaveBeenCalledOnce()
    expect(getInitializationBounds().activeOwners).toBe(0)
  })
  it('fails an import or build honestly and reruns failed work on retry', async () => {
    const f = loaders()
    f.terrain.mockRejectedValueOnce(new Error('build failed'))
    const first = initializeApplication(f.options)
    const error = first.done.catch((e) => e)
    await vi.advanceTimersByTimeAsync(2)
    expect((await error).message).toBe('build failed')
    expect(f.app).not.toHaveBeenCalled()
    const second = initializeApplication(f.options)
    await vi.advanceTimersByTimeAsync(2)
    expect(await second.done).toBe(emptyApp)
    expect(f.terrain).toHaveBeenCalledTimes(2)
    const third = initializeApplication({
      ...f.options,
      loadApplication: async () => {
        throw new Error('import failed')
      },
    })
    const imported = third.done.catch((e) => e)
    await vi.advanceTimersByTimeAsync(2)
    expect((await imported).message).toBe('import failed')
    expect(getInitializationBounds().activeOwners).toBe(0)
  })
  it('times out a pending import, ignores late completion and clears all owned timers', async () => {
    const f = loaders()
    let resolve: ((value: { prepareLandingTerrain: typeof f.terrain }) => void) | undefined
    const task = initializeApplication({
      ...f.options,
      budgetMs: 20,
      loadTerrain: () =>
        new Promise((r) => {
          resolve = r
        }),
    })
    const failed = task.done.catch((e) => e)
    await vi.advanceTimersByTimeAsync(20)
    expect((await failed).message).toContain('too long')
    resolve?.({ prepareLandingTerrain: f.terrain })
    await Promise.resolve()
    expect(f.terrain).not.toHaveBeenCalled()
    expect(f.app).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('cancels before imports, bounds its deadline and leaves no autoplay intent', async () => {
    const f = loaders(),
      task = initializeApplication(f.options),
      failed = task.done.catch((e) => e)
    task.cancel()
    await vi.runAllTimersAsync()
    expect(await failed).toBeInstanceOf(Error)
    expect(f.terrain).not.toHaveBeenCalled()
    expect(f.app).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
    expect(() => initializeApplication({ ...f.options, budgetMs: Infinity })).toThrow('Invalid')
  })
})
