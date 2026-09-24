import {
  analyzeDiscards, evaluateWin, explainWin, loadRuleSet, parseTiles,
  serializeTiles, structuralWaits,
} from '../dist/index.js';

for (const id of ['standard-riichi', 'mamamo']) {
  const rules = loadRuleSet(id);
  const hand = text => ({ concealed: parseTiles(text, rules) });
  const best = analyzeDiscards(hand('123456789m12345p'), rules).filter(r => r.optimal);
  console.log(`\n[${id}] 최적 타패: ${best.map(r => serializeTiles([r.discard], rules)).join(', ')}`);
  console.log(`샹텐 ${best[0].shanten}, 유효패 ${best[0].total}장`);
  const waits = structuralWaits(hand('1112345678999m'), rules);
  console.log(`청일색 대기: ${serializeTiles(waits.map(w => w.tile), rules)}`);
  const result = evaluateWin(hand('123m456p789s11122z'), {
    winner: 1, dealer: 0, seatWind: 28, roundWind: 27,
    method: 'ron', discarder: 2, winningTile: 28,
  }, rules);
  if (!result.canWin) throw new Error('예제 화료 실패');
  console.log(explainWin(result, rules).join('\n'));
}
