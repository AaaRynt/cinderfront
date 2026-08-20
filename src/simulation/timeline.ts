import type { SimulationEvent, Stage1Event, Stage1EventId, Stage3Event, Stage3EventId } from './types'

import { clampSimulationTime, clampStage1Time } from './time'

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

export const STAGE3_EVENTS = [
  {
    id: 'f35_02_harbor_ingress',
    atSeconds: 52,
    localTime: '05:27:52',
    event: 'high_speed_harbor_attack_pass',
    actorId: 'attacker_f35_02',
    targetId: 'region_a_harbor_district',
  },
  {
    id: 'molniya_departure',
    atSeconds: 62,
    localTime: '05:28:02',
    event: 'emergency_departure_from_berth',
    actorId: 'defender_molniya_01',
    pathId: 'path_molniya_harbor_exit',
    resultingState: 'withdrawing_through_harbor_channel',
  },
  {
    id: 'talwar_first_hit',
    atSeconds: 72,
    localTime: '05:28:12',
    event: 'heavy_ship_hit',
    actorId: 'attacker_f35_02',
    targetId: 'defender_talwar_01',
    effectProfile: 'ship_hit_heavy',
  },
  {
    id: 'industrial_pipeline_hit',
    atSeconds: 78,
    localTime: '05:28:18',
    event: 'pipeline_and_transfer_area_ignition',
    actorId: 'attacker_f35_02',
    targetId: 'pipeline_harbor_fuel_trunk',
  },
  {
    id: 'fuel_tank_initial_hit',
    atSeconds: 86,
    localTime: '05:28:26',
    event: 'major_fuel_tank_hit',
    actorId: 'attacker_f35_02',
    targetId: 'fuel_tank_05',
  },
  {
    id: 'fuel_storage_cascade',
    atSeconds: 92,
    localTime: '05:28:32',
    event: 'hero_fuel_storage_explosion',
    targetId: 'fuel_bund_cell_central',
    effectProfile: 'fuel_storage_cascade',
  },
  {
    id: 'fuel_shock_environment_response',
    atSeconds: 94,
    localTime: '05:28:34',
    event: 'nearby_environment_bends_rebounds_and_ignites',
  },
  {
    id: 'industrial_blackout',
    atSeconds: 98,
    localTime: '05:28:38',
    event: 'partial_power_failure',
    targetId: 'powerline_industrial_feeder',
  },
  {
    id: 'talwar_fuel_leak',
    atSeconds: 100,
    localTime: '05:28:40',
    event: 'fuel_leak_reaches_harbor_water',
    actorId: 'defender_talwar_01',
    targetId: 'facility_harbor_basin',
    effectProfile: 'harbor_fuel_fire',
  },
  {
    id: 'talwar_second_hit',
    atSeconds: 115,
    localTime: '05:28:55',
    event: 'second_heavy_hit',
    actorId: 'attacker_f35_02',
    targetId: 'defender_talwar_01',
    effectProfile: 'ship_hit_heavy',
  },
  {
    id: 'ammunition_cookoff_begin',
    atSeconds: 116,
    localTime: '05:28:56',
    event: 'ammunition_storage_secondary_detonations_begin',
    targetId: 'ammunition_compound',
  },
  {
    id: 'molniya_fragment_damage',
    atSeconds: 128,
    localTime: '05:29:08',
    event: 'damaged_during_withdrawal_but_continues_moving',
    actorId: 'defender_molniya_01',
    pathId: 'path_molniya_harbor_exit',
    resultingState: 'damaged_mobile_with_smoke',
  },
  {
    id: 'ammunition_storage_primary_detonation',
    atSeconds: 132,
    localTime: '05:29:12',
    event: 'hero_ammunition_storage_detonation',
    targetId: 'ammo_bunker_04',
    effectProfile: 'ammunition_storage_cookoff',
  },
  {
    id: 'talwar_severe_list',
    atSeconds: 165,
    localTime: '05:29:45',
    event: 'progress_to_severe_list_and_partial_flooding',
    actorId: 'defender_talwar_01',
  },
  {
    id: 'molniya_open_water',
    atSeconds: 172,
    localTime: '05:29:52',
    event: 'reach_open_water_while_damaged_and_smoking',
    actorId: 'defender_molniya_01',
    pathId: 'path_molniya_harbor_exit',
    resultingState: 'escaped_into_open_water',
  },
] as const satisfies readonly Stage3Event[]

export const SIMULATION_EVENTS = [...STAGE1_EVENTS, ...STAGE3_EVENTS] as const satisfies readonly SimulationEvent[]

export function hasReachedEvent(timeSeconds: number, atSeconds: number): boolean {
  return clampSimulationTime(timeSeconds) + Number.EPSILON >= atSeconds
}

export function getReachedEvents(timeSeconds: number): readonly Stage1Event[] {
  const time = clampStage1Time(timeSeconds)
  return STAGE1_EVENTS.filter((event) => hasReachedEvent(time, event.atSeconds))
}

export function getReachedStage3Events(timeSeconds: number): readonly Stage3Event[] {
  const time = clampSimulationTime(timeSeconds)
  return STAGE3_EVENTS.filter((event) => hasReachedEvent(time, event.atSeconds))
}

export function getReachedSimulationEvents(timeSeconds: number): readonly SimulationEvent[] {
  const time = clampSimulationTime(timeSeconds)
  return SIMULATION_EVENTS.filter((event) => hasReachedEvent(time, event.atSeconds))
}

export function getStage1Event(id: Stage1EventId): Stage1Event {
  const event = STAGE1_EVENTS.find((candidate) => candidate.id === id)
  if (!event) throw new Error(`Unknown Stage 1 event: ${id}`)
  return event
}

export function getStage3Event(id: Stage3EventId): Stage3Event {
  const event = STAGE3_EVENTS.find((candidate) => candidate.id === id)
  if (!event) throw new Error(`Unknown Stage 3 event: ${id}`)
  return event
}
