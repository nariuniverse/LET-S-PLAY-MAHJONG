import { catalog } from './generated/catalog.js';
import type { Definition, Policies, RuleContext, RuleSetId, SourcePage } from './types.js';
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('규칙 객체 형식 오류');
  return value as Record<string, unknown>;
}
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw new Error('규칙 배열 형식 오류'); return value as unknown[]; }
function text(value: unknown): string { if (typeof value !== 'string') throw new Error('규칙 문자열 형식 오류'); return value; }
function numberOrNull(value: unknown): number | null { if (value === null || value === undefined) return null; if (typeof value !== 'number') throw new Error('규칙 숫자 형식 오류'); return value; }
function strings(value: unknown): string[] { return value === undefined ? [] : array(value).map(text); }
function optionalObject(value: unknown): Record<string, unknown> { return value === undefined ? {} : object(value); }
function pages(value: unknown): SourcePage[] { return array(value).map(v => { const p=object(v); const pdf=numberOrNull(p.pdf); if (pdf === null) throw new Error('출처 페이지 없음'); return { source:text(p.source), pdf, printed:p.printed === null ? null : text(p.printed) }; }); }
function freeze<T>(v: T): T { if (v && typeof v === 'object') { Object.freeze(v); for (const child of Object.values(v)) freeze(child); } return v; }
function applyApprovedResolutions(defs:Record<string,Definition>,approval:Record<string,unknown>):void {
  const r=object(approval.resolutions);
  const value=(id:string,key:string):unknown=>object(r[id])[key];
  const conditions=(id:string,values:Record<string,unknown>):void=>{const d=defs[id];if(!d)throw new Error(`승인 대상 규칙 없음: ${id}`);defs[id]={...d,conditions:{...d.conditions,...values}};};
  conditions('tiles.inventory',{copiesPerType:4,flowers:false});
  conditions('game.points',{returnPoints:30000});
  conditions('game.two-han-minimum',{afterOwnContinuations:value('B02','minimumHanAfterCompletedDealerWins'),appliesToPlayers:value('B02','appliesTo'),doraExcluded:value('B02','doraExcluded')});
  conditions('riichi.declaration',{liveTilesAtLeast:1,minimumPoints:'borrowing_allowed'});
  conditions('riichi.open',{deposit:1000});
  conditions('fu.base',{closedRonIncrement:10});
  conditions('fu.tsumo',{pinfuException:value('E03','pinfuTsumoFu')});
  conditions('fu.pair-wait',{doubleWindPair:2,minimum:30,rounding:10,wait:{tanki:2,kanchan:2,penchan:2,ryanmen:0,shanpon:0}});
  conditions('fu.sets',{ronCompletedTriplet:'open_for_fu_and_ankou_count_only'});
  conditions('yaku.chanta',{sequenceRequired:value('B01','chantaRequiresSequence'),honorRequired:value('B01','chantaRequiresHonor')});
  conditions('yaku.junchan',{sequenceRequired:value('B01','junchanRequiresSequence')});
  conditions('yaku.ryuuiisou',{greenDragonRequired:value('E01','greenDragonRequired')});
  conditions('yaku.red-dot',{redDragonRequired:value('E01','redDotRequiresRedDragon')});
  conditions('yaku.red-peacock',{redDragonRequired:value('E01','redPeacockRequiresRedDragon')});
  conditions('yaku.thirteen-unrelated',{exactSeparationDefinition:{minimumGap:value('E02','unrelatedDistinctSuitedRankMinimumGap'),exactlyOnePair:value('E02','unrelatedExactlyOnePair')}});
  conditions('yaku.north-south',{rolesSwappable:true});
  conditions('yaku.nagashi',{ownCallsAllowed:true});
  conditions('score.combination',{multipleYakumanStacking:value('E05','multipleYakuman'),ordinaryHanWithYakuman:value('E05','ordinaryHanAndDoraWithYakuman')});
  conditions('penalty.pao',{otherTriggers:value('E04','trigger'),exposedConcealedQuadsCount:value('E04','exposedConcealedQuadsCount')});
  conditions('penalty.fine',{noWinnerDestination:value('B03','exhaustiveDrawFines'),multipleWinnerRecipient:value('B03','multipleWinnerRecipient')});
  const double=defs['yaku.double-riichi'];if(double)defs[double.id]={...double,closedValue:2,exclusions:[...double.exclusions,'yaku.riichi']};
  const junchan=defs['yaku.junchan'];if(junchan&&value('B01','junchanExcludesChanta')===true)defs[junchan.id]={...junchan,exclusions:[...junchan.exclusions,'yaku.chanta']};
}
const builders: Record<RuleSetId, (defs: Record<string, Definition>, options: Record<string, unknown>) => Policies> = {
  'standard-riichi': (defs, options) => {
    const opt = (key: string): unknown => object(options[key]).default;
    const bool = (key: string): boolean => { const v=opt(key); if (typeof v !== 'boolean') throw new Error(key); return v; };
    const num = (key: string): number => { const v=numberOrNull(opt(key)); if(v===null)throw new Error(key); return v; };
    return { forms:['normal','seven-pairs','orphans'],copies:4,openTanyao:bool('kuitan'), multipleYakuman:bool('multipleYakuman'),kiriage:bool('kiriageMangan'),kazoe:bool('kazoeYakuman'),kokushiDouble:bool('doubleYakuman'),pinfuTsumo:20,pinfuRon:30,doubleWindPair:num('doubleWindPairFu'),honbaRon:num('honbaRon'),honbaTsumo:num('honbaTsumoEach'),deposit:num('riichiDeposit'),specialPinfu:false,paoYaku:strings(opt('paoYaku')),tripleRon:'all_win',multipleRonHonba:'each',openRiichi:bool('openRiichi'),twoHanAfterDealerWins:null,renhou:'exclusive_mangan', ...(!defs['fu.policy'] ? (()=>{throw new Error('부 정책 없음');})() : {}) };
  },
  mamamo: () => ({forms:['normal','seven-pairs','orphans','knitted','seven-stars','unrelated'],copies:4,openTanyao:false,multipleYakuman:true,kiriage:false,kazoe:true,kokushiDouble:true,pinfuTsumo:20,pinfuRon:30,doubleWindPair:2,honbaRon:300,honbaTsumo:100,deposit:1000,specialPinfu:true,paoYaku:['yaku.daisangen','yaku.daisuushii','yaku.suukantsu','yaku.flower-bird-wind-moon','yaku.wind-flower-snow-moon','yaku.suurenkou'],tripleRon:'abortive_draw',multipleRonHonba:'nearest',openRiichi:true,twoHanAfterDealerWins:5,renhou:'baiman'}),
};
export function loadRuleSet(ruleSet: RuleSetId): RuleContext {
  const data=object(catalog); const raw=array(data.profiles).map(object).find(p => p.ruleSet === ruleSet);
  if (!raw) throw new Error(`알 수 없는 규칙 세트: ${ruleSet}`);
  if (typeof raw.engineReadiness === 'string' && raw.engineReadiness.startsWith('blocked_')) throw new Error(`규칙 프로필 미완결: ${raw.engineReadiness}`);
  if (ruleSet === 'mamamo') {
    const approval=object(data.resolutions); if(approval.status !== 'approved_by_user')throw new Error('보완 규칙 미승인');
    const r=object(approval.resolutions); for(const id of ['E01','E02','E03','E04','E05','B01','B02','B03']) if(!r[id])throw new Error(`보완 규칙 없음: ${id}`);
  }
  const definitions: Record<string, Definition> = {};
  for (const item of [...array(raw.rules), ...array(raw.yaku)]) {
    const r=object(item), id=text(r.id);
    if (r.enabled !== true && r.enabled !== false) throw new Error(`미확정 활성화: ${id}`);
    definitions[id]={id,name:text(r.name),enabled:r.enabled,category:text(r.category),closedValue:numberOrNull(r.closedValue),openValue:numberOrNull(r.openValue),yakumanMultiplier:numberOrNull(r.yakumanMultiplier)??0,openEligible:r.openEligible === true || typeof r.openValue === 'number',conditions:optionalObject(r.conditions),exclusions:strings(r.exclusions),stackingRules:optionalObject(r.stackingRules),paymentRules:optionalObject(r.paymentRules),sourcePages:pages(r.sourcePages)};
  }
  if(ruleSet==='mamamo')applyApprovedResolutions(definitions,object(data.resolutions));
  const policies=builders[ruleSet](definitions,optionalObject(raw.options));
  if(ruleSet==='mamamo'){
    const r=object(object(data.resolutions).resolutions);
    const tsumo=numberOrNull(object(r.E03).pinfuTsumoFu),ron=numberOrNull(object(r.E03).pinfuRonFu),threshold=numberOrNull(object(r.B02).minimumHanAfterCompletedDealerWins);
    if(tsumo===null||ron===null||threshold===null)throw new Error('미완결 승인 정책');
    policies.pinfuTsumo=tsumo;policies.pinfuRon=ron;policies.twoHanAfterDealerWins=threshold;
    policies.multipleYakuman=object(r.E05).multipleYakuman==='sum_after_exclusions_and_inclusions';
  }
  return freeze({ruleSet,profileHash:text(data.hash),definitions,policies});
}
export function evidence(ruleId: string, context: RuleContext) { return {ruleSet:context.ruleSet,ruleId,sources:context.definitions[ruleId]?.sourcePages??[]}; }
