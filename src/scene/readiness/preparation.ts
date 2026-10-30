import { readinessStore } from './readinessStore'

export interface PreparationJob {
  label: string
  run: (signal: AbortSignal) => void | Promise<void>
}
export interface PreparationOptions {
  jobs: readonly PreparationJob[]
  dispose: () => void
  budgetMs?: number
  yieldWork?: (signal: AbortSignal) => Promise<void>
}
export function yieldPreparation(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const abort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, 0)
    signal.addEventListener('abort', abort, { once: true })
  })
}
/** One owner per mounted renderer/context generation. An unresolved driver job
 * may finish later, but cannot publish readiness or dispose another owner's work. */
export function startPreparation({ jobs, dispose, budgetMs = 12_000, yieldWork = yieldPreparation }: PreparationOptions) {
  const controller = new AbortController()
  const generation = readinessStore.getState().generation + 1
  const current = () => readinessStore.getState().generation === generation
  let disposed = false
  const release = () => {
    if (!disposed) {
      disposed = true
      dispose()
    }
  }
  const update = (patch: Partial<ReturnType<typeof readinessStore.getState>>) => {
    if (current()) readinessStore.setState(patch)
  }
  // Publish the new generation before the current-generation guard is used.
  readinessStore.setState({ generation, phase: 'preparing', completed: 0, total: jobs.length, message: 'Preparing graphics · playback will be available shortly' })
  const timer = setTimeout(() => controller.abort(new Error('Preparation took too long. Retry scene preparation.')), budgetMs)
  const done = (async () => {
    try {
      for (let i = 0; i < jobs.length; i++) {
        await yieldWork(controller.signal)
        if (controller.signal.aborted) throw controller.signal.reason
        await new Promise<void>((resolve, reject) => {
          const signal = controller.signal
          const abort = () => reject(signal.reason)
          signal.addEventListener('abort', abort, { once: true })
          Promise.resolve()
            .then(() => {
              if (signal.aborted) throw signal.reason
              return jobs[i]!.run(signal)
            })
            .then(resolve, reject)
            .finally(() => signal.removeEventListener('abort', abort))
        })
        if (controller.signal.aborted) throw controller.signal.reason
        update({ completed: i + 1 })
      }
      update({ phase: 'ready', message: 'Scene ready' })
    } catch (error) {
      if (current() && readinessStore.getState().phase !== 'cancelled') update({ phase: 'failed', message: error instanceof Error ? error.message : 'Scene preparation failed. Retry to play.' })
    } finally {
      clearTimeout(timer)
      release()
    }
  })()
  return {
    done,
    generation,
    cancel: (message = 'Scene preparation cancelled. Retry to play.') => {
      if (!controller.signal.aborted) controller.abort(new Error(message))
      update({ phase: 'cancelled', message })
      // Jobs only borrow resources for synchronous renderer operations. Async
      // compilation owns no staging geometry after its synchronous compile call.
      release()
    },
  }
}
