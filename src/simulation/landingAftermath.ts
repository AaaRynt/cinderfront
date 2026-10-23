import type { LandingCraftState, LandingWorldState } from './landingCraftTypes'
import type { RuntimeLavState } from './lavAftermath'

import { deriveLandingWorldState } from './landingCraft'
import { deriveRuntimeLavPayload } from './lavAftermath'

export type RuntimeLandingWorldState = Omit<LandingWorldState, 'payload'> & { readonly payload: Readonly<Record<keyof LandingWorldState['payload'], RuntimeLavState>> }
let settled: LandingWorldState | undefined
/** One focused continuation anchored to the exact finite historical API.
 * LCACs remain grounded at their completed shoreline poses. Every LAV keeps
 * its original manifest, root, ramp profile and independent wheel phase. */
export function deriveRuntimeLandingWorldState(runtime: number): RuntimeLandingWorldState {
  const time = Number.isFinite(runtime) ? Math.max(0, runtime) : 0
  if (time <= 180) return deriveLandingWorldState(time)
  settled ??= deriveLandingWorldState(180)
  const craftList = settled.orderedCraftIds.map((id): LandingCraftState => {
    const craft = settled!.crafts[id]
    return { ...craft, mechanics: { ...craft.mechanics, fanRotationRadians: craft.mechanics.fanRotationRadians + ((time - 180) % (Math.PI / 4)) * 8, navigationLight: 0.55 + 0.45 * Math.sin((time % (Math.PI / 2.5)) * 2.5) ** 2 }, particles: [] }
  })
  const crafts = Object.fromEntries(craftList.map((craft) => [craft.id, craft])) as LandingWorldState['crafts']
  const payload = Object.fromEntries(craftList.flatMap((craft) => craft.payloadIds.map((id, slot) => [id, deriveRuntimeLavPayload(craft, id, slot, time)]))) as RuntimeLandingWorldState['payload']
  const groups = Object.fromEntries(
    craftList.map((craft) => {
      const values = craft.payloadIds.map((id) => payload[id]),
        embarkedCount = values.filter((v) => v.occupancy === 'embarked').length,
        ashoreCount = values.filter((v) => v.occupancy === 'ashore').length
      return [craft.payloadGroupId, { ...settled!.groups[craft.payloadGroupId], activity: ashoreCount === 4 ? 'deployed' : ashoreCount > 0 ? 'inland-advance' : 'unloading', embarkedCount, ashoreCount, transferringCount: 4 - embarkedCount - ashoreCount }]
    }),
  ) as LandingWorldState['groups']
  const values = Object.values(groups)
  return { ...settled, crafts, payload, groups, embarkedCount: values.reduce((n, g) => n + g.embarkedCount, 0), ashoreCount: values.reduce((n, g) => n + g.ashoreCount, 0), transferringCount: values.reduce((n, g) => n + g.transferringCount, 0) }
}
