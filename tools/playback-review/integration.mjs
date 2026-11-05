/** Native controls/recovery checks, separate from the paced comparison. */
import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const output = resolve(process.argv[2] ?? 'stage7d-review.local')
const base = process.argv[3] ?? 'http://127.0.0.1:5197'
const here = fileURLToPath(new URL('.', import.meta.url))
mkdirSync(output, { recursive: true })
const read = (name) => readFileSync(resolve(here, name), 'utf8')
const save = (name, value) => writeFileSync(resolve(output, name), JSON.stringify(value))
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}
const browser = await chromium.launch({ channel: 'chrome', headless: false })
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
const page = await context.newPage(),
  cdp = await context.newCDPSession(page),
  errors = [],
  warnings = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => {
  if (['warning', 'error'].includes(message.type())) warnings.push({ type: message.type(), text: message.text() })
})
const results = { started: new Date().toISOString(), failures: [] }
const write = () => save('integration.json', { ...results, errors, warnings })
const frames = (n = 24) =>
  page.evaluate(async (n) => {
    for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame)
  }, n)
const state = () =>
  page.evaluate(() => {
    const q = window.__review
    return {
      time: q.s.simulationStore.getState().timeSeconds,
      playing: q.s.simulationStore.getState().isPlaying,
      speed: q.s.simulationStore.getState().speed,
      reset: q.s.simulationStore.getState().transientResetVersion,
      preset: q.c.useCameraStore.getState().preset,
      cpu: q.cpuSample(),
      lifecycle: window.__c7aProbe.lifecycle(),
    }
  })
