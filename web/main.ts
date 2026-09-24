import './style.css';
import playerAvatar from './assets/player-avatar.png';
import './tiles.css';
import './difficulty.css';
import './readability.css';
import './identity.css';
import { setupVisitors } from './visitors.js';
import './score-reference.css';
import { scoreReferenceMarkup, setupScoreReference } from './score-reference.js';
import { discardLevels, isDiscardLevel } from '../src/practice/discard-levels.js';
import type { DiscardLevel } from '../src/practice/discard-levels.js';
import { tileFace, tileName } from './tiles.js';
import type { Player, RuleSetId, Tile } from '../src/types.js';
import type { PracticeMode } from '../src/practice/common.js';
import { gradeDiscard } from '../src/practice/discard.js';
import type { DiscardPractice } from '../src/practice/discard.js';
import { gradeWait } from '../src/practice/wait.js';
import type { WaitPractice } from '../src/practice/wait.js';
import { gradeScore } from '../src/practice/score.js';
import type { ScoreAnswer, ScorePractice } from '../src/practice/score.js';
import { PracticeClock } from '../src/practice/clock.js';
import { readHistory, recordAttempt, summarize } from '../src/practice/history.js';
import type { Attempt } from '../src/practice/history.js';
import type { GenerationRequest } from './worker.js';

