import type { Limit, Player, RuleContext, ScoreInput, ScoreResult, Transfer } from './types.js';
const PLAYERS: readonly Player[] = [0,1,2,3];
export function ceil100(value: bigint): bigint { if(value<0n)throw new Error('음수 점수');return ((value+99n)/100n)*100n; }
function nonnegative(value:number,name:string):void {if(!Number.isSafeInteger(value)||value<0)throw new Error(`잘못된 ${name}`);}
export function calculateScore(input:ScoreInput, context:RuleContext):ScoreResult {
  for(const [name,n] of Object.entries({han:input.han,fu:input.fu,yakuman:input.yakuman??0,honba:input.honba??0,riichiSticks:input.riichiSticks??0}))nonnegative(n,name);
  if(!PLAYERS.includes(input.winner)||!PLAYERS.includes(input.dealer))throw new Error('잘못된 플레이어');
  if(input.method==='ron'&&(input.discarder===undefined||!PLAYERS.includes(input.discarder)||input.discarder===input.winner))throw new Error('론 방총자 필요');
  if(input.method!=='ron'&&input.method!=='tsumo')throw new Error('잘못된 화료 방법');
  if(input.fixedLimit!==undefined&&input.fixedLimit!==null&&!['none','mangan','haneman','baiman','sanbaiman','yakuman'].includes(input.fixedLimit))throw new Error('잘못된 점수 한도');
  const p=context.policies;let base=0n,limit:Limit='none';
  const yakuman=input.yakuman??0;
  if(yakuman>0){base=8000n*BigInt(p.multipleYakuman?yakuman:1);limit='yakuman';}
  else if(input.fixedLimit&&input.fixedLimit!=='none'){
    limit=input.fixedLimit;base=({mangan:2000n,haneman:3000n,baiman:4000n,sanbaiman:6000n,yakuman:8000n})[limit];
  }else if(input.han>=13&&p.kazoe){base=8000n;limit='yakuman';}
  else if(input.han>=11){base=6000n;limit='sanbaiman';}
  else if(input.han>=8){base=4000n;limit='baiman';}
  else if(input.han>=6){base=3000n;limit='haneman';}
  else if(input.han===5){base=2000n;limit='mangan';}
  else{
    if(input.han<1||input.fu<20)throw new Error('최소 1판 및 20부 필요');
    base=BigInt(input.fu)*(1n<<BigInt(input.han+2));
    if(base>=2000n||(p.kiriage&&base>1900n)){base=2000n;limit='mangan';}
  }
  const scoreRule=context.definitions['score.formula']?'score.formula':'score.table';
  const paoRule=context.definitions['score.pao']?'score.pao':'penalty.pao';
  const transfers:Transfer[]=[],rounding: {unrounded:bigint;rounded:bigint;factor:bigint}[]=[];
  const transfer=(from:Player|'pool',points:bigint,reason:string,ruleId=scoreRule):void=>{if(points)transfers.push({from,to:input.winner,points,reason,ruleId});};
  const payment=(from:Player,amount:bigint,factor:bigint):void=>{const unrounded=amount*factor,rounded=ceil100(unrounded);rounding.push({unrounded,rounded,factor});transfer(from,rounded,'hand');};
  const liabilities=input.liabilities??[];
  const seen=new Set<string>();let liabilityBase=0n;
  for(const l of liabilities){
    if(!p.paoYaku.includes(l.ruleId)||seen.has(l.ruleId)||!PLAYERS.includes(l.player)||l.player===input.winner||!Number.isInteger(l.multiplier)||l.multiplier<1)throw new Error('잘못된 책임지불');
    seen.add(l.ruleId);if(yakuman<1)throw new Error('역만 없는 책임지불');
    const portion=8000n*BigInt(p.multipleYakuman?l.multiplier:1);liabilityBase+=portion;
    const total=portion*(input.winner===input.dealer?6n:4n);
    if(input.method==='tsumo'||l.player===input.discarder)transfer(l.player,total,'pao',paoRule);
    else {if(input.discarder===undefined)throw new Error('방총자 없음');transfer(l.player,total/2n,'pao',paoRule);transfer(input.discarder,total/2n,'pao',paoRule);}
  }
  if(liabilityBase>base)throw new Error('책임 역만 배수가 전체 배수를 초과');
  const remaining=base-liabilityBase;
  if(input.method==='ron'){if(input.discarder===undefined)throw new Error('방총자 없음');payment(input.discarder,remaining,input.winner===input.dealer?6n:4n);}
  else for(const player of PLAYERS)if(player!==input.winner)payment(player,remaining,input.winner===input.dealer||player===input.dealer?2n:1n);
  const handPayments=transfers.reduce((sum,t)=>sum+t.points,0n);
  const honba=BigInt(input.honba??0);
  if(input.method==='ron'){if(input.discarder===undefined)throw new Error('방총자 없음');transfer(input.discarder,honba*BigInt(p.honbaRon),'honba');}
  else if(new Set(liabilities.map(l=>l.player)).size===1&&liabilities[0])transfer(liabilities[0].player,honba*BigInt(p.honbaTsumo)*3n,'honba',paoRule);
  else for(const player of PLAYERS)if(player!==input.winner)transfer(player,honba*BigInt(p.honbaTsumo),'honba');
  const honbaPayments=transfers.filter(t=>t.reason==='honba').reduce((s,t)=>s+t.points,0n);
  const depositPayments=BigInt(input.riichiSticks??0)*BigInt(p.deposit);transfer('pool',depositPayments,'riichi');
  for(const t of input.additions??[]){if(typeof t.points!=='bigint'||t.points<0n||(t.from!=='pool'&&!PLAYERS.includes(t.from))||t.from===t.to||t.to!==input.winner)throw new Error('추가 송금 형식 오류');transfers.push(t);}
  const opponentPayments:Record<Player,bigint>={0:0n,1:0n,2:0n,3:0n};
  for(const t of transfers)if(t.from!=='pool')opponentPayments[t.from]+=t.points;
  const totalGain=transfers.reduce((sum,t)=>sum+t.points,0n);
  const additionalPayments=totalGain-handPayments-honbaPayments-depositPayments;
  return {ruleSet:context.ruleSet,base,limit,transfers,opponentPayments,totalGain,handPayments,honbaPayments,depositPayments,additionalPayments,rounding,balanced:totalGain===Object.values(opponentPayments).reduce((a,b)=>a+b,0n)+transfers.filter(t=>t.from==='pool').reduce((a,t)=>a+t.points,0n),ruleIds:[scoreRule,...(liabilities.length?[paoRule]:[])]};
}
export interface MultipleRonInput { wins: readonly ScoreInput[]; discarder:Player; honba:number; riichiSticks:number; currentRiichiBets?:Partial<Record<Player,number>>; finePool?:bigint }
export function settleMultipleRon(input:MultipleRonInput,context:RuleContext):{abortive:boolean;scores:ScoreResult[];carriedRiichiSticks:number;carriedFines:bigint}{
  nonnegative(input.honba,'본장');nonnegative(input.riichiSticks,'리치봉');
  if(!PLAYERS.includes(input.discarder))throw new Error('잘못된 방총자');
  if(input.finePool!==undefined&&(typeof input.finePool!=='bigint'||input.finePool<0n))throw new Error('잘못된 벌금 풀');
  if(input.wins.length<1||input.wins.length>3||new Set(input.wins.map(w=>w.winner)).size!==input.wins.length)throw new Error('복수 화료자 오류');
  if(input.wins.some(w=>w.method!=='ron'||!PLAYERS.includes(w.winner)||!PLAYERS.includes(w.dealer)||w.winner===input.discarder||w.dealer!==input.wins[0]?.dealer))throw new Error('복수론 입력 오류');
  if(input.wins.length===3&&context.policies.tripleRon==='abortive_draw')return {abortive:true,scores:[],carriedRiichiSticks:input.riichiSticks,carriedFines:input.finePool??0n};
  const sorted=[...input.wins].sort((a,b)=>(a.winner-input.discarder+4)%4-(b.winner-input.discarder+4)%4);
  const refunds=new Map<Player,number>();let left=input.riichiSticks;
  if(context.policies.multipleRonHonba==='each')for(const w of sorted){const bet=input.currentRiichiBets?.[w.winner]??0;nonnegative(bet,'현재국 리치봉');refunds.set(w.winner,bet);left-=bet;}
  if(left<0)throw new Error('리치 공탁 부족');
  const scores=sorted.map((w,i)=>calculateScore({...w,discarder:input.discarder,honba:context.policies.multipleRonHonba==='each'||i===0?input.honba:0,riichiSticks:(refunds.get(w.winner)??0)+(i===0?left:0),additions:[...(w.additions??[]),...(i===0&&input.finePool?[{from:'pool' as const,to:w.winner,points:input.finePool,reason:'fine',ruleId:'penalty.fine'}]:[])]},context));
  return {abortive:false,scores,carriedRiichiSticks:0,carriedFines:0n};
}
