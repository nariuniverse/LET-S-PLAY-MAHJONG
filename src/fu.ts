import type { Decomposition, FuEntry, FuResult, Hand, Placement, RuleContext, Situation, YakuResult } from './types.js';
import { closed, terminalHonor } from './tiles.js';
export function calculateFu(hand:Hand,d:Decomposition,p:Placement,s:Situation,yaku:YakuResult,context:RuleContext):FuResult {
  if(!context.policies.forms.includes(d.form))throw new Error('이 규칙에 없는 화료형');
  const rule=context.definitions['fu.policy']?'fu.policy':'fu.base';const entries:FuEntry[]=[];
  const fixed=(fu:number,ruleId:string,note:string):FuResult=>({entries:[{kind:'fixed',fu,ruleId}],beforeRounding:fu,rounded:fu,fixed:true,exceptions:[note]});
  if(d.form==='seven-pairs')return fixed(25,'yaku.chiitoitsu','치또이25부; 판수50부 환산 미적용');
  if(d.form==='seven-stars')return fixed(40,'yaku.seven-stars','칠성불고40부');
  if(d.form==='orphans'||d.form==='unrelated')return fixed(0,`yaku.${d.form==='orphans'?'kokushi':'thirteen-unrelated'}`,'역만 특수형은 부 불필요');
  const pinfu=yaku.recognized.some(m=>m.ruleId==='yaku.pinfu');
  if(pinfu)return fixed(s.method==='tsumo'?context.policies.pinfuTsumo:context.policies.pinfuRon,'yaku.pinfu','핑후 쯔모부 예외');
  const add=(kind:string,fu:number,extra:Partial<FuEntry>={}):void=>{
    const ruleId=context.definitions['fu.policy']?rule:kind==='base'||kind==='closed-ron'?'fu.base':kind==='tsumo'?'fu.tsumo':kind==='pair'||kind.startsWith('wait')?'fu.pair-wait':'fu.sets';
    entries.push({kind,fu,ruleId,...extra});
  };
  add('base',20);if(closed(hand)&&s.method==='ron')add('closed-ron',10);
  if(s.method==='tsumo')add('tsumo',2);
  const pair=d.pair;
  if(pair!==null){let fu=0;if(pair>=31)fu=2;else if(pair===s.seatWind&&pair===s.roundWind)fu=context.policies.doubleWindPair;else if(pair===s.seatWind||pair===s.roundWind)fu=2;add('pair',fu,{tile:pair});}
  add(`wait-${p.wait}`,['tanki','kanchan','penchan'].includes(p.wait)?2:0);
  d.blocks.forEach((b,i)=>{
    const open=b.open||s.method==='ron'&&p.blockIndex===i&&b.kind==='triplet';
    let fu=b.kind==='sequence'?0:b.kind==='triplet'?2:8;
    if(!open)fu*=2;if(terminalHonor(b.tile))fu*=2;
    add(`${b.kind}-${terminalHonor(b.tile)?'terminal-honor':'simple'}`,fu,{tile:b.tile,open});
  });
  if(d.form==='knitted')add('knitted-nine',0,{ruleId:'yaku.knitted-straight'});
  let raw=entries.reduce((n,e)=>n+e.fu,0);const exceptions:string[]=[];
  if(!closed(hand)&&raw===20&&context.definitions['fu.policy']){add('open-20-adjustment',2);raw+=2;exceptions.push('오픈20부형2부 가산');}
  let rounded=Math.ceil(raw/10)*10;if(!closed(hand)&&rounded<30){rounded=30;exceptions.push('오픈 최소30부');}
  return {entries,beforeRounding:raw,rounded,fixed:false,exceptions};
}
