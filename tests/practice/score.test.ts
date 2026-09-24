import { describe, expect, it } from 'vitest';
import { generateScore, gradeScore, parsePoints } from '../../src/practice/score.js';
import type { ScoreAnswer } from '../../src/practice/score.js';
import { allTiles, counts, effectiveSize } from '../../src/tiles.js';
import { evaluateWin } from '../../src/engine.js';
import { mamamo, standard } from '../helpers.js';

describe('practice 3 scoring problems', () => {
  for (const context of [standard, mamamo]) for (const seed of [0, 1, 7, 42, 99, 1234, 65537, 20260922]) it(`${context.ruleSet} seed=${seed}`, () => {
    const p = generateScore(seed, context), s = p.situation;
    expect(effectiveSize(p.hand)).toBe(14);
    expect(counts([...allTiles(p.hand), ...(s.doraIndicators ?? []), ...(s.uraIndicators ?? [])]).every(n => n <= 4)).toBe(true);
    const result = evaluateWin(p.hand, s, context);
    expect(result.canWin).toBe(true);
    expect(p.solutions).toEqual(result.best);
    for (const solution of result.best) {
      const answer: ScoreAnswer = { totalGain: solution.score.totalGain.toString(), opponentPayments: {} };
      for (const player of [0, 1, 2, 3] as const) if (player !== s.winner) answer.opponentPayments[player] = solution.score.opponentPayments[player].toString();
      expect(gradeScore(p, answer).correct).toBe(true);
      expect(gradeScore(p, { ...answer, totalGain: (solution.score.totalGain + 100n).toString() }).correct).toBe(false);
      expect(solution.score.handPayments + solution.score.honbaPayments + solution.score.depositPayments).toBe(solution.score.totalGain);
    }
  });
  it('reproduces situations and covers open, kan, ron and tsumo', () => {
    expect(generateScore(42, mamamo)).toEqual(generateScore(42, mamamo));
    const problems = Array.from({ length: 30 }, (_, i) => generateScore(i * 997, mamamo));
    expect(problems.some(p => p.hand.melds?.length)).toBe(true);
    expect(problems.some(p => p.hand.melds?.some(m => m.kind === 'daiminkan'))).toBe(true);
    expect(new Set(problems.map(p => p.situation.method)).size).toBe(2);
  });
  it.each(['', '-1', '1.5', '1e3', '1,2', 'NaN'])('rejects malformed score %s', value => expect(() => parsePoints(value)).toThrow());
  it('accepts zero and properly grouped amounts without floating point', () => {
    expect(parsePoints('0')).toBe(0n); expect(parsePoints(' 32,000 ')).toBe(32000n);
  });
  it('requires each opponent even when payment is zero', () => {
    expect(() => gradeScore(generateScore(1, standard), { totalGain: '1000', opponentPayments: {} })).toThrow();
  });
});
