import { act, cleanup, render } from '@testing-library/react'
import { PerspectiveCamera, Scene } from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { simulationStore } from '@/simulation'

import { readinessStore } from './readinessStore'
import { SceneReadiness } from './SceneReadiness'
const harness = vi.hoisted(() => ({ root: null as unknown, prepare: vi.fn(), frames: [] as FrameRequestCallback[] }))
vi.mock('@react-three/fiber', () => ({ useThree: (select: (s: unknown) => unknown) => select(harness.root) }))
vi.mock('./rendererPreparation', () => ({ createRendererPreparation: (...args: unknown[]) => harness.prepare(...args) }))
beforeEach(() => {
  readinessStore.setState({ phase: 'preparing', generation: 0, retryVersion: 0 })
  harness.frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    harness.frames.push(callback)
    return harness.frames.length
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    harness.frames[id - 1] = () => {}
  })
  harness.prepare.mockReset()
  harness.root = { gl: { domElement: document.createElement('canvas'), getContext: () => ({ isContextLost: () => false }) }, scene: new Scene(), camera: new PerspectiveCamera() }
  simulationStore.getState().restart()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
async function flushFrame() {
  await act(async () => {
    const frames = harness.frames.splice(0)
    frames.forEach((frame) => frame(0))
    await new Promise((r) => setTimeout(r, 5))
  })
}
describe('mounted renderer readiness generation', () => {
  it('does not prepare again for ordinary time/preset/restart changes and retries after context replacement', async () => {
    const dispose = vi.fn()
    harness.prepare.mockImplementation(() => ({ jobs: [{ label: 'Actual work', run: () => {} }], dispose }))
    const view = render(<SceneReadiness />)
    await flushFrame()
    expect(readinessStore.getState().phase).toBe('ready')
    expect(harness.prepare).toHaveBeenCalledTimes(1)
    act(() => simulationStore.getState().restart())
    view.rerender(<SceneReadiness />)
    expect(harness.prepare).toHaveBeenCalledTimes(1)
    const { gl } = harness.root as { gl: { domElement: HTMLCanvasElement } }
    act(() => {
      simulationStore.getState().play()
      gl.domElement.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
    })
    expect(readinessStore.getState().phase).toBe('cancelled')
    expect(simulationStore.getState().isPlaying).toBe(false)
    act(() => gl.domElement.dispatchEvent(new Event('webglcontextrestored')))
    await flushFrame()
    expect(harness.prepare).toHaveBeenCalledTimes(2)
    expect(readinessStore.getState().phase).toBe('ready')
    view.unmount()
    expect(dispose).toHaveBeenCalledTimes(2)
  })
  it('cancels before the first frame and reports a recoverable resource-construction failure', async () => {
    const view = render(<SceneReadiness />)
    view.unmount()
    await flushFrame()
    expect(harness.prepare).not.toHaveBeenCalled()
    harness.prepare.mockImplementation(() => {
      throw new Error('Driver failure')
    })
    render(<SceneReadiness />)
    await flushFrame()
    expect(readinessStore.getState().phase).toBe('failed')
    act(() => readinessStore.getState().retry())
    harness.prepare.mockImplementation(() => ({ jobs: [{ label: 'Retry', run: () => {} }], dispose: vi.fn() }))
    await flushFrame()
    expect(readinessStore.getState().phase).toBe('ready')
    expect(simulationStore.getState().timeSeconds).toBe(0)
  })
})
