import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const source = readFileSync('tools/playback-review/probe.mjs', 'utf8').replace('export function installPlaybackProbe', 'function installPlaybackProbe')

function fixture() {
  let time = 1000,
    id = 0,
    queries = 0
  const raf = new Map<number, (time: number) => void>(),
    timers = new Map<number, () => void>(),
    listeners = new Set<unknown>(),
    observers: Observer[] = []
  let button: { disabled: boolean } | null = null
  class Observer {
    callback: (list: { getEntries: () => unknown[] }) => void
    disconnected = false
    constructor(callback: Observer['callback']) {
      this.callback = callback
      observers.push(this)
    }
    observe() {
      this.disconnected = false
    }
    disconnect() {
      this.disconnected = true
    }
  }
  class Canvas {
    getContext() {
      return null
    }
  }
  const env = {
    performance: { timeOrigin: 0, now: () => time },
    innerWidth: 1280,
    innerHeight: 720,
    structuredClone,
    document: {
      querySelector: (selector: string) => {
        queries++
        return selector.includes('play-pause') ? button : null
      },
      addEventListener: (_type: string, fn: unknown) => listeners.add(fn),
      removeEventListener: (_type: string, fn: unknown) => listeners.delete(fn),
    },
    PerformanceObserver: Observer,
    MutationObserver: Observer,
    HTMLCanvasElement: Canvas,
    requestAnimationFrame: (callback: (time: number) => void) => {
      raf.set(++id, callback)
      return id
    },
    cancelAnimationFrame: (key: number) => raf.delete(key),
    setTimeout: (callback: () => void) => {
      timers.set(++id, callback)
      return id
    },
    clearTimeout: (key: number) => timers.delete(key),
  }
  const sandbox = vm.createContext(env),
    install = () => vm.runInContext(`${source}\ninstallPlaybackProbe(globalThis)`, sandbox)
  const p = install()
  const context = Object.fromEntries(
    ['compileShader', 'linkProgram', 'getProgramParameter', 'getShaderParameter', 'getProgramInfoLog', 'getShaderInfoLog', 'getActiveUniform', 'getActiveAttrib', 'getUniformLocation', 'getAttribLocation', 'bufferData', 'bufferSubData'].map((name) => [name, vi.fn((..._args: unknown[]) => null)]),
  )
  Object.assign(context, { getContextAttributes: () => ({ antialias: true }) })
  const originalRender = vi.fn(function (this: unknown) {
    time++
    return this
  })
  const renderer = { render: originalRender, getContext: () => context, getPixelRatio: () => 1, info: { programs: [], memory: { geometries: 0 } } }
  const root = { gl: renderer }
  const state = {
    timeSeconds: 0,
    isPlaying: false,
    speed: 1,
    transientResetVersion: 0,
    pause: () => {
      state.isPlaying = false
    },
  }
  p.bindStore({ getState: () => state })
  p.bindCamera({ getState: () => ({ preset: 'overview', requestPreset: vi.fn() }) })
  const flush = () => {
    time += 17
    const callbacks = [...raf.values()]
    raf.clear()
    callbacks.forEach((callback) => callback(time))
  }
  const ready = () => {
    p.attach(root)
    renderer.render()
    button = { disabled: false }
    flush()
  }
  return { p, install, renderer, originalRender, root, context, state, raf, timers, listeners, observers, flush, ready, queries: () => queries, Canvas }
}

