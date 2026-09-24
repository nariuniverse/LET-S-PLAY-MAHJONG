export type DiscardLevel = 1 | 2 | 3;
export const discardLevels = [
  { level: 1, name: '기초', description: '패의 연결과 기본 효율 익히기' },
  { level: 2, name: '비교', description: '같은 샹텐에서 유효패 비교하기' },
  { level: 3, name: '심화', description: '복합 형태에서 작은 차이 찾기' },
] as const;
export function isDiscardLevel(value: unknown): value is DiscardLevel {
  return value === 1 || value === 2 || value === 3;
}
