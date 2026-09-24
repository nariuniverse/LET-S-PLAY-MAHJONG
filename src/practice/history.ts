import type { RuleSetId } from '../types.js';
import type { PracticeMode } from './common.js';
import { isDiscardLevel } from './discard-levels.js';
import type { DiscardLevel } from './discard-levels.js';
export interface Attempt { level?: DiscardLevel; id: string; mode: PracticeMode; ruleSet: RuleSetId; correct: boolean; elapsedMs: number; timestamp: number }
export function readHistory(raw: string | null): Attempt[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((v: unknown): v is Attempt => {
      if (!v || typeof v !== 'object') return false;
      const a = v as Partial<Attempt>;
      return typeof a.id === 'string' && a.id.length < 200 && ['discard','wait','score'].includes(a.mode ?? '') &&
        ['standard-riichi','mamamo'].includes(a.ruleSet ?? '') && typeof a.correct === 'boolean' &&
        (a.level === undefined || (a.mode === 'discard' && isDiscardLevel(a.level))) &&
        typeof a.elapsedMs === 'number' && Number.isFinite(a.elapsedMs) && a.elapsedMs >= 0 &&
        typeof a.timestamp === 'number' && Number.isFinite(a.timestamp) && a.timestamp >= 0;
    }).slice(-200);
  } catch { return []; }
}
export function recordAttempt(history: readonly Attempt[], attempt: Attempt): Attempt[] {
  if (history.some(a => a.id === attempt.id)) return [...history];
  return [...history, attempt].slice(-200);
}
export function summarize(history: readonly Attempt[], ruleSet: RuleSetId, mode: PracticeMode, level?: DiscardLevel) {
  const items = history.filter(a => a.ruleSet === ruleSet && a.mode === mode &&
    (mode !== 'discard' || level === undefined || (a.level ?? 1) === level));
  const correct = items.filter(a => a.correct).length;
  return { solved: items.length, correct, accuracy: items.length ? Math.round(correct / items.length * 100) : null,
    averageMs: items.length ? items.reduce((n, a) => n + a.elapsedMs, 0) / items.length : null };
}
