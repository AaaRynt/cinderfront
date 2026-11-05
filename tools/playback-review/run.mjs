/** Optional headed-browser evidence controller; never part of default checks. */
import { chromium } from '@playwright/test'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const output = resolve(process.argv[2] ?? 'stage7d-review.local')
const before = process.argv[3] ?? 'http://127.0.0.1:5196'
const after = process.argv[4] ?? 'http://127.0.0.1:5197'
const here = fileURLToPath(new URL('.', import.meta.url))
const read = (name) => readFileSync(resolve(here, name), 'utf8')
const save = (name, value) => writeFileSync(resolve(output, name), JSON.stringify(value))
const sha = (value) => createHash('sha256').update(value).digest('hex')
mkdirSync(output, { recursive: true })

const firstSchedule = [
  [0, 'wasp'],
  [20, 'f35-01'],
  [35, 'radar-hill'],
  [41, 'search-radar'],
  [49, 'f35-02'],
  [52, 'harbor'],
  [61, 'molniya'],
  [71, 'talwar'],
  [78, 'fuel-storage'],
  [104, 'su30'],
  [111, 'secondary-pantsir'],
  [114, 'talwar'],
  [118, 'secondary-pantsir'],
  [124, 'support-convoy'],
  [128, 'molniya'],
  [131, 'ammunition'],
  [133, 'btr'],
  [140, 'lcac-west'],
  [156, 't72'],
  [161, 'lcac-west'],
  [166, 'lcac-east'],
  [178, 'beachhead'],
  [182, 'lcac-east'],
  [189, 'lav-east'],
  [198, 'beach-offshore'],
]
const visits = [0, 78, 92, 104, 176, 185, 206, 240, 360, 540, 7200]
const windows = [
  { name: 'fuel-1x', start: 78, untilTime: 104, speed: 1, preset: 'fuel-storage' },
  { name: 'landing-1x', start: 176, untilTime: 206, speed: 1, preset: 'lcac-east' },
  { name: 'fuel-2x', start: 78, untilTime: 104, speed: 2, preset: 'fuel-storage' },
  { name: 'landing-2x', start: 176, untilTime: 206, speed: 2, preset: 'lcac-east' },
  { name: 'aftermath-2x', start: 360, wallSeconds: 90, speed: 2, preset: 'fuel-storage' },
]
const order = [
  ['B1', before],
  ['A1', after],
  ['A2', after],
  ['B2', before],
  ['B3', before],
  ['A3', after],
]
const helperNames = ['probe.mjs', 'server.mjs', 'run.mjs', 'browser.js', 'inspect.js', 'resources.js', 'inventory.js', 'ownership.js', 'poses.json', 'render-times.json']
const contract = {
  reference: 'e817b1c310a792adc24d66e722830d2f6caac44e',
  date: new Date().toISOString(),
  order: order.map(([name]) => name),
  firstSchedule,
  visits,
  pausedFrames: 24,
  windows,
  hashes: Object.fromEntries(helperNames.map((name) => [name, sha(read(name))])),
  correction: 'Optional recorder ownership only. Application source is unchanged. No application CPU gain is claimed.',
  acceptance: { causeMustBeReproduced: true, applicationTargetIfEdited: '20% lower predeclared live-component median-of-three P95', cpuRegressionLimit: 'max(10%,1ms)', readyRegressionLimit: 'max(10%,500ms)', eachWarmAndSustainedRafP95Ms: 33.3, exactImages: 25, renderedCheckpoints: 613, sustainedSeconds: 600 },
  conditions:
    'Headed installed Chrome; one owned renderer; fresh context each; shared process/driver cache; both origins preloaded once to ready, then closed; no forced GC; dev StrictMode, DPR1, 1280x720. Explicit CDP device metrics correct Retina capture backing; PNG dimensions are checked before application navigation and for every exact image. No profiler/GPU queries/screenshots/inventories during pacing.',
}
save('primary-contract.json', contract)

const browser = await chromium.launch({ channel: 'chrome', headless: false })
const browserCDP = await browser.newBrowserCDPSession()
const browserMetadata = {
  version: await browserCDP.send('Browser.getVersion'),
  commandLine: await browserCDP.send('Browser.getBrowserCommandLine').catch((error) => ({ unavailable: String(error) })),
  gpu: await browserCDP.send('SystemInfo.getInfo').catch((error) => ({ unavailable: String(error) })),
}
save('browser-metadata.json', browserMetadata)
const contexts = [],
  progress = []
