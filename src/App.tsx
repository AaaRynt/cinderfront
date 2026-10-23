import { useEffect, useMemo } from 'react'

import type { Btr80GroundVehicleGroupState, SimulationEvent, SimulationSpeed, T72GroundVehicleGroupState } from '@/simulation'
import type { LavGroupState } from '@/simulation/landingCraftTypes'

import { BattlefieldScene } from '@/scene/BattlefieldScene'
import { deriveRuntimeWorldState, simulationStore, SIMULATION_DURATION_SECONDS, useSimulationStore } from '@/simulation'
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
  btr_01_disabled: 'BTR-80 01 disabled by secondary blast',
  btr_survivors_fallback: 'BTR-80 survivors begin withdrawal',
  defender_armored_reinforcement_move: 'T-72B group begins armored reinforcement',
  t72_lead_destroyed: 'Lead T-72B destroyed by F-35B 01',
  t72_survivors_withdraw: 'T-72B survivors begin reverse withdrawal',
  talwar_severe_list: 'Talwar mission-killed and partially flooded',
  molniya_open_water: 'Molniya reaches open water',
  su30_reinforcement_entry: 'Two Su-30MKK reinforcements enter from the northeast',
  su30_01_damaged: 'Su-30 01 damaged · controlled breakaway',
  su30_02_cover_withdrawal: 'Su-30 02 covers the damaged aircraft’s withdrawal',
  aircraft_egress: 'Primary air activity transitions to egress',
  rescue_convoy_redirect: 'Support convoy redirects to the industrial emergency',
  rescue_convoy_chokepoint: 'Support convoy brakes in smoke and dust',
  rescue_route_secondary_hit: 'Unattributed secondary blast blocks the dry-wash bridge',
  rescue_convoy_abandon_approach: 'Support convoy abandons approach · partial withdrawal',
  pantsir_02_relocate: 'Pantsir 02 begins local relocation',
  pantsir_02_destroyed: 'Pantsir 02 destroyed by F-35B 01',
  lav_group_01_disembark: 'West LAV group begins staggered unloading',
  lav_group_02_disembark: 'East LAV group begins staggered unloading',
  lav_inland_spread: 'Leading LAVs advance along both inland roads',
  scripted_phase_complete: 'Scripted phase complete · observation continues',
  lcac_departure: 'Both LCACs depart · 8 LAV-25s embarked',
  lcac_01_shallow_water: 'LCAC 01 reaches the west nearshore gate',
  lcac_02_shallow_water: 'LCAC 02 reaches the east nearshore gate',
  lcac_01_beach: 'LCAC 01 beached · bow ramp lowering',
  lcac_02_beach: 'LCAC 02 beached · bow ramp lowering',
}

function phaseLabel(value: string) {
  return value.replaceAll('-', ' ')
}

function btrGroupStatus(group: Btr80GroundVehicleGroupState) {
  if (group.activity === 'movement-complete') return '3 holding / 1 disabled'
  const fallbackActive = group.activity === 'turning-to-withdraw' || group.activity === 'withdrawing'
  if (group.disabledCount === 1 && fallbackActive) return '3 withdrawing / 1 disabled'
  if (group.disabledCount === 1) return '1 disabled / 3 operational'
  return phaseLabel(group.activity)
}

function t72GroupStatus(group: T72GroundVehicleGroupState) {
  if (group.activity === 'movement-complete') return '2 holding / 1 destroyed'
  if (group.destroyedCount === 1 && group.withdrawingCount === 2) return '2 withdrawing / 1 destroyed'
  if (group.destroyedCount === 1) return '1 destroyed / 2 halted'
  if (group.activity === 'moving-to-reinforce') return '3 reinforcing'
  return 'reserve'
}

function landingGroupStatus(group: LavGroupState) {
  return `${phaseLabel(group.activity)} · ${group.embarkedCount} aboard / ${group.transferringCount} transfer / ${group.ashoreCount} ashore`
}

function SimulationInterface() {
  const time = useSimulationStore((state) => state.timeSeconds)
  const playing = useSimulationStore((state) => state.isPlaying)
  const speed = useSimulationStore((state) => state.speed)
  const play = useSimulationStore((state) => state.play)
  const pause = useSimulationStore((state) => state.pause)
  const restart = useSimulationStore((state) => state.restart)
  const seek = useSimulationStore((state) => state.seek)
  const setSpeed = useSimulationStore((state) => state.setSpeed)
  const world = useMemo(() => deriveRuntimeWorldState(time), [time])
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, button, [role=textbox]'))) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
      const state = simulationStore.getState()
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault()
        if (state.isPlaying) state.pause()
        else state.play()
      } else if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
        event.preventDefault()
        state.seek(state.timeSeconds + (event.code === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 10 : 1))
      } else if (event.code === 'Home' || event.code === 'End') {
        event.preventDefault()
        state.seek(event.code === 'Home' ? 0 : SIMULATION_DURATION_SECONDS)
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [])
  const latestEvent = world.reachedEvents.at(-1) ?? world.reachedEvents[0]

  const battlefieldStatus = {
    aircraft01: world.runtime.aircraft ? (world.runtime.aircraft.attacker_f35_01.visible ? 'egress' : 'departed') : phaseLabel(world.aircraft.attacker_f35_01.phase),
    aircraft02: world.runtime.aircraft ? (world.runtime.aircraft.attacker_f35_02.visible ? 'egress' : 'departed') : phaseLabel(world.aircraft.attacker_f35_02.phase),
    lcacWest: phaseLabel(world.landing.crafts.attacker_lcac_01.activity),
    lcacEast: phaseLabel(world.landing.crafts.attacker_lcac_02.activity),
    lavWest: landingGroupStatus(world.landing.groups.attacker_lav_group_01),
    lavEast: landingGroupStatus(world.landing.groups.attacker_lav_group_02),
    embarkedPayload: `${world.landing.operationalPayloadCount} operational LAV-25s · ${world.landing.embarkedCount} aboard / ${world.landing.transferringCount} transferring / ${world.landing.ashoreCount} ashore`,
    pantsir: world.persistent.pantsirWreck ? 'wreck / fire' : phaseLabel(world.pantsir.phase),
    secondaryPantsir: world.secondaryPantsir.status,
    primaryRadar: world.persistent.primaryRadarDestroyed ? 'destroyed / secondary active' : phaseLabel(world.radar.primaryPhase),
    talwar: phaseLabel(world.stage3.talwar.phase),
    molniya: world.runtime.survivors?.molniya.mapPresence === 'departed' ? 'departed · damaged survivor' : phaseLabel(world.stage3.molniya.phase),
    btrGroup: btrGroupStatus(world.stage4b.btrGroup),
    t72Group: t72GroupStatus(world.stage4b.t72Group),
    su30Group: world.stage4b2b.status,
    supportPhase: time > 180 && world.stage4b2c.convoy.holdingCount === 6 ? 'withdrawal complete · holding' : world.stage4b2c.convoy.phase.replaceAll('_', ' '),
    supportOutcome: world.stage4b2c.convoy.outcome === 'survived' ? `6 survived · ${world.stage4b2c.convoy.holdingCount} hold / ${world.stage4b2c.convoy.repositioningCount} reposition / ${world.stage4b2c.convoy.withdrawingCount} withdrawing` : '6 operational · 2 fire / 1 engineering / 1 recovery / 2 logistics',
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
