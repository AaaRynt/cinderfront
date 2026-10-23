import type { SurvivorContinuationMetadata } from './aftermathSurvivors'
import type { RuntimeLandingWorldState } from './landingAftermath'
import type { SimulationWorldState } from './types'

import { deriveRuntimeAircraft } from './aftermathAircraft'
import { deriveRuntimeSurvivors } from './aftermathSurvivors'
import { SCRIPTED_DURATION_SECONDS } from './constants'
import { deriveSimulationWorldState } from './derive'
import { deriveRuntimeLandingWorldState } from './landingAftermath'
import { formatRuntimeLocalTime, formatRuntimeTime, normalizeRuntimeTime, runtimeProgress } from './runtimeTime'

export type RuntimeWorldState = Omit<SimulationWorldState, 'landing'> & {
  readonly landing: RuntimeLandingWorldState
  readonly runtime: ReturnType<typeof runtimeProgress> & { readonly survivors?: SurvivorContinuationMetadata; readonly aircraft?: ReturnType<typeof deriveRuntimeAircraft>['presentation'] }
}
let boundary: SimulationWorldState | undefined
let previousTime = -1
let previousWorld: RuntimeWorldState | undefined
/** One active derivation. Historical fields are exact through 180. Only one
 * last result is retained, independently of seek order or elapsed runtime. */
export function deriveRuntimeWorldState(input: number): RuntimeWorldState {
  const time = normalizeRuntimeTime(input)
  if (previousWorld && time === previousTime) return previousWorld
  const progress = runtimeProgress(time)
  if (time <= SCRIPTED_DURATION_SECONDS) {
    previousWorld = { ...deriveSimulationWorldState(time), runtime: progress }
  } else {
    boundary ??= deriveSimulationWorldState(SCRIPTED_DURATION_SECONDS)
    const survivors = deriveRuntimeSurvivors(time, boundary)
    const egress = deriveRuntimeAircraft(time)
    const elapsed = progress.aftermathSeconds
    const industrial = boundary.stage3.industrial
    // Resume the surviving antenna smoothly from its actual boundary phase.
    // Only the periodic phase wraps; wrecks and the primary radar stay fixed.
    const ramp = Math.min(elapsed, 2)
    const antennaTravel = elapsed < 2 ? 0.34 * (ramp ** 3 / 4 - ramp ** 4 / 16) : 0.34 * (elapsed - 1)
    previousWorld = {
      ...boundary,
      timeSeconds: time,
      relativeTimeLabel: formatRuntimeTime(time),
      localTimeLabel: formatRuntimeLocalTime(time),
      wasp: survivors.wasp,
      aircraft: egress.aircraft,
      radar: { ...boundary.radar, secondaryDishRotationRadians: boundary.radar.secondaryDishRotationRadians + (antennaTravel % (2 * Math.PI)), secondaryTracking: false },
      stage3: { ...boundary.stage3, molniya: survivors.molniya, industrial: { ...industrial, fuelCascade: { ...industrial.fuelCascade, ageSeconds: time - 92 }, ammunitionPrimary: { ...industrial.ammunitionPrimary, ageSeconds: time - 132 } } },
      stage4b: survivors.stage4b,
      stage4b2c: survivors.stage4b2c,
      secondaryPantsir: { ...boundary.secondaryPantsir, destruction: { ...boundary.secondaryPantsir.destruction, ageSeconds: time - 121 } },
      landing: deriveRuntimeLandingWorldState(time),
      runtime: { ...progress, survivors: survivors.metadata, aircraft: egress.presentation },
    }
  }
  previousTime = time
  return previousWorld
}
