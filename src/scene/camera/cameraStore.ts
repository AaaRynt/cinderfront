import { create } from 'zustand'

export type CameraPreset = 'overview' | 'wasp' | 'harbor' | 'talwar' | 'molniya' | 'industrial' | 'fuel-storage' | 'ammunition' | 'radar-hill' | 'search-radar' | 'corridor' | 'beachhead' | 'beach-offshore' | 'f35-01' | 'f35-02'

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
