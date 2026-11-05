"""Offline analysis. Run only after the paced browser work is closed."""
import json
import statistics
import sys
from pathlib import Path

folder = Path(sys.argv[1] if len(sys.argv) > 1 else 'stage7d-review.local')


def stats(values):
    if not values:
        return {'n': 0, 'mean': 0, 'p95': 0, 'max': 0, 'sum': 0}
    ordered = sorted(values)
    return {'n': len(values), 'mean': statistics.mean(values),
            'p95': ordered[min(len(ordered) - 1, int(.95 * len(ordered)))],
            'max': ordered[-1], 'sum': sum(values)}


def interval(p, start, end, include_end=True):
    def inside(wall):
        return start <= wall and (wall <= end if include_end else wall < end)

    frames = [r for r in p['frames'] if inside(r[0])]
    tasks = [r for r in p['longTasks'] if inside(r['start'])]
    return {
        'raf': stats([r[1] for r in frames]),
        'longTasks': stats([r['duration'] for r in tasks]),
        'worldMiss': stats([r[2] for r in p['misses'] if inside(r[0])]),
        'rendererCPU': stats([r[8] for r in frames if r[8] > 0]),
        'react': {who: stats([r[3] for r in p['commits'] if inside(r[0]) and r[1] == who]) for who in ['scene', 'HUD']},
        'commitEffects': {who: stats([r[3] for r in p['commitEffectsRows'] if inside(r[0]) and r[1] == who]) for who in ['scene', 'HUD']},
        'postCommit': {who: stats([r[3] for r in p['postCommitRows'] if inside(r[0]) and r[1] == who]) for who in ['scene', 'HUD']},
        'worldCalls': sum(r[5] for r in frames), 'worldMissBuckets': sum(r[6] for r in frames),
        'shaderCalls': sum(r[10] for r in frames),
        'shaderCPU': stats([r[11] for r in frames if r[11] > 0]),
        'nativeProgramQueryCPU': stats([r[12] for r in frames if r[12] > 0]),
        'uploadBytes': sum(r[13] for r in frames),
        'uploadCPU': stats([r[14] for r in frames if r[14] > 0]),
        'speeds': sorted(set(r[4] for r in frames)),
        'resetVersions': sorted(set(r[17] for r in frames)),
        'startSim': frames[0][2] if frames else None,
        'endSim': frames[-1][2] if frames else None,
        'monotonic': all(a[0] < b[0] and a[2] <= b[2] for a, b in zip(frames, frames[1:])),
        'gapsAtLeast500': [{p['frameColumns'][i]: row[i] for i in range(len(row))} for row in frames if row[1] >= 500],
        'tasksAtLeast500': [{**task, 'frames': [r for r in frames if task['start'] - 1000 <= r[0] <= task['start'] + task['duration'] + 1000], 'commits': [r for r in p['commits'] if task['start'] - 100 <= r[0] <= task['start'] + task['duration'] + 100]} for task in tasks if task['duration'] >= 500],
        'worstFrames': [{p['frameColumns'][i]: row[i] for i in range(len(row))} for row in sorted(frames, key=lambda r: r[1], reverse=True)[:12]],
    }


timings, startups = [], []
for label in ['B1', 'A1', 'A2', 'B2', 'B3', 'A3']:
    startup_path = folder / (label + '-startup.json')
    if startup_path.exists():
        p = json.loads(startup_path.read_text())
        startups.append({'label': label, 'firstUI': p['firstUI'], 'firstDraw': p['firstDraw'], 'ready': p['readyAt'],
                         'firstProgress': p['startup']['progress'][0] if p['startup']['progress'] else None,
                         'paints': p['startup']['paints'], 'chunks': stats([r[1] for r in p['startup']['chunks']]),
                         'graphicsJobs': p['startup']['graphicsJobs'], 'longTasks': stats([r['duration'] for r in p['longTasks']]),
                         'reactMounts': [r for r in p['commits'] if r[2] == 'mount'],
                         'beforeFirstDrawRAF': stats([r[1] for r in p['frames'] if r[0] < p['firstDraw'] and r[1] > 0]),
                         'tasksAtLeast500': [{**task, 'frames': [r for r in p['frames'] if task['start'] - 1000 <= r[0] <= task['start'] + task['duration'] + 1000], 'commits': [r for r in p['commits'] if task['start'] - 100 <= r[0] <= task['start'] + task['duration'] + 100]} for task in p['longTasks'] if task['duration'] >= 500],
                         'truncated': p['truncated'] or p['startup'].get('truncated', False), 'lifecycle': p['lifecycle']})
    for name in ['first', 'fuel-1x', 'landing-1x', 'fuel-2x', 'landing-2x', 'aftermath-2x', 'sustained']:
        path = folder / (label + '-' + name + '.json')
        if not path.exists():
            continue
        p = json.loads(path.read_text())
        row = {'label': label, 'window': name, 'elapsed': p['runEnd']['elapsed'], 'startSim': p['playTime'], 'endSim': p['runEnd']['time'],
               **interval(p, p['playAt'], p['runEnd']['wall']), 'truncated': p['truncated'], 'dropped': p['dropped'],
               'worldTotalsIncludingPausedArm': p['worldTotals'], 'nativeCountsIncludingPausedArm': p['counts'], 'finished': p['finished'],
               'threadMetricsDelta': {key: value - p['metricStart'].get(key, 0) for key, value in p['metricEnd'].items() if key in ['ThreadTime', 'TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount']}}
        if name == 'sustained':
            row['minutes'] = [{'minute': i + 1, **interval(p, p['playAt'] + i * 60000, p['runEnd']['wall'] if i == 9 else p['playAt'] + (i + 1) * 60000, include_end=(i == 9))} for i in range(10)]
        timings.append(row)

