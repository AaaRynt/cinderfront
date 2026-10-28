import type { WebGLRenderer } from 'three'

import { BoxGeometry, DirectionalLight, DoubleSide, Fog, Group, InstancedMesh, Mesh, MeshStandardMaterial, PerspectiveCamera, PointLight, Scene, Vector3 } from 'three'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { startPreparation } from './preparation'
import { readinessStore } from './readinessStore'
import { createRendererPreparation, PREPARED_POINT_LIGHT_COUNTS } from './rendererPreparation'

beforeEach(() => readinessStore.setState({ generation: 0, phase: 'preparing' }))
function fixture() {
  const scene = new Scene(),
    camera = new PerspectiveCamera(),
    geometry = new BoxGeometry(),
    material = new MeshStandardMaterial(),
    hidden = new Group()
  const mesh = new Mesh(geometry, material),
    instances = new InstancedMesh(geometry, material, 3),
    sun = new DirectionalLight(),
    point = new PointLight()
  hidden.visible = false
  hidden.add(mesh)
  scene.add(hidden, instances, sun, point)
  sun.castShadow = true
  mesh.receiveShadow = true
  scene.fog = new Fog('gray', 5, 50)
  const compile = vi.fn(),
    renderer = { info: { programs: [] }, compile, getContext: () => ({ getExtension: () => null }) } as unknown as WebGLRenderer
  return { scene, camera, geometry, material, mesh, instances, sun, point, renderer, compile }
}
describe('actual renderer shader preparation', () => {
  it('borrows mounted and hidden resources with the same shadow/fog configuration, without drawing future state or moving a camera', async () => {
    const f = fixture(),
      beforeChildren = [...f.scene.children],
      beforePose = f.camera.matrixWorld.clone()
    const materialDispose = vi.spyOn(f.material, 'dispose'),
      geometryDispose = vi.spyOn(f.geometry, 'dispose')
    const prepared = createRendererPreparation(f.renderer, f.scene, f.camera)
    const proxyDisposals: ReturnType<typeof vi.fn>[] = []
    f.compile.mockImplementation((group: Group, camera: PerspectiveCamera, target: Scene) => {
      expect(camera).toBe(f.camera)
      expect(target.fog).toBe(f.scene.fog)
      expect(target.children).toContain(f.sun)
      expect(target.children.filter((o) => o instanceof PointLight).length).toBe(PREPARED_POINT_LIGHT_COUNTS[f.compile.mock.calls.length - 1] ?? 6)
      expect(group.children.some((o) => o instanceof Mesh && o.material === f.material && o.geometry === f.geometry && o.receiveShadow)).toBe(true)
      if (f.compile.mock.calls.length === 1)
        for (const o of group.children)
          if (o instanceof InstancedMesh) {
            const dispose = vi.fn()
            o.addEventListener('dispose', dispose)
            proxyDisposals.push(dispose)
          }
    })
    await startPreparation({ ...prepared, yieldWork: async () => {} }).done
    expect(f.compile).toHaveBeenCalledTimes(PREPARED_POINT_LIGHT_COUNTS.length + 1)
    expect(f.scene.children).toEqual(beforeChildren)
    expect(f.mesh.parent?.visible).toBe(false)
    expect(f.sun.parent).toBe(f.scene)
    expect(f.camera.matrixWorld.equals(beforePose)).toBe(true)
    expect(f.material).toMatchObject({ transparent: false, opacity: 1 })
    prepared.dispose()
    expect(proxyDisposals.every((dispose) => dispose.mock.calls.length === 1)).toBe(true)
    expect(materialDispose).not.toHaveBeenCalled()
    expect(geometryDispose).not.toHaveBeenCalled()
  })
  it('restores every borrowed material when the installed double-sided preparation path throws midway', async () => {
    const f = fixture()
    f.material.side = DoubleSide
    f.material.transparent = true
    f.compile.mockImplementation(() => {
      f.material.side = 1
      throw new Error('Interrupted back-face compile')
    })
    await startPreparation({ ...createRendererPreparation(f.renderer, f.scene, f.camera), yieldWork: async () => {} }).done
    expect(readinessStore.getState()).toMatchObject({ phase: 'failed', completed: 0 })
    expect(f.material).toMatchObject({ side: DoubleSide, transparent: true, opacity: 1 })
  })
  it('restores the actual owned departure material flags even when compilation fails', async () => {
    const f = fixture(),
      root = new Group(),
      fade = new MeshStandardMaterial({ side: DoubleSide, opacity: 0.63 })
    root.name = 'defender-molniya-01'
    root.add(new Mesh(f.geometry, fade))
    f.scene.add(root)
    f.compile.mockImplementation(() => {
      if (fade.transparent) throw new Error('Compile rejected')
    })
    await startPreparation({ ...createRendererPreparation(f.renderer, f.scene, f.camera), yieldWork: async () => {} }).done
    expect(readinessStore.getState()).toMatchObject({ phase: 'failed', completed: PREPARED_POINT_LIGHT_COUNTS.length })
    expect(fade).toMatchObject({ side: DoubleSide, transparent: false, opacity: 0.63 })
    expect(root.parent).toBe(f.scene)
    fade.dispose()
  })
  it('waits for a cached pending program on retry instead of treating an empty allocation delta as ready', async () => {
    vi.useFakeTimers()
    const f = fixture(),
      getUniforms = vi.fn(),
      getAttributes = vi.fn()
    let ready = false
    const program = { program: {}, getUniforms, getAttributes }
    ;(f.renderer.info.programs as unknown[]).push(program)
    f.renderer.getContext = () => ({ LINK_STATUS: 2, getExtension: () => ({ COMPLETION_STATUS_KHR: 1 }), getProgramParameter: (_: unknown, status: number) => (status === 1 ? ready : true) }) as unknown as WebGL2RenderingContext
    const op = startPreparation({ ...createRendererPreparation(f.renderer, f.scene, f.camera), yieldWork: async () => {} })
    await vi.advanceTimersByTimeAsync(5)
    expect(readinessStore.getState().phase).toBe('preparing')
    ready = true
    await vi.advanceTimersByTimeAsync(20)
    await op.done
    expect(readinessStore.getState().phase).toBe('ready')
    expect(getUniforms).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
  it('ignores a cancelled parallel-compile poll and preserves the latest user camera input', async () => {
    vi.useFakeTimers()
    const f = fixture(),
      getUniforms = vi.fn(),
      getAttributes = vi.fn()
    const program = { program: {}, getUniforms, getAttributes }
    const query = vi.fn(() => false)
    f.renderer.getContext = () => ({ getExtension: () => ({ COMPLETION_STATUS_KHR: 1 }), getProgramParameter: query }) as unknown as WebGL2RenderingContext
    f.compile.mockImplementation(() => {
      ;(f.renderer.info.programs as unknown[]).push(program)
    })
    const op = startPreparation({ ...createRendererPreparation(f.renderer, f.scene, f.camera), yieldWork: async () => {} })
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    f.camera.position.copy(new Vector3(12, 34, 56))
    op.cancel('Unmounted')
    await op.done
    expect(readinessStore.getState().phase).toBe('cancelled')
    expect(getUniforms).not.toHaveBeenCalled()
    expect(f.camera.position.toArray()).toEqual([12, 34, 56])
    vi.useRealTimers()
  })
})