const log = (message) => {
  const row = { at: new Date().toISOString(), message }
  progress.push(row)
  save('primary-progress.json', progress)
  console.log(row.at, message)
}
const metrics = async (cdp) => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]))
async function openViewer(base, label) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
  const page = await context.newPage(),
    errors = []
  page.on('pageerror', (error) => errors.push(String(error)))
  const cdp = await context.newCDPSession(page)
  await page.goto(base + '/__7c_control')
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false, screenWidth: 1280, screenHeight: 720 })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await cdp.send('Profiler.disable')
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' })
  const calibration = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1 } })
  const calibrationBytes = Buffer.from(calibration.data, 'base64'),
    captureSize = [calibrationBytes.readUInt32BE(16), calibrationBytes.readUInt32BE(20)]
  if (captureSize.join() !== '1280,720') throw new Error('Native PNG calibration failed: ' + label)
  await page.addInitScript(() => {
    window.__reviewVisibility = []
    const record = (event) => window.__reviewVisibility.push([performance.now(), event.type, document.visibilityState, document.hasFocus()])
    for (const event of ['visibilitychange', 'focus', 'blur']) window.addEventListener(event, record)
  })
  await page.goto(base + '/?7d', { waitUntil: 'domcontentloaded' })
  await page.bringToFront()
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await cdp.send('Profiler.disable')
  await page.waitForFunction(() => window.__c7aProbe?.readyAt !== null && !!window.__c7aProbe?.root, null, { timeout: 60000 })
  const startup = await page.evaluate(() => window.__c7aProbe.export())
  save(label + '-startup.json', startup)
  const metadata = await page.evaluate(() => {
    const p = window.__c7aProbe,
      gl = p.root.gl,
      context = gl.getContext(),
      debug = context.getExtension('WEBGL_debug_renderer_info')
    return {
      userAgent: navigator.userAgent,
      visibility: document.visibilityState,
      focused: document.hasFocus(),
      events: window.__reviewVisibility,
      cpuRateSet: 1,
      profilerEnabled: false,
      recorder: p.lifecycle(),
      viewport: [innerWidth, innerHeight],
      buffer: [gl.domElement.width, gl.domElement.height],
      dpr: gl.getPixelRatio(),
      documentDpr: devicePixelRatio,
      antialias: context.getContextAttributes().antialias,
      shadows: { enabled: gl.shadowMap.enabled, type: gl.shadowMap.type },
      renderer: debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER),
      time: p.store.getState().timeSeconds,
      playing: p.store.getState().isPlaying,
      scripts: performance
        .getEntriesByType('resource')
        .filter((e) => /\.(?:tsx?|m?js)(?:\?|$)/.test(e.name))
        .map((e) => ({ url: e.name, transferSize: e.transferSize, duration: e.duration })),
    }
  })
  const identity = await (await fetch(base + '/__7d_identity')).json()
  save(label + '-identity.json', identity)
  contexts.push({ label, base, metadata: { ...metadata, captureSize }, identity: { applicationHash: identity.applicationHash, probeHash: identity.probeHash, serverHash: identity.serverHash } })
  save('primary-contexts.json', contexts)
  if (
    metadata.visibility !== 'visible' ||
    !metadata.focused ||
    metadata.viewport.join() !== '1280,720' ||
    metadata.buffer.join() !== '1280,720' ||
    metadata.dpr !== 1 ||
    metadata.documentDpr !== 1 ||
    !metadata.antialias ||
    !metadata.shadows.enabled ||
    metadata.recorder.attachments !== 1 ||
    metadata.recorder.channels !== 0
  )
    throw new Error('Context contract failed: ' + label)
  return { context, page, cdp, label, base, errors }
}
async function closeViewer(viewer) {
  const final = await viewer.page.evaluate(() => {
    const p = window.__c7aProbe,
      before = p.lifecycle()
    p.dispose()
    return { before, disposed: p.lifecycle(), visibility: document.visibilityState, focused: document.hasFocus(), events: window.__reviewVisibility }
  })
  save(viewer.label + '-closed.json', { ...final, errors: viewer.errors })
  await viewer.context.close()
}
async function play(viewer, config, first = false) {
  const { page, cdp, label } = viewer
  const setup = await page.evaluate(
    async ({ config, first }) => {
      const p = window.__c7aProbe,
        s = p.store.getState()
      if (first) {
        if (s.timeSeconds !== 0 || s.isPlaying) throw new Error('First play must start at paused zero')
      } else {
        s.pause()
        s.seek(config.start)
        s.setSpeed(config.speed)
        p.cameraStore.getState().requestPreset(config.preset)
        for (let i = 0; i < 24; i++) await new Promise(requestAnimationFrame)
      }
      p.arm({ ...config, schedule: config.schedule ?? [] })
      return { wall: performance.now(), time: p.store.getState().timeSeconds, lifecycle: p.lifecycle(), visibility: document.visibilityState, focused: document.hasFocus() }
    },
    { config, first },
  )
  const metricStart = await metrics(cdp)
  await page.getByTestId('play-pause').click()
  await page.waitForFunction(() => window.__c7aProbe.done, null, { polling: 1000, timeout: first ? 600000 : config.wallSeconds ? (config.wallSeconds + 120) * 1000 : 180000 })
  const metricEnd = await metrics(cdp)
  const result = await page.evaluate(() => window.__c7aProbe.take())
  const finished = await page.evaluate(() => ({ visibility: document.visibilityState, focused: document.hasFocus(), events: window.__reviewVisibility, lifecycle: window.__c7aProbe.lifecycle() }))
  save(label + '-' + config.name + '.json', { ...result, setup, finished, metricStart, metricEnd })
  log(label + ' ' + config.name + ': ' + result.runEnd.elapsed.toFixed(3) + ' real seconds, T+' + result.runEnd.time.toFixed(3) + ', ' + result.frames.length + ' RAF rows')
  if (result.truncated) throw new Error('Recording capacity exceeded')
}
async function helpers(page) {
  for (const name of ['browser.js', 'resources.js', 'inventory.js', 'ownership.js']) await page.evaluate(read(name))
}
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !['uuid', 'geometry', 'material'].includes(key))
        .map(([key, v]) => [key, canonical(v)]),
    )
  return value
}
async function exactEvidence(viewer, side) {
  const { page, cdp } = viewer
  await helpers(page)
  await page.evaluate(() => {
    window.__c7aProbe.store.getState().setSpeed(1)
    document.activeElement?.blur()
  })
  const poses = JSON.parse(read('poses.json')),
    images = []
  const imageDir = resolve(output, side + '-rgb')
  mkdirSync(imageDir, { recursive: true })
  for (let i = 0; i < poses.length; i++) {
    const pose = poses[i]
    await page.selectOption('#camera-select', pose.preset)
    await page.evaluate(async (pose) => {
      const q = window.__review
      q.s.simulationStore.getState().seek(pose.time)
      document.activeElement?.blur()
      await q.frames(24)
      const r = q.get()
      r.camera.position.fromArray(pose.position)
      r.controls.target.fromArray(pose.target)
      r.camera.fov = pose.fov
      r.camera.updateProjectionMatrix()
      r.controls.update()
      await q.frames(3)
    }, pose)
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: 0, y: 0, width: 1280, height: 720, scale: 1 } })
    const path = resolve(imageDir, String(i).padStart(2, '0') + '.png')
    const png = Buffer.from(data, 'base64')
    if (png.readUInt32BE(16) !== 1280 || png.readUInt32BE(20) !== 720) throw new Error('Wrong complete PNG dimensions')
    writeFileSync(path, png)
    images.push({ ...pose, path, sha256: sha(Buffer.from(data, 'base64')) })
  }
  save(side + '-images.json', images)
  log(viewer.label + ': captured all 25 complete PNGs')
  const times = JSON.parse(read('render-times.json')),
    rows = [],
    full = []
  for (const time of times) {
    await page.evaluate(async (time) => {
      const q = window.__review
      q.s.simulationStore.getState().seek(time)
      q.c.useCameraStore.getState().requestPreset(time >= 160 ? 'lcac-east' : 'fuel-storage')
      await q.frames(24)
    }, time)
    const result = await page.evaluate(read('inspect.js'))
    full.push(result)
    const independent = {
      time: result.time,
      playing: result.playing,
      phase: result.phase,
      eventCount: result.eventCount,
      lastEvent: result.lastEvent,
      occupancy: result.occupancy,
      lav: result.lav,
      roots: result.roots,
      wheels: result.wheels,
      waterExpected: result.waterExpected,
      waterGPU: result.waterGPU,
      gpuDrawn: result.gpuDrawn,
      wear: result.wear,
      fans: result.fans,
      navigation: result.navigation,
      effects: result.effects,
      fireLights: result.fireLights,
      camera: result.camera,
      target: result.target,
    }
    rows.push({ time, roots: result.roots.length, wheels: result.wheels.length, landscape: result.landscape.length, errors: result.errors, hash: sha(JSON.stringify(canonical(independent))) })
    if (rows.length % 100 === 0) {
      save(side + '-rendered.json', full)
      save(side + '-render-summary.json', rows)
      log(viewer.label + ': rendered ' + rows.length + '/' + times.length + ' checkpoints')
    }
  }
  save(side + '-rendered.json', full)
  save(side + '-render-summary.json', rows)
  if (rows.some((row) => row.errors.length || row.roots !== 35 || row.wheels !== 64 || row.landscape !== 65)) throw new Error('Rendered agreement failed: ' + side)
  log(viewer.label + ': all 613 actual rendered checkpoints agree')
}

