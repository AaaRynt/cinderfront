import { describe, expect, it, vi } from 'vitest'

import { finishConstruction, runConstruction, yieldConstruction, type Construction } from './cooperative'

describe('bounded deterministic construction', () => {
  it.each([0.5, 8, 24])('retains order and values with %s ms slices', async (sliceMs) => {
    let clock = 0
    function* kernel(): Construction<number[]> {
      const out: number[] = []
      for (let i = 0; i < 83; i++) {
        clock += 0.7
        out.push(Math.fround(Math.sin(i) * i))
        yield
      }
      return out
    }
    const expected = finishConstruction(kernel())
    clock = 0
    const yieldWork = vi.fn(async () => {})
    expect(await runConstruction(kernel(), { signal: new AbortController().signal, sliceMs, now: () => clock, yieldWork })).toEqual(expected)
    expect(yieldWork).toHaveBeenCalled()
  })
  it('returns to a real task rather than chaining resolved promises', async () => {
    const order: string[] = []
    const task = yieldConstruction(new AbortController().signal).then(() => order.push('task'))
    await Promise.resolve()
    order.push('microtask')
    expect(order).toEqual(['microtask'])
    await task
    expect(order).toEqual(['microtask', 'task'])
  })
  it('cancels in a long loop and closes its private iterator exactly once', async () => {
    const controller = new AbortController()
    let visited = 0,
      released = 0
    function* kernel(): Construction<number> {
      try {
        for (let i = 0; i < 1000; i++) {
          visited++
          yield
        }
        return visited
      } finally {
        released++
      }
    }
    const result = runConstruction(kernel(), {
      signal: controller.signal,
      sliceMs: 1,
      now: () => visited,
      yieldWork: async () => {
        controller.abort(new Error('cancelled'))
      },
    })
    await expect(result).rejects.toThrow('cancelled')
    expect(visited).toBe(1)
    expect(released).toBe(1)
  })
  it('checks deadlines inside the loop and releases progress failures', async () => {
    let visited = 0,
      released = 0
    function* kernel(): Construction<number> {
      try {
        for (let i = 0; i < 1000; i++) {
          visited++
          yield { message: 'work' }
        }
        return visited
      } finally {
        released++
      }
    }
    await expect(runConstruction(kernel(), { signal: new AbortController().signal, deadline: 4, now: () => visited, yieldWork: async () => {} })).rejects.toThrow('too long')
    expect(visited).toBe(4)
    expect(released).toBe(1)
    await expect(
      runConstruction(kernel(), {
        signal: new AbortController().signal,
        onProgress: () => {
          throw new Error('failed')
        },
      }),
    ).rejects.toThrow('failed')
    expect(released).toBe(2)
  })
  it('discards an owned completed result if the deadline expires on its final unit', async () => {
    let clock = 0
    const result = { owned: true },
      discard = vi.fn()
    function* kernel(): Construction<typeof result> {
      yield
      clock = 10
      return result
    }
    await expect(runConstruction(kernel(), { signal: new AbortController().signal, deadline: 5, now: () => clock, onDiscard: discard })).rejects.toThrow('too long')
    expect(discard).toHaveBeenCalledExactlyOnceWith(result)
  })
  it('rejects an already-aborted or pending task without leaving a channel open', async () => {
    const controller = new AbortController()
    const pending = yieldConstruction(controller.signal)
    controller.abort(new Error('stop'))
    await expect(pending).rejects.toThrow('stop')
    await expect(yieldConstruction(controller.signal)).rejects.toThrow('stop')
  })
})
