import { describe, expect, it } from 'vitest';
import { analyzeDiscards, calculateScore, calculateShanten, counts, decompose, effectiveTiles, evaluateWin, parseTiles, structuralWaits, validateTiles } from '../../src/index.js';
import { mamamo, situation, standard } from '../helpers.js';
function random(seed:number):()=>number {let state=seed>>>0;return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};}
const seeds=[1,7,42,997,65537,20260921,0x12345678,0xdeadbeef];
describe('seeded reproducible properties',()=>{
  for(const seed of seeds)for(const context of [standard,mamamo])it(`seed=${seed} ${context.ruleSet}`,()=>{
    const rng=random(seed),wall=Array.from({length:136},(_,i)=>Math.floor(i/4));
    for(let i=wall.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));const a=wall[i],b=wall[j];if(a===undefined||b===undefined)throw new Error('shuffle');wall[i]=b;wall[j]=a;}
    const hand={concealed:wall.slice(0,13)};expect(validateTiles(hand,context,13)).toEqual([]);expect(counts(hand.concealed).every(n=>n<=4)).toBe(true);
    const before=calculateShanten(hand,context).shanten;
    for(const t of effectiveTiles(hand,context))expect(calculateShanten({concealed:[...hand.concealed,t.tile]},context).shanten).toBeLessThan(before);
    for(const w of structuralWaits(hand,context))expect(decompose({concealed:[...hand.concealed,w.tile]},context).length).toBeGreaterThan(0);
    const r=calculateScore({han:1+Math.floor(rng()*16),fu:30+Math.floor(rng()*7)*10,winner:1,dealer:0,method:rng()<.5?'ron':'tsumo',discarder:2,honba:Math.floor(rng()*6),riichiSticks:Math.floor(rng()*5)},context);
    expect(r.transfers.reduce((n,t)=>n+t.points,0n)).toBe(r.totalGain);expect(r.balanced).toBe(true);
  },30000);
  for(const seed of seeds)it(`constructed complete waits seed=${seed}`,()=>{
    const rng=random(seed);let tiles:number[]=[];
    do {tiles=[];for(let i=0;i<4;i++){const base=Math.floor(rng()*3)*9+Math.floor(rng()*7);tiles.push(base,base+1,base+2);}const pair=Math.floor(rng()*34);tiles.push(pair,pair);} while(counts(tiles).some(n=>n>4));
    const win=tiles.pop();if(win===undefined)throw new Error('draw');
    for(const c of [standard,mamamo]){expect(structuralWaits({concealed:tiles},c).some(w=>w.tile===win)).toBe(true);const r=evaluateWin({concealed:[...tiles,win]},situation(win,{riichi:'riichi'}),c);expect(r.canWin).toBe(true);expect(r.candidates.every(x=>x.yaku.recognized.every(y=>c.definitions[y.ruleId]?.enabled===true))).toBe(true);}
  });
  it('discard invariants and cache context isolation seed=123',()=>{
    for(const context of [standard,mamamo]){
      const h={concealed:parseTiles('123456789m12345p',context)},results=analyzeDiscards(h,context);
      for(const r of results){expect(r.hand.concealed).toHaveLength(13);expect(r.shanten).toBe(calculateShanten(r.hand,context).shanten);}
      expect(results.every(r=>r.effectiveTiles.every(t=>t.remaining>=1&&t.remaining<=4))).toBe(true);
    }
  },30000);
});
