import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

export type ReadinessPhase = 'preparing' | 'ready' | 'failed' | 'cancelled'
export interface ReadinessState {
  phase: ReadinessPhase
  generation: number
  completed: number
  total: number
  message: string
  retryVersion: number
  retry: () => void
}
export const readinessStore = createStore<ReadinessState>()((set) => ({
  phase: 'preparing',
  generation: 0,
  completed: 0,
  total: 0,
  message: 'Preparing scene · playback will be available shortly',
  retryVersion: 0,
  retry: () => set((s) => ({ retryVersion: s.retryVersion + 1 })),
}))
export const useReadiness = <T>(selector: (state: ReadinessState) => T) => useStore(readinessStore, selector)
export const playbackReady = () => readinessStore.getState().phase === 'ready'
