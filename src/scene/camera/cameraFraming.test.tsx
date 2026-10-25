import { Box3, Group, PerspectiveCamera, Vector3 } from 'three'
import { beforeAll, describe, expect, it } from 'vitest'

import { deriveRuntimeWorldState } from '@/simulation'

import { appendModel } from '../../test/inspectModel'
import { createLandingModelResources } from '../vehicles/landingModelResources'
import { LandingVehicleModels } from '../vehicles/LandingModels'
import { getLandingSupportHeight } from '../world/landing/landingTerrain'
import { FUEL_TANKS, AMMUNITION_BUNKERS, CORRIDOR_FEATURES } from '../world/stage2/stage2Data'
import { getTerrainHeight } from '../world/stage2/terrainModel'
import { AAA_SITE, RADAR_SEARCH_SITE, RADAR_TRACKING_SITE, SAM_PAD_POSITIONS } from '../world/worldData'
import { cameraFrame, FOLLOW_ROLES, REGIONAL_FRAMES, viewportFov } from './cameraFraming'
import { shadowCoverage } from './shadowCoverage'
const sizes = [
  [1280, 720],
  [1280, 540],
  [1440, 900],
] as const
const times = [0, 110, 140, 148, 155, 162, 176, 180, 188, 210, 250, 300, 345, 7200]
beforeAll(() => {
  deriveRuntimeWorldState(0)
})
beforeAll(() => {
  deriveRuntimeWorldState(188)
})
beforeAll(() => {
  deriveRuntimeWorldState(210)
})
beforeAll(() => {
  deriveRuntimeWorldState(240)
})
function projection(preset: Parameters<typeof cameraFrame>[0], time: number, width: number, height: number) {
  const frame = cameraFrame(preset, time, width / height, height),
    camera = new PerspectiveCamera(frame.fov, width / height, 1, 25000)
  camera.position.copy(frame.position)
  camera.lookAt(frame.target)
  camera.updateMatrixWorld()
  return { frame, camera }
}
describe('active viewport camera framing and sight lines', () => {
  it('documents the subject/time role of all 24 existing IDs and bounds the single shadow map', () => {
    expect(Object.keys(REGIONAL_FRAMES).length + Object.keys(FOLLOW_ROLES).length).toBe(24)
    expect(shadowCoverage(10)).toBe(180)
    expect(shadowCoverage(1e6)).toBe(2200)
    expect(viewportFov(1280 / 540)).toBeLessThan(viewportFov(1280 / 720))
  })
  it.each(sizes)('keeps actual LCAC ramps, machinery and all LAV bounds inside both beach views at %s×%s', (width, height) => {
    const resources = createLandingModelResources()
    try {
      for (const time of times) {
        const w = deriveRuntimeWorldState(time),
          root = new Group()
        appendModel(root, <LandingVehicleModels landing={w.landing} resources={resources} />)
        root.updateMatrixWorld(true)
        for (const preset of ['beachhead', 'beach-offshore'] as const) {
          const { camera } = projection(preset, time, width, height)
          for (const actor of root.children[0]!.children) {
            const box = new Box3().setFromObject(actor)
            for (const x of [box.min.x, box.max.x])
              for (const y of [box.min.y, box.max.y])
                for (const z of [box.min.z, box.max.z]) {
                  const p = new Vector3(x, y, z).project(camera),
                    sx = (p.x + 1) / 2,
                    sy = (1 - p.y) / 2
                  expect(sx, `${preset}/${time}/${actor.name} x`).toBeGreaterThan(0.035)
                  expect(sx, `${preset}/${time}/${actor.name} x`).toBeLessThan(0.965)
                  expect(sy, `${preset}/${time}/${actor.name} top`).toBeGreaterThan(78 / height)
                  expect(sy, `${preset}/${time}/${actor.name} bottom`).toBeLessThan(1 - 120 / height)
                }
          }
        }
      }
    } finally {
      resources.dispose()
    }
  })
  it('keeps both landing lanes above the actual uploaded terrain, including beaching and final holds', () => {
    for (const time of times) {
      const w = deriveRuntimeWorldState(time)
      for (const preset of ['beachhead', 'beach-offshore', 'lcac-west', 'lcac-east', 'lav-west', 'lav-east'] as const) {
        const { frame } = projection(preset, time, 1280, 720)
        const subjects = preset.startsWith('lcac')
          ? [w.landing.crafts[preset === 'lcac-west' ? 'attacker_lcac_01' : 'attacker_lcac_02']]
          : preset.startsWith('lav')
            ? [w.landing.payload[preset === 'lav-west' ? 'attacker_lav_01' : 'attacker_lav_05']]
            : [...Object.values(w.landing.crafts), w.landing.payload.attacker_lav_01, w.landing.payload.attacker_lav_05]
        for (const subject of subjects) {
          const p = subject.pose.position,
            to = new Vector3(p.x, p.y + 3, p.z),
            distance = frame.position.distanceTo(to)
          for (let d = 0; d < distance - 4; d += Math.max(2, distance / 80)) {
            const point = frame.position.clone().lerp(to, d / distance)
            expect(point.y - getLandingSupportHeight(point.x, point.z), `${preset}/${time} terrain`).toBeGreaterThan(0.1)
          }
        }
      }
    }
  })
  it('derives follow headings and targets from current runtime independent of seek history', () => {
    for (const time of [180, 181, 188, 240, 360, 7200, 137, 0])
      for (const preset of Object.keys(FOLLOW_ROLES) as (keyof typeof FOLLOW_ROLES)[]) {
        const frame = cameraFrame(preset, time),
          again = cameraFrame(preset, time)
        expect(frame.position.toArray()).toEqual(again.position.toArray())
        expect(frame.position.toArray().every(Number.isFinite)).toBe(true)
        expect(frame.position.distanceTo(frame.target)).toBeGreaterThan(6)
      }
  })
  it.each(sizes)('keeps tank/magazine footprints and all four radar installations inside HUD margins at %s×%s', (width, height) => {
    const tanks = FUEL_TANKS.flatMap((tank) => [-1, 1].flatMap((x) => [-1, 1].flatMap((z) => [0, tank.heightM].map((y) => new Vector3(tank.center[0] + x * tank.radiusM, getTerrainHeight(tank.center[0], tank.center[1]) + y, tank.center[1] + z * tank.radiusM)))))
    tanks.push(new Vector3(-650, 450, 2200), new Vector3(-400, 500, 2300), new Vector3(-950, 370, 2180))
    const magazines = AMMUNITION_BUNKERS.flatMap((bunker) => bunker.footprint.flatMap(([x, z]) => [0, 10].map((y) => new Vector3(x, getTerrainHeight(x, z) + y, z))))
    const radar = [RADAR_SEARCH_SITE.position, RADAR_TRACKING_SITE.position, SAM_PAD_POSITIONS[0].position, AAA_SITE.position].flatMap((p) => [-40, 40].flatMap((x) => [-40, 40].flatMap((z) => [0, 30].map((y) => new Vector3(p[0] + x, p[1] + y, p[2] + z)))))
    for (const [preset, points] of [
      ['industrial', [...tanks, ...magazines]],
      ['radar-hill', radar],
      ['fuel-storage', tanks],
      ['ammunition', magazines],
    ] as const) {
      const { camera } = projection(preset, 0, width, height)
      for (const point of points) {
        const p = point.clone().project(camera),
          x = (p.x + 1) / 2,
          y = (1 - p.y) / 2
        expect(x, `${preset} left`).toBeGreaterThan(0.035)
        expect(x, `${preset} right`).toBeLessThan(0.965)
        expect(y, `${preset} header`).toBeGreaterThan(78 / height)
        expect(y, `${preset} timeline`).toBeLessThan(1 - 120 / height)
        expect(x * width > 948 && y * height < 192, `${preset} status overlap`).toBe(false)
      }
    }
  })
  it.each(sizes)('retains harbor ships, bridge/service yard, Wasp patrol and the tank formation at %s×%s', (width, height) => {
    for (const time of [0, 60, 139, 150, 180, 188, 600, 7200]) {
      const w = deriveRuntimeWorldState(time)
      const points = (p: { x: number; y: number; z: number }, radius: number, top: number) => [-radius, radius].flatMap((x) => [-radius, radius].flatMap((z) => [0, top].map((y) => new Vector3(p.x + x, p.y + y, p.z + z))))
      const patrol = [-19, 19].flatMap((x) => [-133, 133].flatMap((z) => [-9, 50].map((y) => new Vector3(x, y, z).applyAxisAngle(new Vector3(0, 1, 0), w.wasp.pose.rotation.y).add(new Vector3(w.wasp.pose.position.x, w.wasp.pose.position.y, w.wasp.pose.position.z)))))
      const corridor = [...CORRIDOR_FEATURES.bridge, ...CORRIDOR_FEATURES.serviceYard].map(([x, z]) => new Vector3(x, getTerrainHeight(x, z) + 8, z))
      // The regional basin covers both berths. Molniya's moving/departing hull
      // is then covered by its existing close follow, not an expanding region.
      const naval = [...points(w.stage3.talwar.pose.position, 65, 40), ...(time <= 62 ? points(w.stage3.molniya.pose.position, 32, 22) : [])]
      const tanks = Object.values(w.stage4b.t72Group.vehicles).flatMap((v) => points(v.pose.position, 5, 4))
      for (const [preset, subjects] of [
        ['harbor', naval],
        ['corridor', corridor],
        ['wasp', patrol],
        ['t72', tanks],
      ] as const) {
        const { camera } = projection(preset, time, width, height)
        for (const point of subjects) {
          const p = point.project(camera),
            x = (p.x + 1) / 2,
            y = (1 - p.y) / 2
          expect(x, `${preset}/${time} left`).toBeGreaterThan(0.035)
          expect(x, `${preset}/${time} right`).toBeLessThan(0.965)
          expect(y, `${preset}/${time} header`).toBeGreaterThan(78 / height)
          expect(y, `${preset}/${time} timeline`).toBeLessThan(1 - 120 / height)
          expect(x * width > width - 332 && y * height < 178, `${preset}/${time} status overlap`).toBe(false)
        }
      }
    }
  })
  it.each(sizes)('retains both Su-30 hull envelopes through the paired pass, damage and breakaway at %s×%s', (width, height) => {
    for (const time of [104, 110, 125, 132, 137, 140, 150, 160, 170, 176]) {
      const w = deriveRuntimeWorldState(time),
        { camera } = projection('su30', time, width, height)
      for (const aircraft of Object.values(w.stage4b2b.aircraft)) {
        for (const x of [-12, 12])
          for (const y of [-5, 5])
            for (const z of [-12, 12]) {
              const p = new Vector3(aircraft.pose.position.x + x, aircraft.pose.position.y + y, aircraft.pose.position.z + z).project(camera)
              expect((p.x + 1) / 2, `su30/${time} left`).toBeGreaterThan(0.035)
              expect((p.x + 1) / 2, `su30/${time} right`).toBeLessThan(0.965)
              expect((1 - p.y) / 2, `su30/${time} header`).toBeGreaterThan(78 / height)
              expect((1 - p.y) / 2, `su30/${time} timeline`).toBeLessThan(1 - 120 / height)
            }
      }
    }
  })
})
