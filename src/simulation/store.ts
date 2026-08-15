import type { StoreApi } from 'zustand/vanilla'

import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

import type { SimulationSpeed, Stage1WorldState } from './types'

import { STAGE1_DURATION_SECONDS } from './constants'
import { deriveStage1WorldState } from './derive'
import { clampSimulationTime } from './time'

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
  const initialTime = clampSimulationTime(initialState.timeSeconds ?? 0)

  return createStore<SimulationStoreState>()((set, get) => ({
    timeSeconds: initialTime,
    isPlaying: initialTime < STAGE1_DURATION_SECONDS && (initialState.isPlaying ?? false),
    speed: initialState.speed ?? 1,
    transientResetVersion: 0,

    play: () => {
      if (get().timeSeconds >= STAGE1_DURATION_SECONDS) return
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
        const nextTime = clampSimulationTime(timeSeconds)
        return {
          timeSeconds: nextTime,
          isPlaying: nextTime >= STAGE1_DURATION_SECONDS ? false : state.isPlaying,
          transientResetVersion: state.transientResetVersion + 1,
        }
      }),

    setSpeed: (speed) => set({ speed }),

    tick: (realDeltaSeconds) => {
      const state = get()
      if (!state.isPlaying || !Number.isFinite(realDeltaSeconds) || realDeltaSeconds <= 0) return

      const nextTime = clampSimulationTime(state.timeSeconds + realDeltaSeconds * state.speed)
      set({
        timeSeconds: nextTime,
        isPlaying: nextTime < STAGE1_DURATION_SECONDS,
      })
    },
  }))
}

export const simulationStore = createSimulationStore()

export function useSimulationStore<Selection>(selector: (state: SimulationStoreState) => Selection): Selection {
  return useStore(simulationStore, selector)
}

export function getSimulationWorldState(store: SimulationStore = simulationStore): Stage1WorldState {
  return deriveStage1WorldState(store.getState().timeSeconds)
}

export function selectSimulationWorldState(state: SimulationStoreState): Stage1WorldState {
  return deriveStage1WorldState(state.timeSeconds)
}
