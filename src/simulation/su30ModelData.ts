/** Raw-meter Su-30MKK contract; local -Z is forward, +Y is up. */
export const SU30_DIMENSIONS = { length: 21.94, wingspan: 14.7, height: 6.36 } as const

/** Aft nozzle centers shared by the static model and absolute-time effects. */
export const SU30_ENGINE_OFFSETS = {
  left: { x: -1.85, y: -1.89, z: 8.6 },
  right: { x: 1.85, y: -1.89, z: 8.6 },
} as const

/** Upper aft starboard nacelle: the compact contact flash and surface damage. */
export const SU30_DAMAGE_OFFSET = { x: 1.85, y: -0.96, z: 7.2 } as const

export const SU30_NAVIGATION_OFFSETS = {
  left: { x: -7.3, y: -0.62, z: 3.6 },
  right: { x: 7.3, y: -0.62, z: 3.6 },
  beacon: { x: 0, y: 0.16, z: -1.8 },
} as const
