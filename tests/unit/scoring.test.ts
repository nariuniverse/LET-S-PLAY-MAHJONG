import { describe, expect, it } from 'vitest';
import { calculateScore, calculateFu, decompose, evaluateWin, evaluateYaku, explainWin, inferLiability, parseMeld, placements, registeredYaku, settleFinePool, settleMultipleRon, settleNagashi, settleNoten, validateProblem } from '../../src/index.js';
import { hand, mamamo, situation, standard } from '../helpers.js';
describe('payments',()=>{
  it.each([
    [1,30,1,'ron',1000n],[1,30,0,'ron',1500n],[2,30,1,'ron',2000n],[3,30,1,'ron',3900n],
    [4,30,1,'ron',7700n],[5,30,1,'ron',8000n],[6,30,1,'ron',12000n],[8,30,1,'ron',16000n],
    [11,30,1,'ron',24000n],[13,30,1,'ron',32000n],[1,30,1,'tsumo',1100n],[1,30,0,'tsumo',1500n],
  ] as const)('%i han %i fu player %i %s',(han,fu,winner,method,total)=>expect(calculateScore({han,fu,winner,dealer:0,method,discarder:2},mamamo).totalGain).toBe(total));
  it('standard kiriage vs mamamo',()=>{const x={han:4,fu:30,winner:1 as const,dealer:0 as const,method:'ron' as const,discarder:2 as const};expect(calculateScore(x,standard).totalGain).toBe(8000n);expect(calculateScore(x,mamamo).totalGain).toBe(7700n);});
  it('standard no kazoe',()=>expect(calculateScore({han:26,fu:30,winner:1,dealer:0,method:'ron',discarder:2},standard).totalGain).toBe(24000n));
  it('compound yakuman policy',()=>{const x={han:0,fu:0,yakuman:3,winner:1 as const,dealer:0 as const,method:'ron' as const,discarder:2 as const};expect(calculateScore(x,mamamo).totalGain).toBe(96000n);expect(calculateScore(x,standard).totalGain).toBe(32000n);});
  it('honba and deposits',()=>{const r=calculateScore({han:1,fu:30,winner:1,dealer:0,method:'ron',discarder:2,honba:2,riichiSticks:3},mamamo);expect(r.totalGain).toBe(4600n);expect(r.opponentPayments[2]).toBe(1600n);expect(r.balanced).toBe(true);});
  it('partial pao ron',()=>{const r=calculateScore({han:0,fu:0,yakuman:2,winner:1,dealer:0,method:'ron',discarder:2,honba:1,liabilities:[{ruleId:'yaku.daisangen',player:3,multiplier:1}]},mamamo);expect(r.opponentPayments[3]).toBe(16000n);expect(r.opponentPayments[2]).toBe(48300n);});
  it('pao tsumo',()=>{const r=calculateScore({han:0,fu:0,yakuman:1,winner:1,dealer:0,method:'tsumo',honba:1,liabilities:[{ruleId:'yaku.daisangen',player:3,multiplier:1}]},standard);expect(r.opponentPayments[3]).toBe(32300n);});
  it('reject fractional money inputs',()=>expect(()=>calculateScore({han:1.1,fu:30,winner:1,dealer:0,method:'tsumo'},standard)).toThrow());
  it('triple ron policies',()=>{const wins=([1,2,3] as const).map(winner=>({han:1,fu:30,winner,dealer:0 as const,method:'ron' as const,discarder:0 as const}));expect(settleMultipleRon({wins,discarder:0,honba:1,riichiSticks:1},mamamo).abortive).toBe(true);expect(settleMultipleRon({wins,discarder:0,honba:1,riichiSticks:1},standard).scores).toHaveLength(3);});
  it('double ron nearest honba and separate fines',()=>{const wins=([1,3] as const).map(winner=>({han:1,fu:30,winner,dealer:0 as const,method:'ron' as const,discarder:2 as const}));const r=settleMultipleRon({wins,discarder:2,honba:1,riichiSticks:1,finePool:1000n},mamamo);expect(r.scores[0]?.totalGain).toBe(3300n);expect(r.scores[1]?.totalGain).toBe(1000n);});
});
describe('yaku and fu',()=>{
  it('all yaku registered',()=>{expect(registeredYaku(standard)).toHaveLength(41);expect(registeredYaku(mamamo)).toHaveLength(76);});
  it('open tanyao differs',()=>{
    const h={...hand('345m678p345s22p'),melds:[parseMeld('chi','234m',standard,0)]};
    const s=situation(4),a=evaluateWin(h,s,standard),b=evaluateWin(h,s,mamamo);expect(a.canWin).toBe(true);expect(b.canWin).toBe(false);
  });
  it('pinfu tsumo20 and ron30',()=>{
    const h=hand('123m456p789s23466m'),s=situation(26);
    expect(evaluateWin(h,s,standard).best[0]?.fu.rounded).toBe(30);
    expect(evaluateWin(h,{...s,method:'tsumo'},standard).best[0]?.fu.rounded).toBe(20);
  });
  it('chiitoitsu25 and concealed requirement',()=>expect(evaluateWin(hand('1122m3344p5566s77z'),situation(33),standard).best[0]?.fu.rounded).toBe(25));
  it('sanankou ron completed set open for fu',()=>{
    const h=hand('222m444p666s123m55z'),s=situation(23),d=decompose(h,standard)[0];if(!d)throw new Error('decomposition');const p=placements(d,23,standard)[0];if(!p)throw new Error('placement');
    const y=evaluateYaku(h,d,p,s,standard),f=calculateFu(h,d,p,s,y,standard);expect(y.recognized.some(y=>y.ruleId==='yaku.sanankou')).toBe(false);expect(f.entries.find(e=>e.tile===23&&e.kind.startsWith('triplet'))?.fu).toBe(2);
  });
  it('terminals and concealed/open quads',()=>{
    const h={...hand('123p555z77z'),melds:[parseMeld('ankan','1111m',standard),parseMeld('daiminkan','4444p',standard,0)]};
    const r=evaluateWin(h,situation(33,{method:'tsumo'}),standard);expect(r.best[0]?.fu.entries.find(e=>e.tile===0)?.fu).toBe(32);expect(r.best[0]?.fu.entries.find(e=>e.tile===12)?.fu).toBe(8);
  });
  it('double wind pair2, tanki2 and rounding',()=>{
    const h=hand('123m456p789s555p11z'),s=situation(27,{winner:0,seatWind:27,method:'tsumo'}),d=decompose(h,standard)[0];if(!d)throw new Error('d');const p=placements(d,27,standard)[0];if(!p)throw new Error('p');const f=calculateFu(h,d,p,s,evaluateYaku(h,d,p,s,standard),standard);expect(f.entries.find(e=>e.kind==='pair')?.fu).toBe(2);expect(f.beforeRounding).toBe(30);expect(f.rounded).toBe(30);
  });
  it('ryanpeikou suppresses iipeikou on same decomposition',()=>{const r=evaluateWin(hand('123123m456456p77s'),situation(0),standard);const b=r.best[0];expect(b?.yaku.recognized.some(y=>y.ruleId==='yaku.ryanpeikou')).toBe(true);expect(b?.yaku.recognized.some(y=>y.ruleId==='yaku.iipeikou')).toBe(false);});
  it('mamamo pure double dragon never leaks',()=>{const h=hand('12312378978955m');expect(evaluateWin(h,situation(0),standard).candidates.every(c=>c.yaku.recognized.every(y=>standard.definitions[y.ruleId]!==undefined))).toBe(true);expect(evaluateWin(h,situation(0),mamamo).best[0]?.yaku.recognized.some(y=>y.ruleId==='yaku.pure-double-dragon')).toBe(true);});
  it('seven honor pairs compound3, standard1',()=>{const h=hand('11223344556677z');expect(evaluateWin(h,situation(33),mamamo).best[0]?.yaku.yakuman).toBe(3);expect(evaluateWin(h,situation(33),standard).best[0]?.yaku.yakuman).toBe(1);});
  it('kokushi thirteen-sided double',()=>expect(evaluateWin(hand('119m19p19s1234567z'),situation(0),mamamo).best[0]?.yaku.yakuman).toBe(2));
  it('dragon required in red-dot',()=>{const r=evaluateWin(hand('22233344466688s'),situation(25),mamamo);expect(r.candidates.every(c=>!c.yaku.recognized.some(y=>y.ruleId==='yaku.red-dot'))).toBe(true);});
  it('five dealer wins applies to all',()=>{const h=hand('123m456p678s444p22z');expect(evaluateWin(h,situation(23,{riichi:'riichi',dealerConsecutiveWins:5}),mamamo).canWin).toBe(false);});
  it('open riichi is total2',()=>{const h=hand('123m456p678s444p22z');expect(evaluateWin(h,situation(23,{riichi:'open'}),mamamo).best[0]?.yaku.han).toBe(2);expect(evaluateWin(h,situation(23,{riichi:'open'}),standard).valid).toBe(false);});
  it('knitted pinfu exception',()=>{const h=hand('147m258p369s234m55p');expect(evaluateWin(h,situation(1),mamamo).best[0]?.yaku.recognized.some(y=>y.ruleId==='yaku.pinfu')).toBe(true);});
  it('seven stars fixed40',()=>expect(evaluateWin(hand('1234567z147s28p69m'),situation(8),mamamo).best[0]?.fu.rounded).toBe(40));
  it('unrelated first draw only',()=>{const h=hand('12345z148s269p388m');expect(evaluateWin(h,situation(2,{method:'tsumo',firstOwnDraw:true,noCalls:true}),mamamo).canWin).toBe(true);expect(evaluateWin(h,situation(2,{method:'tsumo'}),mamamo).canWin).toBe(false);});
});
describe('settlements and explanation',()=>{
  it('2v2 noten750',()=>expect(settleNoten([0,1],mamamo).map(t=>t.points)).toEqual([750n,750n,750n,750n]));
  it('nagashi own calls irrelevant, independent qualifiers',()=>{const r=settleNagashi([{player:0,discards:[0,8,27],anyClaimed:false},{player:1,discards:[33],anyClaimed:false}],0,mamamo);expect(r.scores).toHaveLength(2);expect(r.dealerContinues).toBe(true);expect(()=>settleNagashi([],0,standard)).toThrow();});
  it('fine pool carry and nearest',()=>{expect(settleFinePool(1000n,[],undefined,mamamo).carried).toBe(1000n);expect(settleFinePool(1000n,[1,3],2,mamamo).transfers[0]?.to).toBe(3);});
  it('pao inference',()=>{const h={...hand('123m55p'),melds:[parseMeld('pon','555z',mamamo,0),parseMeld('pon','666z',mamamo,2),parseMeld('pon','777z',mamamo,3)]};const r=evaluateWin(h,situation(13),mamamo);expect(inferLiability(h,r.best[0]?.yaku.recognized??[],mamamo)).toEqual([{ruleId:'yaku.daisangen',player:3,multiplier:1}]);});
  it('Korean explanations and profile checks',()=>{const h=hand('123m456p789s11122z');const r=evaluateWin(h,situation(28),standard);expect(explainWin(r,standard).join()).toContain('총 획득');expect(validateProblem({ruleSet:'mamamo',profileHash:'bad',mode:'score',hand:h},standard).valid).toBe(false);});
});
