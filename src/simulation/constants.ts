import type { FactionId, RawScenarioFaction, SimulationSpeed } from './types'

export const STAGE1_DURATION_SECONDS = 48
export const STAGE1_FIXED_SEED = 52730
export const STAGE1_START_LOCAL_SECONDS = 5 * 60 * 60 + 27 * 60
export const STAGE1_TIMELINE_RESOLUTION_SECONDS = 0.1

export const SIMULATION_SPEEDS = [0.5, 1, 2] as const satisfies readonly SimulationSpeed[]

export const FACTION_ADAPTER = {
  attacker: 'landings_attacker',
  defender: 'island_defender',
} as const satisfies Readonly<Record<RawScenarioFaction, FactionId>>

export function adaptScenarioFaction(faction: RawScenarioFaction): FactionId {
  return FACTION_ADAPTER[faction]
}

export function isSimulationSpeed(value: number): value is SimulationSpeed {
  return value === 0.5 || value === 1 || value === 2
}
