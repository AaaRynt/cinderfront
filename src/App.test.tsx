import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { useCameraStore } from './scene/camera/cameraStore'
import { deriveRuntimeWorldState, simulationStore } from './simulation'

vi.mock('./scene/BattlefieldScene', () => ({ BattlefieldScene: () => null }))

beforeAll(() => {
  deriveRuntimeWorldState(0)
})
beforeAll(() => {
  deriveRuntimeWorldState(188)
})
beforeAll(() => {
  deriveRuntimeWorldState(210)
})
beforeAll(() => {
  deriveRuntimeWorldState(240)
})
beforeEach(() => {
  simulationStore.getState().restart()
  simulationStore.getState().setSpeed(1)
  useCameraStore.getState().requestPreset('overview')
})
afterEach(cleanup)

function renderWithStatus() {
  render(<App />)
  fireEvent.click(screen.getByText('Operational details'))
}

describe('Stage 6C spectator interface', () => {
  it('starts compact with all statuses keyboard-accessible and without truncation', () => {
    render(<App />)
    const details = screen.getByText('Operational details').closest('details')!
    expect(details.open).toBe(false)
    expect(screen.getByLabelText('Deployment summary')).toHaveTextContent('8 operational LAV-25s')
    expect(screen.getByLabelText('Spectator camera')).toHaveValue('overview')
    fireEvent.click(screen.getByText('Operational details'))
    expect(details.open).toBe(true)
    const summary = screen.getByText('Operational details')
    expect(fireEvent.keyDown(summary, { code: 'Space', key: ' ' })).toBe(true)
    expect(simulationStore.getState().isPlaying).toBe(false)
    expect(fireEvent.keyDown(screen.getByLabelText('Full operational details'), { code: 'End', key: 'End' })).toBe(true)
    expect(simulationStore.getState().timeSeconds).toBe(0)
    expect(
      within(screen.getByRole('complementary', { name: 'Operational status' }))
        .getByText('Industrial')
        .closest('.status-row')!
        .querySelector('strong'),
    ).not.toHaveClass('truncate')
    const select = screen.getByRole('combobox')
    fireEvent.keyDown(select, { code: 'Space', key: ' ' })
    expect(simulationStore.getState().isPlaying).toBe(false)
    fireEvent.change(select, { target: { value: 'lav-east' } })
    expect(useCameraStore.getState().preset).toBe('lav-east')
    const request = useCameraStore.getState().requestId
    fireEvent.click(screen.getByRole('button', { name: 'Recenter selected camera' }))
    expect(useCameraStore.getState().requestId).toBe(request + 1)
    fireEvent.click(screen.getByText('Operational details'))
    expect(details.open).toBe(false)
  })
  it('retains all 22 existing cameras and adds two LAV group presets', () => {
    renderWithStatus()
    const cameras = within(screen.getByRole('navigation', { name: 'Camera presets' }))
    expect(
      cameras
        .getAllByRole('option')
        .map((option) => option.textContent)
        .sort(),
    ).toEqual(
      [
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
        'LAV west',
        'LAV east',
      ].sort(),
    )
    fireEvent.change(cameras.getByRole('combobox'), { target: { value: 'su30' } })
    expect(cameras.getByRole('combobox')).toHaveValue('su30')
    expect(screen.getByText('Cinderfront / Stage 6C')).toBeInTheDocument()
    expect(screen.getByText('Su-30MKK pair')).toBeInTheDocument()
    expect(screen.getByLabelText('Support convoy status')).toHaveTextContent('routine transit')
    fireEvent.change(cameras.getByRole('combobox'), { target: { value: 'support-convoy' } })
    expect(cameras.getByRole('combobox')).toHaveValue('support-convoy')
    fireEvent.change(cameras.getByRole('combobox'), { target: { value: 'secondary-pantsir' } })
    expect(cameras.getByRole('combobox')).toHaveValue('secondary-pantsir')
    expect(screen.getByText('Pantsir 01')).toBeInTheDocument()
    expect(screen.getByLabelText('Secondary Pantsir status')).toHaveTextContent('reserve')
  })

  it('reconstructs exact event readouts on forward/backward UI seeks and restart', () => {
    renderWithStatus()
    const slider = screen.getByRole('slider', { name: 'Seek simulation time' })
    const timeline = screen.getByRole('region', { name: 'Simulation timeline' })
    expect(slider).toHaveAttribute('max', '180')
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
      [176, 'lav_inland_spread'],
      [180, 'scripted_phase_complete'],
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
    renderWithStatus()
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

  it('seeks observation time directly while pinning the scripted slider and final event', () => {
    renderWithStatus()
    const observation = screen.getByRole('spinbutton', { name: 'Observation time in seconds' })
    const slider = screen.getByRole('slider', { name: 'Seek simulation time' })
    const timeline = screen.getByRole('region', { name: 'Simulation timeline' })
    expect(observation).toHaveAttribute('min', '0')
    expect(observation).toHaveAttribute('step', '0.1')
    for (const time of [180, 188, 240.1, 360, 600, 1800, 3600, 7200]) {
      fireEvent.change(observation, { target: { value: String(time) } })
      expect(simulationStore.getState().timeSeconds).not.toBe(time)
      fireEvent.click(screen.getByRole('button', { name: 'Seek observation time' }))
      expect(simulationStore.getState().timeSeconds).toBe(time)
      expect(simulationStore.getState().isPlaying).toBe(false)
      expect(observation).toHaveValue(time)
      expect(slider).toHaveValue('180')
      expect(slider).toHaveAttribute('max', '180')
      expect(timeline).toHaveTextContent('Event scripted_phase_complete')
      expect(screen.getByText(/AFTERMATH OBSERVATION/)).toBeInTheDocument()
    }
    expect(screen.getByTestId('mission-clock')).toHaveTextContent('T+120:00')
    expect(screen.getByLabelText('Landing craft status')).toHaveTextContent('0 aboard / 0 transferring / 8 ashore')
    fireEvent.input(slider, { target: { value: '179' } })
    expect(simulationStore.getState().timeSeconds).toBe(179)
    expect(observation).toHaveValue(179)
    expect(slider).toHaveValue('179')
    expect(screen.queryByText(/AFTERMATH OBSERVATION/)).not.toBeInTheDocument()
    expect(timeline).toHaveTextContent('Event lav_inland_spread')
  })

  it('preserves playback on direct and scripted seeks and restarts paused at zero', () => {
    renderWithStatus()
    const observation = screen.getByRole('spinbutton', { name: 'Observation time in seconds' })
    const slider = screen.getByRole('slider', { name: 'Seek simulation time' })
    fireEvent.click(screen.getByRole('button', { name: 'Play simulation' }))
    for (const time of [180, 240.1, 7200, 160]) {
      fireEvent.change(observation, { target: { value: String(time) } })
      fireEvent.click(screen.getByRole('button', { name: 'Seek observation time' }))
      expect(simulationStore.getState().timeSeconds).toBe(time)
      expect(simulationStore.getState().isPlaying).toBe(true)
      expect(screen.getByRole('button', { name: 'Pause simulation' })).toBeInTheDocument()
    }
    fireEvent.input(slider, { target: { value: '180' } })
    expect(simulationStore.getState().isPlaying).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Pause simulation' }))
    fireEvent.click(screen.getByRole('button', { name: 'Play simulation' }))
    expect(simulationStore.getState().timeSeconds).toBe(180)
    expect(simulationStore.getState().isPlaying).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Restart simulation' }))
    expect(simulationStore.getState().timeSeconds).toBe(0)
    expect(simulationStore.getState().isPlaying).toBe(false)
    expect(observation).toHaveValue(0)
    expect(slider).toHaveValue('0')
    expect(screen.getByRole('region', { name: 'Simulation timeline' })).toHaveTextContent('Event scenario_begin')
    expect(screen.getByLabelText('Landing craft status')).toHaveTextContent('8 aboard / 0 transferring / 0 ashore')
  })

  it('reports aircraft and naval departures and completed support holds only after the scripted interval', () => {
    renderWithStatus()
    const observation = screen.getByRole('spinbutton', { name: 'Observation time in seconds' }),
      operational = within(screen.getByRole('complementary', { name: 'Operational status' })),
      status = (label: string) => operational.getByText(label).closest('.status-row')!
    const seek = (time: number) => {
      fireEvent.change(observation, { target: { value: String(time) } })
      fireEvent.click(screen.getByRole('button', { name: 'Seek observation time' }))
    }
    seek(180)
    const originalAircraft = status('F-35B 01').textContent,
      originalMolniya = status('Molniya').textContent
    expect(screen.getByLabelText('Support convoy status')).toHaveTextContent('withdrawal in progress')
    seek(188)
    expect(status('F-35B 01')).toHaveTextContent('egress')
    expect(status('F-35B 02')).toHaveTextContent('departed')
    expect(screen.getByLabelText('Support convoy status')).toHaveTextContent('withdrawal in progress')
    seek(7200)
    expect(status('F-35B 01')).toHaveTextContent('departed')
    expect(status('F-35B 02')).toHaveTextContent('departed')
    expect(status('Molniya')).toHaveTextContent('departed · damaged survivor')
    expect(status('Su-30MKK pair')).toHaveTextContent('2 departed · 1 damaged')
    expect(screen.getByLabelText('Support convoy status')).toHaveTextContent('withdrawal complete · holding')
    expect(screen.getByLabelText('Support convoy status')).toHaveTextContent('6 hold / 0 reposition / 0 withdrawing')
    seek(180)
    expect(status('F-35B 01').textContent).toBe(originalAircraft)
    expect(status('Molniya').textContent).toBe(originalMolniya)
    expect(screen.getByLabelText('Support convoy status')).toHaveTextContent('withdrawal in progress')
  })

  it('steps the runtime with keyboard shortcuts across the scripted boundary', () => {
    simulationStore.getState().seek(179.9)
    renderWithStatus()
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    expect(simulationStore.getState().isPlaying).toBe(true)
    fireEvent.keyDown(window, { code: 'ArrowRight', key: 'ArrowRight' })
    expect(simulationStore.getState().timeSeconds).toBe(180.9)
    fireEvent.keyDown(window, { code: 'ArrowRight', key: 'ArrowRight', shiftKey: true })
    expect(simulationStore.getState().timeSeconds).toBe(190.9)
    fireEvent.keyDown(window, { code: 'ArrowLeft', key: 'ArrowLeft' })
    expect(simulationStore.getState().timeSeconds).toBe(189.9)
    fireEvent.keyDown(window, { code: 'End', key: 'End' })
    expect(simulationStore.getState().timeSeconds).toBe(180)
    expect(simulationStore.getState().isPlaying).toBe(true)
    fireEvent.keyDown(window, { code: 'Home', key: 'Home' })
    expect(simulationStore.getState().timeSeconds).toBe(0)
    fireEvent.keyDown(window, { code: 'ArrowLeft', key: 'ArrowLeft', shiftKey: true })
    expect(simulationStore.getState().timeSeconds).toBe(0)
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    expect(simulationStore.getState().isPlaying).toBe(false)
  })

  it('keeps playback shortcuts out of observation editing and cancels the draft with Escape', () => {
    simulationStore.getState().seek(240)
    renderWithStatus()
    const observation = screen.getByRole('spinbutton', { name: 'Observation time in seconds' })
    observation.focus()
    fireEvent.change(observation, { target: { value: '360.1' } })
    for (const [code, key] of [
      ['Space', ' '],
      ['ArrowLeft', 'ArrowLeft'],
      ['ArrowRight', 'ArrowRight'],
      ['Home', 'Home'],
      ['End', 'End'],
    ]) {
      expect(fireEvent.keyDown(observation, { code, key })).toBe(true)
      expect(simulationStore.getState().timeSeconds).toBe(240)
      expect(simulationStore.getState().isPlaying).toBe(false)
    }
    expect(observation).toHaveValue(360.1)
    fireEvent.keyDown(observation, { code: 'Escape', key: 'Escape' })
    expect(observation).toHaveValue(240)
    expect(observation).not.toHaveFocus()
    expect(simulationStore.getState().timeSeconds).toBe(240)
    fireEvent.keyDown(window, { code: 'Space', key: ' ', repeat: true })
    fireEvent.keyDown(window, { code: 'Home', key: 'Home', ctrlKey: true })
    fireEvent.keyDown(window, { code: 'End', key: 'End', altKey: true })
    fireEvent.keyDown(window, { code: 'ArrowRight', key: 'ArrowRight', metaKey: true })
    expect(simulationStore.getState().timeSeconds).toBe(240)
    expect(simulationStore.getState().isPlaying).toBe(false)
  })

  it('reports craft phases and actual deck, transfer and ashore counts', () => {
    renderWithStatus()
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
      expect(status).toHaveTextContent('8 operational LAV-25s')
      if (time < 160) expect(status).toHaveTextContent('8 aboard / 0 transferring / 0 ashore')
    }
    fireEvent.input(slider, { target: { value: '176' } })
    expect(status).toHaveTextContent('beached ready')
    expect(status).toHaveTextContent('3 aboard / 2 transferring / 3 ashore')
    const cameras = within(screen.getByRole('navigation', { name: 'Camera presets' }))
    for (const name of ['LCAC 01', 'LCAC 02']) {
      fireEvent.change(cameras.getByRole('combobox'), { target: { value: name === 'LCAC 01' ? 'lcac-west' : 'lcac-east' } })
      expect(cameras.getByRole('combobox')).toHaveValue(name === 'LCAC 01' ? 'lcac-west' : 'lcac-east')
    }
    fireEvent.click(screen.getByRole('button', { name: 'Restart simulation' }))
    expect(status).toHaveTextContent('holding')
    expect(status).toHaveTextContent('8 aboard / 0 transferring / 0 ashore')
  })
})
