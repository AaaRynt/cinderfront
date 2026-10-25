import { PerspectiveCamera, Vector3 } from 'three'

import { deriveRuntimeWorldState } from '@/simulation'

import type { Vec3 } from '../effects/BattleEffects'
import type { CameraPreset } from './cameraStore'

/** Presentation only. IDs, actors and their observation clocks stay authoritative. */
export const REGIONAL_FRAMES = {
  overview: { position: [500, 9500, -10500], target: [0, 80, -1200], subject: 'Entire coast and all five land regions', times: '0–7200+' },
  wasp: { position: [-4540, 130, -3020], target: [-4800, 18, -2700], subject: 'Wasp flight deck and offshore patrol', times: '0–7200+' },
  harbor: { position: [-4650, 650, 2700], target: [-3890, 40, 3560], subject: 'Harbor basin, berths and naval damage', times: '0–7200+' },
  talwar: { position: [-3950, 142, 3640], target: [-3766, 43, 3847], subject: 'Talwar intact, burning and flooded', times: '0–7200+' },
  industrial: { position: [400, 2600, -250], target: [400, 100, 2280], subject: 'Fuel and ammunition districts together', times: '0–7200+' },
  'fuel-storage': { position: [-2000, 900, 900], target: [-550, 120, 1950], subject: 'Tank shells, pool fires and full smoke crowns', times: '0–7200+' },
  ammunition: { position: [1800, 1000, 950], target: [1800, 85, 2100], subject: 'Magazines, cookoff and permanent damage', times: '0–7200+' },
  'radar-hill': { position: [3800, 1500, 2050], target: [3800, 165, 3750], subject: 'Radar ridge, search array and air-defense sites', times: '0–7200+' },
  'search-radar': { position: [3380, 305, 3960], target: [3550, 230, 4150], subject: 'Search array before and after T+46', times: '0–7200+' },
  corridor: { position: [4600, 1820, -2175], target: [4600, 80, 100], subject: 'Dry-wash bridge, trunk road and service yard', times: '0–7200+' },
  beachhead: { position: [4880, 1300, -1700], target: [4880, 25, -3020], subject: 'Both landing lanes from holding to inland holds', times: '0–360+, static holds thereafter' },
  'beach-offshore': { position: [4850, 1150, -4600], target: [4900, 35, -2920], subject: 'Both approaches, beach ramps and inland roads', times: '0–360+, static holds thereafter' },
} satisfies Partial<Record<CameraPreset, { position: Vec3; target: Vec3; subject: string; times: string }>>
export const FOLLOW_ROLES = {
  'lcac-west': ['West LCAC and open bow ramp', '0–188+'],
  'lcac-east': ['East LCAC and open bow ramp', '0–188+'],
  'lav-west': ['West lead LAV, transfer, bends and hold', '0–344+'],
  'lav-east': ['East lead LAV, transfer, bends and hold', '0–344+'],
  btr: ['BTR formation, loss and survivor hold', '0–188+'],
  t72: ['T-72 formation, strike and reverse hold', '0–182+'],
  'support-convoy': ['Six-vehicle convoy and bridge obstruction', '0–224+'],
  'secondary-pantsir': ['Pantsir relocation and wreck', '0–121+'],
  'f35-01': ['Primary F-35B launch, strikes and terminal egress', '0–departure'],
  'f35-02': ['Secondary F-35B launch, strikes and terminal egress', '0–departure'],
  su30: ['Su-30 pair, breakaway and terminal egress', '104–170+'],
  molniya: ['Molniya maneuver, withdrawal and terminal departure', '0–275+'],
} as const
export interface CameraFrame {
  position: Vector3
  target: Vector3
  anchor: Vector3
  yaw: number
  scale: number
  fov: number
  follows: boolean
}
const vector = (v: { x: number; y: number; z: number }) => new Vector3(v.x, v.y, v.z)

/** Keep the horizontal field at wide/short viewports; reserve top/bottom HUD bands. */
export function viewportFov(aspect: number) {
  return (2 * Math.atan(Math.tan((43 * Math.PI) / 360) * Math.min(1.12, 16 / 9 / Math.max(0.5, aspect))) * 180) / Math.PI
}
const landingFitCamera = new PerspectiveCamera()
/** Fit only the two landing regions, including shore context. Absolute runtime
 * bounds avoid a kilometer of empty approach water after unloading, while both
 * lanes and the complete current groups stay inside the unobscured viewport. */
