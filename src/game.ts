import type { Hand, Liability, Meld, Player, RuleContext, ScoreResult, Situation, Tile, Transfer, YakuMatch } from './types.js';
import { closed, counts, terminalHonor, validateTiles, rank, suit } from './tiles.js';
import { decompose } from './shapes.js';
import { evaluateWin, isTenpai, structuralWaits } from './engine.js';
import { calculateScore } from './score.js';
export function canRiichi(hand:Hand,context:RuleContext,liveTiles:number,open=false,ownDiscards:readonly Tile[]=[]):{allowed:boolean;reasons:string[];ruleIds:string[]}{
  const reasons:string[]=[];
  if(!closed(hand))reasons.push('멘젠 필요');
  if(!isTenpai(hand,context))reasons.push('텐파이 필요');
  if(liveTiles<1)reasons.push('패산1장 이상 필요');
  if(open&&!context.policies.openRiichi)reasons.push('오픈리치 비활성');
  if(open&&structuralWaits(hand,context).some(w=>ownDiscards.includes(w.tile)))reasons.push('프리텐 오픈리치 불가');
  return {allowed:!reasons.length,reasons,ruleIds:[context.definitions['riichi.declaration']?'riichi.declaration':'riichi.policy']};
}
export function canRiichiAnkan(before:Hand,drawn:Tile,context:RuleContext):{allowed:boolean;reason:string}{
  if(before.concealed.filter(t=>t===drawn).length!==3)return {allowed:false,reason:'이번 쯔모패와 기존 안커가 필요'};
  const after:Hand={concealed:before.concealed.filter(t=>t!==drawn),melds:[...(before.melds??[]),{kind:'ankan',tiles:[drawn,drawn,drawn,drawn]}]};
  const oldWaits=structuralWaits(before,context),newWaits=structuralWaits(after,context);
  if(oldWaits.map(w=>w.tile).join()!==newWaits.map(w=>w.tile).join())return {allowed:false,reason:'대기패 변경'};
  for(const w of oldWaits){
    const decompositions=decompose({...before,concealed:[...before.concealed,w.tile]},context);
    if(decompositions.some(d=>d.form!=='normal'||!d.blocks.some(b=>b.kind==='triplet'&&b.tile===drawn&&b.meldIndex===undefined)))return {allowed:false,reason:'유효한 분해 중 안커가 아닌 사용 존재'};
  }
  return {allowed:oldWaits.length>0,reason:oldWaits.length?'대기 및 모든 분해 보존':'텐파이 아님'};
}
/** melds must be in declaration order, including concealed kans. */
export function inferLiability(hand:Hand,matches:readonly YakuMatch[],context:RuleContext,unseenDiscardKan=false):Liability[]{
  const result:Liability[]=[];
  const patterns:Record<string,(m:Meld)=>boolean>={
    'yaku.daisangen':m=>(m.tiles[0]??-1)>=31,
    'yaku.daisuushii':m=>(m.tiles[0]??-1)>=27&&(m.tiles[0]??99)<31,
    'yaku.suukantsu':m=>['ankan','daiminkan','kakan'].includes(m.kind),
    'yaku.flower-bird-wind-moon':()=>true,'yaku.wind-flower-snow-moon':()=>true,'yaku.suurenkou':()=>true,
  };
  for(const match of matches){
    const check=patterns[match.ruleId];if(!check||!context.policies.paoYaku.includes(match.ruleId)||!match.yakuman)continue;
    const needed=match.ruleId==='yaku.daisangen'?3:4;
    const melds=(hand.melds??[]).filter(m=>m.kind!=='chi'&&check(m));
    const last=melds[needed-1];if(melds.length!==needed||!last||last.kind==='ankan'||last.from===undefined)continue;
    if(match.ruleId==='yaku.suukantsu'&&context.definitions['penalty.pao']&&(!unseenDiscardKan||last.kind!=='daiminkan'))continue;
    result.push({ruleId:match.ruleId,player:last.from,multiplier:match.yakuman});
  }
  return result;
}
export function settleNoten(tenpai:readonly Player[],context:RuleContext):Transfer[]{
  if(new Set(tenpai).size!==tenpai.length||tenpai.some(p=>![0,1,2,3].includes(p)))throw new Error('텐파이 플레이어 오류');
  if(!tenpai.length||tenpai.length===4)return [];
  const rule=context.definitions['draw.noten']?'draw.noten':'draw.exhaustive';
  const each=3000n/BigInt(tenpai.length)/BigInt(4-tenpai.length);const result:Transfer[]=[];
  for(const from of [0,1,2,3] as const)if(!tenpai.includes(from))for(const to of tenpai)result.push({from,to,points:each,reason:'noten',ruleId:rule});
  return result;
}
export function settleNagashi(players:readonly {player:Player;discards:readonly Tile[];anyClaimed:boolean}[],dealer:Player,context:RuleContext,honba=0):{scores:ScoreResult[];dealerContinues:boolean}{
  if(!context.definitions['yaku.nagashi']?.enabled)throw new Error('유국만관 비활성');
  const winners=players.filter(p=>p.discards.length>0&&!p.anyClaimed&&p.discards.every(terminalHonor));
  if(new Set(winners.map(p=>p.player)).size!==winners.length)throw new Error('중복 플레이어');
  return {scores:winners.map(w=>calculateScore({winner:w.player,dealer,method:'tsumo',han:5,fu:30,honba},context)),dealerContinues:winners.some(w=>w.player===dealer)};
}
export function settleFinePool(pool:bigint,winners:readonly Player[],discarder:Player|undefined,context:RuleContext):{transfers:Transfer[];carried:bigint}{
  if(!context.definitions['penalty.fine'])throw new Error('이 규칙에 마마모 벌금 없음');
  if(pool<0n)throw new Error('음수 벌금');if(!winners.length)return {transfers:[],carried:pool};
  if(winners.length>1&&discarder===undefined)throw new Error('복수론 방총자 필요');
  const first=[...winners].sort((a,b)=>discarder===undefined?0:(a-discarder+4)%4-(b-discarder+4)%4)[0];
  if(first===undefined)throw new Error('화료자 없음');
  return {transfers:pool?[{from:'pool',to:first,points:pool,reason:'fine',ruleId:'penalty.fine'}]:[],carried:0n};
}
export interface Problem { ruleSet:RuleContext['ruleSet']; profileHash:string; mode:'discard'|'wait'|'score'; hand:Hand; situation?:Situation }
export function validateProblem(problem:Problem,context:RuleContext):{valid:boolean;errors:string[]}{
  const errors:string[]=[];if(problem.ruleSet!==context.ruleSet)errors.push('규칙 세트 불일치');if(problem.profileHash!==context.profileHash)errors.push('프로필 버전 불일치');
  const count=problem.hand.concealed.length+(problem.hand.melds?.length??0)*3;
  if(count!==(problem.mode==='wait'?13:14))errors.push('문제 패 수 오류');
  if(problem.mode==='score'&&!problem.situation)errors.push('점수 문제의 화료 상황 필요');
  errors.push(...validateTiles(problem.hand,context,problem.mode==='wait'?13:14));
  if(!errors.length&&problem.mode==='wait'&&!isTenpai(problem.hand,context))errors.push('대기 문제인데 텐파이가 아님');
  if(!errors.length&&problem.mode==='score'&&problem.situation&&!evaluateWin(problem.hand,problem.situation,context).canWin)errors.push('화료 점수 문제의 화료 조건 불충족');
  return {valid:!errors.length,errors};
}
export function forbiddenKuikae(meld:Meld,claimed:Tile,context:RuleContext):Tile[]{
  if(!context.definitions['call.actions']&&!context.definitions['call.chi'])throw new Error('부름 정책 없음');
  if(meld.kind!=='chi'&&meld.kind!=='pon')return [];
  if(!meld.tiles.includes(claimed))throw new Error('받은 패가 세트에 없음');
  const result=[claimed];
  if(meld.kind==='chi'){
    const low=Math.min(...meld.tiles),high=low+2;
    if(claimed===low&&rank(high)<9)result.push(high+1);
    if(claimed===high&&rank(low)>1)result.push(low-1);
  }
  return result;
}
export function legalDiscardCalls(hand:Hand,discard:Tile,actor:Player,from:Player,context:RuleContext,liveTiles:number,riichi=false):Meld[]{
  if(validateTiles(hand,context,13).length)throw new Error('부름 손패 오류');
  if(!Number.isInteger(discard)||discard<0||discard>33)throw new Error('버림패 오류');
  if(actor===from||riichi||liveTiles<1||(hand.melds?.length??0)>=4)return [];
  const c=counts(hand.concealed),result:Meld[]=[];
  if((c[discard]??0)>=2)result.push({kind:'pon',tiles:[discard,discard,discard],from,claimedTile:discard});
  if((c[discard]??0)>=3)result.push({kind:'daiminkan',tiles:[discard,discard,discard,discard],from,claimedTile:discard});
  if(from===(actor+3)%4&&discard<27)for(let start=discard-2;start<=discard;start++){
    if(start<0||suit(start)!==suit(discard)||rank(start)>7)continue;
    const need=[start,start+1,start+2].filter(t=>t!==discard);
    if(need.every(t=>(c[t]??0)>0))result.push({kind:'chi',tiles:[start,start+1,start+2],from,claimedTile:discard});
  }
  return result.filter(m=>{
    const physical=[...hand.concealed,discard,...(hand.melds??[]).flatMap(m=>[...m.tiles])];if(counts(physical).some(n=>n>4))return false;
    if(m.kind==='daiminkan')return true;
    const remaining=[...hand.concealed],needed=[...m.tiles];needed.splice(needed.indexOf(discard),1);for(const t of needed)remaining.splice(remaining.indexOf(t),1);
    return remaining.some(t=>!forbiddenKuikae(m,discard,context).includes(t));
  });
}
export function settleChombo(offenders:readonly Player[],dealer:Player,context:RuleContext,currentRiichiBets:Partial<Record<Player,number>>={},currentFines:Partial<Record<Player,bigint>>={}):{transfers:Transfer[];redeal:true;honbaIncrement:0}{
  const d=context.definitions['penalty.chombo'];if(!d)throw new Error('촌보 정책 없음');
  if(new Set(offenders).size!==offenders.length||offenders.some(p=>![0,1,2,3].includes(p)))throw new Error('반칙자 오류');
  const c=d.conditions;const value=(name:string):bigint=>{const v=c[name];if(typeof v!=='number'||!Number.isInteger(v))throw new Error(`촌보 값 없음:${name}`);return BigInt(v);};
  const transfers:Transfer[]=[];
  for(const from of offenders)for(const to of [0,1,2,3] as const)if(from!==to){
    const points=typeof c.perOpponent==='number'?value('perOpponent'):from===dealer?value('dealerOffenderPaysEach'):to===dealer?value('childOffenderPaysDealer'):value('childOffenderPaysOtherEach');
    transfers.push({from,to,points,reason:'chombo',ruleId:d.id});
  }
  for(const to of [0,1,2,3] as const){
    const bets=currentRiichiBets[to]??0;if(!Number.isInteger(bets)||bets<0)throw new Error('현재국 리치 공탁 오류');
    if(bets)transfers.push({from:'pool',to,points:BigInt(bets)*BigInt(context.policies.deposit),reason:'riichi-refund',ruleId:d.id});
    if(c.returnCurrentHandFines===true){const fine=currentFines[to]??0n;if(fine<0n)throw new Error('음수 벌금');if(fine)transfers.push({from:'pool',to,points:fine,reason:'fine-refund',ruleId:d.id});}
  }
  return {transfers,redeal:true,honbaIncrement:0};
}
