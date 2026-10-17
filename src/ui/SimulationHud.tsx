import { Camera, Factory, Map, Pause, Plane, Play, Radar, Route, RotateCcw, Ship, Warehouse, Waves } from 'lucide-react'

import type { CameraPreset } from '@/scene/camera/cameraStore'
import type { SimulationEvent, SimulationSpeed } from '@/simulation'

import { useCameraStore } from '@/scene/camera/cameraStore'
import { SIMULATION_EVENTS } from '@/simulation'

interface TimelineEventView {
  code: SimulationEvent['id']
  label: string
  time: number
}

interface BattlefieldStatus {
  aircraft01: string
  aircraft02: string
  lcacWest: string
  lcacEast: string
  lavWest: string
  lavEast: string
  embarkedPayload: string
  pantsir: string
  secondaryPantsir: string
  primaryRadar: string
  talwar: string
  molniya: string
  btrGroup: string
  t72Group: string
  su30Group: string
  supportPhase: string
  supportOutcome: string
  industrial: string
}

interface SimulationHudProps {
  battlefieldStatus: BattlefieldStatus
  duration: number
  latestEvent: TimelineEventView
  localTime: string
  onRestart: () => void
  onSeek: (time: number) => void
  onSpeedChange: (speed: SimulationSpeed) => void
  onTogglePlayback: () => void
  playing: boolean
  relativeTime: string
  speed: SimulationSpeed
  time: number
}

const EVENT_TIMES = SIMULATION_EVENTS.map((event) => event.atSeconds)

const CAMERA_PRESETS: ReadonlyArray<{
  icon: typeof Map
  id: CameraPreset
  label: string
}> = [
  { icon: Map, id: 'overview', label: 'Overview' },
  { icon: Ship, id: 'wasp', label: 'Wasp' },
  { icon: Warehouse, id: 'harbor', label: 'Harbor' },
  { icon: Ship, id: 'talwar', label: 'Talwar' },
  { icon: Ship, id: 'molniya', label: 'Molniya' },
  { icon: Factory, id: 'industrial', label: 'Industrial' },
  { icon: Factory, id: 'fuel-storage', label: 'Fuel storage' },
  { icon: Warehouse, id: 'ammunition', label: 'Ammunition' },
  { icon: Camera, id: 'radar-hill', label: 'Radar Hill' },
  { icon: Radar, id: 'search-radar', label: 'Search radar' },
  { icon: Route, id: 'corridor', label: 'Convoy corridor' },
  { icon: Camera, id: 'btr', label: 'BTR focus' },
  { icon: Camera, id: 't72', label: 'T-72 focus' },
  { icon: Waves, id: 'beachhead', label: 'Beach inland' },
  { icon: Waves, id: 'beach-offshore', label: 'Beach offshore' },
  { icon: Plane, id: 'f35-01', label: 'F-35B 01' },
  { icon: Plane, id: 'f35-02', label: 'F-35B 02' },
  { icon: Plane, id: 'su30', label: 'Air reinforcement' },
  { icon: Route, id: 'support-convoy', label: 'Support convoy' },
  { icon: Radar, id: 'secondary-pantsir', label: 'Pantsir 02' },
  { icon: Waves, id: 'lcac-west', label: 'LCAC 01' },
  { icon: Waves, id: 'lcac-east', label: 'LCAC 02' },
  { icon: Route, id: 'lav-west', label: 'LAV west' },
  { icon: Route, id: 'lav-east', label: 'LAV east' },
]

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong title={value}>{value}</strong>
    </div>
  )
}