describe('optional playback recorder ownership', () => {
  it('reuses a single installation instead of accumulating callbacks or listeners', () => {
    const f = fixture(),
      before = f.p.lifecycle()
    expect(f.install()).toBe(f.p)
    expect(f.p.lifecycle()).toEqual(before)
    expect(f.raf.size).toBe(1)
    expect(f.timers.size).toBe(1)
    expect(f.listeners.size).toBe(1)
    f.p.dispose()
  })

  it('attaches once per renderer/context and measures one native render once', () => {
    const f = fixture()
    f.p.attach(f.root)
    f.p.attach(f.root)
    expect(f.renderer.render()).toBe(f.renderer)
    expect(f.originalRender).toHaveBeenCalledOnce()
    expect(f.p.renderWork).toBe(1)
    expect(f.p.lifecycle().attachments).toBe(1)
    f.context.bufferData(0, new Uint8Array(7))
    expect(f.p.uploadBytes).toBe(7)
    expect(f.p.counts.bufferData).toBe(1)
    f.p.dispose()
  })

  it('owns an immutable export across later writes and resets', () => {
    const f = fixture()
    f.p.world(1, 2, false, 'hud')
    f.p.frames.push([1])
    f.p.startup.progress.push([1, 'Preparing terrain'])
    const old = f.p.export()
    f.p.world(2, 3, false, 'hud')
    f.p.frames.push([2])
    f.p.startup.progress.push([2, 'Preparing graphics'])
    expect(old.worldTotals.hud).toEqual({ calls: 1, misses: 1, ms: 2 })
    expect(old.frames).toEqual([[1]])
    expect(old.startup.progress).toEqual([[1, 'Preparing terrain']])
    f.p.arm({ name: 'next' })
    expect(old.frames).toEqual([[1]])
    f.p.dispose()
  })

  it('cancels all owned observers, frames, timers and listeners on disposal', () => {
    const f = fixture(),
      originalContext = f.Canvas.prototype.getContext
    f.p.attach(f.root)
    const originalBuffer = f.context.bufferData
    f.p.dispose()
    f.p.dispose()
    expect(f.raf.size).toBe(0)
    expect(f.timers.size).toBe(0)
    expect(f.listeners.size).toBe(0)
    expect(f.observers.every((observer) => observer.disconnected)).toBe(true)
    expect(f.renderer.render).toBe(f.originalRender)
    expect(f.context.bufferData).not.toBe(originalBuffer)
    expect(f.Canvas.prototype.getContext).not.toBe(originalContext)
    expect(f.p.lifecycle()).toMatchObject({ disposed: true, observers: 0, timers: 0, scheduledFrames: 0, listeners: 0 })
    expect(() => f.p.arm({})).toThrow('unavailable')
  })

  it('does not overwrite a later observer or renderer owner during cleanup', () => {
    const f = fixture()
    f.p.attach(f.root)
    const later = vi.fn()
    f.renderer.render = later
    f.p.dispose()
    expect(f.renderer.render).toBe(later)
  })

  it('stops startup tickers and DOM scanning before warmed playback', () => {
    const f = fixture()
    f.ready()
    expect(f.p.readyAt).not.toBeNull()
    expect(f.raf.size).toBe(0)
    expect(f.timers.size).toBe(0)
    expect(f.listeners.size).toBe(0)
    const queries = f.queries()
    f.flush()
    f.flush()
    expect(f.queries()).toBe(queries)
    f.p.arm({ name: 'run', untilTime: 1 })
    f.state.isPlaying = true
    f.flush()
    f.state.timeSeconds = 1
    f.flush()
    expect(f.p.done).toBe(true)
    expect(f.state.isPlaying).toBe(false)
    expect(f.raf.size).toBe(0)
    expect(f.queries()).toBe(queries)
    f.p.dispose()
  })

  it('restarts a finished recorder without duplicating its RAF loop or retaining old counters', () => {
    const f = fixture()
    f.ready()
    const schedule: Array<[number, string]> = [[0, 'overview']]
    f.p.arm({ untilTime: 0, schedule })
    schedule.push([1, 'late mutation'])
    f.state.isPlaying = true
    f.flush()
    expect(f.p.run.schedule).toEqual([[0, 'overview']])
    expect(f.p.done).toBe(true)
    f.p.arm({ name: 'second', untilTime: 2 })
    expect(f.raf.size).toBe(1)
    expect(f.p.frames).toHaveLength(0)
    expect(f.p.worldTotals).toEqual({})
    expect(() => f.p.arm({ name: 'overlapping' })).toThrow('unavailable')
    f.p.dispose()
  })

  it('keeps construction-channel accounting with the captured diagnostic owner', () => {
    const f = fixture()
    f.p.channelOpen()
    f.p.dispose()
    const next = f.install()
    f.p.channelClose()
    expect(next).not.toBe(f.p)
    expect(f.p.lifecycle().channels).toBe(0)
    expect(next.lifecycle().channels).toBe(0)
    next.dispose()
  })

  it('transfers finished buffers once without retaining or mutating the transferred data', () => {
    const f = fixture()
    f.ready()
    expect(() => f.p.take()).toThrow('No finished')
    f.p.arm({ untilTime: 0 })
    f.state.isPlaying = true
    f.flush()
    const owned = f.p.take()
    expect(owned.frames).toHaveLength(1)
    expect(f.p.frames).toHaveLength(0)
    expect(() => f.p.take()).toThrow('No finished')
    f.p.arm({ untilTime: 1 })
    f.state.isPlaying = true
    f.flush()
    expect(owned.frames).toHaveLength(1)
    owned.frames.push([999])
    expect(f.p.frames).toHaveLength(1)
    f.p.dispose()
  })

  it('retains a closing long task delivered after the final RAF without leaking it into the next run', () => {
    const f = fixture()
    f.ready()
    f.p.arm({ untilTime: 0 })
    const start = f.p.armedAt
    f.state.isPlaying = true
    f.flush()
    const entry = { startTime: start, duration: 51, name: 'self' }
    f.observers[0]!.callback({ getEntries: () => [entry] })
    expect(f.p.take().longTasks).toEqual([{ start, duration: 51, name: 'self' }])
    f.p.arm({ untilTime: 1 })
    f.observers[0]!.callback({ getEntries: () => [entry] })
    expect(f.p.longTasks).toHaveLength(0)
    f.p.dispose()
  })

  it('flags a bounded-buffer overflow rather than silently reporting complete evidence', () => {
    const f = fixture()
    for (let i = 0; i < 60001; i++) f.p.world(i, 1, false, 'hud')
    expect(f.p.misses).toHaveLength(60000)
    expect(f.p.truncated).toBe(true)
    expect(f.p.dropped.misses).toBe(1)
    f.p.dispose()
  })
})
