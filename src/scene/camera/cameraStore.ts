import { create } from 'zustand'

import type { EnvironmentDetailPreset } from './environmentDetails'

import { observationCueAt, type ObservationCue } from './observationCues'

export type CameraPreset =
  | EnvironmentDetailPreset
  | 'overview'
  | 'wasp'
  | 'harbor'
  | 'talwar'
  | 'molniya'
  | 'industrial'
  | 'fuel-storage'
  | 'ammunition'
  | 'radar-hill'
  | 'search-radar'
  | 'corridor'
  | 'btr'
  | 't72'
  | 'beachhead'
  | 'beach-offshore'
  | 'f35-01'
  | 'f35-02'
  | 'su30'
  | 'support-convoy'
  | 'secondary-pantsir'
  | 'lcac-west'
  | 'lcac-east'
  | 'lav-west'
  | 'lav-east'

interface CameraState {
  preset: CameraPreset
  requestId: number
  requestPreset: (preset: CameraPreset) => void
  guidedCue: ObservationCue | null
  enableGuide: (timeSeconds: number) => void
  syncGuide: (timeSeconds: number) => void
  leaveGuide: () => void
  recenter: () => void
}

function guideRequest(state: CameraState, cue: ObservationCue) {
  return { guidedCue: cue, preset: cue.preset, requestId: state.requestId + 1 }
}

export const useCameraStore = create<CameraState>((set) => ({
  preset: 'overview',
  requestId: 0,
  requestPreset: (preset) => set((state) => ({ preset, requestId: state.requestId + 1, guidedCue: null })),
  guidedCue: null,
  enableGuide: (timeSeconds) => set((state) => guideRequest(state, observationCueAt(timeSeconds))),
  syncGuide: (timeSeconds) =>
    set((state) => {
      if (!state.guidedCue) return state
      const cue = observationCueAt(timeSeconds)
      return cue === state.guidedCue ? state : guideRequest(state, cue)
    }),
  leaveGuide: () => set((state) => (state.guidedCue ? { guidedCue: null } : state)),
  recenter: () => set((state) => ({ requestId: state.requestId + 1 })),
}))
