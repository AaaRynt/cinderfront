;(async () => {
  window.__review = {}
  const q = window.__review
  q.f = await import(performance.getEntriesByType('resource').find((e) => e.name.includes('@react-three_fiber.js')).name)
  q.get = () => q.f._roots.get(document.querySelector('canvas')).store.getState()
  q.r = q.get()
  q.r.setDpr(1)
  q.s = await import(performance.getEntriesByType('resource').find((e) => e.name.includes('/src/simulation/store.ts')).name)
  q.c = await import('/src/scene/camera/cameraStore.ts')
  q.runtime = await import('/src/simulation/runtime.ts')
  q.T = await import(performance.getEntriesByType('resource').find((e) => /\/three\.js(?:\?|$)/.test(e.name)).name)
  q.frames = async (n = 12) => {
    for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame)
  }
  q.sample = async () => {
    const dt = []
    let last = performance.now()
    for (let i = 0; i < 45; i++) {
      await new Promise(requestAnimationFrame)
      const now = performance.now()
      dt.push(now - last)
      last = now
    }
    const r = q.get(),
      materials = new Set()
    let meshes = 0,
      transparent = 0,
      casters = 0
    r.scene.traverse((o) => {
      if (o.isMesh) {
        meshes++
        if (o.castShadow) casters++
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          materials.add(m.uuid)
          if (m.transparent) transparent++
        }
      }
    })
    return {
      calls: r.gl.info.render.calls,
      triangles: r.gl.info.render.triangles,
      geometries: r.gl.info.memory.geometries,
      textures: r.gl.info.memory.textures,
      programs: r.gl.info.programs.length,
      materials: materials.size,
      meshes,
      casters,
      transparent,
      rafMeanMs: dt.slice(5).reduce((a, b) => a + b, 0) / 40,
      rafP95Ms: dt.slice(5).sort((a, b) => a - b)[38],
      viewport: [innerWidth, innerHeight],
      dpr: r.gl.getPixelRatio(),
      antialias: r.gl.getContext().getContextAttributes().antialias,
      position: r.camera.position.toArray(),
      target: r.controls.target.toArray(),
      fov: r.camera.fov,
    }
  }
  return true
})()
