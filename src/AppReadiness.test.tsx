import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { useCameraStore } from './scene/camera/cameraStore'
import { readinessStore } from './scene/readiness/readinessStore'
import { deriveRuntimeWorldState, simulationStore } from './simulation'
vi.mock('./scene/BattlefieldScene', () => ({ BattlefieldScene: () => null }))
beforeAll(() => {
  deriveRuntimeWorldState(0)
})
beforeAll(() => {
  deriveRuntimeWorldState(188)
})
beforeAll(() => {
  deriveRuntimeWorldState(240)
})
beforeEach(() => {
  simulationStore.getState().restart()
  readinessStore.setState({ phase: 'preparing', generation: 1, completed: 0, total: 9, message: 'Preparing scene · playback will be available shortly' })
})
afterEach(cleanup)
describe('readiness interface integration', () => {
  it('gates mouse/keyboard without queued autoplay and leaves camera inspection available', () => {
    render(<App />)
    const play = screen.getByRole('button', { name: 'Play simulation' })
    expect(play).toBeDisabled()
    expect(play).toHaveAccessibleDescription(/Preparing scene/)
    fireEvent.click(play)
    fireEvent.keyDown(window, { code: 'Space' })
    fireEvent.keyDown(window, { code: 'Enter' })
    fireEvent.keyDown(window, { code: 'End' })
    expect(simulationStore.getState()).toMatchObject({ timeSeconds: 0, isPlaying: false })
    expect(screen.getByRole('slider')).toBeDisabled()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'lcac-east' } })
    const request = useCameraStore.getState().requestId
    fireEvent.click(screen.getByRole('button', { name: 'Recenter selected camera' }))
    expect(useCameraStore.getState().requestId).toBe(request + 1)
    act(() => readinessStore.setState({ phase: 'ready', completed: 9 }))
    expect(play).toBeEnabled()
    expect(simulationStore.getState().isPlaying).toBe(false)
    expect(useCameraStore.getState().preset).toBe('lcac-east')
    fireEvent.keyDown(window, { code: 'Space' })
    expect(simulationStore.getState().isPlaying).toBe(true)
    fireEvent.keyDown(window, { code: 'Space' })
    fireEvent.click(screen.getByRole('button', { name: 'Restart simulation' }))
    expect(readinessStore.getState()).toMatchObject({ phase: 'ready', generation: 1 })
  })
  it.each(['failed', 'cancelled'] as const)('shows truthful %s and explicit retry without playing', (phase) => {
    readinessStore.setState({ phase, message: 'Preparation interrupted · retry to play' })
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent('Preparation interrupted')
    const before = readinessStore.getState().retryVersion
    fireEvent.click(screen.getByRole('button', { name: 'Retry preparation' }))
    expect(readinessStore.getState().retryVersion).toBe(before + 1)
    expect(simulationStore.getState().isPlaying).toBe(false)
    expect(screen.getByRole('button', { name: 'Play simulation' })).toBeDisabled()
  })
})
