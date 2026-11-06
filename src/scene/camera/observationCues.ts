import type { CameraPreset } from './cameraStore'

export interface ObservationCue {
  readonly atSeconds: number
  readonly preset: CameraPreset
  readonly title: string
  readonly subject: string
  readonly highlight?: true
}

// Presentation cues use the observation clock. The authored events keep
// their own times, including the scripted endpoint and the final transfers.
export const OBSERVATION_CUES: readonly ObservationCue[] = [
  { atSeconds: 0, preset: 'wasp', title: 'Offshore opening', subject: 'Wasp and the first F-35B launch' },
  { atSeconds: 11, preset: 'f35-02', title: 'Second aircraft departs', subject: 'F-35B 02 lifting from the deck' },
  { atSeconds: 21.5, preset: 'radar-hill', title: 'Radar Hill engagement', subject: 'Air-defense sites and missile launch' },
  { atSeconds: 53, preset: 'inspection-bay', title: 'Inspection bay pass', subject: 'Six convoy trucks pass the roadside bay', highlight: true },
  { atSeconds: 64, preset: 'support-convoy', title: 'Convoy continues inland', subject: 'The support convoy leaves the bay' },
  { atSeconds: 90, preset: 'fuel-shock', title: 'Fuel shock', subject: 'The T+92 front reaches two groups of trees', highlight: true },
  { atSeconds: 115, preset: 'ammunition', title: 'Ammunition cook-off', subject: 'Magazine fires and the T+132 main detonation' },
  { atSeconds: 152, preset: 'shore-break', title: 'Shore break', subject: 'The crest breaks beside the east landing craft', highlight: true },
  { atSeconds: 164, preset: 'lav-east', title: 'LAV deployment', subject: 'The lead east LAV rolls down the bow ramp', highlight: true },
  { atSeconds: 173, preset: 'lcac-east', title: 'Final ramp transfers', subject: 'LCAC 02 and the remaining LAVs ashore' },
]

export const HIGHLIGHT_CUES = OBSERVATION_CUES.filter((cue) => cue.highlight)

export function observationCueAt(timeSeconds: number): ObservationCue {
  return OBSERVATION_CUES.findLast((cue) => cue.atSeconds <= timeSeconds) ?? OBSERVATION_CUES[0]!
}
