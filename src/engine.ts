import type { Candidate, Decomposition, FuritenResult, Hand, RuleContext, ScoreInput, Situation, Tile, WinResult } from './types.js';
import { allTiles, closed, counts, effectiveSize, validateTiles } from './tiles.js';
import { decompose, placements } from './shapes.js';
import { evaluateYaku } from './yaku.js';
import { calculateFu } from './fu.js';
import { calculateScore } from './score.js';
export interface StructuralWait { tile:Tile; remaining:number; exhausted:boolean; decompositions:readonly Decomposition[] }
export function structuralWaits(hand:Hand,context:RuleContext,knownOutside:readonly Tile[]=[]):StructuralWait[]{
  const errors=validateTiles(hand,context,13);if(errors.length)throw new Error(errors.join(', '));
  const own=counts(allTiles(hand)),visible=counts([...allTiles(hand),...knownOutside]);if(visible.some(n=>n>4))throw new Error('패 중복 집계');
  const result:StructuralWait[]=[];
  for(let tile=0;tile<34;tile++){
    if((own[tile]??0)>=4)continue;
    const decompositions=decompose({...hand,concealed:[...hand.concealed,tile]},context);
    if(decompositions.length){const remaining=4-(visible[tile]??0);result.push({tile,remaining,exhausted:remaining===0,decompositions});}
  }
  return result;
}
export function evaluateFuriten(waits:readonly Tile[],state:Pick<Situation,'ownDiscards'|'temporaryFuriten'|'riichiFuriten'>,context:RuleContext):FuritenResult{
  const discard=waits.some(t=>(state.ownDiscards??[]).includes(t)),temporary=state.temporaryFuriten===true,permanent=state.riichiFuriten===true;
  return {discard,temporary,permanent,ronAllowed:!(discard||temporary||permanent),tsumoAllowed:true,ruleIds:context.definitions['furiten.policy']?['furiten.policy']:['furiten.discard','furiten.temporary','furiten.riichi']};
}
export type FuritenEvent = 'pass-win' | 'own-draw' | 'own-call' | 'other-call' | 'end-hand';
export function transitionFuriten(state:{temporary:boolean;permanent:boolean},event:FuritenEvent,riichi:boolean,context:RuleContext):{temporary:boolean;permanent:boolean}{
  if(!context.definitions['furiten.policy']&&!context.definitions['furiten.temporary'])throw new Error('프리텐 정책 없음');
  if(event==='end-hand')return {temporary:false,permanent:false};
  if(event==='pass-win')return {temporary:true,permanent:state.permanent||riichi};
  if(event==='own-draw'||event==='own-call')return {...state,temporary:false};
  return {...state};
}
function situationErrors(hand:Hand,s:Situation,context:RuleContext):string[]{
  const errors=validateTiles(hand,context,14);
  if(s.deadHand)errors.push('화료불가 상태');
  if(!hand.concealed.includes(s.winningTile))errors.push('화료패가 손패에 없음');
  if(![27,28,29,30].includes(s.seatWind)||![27,28,29,30].includes(s.roundWind))errors.push('잘못된 자풍/장풍');
  if(s.seatWind!==27+(s.winner-s.dealer+4)%4)errors.push('친/좌석과 자풍 불일치');
  if(s.riichi&&s.riichi!=='none'&&!closed(hand))errors.push('부로한 손 리치 불가');
  if(s.riichi==='open'&&!context.policies.openRiichi)errors.push('오픈리치 비활성');
  if(s.robKan&&s.method!=='ron')errors.push('창깡은 론');
  if(s.drawSource==='rinshan'&&s.method!=='tsumo')errors.push('영상개화는 쯔모');
  if(s.initialDeal&&s.method!=='tsumo')errors.push('배패 화료는 쯔모');
  if(s.ippatsu&&(!s.riichi||s.riichi==='none'))errors.push('일발에는 리치 필요');
  if(s.method==='ron'&&(s.discarder===undefined||s.discarder===s.winner))errors.push('잘못된 방총자');
  return errors;
}
function scoreInput(s:Situation,han:number,fu:number,yakuman:number,fixedLimit:ScoreInput['fixedLimit']):ScoreInput{
  return {winner:s.winner,dealer:s.dealer,method:s.method,han,fu,yakuman,fixedLimit:fixedLimit??null,
    ...(s.discarder===undefined?{}:{discarder:s.discarder}),honba:s.honba??0,riichiSticks:s.riichiSticks??0,
    liabilities:s.liabilities??[],additions:s.additions??[]};
}
export function evaluateWin(hand:Hand,s:Situation,context:RuleContext,precomputedWaits?:readonly Tile[]):WinResult{
  const errors=situationErrors(hand,s,context);
  const before=[...hand.concealed],index=before.indexOf(s.winningTile);if(index>=0)before.splice(index,1);
  const waits=precomputedWaits??(!errors.length?structuralWaits({...hand,concealed:before},context).map(w=>w.tile):[]);
  const furiten=evaluateFuriten(waits,s,context),decompositions=errors.length?[]:decompose(hand,context);
  const reasons:string[]=[...errors];if(!decompositions.length)reasons.push('유효한 완성 형태 없음');
  const candidates:Candidate[]=[];
  for(const d of decompositions)for(const p of placements(d,s.winningTile,context)){
    if(s.robKan==='concealed'&&d.form!=='orphans')continue;
    const situations=[s];
    if(s.beforeFirstOwnDraw&&context.policies.renhou==='exclusive_mangan')situations.push({...s,beforeFirstOwnDraw:false});
    for(const alternative of situations){
      const yaku=evaluateYaku(hand,d,p,alternative,context);
      const requiredShapeYaku = ({orphans:'yaku.kokushi',knitted:'yaku.knitted-straight','seven-stars':'yaku.seven-stars',unrelated:'yaku.thirteen-unrelated'} as Partial<Record<Decomposition['form'],string>>)[d.form];
      if(requiredShapeYaku&&!yaku.recognized.some(y=>y.ruleId===requiredShapeYaku)&&!yaku.excluded.some(y=>y.ruleId===requiredShapeYaku&&y.by!==undefined)){reasons.push('특수 화료형의 상황 조건 불충족');continue;}
      const minimum=context.policies.twoHanAfterDealerWins!==null&&(s.dealerConsecutiveWins??0)>=context.policies.twoHanAfterDealerWins?2:1;
      // Kazoe limits the score; dora still cannot supply the minimum yaku han.
      const shapeYakuman=yaku.recognized.some(y=>y.yakuman>0&&y.ruleId!=='yaku.kazoe');
      const qualifyingHan=yaku.recognized.reduce((sum,y)=>sum+y.han,0);
      if(!shapeYakuman&&!yaku.fixedLimit&&qualifyingHan<minimum){reasons.push(`도라 제외 ${minimum}판 조건 불충족`);continue;}
      const fu=calculateFu(hand,d,p,s,yaku,context);
      if(s.liabilities?.some(l=>!yaku.recognized.some(m=>m.ruleId===l.ruleId&&m.yakuman>=l.multiplier)))continue;
      const score=calculateScore(scoreInput(s,yaku.han+yaku.dora,fu.rounded,yaku.yakuman,yaku.fixedLimit),context);
      candidates.push({decomposition:d,placement:p,yaku,fu,score});
    }
  }
  if(s.method==='ron'&&!furiten.ronAllowed)reasons.push('프리텐으로 론 불가');
  const canWin=!errors.length&&candidates.length>0&&(s.method==='tsumo'||furiten.ronAllowed);
  let eligible=candidates;
  if(s.riichi==='open'&&!candidates.some(c=>c.yaku.yakuman>0)){
    const minFu=Math.min(...candidates.map(c=>c.fu.rounded));eligible=candidates.filter(c=>c.fu.rounded===minFu);
  }
  const max=eligible.reduce((n,c)=>c.score.totalGain>n?c.score.totalGain:n,0n);
  return {ruleSet:context.ruleSet,valid:!errors.length,errors,canWin,furiten,candidates,best:canWin?eligible.filter(c=>c.score.totalGain===max):[],decompositions,reasons:[...new Set(reasons)]};
}
export interface WaitResult extends StructuralWait { ron:boolean; tsumo:boolean; furiten:FuritenResult; ronResult:WinResult; tsumoResult:WinResult }
export function findWaits(hand:Hand,s:Omit<Situation,'method'|'winningTile'>,context:RuleContext,knownOutside:readonly Tile[]=[]):WaitResult[]{
  const waits=structuralWaits(hand,context,knownOutside),tiles=waits.map(w=>w.tile);
  return waits.map(w=>{
    const complete={...hand,concealed:[...hand.concealed,w.tile]};
    const ronResult=evaluateWin(complete,{...s,method:'ron',winningTile:w.tile},context,tiles);
    const tsumoResult=evaluateWin(complete,{...s,method:'tsumo',winningTile:w.tile},context,tiles);
    return {...w,ron:ronResult.canWin,tsumo:tsumoResult.canWin,furiten:ronResult.furiten,ronResult,tsumoResult};
  });
}
export function isTenpai(hand:Hand,context:RuleContext):boolean{return effectiveSize(hand)===13&&structuralWaits(hand,context).length>0;}
