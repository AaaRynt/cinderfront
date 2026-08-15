import type { NavalHullSection } from './navalModelShared'

export const TALWAR_DIMENSIONS_METERS = {
  length: 124.8,
  beam: 15.2,
  draft: 4.5,
  keelToMastTop: 33,
} as const

export const TALWAR_HULL_SECTIONS: readonly NavalHullSection[] = [
  { z: -62.4, deckHalfWidth: 0.08, chineHalfWidth: 0.04, keelHalfWidth: 0.02, deckY: 6.8, chineY: 1.1, keelY: -0.15 },
  { z: -58, deckHalfWidth: 3.4, chineHalfWidth: 2.2, keelHalfWidth: 0.55, deckY: 5.7, chineY: -0.15, keelY: -2.6 },
  { z: -49, deckHalfWidth: 6.45, chineHalfWidth: 4.9, keelHalfWidth: 1.15, deckY: 4.6, chineY: -0.45, keelY: -4.25 },
  { z: -34, deckHalfWidth: 7.42, chineHalfWidth: 5.75, keelHalfWidth: 1.35, deckY: 4.05, chineY: -0.55, keelY: -4.5 },
  { z: 8, deckHalfWidth: 7.6, chineHalfWidth: 6.05, keelHalfWidth: 1.45, deckY: 3.8, chineY: -0.55, keelY: -4.5 },
  { z: 40, deckHalfWidth: 7.52, chineHalfWidth: 5.95, keelHalfWidth: 1.5, deckY: 3.72, chineY: -0.5, keelY: -4.45 },
  { z: 60.5, deckHalfWidth: 7.2, chineHalfWidth: 5.72, keelHalfWidth: 1.55, deckY: 3.65, chineY: -0.45, keelY: -4.1 },
  { z: 62.4, deckHalfWidth: 7.08, chineHalfWidth: 5.62, keelHalfWidth: 1.55, deckY: 3.65, chineY: -0.4, keelY: -3.7 },
]

export const TALWAR_ATTACHMENT_POINTS = {
  forwardHit: [0, 5.1, -38] as [number, number, number],
  midshipsHit: [3.8, 7.4, 3] as [number, number, number],
  aftHit: [-3.6, 5.2, 31] as [number, number, number],
  forwardDeckFire: [0, 4.4, -31] as [number, number, number],
  hangarFire: [0, 9.1, 30] as [number, number, number],
  funnelSmoke: [0, 18.2, 10.5] as [number, number, number],
  fuelLeakOrigin: [-5.8, 0.2, 18] as [number, number, number],
  wakeOrigin: [0, 0.1, 63.5] as [number, number, number],
} as const

export const MOLNIYA_DIMENSIONS_METERS = {
  length: 56.9,
  beam: 10.2,
  draft: 2.4,
  keelToMastTop: 17.5,
} as const

export const MOLNIYA_HULL_SECTIONS: readonly NavalHullSection[] = [
  { z: -28.45, deckHalfWidth: 0.06, chineHalfWidth: 0.03, keelHalfWidth: 0.02, deckY: 4.65, chineY: 0.8, keelY: -0.1 },
  { z: -25, deckHalfWidth: 2.1, chineHalfWidth: 1.25, keelHalfWidth: 0.34, deckY: 3.85, chineY: -0.05, keelY: -1.2 },
  { z: -19, deckHalfWidth: 4.45, chineHalfWidth: 3.45, keelHalfWidth: 0.68, deckY: 3.05, chineY: -0.35, keelY: -2.2 },
  { z: -11, deckHalfWidth: 5.1, chineHalfWidth: 4.15, keelHalfWidth: 0.82, deckY: 2.55, chineY: -0.42, keelY: -2.4 },
  { z: 12, deckHalfWidth: 5.08, chineHalfWidth: 4.22, keelHalfWidth: 0.9, deckY: 2.42, chineY: -0.42, keelY: -2.4 },
  { z: 26, deckHalfWidth: 4.95, chineHalfWidth: 4.08, keelHalfWidth: 0.95, deckY: 2.35, chineY: -0.38, keelY: -2.32 },
  { z: 28.45, deckHalfWidth: 4.85, chineHalfWidth: 4, keelHalfWidth: 0.95, deckY: 2.35, chineY: -0.35, keelY: -2.15 },
]

export const MOLNIYA_ATTACHMENT_POINTS = {
  forwardHit: [0, 3.2, -17] as [number, number, number],
  bridgeHit: [2.3, 7.1, -4] as [number, number, number],
  missileBankHit: [-3, 4.1, 10] as [number, number, number],
  engineSmoke: [0, 5.4, 15] as [number, number, number],
  wakeOrigin: [0, 0.1, 29.2] as [number, number, number],
} as const
