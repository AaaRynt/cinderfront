import { Camera, Factory, Map, Pause, Plane, Play, Radar, Route, RotateCcw, Ship, Warehouse, Waves } from 'lucide-react'
import { useState } from 'react'

import type { CameraPreset } from '@/scene/camera/cameraStore'
import type { SimulationEvent, SimulationSpeed } from '@/simulation'

import { useCameraStore } from '@/scene/camera/cameraStore'
import { formatRuntimeTime, quantizeRuntimeTime, SIMULATION_EVENTS } from '@/simulation'

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
    <div className="status-row grid grid-cols-[88px_1fr] items-start gap-3 py-1.5 text-[11px] leading-4">
      <span>{label}</span>
      <strong className="font-mono text-[11px] font-medium break-words text-(--ink) uppercase">{value}</strong>
    </div>
  )
}

function formatTimelineBound(timeSeconds: number) {
  const minutes = Math.floor(timeSeconds / 60)
  const seconds = Math.floor(timeSeconds % 60)
  return `T+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function SimulationHud({ battlefieldStatus, duration, latestEvent, localTime, onRestart, onSeek, onSpeedChange, onTogglePlayback, playing, relativeTime, speed, time }: SimulationHudProps) {
  const [observationDraft, setObservationDraft] = useState<string | null>(null)
  const activePreset = useCameraStore((state) => state.preset)
  const requestPreset = useCameraStore((state) => state.requestPreset)

  return (
    <div className="hud-shell">
      <header className="hud-panel absolute top-3 right-3 left-3 flex min-h-[58px] items-center justify-between gap-4 px-3 py-2">
        <div className="flex shrink-0 items-center gap-3">
          <div aria-hidden="true" className="grid size-9 place-items-center border border-[#e9a94d70] bg-[#e9a94d12] font-mono text-[11px] font-bold text-(--amber-bright)">
            CF
          </div>
          <div>
            <p className="m-0 font-mono text-[9px] leading-[1.2] font-semibold tracking-[0.17em] text-(--muted) uppercase">Cinderfront / Stage 6C</p>
            <h1 className="m-0 mt-1 text-[15px] leading-none font-semibold tracking-wider uppercase">Ash Harbor</h1>
          </div>
        </div>
        <nav className="ml-auto flex items-center gap-2" aria-label="Camera presets">
          <label className="font-mono text-[10px] text-(--muted) max-[760px]:sr-only" htmlFor="camera-select">
            Spectator camera
          </label>
          <select
            id="camera-select"
            aria-label="Spectator camera"
            className="min-h-9 w-[190px] border border-(--hud-edge) bg-[#101e24] px-2 text-[12px] text-(--amber-bright) focus-visible:outline-2 focus-visible:outline-(--amber-bright) max-[760px]:w-[140px]"
            value={activePreset}
            onChange={(event) => requestPreset(event.target.value as CameraPreset)}
          >
            {[
              ['Regional overview', ['overview', 'harbor', 'industrial', 'radar-hill', 'corridor', 'beachhead', 'beach-offshore']],
              ['Naval focus', ['wasp', 'talwar', 'molniya']],
              ['Sites and ground vehicles', ['fuel-storage', 'ammunition', 'search-radar', 'btr', 't72', 'support-convoy', 'secondary-pantsir']],
              ['Landing focus', ['lcac-west', 'lcac-east', 'lav-west', 'lav-east']],
              ['Aircraft', ['f35-01', 'f35-02', 'su30']],
            ].map(([label, ids]) => (
              <optgroup key={label as string} label={label as string}>
                {(ids as string[]).map((id) => {
                  const item = CAMERA_PRESETS.find((item) => item.id === id)!
                  return (
                    <option key={id} value={id}>
                      {item.label}
                    </option>
                  )
                })}
              </optgroup>
            ))}
          </select>
          <button type="button" aria-label="Recenter selected camera" title="Recenter selected camera" className="grid size-9 place-items-center border border-(--hud-edge) text-(--muted) hover:text-(--amber-bright)" onClick={() => requestPreset(activePreset)}>
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </nav>
        <div className="flex shrink-0 flex-col border-l border-(--hud-edge) pl-4 text-right font-mono max-[760px]:hidden" data-testid="mission-clock">
          <span className="text-[17px] text-(--amber-bright)">{relativeTime}</span>
          <strong className="text-[10px] font-normal text-(--muted)">{localTime}</strong>
        </div>
      </header>

      <aside className="absolute top-[82px] right-3 w-[300px] max-[760px]:w-[260px]" aria-label="Operational status">
        <p className="hud-panel m-0 mb-2 px-3 py-2 font-mono text-[11px] leading-4 text-(--ink)" aria-label="Deployment summary">
          {battlefieldStatus.embarkedPayload}
        </p>
        <details className="hud-panel group">
          <summary className="cursor-pointer px-3 py-2 font-mono text-[11px] text-(--ink) marker:text-(--amber-bright)">
            Operational details <span className="float-right text-(--amber-bright)">8 LAV-25s</span>
          </summary>
          <div className="max-h-[calc(100dvh-310px)] overflow-y-auto overscroll-contain border-t border-(--hud-edge) px-3 py-2" tabIndex={0} data-hud-scroll aria-label="Full operational details">
            <div className="faction-block faction-landings-attacker">
              <p className="my-2 font-mono text-[10px] tracking-wider text-(--landings) uppercase">landings_attacker</p>
              <StatusRow label="F-35B 01" value={battlefieldStatus.aircraft01} />
              <StatusRow label="F-35B 02" value={battlefieldStatus.aircraft02} />
              <div aria-label="Landing craft status" className="mt-2 border-t border-(--hud-edge) pt-2">
                <div className="flex justify-between gap-3 py-1 text-[10px] text-[#a7b5b1]">
                  <span>LCAC 01</span>
                  <strong className="font-mono text-[11px] text-(--ink) uppercase">{battlefieldStatus.lcacWest}</strong>
                </div>
                <div className="flex justify-between gap-3 py-1 text-[10px] text-[#a7b5b1]">
                  <span>LCAC 02</span>
                  <strong className="font-mono text-[11px] text-(--ink) uppercase">{battlefieldStatus.lcacEast}</strong>
                </div>
                <p className="my-1 font-mono text-[11px] leading-4 text-(--ink)" aria-label="West LAV group">
                  West · {battlefieldStatus.lavWest}
                </p>
                <p className="my-1 font-mono text-[11px] leading-4 text-(--ink)" aria-label="East LAV group">
                  East · {battlefieldStatus.lavEast}
                </p>
                <p className="my-1 font-mono text-[11px] leading-4 text-(--ink)">{battlefieldStatus.embarkedPayload}</p>
              </div>
            </div>
            <div className="my-2 border-t border-(--hud-edge)" />
            <div className="faction-block faction-island-defender">
              <p className="my-2 font-mono text-[10px] tracking-wider text-(--island) uppercase">island_defender</p>
              <StatusRow label="Pantsir 01" value={battlefieldStatus.pantsir} />
              <div aria-label="Secondary Pantsir status" className="flex items-center justify-between gap-4 py-[3px] text-[10px] text-[#a7b5b1]">
                <span className="shrink-0">Pantsir 02</span>
                <strong className="text-right font-mono text-[10px] leading-4 font-medium break-words text-(--ink) uppercase" title={battlefieldStatus.secondaryPantsir}>
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
                  <strong className="text-right font-mono text-[11px] leading-4 font-medium tracking-wide text-(--ink) uppercase">{battlefieldStatus.supportPhase}</strong>
                </div>
                <p className="mt-1 mb-1 font-mono text-[11px] leading-4 text-(--island)">{battlefieldStatus.supportOutcome}</p>
              </div>
              <StatusRow label="Industrial" value={battlefieldStatus.industrial} />
            </div>
          </div>
        </details>
      </aside>

      <section className="hud-panel absolute right-3 bottom-3 left-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 px-3 py-2 max-[900px]:grid-cols-1" aria-label="Simulation timeline">
        <div aria-atomic="true" aria-live="polite" className="flex min-w-0 items-start justify-between gap-3">
          <div>
            <p title={`Event ${latestEvent.code}`} className="sr-only">
              Event {latestEvent.code}
            </p>
            <strong className="block text-[12px] leading-4 font-medium break-words">{latestEvent.label}</strong>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-(--amber)">{formatTimelineBound(latestEvent.time)}</span>
        </div>

        <div className="timeline-control col-span-full row-start-2 max-[900px]:row-start-3">
          <input aria-label="Seek simulation time" data-testid="timeline-slider" max={duration} min={0} onInput={(event) => onSeek(Number(event.currentTarget.value))} step={0.1} type="range" value={Math.min(time, duration)} />
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

        <div className="flex items-center justify-end gap-1.5">
          <form
            className="flex items-center gap-1.5 font-mono text-[9px] text-(--muted)"
            onSubmit={(event) => {
              event.preventDefault()
              if (observationDraft !== null && observationDraft.trim() !== '') {
                const value = Number(observationDraft)
                if (Number.isFinite(value)) onSeek(quantizeRuntimeTime(value))
              }
              setObservationDraft(null)
            }}
          >
            <label className="max-[760px]:sr-only" htmlFor="observation-time">
              Observe s
            </label>
            <input
              aria-label="Observation time in seconds"
              className="w-[76px] border border-(--hud-edge) bg-[#071116] px-1.5 py-2 text-(--ink)"
              id="observation-time"
              min="0"
              onChange={(event) => setObservationDraft(event.currentTarget.value)}
              onFocus={() => setObservationDraft(String(quantizeRuntimeTime(time)))}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setObservationDraft(null)
                  event.currentTarget.blur()
                }
              }}
              step="0.1"
              type="number"
              value={observationDraft ?? quantizeRuntimeTime(time)}
            />
            <button aria-label="Seek observation time" className="inline-flex min-h-9 items-center justify-center gap-2 border border-(--hud-edge) px-2 text-[10px] text-(--muted) hover:bg-(--hud-soft)" type="submit">
              Go
            </button>
          </form>
          <button aria-label={playing ? 'Pause simulation' : 'Play simulation'} className="inline-flex min-h-9 items-center gap-2 border border-[#e9a94d70] bg-[#e9a94d20] px-3 text-[11px] text-(--amber-bright)" data-testid="play-pause" onClick={onTogglePlayback} type="button">
            {playing ? <Pause aria-hidden="true" size={18} /> : <Play aria-hidden="true" size={18} />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button aria-label="Restart simulation" className="inline-flex min-h-9 items-center justify-center gap-2 border border-(--hud-edge) px-2 text-[10px] text-(--muted) hover:bg-(--hud-soft)" onClick={onRestart} type="button">
            <RotateCcw aria-hidden="true" size={17} />
            <span>Restart</span>
          </button>
          <div className="flex min-h-9 border border-(--hud-edge)" aria-label="Playback speed" role="group">
            {([0.5, 1, 2] as const).map((value) => (
              <button className="min-w-10 border-r border-(--hud-edge) px-2 font-mono text-[11px] text-(--muted) last:border-r-0 hover:bg-(--hud-soft) aria-pressed:bg-[#e9a94d20] aria-pressed:text-(--amber-bright)" key={value} aria-pressed={speed === value} onClick={() => onSpeedChange(value)} type="button">
                {value}×
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="pointer-events-none absolute top-[82px] left-3 max-w-[calc(100%-340px)] font-mono text-[10px] leading-4 text-[#c2d1c0] max-[760px]:max-w-[calc(100%-290px)]">
        <p className="m-0 text-(--amber-bright)">{time >= duration ? 'AFTERMATH OBSERVATION' : 'SCRIPTED OPERATION'}</p>
        <p className="m-0">{time >= duration ? `Elapsed ${formatRuntimeTime(time - duration).slice(2)} · 51 events complete` : '51 events · 0–180 s'}</p>
        <p className="m-0 mt-1 text-[#9daea9]">Orbit · right-drag pan · scroll zoom</p>
      </div>
    </div>
  )
}
