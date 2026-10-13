import type { ComponentProps } from 'react'

import { act, cleanup, render } from '@testing-library/react'
import { PerspectiveCamera, Vector3 } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { deriveSimulationWorldState, simulationStore } from '@/simulation'

import { CameraRig } from './CameraRig'
import { useCameraStore } from './cameraStore'

const harness = vi.hoisted(() => ({
  frame: undefined as (() => void) | undefined,
  camera: undefined as PerspectiveCamera | undefined,
  controls: undefined as { target: Vector3; update: () => void } | undefined,
}))

vi.mock('@react-three/fiber', () => ({
  useThree: (selector: (state: { camera: PerspectiveCamera }) => unknown) => selector({ camera: harness.camera! }),
  useFrame: (frame: () => void) => {
    harness.frame = frame
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

function propsAt(time: number): ComponentProps<typeof CameraRig> {
  const world = deriveSimulationWorldState(time)
  const position = world.secondaryPantsir.pose.position
  return {
    btrPosition: [0, 0, 0],
    f35Position: [0, 0, 0],
    f35SecondaryPosition: [0, 0, 0],
    molniyaPosition: [0, 0, 0],
    su30Position: [0, 0, 0],
    su30FramingScale: 1,
    su30YawRadians: 0,
    t72HullYawRadians: 0,
    t72Position: [0, 0, 0],
    supportPosition: [0, 0, 0],
    supportYawRadians: 0,
    supportFramingScale: 1,
    secondaryPantsirPosition: [position.x, position.y, position.z],
    secondaryPantsirYawRadians: world.secondaryPantsir.pose.rotation.y,
    lcacWestPosition: [world.landing.crafts.attacker_lcac_01.pose.position.x, world.landing.crafts.attacker_lcac_01.pose.position.y, world.landing.crafts.attacker_lcac_01.pose.position.z],
    lcacWestYawRadians: world.landing.crafts.attacker_lcac_01.pose.rotation.y,
    lcacEastPosition: [world.landing.crafts.attacker_lcac_02.pose.position.x, world.landing.crafts.attacker_lcac_02.pose.position.y, world.landing.crafts.attacker_lcac_02.pose.position.z],
    lcacEastYawRadians: world.landing.crafts.attacker_lcac_02.pose.rotation.y,
  }
}

beforeEach(() => {
  simulationStore.getState().restart()
  useCameraStore.getState().requestPreset('secondary-pantsir')
  harness.camera = new PerspectiveCamera(42, 16 / 9, 0.1, 30_000)
  harness.controls = { target: new Vector3(), update: vi.fn() }
  harness.frame = undefined
})
afterEach(cleanup)

describe('LCAC spectator follow', () => {
  it.each(['lcac-west', 'lcac-east'] as const)('preserves paused controls and cargo framing across seeks for %s', (preset) => {
    useCameraStore.getState().requestPreset(preset)
    const view = render(<CameraRig {...propsAt(0)} />),
      id = preset === 'lcac-west' ? 'attacker_lcac_01' : 'attacker_lcac_02'
    const origin = deriveSimulationWorldState(0).landing.crafts[id].pose.position,
      anchor = new Vector3(origin.x, origin.y, origin.z)
    const distance = harness.camera!.position.distanceTo(anchor)
    expect(distance).toBeGreaterThan(40)
    expect(distance).toBeLessThan(55)
    harness.camera!.position.add(new Vector3(2, 3, -1))
    harness.controls!.target.add(new Vector3(1, 0.5, 0))
    const cameraOffset = harness.camera!.position.distanceTo(anchor),
      targetOffset = harness.controls!.target.distanceTo(anchor)
    for (const time of [109.9, 110, 140, 148, 155, 159.9, 162, 165.9, 176, 0, 152.4, 0]) {
      act(() => simulationStore.getState().seek(time))
      view.rerender(<CameraRig {...propsAt(time)} />)
      act(() => harness.frame!())
      const p = deriveSimulationWorldState(time).landing.crafts[id].pose.position,
        current = new Vector3(p.x, p.y, p.z)
      expect(harness.camera!.position.distanceTo(current)).toBeCloseTo(cameraOffset, 8)
      expect(harness.controls!.target.distanceTo(current)).toBeCloseTo(targetOffset, 8)
      const pausedCamera = harness.camera!.position.toArray(),
        pausedTarget = harness.controls!.target.toArray()
      for (let i = 0; i < 10; i++) act(() => harness.frame!())
      expect(harness.camera!.position.toArray()).toEqual(pausedCamera)
      expect(harness.controls!.target.toArray()).toEqual(pausedTarget)
    }
  })
})

describe('secondary Pantsir spectator follow', () => {
  it('leaves paused spectator orbit, pan and zoom offsets untouched', () => {
    render(<CameraRig {...propsAt(0)} />)
    const target = new Vector3(...propsAt(0).secondaryPantsirPosition)
    expect(harness.controls!.target.distanceTo(target)).toBeLessThan(1e-9)
    expect(harness.camera!.position.distanceTo(target)).toBeGreaterThan(30)
    harness.camera!.position.add(new Vector3(8, 3, -12))
    harness.controls!.target.add(new Vector3(3, 2, -1))
    const pausedCamera = harness.camera!.position.clone()
    const pausedTarget = harness.controls!.target.clone()
    for (let frame = 0; frame < 30; frame++) act(() => harness.frame!())
    expect(harness.camera!.position.toArray()).toEqual(pausedCamera.toArray())
    expect(harness.controls!.target.toArray()).toEqual(pausedTarget.toArray())
  })

  it('translates and rotates existing spectator offsets across forward/backward seeks without resetting the preset', () => {
    const rendered = render(<CameraRig {...propsAt(0)} />)
    const origin = new Vector3(...propsAt(0).secondaryPantsirPosition)
    harness.camera!.position.add(new Vector3(7, 4, -9))
    harness.controls!.target.add(new Vector3(2, 1, -3))
    const cameraDistance = harness.camera!.position.distanceTo(origin)
    const targetDistance = harness.controls!.target.distanceTo(origin)
    for (const time of [112.1, 115, 120.9, 121, 176, 0, 121.1, 0]) {
      act(() => simulationStore.getState().seek(time))
      rendered.rerender(<CameraRig {...propsAt(time)} />)
      act(() => harness.frame!())
      const current = new Vector3(...propsAt(time).secondaryPantsirPosition)
      expect(harness.camera!.position.distanceTo(current), `camera offset at T+${time}`).toBeCloseTo(cameraDistance, 8)
      expect(harness.controls!.target.distanceTo(current), `pan offset at T+${time}`).toBeCloseTo(targetDistance, 8)
      expect(useCameraStore.getState().preset).toBe('secondary-pantsir')
    }
  })

  it('reframes the selected actor from the current timestamp only on an explicit preset request', () => {
    simulationStore.getState().seek(121.1)
    render(<CameraRig {...propsAt(121.1)} />)
    harness.camera!.position.add(new Vector3(15, 4, 3))
    harness.controls!.target.add(new Vector3(-5, 2, 1))
    act(() => useCameraStore.getState().requestPreset('secondary-pantsir'))
    const actor = new Vector3(...propsAt(121.1).secondaryPantsirPosition)
    expect(harness.controls!.target.distanceTo(actor)).toBeLessThan(1e-9)
    expect(harness.camera!.position.y - actor.y).toBeGreaterThan(15)
    expect(harness.controls!.update).toHaveBeenCalled()
  })
})
