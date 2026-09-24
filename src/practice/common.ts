import type { RuleContext, Tile } from '../types.js';
import type { Problem } from '../game.js';
import { counts, sortTiles } from '../tiles.js';
import { validateProblem } from '../game.js';

export type PracticeMode = 'discard' | 'wait' | 'score';
export interface PracticeBase extends Problem { id: string; seed: number; generatorVersion: 1 | 2 }
export function randomFor(seed: number): (bound: number) => number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('시드는 0–4294967295 정수입니다.');
  let state = seed || 0x6d2b79f5;
  return bound => {
    if (!Number.isInteger(bound) || bound < 1) throw new Error('잘못된 난수 범위');
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return Math.floor((state >>> 0) / 4294967296 * bound);
  };
}
export function completeTiles(random: (bound: number) => number, flushSuit?: number): Tile[] {
  for (let attempt = 0; attempt < 256; attempt++) {
    const tiles: Tile[] = [];
    for (let n = 0; n < 4; n++) {
      if (random(4) === 0) {
        const tile = flushSuit === undefined ? random(34) : flushSuit * 9 + random(9);
        tiles.push(tile, tile, tile);
      } else {
        const low = (flushSuit ?? random(3)) * 9 + random(7);
        tiles.push(low, low + 1, low + 2);
      }
    }
    const pair = flushSuit === undefined ? random(34) : flushSuit * 9 + random(9);
    tiles.push(pair, pair);
    if (counts(tiles).every(n => n <= 4)) return tiles;
  }
  throw new Error('유효한 패 생성에 실패했습니다. 다른 시드로 시도해 주세요.');
}
export function baseProblem(mode: PracticeMode, seed: number, tiles: Tile[], context: RuleContext): PracticeBase {
  return { id: `v1:${context.ruleSet}:${mode}:${seed}:${context.profileHash}`, seed, generatorVersion: 1,
    mode, ruleSet: context.ruleSet, profileHash: context.profileHash, hand: { concealed: sortTiles(tiles, context) } };
}
export function assertProblem(problem: Problem, context: RuleContext): void {
  const result = validateProblem(problem, context);
  if (!result.valid) throw new Error(result.errors.join(', '));
}
