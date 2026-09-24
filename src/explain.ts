import type { RuleContext, WinResult } from './types.js';
export function explainWin(result:WinResult,context:RuleContext):string[]{
  if(result.ruleSet!==context.ruleSet)throw new Error('해설 규칙 세트 불일치');
  const lines=[`규칙: ${context.ruleSet}`,result.valid?'패 구성 유효':'패 구성 오류',...result.errors];
  if(!result.canWin)return [...lines,'현재 조건에서는 화료할 수 없습니다.',...result.reasons];
  for(const c of result.best){
    lines.push(`화료형: ${c.decomposition.form}, 대기: ${c.placement.wait}`);
    lines.push(...c.yaku.recognized.map(y=>`${y.name}: ${y.yakuman?`${y.yakuman}배 역만`:`${y.han}판`} (${y.ruleId})`));
    lines.push(`도라 ${c.yaku.dora}판, ${c.fu.rounded}부`,...c.fu.entries.map(e=>`${e.kind}: ${e.fu}부`));
    lines.push(`총 획득 ${c.score.totalGain}점`,...c.score.transfers.map(t=>`${t.from} → ${t.to}: ${t.points}점 (${t.reason})`));
  }
  return lines;
}
