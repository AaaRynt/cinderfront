;(async () => {
  const q = window.__review
  q.terrain = await import('/src/scene/world/landing/landingTerrain.ts')
  q.presentation = await import('/src/scene/world/stage2/terrainPresentation.ts')
  q.initialization = await import('/src/initialization/initializeApplication.ts')
  q.ready = await import('/src/scene/readiness/readinessStore.ts')
  q.cpuSample = () => {
    const meshes = q.terrain.getPreparedTerrainMeshes()
    return {
      initialization: q.initialization.getInitializationBounds(),
      terrain: q.terrain.getLandingPreparationBounds(),
      indexes: q.terrain.getLandingSupportIndexBounds(),
      presentation: q.presentation.getTerrainPresentationBounds(),
      terrainUUID: meshes?.terrain.uuid,
      coastUUID: meshes?.coast.uuid,
      readiness: { ...q.ready.readinessStore.getState(), retry: undefined },
      time: q.s.simulationStore.getState().timeSeconds,
      playing: q.s.simulationStore.getState().isPlaying,
      preset: q.c.useCameraStore.getState().preset,
      heap: performance.memory?.usedJSHeapSize,
    }
  }
  q.resourceCycle = async () => {
    q.s.simulationStore.getState().restart()
    for (const time of [0, 78, 92, 104, 176, 185, 206, 240, 360, 540, 7200]) {
      q.s.simulationStore.getState().seek(time)
      await q.frames(3)
    }
    for (const option of document.querySelector('#camera-select').options) {
      q.c.useCameraStore.getState().requestPreset(option.value)
      await q.frames(3)
    }
    q.s.simulationStore.getState().seek(360)
    q.c.useCameraStore.getState().requestPreset('lav-west')
    await q.frames(24)
    return { inventory: q.inventory(), cpu: q.cpuSample() }
  }
  return true
})()
