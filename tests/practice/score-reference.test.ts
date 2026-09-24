import { describe, expect, it } from 'vitest';
import { buildScoreReference } from '../../src/practice/score-reference.js';
import { mamamo, standard } from '../helpers.js';

for (const context of [standard,mamamo]) describe(`${context.ruleSet} score reference`, () => {
  it('shows non-dealer ron and per-player tsumo payments including the corrected 50-fu order', () => {
    const table = buildScoreReference(context,false);
    expect(table.rows.find(r => r.fu === 30)?.cells[0]).toEqual({ron:1000n,tsumoEach:300n,tsumoDealer:500n,limit:'none'});
    expect(table.rows.find(r => r.fu === 50)?.cells[1]).toEqual({ron:3200n,tsumoEach:800n,tsumoDealer:1600n,limit:'none'});
    expect(table.rows.find(r => r.fu === 25)?.cells[1]?.ron).toBe(1600n);
    expect(table.rows.find(r => r.fu === 20)?.cells[1]?.tsumoDealer).toBe(700n);
  });
  it('shows dealer payments without inventing a separate dealer payer', () => {
    const table = buildScoreReference(context,true);
    expect(table.rows.find(r => r.fu === 30)?.cells[0]).toEqual({ron:1500n,tsumoEach:500n,tsumoDealer:null,limit:'none'});
    expect(table.rows.find(r => r.fu === 30)?.cells[3]).toEqual(context.ruleSet === 'standard-riichi' ? {ron:12000n,tsumoEach:4000n,tsumoDealer:null,limit:'mangan'} : {ron:11600n,tsumoEach:3900n,tsumoDealer:null,limit:'none'});
  });
  it('keeps rounded payments, mangan caps and all large limits distinct', () => {
    const table = buildScoreReference(context,false);
    expect(table.rows.map(r=>r.fu)).toEqual([20,25,30,40,50,60,70,80,90,100,110]);
    expect(table.rows.every(r=>r.cells.length===4)).toBe(true);
    expect(table.rows.find(r=>r.fu===30)?.cells[3]?.ron).toBe(context.ruleSet === 'standard-riichi' ? 8000n : 7700n);
    expect(table.rows.find(r=>r.fu===40)?.cells[3]?.ron).toBe(8000n);
    expect(table.rows.find(r=>r.fu===110)?.cells[0]?.ron).toBe(3600n);
    expect(table.limits.map(r=>r.cell.ron)).toEqual([8000n,12000n,16000n,24000n,context.ruleSet === 'standard-riichi' ? 24000n : 32000n,32000n]);
    expect(buildScoreReference(context,true).limits.map(r=>r.cell.tsumoEach)).toEqual([4000n,6000n,8000n,12000n,context.ruleSet === 'standard-riichi' ? 12000n : 16000n,16000n]);
  });
  it('provides additive rules separately from zero-honba zero-deposit amounts', () => {
    const table = buildScoreReference(context,false);
    expect([table.honbaRon,table.honbaTsumo,table.deposit]).toEqual([300,100,1000]);
    expect(table.kiriage).toBe(context.ruleSet === 'standard-riichi'); expect(table.kazoe).toBe(context.ruleSet === 'mamamo');
  });
});
it('derives policy-dependent values and labels from the supplied context', () => {
  const table = buildScoreReference({...standard,policies:{...standard.policies,kiriage:true,kazoe:false,honbaRon:600,honbaTsumo:200,deposit:2000}},false);
  expect(table.rows.find(r=>r.fu===30)?.cells[3]?.ron).toBe(8000n);
  expect(table.limits[4]?.label).toContain('삼배만');
  expect(table.limits[4]?.cell.ron).toBe(24000n);
  expect(table.limits[5]?.cell.ron).toBe(32000n);
  expect([table.honbaRon,table.honbaTsumo,table.deposit]).toEqual([600,200,2000]);
});

