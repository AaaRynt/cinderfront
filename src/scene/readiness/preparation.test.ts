import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { deriveRuntimeWorldState, simulationStore } from '@/simulation'

import { startPreparation } from './preparation'
import { readinessStore } from './readinessStore'
const instant = async () => {}
beforeAll(() => {
  deriveRuntimeWorldState(0)
})
beforeEach(() => {
  readinessStore.setState({ phase: 'preparing', generation: 0, completed: 0, total: 0 })
  simulationStore.getState().restart()
})
afterEach(() => vi.useRealTimers())
describe('bounded renderer preparation ownership', () => {
  it('counts completed actual jobs and never changes any authored T+0 world field', async () => {
    const before = JSON.stringify(deriveRuntimeWorldState(0)),
      reset = simulationStore.getState().transientResetVersion,
      dispose = vi.fn()
    const saw: number[] = []
    const op = startPreparation({
      dispose,
      yieldWork: instant,
      jobs: [0, 1, 2].map((i) => ({
        label: `Resource ${i}`,
        run: () => {
          saw.push(readinessStore.getState().completed)
        },
      })),
    })
    await op.done
    expect(saw).toEqual([0, 1, 2])
    expect(readinessStore.getState()).toMatchObject({ phase: 'ready', completed: 3, total: 3 })
    expect(simulationStore.getState()).toMatchObject({ timeSeconds: 0, isPlaying: false, transientResetVersion: reset })
    expect(JSON.stringify(deriveRuntimeWorldState(0))).toBe(before)
    op.cancel()
    op.cancel()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
  it('exposes failure without false progress and supports a fresh retry generation', async () => {
    const dispose = vi.fn(),
      run = vi.fn(() => {
        throw new Error('Driver rejected preparation')
      })
    await startPreparation({ dispose, yieldWork: instant, jobs: [{ label: 'Shader', run }] }).done
    expect(readinessStore.getState()).toMatchObject({ phase: 'failed', completed: 0, total: 1, message: 'Driver rejected preparation' })
    const generation = readinessStore.getState().generation
    await startPreparation({ dispose, yieldWork: instant, jobs: [{ label: 'Shader', run: () => {} }] }).done
    expect(readinessStore.getState()).toMatchObject({ phase: 'ready', generation: generation + 1, completed: 1 })
    expect(dispose).toHaveBeenCalledTimes(2)
  })
  it('cancels an unresolved job, disposes once and prevents stale success from replacing the next context', async () => {
    let finish!: () => void
    const pending = new Promise<void>((resolve) => {
        finish = resolve
      }),
      dispose = vi.fn(),
      later = vi.fn()
    const old = startPreparation({
      dispose,
      yieldWork: instant,
      jobs: [
        { label: 'Pending', run: () => pending },
        { label: 'Never', run: later },
      ],
    })
    await Promise.resolve()
    await Promise.resolve()
    old.cancel('Context lost')
    const next = startPreparation({ dispose: vi.fn(), yieldWork: instant, jobs: [{ label: 'New renderer', run: () => {} }] })
    await next.done
    finish()
    await old.done
    old.cancel()
    expect(readinessStore.getState()).toMatchObject({ generation: next.generation, phase: 'ready', completed: 1 })
    expect(dispose).toHaveBeenCalledTimes(1)
    expect(later).not.toHaveBeenCalled()
  })
  it('bounds an indefinitely pending driver operation and permits explicit retry', async () => {
    vi.useFakeTimers()
    const dispose = vi.fn()
    const op = startPreparation({ budgetMs: 100, dispose, yieldWork: instant, jobs: [{ label: 'Pending driver', run: () => new Promise<void>(() => {}) }] })
    await vi.advanceTimersByTimeAsync(101)
    await op.done
    expect(readinessStore.getState()).toMatchObject({ phase: 'failed', completed: 0 })
    expect(readinessStore.getState().message).toContain('too long')
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
