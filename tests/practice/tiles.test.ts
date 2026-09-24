import { describe, expect, it } from 'vitest';
import { tileArtwork, tileFace, tileName } from '../../web/tiles.js';

describe('physical mahjong tile faces', () => {
  it('preserves all 34 tile identities for selection and accessible labels', () => {
    const expected = ['1만', '2만', '3만', '4만', '5만', '6만', '7만', '8만', '9만',
      '1통', '2통', '3통', '4통', '5통', '6통', '7통', '8통', '9통',
      '1삭', '2삭', '3삭', '4삭', '5삭', '6삭', '7삭', '8삭', '9삭', '동', '남', '서', '북', '백', '발', '중'];
    expected.forEach((name, tile) => {
      expect(tileName(tile)).toBe(name);
      const face = tileFace(tile, true);
      expect(face).toContain(`data-tile="${tile}"`);
      expect(face).toContain(`aria-label="${name}"`);
      expect(face).toContain('aria-pressed="false"');
      expect(face).toContain('type="button"');
      expect(face).not.toMatch(/undefined|NaN/);
    });
    expect(new Set(expected.map((_, tile) => tileArtwork(tile))).size).toBe(34);
  });
  it('draws the exact number of circles and bamboo stalks instead of suit text', () => {
    for (let rank = 1; rank <= 9; rank++) {
      const dots = tileArtwork(8 + rank);
      expect(dots.match(/data-mark="circle"/g)).toHaveLength(rank);
      expect(dots).not.toContain('<text');
      if (rank > 1) {
        const bamboo = tileArtwork(17 + rank);
        expect(bamboo.match(/data-mark="bamboo"/g)).toHaveLength(rank);
        expect(bamboo).not.toContain('<text');
      }
    }
  });
  it('uses a bird for one bamboo and a blank white dragon with an accessible name', () => {
    expect(tileArtwork(18)).toContain('data-mark="bird"');
    expect(tileArtwork(18)).not.toContain('<text');
    expect(tileArtwork(31)).toMatch(/><\/svg>$/);
    expect(tileFace(31)).toContain('aria-label="백"');
    expect(tileArtwork(32)).toContain('>發</text>');
    expect(tileArtwork(33)).toContain('>中</text>');
  });
  it('uses the same artwork in indicators, melds and answers without adding selectable targets', () => {
    const small = tileFace(26, false, 'mini');
    expect(small).toContain(tileArtwork(26));
    expect(small).toContain('role="img"');
    expect(small).toContain('mini');
    expect(small).not.toContain('data-tile');
    expect(small).not.toContain('<button');
  });
  it('rejects invalid IDs rather than showing a misleading face', () => {
    for (const tile of [-1, 34, 1.5, NaN]) expect(() => tileFace(tile)).toThrow(RangeError);
  });
});
