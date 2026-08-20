import { useMemo } from 'react'

import type { SimulationEvent, SimulationSpeed } from '@/simulation'

import { BattlefieldScene } from '@/scene/BattlefieldScene'
import { deriveSimulationWorldState, quantizeSimulationTime, SIMULATION_DURATION_SECONDS, useSimulationStore } from '@/simulation'
import { SimulationHud } from '@/ui/SimulationHud'

const EVENT_LABELS: Readonly<Record<SimulationEvent['id'], string>> = {
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
  f35_02_harbor_ingress: 'F-35B 02 attacking the harbor district',
  molniya_departure: 'Molniya emergency harbor departure',
  talwar_first_hit: 'Talwar takes the first heavy hit',
  industrial_pipeline_hit: 'Fuel-transfer pipeline ignited',
  fuel_tank_initial_hit: 'Fuel tank 05 ruptured and burning',
  fuel_storage_cascade: 'Central fuel-storage cascade',
  fuel_shock_environment_response: 'Blast front reaches nearby structures',
  industrial_blackout: 'Industrial feeder partially blacked out',
  talwar_fuel_leak: 'Talwar fuel leak reaches harbor water',
  talwar_second_hit: 'Talwar takes a second heavy hit',
  ammunition_cookoff_begin: 'Ammunition compound cook-off begins',
  molniya_fragment_damage: 'Molniya damaged but still mobile',
  ammunition_storage_primary_detonation: 'Primary ammunition bunker detonates',
  talwar_severe_list: 'Talwar mission-killed and partially flooded',
  molniya_open_water: 'Molniya reaches open water',
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
  const world = useMemo(() => deriveSimulationWorldState(time), [time])
  const latestEvent = world.reachedEvents.at(-1) ?? world.reachedEvents[0]

  const battlefieldStatus = {
    aircraft01: phaseLabel(world.aircraft.attacker_f35_01.phase),
    aircraft02: phaseLabel(world.aircraft.attacker_f35_02.phase),
    pantsir: world.persistent.pantsirWreck ? 'wreck / fire' : phaseLabel(world.pantsir.phase),
    primaryRadar: world.persistent.primaryRadarDestroyed ? 'destroyed / secondary active' : phaseLabel(world.radar.primaryPhase),
    talwar: phaseLabel(world.stage3.talwar.phase),
    molniya: phaseLabel(world.stage3.molniya.phase),
    industrial: world.stage3.industrial.ammunitionCompoundDestroyed ? 'fuel and ammunition sites destroyed' : world.stage3.industrial.blackoutFraction > 0 ? 'partial blackout / fires active' : world.stage3.industrial.pipelineIgnited ? 'fuel-transfer fire active' : 'operational',
  }

  return (
    <SimulationHud
      battlefieldStatus={battlefieldStatus}
      duration={SIMULATION_DURATION_SECONDS}
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
