/** Only periodic presentation phases are reduced. Observation time itself is
 * never wrapped, and every existing scripted input is retained exactly. */
export const COASTAL_PHASE_PERIOD_SECONDS = Math.PI * 200
const SCRIPTED_BOUNDARY = 180

export function coastalShaderTime(runtime: number) {
  if (!Number.isFinite(runtime)) return 0
  const time = Math.max(0, runtime)
  // .31, .56 and .92 rad/s all complete an integer number of cycles here.
  return time <= SCRIPTED_BOUNDARY ? time : time % COASTAL_PHASE_PERIOD_SECONDS
}

/** The wear shader only compares irreversible historical hiding cutoffs. Its
 * permanent-patch sentinel is 1000, rather than an emission/runtime clock. */
export function surfaceHistoryTime(runtime: number) {
  return Number.isFinite(runtime) ? Math.min(SCRIPTED_BOUNDARY, Math.max(0, runtime)) : 0
}

/** Preserve original multiplication in the scripted domain; bound late CPU
 * periodic phases before Three uploads their rotations to float matrices. */
export function periodicAngle(time: number, rate: number, phase = 0) {
  if (time <= SCRIPTED_BOUNDARY) return time * rate + phase
  const period = (Math.PI * 2) / Math.abs(rate)
  return (time % period) * rate + phase
}

/** A source can stop producing smoke without freezing or retaining its final
 * puffs forever. The already-born cycle finishes within one fixed lifetime. */
export function cyclicEmissionAge(sourceAge: number, delay: number, lifetime: number, emissionEndAge = Infinity) {
  const emittedAge = sourceAge - delay
  if (emittedAge < 0) return null
  const cycleAge = emittedAge % lifetime
  const birthAge = sourceAge - cycleAge
  return birthAge > emissionEndAge ? null : cycleAge
}

export function legacyDustScale(time: number) {
  return time <= SCRIPTED_BOUNDARY ? 1 : Math.max(0, 1 - (time - SCRIPTED_BOUNDARY) / 0.6)
}
