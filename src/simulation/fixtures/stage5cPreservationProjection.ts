import type { EmbarkedLavState } from '../landingCraftTypes'
import type { SimulationEvent } from '../types'

export const STAGE5C_ADDED_EVENT_IDS = ['lav_group_01_disembark', 'lav_group_02_disembark', 'lav_inland_spread', 'scripted_phase_complete'] as const
export function isStage5CAddedEvent(event: SimulationEvent) {
  return STAGE5C_ADDED_EVENT_IDS.some((id) => id === event.id)
}
/** Every old payload field, compared only before that payload's departure.
 * Post-departure poses are deliberately never reconstructed or forged here. */
export function projectStage5bPayload(payload: EmbarkedLavState) {
  const { id, groupId, carrierId, factionId, vehicleType, activity, condition, outcome, localPose, pose, wheelTravelMeters, wheelRotationRadians, dustIntensity } = payload
  return { id, groupId, carrierId, factionId, vehicleType, activity, condition, outcome, localPose, pose, wheelTravelMeters, wheelRotationRadians, dustIntensity }
}
