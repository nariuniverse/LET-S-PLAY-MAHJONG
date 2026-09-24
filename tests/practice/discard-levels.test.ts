import { describe, expect, it } from 'vitest';
import { generateDiscard, gradeDiscard, matchesDiscardLevel } from '../../src/practice/discard.js';
import type { DiscardLevel } from '../../src/practice/discard-levels.js';
import { discardPatterns } from '../../src/practice/discard-patterns.js';
import { analyzeDiscards, calculateShanten } from '../../src/shanten.js';
import type { DiscardResult } from '../../src/shanten.js';
import { counts, parseTiles, validateTiles } from '../../src/tiles.js';
import type { Tile } from '../../src/types.js';
import { mamamo, standard } from '../helpers.js';

function assertDifficulty(tiles: readonly Tile[], analysis: readonly DiscardResult[], level: 2 | 3): void {
  const min = Math.min(...analysis.map(r => r.shanten));
  expect(min).toBeGreaterThanOrEqual(1); expect(min).toBeLessThanOrEqual(2);
  const candidates = analysis.filter(r => r.shanten === min);
  expect(candidates.length).toBeGreaterThanOrEqual(level === 2 ? 3 : 4);
  const totals = [...new Set(candidates.map(r => r.total))].sort((a,b) => b-a);
  expect(totals.length).toBeGreaterThan(1);
  const margin = totals[0]! - totals[1]!;
  if (level === 2) expect(margin).toBeGreaterThanOrEqual(4);
  else { expect(margin).toBeGreaterThanOrEqual(1); expect(margin).toBeLessThanOrEqual(2); }
  expect(analysis.filter(r => r.optimal).length).toBeLessThanOrEqual(2);
  const c = counts(tiles);
  for (const t of tiles) if (c[t] === 1) {
    expect(t).toBeLessThan(27);
    expect(tiles.some(u => u !== t && Math.floor(u/9) === Math.floor(t/9) && Math.abs(u-t) <= 2)).toBe(true);
  }
}

describe('discard difficulty', () => {
  for (const context of [standard, mamamo]) {
    for (const level of [2,3] as const) {
      for (const seed of [0,1,42,997,20260923,0xffffffff]) it(`${context.ruleSet} level ${level} seed ${seed}`, () => {
        const p = generateDiscard(seed, context, level);
        expect(p.level).toBe(level); expect(p.generatorVersion).toBe(2);
        expect(p.id).toContain(`:level${level}:`);
        expect(validateTiles(p.hand,context,14)).toEqual([]);
        expect(calculateShanten(p.hand,context).shanten).toBeGreaterThanOrEqual(1);
        const oracle = analyzeDiscards(p.hand,context);
        expect(p.analysis).toEqual(oracle);
        expect(p.correctTiles).toEqual(oracle.filter(r => r.optimal).map(r => r.discard));
        assertDifficulty(p.hand.concealed, oracle, level);
        for (const row of oracle) expect(gradeDiscard(p,row.discard).correct).toBe(row.optimal);
        expect(generateDiscard(seed,context,level)).toEqual(p);
      }, 30000);
      for (const notation of discardPatterns[level]) it(`${context.ruleSet} validates level ${level} family ${notation}`, () => {
        const tiles = parseTiles(notation,context);
        expect(validateTiles({concealed:tiles},context,14)).toEqual([]);
        assertDifficulty(tiles,analyzeDiscards({concealed:tiles},context),level);
      }, 30000);
    }
  }
  it('keeps old links and records at level one while separating other levels', () => {
    const legacy = generateDiscard(42,mamamo);
    expect(legacy).toEqual(generateDiscard(42,mamamo,1));
    expect(legacy.level).toBe(1); expect(legacy.generatorVersion).toBe(1);
    expect(legacy.id).toBe(`v1:mamamo:discard:42:${mamamo.profileHash}`);
    expect(new Set([legacy.id,generateDiscard(42,mamamo,2).id,generateDiscard(42,mamamo,3).id]).size).toBe(3);
  }, 30000);
  it('varies shapes across seeds, not only labels', () => {
    for (const level of [2,3] as const) {
      const hands = [0,1,42,997,20260923,0xffffffff].map(seed => generateDiscard(seed,mamamo,level).hand.concealed.join(','));
      expect(new Set(hands).size).toBeGreaterThanOrEqual(5);
    }
  }, 30000);
  it('rejects invalid levels and seeds for all levels', () => {
    for (const level of [0,4,1.5,NaN]) expect(() => generateDiscard(42,standard,level as DiscardLevel)).toThrow('레벨');
    for (const level of [1,2,3] as const) {
      for (const seed of [-1,0x100000000,NaN]) expect(() => generateDiscard(seed,standard,level)).toThrow('시드');
    }
  });
  it('does not relabel a level-two hand as level three', () => {
    const p = generateDiscard(42,standard,2);
    expect(matchesDiscardLevel(p.hand.concealed,p.analysis,2)).toBe(true);
    expect(matchesDiscardLevel(p.hand.concealed,p.analysis,3)).toBe(false);
    expect(matchesDiscardLevel(p.hand.concealed,[],3)).toBe(false);
  });
});
