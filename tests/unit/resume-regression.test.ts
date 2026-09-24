import { describe, expect, it } from 'vitest';
import { calculateScore, compareTiles, countTile, evaluateWin, parseMeld, settleMultipleRon } from '../../src/index.js';
import type { Limit, Player, ScoreInput, WinMethod } from '../../src/index.js';
import { hand, mamamo, situation, standard } from '../helpers.js';

describe('two-han minimum before kazoe scoring', () => {
  // Four 4p in hand and three 3p indicators: twelve dora plus one riichi.
  const h = hand('123m456p678s444p22z', mamamo);
  const oneYaku = situation(23, { riichi: 'riichi', doraIndicators: [11, 11, 11] });
  it('allows one yaku plus dora before the fifth completed dealer win', () => {
    const r = evaluateWin(h, { ...oneYaku, dealerConsecutiveWins: 4 }, mamamo);
    expect(r.canWin).toBe(true);
    expect(r.best[0]?.yaku.recognized.some(y => y.ruleId === 'yaku.kazoe')).toBe(true);
    expect(r.best[0]?.score.totalGain).toBe(32000n);
  });
  it.each([5, 6, 8])('rejects dora supplying the second yaku at %i dealer wins', dealerConsecutiveWins => {
    const r = evaluateWin(h, { ...oneYaku, dealerConsecutiveWins }, mamamo);
    expect(r.valid).toBe(true);
    expect(r.canWin).toBe(false);
    expect(r.candidates).toEqual([]);
    expect(r.reasons).toContain('도라 제외 2판 조건 불충족');
  });
  it('allows two genuine yaku han plus dora at the threshold', () => {
    const r = evaluateWin(h, { ...oneYaku, riichi: 'double', dealerConsecutiveWins: 5 }, mamamo);
    expect(r.canWin).toBe(true);
    expect(r.best[0]?.score.totalGain).toBe(32000n);
  });
  it('keeps shape yakuman eligible without ordinary han', () => {
    const r = evaluateWin(hand('119m19p19s1234567z', mamamo), situation(0, { dealerConsecutiveWins: 5 }), mamamo);
    expect(r.canWin).toBe(true);
    expect(r.best[0]?.yaku.yakuman).toBe(2);
  });
  it('does not apply the mamamo threshold to the standard profile', () => {
    expect(evaluateWin(h, { ...oneYaku, dealerConsecutiveWins: 5 }, standard).canWin).toBe(true);
  });
});

describe('public API rejects malformed runtime inputs', () => {
  it.each([-1, 34, 1.5, NaN])('rejects tile %s in comparisons and queries', tile => {
    expect(() => compareTiles(tile, 0, standard)).toThrow('존재하지 않는 패');
    expect(() => countTile([0, 0], tile, standard)).toThrow('존재하지 않는 패');
  });
  it('preserves valid comparison and counting', () => {
    expect(compareTiles(0, 33, standard)).toBeLessThan(0);
    expect(countTile([0, 0, 1], 0, standard)).toBe(2);
  });
  it('rejects a non-player meld provider', () => {
    expect(() => parseMeld('pon', '111m', standard, 4 as Player)).toThrow('잘못된 세트 제공자');
  });
  const score: ScoreInput = { winner: 1, dealer: 0, discarder: 2, method: 'ron', han: 1, fu: 30 };
  it('rejects an unknown win method or limit', () => {
    expect(() => calculateScore({ ...score, method: 'other' as WinMethod }, standard)).toThrow('잘못된 화료 방법');
    expect(() => calculateScore({ ...score, fixedLimit: 'other' as Limit }, standard)).toThrow('잘못된 점수 한도');
  });
  it('rejects a transfer from a non-player', () => {
    expect(() => calculateScore({ ...score, additions: [{ from: 4 as Player, to: 1, points: 1000n, reason: 'fine', ruleId: 'penalty.fine' }] }, mamamo)).toThrow('추가 송금 형식 오류');
  });
  const triple = { wins: ([1, 2, 3] as const).map(winner => ({ ...score, winner, discarder: 0 as const })), discarder: 0 as const, honba: 0, riichiSticks: 0 };
  it.each([
    { honba: -1 }, { riichiSticks: -1 }, { finePool: -1000n }, { discarder: 4 as Player },
  ])('validates pools and players even on an abortive draw: %o', invalid => {
    expect(() => settleMultipleRon({ ...triple, ...invalid }, mamamo)).toThrow();
  });
  it('rejects different dealers in the same multiple-ron hand', () => {
    expect(() => settleMultipleRon({ ...triple, wins: triple.wins.map((w, i) => ({ ...w, dealer: i === 0 ? 1 : 0 })) }, mamamo)).toThrow('복수론 입력 오류');
  });
});