(folder / 'timing-summary.json').write_text(json.dumps(timings, indent=2))
(folder / 'startup-summary.json').write_text(json.dumps(startups, indent=2))

# Match unquantized logical world times. Different RAF rates can batch different
# numbers of fixed steps; elapsed totals alone do not describe equal work.
matched = []
for b_label, a_label in [('B1', 'A1'), ('B2', 'A2'), ('B3', 'A3')]:
    for name in ['fuel-1x', 'landing-1x', 'fuel-2x', 'landing-2x', 'aftermath-2x']:
        paths = [folder / (label + '-' + name + '.json') for label in [b_label, a_label]]
        if not all(path.exists() for path in paths):
            continue
        runs = [json.loads(path.read_text()) for path in paths]
        samples = []
        for p in runs:
            by_time = {}
            for row in p['misses']:
                if p['playAt'] <= row[0] <= p['runEnd']['wall']:
                    by_time.setdefault(row[1], []).append(row)
            samples.append(by_time)
        common = sorted(samples[0].keys() & samples[1].keys())
        matched.append({'before': b_label, 'after': a_label, 'window': name,
                        'exactCommonWorldTimes': len(common),
                        'uniqueTimes': [len(s) for s in samples],
                        'duplicateMissesAtSameTime': [sum(len(rows) - 1 for rows in s.values()) for s in samples],
                        'matchedWorldMissCPU': [stats([row[2] for t in common for row in s[t]]) for s in samples],
                        'allCallerCountsIncludingPausedArm': [p['worldTotals'] for p in runs]})
(folder / 'matched-world-work.json').write_text(json.dumps(matched, indent=2))
for row in timings:
    print(row['label'], row['window'], 'RAF', *(round(row['raf'][key], 3) for key in ['mean', 'p95', 'max']),
          'world/scene/HUD/render P95', *(round(v, 3) for v in [row['worldMiss']['p95'], row['react']['scene']['p95'], row['react']['HUD']['p95'], row['rendererCPU']['p95']]),
          'LT', row['longTasks']['n'])

before = folder / 'before-render-summary.json'
after = folder / 'after-render-summary.json'
if before.exists() and after.exists():
    a, b = json.loads(before.read_text()), json.loads(after.read_text())
    result = {'beforeCount': len(a), 'afterCount': len(b), 'sameTimes': [r['time'] for r in a] == [r['time'] for r in b],
              'beforeErrors': sum(len(r['errors']) for r in a), 'afterErrors': sum(len(r['errors']) for r in b),
              'differingHashes': [r['time'] for r, s in zip(a, b) if r['hash'] != s['hash']],
              'populationCounts': {side: sorted(set((r['roots'], r['wheels'], r['landscape']) for r in rows)) for side, rows in [('before', a), ('after', b)]}}
    (folder / 'render-comparison.json').write_text(json.dumps(result, indent=2))

if (folder / 'after-rgb/24.png').exists():
    from PIL import Image, ImageChops, ImageStat
    rows = []
    for i in range(25):
        a = Image.open(folder / f'before-rgb/{i:02d}.png')
        b = Image.open(folder / f'after-rgb/{i:02d}.png')
        assert a.format == b.format == 'PNG' and a.size == b.size == (1280, 720)
        diff = ImageChops.difference(a.convert('RGB'), b.convert('RGB'))
        bands = diff.split()
        histogram = ImageChops.lighter(ImageChops.lighter(bands[0], bands[1]), bands[2]).histogram()
        rows.append({'index': i, 'size': a.size, 'changedPixels': a.width * a.height - histogram[0],
                     'maxChannelError': max(hi for lo, hi in ImageStat.Stat(diff).extrema)})
    (folder / 'image-comparison.json').write_text(json.dumps(rows, indent=2))
    print('Complete RGB image pairs:', len(rows), 'differing pairs:', sum(r['changedPixels'] > 0 for r in rows))
