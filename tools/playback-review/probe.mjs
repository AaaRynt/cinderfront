/** Opt-in development recorder. Never imported by the application. */
export function installPlaybackProbe(env = globalThis) {
  const key = '__cinderfrontPlaybackRecorder'
  if (env[key] && !env[key].disposed) return env[key]
  const now = () => env.performance.now()
  const frames = new Set(),
    timers = new Set(),
    observers = new Set(),
    restorers = []
  const renderers = new WeakSet(),
    contexts = new WeakSet()
  let raf = 0,
    last = now(),
    click,
    phaseObserver,
    paintObserver
  const p = {
    version: '7d-owned-1',
    active: true,
    disposed: false,
    detail: false,
    truncated: false,
    timeOrigin: env.performance.timeOrigin,
    firstUI: null,
    firstDraw: null,
    readyAt: null,
    frames: [],
    longTasks: [],
    misses: [],
    commits: [],
    commitEffectsRows: [],
    postCommitRows: [],
    nativeSlowCalls: [],
    marks: [],
    counts: {},
    worldTotals: {},
    detailCounts: {},
    dropped: {},
    startup: { nativeContext: [], spans: [], chunks: [], modules: [], heartbeats: [], memory: [], paints: [], progress: [], graphicsJobs: [] },
    worldCalls: 0,
    worldMisses: 0,
    worldWork: 0,
    renderWork: 0,
    reactWork: 0,
    compileCalls: 0,
    compileWork: 0,
    queryWork: 0,
    uploadBytes: 0,
    uploadWork: 0,
    channels: 0,
    peakChannels: 0,
    installations: 1,
    attachments: 0,
  }
  env[key] = env.__c7aProbe = p
  const recording = () => !p.disposed && p.active && (p.readyAt === null || (p.run && !p.done))
  const keep = (name, row, limit = 60000) => {
    if (p[name].length < limit) p[name].push(row)
    else {
      p.truncated = true
      p.dropped[name] = (p.dropped[name] ?? 0) + 1
    }
  }
  const keepStartup = (name, row, limit = 5000) => {
    if (p.startup[name].length < limit) p.startup[name].push(row)
    else {
      p.startup.truncated = true
      p.truncated = true
      p.startup.dropped ??= {}
      p.startup.dropped[name] = (p.startup.dropped[name] ?? 0) + 1
    }
  }
  p.slice = (row) => keepStartup('chunks', row)
  p.graphicsJob = (row) => keepStartup('graphicsJobs', row, 1000)
  const restoreMethod = (object, name, wrap) => {
    const original = object[name],
      descriptor = Object.getOwnPropertyDescriptor(object, name),
      wrapped = wrap(original)
    object[name] = wrapped
    restorers.push(() => {
      if (object[name] === wrapped) {
        if (descriptor) Object.defineProperty(object, name, descriptor)
        else delete object[name]
      }
    })
  }
  const observe = (Type, callback, options, target) => {
    const observer = new Type(callback)
    observers.add(observer)
    if (target) observer.observe(target, options)
    else observer.observe(options)
    return observer
  }
  const disconnect = (observer) => {
    if (observer) {
      observer.disconnect()
      observers.delete(observer)
    }
  }
  const later = (callback, ms) => {
    const id = env.setTimeout(() => {
      timers.delete(id)
      if (!p.disposed) callback()
    }, ms)
    timers.add(id)
    return id
  }
  const schedule = () => {
    if (raf || p.disposed || (!recording() && p.readyAt !== null)) return
    raf = env.requestAnimationFrame((time) => {
      frames.delete(raf)
      raf = 0
      frame(time)
    })
    frames.add(raf)
  }
  p.lifecycle = () => ({ disposed: p.disposed, scheduledFrames: frames.size, timers: timers.size, observers: observers.size, listeners: click ? 1 : 0, attachments: p.attachments, channels: p.channels, peakChannels: p.peakChannels })
  p.channelOpen = () => {
    p.channels++
    p.peakChannels = Math.max(p.channels, p.peakChannels)
  }
  p.channelClose = () => {
    p.channels--
  }
  p.bindStore = (store) => {
    p.store = store
  }
  p.bindCamera = (store) => {
    p.cameraStore = store
  }
  p.module = (name) => {
    keepStartup('modules', [name, now()], 1000)
  }
  p.span = (name, start) => {
    if (p.readyAt === null) keepStartup('spans', { name, start, end: now() })
  }
  p.world = (time, ms, hit, who = 'other') => {
    if (!recording()) return
    p.worldCalls++
    p.worldWork += ms
    const name = ['hud', 'scene', 'camera'].includes(who) ? who : 'other',
      c = (p.worldTotals[name] ??= { calls: 0, misses: 0, ms: 0 })
    c.calls++
    c.ms += ms
    if (!hit) {
      c.misses++
      p.worldMisses++
      keep('misses', [now(), time, ms, name])
    }
  }
  p.commit = (id, phase, actual, base, start, commit) => {
    if (recording()) {
      p.reactWork += actual
      keep('commits', [commit, id, phase, actual, base])
    }
  }
  p.commitEffects = (id, phase, ms, wall) => {
    if (recording()) keep('commitEffectsRows', [wall, id, phase, ms], 120000)
  }
  p.postCommit = (id, phase, ms, wall) => {
    if (recording()) keep('postCommitRows', [wall, id, phase, ms], 120000)
  }
  p.count = (name) => {
    if (p.detail && recording()) p.detailCounts[name] = (p.detailCounts[name] ?? 0) + 1
  }
  p.attach = (state) => {
    if (p.disposed) throw new Error('Recorder has been disposed')
    p.root = state
    const renderer = state.gl,
      context = renderer.getContext()
    p.quality = { antialias: context.getContextAttributes().antialias, dpr: renderer.getPixelRatio(), viewport: [env.innerWidth, env.innerHeight] }
    if (!renderers.has(renderer)) {
      renderers.add(renderer)
      p.attachments++
      restoreMethod(
        renderer,
        'render',
        (original) =>
          function (...args) {
            if (!recording()) return original.apply(this, args)
            const start = now(),
              result = original.apply(this, args)
            p.renderWork += now() - start
            if (p.firstDraw === null) {
              p.firstDraw = now()
              p.marks.push(['firstDraw', p.firstDraw])
            }
            return result
          },
      )
    }
    if (contexts.has(context)) return
    contexts.add(context)
    for (const name of ['compileShader', 'linkProgram', 'getProgramParameter', 'getShaderParameter', 'getProgramInfoLog', 'getShaderInfoLog', 'getActiveUniform', 'getActiveAttrib', 'getUniformLocation', 'getAttribLocation', 'bufferData', 'bufferSubData']) {
      restoreMethod(
        context,
        name,
        (original) =>
          function (...args) {
            if (!recording()) return original.apply(this, args)
            const start = now(),
              result = original.apply(this, args),
              ms = now() - start
            p.counts[name] = (p.counts[name] ?? 0) + 1
            if (ms >= 1) keep('nativeSlowCalls', { name, start, ms, time: p.store?.getState().timeSeconds }, 10000)
            if (name === 'compileShader' || name === 'linkProgram') {
              p.compileCalls++
              p.compileWork += ms
            } else if (name === 'bufferData' || name === 'bufferSubData') {
              p.uploadWork += ms
              const data = args[name === 'bufferData' ? 1 : 2]
              p.uploadBytes += typeof data === 'number' ? data : (data?.byteLength ?? 0)
            } else p.queryWork += ms
            return result
          },
      )
    }
  }
  const resetWork = () => {
    p.worldCalls = p.worldMisses = p.worldWork = p.renderWork = p.reactWork = p.compileCalls = p.compileWork = p.queryWork = p.uploadBytes = p.uploadWork = 0
  }
  p.arm = ({ untilTime = 206, wallSeconds, schedule = [], name = 'playback', speed = 1 }) => {
    if (p.disposed || (p.run && !p.done)) throw new Error('Recorder owner is unavailable')
    for (const name of ['frames', 'longTasks', 'misses', 'commits', 'commitEffectsRows', 'postCommitRows', 'nativeSlowCalls', 'marks']) p[name] = []
    p.counts = {}
    p.worldTotals = {}
    p.detailCounts = {}
    p.dropped = {}
    p.truncated = false
    resetWork()
    p.run = { untilTime, wallSeconds, schedule: env.structuredClone(schedule), name, speed }
    p.armedAt = now()
    p.scheduleIndex = 0
    p.playAt = p.playTime = p.runEnd = null
    p.done = false
    p.taken = false
    p.active = true
    last = now()
    scheduleFrame()
  }
  const scheduleFrame = () => schedule()
  const payload = () => ({
    version: p.version,
    identity: p.identity,
    startup: p.startup,
    quality: p.quality,
    firstUI: p.firstUI,
    firstDraw: p.firstDraw,
    readyAt: p.readyAt,
    timeOrigin: p.timeOrigin,
    run: p.run,
    armedAt: p.armedAt,
    playAt: p.playAt,
    playTime: p.playTime,
    runEnd: p.runEnd,
    truncated: p.truncated,
    dropped: p.dropped,
    frameColumns: ['wall', 'gap', 'time', 'playing', 'speed', 'worldCalls', 'worldMisses', 'worldMs', 'renderCpuMs', 'reactRenderMs', 'shaderCalls', 'shaderCpuMs', 'programQueryCpuMs', 'uploadBytes', 'uploadCpuMs', 'programs', 'geometries', 'reset', 'preset'],
    frames: p.frames,
    longTasks: p.longTasks,
    misses: p.misses,
    commits: p.commits,
    commitEffectsRows: p.commitEffectsRows,
    postCommitRows: p.postCommitRows,
    nativeSlowCalls: p.nativeSlowCalls,
    marks: p.marks,
    counts: p.counts,
    worldTotals: p.worldTotals,
    detailCounts: p.detailCounts,
    lifecycle: p.lifecycle(),
  })
  p.export = () => env.structuredClone(payload())
  // Transfer finished buffers instead of cloning them in the measured page.
  // The controller receives them by value; the recorder cannot mutate them later.
  p.take = () => {
    if (!p.done || p.taken) throw new Error('No finished recording to transfer')
    const result = { ...payload(), startup: env.structuredClone(p.startup), identity: env.structuredClone(p.identity), run: env.structuredClone(p.run), quality: env.structuredClone(p.quality) }
    for (const name of ['frames', 'longTasks', 'misses', 'commits', 'commitEffectsRows', 'postCommitRows', 'nativeSlowCalls', 'marks']) p[name] = []
    p.counts = {}
    p.worldTotals = {}
    p.detailCounts = {}
    p.dropped = {}
    p.taken = true
    return result
  }
  const startupDOM = () => {
    if (p.readyAt !== null) return
    const shell = env.document.querySelector('[data-testid=loading-shell]'),
      message = shell?.querySelector('[role=status]')?.textContent
    if (message && message !== p.startup.lastMessage) {
      p.startup.lastMessage = message
      p.startup.progress.push([now(), message])
    }
    const button = env.document.querySelector('[data-testid=play-pause]')
    if (button) p.firstUI ??= now()
    if (button && !button.disabled && p.firstDraw !== null) {
      p.readyAt = now()
      disconnect(phaseObserver)
      disconnect(paintObserver)
      if (click) {
        env.document.removeEventListener('click', click, true)
        click = null
      }
      for (const id of timers) env.clearTimeout(id)
      timers.clear()
    }
  }
  function frame(time) {
    if (p.disposed || !p.active) return
    const state = p.store?.getState(),
      root = p.root
    startupDOM()
    if (state?.isPlaying && p.playAt === null) {
      p.playAt = time
      p.playTime = state.timeSeconds
    }
    if (p.run && state?.isPlaying) {
      while (p.scheduleIndex < p.run.schedule.length && state.timeSeconds >= p.run.schedule[p.scheduleIndex][0]) p.cameraStore.getState().requestPreset(p.run.schedule[p.scheduleIndex++][1])
      if (p.run.wallSeconds !== undefined ? (time - p.playAt) / 1000 >= p.run.wallSeconds : state.timeSeconds >= p.run.untilTime) {
        state.pause()
        p.done = true
        p.runEnd = { wall: time, time: state.timeSeconds, elapsed: (time - p.playAt) / 1000 }
      }
    }
    keep('frames', [
      time,
      time - last,
      state?.timeSeconds ?? 0,
      state?.isPlaying ? 1 : 0,
      state?.speed ?? 1,
      p.worldCalls,
      p.worldMisses,
      p.worldWork,
      p.renderWork,
      p.reactWork,
      p.compileCalls,
      p.compileWork,
      p.queryWork,
      p.uploadBytes,
      p.uploadWork,
      root?.gl.info.programs.length ?? 0,
      root?.gl.info.memory.geometries ?? 0,
      state?.transientResetVersion ?? 0,
      p.cameraStore?.getState().preset ?? 'overview',
    ])
    last = time
    resetWork()
    schedule()
  }
  p.dispose = () => {
    if (p.disposed) return
    p.disposed = true
    p.active = false
    for (const id of frames) env.cancelAnimationFrame(id)
    frames.clear()
    raf = 0
    for (const id of timers) env.clearTimeout(id)
    timers.clear()
    for (const observer of [...observers]) disconnect(observer)
    if (click) env.document.removeEventListener('click', click, true)
    click = null
    for (const restore of restorers.reverse()) restore()
    restorers.length = 0
  }
  try {
    observe(
      env.PerformanceObserver,
      (list) => {
        if (p.disposed || !p.active || p.taken) return
        for (const entry of list.getEntries()) {
          // Observer delivery can follow the final RAF. Keep the closing task,
          // but never attribute a delayed entry from an earlier run to this one.
          const belongs = p.run ? entry.startTime >= p.armedAt && (!p.done || entry.startTime <= p.runEnd.wall) : p.readyAt === null
          if (belongs) keep('longTasks', { start: entry.startTime, duration: entry.duration, name: entry.name }, 20000)
        }
      },
      { type: 'longtask', buffered: true },
    )
  } catch {
    p.noLongTaskAPI = true
  }
  try {
    paintObserver = observe(
      env.PerformanceObserver,
      (list) => {
        for (const e of list.getEntries()) p.startup.paints.push([e.name, e.startTime])
      },
      { type: 'paint', buffered: true },
    )
  } catch {
    /* Paint timing is optional. */
  }
  phaseObserver = observe(env.MutationObserver, startupDOM, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] }, env.document)
  if (env.HTMLCanvasElement)
    restoreMethod(
      env.HTMLCanvasElement.prototype,
      'getContext',
      (original) =>
        function (...args) {
          if (p.readyAt !== null || p.disposed) return original.apply(this, args)
          const start = now(),
            result = original.apply(this, args)
          p.startup.nativeContext.push([args[0], start, now() - start])
          return result
        },
    )
  click = (event) => {
    if (p.readyAt === null) {
      const target = event.target?.closest?.('button,summary,input')
      if (target) (p.startup.interactions ??= []).push([target.getAttribute('aria-label') || target.textContent, now(), event.timeStamp, env.document.querySelector('[data-testid=loading-shell] [role=status]')?.textContent])
    }
  }
  env.document.addEventListener('click', click, true)
  const heartbeat = () => {
    if (p.readyAt !== null) return
    p.startup.heartbeats.push(now())
    if (env.performance.memory) p.startup.memory.push([now(), env.performance.memory.usedJSHeapSize])
    later(heartbeat, 25)
  }
  heartbeat()
  schedule()
  return p
}
