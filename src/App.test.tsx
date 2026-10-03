import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { simulationStore } from './simulation'

vi.mock('./scene/BattlefieldScene', () => ({ BattlefieldScene: () => null }))

beforeEach(() => {
  simulationStore.getState().restart()
  simulationStore.getState().setSpeed(1)
})
afterEach(cleanup)

describe('Stage 4B.2C spectator interface', () => {
  it('retains all 18 existing cameras and adds only one support-convoy preset', () => {
    render(<App />)
    const cameras = within(screen.getByRole('navigation', { name: 'Camera presets' }))
    expect(cameras.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Overview',
      'Wasp',
      'Harbor',
      'Talwar',
      'Molniya',
      'Industrial',
      'Fuel storage',
      'Ammunition',
      'Radar Hill',
      'Search radar',
      'Convoy corridor',
      'BTR focus',
      'T-72 focus',
      'Beach inland',
      'Beach offshore',
      'F-35B 01',
      'F-35B 02',
      'Air reinforcement',
      'Support convoy',
    ])
    fireEvent.click(cameras.getByRole('button', { name: 'Air reinforcement' }))
    expect(cameras.getByRole('button', { name: 'Air reinforcement' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Cinderfront / Stage 4B.2C')).toBeInTheDocument()
    expect(screen.getByText('Su-30MKK pair')).toBeInTheDocument()
    expect(screen.getByLabelText('Support convoy status')).toHaveTextContent('routine transit')
    fireEvent.click(cameras.getByRole('button', { name: 'Support convoy' }))
    expect(cameras.getByRole('button', { name: 'Support convoy' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('reconstructs exact event readouts on forward/backward UI seeks and restart', () => {
    render(<App />)
    const slider = screen.getByRole('slider', { name: 'Seek simulation time' })
    const timeline = screen.getByRole('region', { name: 'Simulation timeline' })
    expect(slider).toHaveAttribute('max', '176')
    for (const [time, event] of [
      [170, 'aircraft_egress'],
      [103.9, 'talwar_fuel_leak'],
      [104, 'su30_reinforcement_entry'],
      [136.9, 'btr_survivors_fallback'],
      [137, 'su30_01_damaged'],
      [141.9, 'su30_01_damaged'],
      [142, 'su30_02_cover_withdrawal'],
      [170, 'aircraft_egress'],
      [75, 'rescue_convoy_redirect'],
      [108, 'rescue_convoy_chokepoint'],
      [125, 'rescue_route_secondary_hit'],
      [174, 'rescue_convoy_abandon_approach'],
      [176, 'rescue_convoy_abandon_approach'],
      [124.9, 'ammunition_cookoff_begin'],
    ] as const) {
      fireEvent.input(slider, { target: { value: String(time) } })
      expect(simulationStore.getState().timeSeconds).toBe(time)
      expect(timeline).toHaveTextContent(`Event ${event}`)
    }
    fireEvent.click(screen.getByRole('button', { name: 'Restart simulation' }))
    expect(simulationStore.getState().timeSeconds).toBe(0)
    expect(timeline).toHaveTextContent('Event scenario_begin')
    expect(screen.getByRole('button', { name: 'Play simulation' })).toBeInTheDocument()
  })

  it('preserves play/pause and all three playback speeds', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Play simulation' }))
    expect(simulationStore.getState().isPlaying).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Pause simulation' }))
    expect(simulationStore.getState().isPlaying).toBe(false)
    for (const speed of [0.5, 2, 1] as const) {
      fireEvent.click(screen.getByRole('button', { name: `${speed}×` }))
      expect(simulationStore.getState().speed).toBe(speed)
      expect(screen.getByRole('button', { name: `${speed}×` })).toHaveAttribute('aria-pressed', 'true')
    }
  })
})
