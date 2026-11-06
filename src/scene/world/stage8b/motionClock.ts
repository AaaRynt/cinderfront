export type MotionClock = { value: number }

export const SURF_PERIOD_SECONDS = 8
export const GUST_PERIOD_SECONDS = 10
export const FLUTTER_PERIOD_SECONDS = 2
// All phase rates in the surf, wind and ambient dust complete whole cycles
// here. The older coastal clock uses different rates and has its own wrap.
export const MOTION_PERIOD_SECONDS = 40

export function localMotionTime(runtime: number) {
  return Number.isFinite(runtime) ? Math.max(0, runtime) % MOTION_PERIOD_SECONDS : 0
}
