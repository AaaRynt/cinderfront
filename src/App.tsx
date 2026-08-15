import { useMemo } from 'react'

import type { SimulationSpeed, Stage1EventId } from '@/simulation'

import { BattlefieldScene } from '@/scene/BattlefieldScene'
import { deriveStage1WorldState, quantizeSimulationTime, STAGE1_DURATION_SECONDS, useSimulationStore } from '@/simulation'
import { SimulationHud } from '@/ui/SimulationHud'

const EVENT_LABELS: Readonly<Record<Stage1EventId, string>> = {
  scenario_begin: 'Offshore staging active',
  wasp_offshore_underway: 'Wasp maintaining patrol course',
  f35_01_launch: 'F-35B 01 STOVL launch',
  f35_02_launch: 'F-35B 02 STOVL launch',
  radar_alert: 'Primary search radar alert',
  air_defense_tracking: 'Radar Hill threat acquisition',
  pantsir_01_engage: 'Pantsir-S1 missile engagement',
  fixed_air_defense_engage: 'Fixed air-defense burst',
  radar_hill_near_hit: 'First strike at SAM battery area',
  pantsir_01_destroyed: 'Primary Pantsir-S1 destroyed',
  primary_radar_disabled: 'Primary search radar destroyed',
  harbor_first_hit: 'Harbor boundary strike',
}

function phaseLabel(value: string) {
  return value.replaceAll('-', ' ')
}

function SimulationInterface() {
  const time = useSimulationStore((state) => quantizeSimulationTime(state.timeSeconds))
  const playing = useSimulationStore((state) => state.isPlaying)
  const speed = useSimulationStore((state) => state.speed)
  const play = useSimulationStore((state) => state.play)
  const pause = useSimulationStore((state) => state.pause)
  const restart = useSimulationStore((state) => state.restart)
  const seek = useSimulationStore((state) => state.seek)
  const setSpeed = useSimulationStore((state) => state.setSpeed)
  const world = useMemo(() => deriveStage1WorldState(time), [time])
  const latestEvent = world.reachedEvents.at(-1) ?? world.reachedEvents[0]

  const battlefieldStatus = {
    aircraft01: phaseLabel(world.aircraft.attacker_f35_01.phase),
    aircraft02: phaseLabel(world.aircraft.attacker_f35_02.phase),
    pantsir: world.persistent.pantsirWreck ? 'wreck / fire' : phaseLabel(world.pantsir.phase),
    primaryRadar: world.persistent.primaryRadarDestroyed ? 'destroyed / secondary active' : phaseLabel(world.radar.primaryPhase),
  }

  return (
    <SimulationHud
      battlefieldStatus={battlefieldStatus}
      duration={STAGE1_DURATION_SECONDS}
      latestEvent={{
        code: latestEvent.id,
        label: EVENT_LABELS[latestEvent.id],
        time: latestEvent.atSeconds,
      }}
      localTime={world.localTimeLabel}
      onRestart={restart}
      onSeek={seek}
      onSpeedChange={(nextSpeed: SimulationSpeed) => setSpeed(nextSpeed)}
      onTogglePlayback={() => (playing ? pause() : play())}
      playing={playing}
      relativeTime={world.relativeTimeLabel}
      speed={speed}
      time={time}
    />
  )
}

export default function App() {
  return (
    <main className="app-shell">
      <BattlefieldScene />
      <SimulationInterface />
    </main>
  )
}