const ready = () => page.waitForFunction(() => window.__review.ready.readinessStore.getState().phase === 'ready', null, { timeout: 60000 })
async function listeners() {
  const result = {}
  for (const [name, expression] of [
    ['window', 'window'],
    ['document', 'document'],
    ['canvas', 'document.querySelector("canvas")'],
  ]) {
    const object = await cdp.send('Runtime.evaluate', { expression, objectGroup: 'stage7d-listeners' })
    result[name] = (await cdp.send('DOMDebugger.getEventListeners', { objectId: object.result.objectId })).listeners.map(({ type, useCapture, passive, once, scriptId, lineNumber }) => ({ type, useCapture, passive, once, scriptId, lineNumber }))
  }
  await cdp.send('Runtime.releaseObjectGroup', { objectGroup: 'stage7d-listeners' })
  return result
}
async function screenshot(name) {
  const size = page.viewportSize()
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, ...size, scale: 1 } })
  writeFileSync(resolve(output, name), Buffer.from(data, 'base64'))
}
async function check(name, action) {
  try {
    results[name] = await action()
    write()
    console.log(name + ' passed')
  } catch (error) {
    results.failures.push({ name, error: String(error), stack: error.stack })
    write()
    throw error
  }
}
try {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false, screenWidth: 1280, screenHeight: 720 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await cdp.send('Profiler.disable')
  await page.goto(base + '/?7d', { waitUntil: 'commit' })
  await page.bringToFront()
  await check('cpuCancellation', async () => {
    await page.locator('summary').click()
    await page.waitForFunction(() => document.querySelector('[data-testid=loading-shell] [role=status]')?.textContent.includes('Shaping shoreline'), null, { polling: 1, timeout: 60000 })
    await page.getByRole('button', { name: 'Pause preparation', exact: true }).click()
    await page.getByText('Preparation paused', { exact: true }).waitFor()
    const paused = await page.evaluate(async () => {
      const initialization = await import('/src/initialization/initializeApplication.ts'),
        terrain = await import('/src/scene/world/landing/landingTerrain.ts'),
        presentation = await import('/src/scene/world/stage2/terrainPresentation.ts')
      let sampler
      try {
        terrain.getLandingSupportHeight(4400, -2600)
        sampler = 'unexpected ready sampler'
      } catch (error) {
        sampler = String(error)
      }
      return {
        initialization: initialization.getInitializationBounds(),
        terrain: terrain.getLandingPreparationBounds(),
        indexes: terrain.getLandingSupportIndexBounds(),
        presentation: presentation.getTerrainPresentationBounds(),
        sampler,
        storeBound: !!window.__c7aProbe.store,
        recorder: window.__c7aProbe.lifecycle(),
        detailsOpen: document.querySelector('details').open,
      }
    })
    assert(
      paused.initialization.activeOwners === 0 && paused.terrain.stagingOwners === 0 && paused.terrain.stagingGeometries === 0 && paused.recorder.channels === 0 && !paused.storeBound && paused.indexes.length === 0 && paused.sampler.includes('not finished') && paused.detailsOpen,
      'CPU cancellation did not completely release private work',
    )
    await screenshot('cpu-cancelled.png')
    await page.getByRole('button', { name: 'Retry preparation', exact: true }).click()
    await page.waitForFunction(() => !!window.__c7aProbe?.root && window.__c7aProbe?.readyAt !== null, null, { timeout: 60000 })
    for (const name of ['browser.js', 'resources.js', 'inventory.js', 'ownership.js']) await page.evaluate(read(name))
    const retried = await state()
    assert(retried.time === 0 && !retried.playing && retried.cpu.readiness.completed === 9 && retried.lifecycle.channels === 0, 'CPU retry did not finish paused at zero')
    return { paused, retried }
  })
  results.initialListeners = await listeners()
  const initial = await state()
  await check('graphicsFailure', async () => {
    await page.evaluate(() => {
      const q = window.__review
      q.originalCompile = q.get().gl.compile
      q.get().gl.compile = () => {
        throw new Error('Stage7D controlled graphics failure')
      }
      q.ready.readinessStore.getState().retry()
    })
    await page.waitForFunction(() => window.__review.ready.readinessStore.getState().phase === 'failed')
    const failed = await state()
    await page.evaluate(() => {
      const q = window.__review
      q.get().gl.compile = q.originalCompile
    })
    await page.getByRole('button', { name: 'Retry preparation', exact: true }).click()
    await ready()
    const retried = await state()
    assert(!failed.playing && !retried.playing && retried.cpu.readiness.completed === 9 && retried.cpu.terrainUUID === initial.cpu.terrainUUID && retried.cpu.initialization.generation === initial.cpu.initialization.generation, 'Graphics retry reconstructed CPU work or autoplayed')
    return { failed, retried }
  })
  await check('lossDuringPlay', async () => {
    await page.evaluate(() => {
      const q = window.__review
      q.s.simulationStore.getState().seek(360)
      q.s.simulationStore.getState().setSpeed(1)
      q.c.useCameraStore.getState().requestPreset('lav-west')
    })
    await frames()
    await page.getByTestId('play-pause').click()
    await page.waitForFunction(() => window.__review.s.simulationStore.getState().timeSeconds >= 360.2)
    await page.evaluate(() => {
      window.__loss7d = window.__review.get().gl.getContext().getExtension('WEBGL_lose_context')
      window.__loss7d.loseContext()
    })
    await page.waitForFunction(() => window.__review.ready.readinessStore.getState().phase === 'cancelled' && !window.__review.s.simulationStore.getState().isPlaying)
    const lost = await state()
    await page.selectOption('#camera-select', 'lcac-east')
    await page.mouse.click(200, 40)
    await page.keyboard.press('Space')
    await page.keyboard.press('Home')
    const gated = await state()
    assert(gated.time === lost.time && !gated.playing && gated.preset === 'lcac-east', 'Lost-context input changed time or queued playback')
    await page.evaluate(() => window.__loss7d.restoreContext())
    await ready()
    await frames()
    const restored = await state()
    assert(
      restored.time === lost.time && restored.preset === 'lcac-east' && !restored.playing && restored.cpu.readiness.completed === 9 && restored.cpu.terrainUUID === initial.cpu.terrainUUID && restored.cpu.initialization.generation === initial.cpu.initialization.generation,
      'Play recovery did not retain latest state/CPU ownership',
    )
    return { lost, gated, restored }
  })
  await check('lossDuringPreparation', async () => {
    const interrupted = await page.evaluate(async () => {
      const q = window.__review
      q.ready.readinessStore.getState().retry()
      for (let i = 0; i < 20000; i++) {
        const s = q.ready.readinessStore.getState()
        if (s.phase === 'preparing' && s.completed >= 1 && s.completed < 9) {
          const captured = { phase: s.phase, completed: s.completed, total: s.total, generation: s.generation, time: q.s.simulationStore.getState().timeSeconds }
          window.__loss7d = q.get().gl.getContext().getExtension('WEBGL_lose_context')
          window.__loss7d.loseContext()
          return captured
        }
        await new Promise((resolve) => setTimeout(resolve, 1))
      }
      throw new Error('Did not observe an in-progress graphics job')
    })
    await page.waitForFunction(() => window.__review.ready.readinessStore.getState().phase === 'cancelled')
    await page.selectOption('#camera-select', 'support-convoy')
    const lost = await state()
    await page.evaluate(() => window.__loss7d.restoreContext())
    await ready()
    await frames()
    const restored = await state()
    assert(
      interrupted.completed > 0 &&
        interrupted.completed < 9 &&
        restored.time === interrupted.time &&
        restored.preset === 'support-convoy' &&
        !restored.playing &&
        restored.cpu.readiness.completed === 9 &&
        restored.cpu.terrainUUID === initial.cpu.terrainUUID &&
        restored.cpu.initialization.generation === initial.cpu.initialization.generation &&
        restored.cpu.terrain.stagingOwners === 0 &&
        restored.lifecycle.channels === 0,
      'Preparation recovery lost state or CPU ownership',
    )
    await screenshot('after-recovery.png')
    return { interrupted, lost, restored }
  })
  await check('presets', async () => {
    const ids = await page.locator('#camera-select option').evaluateAll((options) => options.map((o) => o.value)),
      rows = []
    for (const id of ids) {
      await page.selectOption('#camera-select', id)
      await frames()
      rows.push(
        await page.evaluate(() => ({
          preset: window.__review.c.useCameraStore.getState().preset,
          selected: document.querySelector('#camera-select').value,
          position: window.__review.get().camera.position.toArray(),
          target: window.__review.get().controls.target.toArray(),
          time: window.__review.s.simulationStore.getState().timeSeconds,
        })),
      )
    }
    assert(rows.length === 24 && rows.every((row, i) => row.preset === ids[i] && row.selected === ids[i] && row.position.every(Number.isFinite) && row.target.every(Number.isFinite)), 'Native preset selection failed')
    return rows
  })
  await check('resources', async () => {
    const initialRender = await page.evaluate(read('inspect.js'))
    await page.evaluate((roots) => {
      window.__review.actorRoots = roots
    }, initialRender.roots)
    await page.evaluate(async () => {
      await window.__review.resourceCycle()
    })
    const cycles = []
    await page.evaluate(() => {
      const q = window.__review
      q.nativeDisposals = []
      q.restoreGeometryDispose = q.T.BufferGeometry.prototype.dispose
      q.restoreMaterialDispose = q.T.Material.prototype.dispose
      q.T.BufferGeometry.prototype.dispose = function (...args) {
        q.nativeDisposals.push({ kind: 'geometry', uuid: this.uuid })
        return q.restoreGeometryDispose.apply(this, args)
      }
      q.T.Material.prototype.dispose = function (...args) {
        q.nativeDisposals.push({ kind: 'material', uuid: this.uuid })
        return q.restoreMaterialDispose.apply(this, args)
      }
    })
    try {
      for (let i = 0; i < 5; i++) {
        cycles.push(
          await page.evaluate(async () => {
            const q = window.__review
            q.nativeDisposals = []
            const result = await q.resourceCycle()
            await q.frames(24)
            return { ...result, lifecycle: window.__c7aProbe.lifecycle(), disposed: [...q.nativeDisposals] }
          }),
        )
        save('resource-cycles-native.json', cycles)
      }
    } finally {
      await page.evaluate(() => {
        const q = window.__review
        q.T.BufferGeometry.prototype.dispose = q.restoreGeometryDispose
        q.T.Material.prototype.dispose = q.restoreMaterialDispose
      })
    }
    const checks = []
    for (let i = 1; i < cycles.length; i++) {
      const a = cycles[i - 1].inventory,
        b = cycles[i].inventory
      const changed = a.static.filter((row, index) => JSON.stringify(row) !== JSON.stringify(b.static[index]))
      const responseOnly = a.static.every((row, index) => row.every((value, column) => column === 4 || JSON.stringify(value) === JSON.stringify(b.static[index][column])))
      const shape = (pools) => pools.map(({ uuid: _uuid, ...p }) => JSON.stringify(p)).sort()
      const resident = new Set(a.allPools.map((p) => p.uuid))
      const replaced = Object.fromEntries(['geometry', 'material'].map((kind) => [kind, a.resources[kind].filter((uuid) => !b.resources[kind].includes(uuid))]))
      checks.push({
        changedWorldRecords: changed.length,
        responseOnly,
        fixedUnchanged: a.static.length - changed.length,
        poolShapeEqual: JSON.stringify(shape(a.allPools)) === JSON.stringify(shape(b.allPools)),
        residentPools: b.allPools.filter((p) => resident.has(p.uuid)).length,
        resourcesEqual: JSON.stringify(a.resources) === JSON.stringify(b.resources),
        resourceCountsEqual: Object.keys(a.resources).every((kind) => a.resources[kind].length === b.resources[kind].length),
        replacedCounts: Object.fromEntries(Object.entries(replaced).map(([kind, values]) => [kind, values.length])),
        replacedResourcesDisposed: Object.entries(replaced).every(([kind, values]) => values.every((uuid) => cycles[i].disposed.some((d) => d.kind === kind && d.uuid === uuid))),
      })
    }
    const finalRender = await page.evaluate(read('inspect.js'))
    assert(
      cycles.every(
        (c) =>
          c.inventory.static.length === 936 &&
          c.inventory.allPools.length === 231 &&
          c.inventory.allPools.reduce((sum, p) => sum + p.capacity, 0) === 9528 &&
          c.inventory.sample.actorRoots.length === 35 &&
          c.inventory.sample.actorRoots.every((r) => r.present) &&
          c.cpu.initialization.activeOwners === 0 &&
          c.cpu.terrain.stagingOwners === 0 &&
          c.cpu.presentation.stagingOwners === 0 &&
          c.lifecycle.channels === 0 &&
          c.lifecycle.timers === 0 &&
          c.lifecycle.observers === 1 &&
          c.lifecycle.attachments === 1 &&
          c.cpu.readiness.completed === 9,
      ),
      'Resource population/owner bounds failed',
    )
    assert(
      checks.every((c) => c.changedWorldRecords === 26 && c.responseOnly && c.fixedUnchanged === 910 && c.poolShapeEqual && c.residentPools === 183 && c.resourceCountsEqual && c.replacedResourcesDisposed),
      'Resource cycle changed fixed resources/capacity or retained replaced resources',
    )
    assert(finalRender.errors.length === 0 && finalRender.roots.length === 35 && finalRender.wheels.length === 64 && finalRender.landscape.length === 65 && JSON.stringify(initialRender.landscape) === JSON.stringify(finalRender.landscape), 'Resource cycles replaced resident landscape or actors')
    return { checks, endpoint: cycles.at(-1).inventory.sample, cpu: cycles.map((c) => c.cpu), landscapePreserved: true }
  })
  await check('speeds', async () => {
    const rows = []
    for (const speed of [0.5, 1, 2]) {
      await page.getByRole('button', { name: speed + '×', exact: true }).click()
      const before = await state()
      await page.getByTestId('play-pause').click()
      await page.waitForFunction((start) => window.__review.s.simulationStore.getState().timeSeconds > start + 0.3, before.time)
      await page.getByTestId('play-pause').click()
      const after = await state()
      assert(after.speed === speed && !after.playing && after.time > before.time, 'Native playback speed failed')
      rows.push({ speed, before, after })
    }
    return rows
  })
  await check('pausedInspection', async () => {
    await page.evaluate(() => {
      const q = window.__review
      q.s.simulationStore.getState().seek(183)
      q.c.useCameraStore.getState().requestPreset('lcac-east')
    })
    await frames(45)
    const before = await page.evaluate(read('inspect.js'))
    const pose = () => page.evaluate(() => ({ camera: window.__review.get().camera.position.toArray(), target: window.__review.get().controls.target.toArray(), time: window.__review.s.simulationStore.getState().timeSeconds }))
    const original = await pose(),
      poses = []
    for (const button of ['left', 'right']) {
      await page.mouse.move(450, 300)
      await page.mouse.down({ button })
      await page.mouse.move(540, 345, { steps: 12 })
      await page.mouse.up({ button })
      await frames(45)
      poses.push(await pose())
    }
    await page.mouse.wheel(0, -180)
    await frames(45)
    poses.push(await pose())
    const after = await page.evaluate(read('inspect.js'))
    // OrbitControls carries pan damping into the next frame. Let the input
    // finish before requesting a numerically exact recenter.
    await frames(240)
    await page.getByRole('button', { name: 'Recenter selected camera', exact: true }).click()
    await frames(45)
    const recentered = await pose()
    save('paused-inspection-check.json', { original, poses, recentered })
    const visible = (r) => ({ time: r.time, roots: r.roots, wheels: r.wheels, fans: r.fans, navigation: r.navigation, effects: r.effects, fireLights: r.fireLights, waterExpected: r.waterExpected })
    assert(before.errors.length === 0 && after.errors.length === 0 && JSON.stringify(visible(before)) === JSON.stringify(visible(after)), 'Paused inspection changed logical/mechanical/effect state')
    assert(poses.every((p, i) => JSON.stringify(p.camera) !== JSON.stringify((i ? poses[i - 1] : original).camera)) && recentered.camera.every((v, i) => Math.abs(v - original.camera[i]) < 1e-8) && recentered.target.every((v, i) => Math.abs(v - original.target[i]) < 1e-8), 'Orbit/pan/zoom/recenter failed')
    return { before, after, original, poses, recentered }
  })
  await check('timeAndKeyboard', async () => {
    const input = page.getByRole('spinbutton', { name: 'Observation time in seconds' }),
      rows = []
    const record = async (action) => rows.push({ action, ...(await state()) })
    const prior = await state()
    await input.fill('7200')
    await input.press('Home')
    assert((await state()).time === prior.time, 'Input Home leaked into global seek')
    await input.press('Enter')
    await frames()
    await record('input Enter 7200')
    assert(rows.at(-1).time === 7200, 'Late native seek failed')
    await input.fill('183')
    await page.getByRole('button', { name: 'Seek observation time', exact: true }).click()
    await frames()
    await record('Go backwards 183')
    assert(rows.at(-1).time === 183, 'Backward native seek failed')
    await page.getByRole('button', { name: 'Restart simulation', exact: true }).focus()
    await page.keyboard.press('Home')
    assert((await state()).time === 183, 'Button focus leaked Home into global seek')
    await page.mouse.click(200, 40)
    for (const [key, expected] of [
      ['Home', 0],
      ['ArrowRight', 1],
      ['Shift+ArrowRight', 11],
      ['ArrowLeft', 10],
      ['Shift+ArrowLeft', 0],
      ['End', 180],
    ]) {
      await page.keyboard.press(key)
      await frames(3)
      await record(key)
      assert(rows.at(-1).time === expected, 'Global key failed: ' + key)
    }
    for (const key of ['Space', 'Enter']) {
      await page.keyboard.press(key)
      await page.waitForFunction(() => window.__review.s.simulationStore.getState().isPlaying)
      await frames(6)
      await page.keyboard.press(key)
      await frames(3)
      await record(key + ' toggle')
      assert(!rows.at(-1).playing && rows.at(-1).time > 180, 'Global playback toggle failed')
    }
    await page.locator('summary').click()
    await page.locator('[data-hud-scroll]').focus()
    const beforeScroll = await state()
    await page.keyboard.press('End')
    await record('details End')
    assert(rows.at(-1).time === beforeScroll.time && !rows.at(-1).playing, 'Details focus leaked End into timeline')
    await page.locator('summary').click()
    const beforeRestart = await state()
    await page.getByRole('button', { name: 'Restart simulation', exact: true }).click()
    await frames()
    await record('Restart')
    assert(rows.at(-1).time === 0 && !rows.at(-1).playing && rows.at(-1).reset === beforeRestart.reset + 1 && rows.at(-1).cpu.initialization.generation === initial.cpu.initialization.generation, 'Restart reconstructed the scene or autoplayed')
    return rows
  })
  await check('layouts', async () => {
    const rows = []
    for (const size of [
      { width: 1280, height: 720 },
      { width: 1280, height: 540 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(size)
      await frames(45)
      await cdp.send('Emulation.setDeviceMetricsOverride', { ...size, deviceScaleFactor: 1, mobile: false, screenWidth: size.width, screenHeight: size.height })
      await frames(24)
      const bounds = await page.evaluate(() => {
        const rect = (o) => {
          const r = o.getBoundingClientRect()
          return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
        }
        return {
          viewport: [innerWidth, innerHeight],
          scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
          buffer: [window.__review.get().gl.domElement.width, window.__review.get().gl.domElement.height],
          controls: [...document.querySelectorAll('button,select,input,summary')].map((o) => ({ label: o.getAttribute('aria-label') || o.textContent, rect: rect(o) })),
        }
      })
      assert(bounds.controls.every(({ rect: r }) => r.x >= 0 && r.y >= 0 && r.right <= size.width && r.bottom <= size.height) && bounds.buffer.join() === [size.width, size.height].join() && bounds.scroll[0] === size.width && bounds.scroll[1] === size.height, 'Layout has inaccessible/offscreen controls')
      await screenshot('layout-' + size.width + 'x' + size.height + '.png')
      await page.locator('summary').click()
      const details = await page.locator('[data-hud-scroll]').evaluate((o) => {
        o.scrollTop = o.scrollHeight
        const r = o.getBoundingClientRect()
        return { height: r.height, bottom: r.bottom, scrollTop: o.scrollTop, scrollHeight: o.scrollHeight, clientHeight: o.clientHeight }
      })
      assert(details.height > 0 && details.bottom <= size.height && details.scrollTop > 0 && details.scrollTop + details.clientHeight >= details.scrollHeight - 1, 'Full details cannot be scrolled to the end')
      await screenshot('layout-' + size.width + 'x' + size.height + '-details.png')
      await page.locator('summary').click()
      rows.push({ size, bounds, details })
    }
    return rows
  })
  await check('pausedCadenceControl', async () => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false, screenWidth: 1280, screenHeight: 720 })
    await page.evaluate(() => {
      const q = window.__review
      q.s.simulationStore.getState().seek(360)
      q.c.useCameraStore.getState().requestPreset('fuel-storage')
    })
    await frames(24)
    // Diagnostic only: no stopped-render result is used for playback acceptance.
    // This separates available browser RAF cadence from the paused 3D draw path.
    const rows = await page.evaluate(async () => {
      const q = window.__review,
        original = q.get().frameloop,
        result = []
      try {
        for (const mode of ['always', 'never', 'never', 'always']) {
          q.get().setFrameloop(mode)
          await q.frames(24)
          const before = q.get().gl.info.render.frame,
            gaps = []
          let last = await new Promise(requestAnimationFrame)
          for (let i = 0; i < 240; i++) {
            const next = await new Promise(requestAnimationFrame)
            gaps.push(next - last)
            last = next
          }
          result.push({ mode, gaps, renders: q.get().gl.info.render.frame - before, time: q.s.simulationStore.getState().timeSeconds, visibility: document.visibilityState, focused: document.hasFocus() })
        }
      } finally {
        q.get().setFrameloop(original)
      }
      return result
    })
    assert(
      rows.every((r) => r.time === 360 && r.visibility === 'visible' && (r.mode === 'never' ? r.renders === 0 : r.renders >= 240)),
      'Paused cadence control failed to isolate renderer scheduling',
    )
    return { scope: 'Separate reversible diagnostic; never a playback/quality pass', rows }
  })
  results.finalListeners = await listeners()
  results.identity = await (await fetch(base + '/__7d_identity')).json()
  results.final = await state()
  await page.evaluate(() => window.__c7aProbe.dispose())
  results.disposed = await page.evaluate(() => window.__c7aProbe.lifecycle())
  results.completed = new Date().toISOString()
  write()
} catch (error) {
  results.interruption = String(error)
  write()
  throw error
} finally {
  await context.close()
  await browser.close()
}
