import { loadRuleSet, parseTiles } from '../src/index.js';
import type { Hand, RuleContext, Situation } from '../src/index.js';
export const standard=loadRuleSet('standard-riichi'),mamamo=loadRuleSet('mamamo');
export function hand(text:string,c:RuleContext=standard):Hand{return {concealed:parseTiles(text,c)};}
export function situation(winningTile:number,extra:Partial<Situation>={}):Situation{return {winner:1,dealer:0,seatWind:28,roundWind:27,method:'ron',discarder:2,winningTile,...extra};}
