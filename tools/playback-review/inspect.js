;(async () => {
  const q = window.__review,
    s = q.get(),
    m = q.s,
    w = q.runtime,
    T = q.T
  const clocks = await import('/src/scene/effects/aftermath/effectClocks.ts')
  // Read GPU clocks only from meshes actually submitted in these paused frames.
  // Frustum-culled materials can legitimately retain an older program uniform.
  const drawn = new Set(),
    watched = ['4c-continuous-sea', '4c-repair', '4c-gravel', '4c-runoff', '4c-tire', '4c-salt'].map((name) => s.scene.getObjectByName(name)).filter(Boolean),
    hooks = watched.map((o) => [o, o.onAfterRender])
  for (const [o, original] of hooks)
    o.onAfterRender = function (...args) {
      drawn.add(this.uuid)
      return original.apply(this, args)
    }
  await q.frames(3)
  for (const [o, original] of hooks) o.onAfterRender = original
  const v = w.deriveRuntimeWorldState(m.simulationStore.getState().timeSeconds)

  s.scene.updateMatrixWorld(true)
  const errors = []
  const maxError = (a, b) => Math.max(...a.map((x, i) => Math.abs(x - b[i])))
  const tuple = (p) => [p.x, p.y, p.z]
  const expectNear = (label, actual, expected, tolerance) => {
    const error = typeof actual === 'number' ? Math.abs(actual - expected) : maxError(actual, expected)
    if (!Number.isFinite(error) || error > tolerance) errors.push({ label, actual, expected, error, tolerance })
    return error
  }
  const roots = []
  function root(id, name, pose, order = 'XYZ', expectedVisible = true, mayBeAbsent = false) {
    const objects = s.scene.getObjectsByProperty('name', name)
    if (mayBeAbsent && !expectedVisible && objects.length === 0) {
      roots.push({ id, name, count: 0, expectedVisible, absentAsDeparted: true })
      return
    }
    if (objects.length !== 1) {
      errors.push({ label: 'unique-root', id, name, count: objects.length })
      return
    }
    const o = objects[0],
      position = o.getWorldPosition(new T.Vector3()).toArray(),
      quaternion = o.getWorldQuaternion(new T.Quaternion()).toArray()
    const q = new T.Quaternion().setFromEuler(new T.Euler(pose.rotation.x, pose.rotation.y, pose.rotation.z, order))
    const angle = o.getWorldQuaternion(new T.Quaternion()).angleTo(q)
    const positionError = expectNear(id + ' position', position, tuple(pose.position), 2e-7)
    if (!Number.isFinite(angle) || angle > 1e-6) errors.push({ label: id + ' quaternion', angle, quaternion, expected: q.toArray() })
    if (o.visible !== expectedVisible) errors.push({ label: id + ' visibility', actual: o.visible, expected: expectedVisible })
    roots.push({ id, name, count: 1, uuid: o.uuid, position, quaternion, expectedPosition: tuple(pose.position), expectedQuaternion: q.toArray(), positionError, quaternionError: angle, visible: o.visible, expectedVisible })
  }
  root('attacker_wasp_01', 'attacker_wasp_01', v.wasp.pose)
  for (const p of Object.values(v.landing.crafts)) root(p.id, p.id, p.pose, 'YXZ')
  for (const p of Object.values(v.landing.payload)) root(p.id, p.id, p.pose, 'YXZ')
  for (const p of Object.values(v.stage4b.btrGroup.vehicles)) root(p.id, p.id, p.pose)
  for (const p of Object.values(v.stage4b.t72Group.vehicles)) root(p.id, p.id, p.pose)
  for (const p of Object.values(v.stage4b2c.convoy.vehicles)) root(p.id, p.id, p.pose, 'YXZ', p.visible)
  root(v.secondaryPantsir.id, v.secondaryPantsir.id, v.secondaryPantsir.pose, 'YXZ')
  const worldData = await import('/src/scene/world/worldData.ts')
  const zeroRotation = { x: 0, y: 0, z: 0 }
  const fixedPosition = (coordinates) => ({ x: coordinates[0], y: coordinates[1], z: coordinates[2] })
  root('primary-search-radar', 'primary-search-radar', { position: fixedPosition(worldData.RADAR_SEARCH_SITE.position), rotation: zeroRotation })
  root('tracking-radar', 'tracking-radar', { position: fixedPosition(worldData.RADAR_TRACKING_SITE.position), rotation: zeroRotation })
  root('fixed-aaa', 'fixed-aaa', { position: fixedPosition(worldData.AAA_SITE.position), rotation: zeroRotation })
  const primarySite = worldData.SAM_PAD_POSITIONS[0].position,
    primaryRoots = []
  s.scene.traverse((o) => {
    if (o.isGroup && o.position.x === primarySite[0] && o.position.y === primarySite[1] && o.position.z === primarySite[2] && o.getObjectByName('pantsir-search-radar')) primaryRoots.push(o)
  })
  if (primaryRoots.length !== 1) errors.push({ label: 'primary Pantsir anonymous root unique', count: primaryRoots.length })
  else {
    const o = primaryRoots[0],
      position = o.getWorldPosition(new T.Vector3()).toArray(),
      quaternion = o.getWorldQuaternion(new T.Quaternion()).toArray(),
      positionError = expectNear('primary Pantsir root position', position, primarySite, 2e-7)
    expectNear('primary Pantsir root quaternion', quaternion, [0, 0, 0, 1], 1e-10)
    roots.push({ id: 'defender_pantsir_01', name: '(historical unnamed root)', count: 1, uuid: o.uuid, position, quaternion, positionError, quaternionError: 0, visible: o.visible, expectedVisible: true })
  }
  const tracking = s.scene.getObjectByName('tracking-radar')
  expectNear('surviving tracking antenna rendered rotation', tracking?.children[2]?.rotation.y ?? NaN, v.radar.secondaryDishRotationRadians, 1e-10)
  for (const id of ['attacker_f35_01', 'attacker_f35_02']) {
    const visible = v.runtime.aircraft?.[id].visible ?? true
    // The persistent named aircraft root is inside its presentation wrapper.
    root(id, id, v.aircraft[id].pose)
    const o = s.scene.getObjectByName(id)
    if (o?.parent?.visible !== visible) errors.push({ label: id + ' departure wrapper', actual: o?.parent?.visible, expected: visible })
  }
  for (const p of Object.values(v.stage4b2b.aircraft)) root(p.id, p.id, p.pose, 'YXZ', p.visible, true)
  const talwar = v.stage3.talwar,
    molniya = v.stage3.molniya,
    t = v.timeSeconds
  const talwarPose = {
    position: { ...talwar.pose.position, y: talwar.pose.position.y + Math.sin(clocks.periodicAngle(t, 0.38)) * 0.11 * (1 - talwar.floodingProgress * 0.55) },
    rotation: { ...talwar.pose.rotation, z: talwar.pose.rotation.z + Math.sin(clocks.periodicAngle(t, 0.23, 0.7)) * 0.0018 * (1 - talwar.floodingProgress * 0.55) },
  }
  const molniyaPose = { position: { ...molniya.pose.position, y: molniya.pose.position.y + Math.sin(clocks.periodicAngle(t, 0.55, 1.4)) * 0.08 }, rotation: { ...molniya.pose.rotation, z: molniya.pose.rotation.z + Math.sin(clocks.periodicAngle(t, 0.31, 0.2)) * 0.0025 } }
  const survivors = await import('/src/simulation/aftermathSurvivors.ts')
  root('defender_talwar_01', 'defender-talwar-01', talwarPose)
  root('defender_molniya_01', 'defender-molniya-01', molniyaPose, 'XYZ', survivors.getMolniyaRuntimePresentation(t).visible)
  const wheels = []
  for (const p of Object.values(v.landing.payload)) {
    const actor = s.scene.getObjectByName(p.id)
    for (const wheel of p.wheels) {
      const name = `lav25-wheel-${wheel.side}-${wheel.axle}`,
        objects = actor?.getObjectsByProperty('name', name) || []
      if (objects.length !== 1) {
        errors.push({ label: p.id + ' ' + name + ' unique', count: objects.length })
        continue
      }
      const o = objects[0],
        roll = o.getObjectByName('lav25-wheel-roll'),
        center = o.getWorldPosition(new T.Vector3()).toArray()
      const centerError = expectNear(p.id + ' ' + name + ' world center', center, tuple(wheel.center), 2e-7)
      const steeringError = expectNear(p.id + ' ' + name + ' steering', o.rotation.y, wheel.steeringRadians, 1e-10)
      const rollError = expectNear(p.id + ' ' + name + ' roll', roll?.rotation.x ?? NaN, wheel.rotationRadians, 1e-10)
      const local = [o.position.x, o.position.y, o.position.z]
      wheels.push({
        id: p.id,
        name,
        uuid: o.uuid,
        center,
        expectedCenter: tuple(wheel.center),
        contact: tuple(wheel.contact),
        centerError,
        steering: o.rotation.y,
        expectedSteering: wheel.steeringRadians,
        steeringError,
        roll: roll?.rotation.x,
        expectedRoll: wheel.rotationRadians,
        rollError,
        suspension: wheel.suspensionMeters,
        local,
        surface: wheel.surface,
        travel: wheel.travelMeters,
      })
    }
  }
  function gpu(mesh, uniform) {
    if (!mesh || !drawn.has(mesh.uuid)) return null
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    const program = s.gl.properties.get(material).currentProgram
    const location = program?.getUniforms().map[uniform]
    return location ? s.gl.getContext().getUniform(program.program, location.addr) : null
  }
  const waterExpected = clocks.coastalShaderTime(t),
    waterGPU = gpu(s.scene.getObjectByName('4c-continuous-sea'), 'uCoastalTime')
  if (drawn.has(s.scene.getObjectByName('4c-continuous-sea').uuid)) {
    if (waterGPU === null) errors.push({ label: 'drawn water GPU uniform unavailable' })
    else expectNear('GPU water clock', waterGPU, waterExpected, 1e-4)
  }
  const wear = []
  for (const kind of ['repair', 'gravel', 'runoff', 'tire', 'salt']) {
    const o = s.scene.getObjectByName('4c-' + kind),
      value = gpu(o, 'uWearTime')
    if (value !== null) {
      expectNear('GPU wear ' + kind, value, clocks.surfaceHistoryTime(t), 1e-4)
      wear.push({ name: o.name, value })
    }
  }
  for (const o of watched.filter((o) => o.name !== '4c-continuous-sea' && drawn.has(o.uuid))) if (!wear.some((row) => row.name === o.name)) errors.push({ label: 'drawn wear GPU uniform unavailable', name: o.name })
  const fans = [],
    navigation = []
  for (const craft of Object.values(v.landing.crafts)) {
    const actor = s.scene.getObjectByName(craft.id)
    for (const side of [-1, 1]) {
      const fan = actor.getObjectByName('lcac-fan-' + side)?.getObjectByName('lcac-fan-rotor')
      expectNear(craft.id + ' fan ' + side, fan?.rotation.z ?? NaN, craft.mechanics.fanRotationRadians * side, 1e-8)
      fans.push({ id: craft.id, side, rotation: fan?.rotation.z })
    }
    const lights = actor.getObjectsByProperty('name', 'lcac-navigation-light')
    const expected = craft.mechanics.navigationLight > 0.6
    if (lights.length !== 2 || lights.some((o) => o.visible !== expected)) errors.push({ label: craft.id + ' navigation lights', actual: lights.map((o) => o.visible), expected })
    navigation.push({ id: craft.id, phase: craft.mechanics.navigationLight, visible: lights.map((o) => o.visible) })
    const ramp = actor.getObjectByName('lcac-bow-ramp-hinge')
    expectNear(craft.id + ' bow ramp', ramp?.rotation.x ?? NaN, craft.mechanics.bowRampAngleRadians, 1e-10)
  }
  function matrixSignature(o) {
    const n = Math.max(0, Math.min(o.count ?? 0, o.instanceMatrix?.count ?? 0)),
      array = o.instanceMatrix?.array
    if (!array) return null
    const bytes = new Uint8Array(array.buffer, array.byteOffset, n * 16 * array.BYTES_PER_ELEMENT)
    let hash = 2166136261
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0
    return { uuid: o.uuid, count: n, hash, head: Array.from(array.slice(0, Math.min(n * 16, 48))), finite: Array.from(array.subarray(0, n * 16)).every(Number.isFinite) }
  }
  const effects = {}
  for (const name of ['stage3-persistent-ground-fires', 'stage3-local-bounded-smoke', 'stage3-fuel-bounded-smoke', 'stage4a-bounded-liquid-fuel-fire-field', 'stage4a-layered-fuel-smoke-field']) {
    effects[name] = s.scene.getObjectsByProperty('name', name).map((group) => {
      const slots = []
      group.traverse((o) => {
        if (o.isInstancedMesh) slots.push(matrixSignature(o))
      })
      return { uuid: group.uuid, slots }
    })
  }
  const fuel = s.scene.getObjectByName('ash-harbor-stage4a-fuel-disaster'),
    fireLights = []
  fuel?.traverse((o) => {
    if (o.isPointLight) {
      fireLights.push({ uuid: o.uuid, intensity: o.intensity })
      if (!Number.isFinite(o.intensity)) errors.push({ label: 'fuel point light finite', uuid: o.uuid })
    }
  })
  const landscape = [],
    pools = []
  s.scene.traverse((o) => {
    if (o.userData.poolCapacity !== undefined) pools.push({ name: o.name, uuid: o.uuid, capacity: o.userData.poolCapacity, count: o.count })
    if (o.isMesh && ((o.name.startsWith('4c-') && o.name.endsWith('-clumps')) || o.name.startsWith('6a-tree-') || /^radar-rocks-|^beach-rocks-/.test(o.name))) landscape.push([o.name, o.uuid, o.geometry.uuid, Array.isArray(o.material) ? o.material.map((m) => m.uuid) : o.material.uuid, o.instanceMatrix?.version])
  })
  const result = {
    time: t,
    playing: m.simulationStore.getState().isPlaying,
    phase: v.runtime.phase,
    eventCount: v.reachedEvents.length,
    lastEvent: v.reachedEvents.at(-1).id,
    occupancy: [v.landing.embarkedCount, v.landing.transferringCount, v.landing.ashoreCount],
    lav: Object.values(v.landing.payload).map((p) => ({ id: p.id, occupancy: p.occupancy, attached: p.attachedToCarrierId, clearance: p.rampClearanceMeters, activity: p.runtimeActivity, speed: p.speedMetersPerSecond, wheelTravel: p.wheelTravelMeters })),
    roots,
    wheels,
    waterExpected,
    waterGPU,
    gpuDrawn: watched.filter((o) => drawn.has(o.uuid)).map((o) => o.name),
    wear,
    fans,
    navigation,
    effects,
    fireLights,
    landscape,
    pools,
    errors,
    camera: s.camera.position.toArray(),
    target: s.controls.target.toArray(),
  }

  return result
})()
