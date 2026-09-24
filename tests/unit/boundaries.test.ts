import { describe, expect, it } from 'vitest';
import { calculateShanten, canRiichi, canRiichiAnkan, decompose, evaluateWin, forbiddenKuikae, legalDiscardCalls, parseMeld, parseTiles, settleChombo, structuralWaits } from '../../src/index.js';
import { hand, mamamo, situation, standard } from '../helpers.js';
describe('physical limits and actions',()=>{
  it.each([standard,mamamo])('quad capacity $ruleSet',c=>{
    expect(calculateShanten(hand('1111222233334z',c),c).byForm.normal).toBe(3);
    const impossible=hand('1111222333444z',c);expect(calculateShanten(impossible,c).byForm.normal).toBe(1);expect(structuralWaits(impossible,c)).toEqual([]);
  });
  it('exposed sets reduce remaining target capacity',()=>{
    const h={...hand('123m456p7777z'),melds:[parseMeld('pon','111z',standard,0)]};expect(calculateShanten(h,standard).byForm.normal).toBe(1);
  });
  it.each([standard,mamamo])('riichi legal shape, borrowed scores, wall $ruleSet',c=>{
    const h=hand('123m456p789s1112z',c);expect(canRiichi(h,c,1).allowed).toBe(true);expect(canRiichi(h,c,0).allowed).toBe(false);
  });
  it('riichi ankan preserves all decompositions',()=>{
    expect(canRiichiAnkan(hand('111m234p567s8889p'),0,standard).allowed).toBe(true);
    expect(canRiichiAnkan(hand('1112223334445m'),0,standard).allowed).toBe(false);
  });
  it('chi only from left, pon from any, last tile forbids calls',()=>{
    const h=hand('23m456p789s11122z');expect(legalDiscardCalls(h,0,1,0,standard,5).some(m=>m.kind==='chi')).toBe(true);expect(legalDiscardCalls(h,0,1,2,standard,5).some(m=>m.kind==='chi')).toBe(false);
    expect(legalDiscardCalls(h,0,1,0,standard,0)).toEqual([]);expect(legalDiscardCalls(h,28,1,2,standard,5).some(m=>m.kind==='pon')).toBe(true);
  });
  it('kuikae both directions',()=>{expect(forbiddenKuikae(parseMeld('chi','345m',mamamo),2,mamamo)).toEqual([2,5]);expect(forbiddenKuikae(parseMeld('chi','234s',mamamo),21,mamamo)).toEqual([21,18]);});
  it('chombo payment rules and refund separation',()=>{
    const m=settleChombo([1],0,mamamo,{1:1},{1:1000n});expect(m.transfers.filter(t=>t.reason==='chombo').map(t=>t.points)).toEqual([3000n,3000n,3000n]);expect(m.transfers.filter(t=>t.reason.endsWith('refund'))).toHaveLength(2);
    expect(settleChombo([1],0,standard).transfers.map(t=>t.points)).toEqual([4000n,2000n,2000n]);
  });
});
describe('situational yaku',()=>{
  const h=hand('123m456p678s444p22z');
  it.each([standard,mamamo])('double riichi final2 $ruleSet',c=>expect(evaluateWin(h,situation(23,{riichi:'double'}),c).best[0]?.yaku.han).toBe(2));
  it('ippatsu after riichi within uninterrupted interval',()=>expect(evaluateWin(h,situation(23,{riichi:'riichi',ippatsu:true,noCalls:true}),standard).best[0]?.yaku.han).toBe(2));
  it('rinshan versus last-live and chankan',()=>{
    expect(evaluateWin(h,situation(23,{method:'tsumo',drawSource:'rinshan'}),standard).best[0]?.yaku.recognized.some(y=>y.ruleId==='yaku.rinshan')).toBe(true);
    expect(evaluateWin(h,situation(23,{method:'tsumo',drawSource:'last-live'}),standard).best[0]?.yaku.recognized.some(y=>y.ruleId==='yaku.haitei')).toBe(true);
    expect(evaluateWin(h,situation(23,{robKan:'added'}),standard).best[0]?.yaku.recognized.some(y=>y.ruleId==='yaku.chankan')).toBe(true);
  });
  it('last discard yaku',()=>expect(evaluateWin(h,situation(23,{lastDiscard:true}),standard).best[0]?.yaku.han).toBe(1));
  it('renhou independent higher ordinary alternative',()=>{
    const r=evaluateWin(hand('12312378978955m'),situation(0,{beforeFirstOwnDraw:true,noCalls:true}),standard);expect(r.best[0]?.score.totalGain).toBeGreaterThan(8000n);
    expect(evaluateWin(h,situation(23,{beforeFirstOwnDraw:true,noCalls:true}),mamamo).best[0]?.score.totalGain).toBe(16000n);
  });
  it('heaven and earth',()=>{
    const dealer=evaluateWin(h,situation(23,{winner:0,seatWind:27,method:'tsumo',initialDeal:true}),standard);expect(dealer.best[0]?.yaku.recognized.some(y=>y.ruleId==='yaku.tenhou')).toBe(true);
    expect(evaluateWin(h,situation(23,{method:'tsumo',firstOwnDraw:true,noCalls:true}),standard).best[0]?.yaku.recognized.some(y=>y.ruleId==='yaku.chiihou')).toBe(true);
  });
  it('8th consecutive win replaces hand value',()=>expect(evaluateWin(h,situation(23,{winner:0,seatWind:27,dealerConsecutiveWins:7}),mamamo).best[0]?.yaku.recognized.map(y=>y.ruleId)).toEqual(['yaku.eight-continuations']));
  it('dora never supplies minimum yaku',()=>{const r=evaluateWin(h,situation(23,{doraIndicators:parseTiles('3p',standard)}),standard);expect(r.valid).toBe(true);expect(r.canWin).toBe(false);});
  it('ura requires riichi',()=>{
    const a=evaluateWin(h,situation(23,{method:'tsumo',uraIndicators:[11]}),standard),b=evaluateWin(h,situation(23,{method:'tsumo',riichi:'riichi',uraIndicators:[11]}),standard);
    expect(a.best[0]?.yaku.dora).toBe(0);expect(b.best[0]?.yaku.dora).toBe(4);
  });
  it('all top-score ties retained',()=>{const r=evaluateWin(hand('11223344556677m'),situation(0,{riichi:'riichi'}),standard);const max=r.candidates.reduce((a,c)=>a>c.score.totalGain?a:c.score.totalGain,0n);expect(r.best).toHaveLength(r.candidates.filter(c=>c.score.totalGain===max).length);});
  it('dead hand and wrong winning tile rejected',()=>{expect(evaluateWin(h,situation(23,{deadHand:true}),standard).canWin).toBe(false);expect(evaluateWin(h,situation(33),standard).valid).toBe(false);});
  it('special shape robbing concealed kan restricted',()=>{
    expect(evaluateWin(h,situation(23,{riichi:'riichi',robKan:'concealed'}),standard).canWin).toBe(false);
    expect(evaluateWin(hand('119m19p19s1234567z'),situation(0,{robKan:'concealed'}),standard).canWin).toBe(true);
  });
  it('all complete forms are actual decompositions',()=>expect(decompose(hand('111m222p333s44455z'),standard)).not.toHaveLength(0));
});
