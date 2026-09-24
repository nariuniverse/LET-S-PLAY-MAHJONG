import type { Tile } from '../src/types.js';

// Original vector artwork on a shared 60 × 84 face, at every displayed size.
const ink = '#172f3b', red = '#b9232e', green = '#126342', blue = '#1b3d70';
const numerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const honors = ['東', '南', '西', '北', '', '發', '中'];
function assertTile(tile: Tile): void {
  if (!Number.isInteger(tile) || tile < 0 || tile > 33) throw new RangeError('패 ID는 0–33 정수여야 합니다.');
}
export function tileName(tile: Tile): string {
  assertTile(tile);
  return tile < 27 ? `${tile % 9 + 1}${['만', '통', '삭'][Math.floor(tile / 9)]}` : ['동', '남', '서', '북', '백', '발', '중'][tile - 27]!;
}
function character(text: string, y: number, size: number, color: string): string {
  return `<text x="30" y="${y}" text-anchor="middle" fill="${color}" font-size="${size}" font-weight="900" font-family="KaiTi, STKaiti, DFKai-SB, Batang, SimSun, serif">${text}</text>`;
}
function pip(x: number, y: number, color: string, r = 7.2): string {
  return `<g data-mark="circle" transform="translate(${x} ${y})" fill="none" stroke="${color}"><circle r="${r}" stroke-width="2.6"/><circle r="${r - 3}" stroke-width="1.2"/><circle r="1.3" fill="${color}" stroke="none"/></g>`;
}
function circles(rank: number): string {
  if (rank === 1) {
    const petals = Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-12.5" rx="2.3" ry="5" transform="rotate(${i * 30})"/>`).join('');
    return `<g data-mark="circle" transform="translate(30 42)"><circle r="22" fill="none" stroke="${blue}" stroke-width="2.4"/><circle r="19" fill="none" stroke="${blue}" stroke-width="1"/><g fill="none" stroke="${blue}" stroke-width="1.3">${petals}</g><circle r="6.7" fill="none" stroke="${red}" stroke-width="2.5"/><circle r="3" fill="${red}"/></g>`;
  }
  const layouts: Record<number, [number, number, string][]> = {
    2: [[30, 22, green], [30, 62, blue]],
    3: [[15, 20, blue], [30, 42, red], [45, 64, green]],
    4: [[16, 22, blue], [44, 22, blue], [16, 62, blue], [44, 62, blue]],
    5: [[16, 20, blue], [44, 20, blue], [30, 42, red], [16, 64, blue], [44, 64, blue]],
    6: [[17, 17, green], [43, 17, green], [17, 42, red], [43, 42, red], [17, 67, red], [43, 67, red]],
    7: [[13, 15, green], [30, 23, green], [47, 31, green], [17, 49, red], [43, 49, red], [17, 69, red], [43, 69, red]],
    8: [[17, 13, blue], [43, 13, blue], [17, 32, blue], [43, 32, blue], [17, 52, blue], [43, 52, blue], [17, 71, blue], [43, 71, blue]],
    9: [[12, 17, blue], [30, 17, blue], [48, 17, blue], [12, 42, red], [30, 42, red], [48, 42, red], [12, 67, green], [30, 67, green], [48, 67, green]],
  };
  return layouts[rank]!.map(([x, y, color]) => pip(x, y, color, rank >= 7 ? 6.4 : 7.2)).join('');
}
function bamboo(x: number, y: number, color: string, height = 25, rotation = 0): string {
  return `<g data-mark="bamboo" transform="translate(${x} ${y}) rotate(${rotation})" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"><path d="M-2 ${-height / 2} Q0 -4 -2 0 Q0 4 -2 ${height / 2} M2 ${-height / 2} Q0 -4 2 0 Q0 4 2 ${height / 2}" fill="none" stroke-width="2.4"/><path d="M-4 ${-height / 2} H4 M-4 0 H4 M-4 ${height / 2} H4" stroke-width="2.8"/><path d="M-1 ${-height / 2 + 3} V-3 M-1 3 V${height / 2 - 3}" stroke="#f5efda" stroke-width=".8"/></g>`;
}
function bird(): string {
  return `<g data-mark="bird" stroke-linecap="round" stroke-linejoin="round">
    <path d="M28 51 Q18 68 9 74 Q25 70 37 52 M35 50 Q36 68 29 77 Q45 68 44 47" fill="${green}" stroke="${green}" stroke-width="1.5"/>
    <path d="M29 55 L18 69 M35 55 L33 70 M39 54 L38 64" fill="none" stroke="#eee9d6" stroke-width="1.2"/>
    <path d="M21 21 Q13 26 16 40 Q18 55 33 57 Q47 58 47 43 Q46 33 33 29 L31 21" fill="${green}" stroke="${green}" stroke-width="1.5"/>
    <path d="M19 28 Q20 37 32 39 Q27 47 20 41 Q15 36 19 28" fill="#f7f1df"/>
    <path d="M27 36 Q43 30 44 47 Q33 52 25 43 Z" fill="${blue}" stroke="#f7f1df" stroke-width="1.3"/>
    <path d="M30 38 L40 43 M29 42 L38 47" stroke="#eee9d6" stroke-width="1.1"/>
    <path d="M20 25 Q13 22 18 15 Q23 8 30 14 Q35 18 30 27" fill="${green}" stroke="${green}" stroke-width="1.5"/>
    <path d="M18 19 L10 23 L18 24" fill="${red}"/>
    <path d="M22 12 L21 7 M26 12 L29 7" stroke="${red}" stroke-width="2"/>
    <circle cx="22" cy="18" r="2.2" fill="#fff9e9"/><circle cx="21.5" cy="18" r="1" fill="${ink}"/>
    <path d="M27 56 L25 62 L20 63 M37 56 L39 61 L44 61" fill="none" stroke="${red}" stroke-width="2"/>
  </g>`;
}
function bamboos(rank: number): string {
  if (rank === 1) return bird();
  const layouts: Record<number, [number, number, string][]> = {
    2: [[30, 22, green], [30, 62, green]],
    3: [[30, 21, green], [16, 62, green], [44, 62, green]],
    4: [[16, 22, green], [44, 22, green], [16, 62, green], [44, 62, green]],
    5: [[15, 20, green], [45, 20, green], [30, 42, red], [15, 64, green], [45, 64, green]],
    6: [[13, 22, green], [30, 22, green], [47, 22, green], [13, 62, green], [30, 62, green], [47, 62, green]],
    7: [[30, 14, red], [13, 42, green], [30, 42, green], [47, 42, green], [13, 70, green], [30, 70, green], [47, 70, green]],
    9: [[13, 14, green], [30, 14, red], [47, 14, green], [13, 42, green], [30, 42, red], [47, 42, green], [13, 70, green], [30, 70, red], [47, 70, green]],
  };
  if (rank === 8) {
    const stems: [number, number, number][] = [[14, 21, -24], [24, 21, 24], [36, 21, -24], [46, 21, 24], [14, 63, 24], [24, 63, -24], [36, 63, 24], [46, 63, -24]];
    return stems.map(([x, y, rotation]) => bamboo(x, y, green, 24, rotation)).join('');
  }
  return layouts[rank]!.map(([x, y, color]) => bamboo(x, y, color, rank >= 7 ? 18 : rank === 5 ? 22 : 26)).join('');
}
export function tileArtwork(tile: Tile): string {
  assertTile(tile);
  const rank = tile % 9 + 1;
  let drawing: string;
  if (tile < 9) drawing = character(numerals[rank - 1]!, 34, 32, ink) + character('萬', 74, 37, red);
  else if (tile < 18) drawing = circles(rank);
  else if (tile < 27) drawing = bamboos(rank);
  else drawing = tile === 31 ? '' : character(honors[tile - 27]!, 61, 48, tile === 32 ? green : tile === 33 ? red : ink);
  return `<svg class="tile-art" viewBox="0 0 60 84" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${drawing}</svg>`;
}
export function tileFace(tile: Tile, selectable = false, extra = ''): string {
  const name = tileName(tile), tag = selectable ? 'button' : 'span';
  return `<${tag} class="tile suit-${Math.floor(tile / 9)} ${extra}" ${selectable ? `type="button" data-tile="${tile}" aria-pressed="false"` : 'role="img"'} aria-label="${name}" title="${name}">${tileArtwork(tile)}</${tag}>`;
}
