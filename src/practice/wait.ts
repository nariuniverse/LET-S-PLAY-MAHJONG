import type { StructuralWait } from '../engine.js';
import type { RuleContext, Tile } from '../types.js';
import { structuralWaits } from '../engine.js';
import { assertProblem, baseProblem, completeTiles, randomFor } from './common.js';
import type { PracticeBase } from './common.js';

export interface WaitPractice extends PracticeBase {
  mode: 'wait'; suit: number; waits: readonly StructuralWait[]; correctTiles: readonly Tile[];
}
export function generateWait(seed: number, context: RuleContext): WaitPractice {
  const random = randomFor(seed), suit = random(3);
  let tiles: Tile[];
  if (random(4) === 0) {
    // Include seven-pairs shapes as well as four-meld shapes.
    const ranks = Array.from({ length: 9 }, (_, i) => i);
    for (let i = 8; i > 0; i--) { const j = random(i + 1); [ranks[i], ranks[j]] = [ranks[j]!, ranks[i]!]; }
    tiles = ranks.slice(0, 7).flatMap(r => [suit * 9 + r, suit * 9 + r]);
  } else tiles = completeTiles(random, suit);
  tiles.splice(random(14), 1);
  const base = baseProblem('wait', seed, tiles, context);
  const waits = structuralWaits(base.hand, context);
  if (!waits.length) throw new Error('텐파이 생성 오류');
  assertProblem(base, context);
  return { ...base, mode: 'wait', suit, waits, correctTiles: waits.map(w => w.tile) };
}
export function gradeWait(problem: WaitPractice, selected: readonly Tile[]): { correct: boolean; missing: Tile[]; extra: Tile[] } {
  if (!selected.length) throw new Error('대기패를 하나 이상 선택해 주세요.');
  if (selected.some(t => !Number.isInteger(t) || t < problem.suit * 9 || t >= problem.suit * 9 + 9)) throw new Error('같은 수패의 1–9를 선택해 주세요.');
  const actual = new Set(selected), expected = new Set(problem.correctTiles);
  const missing = [...expected].filter(t => !actual.has(t)), extra = [...actual].filter(t => !expected.has(t));
  return { correct: !missing.length && !extra.length, missing, extra };
}
