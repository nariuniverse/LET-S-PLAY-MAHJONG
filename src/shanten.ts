import type { Form, Hand, RuleContext, Tile } from './types.js';
import { allTiles, counts, effectiveSize, validateTiles } from './tiles.js';
import { KNITTED, MELD_TARGETS, ORPHANS } from './shapes.js';
interface Parts { m:number;t:number;p:number }
// Structural memo only: neither rule-set state nor yaku policies enter this cache.
const suitMemo=new Map<string,readonly Parts[]>();
function suitParts(input:readonly number[],honors:boolean):readonly Parts[]{
  const key=`${honors?'z':'s'}${input.join('')}`,cached=suitMemo.get(key);if(cached)return cached;
  const start=input.findIndex(n=>n>0);if(start<0)return [{m:0,t:0,p:0}];
  const n=input[start]??0,out=new Map<number,Parts>();
  const take=(ids:number[],m:number,t:number,p:number):void=>{
    const rest=[...input];for(const i of ids)rest[i]=(rest[i]??0)-1;
    for(const sub of suitParts(rest,honors)){
      const part={m:sub.m+m,t:Math.min(4,sub.t+t),p:sub.p+p};if(part.m>4||part.p>1)continue;
      const k=part.m*2+part.p;if(part.t>(out.get(k)?.t??-1))out.set(k,part);
    }
  };
  take([start],0,0,0);
  if(n>=3)take([start,start,start],1,0,0);
  if(n>=2){take([start,start],0,1,0);take([start,start],0,0,1);}
  if(!honors){
    if(start<=6&&(input[start+1]??0)>0&&(input[start+2]??0)>0)take([start,start+1,start+2],1,0,0);
    if(start<=7&&(input[start+1]??0)>0)take([start,start+1],0,1,0);
    if(start<=6&&(input[start+2]??0)>0)take([start,start+2],0,1,0);
  }
  const result=[...out.values()];if(suitMemo.size>50000)suitMemo.clear();suitMemo.set(key,result);return result;
}
function normalDistance(input:readonly number[],fixed:number):number{
  let combined:readonly Parts[]=[{m:fixed,t:0,p:0}];
  for(let suit=0;suit<4;suit++){
    const next=new Map<number,Parts>();
    for(const a of combined)for(const b of suitParts(input.slice(suit*9,suit===3?34:suit*9+9),suit===3)){
      const m=a.m+b.m,p=a.p+b.p;if(m>4||p>1)continue;const t=Math.min(4-m,a.t+b.t),k=m*2+p;
      if(t>(next.get(k)?.t??-1))next.set(k,{m,t,p});
    }
    combined=[...next.values()];
  }
  return Math.min(...combined.map(x=>8-2*x.m-x.t-x.p));
}
interface Target { c:readonly number[];m:number;p:number }
const targets=new Map<boolean,readonly Target[]>();
const overlapMemo=new Map<string,readonly number[]>();
function suitTargets(honors:boolean):readonly Target[]{
  const cached=targets.get(honors);if(cached)return cached;
  const width=honors?7:9,c=Array<number>(width).fill(0),out:Target[]=[];
  const groups=[...Array.from({length:width},(_,t)=>[t,t,t]),...(!honors?Array.from({length:7},(_,t)=>[t,t+1,t+2]):[])];
  const visit=(start:number,m:number):void=>{
    out.push({c:[...c],m,p:0});
    for(let t=0;t<width;t++)if((c[t]??0)<=2){c[t]=(c[t]??0)+2;out.push({c:[...c],m,p:1});c[t]=(c[t]??0)-2;}
    if(m===4)return;
    for(let i=start;i<groups.length;i++){
      const g=groups[i];if(!g)continue;for(const t of g)c[t]=(c[t]??0)+1;
      if(g.every(t=>(c[t]??0)<=4))visit(i,m+1);
      for(const t of g)c[t]=(c[t]??0)-1;
    }
  };
  visit(0,0);targets.set(honors,out);return out;
}
function capacityDistance(hand:Hand):number{
  const c=counts(hand.concealed),used=counts((hand.melds??[]).flatMap(m=>[...m.tiles]));
  let dp=Array<number>(10).fill(-100);dp[(hand.melds?.length??0)*2]=0;
  for(let suit=0;suit<4;suit++){
    const owned=c.slice(suit*9,suit===3?34:suit*9+9),cap=used.slice(suit*9,suit===3?34:suit*9+9).map(n=>4-n);
    const key=owned.join('')+':'+cap.join('');let options=overlapMemo.get(key);
    if(!options){const best=Array<number>(10).fill(-100);
      for(const target of suitTargets(suit===3)){
        if(target.c.some((n,i)=>n>(cap[i]??0)))continue;
        const overlap=target.c.reduce((n,t,i)=>n+Math.min(t,owned[i]??0),0),index=target.m*2+target.p;
        best[index]=Math.max(best[index]??-100,overlap);
      }
      options=best;if(overlapMemo.size>50000)overlapMemo.clear();overlapMemo.set(key,best);
    }
    const next=Array<number>(10).fill(-100);
    for(let a=0;a<10;a++)for(let b=0;a+b<10;b++)if(a%2+b%2<=1)next[a+b]=Math.max(next[a+b]??-100,(dp[a]??-100)+(options[b]??-100));
    dp=next;
  }
  return 13-(hand.melds?.length??0)*3-(dp[9]??0);
}
function knittedDistance(c: readonly number[]):number {
  let best=13;
  for(const knit of KNITTED){
    const target=Array<number>(34).fill(0);for(const t of knit)target[t]=1;
    const baseOverlap=knit.filter(t=>(c[t]??0)>0).length;
    for(const meld of MELD_TARGETS){
      let extra=0;for(const t of meld){const n=target[t]??0;if((c[t]??0)>n)extra++;target[t]=n+1;}
      let pairOverlap=0;
      for(let pair=0;pair<34;pair++){
        const n=target[pair]??0;if(n>2)continue;
        pairOverlap=Math.max(pairOverlap,Math.min(2,Math.max(0,(c[pair]??0)-n)));
      }
      best=Math.min(best,13-baseOverlap-extra-pairOverlap);
      for(const t of meld)target[t]=(target[t]??0)-1;
    }
  }
  return best;
}
const unrelatedSubsets=[9,7].map((width,index)=>Array.from({length:1<<width},(_,mask)=>Array.from({length:width},(_,r)=>r).filter(r=>mask&(1<<r))).filter(ids=>index===1||ids.every((r,i)=>i===0||r-(ids[i-1]??0)>=3)));
function unrelatedDistance(c:readonly number[]):number {
  let dp=Array<number>(28).fill(-1);dp[0]=0;
  for(let suit=0;suit<4;suit++){
    const options=Array<number>(28).fill(-1);
    for(const ids of unrelatedSubsets[suit===3?1:0]??[]){
      let overlap=0,pair=0;for(const r of ids){const n=c[suit*9+r]??0;if(n>0)overlap++;if(n>1)pair=1;}
      const key=ids.length*2;options[key]=Math.max(options[key]??-1,overlap);
      if(ids.length)options[key+1]=Math.max(options[key+1]??-1,overlap+pair);
    }
    const next=Array<number>(28).fill(-1);
    for(let k=0;k<28;k++)for(let j=0;j+k<28;j++){
      const v=dp[k]??-1,w=options[j]??-1;if(v<0||w<0||k%2+j%2>1)continue;
      next[k+j]=Math.max(next[k+j]??-1,v+w);
    }
    dp=next;
  }
  return 13-(dp[27]??0);
}
export interface ShantenResult { ruleSet: RuleContext['ruleSet']; shanten: number; byForm: Partial<Record<Form,number>>; ruleIds: readonly string[] }
export function calculateShanten(hand: Hand, context: RuleContext): ShantenResult {
  const errors=validateTiles(hand,context);if(errors.length||![13,14].includes(effectiveSize(hand)))throw new Error([...errors,'샹텐 입력은 유효13/14패'].join(', '));
  const c=counts(hand.concealed),fixed=hand.melds?.length??0,byForm:Partial<Record<Form,number>>={};
  for(const form of context.policies.forms){
    if(form==='normal')byForm[form]=normalDistance(c,fixed)===-1?-1:capacityDistance(hand);
    else if(!fixed){
      if(form==='seven-pairs')byForm[form]=6-c.filter(n=>n>=2).length+Math.max(0,7-c.filter(n=>n>0).length);
      if(form==='orphans')byForm[form]=13-ORPHANS.filter(t=>(c[t]??0)>0).length-(ORPHANS.some(t=>(c[t]??0)>=2)?1:0);
      if(form==='knitted')byForm[form]=knittedDistance(c);
      if(form==='seven-stars')byForm[form]=Math.min(...KNITTED.map(k=>13-c.slice(27).filter(n=>n>0).length-Math.min(7,k.filter(t=>(c[t]??0)>0).length)));
      if(form==='unrelated')byForm[form]=unrelatedDistance(c);
    }
  }
  return {ruleSet:context.ruleSet,shanten:Math.min(...Object.values(byForm)),byForm,ruleIds:['win.forms']};
}
export interface EffectiveTile { tile:Tile; remaining:number; shanten:number }
/** knownOutside excludes every tile in this hand; include discards and other players' exposed tiles once. */
export function effectiveTiles(hand:Hand, context:RuleContext, knownOutside:readonly Tile[]=[]):EffectiveTile[]{
  if(effectiveSize(hand)!==13)throw new Error('유효패는 유효13패 입력');
  const known=counts([...allTiles(hand),...knownOutside]);if(known.some(n=>n>4))throw new Error('보이는 패 중복 집계');
  const before=calculateShanten(hand,context).shanten,result:EffectiveTile[]=[];
  for(let tile=0;tile<34;tile++){
    const remaining=4-(known[tile]??0);if(remaining<=0)continue;
    const shanten=calculateShanten({...hand,concealed:[...hand.concealed,tile]},context).shanten;
    if(shanten<before)result.push({tile,remaining,shanten});
  }
  return result;
}
export interface DiscardResult { discard:Tile; hand:Hand; shanten:number; delta:number; effectiveTiles:readonly EffectiveTile[]; total:number; optimal:boolean; tied:boolean }
export function analyzeDiscards(hand:Hand,context:RuleContext,knownOutside:readonly Tile[]=[]):DiscardResult[]{
  const errors=validateTiles(hand,context,14);if(errors.length)throw new Error(errors.join(', '));
  const before=calculateShanten(hand,context).shanten,result:DiscardResult[]=[];
  for(const discard of new Set(hand.concealed)){
    const tiles=[...hand.concealed];tiles.splice(tiles.indexOf(discard),1);const next={...hand,concealed:tiles};
    const shanten=calculateShanten(next,context).shanten;const effective=effectiveTiles(next,context,[...knownOutside,discard]);
    result.push({discard,hand:next,shanten,delta:shanten-before,effectiveTiles:effective,total:effective.reduce((n,t)=>n+t.remaining,0),optimal:false,tied:false});
  }
  result.sort((a,b)=>a.shanten-b.shanten||b.total-a.total||a.discard-b.discard);
  const first=result[0];if(first){for(const r of result)r.optimal=r.shanten===first.shanten&&r.total===first.total;const tied=result.filter(r=>r.optimal).length>1;for(const r of result)r.tied=r.optimal&&tied;}
  return result;
}
