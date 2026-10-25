/** Half-width in meters for the sole 1024 shadow map. */
export function shadowCoverage(distance: number) {
  return Math.max(180, Math.min(2200, distance * 0.65))
}
