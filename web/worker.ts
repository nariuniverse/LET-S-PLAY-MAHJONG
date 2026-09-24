import { loadRuleSet } from '../src/rules.js';
import { generateDiscard } from '../src/practice/discard.js';
import type { DiscardLevel } from '../src/practice/discard-levels.js';
import { generateWait } from '../src/practice/wait.js';
import { generateScore } from '../src/practice/score.js';
import type { PracticeMode } from '../src/practice/common.js';
import type { RuleSetId } from '../src/types.js';
export interface GenerationRequest { id: number; mode: PracticeMode; ruleSet: RuleSetId; seed: number; level?: DiscardLevel }
self.onmessage = (event: MessageEvent<GenerationRequest>) => {
  const request = event.data;
  try {
    const context = loadRuleSet(request.ruleSet);
    const problem = request.mode === 'discard' ? generateDiscard(request.seed, context, request.level) :
      request.mode === 'wait' ? generateWait(request.seed, context) : request.mode === 'score' ? generateScore(request.seed, context) : null;
    if (!problem) throw new Error('알 수 없는 연습입니다.');
    self.postMessage({ id: request.id, problem });
  } catch (error) { self.postMessage({ id: request.id, error: error instanceof Error ? error.message : '문제 생성 실패' }); }
};
