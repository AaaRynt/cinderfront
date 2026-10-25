import { act, cleanup, render } from '@testing-library/react'
import { PerspectiveCamera, Vector3 } from 'three'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { deriveRuntimeWorldState, simulationStore } from '@/simulation'

import { CameraRig } from './CameraRig'
import { useCameraStore, type CameraPreset } from './cameraStore'

const harness = vi.hoisted(() => ({ frame: undefined as (() => void) | undefined, camera: undefined as PerspectiveCamera | undefined, controls: undefined as { target: Vector3; update: () => void } | undefined }))
function getHarnessState() {
  return { camera: harness.camera!, size: { width: 1280, height: 720 } }
}

vi.mock('@react-three/fiber', () => ({
  useThree: (selector: (state: { camera: PerspectiveCamera }) => unknown) => selector({ camera: harness.camera!, get: getHarnessState } as never),
  useFrame: (frame: () => void) => {
    harness.frame = () => (frame as unknown as (state: unknown, delta: number) => void)({ camera: harness.camera!, size: { width: 1280, height: 720 } }, 1 / 30)
  },
}))
vi.mock('@react-three/drei', async () => {
  const { forwardRef, useImperativeHandle } = await import('react')
  return {
    OrbitControls: forwardRef((_, ref) => {
      useImperativeHandle(ref, () => harness.controls)
      return null
    }),
  }
})
const tuple = (v: { x: number; y: number; z: number }): [number, number, number] => [v.x, v.y, v.z]
function propsAt(time: number) {
  const w = deriveRuntimeWorldState(time),
    tanks = Object.values(w.stage4b.t72Group.vehicles),
    tankCenter = tanks.reduce((p, v) => ({ x: p.x + v.pose.position.x / 3, y: p.y + v.pose.position.y / 3, z: p.z + v.pose.position.z / 3 }), { x: 0, y: 0, z: 0 })
  return {
    btrPosition: tuple(w.stage4b.btrGroup.vehicles.defender_btr_03.pose.position),
    f35Position: tuple(w.aircraft.attacker_f35_01.pose.position),
    f35SecondaryPosition: tuple(w.aircraft.attacker_f35_02.pose.position),
    molniyaPosition: tuple(w.stage3.molniya.pose.position),
    su30Position: tuple(w.stage4b2b.anchor.position),
    su30FramingScale: Math.sqrt(1 + (new Vector3(...tuple(w.aircraft.defender_su30_01.pose.position)).distanceTo(new Vector3(...tuple(w.aircraft.defender_su30_02.pose.position))) / 310) ** 2),
    su30YawRadians: w.stage4b2b.anchor.rotation.y,
    t72HullYawRadians: w.stage4b.t72Group.vehicles.defender_t72_02.pose.rotation.y,
    t72Position: tuple(tankCenter),
    supportPosition: tuple(w.stage4b2c.camera.anchor.position),
    supportYawRadians: w.stage4b2c.camera.anchor.rotation.y,
    supportFramingScale: w.stage4b2c.camera.framingScale,
    secondaryPantsirPosition: tuple(w.secondaryPantsir.pose.position),
    secondaryPantsirYawRadians: w.secondaryPantsir.pose.rotation.y,
    lavWestPosition: tuple(w.landing.payload.attacker_lav_01.pose.position),
    lavWestYawRadians: w.landing.payload.attacker_lav_01.pose.rotation.y,
    lavEastPosition: tuple(w.landing.payload.attacker_lav_05.pose.position),
    lavEastYawRadians: w.landing.payload.attacker_lav_05.pose.rotation.y,
    lcacWestPosition: tuple(w.landing.crafts.attacker_lcac_01.pose.position),
    lcacWestYawRadians: w.landing.crafts.attacker_lcac_01.pose.rotation.y,
    lcacEastPosition: tuple(w.landing.crafts.attacker_lcac_02.pose.position),
    lcacEastYawRadians: w.landing.crafts.attacker_lcac_02.pose.rotation.y,
  }
}
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
beforeEach(() => {
  simulationStore.getState().restart()
  harness.camera = new PerspectiveCamera(42, 16 / 9, 0.1, 30000)
  harness.controls = { target: new Vector3(), update: vi.fn() }
  harness.frame = undefined
})
afterEach(cleanup)
const presets: CameraPreset[] = [
  'overview',
  'wasp',
  'harbor',
  'talwar',
  'molniya',
  'industrial',
  'fuel-storage',
  'ammunition',
  'radar-hill',
  'search-radar',
  'corridor',
  'btr',
  't72',
  'beachhead',
  'beach-offshore',
  'f35-01',
  'f35-02',
  'su30',
  'support-convoy',
  'secondary-pantsir',
  'lcac-west',
  'lcac-east',
  'lav-west',
  'lav-east',
]
describe('Stage 6B aftermath spectator targets', () => {
  it('keeps the moving Wasp framed throughout the scripted patrol', () => {
    const view = render(<CameraRig />)
    for (const time of [0, 60, 160, 179.9, 180]) {
      act(() => simulationStore.getState().seek(time))
      view.rerender(<CameraRig />)
      act(() => useCameraStore.getState().requestPreset('wasp'))
      for (let i = 0; i < 10; i++) act(() => harness.frame!())
      act(() => harness.frame!())
      const p = deriveRuntimeWorldState(time).wasp.pose.position
      expect(harness.camera!.position.distanceTo(new Vector3(p.x + 260, 130, p.z - 320))).toBeLessThan(1e-9)
      expect(harness.controls!.target.distanceTo(new Vector3(p.x, 18, p.z))).toBeLessThan(1e-9)
    }
  })
  it('keeps the Wasp patrol framed across the handoff and direct seeks with free paused offsets', () => {
    act(() => simulationStore.getState().seek(180))
    useCameraStore.getState().requestPreset('wasp')
    const view = render(<CameraRig />)
    harness.camera!.position.add(new Vector3(7, 4, -3))
    harness.controls!.target.add(new Vector3(-2, 1, 3))
    const initial = new Vector3(-4800, 0, -2700),
      cameraOffset = harness.camera!.position.clone().sub(initial),
      targetOffset = harness.controls!.target.clone().sub(initial)
    for (const time of [180.001, 188, 240, 600, 7200, 180, 179, 0, 7200]) {
      act(() => simulationStore.getState().seek(time))
      view.rerender(<CameraRig />)
      act(() => harness.frame!())
      const w = deriveRuntimeWorldState(time).wasp.pose.position,
        anchor = new Vector3(w.x, 0, w.z)
      expect(harness.camera!.position.distanceTo(anchor.clone().add(cameraOffset))).toBeLessThan(1e-9)
      expect(harness.controls!.target.distanceTo(anchor.clone().add(targetOffset))).toBeLessThan(1e-9)
      const camera = harness.camera!.position.toArray(),
        target = harness.controls!.target.toArray()
      for (let i = 0; i < 10; i++) act(() => harness.frame!())
      expect(harness.camera!.position.toArray()).toEqual(camera)
      expect(harness.controls!.target.toArray()).toEqual(target)
    }
    act(() => useCameraStore.getState().requestPreset('wasp'))
    for (let i = 0; i < 10; i++) act(() => harness.frame!())
    const p = deriveRuntimeWorldState(7200).wasp.pose.position
    expect(harness.controls!.target.distanceTo(new Vector3(p.x, 18, p.z))).toBeLessThan(1e-9)
  })
  it('keeps every existing preset finite through direct late seeks and backward restoration', () => {
    const view = render(<CameraRig />)
    expect(presets).toHaveLength(24)
    for (const time of [180, 188, 240, 360, 600, 1800, 3600, 7200, 179, 160, 0]) {
      act(() => simulationStore.getState().seek(time))
      view.rerender(<CameraRig />)
      for (const preset of presets) {
        act(() => useCameraStore.getState().requestPreset(preset))
        act(() => harness.frame!())
        expect(harness.camera!.position.toArray().every(Number.isFinite)).toBe(true)
        expect(harness.controls!.target.toArray().every(Number.isFinite)).toBe(true)
        expect(harness.camera!.position.distanceTo(harness.controls!.target)).toBeGreaterThan(6)
      }
    }
  })
  it.each(['f35-01', 'f35-02', 'molniya'] as const)('retains finite final framing and free paused offsets after %s departs', (preset) => {
    act(() => simulationStore.getState().seek(180))
    useCameraStore.getState().requestPreset(preset)
    const view = render(<CameraRig />)
    harness.camera!.position.add(new Vector3(7, 4, -3))
    harness.controls!.target.add(new Vector3(-2, 1, 3))
    const key = preset === 'f35-01' ? 'f35Position' : preset === 'f35-02' ? 'f35SecondaryPosition' : 'molniyaPosition'
    const initial = new Vector3(...propsAt(180)[key]),
      distance = harness.camera!.position.distanceTo(initial),
      targetDistance = harness.controls!.target.distanceTo(initial)
    for (const time of [181, 188, 240, 360, 600, 1800, 3600, 7200, 180, 179, 160, 0, 7200]) {
      act(() => simulationStore.getState().seek(time))
      view.rerender(<CameraRig />)
      act(() => harness.frame!())
      const anchor = new Vector3(...propsAt(time)[key])
      expect(harness.camera!.position.distanceTo(anchor)).toBeCloseTo(distance, 7)
      expect(harness.controls!.target.distanceTo(anchor)).toBeCloseTo(targetDistance, 7)
      const camera = harness.camera!.position.toArray(),
        target = harness.controls!.target.toArray()
      for (let i = 0; i < 10; i++) act(() => harness.frame!())
      expect(harness.camera!.position.toArray()).toEqual(camera)
      expect(harness.controls!.target.toArray()).toEqual(target)
    }
  })
})
