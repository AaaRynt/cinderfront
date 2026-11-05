;(() => {
  const q = window.__review
  q.inventory = () => {
    const r = q.get(),
      allPools = [],
      resources = { geometry: [], material: [], texture: [] },
      materials = new Set(),
      geometries = new Set(),
      textures = new Set()
    r.scene.traverse((o) => {
      if (o.isMesh) {
        geometries.add(o.geometry.uuid)
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          materials.add(m.uuid)
          for (const v of Object.values(m)) if (v?.isTexture) textures.add(v.uuid)
        }
      }
      if (o.isInstancedMesh) allPools.push({ uuid: o.uuid, name: o.name, capacity: o.instanceMatrix.count, count: o.count, geometry: o.geometry.uuid, material: Array.isArray(o.material) ? o.material.map((m) => m.uuid) : o.material.uuid })
    })
    resources.geometry = [...geometries].sort()
    resources.material = [...materials].sort()
    resources.texture = [...textures].sort()
    return { sample: q.resourceSample(), static: q.staticInventory(), allPools: allPools.sort((a, b) => a.uuid.localeCompare(b.uuid)), resources }
  }
  q.verifyInventory = (a, b) => {
    const failures = [],
      changed = []
    if (a.static.length !== 936 || b.static.length !== 936) failures.push('world-record-count')
    for (let i = 0; i < a.static.length; i++) {
      const x = a.static[i],
        y = b.static[i]
      if (JSON.stringify(x) !== JSON.stringify(y)) changed.push({ before: x, after: y })
    }
    const poolShape = (p) => p.map(({ count: _count, ...rest }) => rest)
    if (JSON.stringify(poolShape(a.allPools)) !== JSON.stringify(poolShape(b.allPools))) failures.push('pool-capacity-or-identity')
    if (b.allPools.some((p) => p.count < 0 || p.count > p.capacity)) failures.push('pool-overflow')
    if (!b.sample.actorRoots?.every((r) => r.present)) failures.push('actor-root-replaced')
    return { failures, changedStatic: changed.length, changedResponseOnly: changed.every((r) => r.before.every((v, i) => i === 4 || JSON.stringify(v) === JSON.stringify(r.after[i]))), fixedUnchanged: a.static.length - changed.length, pools: b.allPools.length }
  }
  return true
})()
