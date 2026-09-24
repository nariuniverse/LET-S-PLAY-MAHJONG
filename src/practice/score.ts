import type { Candidate, Hand, Player, RuleContext, Situation, Tile } from '../types.js';
import { allTiles, counts, parseMeld, parseTiles, sortTiles } from '../tiles.js';
import { evaluateWin } from '../engine.js';
import { assertProblem, baseProblem, completeTiles, randomFor } from './common.js';
import type { PracticeBase } from './common.js';

export interface ScorePractice extends PracticeBase {
  mode: 'score'; situation: Situation; solutions: readonly Candidate[];
}
export interface ScoreAnswer { totalGain: string; opponentPayments: Partial<Record<Player, string>> }
export interface ScoreGrade { correct: boolean; totalCorrect: boolean; playerCorrect: Record<Player, boolean> }
export function generateScore(seed: number, context: RuleContext): ScorePractice {
  const random = randomFor(seed);
  const winner = random(4) as Player, dealer = random(4) as Player;
  const discarder = ((winner + 1 + random(3)) % 4) as Player;
  const variant = random(6), shift = random(3);
  const rotate = (tiles: readonly Tile[]): Tile[] => tiles.map(t => t < 27 ? ((Math.floor(t / 9) + shift) % 3) * 9 + t % 9 : t);
  for (let attempt = 0; attempt < 128; attempt++) {
    let hand: Hand;
    if (variant === 1 || variant === 2) {
      hand = { concealed: rotate(parseTiles('123m456p789s22z', context)),
        melds: [parseMeld(variant === 1 ? 'pon' : 'daiminkan', variant === 1 ? '555z' : '5555z', context, discarder)] };
    } else if (variant === 3) {
      const unique = new Set<Tile>(); while (unique.size < 7) unique.add(random(34));
      hand = { concealed: [...unique].flatMap(t => [t, t]) };
    } else if (variant === 4) hand = { concealed: parseTiles('119m19p19s1234567z', context) };
    else if (variant === 5 && context.ruleSet === 'mamamo') hand = { concealed: rotate(parseTiles('147m258p369s234m55p', context)) };
    else hand = { concealed: completeTiles(random) };
    hand = { ...hand, concealed: sortTiles(hand.concealed, context) };
    const method = random(2) === 0 ? 'ron' : 'tsumo';
    const winningTile = hand.concealed[random(hand.concealed.length)];
    if (winningTile === undefined) throw new Error('화료패 없음');
    const riichi = hand.melds?.length ? 'none' : 'riichi';
    const used = counts(allTiles(hand));
    const takeIndicator = (): Tile => {
      const available = used.flatMap((count, tile) => count < 4 ? [tile] : []);
      const tile = available[random(available.length)];
      if (tile === undefined) throw new Error('도라 표시패 없음');
      used[tile] = (used[tile] ?? 0) + 1; return tile;
    };
    const doraIndicators = Array.from({ length: variant === 2 ? 2 : 1 }, takeIndicator);
    const uraIndicators = riichi === 'riichi' ? doraIndicators.map(t => { void t; return takeIndicator(); }) : [];
    const situation: Situation = { winner, dealer, discarder, winningTile, method,
      seatWind: 27 + (winner - dealer + 4) % 4, roundWind: 27 + random(2), riichi,
      doraIndicators, uraIndicators, honba: random(3), riichiSticks: random(3) };
    const result = evaluateWin(hand, situation, context);
    if (!result.canWin) continue;
    const base = baseProblem('score', seed, [...hand.concealed], context);
    const problem: ScorePractice = { ...base, mode: 'score', hand, situation, solutions: result.best };
    assertProblem(problem, context);
    return problem;
  }
  throw new Error('화료 점수 문제를 생성하지 못했습니다. 다른 시드로 시도해 주세요.');
}
export function parsePoints(value: string): bigint {
  const text = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text) || text.replaceAll(',', '').length > 15) throw new Error('점수는 0 이상의 정수로 입력해 주세요.');
  return BigInt(text.replaceAll(',', ''));
}
export function gradeScore(problem: ScorePractice, answer: ScoreAnswer): ScoreGrade {
  const total = parsePoints(answer.totalGain);
  const opponents = ([0, 1, 2, 3] as const).filter(p => p !== problem.situation.winner);
  const payments = new Map(opponents.map(p => [p, parsePoints(answer.opponentPayments[p] ?? '')]));
  const grades = problem.solutions.map(solution => {
    const playerCorrect: Record<Player, boolean> = { 0: true, 1: true, 2: true, 3: true };
    for (const p of opponents) playerCorrect[p] = payments.get(p) === solution.score.opponentPayments[p];
    const totalCorrect = total === solution.score.totalGain;
    return { correct: totalCorrect && Object.values(playerCorrect).every(Boolean), totalCorrect, playerCorrect };
  });
  const grade = grades.find(g => g.correct) ?? grades[0];
  if (!grade) throw new Error('유효한 정답 없음');
  return grade;
}