type Practice = DiscardPractice | WaitPractice | ScorePractice;
const modeInfo = {
  discard: { number:'01', name:'최적 타패', title:'어떤 패를 버릴까요?', description:'14장의 패에서 다음 가능성을 가장 넓히는 한 장을 골라보세요.', rule:'샹텐이 가장 낮고, 유효패가 가장 많은 선택이 정답입니다. 동률이면 모두 정답이에요.' },
  wait: { number:'02', name:'청일색 대기', title:'완성까지, 어떤 패가 필요할까요?', description:'한 가지 수패로 이루어진 손패. 완성되는 대기패를 모두 찾아보세요.', rule:'모든 구조적 대기패를 선택하세요. 론·쯔모 조건과 별개이며, 치또이 형태도 포함합니다.' },
  score: { number:'03', name:'화료 점수', title:'이번 화료는 몇 점일까요?', description:'역과 부를 계산하고, 각 상대가 지불할 점수까지 맞혀보세요.', rule:'총 획득점에는 본장과 공탁이 포함됩니다. 지불하지 않는 상대는 0점을 입력하세요.' },
} as const;
const profileNames = { 'standard-riichi':'표준 리치마작', mamamo:'마마모 로컬룰' };
const winds = ['동','남','서','북'];
const storeKey = 'mamamo.practice.history.v1';
function element<T extends HTMLElement = HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector); if (!found) throw new Error(`화면 요소 없음: ${selector}`); return found;
}
function escape(value: unknown): string { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] ?? char)); }
function tilesLine(tiles: readonly Tile[]): string { return tiles.map(t => tileName(t)).join(' · '); }
function duration(ms: number): string { const seconds = Math.floor(ms / 1000); return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`; }
function newSeed(): number { return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1; }
function readStoredHistory(): Attempt[] { try { return readHistory(localStorage.getItem(storeKey)); } catch { return []; } }
const params = new URLSearchParams(location.search);
const requestedLevel = Number(params.get('level'));
let level: DiscardLevel = isDiscardLevel(requestedLevel) ? requestedLevel : 1;
let mode: PracticeMode = ['discard','wait','score'].includes(params.get('mode') ?? '') ? params.get('mode') as PracticeMode : 'discard';
let ruleSet: RuleSetId = params.get('rules') === 'standard-riichi' ? 'standard-riichi' : 'mamamo';
let seed = /^\d+$/.test(params.get('seed') ?? '') && Number(params.get('seed')) <= 0xffffffff ? Number(params.get('seed')) : newSeed();
let practice: Practice | null = null, selected = new Set<Tile>(), history = readStoredHistory();
let answered = false, paused = false, loading = false, requestId = 0;
let worker: Worker | null = null, timeout: ReturnType<typeof setTimeout> | undefined;
const clock = new PracticeClock(() => performance.now());
let scoreReference: ReturnType<typeof setupScoreReference> | null = null;

function shell(): void {
  element('#app').innerHTML = `<aside class="sidebar">
    <a class="brand" href="./" aria-label="LET'S PLAY MAHJONG 홈"><img class="brand-avatar" src="${playerAvatar}" alt="" width="96" height="96" /><span class="brand-name"><span>LET'S PLAY</span> <span>MAHJONG</span></span></a>
    <p class="nav-label">나의 연습실</p><nav aria-label="연습 선택">${Object.entries(modeInfo).map(([key,v]) => `<button class="nav-item" data-mode="${key}"><span class="nav-number">${v.number}</span><span>${v.name}<small>연습 ${Number(v.number)}</small></span><span class="nav-arrow">↗</span></button>`).join('')}</nav>
    <div class="sidebar-bottom"><span class="small-tile">中</span><p>한 패씩,<br><strong>더 나은 선택.</strong></p><small>기록은 이 브라우저에 저장돼요.</small></div>
  </aside><div class="page"><header class="topbar"><span class="breadcrumb">연습실 <span>/</span> <b id="breadcrumb-mode"></b></span><div class="profile-control" role="group" aria-label="규칙 선택"><button data-rules="standard-riichi">표준 리치마작</button><button data-rules="mamamo">마마모 로컬룰</button></div></header>
  <main><div class="heading"><div><p class="eyebrow">A LITTLE PRACTICE, EVERY DAY</p><h1 id="page-title"></h1><p id="page-description" class="description"></p></div><span class="heading-mark" aria-hidden="true">🀄︎</span></div>
  <section class="difficulty" id="difficulty" aria-label="최적 타패 난이도"><div class="difficulty-heading"><h2>연습 레벨</h2><span>나에게 맞는 난이도를 골라보세요</span></div><div class="difficulty-options" role="group" aria-label="레벨 선택">${discardLevels.map(item => `<button type="button" class="level-button" data-level="${item.level}" aria-pressed="false"><span class="level-number">${item.level}</span><span><strong>레벨 ${item.level} · ${item.name}</strong><small>${item.description}</small></span><span class="level-check" aria-hidden="true">✓</span></button>`).join('')}</div></section>
  <section class="stats" aria-label="현재 연습의 기록"><div><span>풀어본 문제</span><strong id="stat-solved">0 <small>문제</small></strong></div><div><span>정답률</span><strong id="stat-accuracy">—</strong></div><div><span>평균 풀이 시간</span><strong id="stat-time">—</strong></div><p><span id="stats-scope">선택한 규칙·연습 기준</span>최근 200문제까지 저장</p></section>
  <section class="practice-card" aria-label="연습 문제"><div class="card-top"><div><span id="practice-label" class="pill"></span><span id="profile-label" class="muted"></span></div><div class="time-control"><span class="timer" id="timer" aria-label="풀이 시간">00:00</span><button class="icon-button" id="pause" aria-label="일시정지" title="일시정지">Ⅱ</button></div></div>
  <div id="question-panel" aria-live="polite"></div><div id="pause-overlay" hidden><span class="pause-symbol">Ⅱ</span><h2>잠시 쉬어가세요</h2><p>풀이 시간도 잠시 멈췄어요.</p><button class="primary" id="resume">계속 풀기</button></div></section>
  <section id="solution" class="solution" hidden aria-live="polite"></section>
  <div class="bottom-row"><p id="rule-note"></p><details class="replay"><summary>같은 문제 다시 열기</summary><form id="replay-form"><label for="seed-input">문제 번호</label><div><input id="seed-input" inputmode="numeric" pattern="[0-9]+" required aria-label="문제 번호"><button class="secondary" type="submit">열기</button></div><p>주소를 복사해도 같은 문제를 열 수 있어요.</p></form></details></div>
  <section class="site-visitors" id="site-visitors" aria-label="사이트 방문자 수"><h2>함께한 방문자</h2><dl><div><dt>오늘</dt><dd data-visitors-today>—</dd></div><div><dt>누적</dt><dd data-visitors-total>—</dd></div></dl><p data-visitors-status role="status">방문자 수를 불러오는 중이에요.</p></section><p class="storage-notice" id="storage-notice" role="status"></p><footer><strong class="footer-brand">LET'S PLAY MAHJONG</strong> <span>한 번의 정답보다, 이해하는 한 걸음.</span><a href="./" id="reset-link">처음으로</a></footer></main></div>${scoreReferenceMarkup()}`;
  void setupVisitors(element('#site-visitors'));
  scoreReference = setupScoreReference({
    current: () => ({ ruleSet, dealer: practice?.mode === 'score' && practice.situation.winner === practice.situation.dealer, method: practice?.mode === 'score' ? practice.situation.method : 'ron' }),
    onOpen: () => clock.pause(),
    onClose: () => { if (practice && !answered && !paused && !loading && !document.hidden) clock.resume(); },
  });
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode as PracticeMode; generate(newSeed()); }));
  document.querySelectorAll<HTMLButtonElement>('[data-rules]').forEach(b => b.addEventListener('click', () => { ruleSet = b.dataset.rules as RuleSetId; generate(newSeed()); }));
  document.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(b => b.addEventListener('click', () => {
    const next = Number(b.dataset.level); if (!isDiscardLevel(next) || next === level) return;
    level = next; generate(newSeed());
  }));
  element('#pause').addEventListener('click', pauseQuestion);
  element('#resume').addEventListener('click', () => { if (!practice || answered) return; paused = false; clock.resume(); updatePause(); });
  element('#replay-form').addEventListener('submit', event => { event.preventDefault(); const text = element<HTMLInputElement>('#seed-input').value.trim(); if (!/^\d+$/.test(text) || Number(text) > 0xffffffff) { element('#storage-notice').textContent = '문제 번호는 0–4294967295 정수로 입력하세요.'; return; } generate(Number(text)); });
}
function updateHeader(): void {
  const info = modeInfo[mode];
  element('#page-title').textContent = info.title; element('#page-description').textContent = info.description;
  element('#breadcrumb-mode').textContent = info.name; element('#practice-label').textContent = `연습 ${Number(info.number)} · ${info.name}${mode === 'discard' ? ` · 레벨 ${level}` : ''}`;
  element('#profile-label').textContent = profileNames[ruleSet]; element('#rule-note').textContent = info.rule;
  element<HTMLInputElement>('#seed-input').value = String(seed);
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b => { b.classList.toggle('active', b.dataset.mode === mode); b.setAttribute('aria-current', b.dataset.mode === mode ? 'page' : 'false'); });
  document.querySelectorAll<HTMLButtonElement>('[data-rules]').forEach(b => { const active = b.dataset.rules === ruleSet; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  element('#difficulty').hidden = mode !== 'discard';
  element('#score-reference-open').hidden = mode !== 'score';
  document.body.classList.toggle('score-mode', mode === 'score');
  document.querySelectorAll<HTMLButtonElement>('[data-level]').forEach(b => {
    const active = Number(b.dataset.level) === level;
    b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active));
  });
  element('#stats-scope').textContent = mode === 'discard' ? `선택한 규칙 · 레벨 ${level} 기준` : '선택한 규칙·연습 기준';
  const stats = summarize(history, ruleSet, mode, mode === 'discard' ? level : undefined);
  element('#stat-solved').innerHTML = `${stats.solved} <small>문제</small>`;
  element('#stat-accuracy').innerHTML = stats.accuracy === null ? '—' : `${stats.accuracy}<small>%</small>`;
  element('#stat-time').textContent = stats.averageMs === null ? '—' : duration(stats.averageMs);
}
function generate(nextSeed: number): void {
  if (scoreReference?.isOpen()) scoreReference.close();
  seed = nextSeed; practice = null; selected.clear(); answered = false; paused = false; loading = true; clock.stop();
  worker?.terminate(); clearTimeout(timeout); const id = ++requestId;
  element('#timer').textContent = '00:00'; element('#solution').hidden = true; updateHeader(); updatePause();
  element('#question-panel').innerHTML = '<div class="loading"><span class="spinner"></span><h2>새 문제를 준비하고 있어요</h2><p>패 구성과 정답을 확인하는 중입니다.</p></div>';
  const url = new URL(location.href); url.search = new URLSearchParams({ mode, rules:ruleSet, seed:String(seed), level:String(level) }).toString(); window.history.replaceState(null,'',url);
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type:'module' });
    worker.onmessage = (event: MessageEvent<{id:number;problem?:Practice;error?:string}>) => {
      if (event.data.id !== requestId) return;
      clearTimeout(timeout);
      if (event.data.error || !event.data.problem) { showFailure(event.data.error ?? '문제를 불러오지 못했습니다.'); return; }
      practice = event.data.problem; loading = false; renderQuestion(); clock.start(); if (scoreReference?.isOpen()) clock.pause(); updatePause(); if (document.hidden) pauseQuestion();
    };
    worker.onerror = () => { if (id === requestId) showFailure('문제 생성기를 실행하지 못했습니다. 다시 시도해 주세요.'); };
    worker.postMessage({ id, mode, ruleSet, seed, level } satisfies GenerationRequest);
    timeout = setTimeout(() => { if (id === requestId) showFailure('문제 준비가 지연되었습니다. 다시 시도해 주세요.'); }, 30000);
  } catch { showFailure('이 브라우저에서 문제 생성기를 실행할 수 없습니다. 최신 브라우저로 다시 열어주세요.'); }
}
function showFailure(message: string): void {
  loading = false; worker?.terminate(); clearTimeout(timeout); updatePause();
  element('#question-panel').innerHTML = `<div class="loading"><h2>문제를 준비하지 못했어요</h2><p role="alert">${escape(message)}</p><button class="primary" id="retry-load">다시 시도</button></div>`;
  element('#retry-load').addEventListener('click', () => generate(newSeed()));
}
function playerLabel(player: Player, p: ScorePractice): string {
  const seat = winds[(player - p.situation.dealer + 4) % 4];
  return `${seat}가${player === p.situation.dealer ? ' (친)' : ''}${player === p.situation.discarder && p.situation.method === 'ron' ? ' · 방총' : ''}`;
}
function renderQuestion(): void {
  const p = practice; if (!p) return;
  const shown = [...p.hand.concealed]; let extra = '', scoreInput = '';
  if (p.mode === 'score') {
    const s = p.situation; shown.splice(shown.indexOf(s.winningTile), 1);
    extra = `<div class="situation"><span>${winds[s.roundWind - 27]}장</span><span>나: ${playerLabel(s.winner,p)}</span><span>${s.method === 'ron' ? '론 화료' : '쯔모 화료'}</span><span>${s.riichi === 'riichi' ? '리치' : '부로 · 리치 없음'}</span><span>${s.honba ?? 0}본장</span><span>공탁 ${s.riichiSticks ?? 0}개</span></div><div class="indicators"><span>도라 표시패</span>${(s.doraIndicators ?? []).map(t=>tileFace(t,false,'mini')).join('')}${s.uraIndicators?.length ? `<span>뒷도라 표시패</span>${s.uraIndicators.map(t=>tileFace(t,false,'mini')).join('')}` : ''}</div>`;
    scoreInput = `<div class="score-inputs"><label class="total-field">총 획득점 <span>본장·공탁 포함</span><div class="input-suffix"><input name="total" id="answer-total" inputmode="numeric" autocomplete="off" placeholder="예: 8,000" required aria-label="총 획득점"><span>점</span></div></label>${([0,1,2,3] as const).filter(player=>player!==s.winner).map(player=>`<label>${playerLabel(player,p)}<div class="input-suffix"><input name="player-${player}" inputmode="numeric" autocomplete="off" placeholder="0" required aria-label="${playerLabel(player,p)} 지불액"><span>점</span></div></label>`).join('')}</div>`;
  }
  const caption = p.mode === 'discard' ? '버릴 패 한 장을 선택하세요' : p.mode === 'wait' ? '아래에서 대기패를 모두 선택하세요' : '화료패와 상황을 확인하세요';
  element('#question-panel').innerHTML = `<form id="answer-form" novalidate><div class="question-intro"><h2>${caption}</h2><p>${p.mode === 'discard' ? '선택 후 정답 확인을 눌러주세요.' : p.mode === 'wait' ? '대기패가 여러 개일 수 있어요.' : '도라 표시패는 실제 도라의 바로 앞 패입니다.'}</p></div>${extra}
    <div class="board"><div class="board-caption"><span>내 손패</span><span>${p.mode === 'score' ? '화료패 별도 표시' : `${p.hand.concealed.length}장 · 멘젠`}</span></div><div class="hand-row ${p.mode === 'score' ? 'scoring-hand' : ''}">${shown.map(t=>tileFace(t,p.mode==='discard')).join('')}${p.mode === 'score' ? `<span class="winning-group"><small>${p.situation.method === 'ron' ? '론' : '쯔모'}</small>${tileFace(p.situation.winningTile,false,'winning')}</span>` : ''}</div>${p.hand.melds?.length ? `<div class="meld-row">${p.hand.melds.map(m=>`<span class="meld-group"><small>${m.kind === 'pon' ? '퐁' : '명깡'}</small>${m.tiles.map(t=>tileFace(t)).join('')}</span>`).join('')}</div>` : ''}<div class="board-stamp" aria-hidden="true">LET'S PLAY MAHJONG</div></div>
    ${p.mode === 'wait' ? `<div class="wait-selection" role="group" aria-label="대기패 선택">${Array.from({length:9},(_,i)=>tileFace(p.suit*9+i,true)).join('')}</div>` : ''}${scoreInput}
    <div class="answer-status" id="answer-status">${p.mode === 'score' ? '지불액이 없는 상대도 0을 입력해 주세요.' : '아직 선택한 패가 없어요.'}</div><p class="answer-error" id="answer-error" role="alert"></p>
    <div class="actions"><button type="button" class="text-button" id="reveal">해설 먼저 보기</button><div><button type="button" class="secondary" id="next">다른 문제</button><button type="submit" class="primary" id="submit">정답 확인 <span>→</span></button></div></div></form>`;
  element('#answer-form').addEventListener('submit', event => { event.preventDefault(); submitAnswer(false); });
  element('#reveal').addEventListener('click', () => submitAnswer(true));
  element('#next').addEventListener('click', () => generate(newSeed()));
  element('#question-panel').querySelectorAll<HTMLButtonElement>('[data-tile]').forEach(button => button.addEventListener('click', () => {
    if (answered || paused || !practice) return;
    const tile = Number(button.dataset.tile);
    if (practice.mode === 'discard') selected = new Set([tile]); else if (selected.has(tile)) selected.delete(tile); else selected.add(tile);
    element('#answer-error').textContent = '';
    element('#question-panel').querySelectorAll<HTMLButtonElement>('[data-tile]').forEach(b=> { const active=selected.has(Number(b.dataset.tile)); b.classList.toggle('selected',active); b.setAttribute('aria-pressed',String(active)); });
    element('#answer-status').textContent = selected.size ? `선택한 패: ${tilesLine([...selected].sort((a,b)=>a-b))}` : '아직 선택한 패가 없어요.';
  }));
}
function submitAnswer(reveal: boolean): void {
  const p = practice; if (!p || answered || paused || loading) return;
  try {
    let correct = false;
    if (!reveal) {
      if (p.mode === 'discard') { const tile = [...selected][0]; if (tile === undefined) throw new Error('버릴 패 한 장을 선택해 주세요.'); correct = gradeDiscard(p,tile).correct; }
      else if (p.mode === 'wait') correct = gradeWait(p,[...selected]).correct;
      else {
        const form = new FormData(element<HTMLFormElement>('#answer-form'));
        const answer: ScoreAnswer = { totalGain:String(form.get('total') ?? ''), opponentPayments:{} };
        for (const player of [0,1,2,3] as const) if (player !== p.situation.winner) answer.opponentPayments[player] = String(form.get(`player-${player}`) ?? '');
        const grade = gradeScore(p,answer); correct = grade.correct;
        for (const player of [0,1,2,3] as const) if (player !== p.situation.winner) element<HTMLInputElement>(`[name="player-${player}"]`).classList.toggle('incorrect',!grade.playerCorrect[player]);
        element<HTMLInputElement>('#answer-total').classList.toggle('incorrect',!grade.totalCorrect);
      }
    }
    const elapsedMs = clock.stop(); answered = true; updatePause();
    element('#answer-error').textContent = '';
    element('#question-panel').querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,button[data-tile],#submit,#reveal').forEach(e=>e.disabled=true);
    element('#next').textContent='다음 문제 →';
    if (!reveal) {
      const repeated = history.some(a=>a.id===p.id);
      history = recordAttempt(history,{id:p.id,mode:p.mode,ruleSet:p.ruleSet,correct,elapsedMs,timestamp:Date.now(),...(p.mode === 'discard' ? {level:p.level} : {})});
      try { localStorage.setItem(storeKey,JSON.stringify(history)); element('#storage-notice').textContent = repeated ? '같은 문제의 재풀이는 기록에 중복 집계하지 않아요.' : ''; }
      catch { element('#storage-notice').textContent = '브라우저 저장 공간을 사용할 수 없어 이번 기록은 현재 창에서만 유지됩니다.'; }
      updateHeader();
    }
    renderSolution(p,correct,reveal,elapsedMs);
  } catch (error) { element('#answer-error').textContent = error instanceof Error ? error.message : '입력값을 확인해 주세요.'; }
}
function renderSolution(p: Practice, correct: boolean, reveal: boolean, elapsed: number): void {
  let content = '';
  if (p.mode === 'discard') {
    const best = p.analysis.find(r => r.optimal)!;
    const same = p.analysis.filter(r => r.shanten === best.shanten);
    const runner = same.filter(r => !r.optimal).sort((a,b) => b.total - a.total)[0];
    const comparison = p.level > 1 && runner ? `<p class="level-explanation">레벨 ${p.level} · 같은 ${best.shanten}샹텐을 유지하는 타패는 ${same.length}종입니다. 정답의 유효패는 ${best.total}장, 다음 후보(${tileName(runner.discard)})는 ${runner.total}장으로 <strong>${best.total-runner.total}장 차이</strong>입니다.</p>` : '';
    content = `<p class="answer-line">정답 <strong>${tilesLine(p.correctTiles)}</strong></p><p>샹텐을 먼저 낮추고, 같다면 유효패 장수가 많은 타패를 선택합니다.</p>${comparison}<div class="table-scroll"><table><thead><tr><th>타패</th><th>샹텐</th><th>유효패</th><th>남은 장수</th><th>판정</th></tr></thead><tbody>${p.analysis.map(r=>`<tr class="${r.optimal?'best-row':''}"><td>${tileName(r.discard)}${selected.has(r.discard)?' · 선택':''}</td><td>${r.shanten}</td><td>${r.effectiveTiles.map(t=>`${tileName(t.tile)}(${t.remaining})`).join(' · ') || '없음'}</td><td>${r.total}장</td><td>${r.optimal ? r.tied?'공동 최적':'최적' : '효율 낮음'}</td></tr>`).join('')}</tbody></table></div><p class="muted">손패와 버린 패를 제외한 패는 보이지 않는 것으로 계산합니다.</p>`;
  } else if (p.mode === 'wait') {
    const missing = p.correctTiles.filter(t=>!selected.has(t)), extra = [...selected].filter(t=>!p.correctTiles.includes(t));
    content = `<p class="answer-line">정답 <strong>${tilesLine(p.correctTiles)}</strong></p>${!reveal&&!correct?`<p>${missing.length?`빠뜨린 패: ${tilesLine(missing)}. `:''}${extra.length?`대기가 아닌 패: ${tilesLine(extra)}.`:''}</p>`:''}<div class="wait-results">${p.waits.map(w=>`<div>${tileFace(w.tile)}<strong>${w.remaining}장 남음</strong><span>${w.decompositions.length}가지 분해</span></div>`).join('')}</div><p>각 패를 한 장씩 넣어 완성 형태를 확인했습니다. 프리텐과 남은 장수는 구조적 대기 종류를 바꾸지 않습니다.</p>`;
  } else {
    const c = p.solutions[0]; if (!c) throw new Error('정답 정보 없음');
    const s = c.score;
    content = `<div class="score-result"><div><span>총 획득점</span><strong>${s.totalGain.toLocaleString()}<small>점</small></strong></div><p>${c.yaku.yakuman?`${c.yaku.yakuman}배 역만`:`${c.yaku.han+c.yaku.dora}판 ${c.fu.rounded}부`}<br><span>화료 ${s.handPayments.toLocaleString()} + 본장 ${s.honbaPayments.toLocaleString()} + 공탁 ${s.depositPayments.toLocaleString()}</span></p></div><div class="payment-results">${([0,1,2,3] as const).filter(player=>player!==p.situation.winner).map(player=>`<div><span>${playerLabel(player,p)}</span><strong>${s.opponentPayments[player].toLocaleString()}점</strong></div>`).join('')}</div><h3>인정된 역</h3><div class="yaku-list">${c.yaku.recognized.map(y=>`<span>${escape(y.name)} <b>${y.yakuman?`${y.yakuman}배 역만`:`${y.han}판`}</b></span>`).join('')}${c.yaku.dora?`<span>도라 <b>${c.yaku.dora}판</b></span>`:''}</div><details><summary>부 계산과 판정 근거</summary><ul>${c.fu.entries.map(e=>`<li>${escape(fuName(e.kind))}: ${e.fu}부</li>`).join('')}</ul><p>올림 전 ${c.fu.beforeRounding}부 → ${c.fu.rounded}부</p>${c.fu.exceptions.map(note=>`<p>${escape(note)}</p>`).join('')}<p>${c.yaku.recognized.map(y=>`${escape(y.name)}: ${escape(y.ruleId)}${p.ruleSet==='mamamo'?` (PDF ${[...new Set(y.sources.map(s=>s.pdf))].join(', ')}쪽)`:''}`).join('<br>')}</p></details>`;
  }
  const solution = element('#solution'); solution.hidden=false;
  solution.innerHTML = `<div class="result-heading ${reveal?'revealed':correct?'correct':'wrong'}"><span class="result-symbol">${reveal?'◎':correct?'✓':'↻'}</span><div><h2 id="result-title" tabindex="-1">${reveal?'해설을 함께 살펴볼까요?':correct?'정답이에요!':'한 번 더 살펴보세요'}</h2><p>${reveal?'해설을 먼저 본 문제는 기록에 집계하지 않아요.':`풀이 시간 ${duration(elapsed)} · ${correct?'좋은 선택이었어요.':'아래에서 정답과 이유를 확인하세요.'}`}</p></div></div><div class="solution-body">${content}</div>`;
  element('#result-title').focus({preventScroll:true}); solution.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function fuName(kind: string): string {
  const map: Record<string,string> = {'base':'기본부','closed-ron':'멘젠 론','tsumo':'쯔모','pair':'머리','fixed':'고정부','wait-tanki':'단기 대기','wait-kanchan':'간짱 대기','wait-penchan':'변짱 대기','wait-ryanmen':'양면 대기','wait-shanpon':'샤보 대기','wait-special':'특수형 대기','knitted-nine':'조합 9패'};
  return map[kind] ?? kind.replace('sequence','슌쯔').replace('triplet','커쯔').replace('quad','깡쯔').replace('terminal-honor','귀족패').replace('simple','중장패');
}
function pauseQuestion(): void { if (!practice || answered || loading || paused) return; paused=true; clock.pause(); updatePause(); }
function updatePause(): void {
  element('#pause-overlay').hidden = !paused;
  element('#question-panel').inert = paused;
  element('#question-panel').classList.toggle('obscured',paused);
  element<HTMLButtonElement>('#pause').disabled = loading || answered || !practice || paused;
}
shell(); generate(seed);
setInterval(() => { if (practice) element('#timer').textContent = duration(clock.elapsed()); },200);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseQuestion(); });
window.addEventListener('pagehide', () => { worker?.terminate(); clearTimeout(timeout); });



