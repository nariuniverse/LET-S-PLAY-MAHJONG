import { describe, expect, it } from 'vitest';
import { analyzeDiscards, calculateShanten, counts, decompose, effectiveSize, effectiveTiles, evaluateFuriten, evaluateWin, findWaits, loadRuleSet, parseMeld, parseTiles, placements, serializeTiles, structuralWaits, transitionFuriten, validateTiles } from '../../src/index.js';
import { hand, mamamo, situation, standard } from '../helpers.js';
describe('tiles',()=>{
  it.each(['0m','10m','8z','9z','123x','m123','123','-1m','11111m',''])('reject %s',text=>expect(()=>parseTiles(text,standard)).toThrow());
  it('normalizes and sorts',()=>expect(serializeTiles(parseTiles('789s321m7654321z654p',standard),standard)).toBe('123m456p789s1234567z'));
  it('honors and quantities',()=>expect(counts(parseTiles('1111m777z',standard))[0]).toBe(4));
  it('total tile count',()=>expect(validateTiles(hand('123m'),standard,14)).toContain('유효 패 수 14장 필요'));
  it('invalid internal tile',()=>expect(validateTiles({concealed:[34]},standard)).toContain('존재하지 않는 패'));
  it('open quad counts as one meld',()=>expect(validateTiles({concealed:parseTiles('123m456p789s11z',standard),melds:[parseMeld('ankan','2222z',standard)]},standard,14)).toEqual([]));
  it('counts duplicate concealed and exposed tiles',()=>expect(validateTiles({concealed:parseTiles('11m234p567s99z'.replace('99z','77z'),standard),melds:[parseMeld('pon','111m',standard)]},standard)).toContain('동일 패 4장 초과'));
  it.each(['129m','789z','111m'])('invalid chi %s',text=>expect(()=>parseMeld('chi',text,standard)).toThrow());
});
describe('forms and shanten',()=>{
  it.each([
    ['123m456p789s11122z','normal'],['1122m3344p5566s77z','seven-pairs'],['19m19p19s12345677z','orphans'],
  ])('complete %s', (text,form)=>{const h=hand(text??'');expect(decompose(h,standard).some(d=>d.form===form)).toBe(true);expect(calculateShanten(h,standard).shanten).toBe(-1);});
  it('all alternative decompositions',()=>{const d=decompose(hand('11223344556677m'),standard);expect(d.some(d=>d.form==='seven-pairs')).toBe(true);expect(d.filter(d=>d.form==='normal').length).toBeGreaterThan(1);});
  it('incomplete',()=>expect(decompose(hand('123m456p789s11234z'),standard)).toEqual([]));
  it.each(['147s258111p369m66z','1234567z147s28p69m','12345z148s269p388m'])('special form %s',text=>{
    expect(decompose(hand(text,mamamo),mamamo).length).toBeGreaterThan(0);expect(decompose(hand(text),standard)).toEqual([]);expect(calculateShanten(hand(text,mamamo),mamamo).shanten).toBe(-1);
  });
  it('normal tenpai',()=>expect(calculateShanten(hand('123m456p789s1112z'),standard).byForm.normal).toBe(0));
  it('seven pair tenpai',()=>expect(calculateShanten(hand('1122m3344p5566s7z'),standard).byForm['seven-pairs']).toBe(0));
  it('orphan tenpai',()=>expect(calculateShanten(hand('19m19p19s1234567z'),standard).byForm.orphans).toBe(0));
  it('one shanten orphan',()=>expect(calculateShanten(hand('19m19p19s123456m1z'),standard).byForm.orphans).toBe(5));
  it('discard ties, 13 tiles, rank order and unseen counts',()=>{
    const r=analyzeDiscards(hand('123456789m12345p'),standard);expect(r.filter(r=>r.optimal).length).toBeGreaterThan(1);
    for(const x of r){expect(effectiveSize(x.hand)).toBe(13);expect(x.total).toBe(x.effectiveTiles.reduce((n,e)=>n+e.remaining,0));if(x.optimal)expect(x.tied).toBe(true);}
  });
  it('four visible improving tiles excluded',()=>{const h=hand('123m456p789s1112z');expect(effectiveTiles(h,standard,[28,28,28]).some(t=>t.tile===28)).toBe(false);});
});
describe('waits',()=>{
  it.each([
    ['23m456p789s11122z','ryanmen',0],['13m456p789s11122z','kanchan',1],['12m456p789s11122z','penchan',2],
    ['123m456p789s1122z','shanpon',27],['123m456p789s1112z','tanki',28],
  ] as const)('%s %s',(text,wait,tile)=>{
    const d=decompose({...hand(text),concealed:[...hand(text).concealed,tile]},standard);expect(d.some(d=>placements(d,tile,standard).some(p=>p.wait===wait))).toBe(true);
  });
  it('nine-sided pure suit wait',()=>expect(structuralWaits(hand('1112345678999m'),standard).map(w=>w.tile)).toEqual([0,1,2,3,4,5,6,7,8]));
  it('exhausted waits remain structural',()=>{const w=structuralWaits(hand('123m456p789s1112z'),standard,[28,28,28]);expect(w.find(w=>w.tile===28)?.remaining).toBe(0);});
  it('furiten does not block tsumo',()=>{
    const waits=findWaits(hand('23m456p789s11122z'),{winner:1,dealer:0,seatWind:28,roundWind:27,discarder:2,ownDiscards:[0]},standard);
    expect(waits.every(w=>!w.ron&&w.tsumo)).toBe(true);
  });
  it('special wait not leaked',()=>{const h=hand('1234567z147s28p6m',mamamo);expect(structuralWaits(h,mamamo).length).toBeGreaterThan(0);expect(structuralWaits(h,standard)).toEqual([]);});
  it('no yaku ron denied',()=>{const r=evaluateWin(hand('123m456p678s444p22z'),situation(23),standard);expect(r.valid).toBe(true);expect(r.canWin).toBe(false);});
  it('explicit rule context required',()=>expect(()=>loadRuleSet('bad' as 'mamamo')).toThrow());
  it.each([standard,mamamo])('furiten states $ruleSet',ctx=>{
    expect(evaluateFuriten([0],{ownDiscards:[0]},ctx).ronAllowed).toBe(false);
    let state=transitionFuriten({temporary:false,permanent:false},'pass-win',true,ctx);expect(state.permanent).toBe(true);
    state=transitionFuriten(state,'own-draw',true,ctx);expect(state).toEqual({temporary:false,permanent:true});
    expect(transitionFuriten({temporary:true,permanent:false},'own-call',false,ctx).temporary).toBe(false);
    expect(transitionFuriten({temporary:true,permanent:false},'other-call',false,ctx).temporary).toBe(true);
  });
});
