import { SIMULATION_DURATION_SECONDS, STAGE1_DURATION_SECONDS, STAGE1_START_LOCAL_SECONDS, STAGE1_TIMELINE_RESOLUTION_SECONDS } from './constants'
import { clamp } from './math'

const SECONDS_PER_DAY = 24 * 60 * 60

function normalizeInput(value: number, maximumSeconds: number): number {
  if (Number.isNaN(value) || value === Number.NEGATIVE_INFINITY) return 0
  if (value === Number.POSITIVE_INFINITY) return maximumSeconds
  return value
}

export function clampSimulationTime(timeSeconds: number): number {
  return clamp(normalizeInput(timeSeconds, SIMULATION_DURATION_SECONDS), 0, SIMULATION_DURATION_SECONDS)
}

/** Keeps the completed Stage 1 derivation API frozen at its original endpoint. */
export function clampStage1Time(timeSeconds: number): number {
  return clamp(normalizeInput(timeSeconds, STAGE1_DURATION_SECONDS), 0, STAGE1_DURATION_SECONDS)
}

export function quantizeSimulationTime(timeSeconds: number): number {
  const clamped = clampSimulationTime(timeSeconds)
  return Math.round(clamped / STAGE1_TIMELINE_RESOLUTION_SECONDS) * STAGE1_TIMELINE_RESOLUTION_SECONDS
}

function splitDisplaySeconds(timeSeconds: number): {
  wholeSeconds: number
  tenths: number
} {
  const quantizedTenths = Math.round(clampSimulationTime(timeSeconds) * 10)
  return {
    wholeSeconds: Math.floor(quantizedTenths / 10),
    tenths: quantizedTenths % 10,
  }
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

export function formatSimulationTime(timeSeconds: number): string {
  const { wholeSeconds, tenths } = splitDisplaySeconds(timeSeconds)
  const minutes = Math.floor(wholeSeconds / 60)
  const seconds = wholeSeconds % 60
  const fraction = tenths === 0 ? '' : `.${tenths}`
  return `T+${pad2(minutes)}:${pad2(seconds)}${fraction}`
}

export function formatLocalTime(timeSeconds: number): string {
  const { wholeSeconds, tenths } = splitDisplaySeconds(timeSeconds)
  const clockSeconds = (STAGE1_START_LOCAL_SECONDS + wholeSeconds) % SECONDS_PER_DAY
  const hours = Math.floor(clockSeconds / 3600)
  const minutes = Math.floor((clockSeconds % 3600) / 60)
  const seconds = clockSeconds % 60
  const fraction = tenths === 0 ? '' : `.${tenths}`
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}${fraction} LOCAL`
}
