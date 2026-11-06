import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'

import { simulationStore } from '@/simulation/store'

import { RoadsideDetail } from '../stage8a/RoadsideDetail'
import { fuelBlastAge } from '../stage8c/fuelBlast'
import { FuelResponseVegetation } from '../stage8c/FuelResponseVegetation'
import { EasternSurf } from './EasternSurf'
import { localMotionTime, type MotionClock } from './motionClock'
import { RoadsideDust } from './RoadsideDust'

export function LocalEnvironmentMotion() {
  const clocks = useMemo(() => {
    const time = simulationStore.getState().timeSeconds
    return { wind: { value: localMotionTime(time) }, blast: { value: fuelBlastAge(time) } }
  }, [])
  const clockRef = useRef<{ wind: MotionClock; blast: MotionClock }>(null)
  useLayoutEffect(() => {
    clockRef.current = clocks
  }, [clocks])
  useFrame(() => {
    if (!clockRef.current) return
    const time = simulationStore.getState().timeSeconds
    clockRef.current.wind.value = localMotionTime(time)
    clockRef.current.blast.value = fuelBlastAge(time)
  })
  return (
    <>
      <RoadsideDetail clock={clocks.wind} />
      <EasternSurf clock={clocks.wind} />
      <RoadsideDust clock={clocks.wind} />
      <FuelResponseVegetation windClock={clocks.wind} blastClock={clocks.blast} />
    </>
  )
}
