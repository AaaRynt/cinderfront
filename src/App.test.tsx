import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { useCameraStore } from './scene/camera/cameraStore'
import { simulationStore } from './simulation'

vi.mock('./scene/BattlefieldScene', () => ({ BattlefieldScene: () => null }))

beforeEach(() => {
  simulationStore.getState().restart()
  simulationStore.getState().setSpeed(1)
  useCameraStore.getState().requestPreset('overview')
})
afterEach(cleanup)

describe('Stage 5B spectator interface', () => {
  it('retains all 20 existing cameras and adds the two LCAC presets', () => {
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
      'Pantsir 02',
      'LCAC 01',
      'LCAC 02',
    ])
    fireEvent.click(cameras.getByRole('button', { name: 'Air reinforcement' }))
    expect(cameras.getByRole('button', { name: 'Air reinforcement' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Cinderfront / Stage 5B')).toBeInTheDocument()
    expect(screen.getByText('Su-30MKK pair')).toBeInTheDocument()
    expect(screen.getByLabelText('Support convoy status')).toHaveTextContent('routine transit')
    fireEvent.click(cameras.getByRole('button', { name: 'Support convoy' }))
    expect(cameras.getByRole('button', { name: 'Support convoy' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(cameras.getByRole('button', { name: 'Pantsir 02' }))
    expect(cameras.getByRole('button', { name: 'Pantsir 02' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Pantsir 01')).toBeInTheDocument()
    expect(screen.getByLabelText('Secondary Pantsir status')).toHaveTextContent('reserve')
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
      [141.9, 'lcac_01_shallow_water'],
      [142, 'su30_02_cover_withdrawal'],
      [170, 'aircraft_egress'],
      [75, 'rescue_convoy_redirect'],
      [108, 'rescue_convoy_chokepoint'],
      [125, 'rescue_route_secondary_hit'],
      [174, 'rescue_convoy_abandon_approach'],
      [176, 'rescue_convoy_abandon_approach'],
      [124.9, 'pantsir_02_destroyed'],
      [111.9, 'lcac_departure'],
      [112, 'pantsir_02_relocate'],
      [120.9, 'ammunition_cookoff_begin'],
      [121, 'pantsir_02_destroyed'],
      [121.1, 'pantsir_02_destroyed'],
    ] as const) {
      fireEvent.input(slider, { target: { value: String(time) } })
      expect(simulationStore.getState().timeSeconds).toBe(time)
      expect(timeline).toHaveTextContent(`Event ${event}`)
      if (event === 'pantsir_02_relocate') expect(timeline).toHaveTextContent('Pantsir 02 begins local relocation')
      if (event === 'pantsir_02_destroyed') {
        expect(timeline).toHaveTextContent('Pantsir 02 destroyed by F-35B 01')
        expect(screen.getByLabelText('Secondary Pantsir status')).toHaveTextContent('destroyed')
      }
    }
    fireEvent.click(screen.getByRole('button', { name: 'Restart simulation' }))
    expect(simulationStore.getState().timeSeconds).toBe(0)
    expect(timeline).toHaveTextContent('Event scenario_begin')
    expect(screen.getByRole('button', { name: 'Play simulation' })).toBeInTheDocument()
    expect(screen.getByLabelText('Secondary Pantsir status')).toHaveTextContent('reserve')
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
  it('reports both craft phases, all embarked payloads, and five landing events without unloading', () => {
    render(<App />)
    const slider = screen.getByRole('slider', { name: 'Seek simulation time' }),
      status = screen.getByLabelText('Landing craft status'),
      timeline = screen.getByRole('region', { name: 'Simulation timeline' })
    for (const [time, event] of [
      [110, 'lcac_departure'],
      [140, 'lcac_01_shallow_water'],
      [148, 'lcac_02_shallow_water'],
      [155, 'lcac_01_beach'],
      [162, 'lcac_02_beach'],
    ] as const) {
      fireEvent.input(slider, { target: { value: String(time) } })
      expect(timeline).toHaveTextContent(`Event ${event}`)
      expect(status).toHaveTextContent('8 operational LAV-25s · all embarked')
    }
    fireEvent.input(slider, { target: { value: '176' } })
    expect(status).toHaveTextContent('beached ready')
    expect(status).toHaveTextContent('all embarked')
    const cameras = within(screen.getByRole('navigation', { name: 'Camera presets' }))
    for (const name of ['LCAC 01', 'LCAC 02']) {
      fireEvent.click(cameras.getByRole('button', { name }))
      expect(cameras.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    }
    fireEvent.click(screen.getByRole('button', { name: 'Restart simulation' }))
    expect(status).toHaveTextContent('holding')
    expect(status).toHaveTextContent('all embarked')
  })
})
