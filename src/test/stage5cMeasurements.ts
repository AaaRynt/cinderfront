/// <reference types="node" />
import { mkdirSync, writeFileSync } from 'node:fs'

/** Optional local evidence export; ordinary tests need no ignored artifacts. */
export function writeStage5cMeasurement(name: string, value: unknown) {
  if (process.env.CINDERFRONT_STAGE5C_MEASUREMENTS !== '1') return
  mkdirSync('stage5c-review.local', { recursive: true })
  writeFileSync(`stage5c-review.local/${name}`, JSON.stringify(value, null, 2) + '\n')
}
