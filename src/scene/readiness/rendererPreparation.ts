import type { Camera, Material, WebGLRenderer } from 'three'

import { Group, InstancedMesh, Mesh, PointLight, Scene } from 'three'

import type { PreparationJob } from './preparation'

import { STAGE3_GEOMETRIES, STAGE3_MATERIALS } from '../effects/stage3/sharedResources'
import { STAGE4A_FUEL_MATERIALS } from '../effects/stage4a/sharedResources'
import { yieldPreparation } from './preparation'

/** Point-light counts observed in the fixed-commit event/aftermath trace. Values change as uniforms;
 * counts change the actual StandardMaterial shader program. No future world is sampled. */
export const PREPARED_POINT_LIGHT_COUNTS = [0, 1, 2, 3, 4, 5, 6, 7] as const

export function createRendererPreparation(renderer: WebGLRenderer, scene: Scene, camera: Camera) {
  const proxies = new Group()
  const ownedInstances: InstancedMesh[] = []
  const seen = new Set<string>()
  const borrowedMaterials = new Set<Material>()
  const add = (mesh: Mesh) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => borrowedMaterials.add(material))
    const instanced = mesh instanceof InstancedMesh
    const key = [materials.map((m) => m.uuid).join(','), Object.keys(mesh.geometry.attributes).sort().join(','), instanced, instanced && !!mesh.instanceColor, mesh.receiveShadow].join('|')
    if (seen.has(key)) return
    seen.add(key)
    const proxy = instanced ? new InstancedMesh(mesh.geometry, mesh.material, 1) : new Mesh(mesh.geometry, mesh.material)
    if (proxy instanceof InstancedMesh) {
      if (mesh instanceof InstancedMesh && mesh.instanceColor) proxy.instanceColor = mesh.instanceColor
      ownedInstances.push(proxy)
    }
    proxy.receiveShadow = mesh.receiveShadow
    proxies.add(proxy)
  }
  scene.traverse((o) => {
    if (o instanceof Mesh) add(o)
  })
  // These are the same module-owned resources drawn by conditional blast, fuel,
  // cookoff and wreck pools, rather than warm-up-only material clones.
  for (const material of [...Object.values(STAGE3_MATERIALS), ...Object.values(STAGE4A_FUEL_MATERIALS)]) {
    add(new Mesh(STAGE3_GEOMETRIES.puff, material))
    const instanced = new InstancedMesh(STAGE3_GEOMETRIES.puff, material, 1)
    add(instanced)
    instanced.dispose()
  }
  const lighting = new Scene()
  lighting.fog = scene.fog
  lighting.environment = scene.environment
  // Borrow light references without reparenting or touching their transforms.
  scene.traverseVisible((o) => {
    if ('isLight' in o && !(o instanceof PointLight)) lighting.children.push(o)
  })
  const points = Array.from({ length: 7 }, () => new PointLight())
  let disposed = false
  const context = renderer.getContext()
  const parallel = context.getExtension('KHR_parallel_shader_compile')
  const verifiedPrograms = new Set<NonNullable<WebGLRenderer['info']['programs']>[number]>()
  const compileVariant = async (count: number, signal: AbortSignal, fading = false) => {
    if (signal.aborted) throw signal.reason
    lighting.children = [...lighting.children.filter((o) => !(o instanceof PointLight)), ...points.slice(0, count)]
    const fadeMaterials = new Set<Material>()
    if (fading)
      scene.getObjectByName('defender-molniya-01')?.traverse((object) => {
        if (object instanceof Mesh) for (const material of Array.isArray(object.material) ? object.material : [object.material]) fadeMaterials.add(material)
      })
    const oldFlags = [...borrowedMaterials].map((material) => ({ material, transparent: material.transparent, side: material.side, opacity: material.opacity }))
    try {
      for (const material of fadeMaterials) {
        if (!material.transparent) {
          material.transparent = true
          material.needsUpdate = true
        }
      }
      renderer.compile(proxies, camera, lighting)
    } finally {
      // Synchronous scope only: no intervening visible frame can observe flags.
      for (const { material, transparent, side, opacity } of oldFlags) {
        if (material.transparent !== transparent || material.side !== side || material.opacity !== opacity) {
          material.transparent = transparent
          material.side = side
          material.opacity = opacity
          material.needsUpdate = true
        }
      }
    }
    const programs = (renderer.info.programs ?? []).filter((program) => !verifiedPrograms.has(program))
    // Include cached pending programs from a cancelled/retried operation, not
    // only newly allocated programs. Retain the handles themselves: compileAsync's installed
    // currentProgram polling can otherwise observe the intervening visible T+0
    // draw's different light variant while preparation yields to the UI.
    for (const program of programs) {
      if (parallel)
        while (!context.getProgramParameter(program.program as WebGLProgram, parallel.COMPLETION_STATUS_KHR)) {
          await yieldPreparation(signal)
          if (signal.aborted) throw signal.reason
        }
      if (signal.aborted) throw signal.reason
      if (!context.getProgramParameter(program.program as WebGLProgram, context.LINK_STATUS)) throw new Error('Shader preparation failed. Retry scene preparation.')
      program.getUniforms()
      program.getAttributes()
      verifiedPrograms.add(program)
    }
  }
  const jobs: PreparationJob[] = PREPARED_POINT_LIGHT_COUNTS.map((count) => ({ label: `Lighting ${count}`, run: (signal) => compileVariant(count, signal) }))
  jobs.push({ label: 'Departure transparency', run: (signal) => compileVariant(6, signal, true) })
  return {
    jobs,
    dispose: () => {
      if (disposed) return
      disposed = true
      proxies.clear()
      lighting.children = []
      ownedInstances.forEach((mesh) => mesh.dispose())
      // Shared mounted geometry/materials/lights are always borrowed.
    },
  }
}
