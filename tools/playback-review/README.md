# Optional Stage 7D playback review

These development-only tools are not imported by the application. They use the
repository's existing Vite and Playwright installations and the installed Chrome
channel. They do not build, install, change quality or alter application files.
Use one owned viewer at a time and leave other demanding applications idle when
collecting timings.

`probe.mjs` owns a single bounded recorder. Reinstallation and attachment are
idempotent. Ready-state idle leaves one Long Task observer and no recorder RAF,
timer, click listener or startup DOM observer. `arm()` records one workload;
`take()` transfers finished buffers once; `export()` returns an independent
snapshot; `dispose()` cancels callbacks and restores methods only while it still
owns them. The recorder is exercised by `src/test/playbackRecorder.test.ts` even
when all optional evidence directories are absent.

`server.mjs` applies the same opt-in source transforms to both roots, preserving
the development/StrictMode application. Instrumentation labels actual world
cache callers, wraps React Profilers, times native renderer/program/upload
methods, and records cooperative construction slices and graphics jobs. The
`/__7d_identity` endpoint lists application source hashes and every transformed
file's input/output hash. Test/fixture data are verified by the ordinary source
and golden tests rather than included in this served-runtime identity. Finder's
`.DS_Store` metadata is excluded explicitly. The complete recorder and server
hashes are included in each page's evidence.

Create an immutable `git archive e817b1c` directory and link its `node_modules` to
the existing repository installation. Start two terminals from the working
repository, substituting the actual archive directory:

```sh
node tools/playback-review/server.mjs /tmp/cinderfront-stage7d-reference-e817b1c 5196 before
node tools/playback-review/server.mjs /Users/rynt/Desktop/Code/cinderfront 5197 after
```

Then run the complete fixed cohort into a **new empty evidence directory**:

```sh
node tools/playback-review/run.mjs stage7d-recheck.local http://127.0.0.1:5196 http://127.0.0.1:5197
```

The controller freezes its contract and helper hashes before measurement. It
uses B1,A1 / A2,B2 / B3,A3, a fresh context each time, natural first 1x playback
from zero to 206, the original camera schedule, all warm visits, 24 paused RAF
bookends and the five original windows. No screenshot, full inventory, sampled
profile or native GPU timing query occurs during paced recording. Both origins
receive one startup-only preload which is closed before any primary context.
CPU emulation is explicitly 1; the CPU profiler is disabled; visibility/focus
history, quality, source identity and cumulative thread metrics are retained.

An explicit CDP device-metrics override is necessary on this Retina host:
Playwright's context reports DPR 1 but a native screenshot can otherwise retain
a 2x backing scale. The controller checks a setup-page PNG before loading every
viewer and checks all exact PNG dimensions. Images use the complete viewport
with `captureBeyondViewport:false` and clip scale 1; no image resize, crop, mask
or tolerance is used.

After B1's timing windows, the controller captures the reference's 25 PNGs and
613 actual rendered checkpoints. After A3's five windows it records a fresh
uninterrupted 600-real-second 2x aftermath, then captures the changed images,
rendered checks and five warmed resource cycles. Inspection helpers are derived
from the prior Stage 7C review. `poses.json` and `render-times.json` are compact
schedules, not replacement world/query/geometry goldens.

Run native controls, cancellation, graphics failure, actual context loss during
Play/preparation, finite-owner cycles and three layouts separately, with the
paced controller closed:

```sh
node tools/playback-review/integration.mjs stage7d-recheck.local http://127.0.0.1:5197
python3 tools/playback-review/analyze.py stage7d-recheck.local
```

Offline image comparison uses the already available Pillow installation; it is
not an application dependency. The analysis reports exact changed-pixel counts,
all pacing misses, per-minute sustained CPU/RAF/Long Tasks and surrounding
timelines for tasks/gaps of at least 500 ms. World work is nested in React and
must not be added to React/renderer timings as disjoint totals. React commit
effect callbacks do not measure complete commit wall time.

Do not replace slow contexts, force collection, disable StrictMode, change
resolution or compare a new run against old fast numbers. Keep failed or
interrupted attempts under separately labelled evidence directories. A fast
cohort does not establish the cause of a slow historical context. See
`STAGE7D_ACCEPTANCE.md` for verified outcomes and unresolved criteria.
