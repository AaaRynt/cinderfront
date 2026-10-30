import type { ComponentType, ReactNode } from 'react'

import { Component, useEffect, useRef, useState } from 'react'

import { initializeApplication } from './initializeApplication'

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFailure()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** This shell imports neither the scene nor the simulation, even indirectly. */
export function Bootstrap({ initialize = initializeApplication }: { initialize?: typeof initializeApplication }) {
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('Preparing scene')
  const [phase, setPhase] = useState<'preparing' | 'failed' | 'cancelled'>('preparing')
  const [loaded, setLoaded] = useState<{ App: ComponentType } | null>(null)
  const operation = useRef<ReturnType<typeof initializeApplication> | null>(null)
  useEffect(() => {
    let abandoned = false
    const task = initialize({
      onProgress: (next) => {
        if (!abandoned) setMessage(next)
      },
    })
    operation.current = task
    task.done.then(
      (App) => {
        if (!abandoned && !task.signal.aborted) setLoaded({ App })
      },
      () => {
        if (!abandoned) setPhase((current) => (current === 'cancelled' ? 'cancelled' : 'failed'))
      },
    )
    return () => {
      abandoned = true
      task.cancel()
      if (operation.current === task) operation.current = null
    }
  }, [attempt, initialize])
  const retry = () => {
    operation.current?.cancel()
    setLoaded(null)
    setMessage('Preparing scene')
    setPhase('preparing')
    setAttempt((n) => n + 1)
  }
  if (loaded)
    return (
      <SceneBoundary
        key={attempt}
        onFailure={() => {
          setLoaded(null)
          setPhase('failed')
        }}
      >
        <loaded.App />
      </SceneBoundary>
    )
  return (
    <main className="app-shell grid place-items-center p-6" data-testid="loading-shell" aria-busy={phase === 'preparing'}>
      <section className="hud-panel w-full max-w-md px-6 py-5" aria-label="Scene preparation">
        <p className="m-0 font-mono text-[10px] tracking-[0.17em] text-(--muted) uppercase">Cinderfront</p>
        <h1 className="mt-2 mb-5 text-lg font-semibold tracking-wider uppercase">Ash Harbor</h1>
        <p className="font-mono text-sm text-(--amber-bright)" role="status" aria-live="polite">
          {phase === 'preparing' ? message : phase === 'cancelled' ? 'Preparation paused' : 'The scene could not be prepared. Try again.'}
        </p>
        {phase === 'preparing' && <progress className="my-3 w-full accent-(--amber-bright)" aria-label={message} />}
        <details className="my-4 text-xs leading-5 text-(--muted)">
          <summary className="cursor-pointer text-(--ink)">About preparation</summary>
          <p>Terrain, surroundings and graphics are prepared before playback becomes available. The observation starts paused.</p>
        </details>
        <button
          type="button"
          className="border border-(--hud-edge) px-3 py-2 text-xs text-(--ink)"
          onClick={
            phase === 'preparing'
              ? () => {
                  operation.current?.cancel()
                  setLoaded(null)
                  setPhase('cancelled')
                }
              : retry
          }
        >
          {phase === 'preparing' ? 'Pause preparation' : 'Retry preparation'}
        </button>
      </section>
    </main>
  )
}
