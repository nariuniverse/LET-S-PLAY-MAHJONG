import { calculateScore } from '../score.js';
import type { Limit, RuleContext } from '../types.js';

export interface ScoreReferenceCell {
  ron: bigint;
  /** A non-dealer opponent's payment; all three opponents when winner is dealer. */
  tsumoEach: bigint;
  /** Dealer payment when the winner is a non-dealer. */
  tsumoDealer: bigint | null;
  limit: Limit;
}
export interface ScoreReference {
  ruleSet: RuleContext['ruleSet'];
  dealer: boolean;
  rows: { fu: number; cells: ScoreReferenceCell[] }[];
  limits: { label: string; cell: ScoreReferenceCell }[];
  honbaRon: number; honbaTsumo: number; deposit: number;
  kiriage: boolean; kazoe: boolean; multipleYakuman: boolean;
}
export function buildScoreReference(context: RuleContext, dealer: boolean): ScoreReference {
  const winner = dealer ? 0 : 1;
  const cell = (han: number, fu: number, yakuman = 0): ScoreReferenceCell => {
    const base = { han, fu, yakuman, winner, dealer: 0 } as const;
    const ron = calculateScore({ ...base, method: 'ron', discarder: 2 }, context);
    const tsumo = calculateScore({ ...base, method: 'tsumo' }, context);
    return { ron: ron.handPayments, tsumoEach: tsumo.opponentPayments[2],
      tsumoDealer: dealer ? null : tsumo.opponentPayments[0], limit: ron.limit };
  };
  return {
    ruleSet: context.ruleSet, dealer,
    rows: [20,25,30,40,50,60,70,80,90,100,110].map(fu => ({ fu, cells: [1,2,3,4].map(han => cell(han,fu)) })),
    limits: [
      { label: '5판 · 만관', cell: cell(5,30) },
      { label: '6~7판 · 하네만', cell: cell(6,30) },
      { label: '8~10판 · 배만', cell: cell(8,30) },
      { label: '11~12판 · 삼배만', cell: cell(11,30) },
      { label: `13판 이상 · ${context.policies.kazoe ? '카즈에 역만' : '삼배만'}`, cell: cell(13,30) },
      { label: '역만 · 1배', cell: cell(0,0,1) },
    ],
    honbaRon: context.policies.honbaRon, honbaTsumo: context.policies.honbaTsumo,
    deposit: context.policies.deposit, kiriage: context.policies.kiriage,
    kazoe: context.policies.kazoe, multipleYakuman: context.policies.multipleYakuman,
  };
}

