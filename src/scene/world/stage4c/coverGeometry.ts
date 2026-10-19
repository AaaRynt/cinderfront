import type { CoverKind } from './regionalLayout'

import { createGrassGeometry, createRockGeometry, createScrubGeometry } from '../landscape/landscapeGeometry'

export function createCoverGeometry(kind: CoverKind, variant: number) {
  return kind === 'grass' ? createGrassGeometry(variant) : kind === 'scrub' ? createScrubGeometry(variant) : createRockGeometry(variant)
}
