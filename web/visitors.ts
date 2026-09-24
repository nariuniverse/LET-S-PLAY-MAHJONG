export async function setupVisitors(root: HTMLElement): Promise<void> {
  try {
    const response = await fetch(new URL('api/visitors', document.baseURI), {
      method: 'POST', headers: { 'X-Mahjong-Visit': '1' }, credentials: 'same-origin', signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Visitor count unavailable');
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object' || !('today' in value) || !('total' in value) || !Number.isSafeInteger(value.today) || !Number.isSafeInteger(value.total) || Number(value.today) < 0 || Number(value.total) < Number(value.today)) throw new Error('Invalid visitor count');
    root.querySelector('[data-visitors-today]')!.textContent = Number(value.today).toLocaleString('ko-KR');
    root.querySelector('[data-visitors-total]')!.textContent = Number(value.total).toLocaleString('ko-KR');
    root.querySelector('[data-visitors-status]')!.textContent = '누적은 브라우저별 1회 · 오늘은 한국 시간 기준';
  } catch {
    root.querySelector('[data-visitors-status]')!.textContent = '방문자 수를 잠시 불러올 수 없어요.';
  }
}
