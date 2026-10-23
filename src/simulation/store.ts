import type { StoreApi } from 'zustand/vanilla'

import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

import type { RuntimeWorldState } from './runtime'
import type { SimulationSpeed } from './types'

import { deriveRuntimeWorldState } from './runtime'
import { normalizeRuntimeTime } from './runtimeTime'

export interface SimulationStoreState {
  readonly timeSeconds: number
  readonly isPlaying: boolean
  readonly speed: SimulationSpeed
  /** Incremented whenever seek/restart requires renderers to clear transient objects. */
  readonly transientResetVersion: number
  readonly play: () => void
  readonly pause: () => void
  readonly restart: () => void
  readonly seek: (timeSeconds: number) => void
  readonly setSpeed: (speed: SimulationSpeed) => void
  readonly tick: (realDeltaSeconds: number) => void
}

export interface SimulationStoreInitialState {
  readonly timeSeconds?: number
  readonly isPlaying?: boolean
  readonly speed?: SimulationSpeed
}

export type SimulationStore = StoreApi<SimulationStoreState>

export function createSimulationStore(initialState: SimulationStoreInitialState = {}): SimulationStore {
  const initialTime = normalizeRuntimeTime(initialState.timeSeconds ?? 0)

  return createStore<SimulationStoreState>()((set, get) => ({
    timeSeconds: initialTime,
    isPlaying: initialState.isPlaying ?? false,
    speed: initialState.speed ?? 1,
    transientResetVersion: 0,

    play: () => {
      set({ isPlaying: true })
    },

    pause: () => set({ isPlaying: false }),

    restart: () =>
      set((state) => ({
        timeSeconds: 0,
        isPlaying: false,
        transientResetVersion: state.transientResetVersion + 1,
      })),

    seek: (timeSeconds) =>
      set((state) => {
        const nextTime = normalizeRuntimeTime(timeSeconds, state.timeSeconds)
        return {
          timeSeconds: nextTime,
          isPlaying: state.isPlaying,
          transientResetVersion: state.transientResetVersion + 1,
        }
      }),

    setSpeed: (speed) => set({ speed }),

    tick: (realDeltaSeconds) => {
      const state = get()
      if (!state.isPlaying || !Number.isFinite(realDeltaSeconds) || realDeltaSeconds <= 0) return

      const nextTime = state.timeSeconds + realDeltaSeconds * state.speed
      if (!Number.isFinite(nextTime)) return
      set({ timeSeconds: nextTime })
    },
  }))
}

export const simulationStore = createSimulationStore()

export function useSimulationStore<Selection>(selector: (state: SimulationStoreState) => Selection): Selection {
  return useStore(simulationStore, selector)
}

export function getSimulationWorldState(store: SimulationStore = simulationStore): RuntimeWorldState {
  return deriveRuntimeWorldState(store.getState().timeSeconds)
}

export function selectSimulationWorldState(state: SimulationStoreState): RuntimeWorldState {
  return deriveRuntimeWorldState(state.timeSeconds)
}
