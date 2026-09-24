import { describe, expect, it } from 'vitest';
import { generateDiscard, gradeDiscard } from '../../src/practice/discard.js';
import { analyzeDiscards } from '../../src/shanten.js';
import { counts, validateTiles } from '../../src/tiles.js';
import { mamamo, standard } from '../helpers.js';

describe('practice 1 generation and grading', () => {
  for (const context of [standard, mamamo]) for (const seed of [0, 1, 42, 20260922]) {
    it(`${context.ruleSet} seed=${seed}`, () => {
      const p = generateDiscard(seed, context);
      expect(validateTiles(p.hand, context, 14)).toEqual([]);
      expect(counts(p.hand.concealed).every(n => n <= 4)).toBe(true);
      expect(p.correctTiles).toEqual(analyzeDiscards(p.hand, context).filter(r => r.optimal).map(r => r.discard));
      for (const tile of p.correctTiles) expect(gradeDiscard(p, tile).correct).toBe(true);
      const wrong = p.analysis.find(r => !r.optimal);
      expect(wrong).toBeDefined();
      if (wrong) expect(gradeDiscard(p, wrong.discard).correct).toBe(false);
    }, 30000);
  }
  it('reproduces the same question and all tied correct answers', () => {
    expect(generateDiscard(42, mamamo)).toEqual(generateDiscard(42, mamamo));
  }, 30000);
  it('rejects invalid seeds and a tile outside the hand', () => {
    expect(() => generateDiscard(-1, standard)).toThrow('시드');
    expect(() => gradeDiscard(generateDiscard(1, standard), 99)).toThrow('선택');
  });
});
