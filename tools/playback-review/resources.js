;(async () => {
  const q = window.__review
  const mounted = async (fragment) => import(performance.getEntriesByType('resource').find((e) => e.name.includes(fragment)).name)
  q.lav = await mounted('/src/simulation/lavAftermath.ts')
  q.dust = await mounted('/src/scene/effects/aftermath/groundDust.ts')
  q.staticInventory = () => {
    const rows = []
    q.get()
      .scene.getObjectByName('ash-harbor-stage2-world')
      .traverse((o) => {
        if (o.isMesh)
          rows.push([
            o.uuid,
            o.name,
            o.geometry.uuid,
            Array.isArray(o.material) ? o.material.map((m) => m.uuid) : o.material.uuid,
            o.instanceMatrix?.version ?? null,
            o.instanceColor?.version ?? null,
            o.geometry.index?.version ?? null,
            Object.entries(o.geometry.attributes).map(([name, a]) => [name, a.version, a.count]),
          ])
      })
    return rows.sort((a, b) => a[0].localeCompare(b[0]))
  }
  q.resourceSample = () => {
    const r = q.get(),
      s = q.s.simulationStore.getState(),
      w = q.runtime.deriveRuntimeWorldState(s.timeSeconds),
      materials = new Set(),
      pools = []
    let meshes = 0
    r.scene.traverse((o) => {
      if (o.isMesh) {
        meshes++
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m.uuid)
      }
      if (o.userData.poolCapacity !== undefined) pools.push({ name: o.name, uuid: o.uuid, capacity: o.userData.poolCapacity, count: o.count })
    })
    return {
      wall: performance.now(),
      time: s.timeSeconds,
      playing: s.isPlaying,
      speed: s.speed,
      reset: s.transientResetVersion,
      preset: q.c.useCameraStore.getState().preset,
      phase: w.runtime.phase,
      eventCount: w.reachedEvents.length,
      lastEvent: w.reachedEvents.at(-1).id,
      occupancy: [w.landing.embarkedCount, w.landing.transferringCount, w.landing.ashoreCount],
      calls: r.gl.info.render.calls,
      triangles: r.gl.info.render.triangles,
      geometries: r.gl.info.memory.geometries,
      textures: r.gl.info.memory.textures,
      programs: r.gl.info.programs.length,
      materials: materials.size,
      meshes,
      pools,
      lavCache: q.lav.getLavRoadCacheBounds(),
      dustCache: q.dust.getAftermathDustCacheSize(),
      actorRoots: q.actorRoots?.map((a) => ({ id: a.id, uuid: a.uuid, present: !!r.scene.getObjectByProperty('uuid', a.uuid) })),
      position: r.camera.position.toArray(),
      target: r.controls.target.toArray(),
      dpr: r.gl.getPixelRatio(),
      antialias: r.gl.getContext().getContextAttributes().antialias,
      viewport: [innerWidth, innerHeight],
    }
  }
  return true
})()
