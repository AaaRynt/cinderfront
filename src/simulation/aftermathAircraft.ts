import type { AircraftStates, F35AircraftId, SimulationWorldState } from './types'

import { MAP_BOUNDS } from '../scene/world/worldData'
import { deriveSimulationWorldState } from './derive'

const IDS: readonly F35AircraftId[] = ['attacker_f35_01', 'attacker_f35_02']
let anchors: { end: SimulationWorldState; before: SimulationWorldState } | undefined
/** Existing egress continues to a finite off-map anchor. No sortie restarts. */
export function deriveRuntimeAircraft(time: number) {
  const runtime = Number.isFinite(time) ? Math.max(0, time) : 0
  anchors ??= { end: deriveSimulationWorldState(180), before: deriveSimulationWorldState(179.99) }
  const aircraft = { ...(runtime <= 180 ? deriveSimulationWorldState(runtime).aircraft : anchors.end.aircraft) } as { -readonly [K in keyof AircraftStates]: AircraftStates[K] }
  const presentation = {} as Record<F35AircraftId, { visible: boolean; departedAtSeconds: number; terminalSeconds: number; terminalZ: number }>
  for (const id of IDS) {
    const anchor = anchors.end.aircraft[id],
      previous = anchors.before.aircraft[id]
    const velocity = { x: (anchor.pose.position.x - previous.pose.position.x) / 0.01, y: (anchor.pose.position.y - previous.pose.position.y) / 0.01, z: (anchor.pose.position.z - previous.pose.position.z) / 0.01 }
    const boundary = Math.max(0, (MAP_BOUNDS.zMin - anchor.pose.position.z) / velocity.z)
    // One existing aircraft is already beyond the map at 180. Continue both
    // by at least 250 m rather than clamping that actor to its handoff pose.
    const terminalZ = Math.min(MAP_BOUNDS.zMin - 200, anchor.pose.position.z - 250)
    const stop = (terminalZ - anchor.pose.position.z) / velocity.z
    // Render departure occurs only after the complete model has left the map.
    const departedAtSeconds = Math.max(180.4, 180 + boundary + 0.2)
    const elapsed = Math.min(Math.max(0, runtime - 180), stop)
    if (runtime > 180) aircraft[id] = { ...anchor, pose: { ...anchor.pose, position: { x: anchor.pose.position.x + velocity.x * elapsed, y: anchor.pose.position.y + velocity.y * elapsed, z: anchor.pose.position.z + velocity.z * elapsed } }, speedMetersPerSecond: runtime >= 180 + stop ? 0 : anchor.speedMetersPerSecond }
    presentation[id] = { visible: runtime < departedAtSeconds, departedAtSeconds, terminalSeconds: 180 + stop, terminalZ }
  }
  return { aircraft, presentation }
}
