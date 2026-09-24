import type { Hand, Meld, RuleContext, Tile } from './types.js';
export const SUITS = ['m', 'p', 's', 'z'] as const;
export function rank(tile: Tile): number { return tile % 9 + 1; }
export function suit(tile: Tile): number { return Math.floor(tile / 9); }
export function terminalHonor(tile: Tile): boolean { return tile >= 27 || rank(tile) === 1 || rank(tile) === 9; }
export function counts(tiles: readonly Tile[]): number[] {
  const out = Array<number>(34).fill(0);
  for (const tile of tiles) {
    if (!Number.isInteger(tile) || tile < 0 || tile > 33) throw new Error('존재하지 않는 패');
    out[tile] = (out[tile] ?? 0) + 1;
  }
  return out;
}
export function parseTiles(text: string, context: RuleContext): Tile[] {
  if (!/^(?:[1-9]+[mps]|[1-7]+z)+$/.test(text)) throw new Error('잘못된 패 문자열');
  const result: Tile[] = [];
  for (const group of text.matchAll(/([1-9]+)([mpsz])/g)) {
    const base = SUITS.indexOf(group[2] as typeof SUITS[number]) * 9;
    for (const digit of group[1] ?? '') result.push(base + Number(digit) - 1);
  }
  if (counts(result).some(n => n > context.policies.copies)) throw new Error('동일 패 4장 초과');
  return result;
}
export function compareTiles(a: Tile, b: Tile, context: RuleContext): number {
  const errors = validateTiles({ concealed: [a, b] }, context);
  if (errors.length) throw new Error(errors.join(', '));
  return a - b;
}
export function sortTiles(tiles: readonly Tile[], context: RuleContext): Tile[] {
  const errors = validateTiles({ concealed: tiles }, context); if (errors.length) throw new Error(errors.join(', '));
  return [...tiles].sort((a, b) => a - b);
}
export function serializeTiles(tiles: readonly Tile[], context: RuleContext): string {
  const sorted = sortTiles(tiles, context);
  return SUITS.map((s, i) => sorted.filter(t => suit(t) === i).map(rank).join('') + (sorted.some(t => suit(t) === i) ? s : '')).join('');
}
export function countTile(tiles: readonly Tile[], tile: Tile, context: RuleContext): number {
  const errors = validateTiles({ concealed: [...tiles] }, context); if (errors.length) throw new Error(errors.join(', '));
  if (!Number.isInteger(tile) || tile < 0 || tile > 33) throw new Error('존재하지 않는 패');
  return counts(tiles)[tile] ?? 0;
}
export function allTiles(hand: Hand): Tile[] { return [...hand.concealed, ...(hand.melds ?? []).flatMap(m => [...m.tiles])]; }
export function closed(hand: Hand): boolean { return (hand.melds ?? []).every(m => m.kind === 'ankan'); }
export function effectiveSize(hand: Hand): number { return hand.concealed.length + (hand.melds?.length ?? 0) * 3; }
export function validateTiles(hand: Hand, context: RuleContext, expected?: number): string[] {
  const errors: string[] = [];
  try { if (counts(allTiles(hand)).some(n => n > context.policies.copies)) errors.push('동일 패 4장 초과'); } catch { errors.push('존재하지 않는 패'); }
  if (expected !== undefined && effectiveSize(hand) !== expected) errors.push(`유효 패 수 ${expected}장 필요`);
  if ((hand.melds?.length ?? 0) > 4) errors.push('공개 세트 4개 초과');
  for (const m of hand.melds ?? []) {
    if (!['chi','pon','ankan','daiminkan','kakan'].includes(m.kind)) errors.push('잘못된 세트 종류');
    if (m.from !== undefined && ![0,1,2,3].includes(m.from)) errors.push('잘못된 세트 제공자');
    const tiles = [...m.tiles].sort((a,b) => a-b); const first = tiles[0];
    if (first === undefined) { errors.push('빈 세트'); continue; }
    if (m.kind === 'chi') {
      if (tiles.length !== 3 || first >= 27 || rank(first) > 7 || tiles[1] !== first + 1 || tiles[2] !== first + 2) errors.push('잘못된 치');
    } else if (tiles.length !== (m.kind === 'pon' ? 3 : 4) || !tiles.every(t => t === first)) errors.push('잘못된 퐁/깡');
    if (m.claimedTile !== undefined && !tiles.includes(m.claimedTile)) errors.push('세트에 없는 받은 패');
  }
  return errors;
}
export function parseMeld(kind: Meld['kind'], text: string, context: RuleContext, from?: Meld['from']): Meld {
  const meld: Meld = { kind, tiles: parseTiles(text, context), ...(from === undefined ? {} : { from }) };
  const errors = validateTiles({ concealed: [], melds: [meld] }, context); if (errors.length) throw new Error(errors.join(', '));
  return meld;
}