function landingRegionFrame(preset: 'beachhead' | 'beach-offshore', w: ReturnType<typeof deriveRuntimeWorldState>, fov: number, aspect: number, height: number): CameraFrame {
  const actors = [...Object.values(w.landing.crafts), ...Object.values(w.landing.payload)]
  const xs = actors.map((a) => a.pose.position.x),
    zs = actors.map((a) => a.pose.position.z)
  const loX = Math.min(...xs) - 45,
    hiX = Math.max(...xs) + 45
  const loZ = Math.min(...zs, -2950) - 40,
    hiZ = Math.max(...zs, -2740) + 40
  const loY = Math.min(...actors.map((a) => a.pose.position.y)) - 2,
    hiY = Math.max(...actors.map((a) => a.pose.position.y)) + 12
  const target = new Vector3((loX + hiX) / 2, (loY + hiY) / 2, (loZ + hiZ) / 2)
  const template = REGIONAL_FRAMES[preset]
  const direction = new Vector3(...template.position).sub(new Vector3(...template.target)).normalize()
  let distance = 900
  const camera = landingFitCamera
  camera.fov = fov
  camera.aspect = aspect
  camera.near = 1
  camera.far = 25000
  camera.updateProjectionMatrix()
  // At all three requested sizes this reserves at least the 78px header and
  // 120px timeline bands. Horizontal margins also clear the optional details.
  const safeY = Math.min(1 - (2 * 78) / height, 1 - (2 * 120) / height) - 0.04
  for (let pass = 0; pass < 7; pass++) {
    camera.position.copy(target).addScaledVector(direction, distance)
    camera.lookAt(target)
    camera.updateMatrixWorld()
    let fit = 1
    for (const x of [loX, hiX])
      for (const y of [loY, hiY])
        for (const z of [loZ, hiZ]) {
          const p = new Vector3(x, y, z).project(camera)
          fit = Math.max(fit, Math.abs(p.x) / 0.88, Math.abs(p.y) / safeY)
        }
    if (fit <= 1.001) break
    distance *= Math.min(2, fit * 1.015)
  }
  return { position: target.clone().addScaledVector(direction, distance), target, anchor: target.clone(), yaw: 0, scale: distance / 1000, fov, follows: true }
}
export function cameraFrame(preset: CameraPreset, time: number, aspect = 16 / 9, viewportHeight = 720): CameraFrame {
  const fov = viewportFov(aspect)
  const viewportScale = Math.max(1, 1 + (720 / Math.max(240, viewportHeight) - 1) * 0.75)
  const w = deriveRuntimeWorldState(time)
  if (preset === 'beachhead' || preset === 'beach-offshore') return landingRegionFrame(preset, w, fov, aspect, viewportHeight)
  if (preset in REGIONAL_FRAMES) {
    const frame = REGIONAL_FRAMES[preset as keyof typeof REGIONAL_FRAMES]
    const position = new Vector3(...frame.position),
      target = new Vector3(...frame.target)
    if (preset === 'wasp') {
      const offset = new Vector3(w.wasp.pose.position.x + 4800, 0, w.wasp.pose.position.z + 2700)
      position.add(offset)
      target.add(offset)
    }
    const scale = viewportScale
    position.sub(target).multiplyScalar(scale).add(target)
    return { position, target, anchor: target.clone(), yaw: 0, scale, fov, follows: true }
  }
  const pose =
    preset === 'lav-west'
      ? w.landing.payload.attacker_lav_01.pose
      : preset === 'lav-east'
        ? w.landing.payload.attacker_lav_05.pose
        : preset === 'lcac-west'
          ? w.landing.crafts.attacker_lcac_01.pose
          : preset === 'lcac-east'
            ? w.landing.crafts.attacker_lcac_02.pose
            : preset === 'secondary-pantsir'
              ? w.secondaryPantsir.pose
              : preset === 'support-convoy'
                ? w.stage4b2c.camera.anchor
                : preset === 'su30'
                  ? w.stage4b2b.anchor
                  : preset === 'btr'
                    ? w.stage4b.btrGroup.vehicles.defender_btr_03.pose
                    : preset === 't72'
                      ? w.stage4b.t72Group.vehicles.defender_t72_02.pose
                      : preset === 'f35-01'
                        ? w.aircraft.attacker_f35_01.pose
                        : preset === 'f35-02'
                          ? w.aircraft.attacker_f35_02.pose
                          : w.stage3.molniya.pose
  const anchor = vector(pose.position),
    yaw = pose.rotation.y
  if (preset === 't72') {
    anchor.set(0, 0, 0)
    for (const vehicle of Object.values(w.stage4b.t72Group.vehicles)) anchor.addScaledVector(vector(vehicle.pose.position), 1 / 3)
  }
  const lav = preset === 'lav-west' || preset === 'lav-east',
    lcac = preset === 'lcac-west' || preset === 'lcac-east'
  const distance = lav ? -20 : lcac ? -32 : preset === 'secondary-pantsir' ? -26 : preset === 'support-convoy' ? 155 : preset === 'su30' ? 240 : preset === 'molniya' ? 105 : preset === 't72' ? 105 : preset === 'btr' ? 58 : 62
  const side = lav ? 20 : lcac ? 33 : preset === 'secondary-pantsir' ? 28 : preset === 'support-convoy' ? 210 : preset === 'su30' ? 105 : preset === 'molniya' ? 55 : preset === 't72' ? 46 : preset === 'btr' ? 25 : 31
  const height = lav ? 13 : lcac ? 26 : preset === 'secondary-pantsir' ? 19 : preset === 'support-convoy' ? 135 : preset === 'su30' ? 100 : preset === 'molniya' ? 42 : preset === 't72' ? 36 : preset === 'btr' ? 22 : 29
  const look = lav || lcac || preset === 'secondary-pantsir' || preset === 'support-convoy' || preset === 'su30' ? 0 : preset === 'molniya' ? 12 : preset === 't72' || preset === 'btr' ? 2 : 12
  const scale = viewportScale * (preset === 'support-convoy' ? w.stage4b2c.camera.framingScale : preset === 'su30' ? Math.sqrt(1 + (vector(w.aircraft.defender_su30_01.pose.position).distanceTo(vector(w.aircraft.defender_su30_02.pose.position)) / 310) ** 2) : 1)
  const forward = new Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)),
    right = new Vector3(forward.z, 0, -forward.x)
  const position = anchor
    .clone()
    .addScaledVector(forward, -distance * scale)
    .addScaledVector(right, side * scale)
  position.y += height * scale
  return { position, target: anchor.clone().addScaledVector(forward, look), anchor, yaw, scale, fov, follows: true }
}
export function followYawDelta(previous: number, current: number) {
  return Math.atan2(Math.sin(current - previous), Math.cos(current - previous))
}
