import { create } from 'zustand'

export type CameraPreset = 'overview' | 'wasp' | 'harbor' | 'radar-hill' | 'search-radar' | 'f35-01'

interface CameraState {
  preset: CameraPreset
  requestId: number
  requestPreset: (preset: CameraPreset) => void
}

export const useCameraStore = create<CameraState>((set) => ({
  preset: 'overview',
  requestId: 0,
  requestPreset: (preset) => set((state) => ({ preset, requestId: state.requestId + 1 })),
}))
