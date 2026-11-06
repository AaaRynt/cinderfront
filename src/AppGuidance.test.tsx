import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { useCameraStore } from './scene/camera/cameraStore'
import { HIGHLIGHT_CUES, OBSERVATION_CUES, observationCueAt } from './scene/camera/observationCues'
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
  deriveRuntimeWorldState(7200)
})
beforeEach(() => {
  readinessStore.setState({ phase: 'ready' })
  simulationStore.getState().restart()
  simulationStore.getState().setSpeed(1)
  useCameraStore.getState().requestPreset('overview')
})
afterEach(cleanup)

const guideButton = () => screen.getByRole('button', { name: 'Guided view' })
const camera = useCameraStore.getState
const clock = simulationStore.getState

describe('guided observation', () => {
  it('selects the destination at each boundary and holds the last shot indefinitely', () => {
    expect(OBSERVATION_CUES.length).toBeLessThanOrEqual(10)
    expect(OBSERVATION_CUES[0]?.atSeconds).toBe(0)
    expect(observationCueAt(0)).toBe(OBSERVATION_CUES[0])
    for (const [index, cue] of OBSERVATION_CUES.entries()) {
      if (index > 0) {
        expect(cue.atSeconds).toBeGreaterThan(OBSERVATION_CUES[index - 1]!.atSeconds)
        expect(observationCueAt(cue.atSeconds - 0.001)).toBe(OBSERVATION_CUES[index - 1])
      }
      expect(observationCueAt(cue.atSeconds)).toBe(cue)
      expect(observationCueAt(cue.atSeconds + 0.001)).toBe(cue)
    }
    expect(observationCueAt(188)).toBe(OBSERVATION_CUES.at(-1))
    expect(observationCueAt(7200)).toBe(OBSERVATION_CUES.at(-1))
    expect(HIGHLIGHT_CUES.map((cue) => cue.preset)).toEqual(['inspection-bay', 'fuel-shock', 'shore-break', 'lav-east'])
  })

  it('reads the live clock, skips intermediate cuts and leaves ordinary camera controls in charge', () => {
    clock().seek(52)
    clock().setSpeed(2)
    const view = render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    const request = camera().requestId
    const reset = clock().transientResetVersion
    expect(guideButton()).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('observation-mode')).toHaveTextContent('Manual view')
    fireEvent.click(guideButton())
    expect(camera()).toMatchObject({ requestId: request + 1, preset: 'radar-hill' })
    expect(clock()).toMatchObject({ timeSeconds: 52, isPlaying: false, speed: 2, transientResetVersion: reset })
    fireEvent.click(screen.getByRole('button', { name: 'Play simulation' }))
    act(() => clock().tick(0.5))
    expect(camera()).toMatchObject({ requestId: request + 2, preset: 'inspection-bay' })
    act(() => clock().tick(0.5))
    expect(camera().requestId).toBe(request + 2)
    act(() => clock().seek(188.2))
    expect(camera()).toMatchObject({ requestId: request + 3, preset: 'lcac-east' })
    act(() => clock().seek(7200))
    expect(camera().requestId).toBe(request + 3)
    expect(screen.getByTestId('observation-mode')).toHaveTextContent('Final ramp transfers')
    act(() => clock().seek(89.9))
    expect(camera()).toMatchObject({ requestId: request + 4, preset: 'support-convoy' })
    fireEvent.click(screen.getByRole('button', { name: 'Recenter selected camera' }))
    expect(camera()).toMatchObject({ requestId: request + 5, guidedCue: { preset: 'support-convoy' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'Spectator camera' }), { target: { value: 'harbor' } })
    act(() => clock().tick(0.1))
    expect(camera()).toMatchObject({ requestId: request + 6, preset: 'harbor', guidedCue: null })
    expect(clock().timeSeconds).toBeCloseTo(90.1, 9)
    const clockBeforeGuide = clock()
    expect(clockBeforeGuide).toMatchObject({ isPlaying: true, speed: 2 })
    fireEvent.click(guideButton())
    expect(camera()).toMatchObject({ requestId: request + 7, preset: 'fuel-shock' })
    expect(clock()).toBe(clockBeforeGuide)
    fireEvent.click(guideButton())
    expect(camera()).toMatchObject({ requestId: request + 7, preset: 'fuel-shock', guidedCue: null })
    fireEvent.click(guideButton())
    fireEvent.click(screen.getByRole('button', { name: 'Restart simulation' }))
    expect(camera()).toMatchObject({ requestId: request + 9, guidedCue: { preset: 'wasp' } })
    expect(clock()).toMatchObject({ timeSeconds: 0, isPlaying: false, speed: 2 })
    view.unmount()
    act(() => clock().seek(173))
    expect(camera().requestId).toBe(request + 9)
  })

  it.each(HIGHLIGHT_CUES)('pauses at the $title lead-in and leaves its preset in manual view', (cue) => {
    clock().seek(176)
    clock().setSpeed(0.5)
    render(<App />)
    fireEvent.click(guideButton())
    fireEvent.click(screen.getByRole('button', { name: 'Play simulation' }))
    const request = camera().requestId
    const reset = clock().transientResetVersion
    const summary = screen.getByText('Highlights', { selector: 'summary' })
    fireEvent.click(summary)
    const preview = screen.getByRole('button', { name: new RegExp(cue.title) })
    preview.focus()
    fireEvent.click(preview)
    expect(camera()).toMatchObject({ requestId: request + 1, preset: cue.preset, guidedCue: null })
    expect(clock()).toMatchObject({ timeSeconds: cue.atSeconds, isPlaying: false, speed: 0.5, transientResetVersion: reset + 1 })
    expect(summary).toHaveFocus()
    expect(summary.closest('details')?.open).toBe(false)
    act(() => clock().tick(10))
    expect(clock().timeSeconds).toBe(cue.atSeconds)
  })

  it('gates highlights during graphics preparation and leaves the clock untouched when ready', () => {
    readinessStore.setState({ phase: 'preparing' })
    render(<App />)
    fireEvent.click(guideButton())
    const request = camera().requestId
    const reset = clock().transientResetVersion
    const summary = screen.getByText('Highlights', { selector: 'summary' })
    fireEvent.click(summary)
    const preview = screen.getByRole('button', { name: /Fuel shock/ })
    expect(preview).toBeDisabled()
    fireEvent.click(preview)
    expect(camera().requestId).toBe(request)
    act(() => readinessStore.setState({ phase: 'ready' }))
    expect(preview).toBeEnabled()
    expect(clock()).toMatchObject({ timeSeconds: 0, isPlaying: false, transientResetVersion: reset })
    preview.focus()
    fireEvent.keyDown(preview, { key: 'Escape' })
    expect(summary).toHaveFocus()
    expect(summary.closest('details')?.open).toBe(false)
  })
})
