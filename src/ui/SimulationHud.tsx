import { Camera, Map, Pause, Plane, Play, Radar, RotateCcw, Ship, Warehouse } from 'lucide-react'

import type { CameraPreset } from '@/scene/camera/cameraStore'
import type { SimulationSpeed, Stage1EventId } from '@/simulation'

import { useCameraStore } from '@/scene/camera/cameraStore'
import { STAGE1_EVENTS } from '@/simulation'

interface TimelineEventView {
  code: Stage1EventId
  label: string
  time: number
}

interface BattlefieldStatus {
  aircraft01: string
  aircraft02: string
  pantsir: string
  primaryRadar: string
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

const EVENT_TIMES = STAGE1_EVENTS.map((event) => event.atSeconds)

const CAMERA_PRESETS: ReadonlyArray<{
  icon: typeof Map
  id: CameraPreset
  label: string
}> = [
  { icon: Map, id: 'overview', label: 'Overview' },
  { icon: Ship, id: 'wasp', label: 'Wasp' },
  { icon: Warehouse, id: 'harbor', label: 'Harbor' },
  { icon: Camera, id: 'radar-hill', label: 'Radar Hill' },
  { icon: Radar, id: 'search-radar', label: 'Search radar' },
  { icon: Plane, id: 'f35-01', label: 'F-35B 01' },
]

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
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
            <p className="eyebrow">Cinderfront / Stage 01</p>
            <h1>Ash Harbor</h1>
          </div>
        </div>
        <div className="mission-clock" data-testid="mission-clock">
          <span>{relativeTime}</span>
          <strong>{localTime}</strong>
        </div>
      </header>

      <aside className="faction-panel hud-panel" aria-label="Operational status">
        <div className="faction-block faction-landings-attacker">
          <p className="eyebrow">landings_attacker</p>
          <StatusRow label="F-35B 01" value={battlefieldStatus.aircraft01} />
          <StatusRow label="F-35B 02" value={battlefieldStatus.aircraft02} />
        </div>
        <div className="faction-divider" />
        <div className="faction-block faction-island-defender">
          <p className="eyebrow">island_defender</p>
          <StatusRow label="Pantsir-S1" value={battlefieldStatus.pantsir} />
          <StatusRow label="Search radar" value={battlefieldStatus.primaryRadar} />
        </div>
      </aside>

      <nav className="camera-panel hud-panel" aria-label="Camera presets">
        <p className="panel-label">Spectator camera</p>
        <div className="camera-buttons">
          {CAMERA_PRESETS.map(({ icon: Icon, id, label }) => (
            <button key={id} aria-pressed={activePreset === id} className="camera-button" onClick={() => requestPreset(id)} type="button">
              <Icon aria-hidden="true" size={15} strokeWidth={1.7} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className="camera-hint">Drag to orbit · right-drag to pan · scroll to zoom</p>
      </nav>

      <section className="timeline-panel hud-panel" aria-label="Simulation timeline">
        <div className="event-readout">
          <div>
            <p className="eyebrow">Event {latestEvent.code}</p>
            <strong>{latestEvent.label}</strong>
          </div>
          <span>T+{String(latestEvent.time).padStart(2, '0')}</span>
        </div>

        <div className="timeline-control">
          <input aria-label="Seek simulation time" data-testid="timeline-slider" max={duration} min={0} onChange={(event) => onSeek(Number(event.target.value))} step={0.1} type="range" value={time} />
          <div aria-hidden="true" className="timeline-markers">
            {EVENT_TIMES.map((eventTime) => (
              <span key={eventTime} style={{ left: `${(eventTime / duration) * 100}%` }} />
            ))}
          </div>
          <div className="timeline-bounds">
            <span>T+00:00</span>
            <span>T+00:48</span>
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
      <div className="stage-notice">Opening vertical slice · T+00:00—00:48</div>
    </div>
  )
}
