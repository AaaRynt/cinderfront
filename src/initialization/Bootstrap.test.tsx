import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Bootstrap } from './Bootstrap'
import { initializeApplication } from './initializeApplication'

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 1))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('accessible early preparation shell', () => {
  it('paints without a world, accepts native disclosure/cancel and retries under StrictMode', async () => {
    const terrain = vi.fn(async () => {}),
      App = () => <p>Complete scene</p>
    const initialize: typeof initializeApplication = (options) =>
      initializeApplication({ ...options, loadTerrain: async () => ({ prepareLandingTerrain: terrain }), loadLandscape: async () => ({ prepareTreeLayout: async () => {} }), loadPresentation: async () => ({ prepareTerrainPresentation: async () => {} }), loadApplication: async () => ({ default: App }) })
    const view = render(
      <StrictMode>
        <Bootstrap initialize={initialize} />
      </StrictMode>,
    )
    expect(screen.getByTestId('loading-shell')).toHaveAttribute('aria-busy', 'true')
    expect(terrain).not.toHaveBeenCalled()
    expect(screen.queryByText('Complete scene')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('About preparation'))
    expect(screen.getByText('About preparation').closest('details')).toHaveAttribute('open')
    fireEvent.click(screen.getByRole('button', { name: 'Pause preparation' }))
    await act(() => vi.runAllTimersAsync())
    expect(screen.getByRole('status')).toHaveTextContent('Preparation paused')
    expect(terrain).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Retry preparation' }))
    await act(() => vi.advanceTimersByTimeAsync(2))
    expect(screen.getByText('Complete scene')).toBeInTheDocument()
    expect(terrain).toHaveBeenCalledOnce()
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('shows a real failure and reruns initialization rather than declaring false readiness', async () => {
    const terrain = vi.fn(async () => {}).mockRejectedValueOnce(new Error('owned construction failure')),
      App = () => <p>Complete scene</p>
    const initialize: typeof initializeApplication = (options) =>
      initializeApplication({ ...options, loadTerrain: async () => ({ prepareLandingTerrain: terrain }), loadLandscape: async () => ({ prepareTreeLayout: async () => {} }), loadPresentation: async () => ({ prepareTerrainPresentation: async () => {} }), loadApplication: async () => ({ default: App }) })
    const view = render(<Bootstrap initialize={initialize} />)
    await act(() => vi.advanceTimersByTimeAsync(2))
    expect(screen.getByRole('status')).toHaveTextContent('could not be prepared')
    expect(screen.queryByText('Complete scene')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry preparation' }))
    await act(() => vi.advanceTimersByTimeAsync(2))
    expect(screen.getByText('Complete scene')).toBeInTheDocument()
    expect(terrain).toHaveBeenCalledTimes(2)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
