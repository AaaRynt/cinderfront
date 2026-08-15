import type { Stage1Event, Stage1EventId } from './types'

import { clampSimulationTime } from './time'

export const STAGE1_EVENTS = [
  {
    id: 'scenario_begin',
    atSeconds: 0,
    localTime: '05:27:00',
    event: 'begin_scripted_phase',
  },
  {
    id: 'wasp_offshore_underway',
    atSeconds: 1,
    localTime: '05:27:01',
    event: 'maintain_offshore_patrol_course',
    actorId: 'attacker_wasp_01',
  },
  {
    id: 'f35_01_launch',
    atSeconds: 5,
    localTime: '05:27:05',
    event: 'launch_from_wasp',
    actorId: 'attacker_f35_01',
  },
  {
    id: 'f35_02_launch',
    atSeconds: 13,
    localTime: '05:27:13',
    event: 'launch_from_wasp',
    actorId: 'attacker_f35_02',
  },
  {
    id: 'radar_alert',
    atSeconds: 14,
    localTime: '05:27:14',
    event: 'search_radar_changes_tracking_behavior',
  },
  {
    id: 'air_defense_tracking',
    atSeconds: 20,
    localTime: '05:27:20',
    event: 'tracking_radar_and_pantsir_acquire_incoming_aircraft',
  },
  {
    id: 'pantsir_01_engage',
    atSeconds: 24,
    localTime: '05:27:24',
    event: 'engage_attacker_f35_01',
    actorId: 'defender_pantsir_01',
    targetId: 'attacker_f35_01',
  },
  {
    id: 'fixed_air_defense_engage',
    atSeconds: 29,
    localTime: '05:27:29',
    event: 'fixed_air_defense_guns_fire',
  },
  {
    id: 'radar_hill_near_hit',
    atSeconds: 36,
    localTime: '05:27:36',
    event: 'first_strike_impacts_radar_hill',
    actorId: 'attacker_f35_01',
    targetId: 'sam_battery_area',
    effectProfile: 'radar_position_hit',
  },
  {
    id: 'pantsir_01_destroyed',
    atSeconds: 42,
    localTime: '05:27:42',
    event: 'destroy',
    actorId: 'attacker_f35_01',
    targetId: 'defender_pantsir_01',
    effectProfile: 'vehicle_kill_medium',
  },
  {
    id: 'primary_radar_disabled',
    atSeconds: 45,
    localTime: '05:27:45',
    event: 'primary_search_radar_destroyed',
    actorId: 'attacker_f35_01',
    targetId: 'radar_search_site',
    effectProfile: 'radar_position_hit',
  },
  {
    id: 'harbor_first_hit',
    atSeconds: 48,
    localTime: '05:27:48',
    event: 'warehouse_or_pier_hit',
    actorId: 'attacker_f35_02',
    targetId: 'warehouse_harbor_01',
  },
] as const satisfies readonly Stage1Event[]

export function hasReachedEvent(timeSeconds: number, atSeconds: number): boolean {
  return clampSimulationTime(timeSeconds) + Number.EPSILON >= atSeconds
}

export function getReachedEvents(timeSeconds: number): readonly Stage1Event[] {
  const time = clampSimulationTime(timeSeconds)
  return STAGE1_EVENTS.filter((event) => hasReachedEvent(time, event.atSeconds))
}

export function getStage1Event(id: Stage1EventId): Stage1Event {
  const event = STAGE1_EVENTS.find((candidate) => candidate.id === id)
  if (!event) throw new Error(`Unknown Stage 1 event: ${id}`)
  return event
}
