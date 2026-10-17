/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { LANDING_SITES } from '../scene/world/landing/landingSiteData'
import { ROAD_DEFINITIONS } from '../scene/world/stage2/stage2Data'
import baseline from './fixtures/stage5bPreservation.json'
import { STAGE5C_EVENTS, SIMULATION_EVENTS, getReachedSimulationEvents } from './timeline'

const source = readFileSync('assets/scenario/scenario-spec.yaml', 'utf8')
describe('Stage 5C source and direct road contract', () => {
  it('adapts all four final source records exactly once, in all 51 source ID/time positions', () => {
    const events = [...source.matchAll(/  - at_s: (\d+)\n    local_time: '([^']+)'\n    id: '([^']+)'([\s\S]*?)(?=\n  - at_s:|\naftermath:)/g)]
    expect(events).toHaveLength(51)
    expect(SIMULATION_EVENTS.map((e) => [e.id, e.atSeconds, e.localTime])).toEqual(events.map((e) => [e[3], Number(e[1]), e[2]]))
    expect(new Set(SIMULATION_EVENTS.map((e) => e.id)).size).toBe(51)
    expect(STAGE5C_EVENTS.map((e) => [e.id, e.atSeconds])).toEqual([
      ['lav_group_01_disembark', 160],
      ['lav_group_02_disembark', 166],
      ['lav_inland_spread', 176],
      ['scripted_phase_complete', 180],
    ])
    for (const e of STAGE5C_EVENTS) {
      const block = events.find((m) => m[3] === e.id)![0]
      expect(block).toContain(`event: '${e.event}'`)
      expect(block).toContain(`track: '${e.track}'`)
      if ('groupId' in e) {
        expect(block).toContain(`entity: '${e.groupId}'`)
        expect(block).toContain(`path_id: '${e.pathId}'`)
      }
      if ('entities' in e) {
        for (const id of e.entities) expect(block).toContain(`- '${id}'`)
        for (const id of e.pathIds) expect(block).toContain(`- '${id}'`)
      }
      expect(getReachedSimulationEvents(e.atSeconds - 0.001)).not.toContainEqual(e)
      expect(getReachedSimulationEvents(e.atSeconds).at(-1)).toEqual(e)
    }
    expect(STAGE5C_EVENTS[3]).not.toHaveProperty('actorId')
    expect(source).toContain('aftermath_continues_world_motion: true')
    expect(source).toContain("aftermath_mode: 'indefinite'")
  })
  it('retains optional apron-to-beach connectors and authors direct two-lane joins to the correct roads', () => {
    for (const [i, side] of ['west', 'east'].entries()) {
      const block = source.match(new RegExp("    - id: 'path_lav_inland_" + side + "'[\\s\\S]+?(?=\\n    - id:|\\neffect_profiles:)"))![0]
      const previous = baseline.lavPaths[side as 'west' | 'east']
      const connectors = (v: string) =>
        [
          ...v
            .split('      connector_waypoints_xz_m:')[1]!
            .split('\n      scripted_traversal:')[0]!
            .matchAll(/- \[(-?[\d.]+), (-?[\d.]+)\]/g),
        ].map((m) => [Number(m[1]), Number(m[2])])
      expect(connectors(block)).toEqual(connectors(previous))
      expect(block).toContain("connector_direction: 'apron_to_beach'")
      expect(block).toContain("connector_purpose: 'optional_service_access; not the scripted unloading traversal'")
      expect(block).toContain("scripted_traversal: 'direct_ramp_lanes_to_initial_road_segment'")
      expect(block).toContain('carrier_local_lane_centers_x_m: [-1.8, 1.8]')
      const site = LANDING_SITES[i]!,
        road = ROAD_DEFINITIONS.find((r) => r.id === site.roadId)!
      expect(road.widthM).toBe(10)
      expect(road.points.slice(0, 2)).toEqual([site.beach, site.roadNext])
      expect(block).toContain(`road_id: '${road.id}'`)
      expect(block).toContain(`road_origin_xz_m: [${site.beach.join(', ')}]`)
      expect(block).toContain(`road_next_xz_m: [${site.roadNext.join(', ')}]`)
    }
  })
})
