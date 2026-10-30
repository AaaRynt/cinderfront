export interface ConstructionProgress {
  message: string
}
export type Construction<T> = Generator<ConstructionProgress | void, T, void>

/** Synchronous consumers drain the very same arithmetic/iteration kernel. */
export function finishConstruction<T>(work: Construction<T>): T {
  let complete = false
  try {
    for (;;) {
      const step = work.next()
      if (step.done) {
        complete = true
        return step.value
      }
    }
  } finally {
    if (!complete) work.return(undefined as never)
  }
}

/** A real task boundary, without nested-timer clamping or a persistent ticker. */
export function yieldConstruction(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const channel = new MessageChannel()
    const release = () => {
      channel.port1.onmessage = null
      channel.port1.close()
      channel.port2.close()
      signal.removeEventListener('abort', abort)
    }
    const abort = () => {
      release()
      reject(signal.reason)
    }
    channel.port1.onmessage = () => {
      release()
      resolve()
    }
    signal.addEventListener('abort', abort, { once: true })
    channel.port2.postMessage(null)
  })
}

export interface ConstructionOptions {
  signal: AbortSignal
  sliceMs?: number
  deadline?: number
  now?: () => number
  yieldWork?: (signal: AbortSignal) => Promise<void>
  onProgress?: (progress: ConstructionProgress) => void
  onSlice?: (milliseconds: number) => void
}

export async function runConstruction<T>(work: Construction<T>, { signal, sliceMs = 8, deadline = Infinity, now = () => performance.now(), yieldWork = yieldConstruction, onProgress, onSlice, onDiscard }: ConstructionOptions & { onDiscard?: (result: T) => void }): Promise<T> {
  if (!Number.isFinite(sliceMs) || sliceMs <= 0) throw new Error('Construction slice must be positive')
  let complete = false
  let sliceStart = now()
  const check = () => {
    if (signal.aborted) throw signal.reason
    if (now() >= deadline) throw new Error('Scene preparation took too long. Try again.')
  }
  try {
    for (;;) {
      check()
      const step = work.next()
      if (step.done) {
        try {
          onSlice?.(now() - sliceStart)
          check()
        } catch (error) {
          onDiscard?.(step.value)
          throw error
        }
        complete = true
        return step.value
      }
      if (step.value) onProgress?.(step.value)
      if (now() - sliceStart >= sliceMs) {
        onSlice?.(now() - sliceStart)
        await yieldWork(signal)
        check()
        sliceStart = now()
      }
    }
  } finally {
    if (!complete) work.return(undefined as never)
  }
}
