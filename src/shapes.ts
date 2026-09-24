import type { Block, Decomposition, Hand, Placement, RuleContext, Tile } from './types.js';
import { counts, rank, suit, validateTiles } from './tiles.js';
export const ORPHANS = [0,8,9,17,18,26,27,28,29,30,31,32,33];
const permutations = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
export const KNITTED = permutations.map(p => p.flatMap((s, i) => [0,3,6].map(r => s*9+r+i)));
export const MELD_TARGETS: readonly (readonly Tile[])[] = [
  ...Array.from({length:34},(_,t)=>[t,t,t]),
  ...Array.from({length:3},(_,s)=>Array.from({length:7},(_,r)=>[s*9+r,s*9+r+1,s*9+r+2])).flat(),
];
function normal(c: number[], needed: number): { blocks: Block[]; pair: Tile }[] {
  const out: {blocks:Block[];pair:Tile}[]=[];
  for(let pair=0;pair<34;pair++) {
    if((c[pair]??0)<2)continue; c[pair]=(c[pair]??0)-2;
    const visit=(blocks:Block[]):void=>{
      const t=c.findIndex(n=>n>0);
      if(t<0){if(blocks.length===needed)out.push({blocks:[...blocks],pair});return;}
      if(blocks.length>=needed)return;
      if((c[t]??0)>=3){c[t]=(c[t]??0)-3;visit([...blocks,{kind:'triplet',tile:t,open:false}]);c[t]=(c[t]??0)+3;}
      if(t<27&&rank(t)<=7&&(c[t+1]??0)>0&&(c[t+2]??0)>0){
        for(const n of [t,t+1,t+2])c[n]=(c[n]??0)-1;
        visit([...blocks,{kind:'sequence',tile:t,open:false}]);
        for(const n of [t,t+1,t+2])c[n]=(c[n]??0)+1;
      }
    };
    visit([]);c[pair]=(c[pair]??0)+2;
  }
  return out;
}
export function decompose(hand: Hand, context: RuleContext): Decomposition[] {
  if(validateTiles(hand,context,14).length)return [];
  const c=counts(hand.concealed); const melds=hand.melds??[];
  const fixed:Block[]=melds.map((m,i)=>({kind:m.kind==='chi'?'sequence':m.kind==='pon'?'triplet':'quad',tile:Math.min(...m.tiles),open:m.kind!=='ankan',meldIndex:i}));
  const forms=context.policies.forms, result:Decomposition[]=[];
  if(forms.includes('normal')) for(const n of normal(c,4-fixed.length))result.push({form:'normal',blocks:[...n.blocks,...fixed],pair:n.pair,specialTiles:[]});
  if(melds.length)return result;
  if(forms.includes('seven-pairs')&&c.filter(n=>n===2).length===7)result.push({form:'seven-pairs',blocks:[],pair:null,specialTiles:[...hand.concealed]});
  if(forms.includes('orphans')&&ORPHANS.every(t=>(c[t]??0)>0)&&ORPHANS.some(t=>c[t]===2))result.push({form:'orphans',blocks:[],pair:c.findIndex(n=>n===2),specialTiles:[...hand.concealed]});
  if(forms.includes('knitted'))for(const knit of KNITTED){
    if(!knit.every(t=>(c[t]??0)>0))continue; const rest=[...c];for(const t of knit)rest[t]=(rest[t]??0)-1;
    for(const n of normal(rest,1))result.push({form:'knitted',blocks:n.blocks,pair:n.pair,specialTiles:knit});
  }
  if(forms.includes('seven-stars')&&c.slice(27).every(n=>n===1)&&c.every(n=>n<=1))for(const knit of KNITTED){
    if(hand.concealed.filter(t=>t<27).every(t=>knit.includes(t)))result.push({form:'seven-stars',blocks:[],pair:null,specialTiles:[...hand.concealed]});
  }
  if(forms.includes('unrelated')&&c.filter(n=>n===2).length===1&&c.every(n=>n<=2)){
    const distinct=c.flatMap((n,t)=>n?[t]:[]);
    if(distinct.length===13&&distinct.every((a,i)=>distinct.slice(i+1).every(b=>a>=27||b>=27||suit(a)!==suit(b)||Math.abs(rank(a)-rank(b))>=3)))result.push({form:'unrelated',blocks:[],pair:c.findIndex(n=>n===2),specialTiles:[...hand.concealed]});
  }
  return result;
}
export function placements(d: Decomposition, tile: Tile, context: RuleContext): Placement[] {
  if(!context.policies.forms.includes(d.form))return [];
  if(['seven-pairs','orphans','seven-stars','unrelated'].includes(d.form))return [{wait:d.form==='seven-pairs'?'tanki':'special',blockIndex:null,pair:d.form==='seven-pairs'||d.pair===tile}];
  const out:Placement[]=[];
  if(d.pair===tile)out.push({wait:'tanki',blockIndex:null,pair:true});
  d.blocks.forEach((b,i)=>{
    if(b.meldIndex!==undefined)return;
    if(b.kind!=='sequence'){if(b.tile===tile)out.push({wait:'shanpon',blockIndex:i,pair:false});return;}
    if(tile<b.tile||tile>b.tile+2)return;
    out.push({wait:tile===b.tile+1?'kanchan':rank(b.tile)===1&&tile===b.tile+2||rank(b.tile)===7&&tile===b.tile?'penchan':'ryanmen',blockIndex:i,pair:false});
  });
  if(d.specialTiles.includes(tile))out.push({wait:'special',blockIndex:null,pair:false});
  return out;
}