function formatTimelineBound(timeSeconds: number) {
  const minutes = Math.floor(timeSeconds / 60)
  const seconds = Math.floor(timeSeconds % 60)
  return `T+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function SimulationHud({ battlefieldStatus, duration, latestEvent, localTime, onRestart, onSeek, onSpeedChange, onTogglePlayback, playing, relativeTime, speed, time }: SimulationHudProps) {
  const activePreset = useCameraStore((state) => state.preset)
  const requestPreset = useCameraStore((state) => state.requestPreset)

  return (
    <div className="hud-shell">
      <header className="mission-header hud-panel">
        <div className="brand-lockup">
          <div aria-hidden="true" className="brand-mark">
            CF
          </div>
          <div>
            <p className="m-0 font-mono text-[9px] leading-[1.2] font-semibold tracking-[0.17em] text-(--muted) uppercase">Cinderfront / Stage 5C</p>
            <h1>Ash Harbor</h1>
          </div>
        </div>
        <div className="mission-clock" data-testid="mission-clock">
          <span>{relativeTime}</span>
          <strong>{localTime}</strong>
        </div>
      </header>

      <aside className="hud-panel absolute top-5 right-5 max-h-[calc(100dvh-160px)] w-[280px] overflow-y-auto px-3.5 py-[13px] max-[1100px]:max-h-[calc(100dvh-220px)] max-[760px]:hidden" aria-label="Operational status">
        <div className="faction-block faction-landings-attacker">
          <p className="eyebrow">landings_attacker</p>
          <StatusRow label="F-35B 01" value={battlefieldStatus.aircraft01} />
          <StatusRow label="F-35B 02" value={battlefieldStatus.aircraft02} />
          <div aria-label="Landing craft status" className="mt-2 border-t border-(--hud-edge) pt-2">
            <div className="flex justify-between gap-3 py-1 text-[10px] text-[#a7b5b1]">
              <span>LCAC 01</span>
              <strong className="font-mono text-[9px] text-(--ink) uppercase">{battlefieldStatus.lcacWest}</strong>
            </div>
            <div className="flex justify-between gap-3 py-1 text-[10px] text-[#a7b5b1]">
              <span>LCAC 02</span>
              <strong className="font-mono text-[9px] text-(--ink) uppercase">{battlefieldStatus.lcacEast}</strong>
            </div>
            <p className="my-1 font-mono text-[9px] leading-3.5 text-(--ink)" aria-label="West LAV group">
              West · {battlefieldStatus.lavWest}
            </p>
            <p className="my-1 font-mono text-[9px] leading-3.5 text-(--ink)" aria-label="East LAV group">
              East · {battlefieldStatus.lavEast}
            </p>
            <p className="my-1 font-mono text-[9px] leading-3.5 text-(--ink)">{battlefieldStatus.embarkedPayload}</p>
          </div>
        </div>
        <div className="faction-divider" />
        <div className="faction-block faction-island-defender">
          <p className="eyebrow">island_defender</p>
          <StatusRow label="Pantsir 01" value={battlefieldStatus.pantsir} />
          <div aria-label="Secondary Pantsir status" className="flex items-center justify-between gap-4 py-[3px] text-[10px] text-[#a7b5b1]">
            <span className="shrink-0">Pantsir 02</span>
            <strong className="max-w-[156px] truncate font-mono text-[9px] font-[550] tracking-[0.06em] text-(--ink) uppercase" title={battlefieldStatus.secondaryPantsir}>
              {battlefieldStatus.secondaryPantsir}
            </strong>
          </div>
          <StatusRow label="Search radar" value={battlefieldStatus.primaryRadar} />
          <StatusRow label="Talwar" value={battlefieldStatus.talwar} />
          <StatusRow label="Molniya" value={battlefieldStatus.molniya} />
          <StatusRow label="BTR-80 group" value={battlefieldStatus.btrGroup} />
          <StatusRow label="T-72B group" value={battlefieldStatus.t72Group} />
          <StatusRow label="Su-30MKK pair" value={battlefieldStatus.su30Group} />
          <div aria-label="Support convoy status" className="mt-2 border-t border-(--hud-edge) pt-2">
            <div className="flex items-start justify-between gap-3 text-[10px] text-[#a7b5b1]">
              <span className="shrink-0">Support convoy</span>
              <strong className="text-right font-mono text-[9px] leading-3.5 font-medium tracking-wide text-(--ink) uppercase">{battlefieldStatus.supportPhase}</strong>
            </div>
            <p className="mt-1 mb-1 font-mono text-[9px] leading-3.5 text-(--island)">{battlefieldStatus.supportOutcome}</p>
          </div>
          <StatusRow label="Industrial" value={battlefieldStatus.industrial} />
        </div>
      </aside>

      <nav className="hud-panel absolute top-[102px] left-5 max-h-[calc(100dvh-222px)] w-[184px] overflow-y-auto p-3 max-[1100px]:max-h-[calc(100dvh-270px)] max-[760px]:top-[91px] max-[760px]:left-3 max-[760px]:w-[156px]" aria-label="Camera presets">
        <p className="panel-label">Spectator camera</p>
        <div className="mt-2.5 grid gap-[3px]">
          {CAMERA_PRESETS.map(({ icon: Icon, id, label }) => (
            <button
              key={id}
              aria-pressed={activePreset === id}
              className="flex w-full items-center gap-2 border border-[#b0c8bf1f] bg-[#ffffff03] px-2 py-[7px] text-left text-[10px]! text-[#a8b9b3]! transition-colors hover:border-[#e9a94d70] hover:bg-[#e9a94d0f] hover:text-(--ink)! focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--amber-bright) aria-pressed:border-[#e9a94d8c] aria-pressed:bg-[#e9a94d1a] aria-pressed:text-(--amber-bright)!"
              onClick={() => requestPreset(id)}
              type="button"
            >
              <Icon aria-hidden="true" size={15} strokeWidth={1.7} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className="camera-hint">Drag to orbit · right-drag to pan · scroll to zoom</p>
      </nav>

      <section className="timeline-panel hud-panel" aria-label="Simulation timeline">
        <div aria-atomic="true" aria-live="polite" className="event-readout">
          <div>
            <p title={`Event ${latestEvent.code}`} className="m-0 truncate font-mono text-[9px] leading-[1.2] font-semibold tracking-[0.17em] text-(--muted) uppercase">
              Event {latestEvent.code}
            </p>
            <strong>{latestEvent.label}</strong>
          </div>
          <span>{formatTimelineBound(latestEvent.time)}</span>
        </div>

        <div className="timeline-control">
          <input aria-label="Seek simulation time" data-testid="timeline-slider" max={duration} min={0} onInput={(event) => onSeek(Number(event.currentTarget.value))} step={0.1} type="range" value={time} />
          <div aria-hidden="true" className="timeline-markers">
            {EVENT_TIMES.map((eventTime) => (
              <span key={eventTime} style={{ left: `${(eventTime / duration) * 100}%` }} />
            ))}
          </div>
          <div className="timeline-bounds">
            <span>T+00:00</span>
            <span>{formatTimelineBound(duration)}</span>
          </div>
        </div>

        <div className="transport-controls">
          <button aria-label={playing ? 'Pause simulation' : 'Play simulation'} className="transport-button transport-primary" data-testid="play-pause" onClick={onTogglePlayback} type="button">
            {playing ? <Pause aria-hidden="true" size={18} /> : <Play aria-hidden="true" size={18} />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button aria-label="Restart simulation" className="transport-button" onClick={onRestart} type="button">
            <RotateCcw aria-hidden="true" size={17} />
            <span>Restart</span>
          </button>
          <div className="speed-controls" aria-label="Playback speed" role="group">
            {([0.5, 1, 2] as const).map((value) => (
              <button key={value} aria-pressed={speed === value} onClick={() => onSpeedChange(value)} type="button">
                {value}×
              </button>
            ))}
          </div>
        </div>
      </section>

      <div aria-hidden="true" className="hud-reticle">
        <span />
      </div>
      <div className="absolute bottom-[102px] left-[220px] font-mono text-[9px] tracking-[0.15em] text-[#c2d1c088] uppercase max-[1100px]:bottom-[156px] max-[760px]:hidden">
        {time >= duration ? 'Script complete · aftermath pending Stage 6' : `LAV deployment · 51 events · T+00:00—${formatTimelineBound(duration).slice(2)}`}
      </div>
    </div>
  )
}
