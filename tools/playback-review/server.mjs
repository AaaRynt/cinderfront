import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, realpathSync } from 'node:fs'
import { resolve, relative, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
const root = realpathSync(resolve(process.argv[2] ?? process.cwd())),
  port = Number(process.argv[3] ?? 5196),
  tag = process.argv[4] ?? 'review'
const sha = (value) => createHash('sha256').update(value).digest('hex')
const applicationFiles = {}
const walk = (folder) => {
  for (const e of readdirSync(join(root, folder), { withFileTypes: true })) {
    if (e.name === '.DS_Store') continue
    const p = join(folder, e.name)
    if (e.isDirectory()) {
      if (p !== 'src/test' && p !== 'src/simulation/fixtures') walk(p)
    } else if (!/\.test\./.test(p)) applicationFiles[p] = sha(readFileSync(join(root, p)))
  }
}
walk('src')
walk('public')
for (const p of ['index.html', 'vite.config.ts', 'package.json', 'pnpm-lock.yaml']) applicationFiles[p] = sha(readFileSync(join(root, p)))
const identity = { label: tag, reference: 'e817b1c310a792adc24d66e722830d2f6caac44e', applicationHash: sha(JSON.stringify(Object.entries(applicationFiles).sort())), applicationFiles, transforms: {} }
const helperSource = readFileSync(new URL('./probe.mjs', import.meta.url), 'utf8')
identity.probeHash = sha(helperSource)
identity.serverHash = sha(readFileSync(fileURLToPath(import.meta.url)))
const probeScript =
  helperSource.replace('export function installPlaybackProbe', 'function installPlaybackProbe') +
  '\nif(new URLSearchParams(location.search).has("7d")){const p=installPlaybackProbe(globalThis);p.identity=' +
  JSON.stringify({ label: tag, applicationHash: identity.applicationHash, probeHash: identity.probeHash, serverHash: identity.serverHash }) +
  '}'

const instrumentation = {
  name: 'cinderfront-optional-playback-review',
  enforce: 'pre',
  transformIndexHtml(html) {
    return html.replace('<head>', '<head><script src="/__7c_probe.js"></script>')
  },
  configureServer(server) {
    server.middlewares.use('/__7d_identity', (req, res) => {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify(identity))
    })
    server.middlewares.use('/__7c_control', (req, res) => {
      res.setHeader('Content-Type', 'text/html')
      res.end('<!doctype html><title>Measurement setup</title><p>Ready to measure the scene.</p>')
    })
    server.middlewares.use('/__7c_probe.js', (req, res) => {
      res.setHeader('Content-Type', 'application/javascript')
      res.end(probeScript)
    })
  },
  transform(code, id) {
    if (id.endsWith('/vite/dist/client/client.mjs')) return { code: code.replace('transport.connect(createHMRHandler(handleMessage));', '/* Stage7B opt-in: no reconnect/reload during timed runs. */'), map: null }
    if (!id.includes('/src/')) return
    let next = code
    const path = id.split('?')[0]
    if (path.endsWith('/src/simulation/runtime.ts')) {
      next = next
        .replace('deriveRuntimeWorldState(input: number)', "deriveRuntimeWorldState(input: number, __who = 'other')")
        .replace('  const time = normalizeRuntimeTime(input)', '  const __p=globalThis.__c7aProbe, __started=__p?performance.now():0;\n  const time = normalizeRuntimeTime(input)')
        .replace('if (previousWorld && time === previousTime) return previousWorld', 'if (previousWorld && time === previousTime) {__p?.world(time,performance.now()-__started,true,__who);return previousWorld}')
        .replace('  return previousWorld\n}', '  __p?.world(time,performance.now()-__started,false,__who);\n  return previousWorld\n}')
    }
    if (path.endsWith('/src/simulation/store.ts')) next += '\nglobalThis.__c7aProbe?.bindStore(simulationStore);\n'
    if (path.endsWith('/src/scene/camera/cameraStore.ts')) next += '\nglobalThis.__c7aProbe?.bindCamera(useCameraStore);\n'
    const who = path.endsWith('/src/App.tsx') ? 'hud' : path.endsWith('/src/scene/BattlefieldScene.tsx') ? 'scene' : path.endsWith('/src/scene/camera/cameraFraming.ts') ? 'camera' : null
    if (who) next = next.replaceAll('deriveRuntimeWorldState(time)', `deriveRuntimeWorldState(time, '${who}')`)
    if (path.endsWith('/src/App.tsx'))
      next = next
        .replace('import { useEffect, useMemo }', 'import { Profiler, useEffect, useMemo }')
        .replace('<SimulationInterface />', '<Profiler id="HUD" onRender={(...a)=>globalThis.__c7aProbe?.commit(...a)} onCommit={(...a)=>globalThis.__c7aProbe?.commitEffects(...a)} onPostCommit={(...a)=>globalThis.__c7aProbe?.postCommit(...a)}><SimulationInterface /></Profiler>')
    if (path.endsWith('/src/scene/BattlefieldScene.tsx')) {
      next = next
        .replace('import { useMemo, useRef }', 'import { Profiler, useMemo, useRef }')
        .replace('import { memo, useMemo, useRef }', 'import { Profiler, memo, useMemo, useRef }')
        .replace('onCreated={({ gl }) => {', 'onCreated={(state) => {\n          const { gl }=state;globalThis.__c7aProbe?.attach(state);')
        .replace('        <SimulationDriver />', '        <Profiler id="scene" onRender={(...a)=>globalThis.__c7aProbe?.commit(...a)} onCommit={(...a)=>globalThis.__c7aProbe?.commitEffects(...a)} onPostCommit={(...a)=>globalThis.__c7aProbe?.postCommit(...a)}><SimulationDriver />')
        .replace('        <DynamicBattlefield />', '        <DynamicBattlefield /></Profiler>')
    }
    if (tag.endsWith('detail')) {
      const names = new Set([
        'StatusRow',
        'SimulationHud',
        'SimulationInterface',
        'DynamicBattlefield',
        'AircraftEntity',
        'RadarHillEngagement',
        'LcacModel',
        'Lav25Model',
        'LandingPayloadModel',
        'LandingVehicleModels',
        'FuelDamageAftermath',
        'DamagedTank',
        'RupturedPipeCluster',
        'TransferRackCollapse',
        'CentralBundBreach',
        'ScorchedFuelFootprint',
        'CinematicFuelSmokeField',
        'LayeredFuelFireField',
        'BoundedSmokeColumn',
        'PersistentGroundFires',
        'PrimarySearchRadar',
        'RadarLattice',
        'TrackingDish',
        'FixedAaa',
        'Stage4AFuelDisaster',
        'HarborDamage',
        'sampleSurface',
        'cellTriangles',
        'getLandingSupportHeight',
        'groundInCarrier',
        'wheelSupport',
        'fitChassis',
        'localSupport',
        'kinematics',
        'tireSupport',
        'roadPose',
        'roadWheels',
        'movingState',
      ])
      const inserts = []
      for (const name of names) {
        const re = new RegExp('function ' + name + '\\s*\\(', 'g')
        while (re.exec(next)) {
          let end = re.lastIndex,
            depth = 1
          while (depth && end < next.length) {
            if (next[end] === '(') depth++
            if (next[end] === ')') depth--
            end++
          }
          const at = next.indexOf('{', end) + 1
          if (at) inserts.push([at, `globalThis.__c7aProbe?.count('${name}');`])
        }
      }
      for (const [at, text] of inserts.sort((a, b) => b[0] - a[0])) next = next.slice(0, at) + text + next.slice(at)
    }
    if (path.endsWith('/src/initialization/cooperative.ts')) {
      next = next.replace('const channel = new MessageChannel()', 'const channel = new MessageChannel();const __channelOwner7d=globalThis.__c7aProbe;__channelOwner7d?.channelOpen()').replace('channel.port1.onmessage = null', '__channelOwner7d?.channelClose();channel.port1.onmessage = null')
      next = next.replaceAll('onSlice?.(now() - sliceStart)', 'onSlice?.(now() - sliceStart);globalThis.__c7aProbe?.slice([performance.now(),now()-sliceStart])')
    }
    if (path.endsWith('/src/scene/readiness/rendererPreparation.ts')) {
      next = next
        .replace('const compileVariant = async (count: number, signal: AbortSignal, fading = false) => {', 'const compileVariant = async (count: number, signal: AbortSignal, fading = false) => { const __jobStart=performance.now();try{')
        .replace('\n  const jobs: PreparationJob[]', '\n  finally{globalThis.__c7aProbe?.graphicsJob({count,fading,start:__jobStart,end:performance.now()})} }\n  const jobs: PreparationJob[]')
      const bad = '\n  }\n  finally{'
      next = next.replace(bad, '\n  }finally{')
    }
    const measured = new Set([
      'buildClippedGrid',
      'createContinuousMainlandGeometry',
      'createTerrainRoadGeometry',
      'createTerrainSurfaceGeometry',
      'sourceTriangles',
      'emit',
      'refine',
      'indexSurface',
      'surfaceCells',
      'createLandingCoastGeometry',
      'createTreeLayout',
      'getLandscapeMovementReservations',
      'createRegionalLayout',
      'createServiceEquipmentLayout',
      'createSurfaceHistory',
      'createShoreFoamLayout',
    ])
    if (!/\.test\./.test(path)) {
      const ins = []
      for (const name of measured) {
        const re = new RegExp('^(?:export )?function ' + name + '\\b[^\\n]*\\{', 'gm')
        while (re.exec(next)) {
          const at = re.lastIndex,
            end = next.indexOf('\n}', at)
          if (end < 0) throw new Error('Unclosed measured function ' + name)
          const guard = name === 'getLandscapeMovementReservations' ? '!completedSweeps' : 'true'
          ins.push([at, `const __span7c=${guard}?performance.now():null;try{`])
          ins.push([end + 1, `}finally{if(__span7c!==null)globalThis.__c7aProbe?.span('${name}',__span7c)}`])
        }
      }
      for (const [at, text] of ins.sort((a, b) => b[0] - a[0])) next = next.slice(0, at) + text + next.slice(at)
    }
    next += `\nglobalThis.__c7aProbe?.module(${JSON.stringify('/' + relative(root, path))});\n`
    identity.transforms[relative(root, path)] = { input: sha(code), output: sha(next) }
    return next === code ? null : { code: next, map: null }
  },
}
const server = await createServer({ root, cacheDir: `/tmp/cinderfront-stage7d-primary-${tag}-cache`, plugins: [instrumentation], server: { host: '127.0.0.1', port, strictPort: true, hmr: false, ws: false, forwardConsole: { enabled: false }, watch: null } })
await server.listen()
server.printUrls()
