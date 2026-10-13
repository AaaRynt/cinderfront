import type { Stage5BEvent } from './landingCraftTypes'
import type { Stage5AEvent } from './secondaryPantsirTypes'
import type { Stage4B2CEvent } from './supportConvoyTypes'
import type { SimulationEvent, Stage1Event, Stage1EventId, Stage3Event, Stage3EventId, Stage4BEvent, Stage4BEventId, Stage4B2BEvent } from './types'

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

export const STAGE4B_EVENTS = [
  {
    id: 'btr_01_disabled',
    atSeconds: 133,
    localTime: '05:29:13',
    event: 'one_vehicle_disabled_by_secondary_blast_and_debris',
    groupId: 'defender_btr_group_01',
    actorId: 'defender_btr_01',
    targetId: 'defender_btr_group_01',
    effectProfile: 'vehicle_kill_medium',
  },
  {
    id: 'btr_survivors_fallback',
    atSeconds: 136,
    localTime: '05:29:16',
    event: 'three_surviving_vehicles_fall_back_along_branch_route',
    groupId: 'defender_btr_group_01',
    pathId: 'path_defender_convoy_fallback',
    resultingState: 'three_mobile_one_disabled',
  },
  {
    id: 'defender_armored_reinforcement_move',
    atSeconds: 150,
    localTime: '05:29:30',
    event: 'move_toward_inland_beach_approach',
    groupId: 'defender_t72_group_01',
    pathId: 'path_defender_armored_reinforcement',
  },
  {
    id: 't72_lead_destroyed',
    atSeconds: 158,
    localTime: '05:29:38',
    event: 'lead_vehicle_destroyed_by_supporting_air_strike',
    groupId: 'defender_t72_group_01',
    sourceActorId: 'attacker_f35_01',
    targetId: 'defender_t72_01',
    effectProfile: 'vehicle_kill_medium',
  },
  {
    id: 't72_survivors_withdraw',
    atSeconds: 163,
    localTime: '05:29:43',
    event: 'two_surviving_vehicles_reverse_and_withdraw_behind_terrain',
    groupId: 'defender_t72_group_01',
    pathId: 'path_defender_armored_fallback',
    resultingState: 'one_destroyed_two_withdrawing',
  },
] as const satisfies readonly Stage4BEvent[]

export const STAGE4B2B_EVENTS = [
  {
    id: 'su30_reinforcement_entry',
    atSeconds: 104,
    localTime: '05:28:44',
    event: 'enter_map_from_defending_airspace',
    entities: ['defender_su30_01', 'defender_su30_02'],
    pathId: 'path_defender_air_entry',
  },
  {
    id: 'su30_01_damaged',
    atSeconds: 137,
    localTime: '05:29:17',
    event: 'take_damage_and_begin_withdrawal',
    actorId: 'defender_su30_01',
    pathId: 'path_air_egress_southwest',
    resultingState: 'damaged_and_egressing',
  },
  {
    id: 'su30_02_cover_withdrawal',
    atSeconds: 142,
    localTime: '05:29:22',
    event: 'brief_covering_pass_for_defender_su30_01',
    actorId: 'defender_su30_02',
    targetId: 'defender_su30_01',
    pathId: 'path_air_egress_southwest',
  },
  {
    id: 'aircraft_egress',
    atSeconds: 170,
    localTime: '05:29:50',
    event: 'main_air_combat_activity_exits_scene',
    entities: ['attacker_f35_01', 'attacker_f35_02', 'defender_su30_01', 'defender_su30_02'],
    pathId: 'path_air_egress_southwest',
  },
] as const satisfies readonly Stage4B2BEvent[]

