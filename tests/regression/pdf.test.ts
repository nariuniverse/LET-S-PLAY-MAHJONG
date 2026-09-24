import fs from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { calculateScore, calculateShanten, decompose, doraSuccessor, evaluateYaku, parseMeld, parseTiles, placements, structuralWaits, validateTiles } from '../../src/index.js';
import type { Hand, Meld } from '../../src/index.js';
import { mamamo, situation } from '../helpers.js';
interface Example {id:string;kind:string;tiles:string|null;waits?:string;dora?:string;heldRanks?:number[];claimRank?:number;prohibitedDiscardRank?:number;openMelds?:{kind:Meld['kind'];tiles:string;from?:string}[]|null}
interface Spec {yaku:{id:string;examples?:Example[]}[];examples:Example[];scoreTable:{rawRows:Record<string,{child:(number[]|'mangan')[];dealer:(number[]|'mangan')[]}>;limits:Record<string,{child:number[];dealer:number[]}>}}
const spec=parse(fs.readFileSync('rules/mamamo-rules.yaml','utf8')) as Spec;
const examples=[...spec.examples.map(e=>({...e,yakuId:null})),...spec.yaku.flatMap(y=>(y.examples??[]).map(e=>({...e,yakuId:y.id})))];
describe('all 72 PDF examples',()=>{
  it('inventory preserved',()=>{expect(examples).toHaveLength(72);expect(examples.filter(e=>e.kind.startsWith('complete-hand'))).toHaveLength(59);});
  for(const example of examples)it(example.id,()=>{
    if(example.kind==='rank-only-pattern'){
      expect(example.heldRanks).toHaveLength(3);expect(example.heldRanks).toContain(example.prohibitedDiscardRank);expect(example.claimRank).toBe(example.id.endsWith('1')?3:4);return;
    }
    if(example.tiles===null)throw new Error('missing normalized tiles');
    const tiles=parseTiles(example.tiles,mamamo);expect(validateTiles({concealed:tiles},mamamo)).toEqual([]);
    if(example.kind==='indicator'){expect(example.dora).toBeDefined();expect(doraSuccessor(tiles[0]??-1,mamamo)).toBe(parseTiles(example.dora??'',mamamo)[0]);return;}
    if(example.kind==='tenpai-hand'){expect(structuralWaits({concealed:tiles},mamamo).map(w=>w.tile)).toEqual(parseTiles(example.waits??'',mamamo));return;}
    if(example.kind==='set'){expect([3,4]).toContain(tiles.length);return;}
    const melds=(example.openMelds??[]).map(m=>parseMeld(m.kind,m.tiles,mamamo,0));
    const concealed=[...tiles];for(const t of melds.flatMap(m=>[...m.tiles])){const index=concealed.indexOf(t);expect(index).toBeGreaterThanOrEqual(0);concealed.splice(index,1);}
    const hand:Hand={concealed,melds};expect(validateTiles(hand,mamamo,14)).toEqual([]);
    const decompositions=decompose(hand,mamamo);expect(decompositions.length).toBeGreaterThan(0);
    expect(calculateShanten(hand,mamamo).shanten).toBe(-1);
    // PDF has no winning tile/method here: existentially verify the originating pattern,
    // without inventing a unique score or claiming these circumstances were printed.
    const matches=decompositions.flatMap(d=>[...new Set(concealed)].flatMap(t=>placements(d,t,mamamo).flatMap(p=>['ron','tsumo'].map(method=>evaluateYaku(hand,d,p,situation(t,{method:method as 'ron'|'tsumo',firstOwnDraw:true,noCalls:true}),mamamo)))));
    expect(matches.some(y=>y.recognized.some(m=>m.ruleId===example.yakuId)||y.excluded.some(m=>m.ruleId===example.yakuId&&m.by!==undefined))).toBe(true);
  });
});
describe('every printed score table region',()=>{
  for(const [fu,row] of Object.entries(spec.scoreTable.rawRows))for(const player of ['child','dealer'] as const)row[player].forEach((cells,index)=>{
    it(`${fu}fu ${index+1}han ${player}`,()=>{
      const winner=player==='child'?1:0,base={han:index+1,fu:Number(fu),winner:winner as 0|1,dealer:0 as const,discarder:2 as const};
      const ron=calculateScore({...base,method:'ron'},mamamo),tsumo=calculateScore({...base,method:'tsumo'},mamamo);
      if(cells==='mangan'){expect(ron.limit).toBe('mangan');expect(ron.totalGain).toBe(player==='child'?8000n:12000n);return;}
      expect(ron.totalGain).toBe(BigInt(cells[0]??-1));
      if(player==='dealer')expect(tsumo.opponentPayments[1]).toBe(BigInt(cells[1]??-1));
      else {
        const corrected=Number(fu)===50;
        expect(tsumo.opponentPayments[0]).toBe(BigInt(cells[corrected?2:1]??-1));
        expect(tsumo.opponentPayments[2]).toBe(BigInt(cells[corrected?1:2]??-1));
      }
    });
  });
  for(const [name,han] of Object.entries({mangan:5,haneman:6,baiman:8,sanbaiman:11,yakuman:13}))for(const winner of [0,1] as const)it(`limit ${name} winner${winner}`,()=>{
    const raw=spec.scoreTable.limits[name];if(!raw)throw new Error('missing limit');const values=winner===0?raw.dealer:raw.child;
    const r=calculateScore({han,fu:30,winner,dealer:0,method:'ron',discarder:2},mamamo),t=calculateScore({han,fu:30,winner,dealer:0,method:'tsumo'},mamamo);
    expect(r.totalGain).toBe(BigInt(values[0]??-1));expect(t.opponentPayments[winner===0?1:0]).toBe(BigInt(values[1]??-1));if(winner===1)expect(t.opponentPayments[2]).toBe(BigInt(values[2]??-1));
  });
});
