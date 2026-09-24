import type { DiscardResult } from '../shanten.js';
import type { RuleContext, Tile } from '../types.js';
import { analyzeDiscards, calculateShanten } from '../shanten.js';
import { counts, parseTiles } from '../tiles.js';
import { isDiscardLevel } from './discard-levels.js';
import type { DiscardLevel } from './discard-levels.js';
import { discardPatterns } from './discard-patterns.js';
import { assertProblem, baseProblem, completeTiles, randomFor } from './common.js';
import type { PracticeBase } from './common.js';

export interface DiscardPractice extends PracticeBase {
  mode: 'discard'; level: DiscardLevel; analysis: readonly DiscardResult[]; correctTiles: readonly Tile[];
}
export function generateDiscard(seed: number, context: RuleContext, level: DiscardLevel = 1): DiscardPractice {
  if (!isDiscardLevel(level)) throw new Error('타패 레벨은 1, 2, 3 중 선택하세요.');
  if (level !== 1) return generateAdvancedDiscard(seed, context, level);
  const random = randomFor(seed);
  for (let attempt = 0; attempt < 128; attempt++) {
    const tiles = completeTiles(random);
    const changes = 1 + random(4);
    for (let n = 0; n < changes; n++) {
      const index = random(14), previous = tiles[index];
      if (previous === undefined) throw new Error('패 생성 오류');
      tiles[index] = random(34);
      if (counts(tiles).some(c => c > 4)) tiles[index] = previous;
    }
    const base = baseProblem('discard', seed, tiles, context);
    if (calculateShanten(base.hand, context).shanten < 0) continue;
    const analysis = analyzeDiscards(base.hand, context);
    const correctTiles = analysis.filter(r => r.optimal).map(r => r.discard);
    // Avoid a question in which every tile type is an equally good answer.
    if (correctTiles.length === analysis.length) continue;
    assertProblem(base, context);
    return { ...base, mode: 'discard', level, analysis, correctTiles };
  }
  throw new Error('타패 문제를 생성하지 못했습니다. 다른 시드로 시도해 주세요.');
}

/** Excludes an obvious isolated-tile discard; pairs remain connected shapes. */
function hasIsolatedTile(tiles: readonly Tile[]): boolean {
  const c = counts(tiles);
  return tiles.some(t => c[t] === 1 && !tiles.some(other =>
    other !== t && t < 27 && Math.floor(t / 9) === Math.floor(other / 9) && Math.abs(t - other) <= 2));
}
export function matchesDiscardLevel(tiles: readonly Tile[], analysis: readonly DiscardResult[], level: 2 | 3): boolean {
  const best = analysis.find(r => r.optimal);
  if (!best || best.shanten < 1 || best.shanten > 2 || hasIsolatedTile(tiles)) return false;
  const same = analysis.filter(r => r.shanten === best.shanten);
  const totals = same.filter(r => !r.optimal).map(r => r.total);
  const margin = totals.length ? best.total - Math.max(...totals) : 0;
  if (analysis.filter(r => r.optimal).length > 2) return false;
  return level === 2 ? same.length >= 3 && margin >= 4 : same.length >= 4 && margin >= 1 && margin <= 2;
}
function generateAdvancedDiscard(seed: number, context: RuleContext, level: 2 | 3): DiscardPractice {
  const random = randomFor(seed);
  // Mix the initial stream before selecting a family, including small seeds.
  random(0x100000000); random(0x100000000); random(0x100000000);
  const patterns = discardPatterns[level], start = random(patterns.length);
  const suits = [0, 1, 2];
  for (let i = 2; i > 0; i--) { const j = random(i + 1); [suits[i], suits[j]] = [suits[j]!, suits[i]!]; }
  const reflected = [random(2) === 1, random(2) === 1, random(2) === 1];
  for (let attempt = 0; attempt < patterns.length; attempt++) {
    const original = parseTiles(patterns[(start + attempt) % patterns.length]!, context);
    const tiles = original.map(t => {
      const suit = Math.floor(t / 9), rank = t % 9;
      return suits[suit]! * 9 + (reflected[suit] ? 8 - rank : rank);
    });
    const base = baseProblem('discard', seed, tiles, context);
    const analysis = analyzeDiscards(base.hand, context);
    if (!matchesDiscardLevel(tiles, analysis, level)) continue;
    assertProblem(base, context);
    return { ...base, id: `v2:${context.ruleSet}:discard:level${level}:${seed}:${context.profileHash}`,
      generatorVersion: 2, mode: 'discard', level, analysis,
      correctTiles: analysis.filter(r => r.optimal).map(r => r.discard) };
  }
  throw new Error('선택한 레벨에 맞는 문제를 생성하지 못했습니다. 다른 문제로 시도해 주세요.');
}

export function gradeDiscard(problem: DiscardPractice, selected: Tile): { correct: boolean; selected: DiscardResult } {
  const candidate = problem.analysis.find(r => r.discard === selected);
  if (!candidate) throw new Error('손패에서 버릴 패를 선택해 주세요.');
  return { correct: candidate.optimal, selected: candidate };
}