let active
try {
  for (const [label, base] of [
    ['preload-before', before],
    ['preload-after', after],
  ]) {
    active = await openViewer(base, label)
    await closeViewer(active)
    active = undefined
    log(label + ' completed and closed')
  }
  const [b, a] = await Promise.all([fetch(before + '/__7d_identity').then((r) => r.json()), fetch(after + '/__7d_identity').then((r) => r.json())])
  if (b.applicationHash !== a.applicationHash || b.probeHash !== a.probeHash || b.serverHash !== a.serverHash) throw new Error('Measurement-only comparison source identities differ')
  for (const [label, base] of order) {
    active = await openViewer(base, label)
    log(label + ' ready; starting natural first play')
    await play(active, { name: 'first', untilTime: 206, speed: 1, schedule: firstSchedule }, true)
    await active.page.evaluate(async (visits) => {
      const p = window.__c7aProbe
      for (const time of visits) {
        p.store.getState().seek(time)
        for (let i = 0; i < 24; i++) await new Promise(requestAnimationFrame)
      }
    }, visits)
    for (const config of windows) await play(active, config)
    await helpers(active.page)
    save(label + '-warm-owners.json', await active.page.evaluate(() => ({ cpu: window.__review.cpuSample(), recorder: window.__c7aProbe.lifecycle(), rendererFrame: window.__c7aProbe.root.gl.info.render.frame })))
    if (label === 'B1') await exactEvidence(active, 'before')
    if (label === 'A3') {
      const rendered = await active.page.evaluate(read('inspect.js'))
      await active.page.evaluate((roots) => {
        window.__review.actorRoots = roots
      }, rendered.roots)
      save('before-sustained-inventory.json', await active.page.evaluate(() => window.__review.inventory()))
      await play(active, { name: 'sustained', start: 360, wallSeconds: 600, speed: 2, preset: 'fuel-storage' })
      save('after-sustained-owners.json', await active.page.evaluate(() => ({ cpu: window.__review.cpuSample(), recorder: window.__c7aProbe.lifecycle() })))
      save('after-sustained-inventory.json', await active.page.evaluate(() => window.__review.inventory()))
      await exactEvidence(active, 'after')
      const cycleRoots = await active.page.evaluate(read('inspect.js'))
      await active.page.evaluate((roots) => {
        window.__review.actorRoots = roots
      }, cycleRoots.roots)
      await active.page.evaluate(async () => {
        await window.__review.resourceCycle()
      })
      const cycles = []
      for (let i = 0; i < 5; i++) {
        cycles.push(await active.page.evaluate(async () => ({ ...(await window.__review.resourceCycle()), lifecycle: window.__c7aProbe.lifecycle() })))
        save('resource-cycles.json', cycles)
      }
      log('A3: five warmed equal-time restart/seek/all-camera resource cycles completed')
    }
    await closeViewer(active)
    active = undefined
  }
  save('primary-complete.json', { complete: true, at: new Date().toISOString() })
} catch (error) {
  save('primary-interruption.json', { error: String(error), stack: error.stack, at: new Date().toISOString(), active: active?.label })
  throw error
} finally {
  if (active) {
    try {
      await closeViewer(active)
    } catch {
      await active.context.close()
    }
  }
  await browser.close()
}