export const STAGE4B2C_EVENTS = [
  { id: 'rescue_convoy_redirect', atSeconds: 75, localTime: '05:28:15', event: 'redirect_toward_industrial_emergency', groupId: 'defender_support_convoy_01', pathId: 'path_support_convoy_industrial' },
  { id: 'rescue_convoy_chokepoint', atSeconds: 108, localTime: '05:28:48', event: 'staggered_visibility_hesitation', groupId: 'defender_support_convoy_01', pathId: 'path_support_convoy_industrial' },
  { id: 'rescue_route_secondary_hit', atSeconds: 125, localTime: '05:29:05', event: 'unattributed_secondary_explosion_blocks_bridge_approach', groupId: 'defender_support_convoy_01', pathId: 'path_support_convoy_industrial', targetFeatureId: 'dry_wash_bridge' },
  { id: 'rescue_convoy_abandon_approach', atSeconds: 174, localTime: '05:29:54', event: 'abandon_approach_and_begin_partial_withdrawal', groupId: 'defender_support_convoy_01', pathId: 'path_support_convoy_industrial' },
] as const satisfies readonly Stage4B2CEvent[]

// Explicit scoped arrays: T+176 is an endpoint, not admission of the later
// amphibious/LAV event from the reference scenario.
export const STAGE5A_EVENTS = [
  { id: 'pantsir_02_relocate', atSeconds: 112, localTime: '05:28:52', event: 'relocate_to_secondary_firing_position', actorId: 'defender_pantsir_02', pathId: 'path_pantsir_relocation' },
  { id: 'pantsir_02_destroyed', atSeconds: 121, localTime: '05:29:01', event: 'destroy_after_secondary_engagement', actorId: 'defender_pantsir_02', sourceAircraftId: 'attacker_f35_01', effectProfile: 'vehicle_kill_medium' },
] as const satisfies readonly Stage5AEvent[]

export const STAGE5B_EVENTS = [
  { id: 'lcac_departure', atSeconds: 110, localTime: '05:28:50', event: 'depart_offshore_staging_area', entities: ['attacker_lcac_01', 'attacker_lcac_02'], pathIds: ['path_lcac_beach_approach_west', 'path_lcac_beach_approach_east'] },
  { id: 'lcac_01_shallow_water', atSeconds: 140, localTime: '05:29:20', event: 'enter_final_nearshore_approach', actorId: 'attacker_lcac_01', pathId: 'path_lcac_beach_approach_west' },
  { id: 'lcac_02_shallow_water', atSeconds: 148, localTime: '05:29:28', event: 'enter_final_nearshore_approach', actorId: 'attacker_lcac_02', pathId: 'path_lcac_beach_approach_east' },
  { id: 'lcac_01_beach', atSeconds: 155, localTime: '05:29:35', event: 'beach_and_lower_ramp', actorId: 'attacker_lcac_01', pathId: 'path_lcac_beach_approach_west', resultingState: 'beached_ramp_lowered' },
  { id: 'lcac_02_beach', atSeconds: 162, localTime: '05:29:42', event: 'beach_and_lower_ramp', actorId: 'attacker_lcac_02', pathId: 'path_lcac_beach_approach_east', resultingState: 'beached_ramp_lowered' },
] as const satisfies readonly Stage5BEvent[]

export const SIMULATION_EVENTS = Object.freeze([...STAGE1_EVENTS, ...STAGE3_EVENTS, ...STAGE4B_EVENTS, ...STAGE4B2B_EVENTS, ...STAGE4B2C_EVENTS, ...STAGE5A_EVENTS, ...STAGE5B_EVENTS].toSorted((left, right) => left.atSeconds - right.atSeconds)) satisfies readonly SimulationEvent[]

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

export function getReachedStage4BEvents(timeSeconds: number): readonly Stage4BEvent[] {
  const time = clampSimulationTime(timeSeconds)
  return STAGE4B_EVENTS.filter((event) => hasReachedEvent(time, event.atSeconds))
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

export function getStage4BEvent(id: Stage4BEventId): Stage4BEvent {
  const event = STAGE4B_EVENTS.find((candidate) => candidate.id === id)
  if (!event) throw new Error(`Unknown Stage 4B event: ${id}`)
  return event
}
