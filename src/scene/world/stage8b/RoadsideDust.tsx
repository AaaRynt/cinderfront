import { useEffect, useMemo } from 'react'

import type { MotionClock } from './motionClock'

import { createVergeDust } from './dust'

export function RoadsideDust({ clock }: { clock: MotionClock }) {
  const resources = useMemo(() => createVergeDust(clock), [clock])
  useEffect(
    () => () => {
      resources.geometry.dispose()
      resources.material.dispose()
    },
    [resources],
  )
  return <mesh {...resources} name="8b-verge-dust" renderOrder={4} dispose={null} />
}
