import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'

import { simulationStore } from '@/simulation/store'

import { RoadsideDetail } from '../stage8a/RoadsideDetail'
import { EasternSurf } from './EasternSurf'
import { localMotionTime, type MotionClock } from './motionClock'
import { RoadsideDust } from './RoadsideDust'

export function LocalEnvironmentMotion() {
  const clock = useMemo(() => ({ value: localMotionTime(simulationStore.getState().timeSeconds) }), [])
  const clockRef = useRef<MotionClock>(null)
  useLayoutEffect(() => {
    clockRef.current = clock
  }, [clock])
  useFrame(() => {
    if (clockRef.current) clockRef.current.value = localMotionTime(simulationStore.getState().timeSeconds)
  })
  return (
    <>
      <RoadsideDetail clock={clock} />
      <EasternSurf clock={clock} />
      <RoadsideDust clock={clock} />
    </>
  )
}
