/// <reference types="node" />
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { LANDING_SITES, landingGradePolygon } from '../scene/world/landing/landingSiteData'
import old from './fixtures/stage5bReferencePreservation.json'
import { restoreStage5bNarrative, restoreStage5bScenario } from './fixtures/stage5cReferenceProjection'
import { LCAC_ROUTE_KNOTS } from './landingCraftPaths'
import { STAGE5B_EVENTS } from './timeline'

const read = (path: string) => readFileSync(path, 'utf8')
const hash = (v: string) => createHash('sha256').update(v).digest('hex')
const scenario = read('assets/scenario/scenario-spec.yaml'),
  map = read('assets/map/map-spec.yaml'),
  svg = read('assets/map/map-layout.svg')
const routeBlock = (side: string) => scenario.match(new RegExp("    - id: 'path_lcac_beach_approach_" + side + "'[\\s\\S]+?(?=\\n    - id:)"))![0]

describe('approved Stage 5B authority changes only', () => {
  it('synchronizes both starts, gates, refined knots, grades and five event adapters', () => {
    expect(hash(read('src/simulation/fixtures/stage5bReferencePreservation.json'))).toBe('7cb89edfd57e7131a8372a36503d2ec82ca1588f7a789e74c3051140bcbed516')
    for (const [i, site] of LANDING_SITES.entries()) {
      const side = i === 0 ? 'west' : 'east',
        route = routeBlock(side)
      const knots = Array.from(route.matchAll(/- \[(-?[\d.]+), (-?[\d.]+)\]/g), (m) => [Number(m[1]), Number(m[2])])
      expect(knots).toEqual(LCAC_ROUTE_KNOTS[i])
      const actor = scenario.split(`  - id: 'attacker_lcac_0${i + 1}'`)[1]!.split('\n  - id:')[0]!
      expect(actor).toContain("map_region_id: 'region_e_remote_beachhead'")
      expect(actor).toContain(`map_feature_id: '${site.holdingFeatureId}'`)
      expect(actor).not.toMatch(/Wasp|relative_to_entity_id|formation_slot_id/)
      for (const [id, point] of [
        [site.holdingFeatureId, site.holding],
        [site.gateFeatureId, site.gate],
      ] as const) {
        const feature = map.split(`    - id: ${id}\n`)[1]!.split('\n    - id:')[0]!
        expect(feature).toContain(`center_xz: [${point.join(', ')}]`)
        expect(svg).toContain(`id="${id}"`)
        expect(svg).toContain(`cx="${point[0]}" cy="${point[1]}"`)
      }
      const feature = map.split(`    - id: ${site.id}\n`)[1]!.split('\n    - id:')[0]!
      expect(feature).toContain(
        `polygon_xz: [${landingGradePolygon(site)
          .map((p) => `[${p.join(', ')}]`)
          .join(', ')}]`,
      )
      expect(feature).toContain(`edge_feather_m: ${site.featherMeters}`)
      expect(feature).toContain(`coastline_rise_distance_m: ${site.riseMeters}`)
      expect(feature).toContain('mean_sea_level_m: -0.12')
      expect(svg).toContain(`id="${site.id}"`)
    }
    for (const event of STAGE5B_EVENTS) {
      const block = scenario
        .split('\n  - at_s:')
        .slice(1)
        .find((b) => b.includes(`    id: '${event.id}'`))!
      expect(Number(block.split('\n')[0])).toBe(event.atSeconds)
      expect(block).toContain(`event: '${event.event}'`)
      expect(block).toContain(`local_time: '${event.localTime}'`)
      if ('actorId' in event) expect(block).toContain(`entity: '${event.actorId}'`)
      if ('pathId' in event) expect(block).toContain(`path_id: '${event.pathId}'`)
      if ('pathIds' in event) {
        expect(Array.from(block.split('    path_ids:')[1]!.matchAll(/      - '([^']+)'/g), (m) => m[1])).toEqual(event.pathIds)
        expect(
          Array.from(
            block
              .split('    entities:')[1]!
              .split('    event:')[0]!
              .matchAll(/      - '([^']+)'/g),
            (m) => m[1],
          ),
        ).toEqual(event.entities)
      }
    }
  })
  it('retains byte-exact unrelated scenario content and all four future event records', () => {
    let restored = restoreStage5bScenario(scenario)
    for (const i of [1, 2] as const) {
      const block = restored.match(new RegExp("  - id: 'attacker_lcac_0" + i + "'[\\s\\S]+?(?=\\n  - id:)"))![0]
      const location = block.match(/    initial_location:[\s\S]+?(?=    initial_state:)/)![0]
      restored = restored.replace(location, old.actorLocations[String(i) as '1' | '2'])
      const side = i === 1 ? 'west' : 'east',
        path = restored.match(new RegExp("    - id: 'path_lcac_beach_approach_" + side + "'[\\s\\S]+?(?=\\n    - id:)"))![0]
      restored = restored.replace(path, old.approachPaths[side])
    }
    restored = restored.replaceAll("event: 'enter_final_nearshore_approach'", "event: 'enter_shallow_water_approach'")
    expect(hash(restored)).toBe(old.fileHashes['scenario-spec.yaml'])
    expect(Array.from(scenario.matchAll(/    id: '(lav_group_01_disembark|lav_group_02_disembark|lav_inland_spread|scripted_phase_complete)'/g), (m) => m[1])).toEqual(['lav_group_01_disembark', 'lav_group_02_disembark', 'lav_inland_spread', 'scripted_phase_complete'])
  })
  it('adds exactly six map features and preserves every original map/SVG record', () => {
    const additions = map.match(/    # Stage 5B approved landing sites[\s\S]+?(?=    - id: beach_landing_strand)/)![0]
    expect(Array.from(additions.matchAll(/    - id: (\S+)/g), (m) => m[1])).toEqual(['lcac_holding_west', 'lcac_holding_east', 'lcac_final_nearshore_west', 'lcac_final_nearshore_east', 'beach_contact_grade_west', 'beach_contact_grade_east'])
    expect(hash(map.replace(additions, ''))).toBe(old.fileHashes['map-spec.yaml'])
    let restored = svg
    for (const site of LANDING_SITES)
      for (const id of [site.id, site.holdingFeatureId, site.gateFeatureId]) {
        const addition = restored.match(new RegExp('        <g id="' + id + '">[^\\n]+\\n'))![0]
        restored = restored.replace(addition, '')
      }
    expect(hash(restored)).toBe(old.fileHashes['map-layout.svg'])
  })
  it('preserves every narrative chapter outside the revised approach semantics', () => {
    const narrative = restoreStage5bNarrative(read('assets/scenario/scenario-timeline.md')),
      section = narrative.match(/# 18\. Amphibious Approach[\s\S]+?(?=# 19\.)/)![0]
    expect(section).toContain('2026-10-09')
    expect(section).toContain('eight operational LAV-25s still embarked')
    expect(hash(narrative.replace(section, old.amphibiousNarrative))).toBe(old.fileHashes['scenario-timeline.md'])
  })
})
