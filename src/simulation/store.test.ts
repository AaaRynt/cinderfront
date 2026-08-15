import { describe, expect, it } from 'vitest'

import { deriveStage1WorldState } from './derive'
import { createSimulationStore, getSimulationWorldState } from './store'

describe('simulation store', () => {
  it('plays, pauses, changes speed, and clamps at the Stage 1 endpoint', () => {
    const store = createSimulationStore()
    const actions = store.getState()

    actions.play()
    actions.tick(2)
    expect(store.getState().timeSeconds).toBe(2)

    store.getState().setSpeed(2)
    store.getState().tick(3)
    expect(store.getState().timeSeconds).toBe(8)

    store.getState().pause()
    store.getState().tick(20)
    expect(store.getState().timeSeconds).toBe(8)

    store.getState().play()
    store.getState().tick(100)
    expect(store.getState().timeSeconds).toBe(48)
    expect(store.getState().isPlaying).toBe(false)
  })

  it('seeks directly and restarts with no accumulated event or effect state', () => {
    const store = createSimulationStore()

    store.getState().seek(43.2)
    const firstSeek = getSimulationWorldState(store)
    const firstResetVersion = store.getState().transientResetVersion
    expect(firstSeek).toEqual(deriveStage1WorldState(43.2))
    expect(firstSeek.reachedEvents).toHaveLength(10)

    store.getState().seek(43.2)
    const repeatedSeek = getSimulationWorldState(store)
    expect(repeatedSeek).toEqual(firstSeek)
    expect(repeatedSeek.reachedEvents).toHaveLength(10)
    expect(store.getState().transientResetVersion).toBe(firstResetVersion + 1)

    store.getState().restart()
    const restarted = getSimulationWorldState(store)
    expect(store.getState().timeSeconds).toBe(0)
    expect(store.getState().isPlaying).toBe(false)
    expect(restarted.reachedEvents.map((event) => event.id)).toEqual(['scenario_begin'])
    expect(restarted.persistent.pantsirWreck).toBe(false)
    expect(restarted.persistent.primaryRadarDestroyed).toBe(false)
    expect(restarted.aircraft.attacker_f35_01.phase).toBe('launch-ready')
    expect(restarted.aircraft.attacker_f35_02.phase).toBe('launch-ready')
  })

  it('preserves playback state on an in-range seek and pauses at the endpoint', () => {
    const store = createSimulationStore({ isPlaying: true, speed: 0.5 })
    store.getState().seek(24)
    expect(store.getState().isPlaying).toBe(true)
    expect(store.getState().speed).toBe(0.5)

    store.getState().seek(48)
    expect(store.getState().isPlaying).toBe(false)
  })
})
