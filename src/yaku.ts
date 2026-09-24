import type { Block, Decomposition, Definition, Excluded, Hand, Placement, RuleContext, Situation, Tile, YakuMatch, YakuResult } from './types.js';
import { allTiles, closed, counts, rank, suit, terminalHonor } from './tiles.js';
import { evidence } from './rules.js';
interface View { hand:Hand; d:Decomposition; p:Placement; s:Situation; context:RuleContext; tiles:Tile[]; c:number[]; sequences:Block[]; sets:Block[]; concealedSets:Block[]; isClosed:boolean }
type Detector = (v:View)=>boolean|number;
const has=(blocks:readonly Block[],tile:Tile):boolean=>blocks.some(b=>b.tile===tile);
function straight(v:View):boolean{return [0,9,18].some(base=>[0,3,6].every(n=>has(v.sequences,base+n)));}
function sequencePairs(v:View):number{const c=counts(v.sequences.map(b=>b.tile));return c.reduce((n,c)=>n+Math.floor(c/2),0);}
function pairValue(pair:Tile|null,s:Situation):boolean{return pair!==null&&(pair>=31||pair===s.seatWind||pair===s.roundWind);}
function shift(blocks:readonly Block[],number:number,mixed:boolean,step:number):boolean{
  return blocks.some(b=>{
    const start=rank(b.tile);
    const pick=(index:number,used:number[]):boolean=>index===number||blocks.some(x=>rank(x.tile)===start+index*step&&(mixed?!used.includes(suit(x.tile)):suit(x.tile)===suit(b.tile))&&x.tile<27&&pick(index+1,[...used,suit(x.tile)]));
    return b.tile<27&&pick(0,[]);
  });
}
function allAllowed(v:View,notation:string):boolean {
  const allowed:number[]=[];for(const m of notation.matchAll(/([1-9]+)([mpsz])/g)){const s='mpsz'.indexOf(m[2]??'');for(const n of m[1]??'')allowed.push(s*9+Number(n)-1);}return v.tiles.every(t=>allowed.includes(t));
}
function sameSuit(v:View):boolean{return new Set(v.tiles.filter(t=>t<27).map(suit)).size===1;}
function hasHonor(v:View):boolean{return v.tiles.some(t=>t>=27);}
function sequenceOutside(v:View,honors:boolean):boolean{
  const pair=v.d.pair;if(pair===null||v.d.form!=='normal'||!v.sequences.length)return false;
  const outside=(t:Tile):boolean=>honors?terminalHonor(t):t<27&&(rank(t)===1||rank(t)===9);
  return outside(pair)&&v.d.blocks.every(b=>b.kind==='sequence'?(rank(b.tile)===1||rank(b.tile)===7):outside(b.tile))&&(!honors||hasHonor(v));
}
function pinfu(v:View):boolean{
  return !pairValue(v.d.pair,v.s)&&v.p.wait==='ryanmen'&&(v.d.form==='normal'&&v.sequences.length===4||v.context.policies.specialPinfu&&v.d.form==='knitted'&&v.sequences.length===1);
}
const registry:Record<string,Detector>={
  'menzen-tsumo':v=>v.s.method==='tsumo',
  riichi:v=>v.s.riichi==='riichi'||v.s.riichi==='double',
  'double-riichi':v=>v.s.riichi==='double',
  'open-riichi':v=>v.s.riichi==='open'&&v.context.policies.openRiichi,
  ippatsu:v=>v.s.ippatsu===true&&v.s.riichi!==undefined&&v.s.riichi!=='none'&&v.s.noCalls===true,
  dragons:v=>v.sets.filter(b=>b.tile>=31).length,
  winds:v=>v.sets.reduce((n,b)=>n+Number(b.tile===v.s.seatWind)+Number(b.tile===v.s.roundWind),0),
  'seat-wind':v=>has(v.sets,v.s.seatWind),
  'round-wind':v=>has(v.sets,v.s.roundWind),
  tanyao:v=>v.tiles.every(t=>!terminalHonor(t)),
  pinfu,
  iipeikou:v=>sequencePairs(v)>=1,
  ryanpeikou:v=>sequencePairs(v)===2,
  chanta:v=>sequenceOutside(v,true),
  junchan:v=>sequenceOutside(v,false),
  'sanshoku-doujun':v=>Array.from({length:7},(_,r)=>r).some(r=>[0,9,18].every(b=>has(v.sequences,b+r))),
  ittsuu:straight,
  toitoi:v=>v.sets.length===4,
  'sanshoku-doukou':v=>Array.from({length:9},(_,r)=>r).some(r=>[0,9,18].every(b=>has(v.sets,b+r))),
  sanankou:v=>v.concealedSets.length>=3,
  chiitoitsu:v=>v.d.form==='seven-pairs',
  shousangen:v=>v.sets.filter(b=>b.tile>=31).length===2&&v.d.pair!==null&&v.d.pair>=31,
  honroutou:v=>v.tiles.every(terminalHonor),
  honitsu:v=>sameSuit(v)&&hasHonor(v),
  chinitsu:v=>sameSuit(v)&&!hasHonor(v),
  kokushi:v=>v.d.form==='orphans',
  suuankou:v=>v.concealedSets.length===4,
  daisangen:v=>v.sets.filter(b=>b.tile>=31).length===3,
  chuuren:v=>{
    if((v.hand.melds?.length??0)>0||!sameSuit(v)||hasHonor(v))return false;
    const base=Math.floor((v.tiles[0]??0)/9)*9;
    return [3,1,1,1,1,1,1,1,3].every((n,i)=>(v.c[base+i]??0)>=n);
  },
  ryuuiisou:v=>allAllowed(v,'23468s6z'),
  chinroutou:v=>v.tiles.every(t=>t<27&&terminalHonor(t)),
  tsuuiisou:v=>v.tiles.every(t=>t>=27),
  shousuushii:v=>v.sets.filter(b=>b.tile>=27&&b.tile<31).length===3&&v.d.pair!==null&&v.d.pair>=27&&v.d.pair<31,
  daisuushii:v=>v.sets.filter(b=>b.tile>=27&&b.tile<31).length===4,
  tenhou:v=>v.s.winner===v.s.dealer&&v.s.initialDeal===true&&!(v.hand.melds?.length),
  chiihou:v=>v.s.winner!==v.s.dealer&&v.s.firstOwnDraw===true&&v.s.noCalls===true&&v.s.method==='tsumo'&&!(v.hand.melds?.length),
  renhou:v=>v.s.method==='ron'&&v.s.beforeFirstOwnDraw===true&&v.s.noCalls===true,
  nagashi:()=>false,
  sankantsu:v=>v.d.blocks.filter(b=>b.kind==='quad').length===3,
  suukantsu:v=>v.d.blocks.filter(b=>b.kind==='quad').length===4,
  chankan:v=>v.s.method==='ron'&&v.s.robKan==='added',
  rinshan:v=>v.s.method==='tsumo'&&v.s.drawSource==='rinshan',
  haitei:v=>v.s.method==='tsumo'&&v.s.drawSource==='last-live',
  houtei:v=>v.s.method==='ron'&&v.s.lastDiscard===true,
  'eight-continuations':v=>v.s.winner===v.s.dealer&&v.s.dealerConsecutiveWins===7,
  kazoe:()=>false,
  'flower-straight':v=>v.sequences.some(a=>rank(a.tile)===1&&v.sequences.some(b=>rank(b.tile)===4&&suit(b.tile)!==suit(a.tile)&&v.sequences.some(c=>rank(c.tile)===7&&suit(c.tile)!==suit(a.tile)&&suit(c.tile)!==suit(b.tile)))),
  'mixed-shifted-sequences':v=>shift(v.sequences,3,true,1),
  'pure-three-shifted-sequences':v=>shift(v.sequences,3,false,1),
  'pure-four-shifted-sequences':v=>shift(v.sequences,4,false,1),
  'five-gates':v=>[0,1,2].every(s=>v.tiles.some(t=>t<27&&suit(t)===s))&&v.tiles.some(t=>t>=27&&t<31)&&v.tiles.some(t=>t>=31),
  sanrenkou:v=>shift(v.sets,3,false,1),
  'mixed-shifted-triplets':v=>shift(v.sets,3,true,1),
  reversible:v=>allAllowed(v,'1234589p245689s5z'),
  'upper-four':v=>v.tiles.every(t=>t<27&&rank(t)>=6),
  'lower-four':v=>v.tiles.every(t=>t<27&&rank(t)<=4),
  'upper-three':v=>v.tiles.every(t=>t<27&&rank(t)>=7),
  'middle-three':v=>v.tiles.every(t=>t<27&&rank(t)>=4&&rank(t)<=6),
  'lower-three':v=>v.tiles.every(t=>t<27&&rank(t)<=3),
  'knitted-straight':v=>v.d.form==='knitted',
  'seven-stars':v=>v.d.form==='seven-stars',
  'all-fives':v=>v.d.form==='normal'&&v.d.pair!==null&&v.d.pair<27&&rank(v.d.pair)===5&&v.d.blocks.every(b=>b.tile<27&&(b.kind==='sequence'?rank(b.tile)>=3&&rank(b.tile)<=5:rank(b.tile)===5)),
  'all-even-triplets':v=>v.sets.length===4&&v.tiles.every(t=>t<27&&rank(t)%2===0),
  'mixed-double-dragon':v=>v.d.pair!==null&&v.d.pair<27&&rank(v.d.pair)===5&&[0,1,2].filter(s=>s!==suit(v.d.pair??0)).every(s=>[0,6].every(r=>has(v.sequences,s*9+r))),
  'big-seven-stars':v=>v.d.form==='seven-pairs'&&v.tiles.every(t=>t>=27),
  'north-south':v=>straight(v)&&v.d.pair!==null&&[28,30].includes(v.d.pair)&&has(v.concealedSets,v.d.pair===28?30:28),
  black:v=>allAllowed(v,'248p1234z')&&(v.d.form==='seven-pairs'||v.sets.length===4),
  'big-wheel':v=>v.d.form==='seven-pairs'&&[0,9,18].some(b=>[1,2,3,4,5,6,7].every(r=>v.c[b+r]===2)),
  'seven-shifted-pairs':v=>v.d.form==='seven-pairs'&&[0,9,18].some(b=>[0,1,2].some(start=>Array.from({length:7},(_,r)=>r).every(r=>v.c[b+start+r]===2))),
  suurenkou:v=>shift(v.sets,4,false,1),
  'four-identical-sequences':v=>v.sequences.length===4&&new Set(v.sequences.map(b=>b.tile)).size===1,
  'flower-bird-wind-moon':v=>[13,18,9].every(t=>has(v.sets,t))&&v.sets.some(b=>b.tile>=27&&b.tile<31),
  'wind-flower-snow-moon':v=>[13,31,9].every(t=>has(v.sets,t))&&v.sets.some(b=>b.tile>=27&&b.tile<31),
  'thirteen-unrelated':v=>v.d.form==='unrelated'&&v.s.firstOwnDraw===true&&v.s.noCalls===true&&v.s.method==='tsumo',
  'red-dot':v=>allAllowed(v,'23468s7z')&&(v.c[33]??0)>0,
  'red-peacock':v=>allAllowed(v,'1579s7z')&&(v.c[33]??0)>0,
  'pure-double-dragon':v=>v.d.pair!==null&&v.d.pair<27&&rank(v.d.pair)===5&&v.sequences.length===4&&v.sequences.filter(b=>b.tile===Math.floor((v.d.pair??0)/9)*9).length===2&&v.sequences.filter(b=>b.tile===Math.floor((v.d.pair??0)/9)*9+6).length===2,
  'million-stones':v=>v.tiles.every(t=>t<9)&&v.tiles.reduce((n,t)=>n+rank(t),0)>100,
};
export function registeredYaku(context:RuleContext):string[]{
  const ids=Object.values(context.definitions).filter(d=>d.id.startsWith('yaku.')&&d.enabled).map(d=>d.id);
  for(const id of ids)if(!registry[id.slice(5)])throw new Error(`역 판정기 없음: ${id}`);
  return ids;
}
export function doraSuccessor(tile:Tile,context:RuleContext):Tile {
  if(!Number.isInteger(tile)||tile<0||tile>33||context.policies.copies!==4)throw new Error('잘못된 도라 표시패');
  return tile<27?(rank(tile)===9?tile-8:tile+1):tile<31?(tile===30?27:tile+1):tile===33?31:tile+1;
}
export function countDora(hand:Hand,s:Situation,context:RuleContext):number{
  const c=counts(allTiles(hand));return [...(s.doraIndicators??[]),...(s.riichi&&s.riichi!=='none'?s.uraIndicators??[]:[])].reduce((n,t)=>n+(c[doraSuccessor(t,context)]??0),0);
}
function match(def:Definition,han:number,yakuman:number,isClosed:boolean,context:RuleContext,specialConditions:string[]=[]):YakuMatch{return {...evidence(def.id,context),name:def.name,han,yakuman,closed:isClosed,specialConditions};}
export function evaluateYaku(hand:Hand,d:Decomposition,p:Placement,s:Situation,context:RuleContext):YakuResult{
  const tiles=allTiles(hand),isClosed=closed(hand),sets=d.blocks.filter(b=>b.kind!=='sequence');
  const v:View={hand,d,p,s,context,tiles,c:counts(tiles),sequences:d.blocks.filter(b=>b.kind==='sequence'),sets,concealedSets:d.blocks.filter((b,i)=>b.kind!=='sequence'&&!b.open&&!(s.method==='ron'&&p.blockIndex===i)),isClosed};
  let recognized:YakuMatch[]=[];const excluded:Excluded[]=[];
  for(const id of registeredYaku(context)){
    const def=context.definitions[id];const detector=registry[id.slice(5)];if(!def||!detector)throw new Error(id);
    const eligible=isClosed||def.openEligible;
    if(!eligible){excluded.push({ruleId:id,reason:'멘젠 한정'});continue;}
    const amount=detector(v);if(!amount){excluded.push({ruleId:id,reason:'성립 조건 불충족'});continue;}
    let han=(isClosed?def.closedValue:def.openValue)??0,yakuman=def.yakumanMultiplier;
    if(typeof amount==='number')han*=amount;
    const special:string[]=[];
    if(id==='yaku.kokushi'&&context.policies.kokushiDouble){const before=[...v.c];before[s.winningTile]=(before[s.winningTile]??0)-1;if(before.every(n=>n<=1)){yakuman=2;special.push('국사13면 더블역만');}}
    recognized.push(match(def,han,yakuman,isClosed,context,special));
  }
  const remove=(id:string,by:string,reason:string):void=>{if(recognized.some(m=>m.ruleId===id)){recognized=recognized.filter(m=>m.ruleId!==id);excluded.push({ruleId:id,reason,by});}};
  if(recognized.some(m=>m.ruleId==='yaku.double-riichi')){
    const def=context.definitions['yaku.double-riichi'];if(def&&def.closedValue===2)remove('yaku.riichi','yaku.double-riichi','상위 리치에 포함');
  }
  if(recognized.some(m=>m.ruleId==='yaku.ryanpeikou'))remove('yaku.iipeikou','yaku.ryanpeikou','동일 슌쯔쌍의 상위역');
  if(recognized.some(m=>m.ruleId==='yaku.junchan'))remove('yaku.chanta','yaku.junchan','준찬타의 하위역');
  const original=[...recognized];
  for(const upper of original){
    const def=context.definitions[upper.ruleId];if(!def)continue;
    const included=Array.isArray(def.stackingRules.included)?def.stackingRules.included.filter((x):x is string=>typeof x==='string'):[];
    for(const lower of included)remove(lower,upper.ruleId,'상위역에 포함');
    for(const lower of def.exclusions){
      const other=recognized.find(m=>m.ruleId===lower);
      if(other&&(upper.yakuman>other.yakuman||upper.yakuman===other.yakuman&&upper.han>=other.han))remove(lower,upper.ruleId,'명시된 중복 불가');
    }
  }
  if(recognized.some(m=>m.ruleId==='yaku.eight-continuations'))for(const m of [...recognized])if(m.ruleId!=='yaku.eight-continuations')remove(m.ruleId,'yaku.eight-continuations','8연승 손 가치 대체');
  let yakuman=recognized.filter(m=>m.yakuman>0).reduce((n,m)=>context.policies.multipleYakuman?n+m.yakuman:Math.max(n,m.yakuman),0);
  if(yakuman){for(const m of [...recognized])if(!m.yakuman)remove(m.ruleId,'pattern_yakuman','역만에 일반역 가산 안 함');}
  const dora=yakuman?0:countDora(hand,s,context);let han=recognized.reduce((n,m)=>n+m.han,0);
  if(!yakuman&&context.policies.kazoe&&han+dora>=13&&han>0){const def=context.definitions['yaku.kazoe'];if(def){recognized.push(match(def,0,1,isClosed,context));yakuman=1;}}
  let fixedLimit:YakuResult['fixedLimit']=null;
  if(!yakuman&&recognized.some(m=>m.ruleId==='yaku.renhou')){
    fixedLimit=context.policies.renhou==='baiman'?'baiman':'mangan';
    if(context.policies.renhou==='exclusive_mangan'){for(const m of [...recognized])if(m.ruleId!=='yaku.renhou')remove(m.ruleId,'yaku.renhou','인화 고정만관은 독립 비교');han=5;}
  }
  return {recognized,excluded,han:yakuman?0:han,yakuman,dora:yakuman||fixedLimit==='mangan'?0:dora,fixedLimit};
}
