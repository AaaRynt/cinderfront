import type { SimulationEvent, SimulationWorldState } from '../types'

export const STAGE5B_ADDED_EVENT_IDS = ['lcac_departure', 'lcac_01_shallow_water', 'lcac_02_shallow_water', 'lcac_01_beach', 'lcac_02_beach'] as const
export function isStage5BAddedEvent(event: SimulationEvent) {
  return STAGE5B_ADDED_EVENT_IDS.some((id) => id === event.id)
}
/** Retain every prior actor, including secondary Pantsir and support convoy. */
export function projectCompletedStage5aWorld(world: SimulationWorldState) {
  const { landing: _landing, ...completed } = world
  return { ...completed, reachedEvents: completed.reachedEvents.filter((event) => !isStage5BAddedEvent(event)) }
}
