import baseline from './stage5bPreservation.json'

/** Normalize only the two authorized LAV path blocks and landing chapters.
 * All remaining file bytes still participate in the original hash checks. */
export function restoreStage5bScenario(source: string) {
  let restored = source
  for (const side of ['west', 'east'] as const) {
    const pattern = new RegExp("    - id: 'path_lav_inland_" + side + "'[\\s\\S]+?(?=\\n    - id:|\\neffect_profiles:)")
    restored = restored.replace(pattern, baseline.lavPaths[side])
  }
  return restored
}
export function restoreStage5bNarrative(source: string) {
  let restored = source
  for (const n of [18, 23, 28] as const) restored = restored.replace(new RegExp('# ' + n + '\\.[\\s\\S]+?(?=# ' + (n + 1) + '\\.)'), baseline.narrative[String(n) as '18' | '23' | '28'])
  return restored
}
