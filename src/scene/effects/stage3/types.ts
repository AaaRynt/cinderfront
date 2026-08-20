export type Stage3Vec3 = readonly [x: number, y: number, z: number]

export type Stage3BlastObjectKind = 'grass' | 'scrub' | 'light-pole' | 'fence' | 'antenna'

export interface BallisticFragmentDescriptor {
  readonly angularVelocity: Stage3Vec3
  readonly burning: boolean
  readonly lifetimeSeconds: number
  readonly offset: Stage3Vec3
  readonly scale: Stage3Vec3
  readonly velocity: Stage3Vec3
}

export interface GroundFireDescriptor {
  readonly delaySeconds: number
  readonly offset: Stage3Vec3
  readonly phase: number
  readonly scale: number
}

export interface SmokePuffDescriptor {
  readonly core: boolean
  readonly curl: number
  readonly delaySeconds: number
  readonly lifetimeSeconds: number
  readonly phase: number
  readonly size: number
}

export interface BlastResponseDescriptor {
  readonly burns: boolean
  readonly distanceFromBlastM: number
  readonly id: string
  readonly kind: Stage3BlastObjectKind
  readonly phase: number
  readonly position: Stage3Vec3
  readonly scale: Stage3Vec3
  readonly yawRadians: number
}

export interface BallisticSample {
  readonly position: Stage3Vec3
  readonly rotation: Stage3Vec3
  readonly velocity: Stage3Vec3
}

export interface BlastResponseSample {
  readonly bendRadians: number
  readonly charred: boolean
  readonly ignitionAgeSeconds: number
  readonly ignitionActive: boolean
  readonly shockArrivalSeconds: number
}
