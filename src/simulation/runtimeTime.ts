import { SCRIPTED_DURATION_SECONDS, STAGE1_START_LOCAL_SECONDS } from './constants'

/** Runtime policy: negative finite inputs clamp to zero; nonfinite inputs retain
 * the supplied finite fallback (zero for standalone derivation). No time wraps
 * or observation endpoint. Overflowing ticks are rejected by the store. */
export function normalizeRuntimeTime(value: number, fallback = 0): number {
  return Number.isFinite(value) ? Math.max(0, value) : Number.isFinite(fallback) ? Math.max(0, fallback) : 0
}
export function quantizeRuntimeTime(value: number): number {
  const time = normalizeRuntimeTime(value)
  return time <= Number.MAX_SAFE_INTEGER / 10 ? Math.round(time * 10) / 10 : time
}
export function runtimeProgress(value: number) {
  const time = normalizeRuntimeTime(value)
  return { observationSeconds: time, scriptedSeconds: Math.min(time, SCRIPTED_DURATION_SECONDS), aftermathSeconds: Math.max(0, time - SCRIPTED_DURATION_SECONDS), phase: time < SCRIPTED_DURATION_SECONDS ? ('scripted' as const) : ('aftermath' as const) }
}
const pad2 = (v: number) => String(v).padStart(2, '0')
function displayParts(value: number) {
  const time = quantizeRuntimeTime(value)
  const whole = Math.floor(time)
  return { whole, fraction: Math.round((time - whole) * 10) % 10 }
}
export function formatRuntimeTime(value: number): string {
  const { whole, fraction } = displayParts(value)
  return `T+${pad2(Math.floor(whole / 60))}:${pad2(whole % 60)}${fraction ? `.${fraction}` : ''}`
}
export function formatRuntimeLocalTime(value: number): string {
  const { whole, fraction } = displayParts(value)
  const clock = (STAGE1_START_LOCAL_SECONDS + (whole % 86400)) % 86400
  return `${pad2(Math.floor(clock / 3600))}:${pad2(Math.floor((clock % 3600) / 60))}:${pad2(clock % 60)}${fraction ? `.${fraction}` : ''} LOCAL`
}
