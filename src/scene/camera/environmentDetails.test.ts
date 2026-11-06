import { describe, expect, it } from 'vitest'

import { simulationStore } from '@/simulation'

import { cameraFrame } from './cameraFraming'
import { useCameraStore } from './cameraStore'
import { ENVIRONMENT_DETAILS, type EnvironmentDetailPreset } from './environmentDetails'

const choices = Object.keys(ENVIRONMENT_DETAILS) as EnvironmentDetailPreset[]

describe('environment detail cameras', () => {
  it.each(choices)('frames %s at a fixed site through seeks and short viewports', (choice) => {
    const { position, target } = ENVIRONMENT_DETAILS[choice]
    const frame = cameraFrame(choice, 0)
    expect(frame.position.toArray()).toEqual(position)
    expect(frame.target.toArray()).toEqual(target)
    for (const time of [58, 92.95, 158, 180, 7200, 0]) expect(cameraFrame(choice, time)).toEqual(frame)
    const short = cameraFrame(choice, 0, 1280 / 430, 430)
    expect(short.target.toArray()).toEqual(target)
    expect(short.position.distanceTo(short.target)).toBeGreaterThan(frame.position.distanceTo(frame.target))
    expect(short.fov).toBeLessThan(frame.fov)
  })

  it('keeps the simulation state and retains the selected view on restart', () => {
    try {
      simulationStore.getState().seek(92.95)
      for (const playing of [false, true]) {
        const state = simulationStore.getState()
        if (playing) state.play()
        else state.pause()
        const before = simulationStore.getState()
        for (const choice of choices) {
          useCameraStore.getState().requestPreset(choice)
          expect(useCameraStore.getState().preset).toBe(choice)
          expect(simulationStore.getState()).toBe(before)
        }
      }
      simulationStore.getState().restart()
      expect(useCameraStore.getState().preset).toBe('fuel-shock')
      expect(simulationStore.getState()).toMatchObject({ timeSeconds: 0, isPlaying: false })
    } finally {
      simulationStore.getState().restart()
      useCameraStore.getState().requestPreset('overview')
    }
  })
})
