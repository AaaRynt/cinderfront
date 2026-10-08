import type { SimulationEvent, SimulationWorldState } from '../types'

/** Only the two additive Stage 5A events may be omitted from old-world checks. */
export const STAGE5A_ADDED_EVENT_IDS = ['pantsir_02_relocate', 'pantsir_02_destroyed'] as const

export function isStage5AAddedEvent(event: SimulationEvent) {
  return STAGE5A_ADDED_EVENT_IDS.some((id) => id === event.id)
}

/** Preserve every completed field, including Stage 4B.2C, and every old weapon. */
export function projectCompletedStage4cWorld(world: SimulationWorldState) {
  const { secondaryPantsir: _secondaryPantsir, ...completed } = world
  return {
    ...completed,
    reachedEvents: completed.reachedEvents.filter((event) => !isStage5AAddedEvent(event)),
  }
}
