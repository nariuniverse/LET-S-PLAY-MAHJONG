import { buildScoreReference } from '../src/practice/score-reference.js';
import type { ScoreReferenceCell } from '../src/practice/score-reference.js';
import { loadRuleSet } from '../src/rules.js';
import type { RuleSetId, WinMethod } from '../src/types.js';

export function scoreReferenceMarkup(): string {
  return `<button type="button" id="score-reference-open" class="primary score-reference-open" aria-haspopup="dialog" aria-controls="score-reference" hidden><span aria-hidden="true">▦</span> 점수 계산표</button>
  <dialog id="score-reference" class="score-reference" aria-labelledby="score-reference-title" aria-describedby="score-reference-description">
    <div class="reference-header"><div><p id="reference-profile"></p><h2 id="score-reference-title">점수 계산표</h2></div><button type="button" id="score-reference-close" class="secondary" autofocus aria-label="점수 계산표 닫기">닫기 ×</button></div>
    <div class="reference-body"><p id="score-reference-description">0본장·공탁 0개 기준입니다. 표를 보는 동안 풀이 시간은 잠시 멈춥니다.</p>
    <div class="reference-controls"><div role="group" aria-label="화료자 선택"><button type="button" data-reference-dealer="false">자 · 친이 아닌 경우</button><button type="button" data-reference-dealer="true">친</button></div><div role="group" aria-label="화료 방법 선택"><button type="button" data-reference-method="ron">론</button><button type="button" data-reference-method="tsumo">쯔모</button></div></div>
    <div id="reference-tables"></div></div>
  </dialog>`;
}

export function setupScoreReference(options: {
  current: () => { ruleSet: RuleSetId; dealer: boolean; method: WinMethod };
  onOpen: () => void; onClose: () => void;
}): { isOpen: () => boolean; close: () => void } {
  const dialog = document.querySelector<HTMLDialogElement>('#score-reference')!;
  const opener = document.querySelector<HTMLButtonElement>('#score-reference-open')!;
  const closer = document.querySelector<HTMLButtonElement>('#score-reference-close')!;
  let dealer = false, method: WinMethod = 'ron', ruleSet: RuleSetId = 'mamamo';
  const format = (value: bigint | number): string => value.toLocaleString('ko-KR');
  function render(): void {
    const table = buildScoreReference(loadRuleSet(ruleSet), dealer);
    const who = dealer ? '친' : '자';
    const amounts = (cell: ScoreReferenceCell): string => method === 'ron' ? format(cell.ron) :
      dealer ? `${format(cell.tsumoEach)}<small>각자</small>` : `${format(cell.tsumoEach)}<small>자 1인</small>${format(cell.tsumoDealer!)}<small>친</small>`;
    document.querySelector('#reference-profile')!.textContent = ruleSet === 'mamamo' ? '마마모 로컬룰' : '표준 리치마작';
    dialog.querySelectorAll<HTMLButtonElement>('[data-reference-dealer]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.referenceDealer === String(dealer)));
    });
    dialog.querySelectorAll<HTMLButtonElement>('[data-reference-method]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.referenceMethod === method));
    });
    const legend = method === 'ron' ? '방총자 한 명이 지불하는 점수입니다.' : dealer ? '다른 세 사람이 각각 지불하는 점수입니다.' : '자 2명은 각각 ‘자 1인’ 금액, 친은 ‘친’ 금액을 지불합니다.';
    document.querySelector('#reference-tables')!.innerHTML = `<p class="reference-legend" role="status">${who} ${method === 'ron' ? '론' : '쯔모'} · ${legend}</p>
      <p class="reference-scroll-hint">표를 좌우로 밀면 1~4판을 모두 볼 수 있어요.</p><div class="reference-table-scroll" tabindex="0" role="region" aria-label="부·판 점수표, 좁은 화면에서는 가로로 스크롤"><table class="reference-table"><caption>${who} · 1~4판 점수 (점)</caption><thead><tr><th scope="col">부</th>${[1,2,3,4].map(han => `<th scope="col">${han}판</th>`).join('')}</tr></thead><tbody>${table.rows.map(row => `<tr><th scope="row">${row.fu}부</th>${row.cells.map(cell => `<td>${amounts(cell)}${cell.limit === 'mangan' ? '<small class="reference-limit">만관</small>' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      <p class="reference-note">20부·25부 행은 점수 환산값입니다. 실제로 성립하는 화료 방법과 판수는 역·부 조건에 따릅니다. 치또이는 25부로 계산합니다.</p>
      <table class="reference-table reference-limits"><caption>만관 이상 (점)</caption><thead><tr><th scope="col">판수·한도</th><th scope="col">${who} ${method === 'ron' ? '론' : '쯔모'}</th></tr></thead><tbody>${table.limits.map(row => `<tr><th scope="row">${row.label}</th><td>${amounts(row.cell)}</td></tr>`).join('')}</tbody></table>
      <section class="reference-additions"><h3>본장·공탁 더하기</h3><ul><li>론: 1본장마다 방총자가 <strong>${format(table.honbaRon)}점</strong> 추가 지불</li><li>쯔모: 1본장마다 세 사람이 각각 <strong>${format(table.honbaTsumo)}점</strong> 추가 지불</li><li>공탁: 리치봉 1개마다 총 획득점에 <strong>${format(table.deposit)}점</strong> 추가 · 상대 지불액에는 포함하지 않음</li></ul><p>총 획득점 = 상대 지불액 합계 + 공탁</p></section>
      <p class="reference-note">각 지불액은 100점 단위로 올림합니다. ${table.kiriage ? '절상만관을 적용합니다.' : '절상만관을 적용하지 않습니다.'} ${table.multipleYakuman ? '복합 역만은 인정된 역만 배수만큼 계산합니다.' : '복합 역만도 1배 역만으로 계산합니다.'} 책임지불·벌금 등 별도 정산은 이 기본표에 포함하지 않습니다.</p>`;
  }
  opener.addEventListener('click', () => {
    const current = options.current(); dealer = current.dealer; method = current.method; ruleSet = current.ruleSet;
    render(); dialog.showModal(); dialog.querySelector('.reference-body')!.scrollTop = 0; options.onOpen();
  });
  closer.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { options.onClose(); if (!opener.hidden) opener.focus({preventScroll:true}); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.querySelectorAll<HTMLButtonElement>('[data-reference-dealer]').forEach(button => button.addEventListener('click', () => { dealer = button.dataset.referenceDealer === 'true'; render(); }));
  dialog.querySelectorAll<HTMLButtonElement>('[data-reference-method]').forEach(button => button.addEventListener('click', () => { method = button.dataset.referenceMethod === 'tsumo' ? 'tsumo' : 'ron'; render(); }));
  return { isOpen: () => dialog.open, close: () => dialog.close() };
}


