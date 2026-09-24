import fs from 'node:fs';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { analyzeDiscards, calculateShanten, evaluateWin, loadRuleSet, parseTiles, structuralWaits } from '../dist/index.js';

const measurements = [];
for (const id of ['standard-riichi', 'mamamo']) {
  const c = loadRuleSet(id);
  const h = { concealed: parseTiles('123456789m12345p', c) };
  const wait = { concealed: parseTiles('1112345678999m', c) };
  const tasks = {
    shanten: () => calculateShanten(h, c),
    discards: () => analyzeDiscards(h, c),
    chinitsuWaits: () => structuralWaits(wait, c),
    fullWin: () => evaluateWin({ concealed: parseTiles('123m456p789s11122z', c) }, {
      winner: 1, dealer: 0, seatWind: 28, roundWind: 27, method: 'ron', discarder: 2, winningTile: 28,
    }, c),
  };
  for (const [task, fn] of Object.entries(tasks)) {
    const start = performance.now();
    fn();
    const firstMs = performance.now() - start;
    const samples = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      fn();
      samples.push(performance.now() - start);
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const row = { ruleSet: id, task, firstMs, medianMs: (sorted[4] + sorted[5]) / 2, maxMs: sorted[9], samplesMs: samples };
    measurements.push(row);
    console.log(JSON.stringify(row));
  }
}
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/engine-benchmark.json', JSON.stringify({
  measuredAt: new Date().toISOString(), node: process.version, platform: process.platform,
  cpu: os.cpus()[0]?.model,
  note: 'Fixed inputs, 1 first call then 10 repeated calls per task; structural caches are shared across tasks and profiles. Not a fresh process per row or a browser benchmark.',
  measurements,
}, null, 2) + '\n');
