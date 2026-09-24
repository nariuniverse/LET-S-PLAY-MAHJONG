import { describe, expect, it } from 'vitest';
import { generateWait, gradeWait } from '../../src/practice/wait.js';
import { PracticeClock } from '../../src/practice/clock.js';
import { decompose } from '../../src/shapes.js';
import { structuralWaits } from '../../src/engine.js';
import { validateTiles } from '../../src/tiles.js';
import { mamamo, standard } from '../helpers.js';

describe('practice 2 complete wait sets', () => {
  for (const context of [standard, mamamo]) for (const seed of [0, 1, 7, 42, 997, 20260922]) it(`${context.ruleSet} seed=${seed}`, () => {
    const p = generateWait(seed, context);
    expect(validateTiles(p.hand, context, 13)).toEqual([]);
    expect(new Set(p.hand.concealed.map(t => Math.floor(t / 9))).size).toBe(1);
    expect(p.correctTiles).toEqual(structuralWaits(p.hand, context).map(w => w.tile));
    for (const t of p.correctTiles) expect(decompose({ concealed: [...p.hand.concealed, t] }, context).length).toBeGreaterThan(0);
    expect(gradeWait(p, [...p.correctTiles].reverse()).correct).toBe(true);
    const extra = Array.from({ length: 9 }, (_, i) => p.suit * 9 + i).find(t => !p.correctTiles.includes(t));
    if (extra !== undefined) expect(gradeWait(p, [...p.correctTiles, extra]).extra).toEqual([extra]);
    if (p.correctTiles.length > 1) expect(gradeWait(p, p.correctTiles.slice(1)).missing).toEqual([p.correctTiles[0]]);
  });
  it('reproduces seeds and rejects empty or unrelated selections', () => {
    const p = generateWait(42, mamamo);
    expect(p).toEqual(generateWait(42, mamamo));
    expect(() => gradeWait(p, [])).toThrow();
    expect(() => gradeWait(p, [33])).toThrow();
  });
});
describe('active practice time', () => {
  it('excludes paused intervals and stops permanently on submission', () => {
    let now = 0; const clock = new PracticeClock(() => now);
    clock.start(); now = 1200; clock.pause(); now = 10000;
    expect(clock.elapsed()).toBe(1200);
    clock.resume(); now = 10500; expect(clock.stop()).toBe(1700);
    now = 20000; clock.resume(); expect(clock.elapsed()).toBe(1700);
  });
  it('starts a new question from zero and repeated pauses are harmless', () => {
    let now = 0; const clock = new PracticeClock(() => now);
    clock.start(); now = 100; clock.pause(); clock.pause(); clock.start(); now = 150;
    expect(clock.elapsed()).toBe(50);
  });
});
