import type { ComponentType } from 'react'

import { requireTerrainPreparation } from './terrainGate'

export const CPU_INITIALIZATION_BUDGET_MS = 20_000

interface InitializationOptions {
  onProgress: (message: string) => void
  budgetMs?: number
  loadTerrain?: () => Promise<Pick<typeof import('../scene/world/landing/landingTerrain'), 'prepareLandingTerrain'>>
  loadLandscape?: () => Promise<Pick<typeof import('../scene/world/landscape/treeLayout'), 'prepareTreeLayout'>>
  loadPresentation?: () => Promise<Pick<typeof import('../scene/world/stage2/terrainPresentation'), 'prepareTerrainPresentation'>>
  loadApplication?: () => Promise<{ default: ComponentType }>
}
let owner = 0
let cancelPrevious: (() => void) | undefined

/** No runtime, scene, Three.js or layout dependency is eagerly imported here. */
export function initializeApplication({
  onProgress,
  budgetMs = CPU_INITIALIZATION_BUDGET_MS,
  loadTerrain = () => import('../scene/world/landing/landingTerrain'),
  loadLandscape = () => import('../scene/world/landscape/treeLayout'),
  loadPresentation = () => import('../scene/world/stage2/terrainPresentation'),
  loadApplication = () => import('../App'),
}: InitializationOptions) {
  if (!Number.isFinite(budgetMs) || budgetMs <= 0 || budgetMs > CPU_INITIALIZATION_BUDGET_MS) throw new Error('Invalid scene preparation budget')
  cancelPrevious?.()
  const generation = ++owner
  const controller = new AbortController()
  const { signal } = controller
  const start = performance.now()
  const deadline = start + budgetMs
  requireTerrainPreparation()
  const check = () => {
    if (signal.aborted) throw signal.reason
    if (generation !== owner) throw new Error('Scene preparation cancelled')
    if (performance.now() >= deadline) throw new Error('Scene preparation took too long. Try again.')
  }
  const cancel = () => {
    if (!signal.aborted) controller.abort(new Error('Scene preparation cancelled'))
  }
  cancelPrevious = cancel
  const timer = setTimeout(() => controller.abort(new Error('Scene preparation took too long. Try again.')), budgetMs)
  const abortable = <T>(promise: Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason)
        return
      }
      const abort = () => reject(signal.reason)
      signal.addEventListener('abort', abort, { once: true })
      promise.then(
        (value) => {
          signal.removeEventListener('abort', abort)
          resolve(value)
        },
        (error) => {
          signal.removeEventListener('abort', abort)
          reject(error)
        },
      )
    })
  // Two frames permit the shell commit to paint before a heavy module is fetched.
  const paint = () =>
    abortable(
      new Promise<void>((resolve) => {
        let second = 0
        const first = requestAnimationFrame(() => {
          second = requestAnimationFrame(() => {
            signal.removeEventListener('abort', abort)
            resolve()
          })
        })
        const abort = () => {
          cancelAnimationFrame(first)
          cancelAnimationFrame(second)
        }
        signal.addEventListener('abort', abort, { once: true })
      }),
    )
  const progress = ({ message }: { message: string }) => {
    check()
    onProgress(message)
  }
  const done = (async () => {
    try {
      await paint()
      check()
      onProgress('Preparing terrain')
      const terrain = await abortable(loadTerrain())
      check()
      const options = { signal, deadline, onProgress: progress }
      await terrain.prepareLandingTerrain(options)
      check()
      const presentation = await abortable(loadPresentation())
      check()
      await presentation.prepareTerrainPresentation(options)
      check()
      const landscape = await abortable(loadLandscape())
      check()
      await landscape.prepareTreeLayout(options)
      check()
      onProgress('Preparing scene')
      const application = await abortable(loadApplication())
      check()
      return application.default
    } finally {
      clearTimeout(timer)
      if (generation === owner) cancelPrevious = undefined
    }
  })()
  return { done, cancel, generation, signal }
}

export function getInitializationBounds() {
  return { generation: owner, activeOwners: cancelPrevious ? 1 : 0, budgetMs: CPU_INITIALIZATION_BUDGET_MS }
}
