# LET'S PLAY MAHJONG — 리치마작 연습

개발 폴더는 **C:\AI\mamamo**입니다. 이후 코드, 규칙, 테스트와 문서를 모두 이 폴더에 저장합니다.

표준 리치마작 프로필(`standard-riichi`)과 마마모 로컬룰(`mamamo`)을 지원합니다. 규칙 엔진과 자동 테스트, 최적 타패(레벨 1·2·3)·청일색 대기·화료 점수 웹 연습이 구현되어 있습니다. 현재 상태와 재개 순서는 [docs/TOMORROW.md](docs/TOMORROW.md)를, 변경 기록은 [docs/web-progress.md](docs/web-progress.md)를 참고하세요.

## 설치와 검증

Node.js 24와 npm 환경에서 검증합니다. PowerShell에서는 스크립트 실행 정책과 충돌하지 않도록 `npm.cmd`를 사용합니다.

```powershell
cd C:\AI\mamamo
npm.cmd ci
npm.cmd run check
npm.cmd run example
npm.cmd run bench
```

복사된 `node_modules`가 정상 동작하는 현재 환경에서는 설치를 다시 할 필요가 없습니다. 새 PC나 의존성을 변경한 경우 `npm.cmd ci`로 잠금 파일 기준으로 설치합니다.

- `npm.cmd run check`: YAML 검사 → 카탈로그 생성 → 타입 검사 → ESLint → 전체 테스트 → 라이브러리 빌드
- `npm.cmd run test:unit`: 단위·경계값 테스트
- `npm.cmd run test:regression`: PDF 예시와 점수표 회귀 테스트
- `npm.cmd run test:random`: 실패 시 시드가 표시되는 무작위 불변식 테스트
- `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run build`: 개별 검사
- `npm.cmd run example`: 타패·청일색 대기·화료 점수의 실행 가능한 예제
- `npm.cmd run bench`: 단일 샹텐, 전체 타패 분석, 청일색 대기, 역·부·점수 판정 측정

`npm.cmd run dev` 실행 후 http://127.0.0.1:5173/ 에서 웹 연습 화면을 엽니다. 서버 터미널은 열어 두고, 종료할 때 Ctrl+C를 누릅니다. HTML 파일 더블클릭 대신 서버 주소로 접속하세요.

화료 점수 연습에서는 오른쪽 아래 **점수 계산표** 버튼으로 친·자/론·쯔모 표와 본장·공탁 계산 안내를 확인합니다. 표를 보는 동안 풀이 시간이 멈추며, 닫으면 입력한 답안을 유지한 채 이어서 풀 수 있습니다.

## 패 표기와 입력

`m`은 만수, `p`는 통수, `s`는 삭수입니다. `z`는 `1=동, 2=남, 3=서, 4=북, 5=백, 6=발, 7=중`입니다. 예: `123m456p789s11122z`.

패 ID는 0–33, 플레이어 ID는 0–3입니다. 친부터 동·남·서·북 순서이며 `seatWind`는 친과 화료자의 상대 좌석과 일치해야 합니다. 적도라(`0m` 등)는 현재 두 프로필에서 지원하지 않습니다.

`hand.concealed`에는 공개 세트의 패를 포함하지 않습니다. `melds`의 안깡·명깡·가깡은 물리적으로 4장이지만 유효 패 수에서는 3장으로 계산합니다. 화료 입력에는 화료패를 이미 포함하고 `winningTile`로 그 패를 별도 지정합니다.

```js
import { loadRuleSet, parseTiles, parseMeld, evaluateWin } from './dist/index.js';

const rules = loadRuleSet('mamamo');
const hand = {
  concealed: parseTiles('123m456p789s22z', rules),
  melds: [parseMeld('pon', '111z', rules, 2)],
};
const result = evaluateWin(hand, {
  winner: 1, dealer: 0, seatWind: 28, roundWind: 27,
  method: 'ron', discarder: 3, winningTile: 28,
}, rules);
console.log(result.canWin, result.best[0]?.score.totalGain);
```

## 세 가지 연습에 사용할 계산

```js
import {
  loadRuleSet, parseTiles, analyzeDiscards, calculateShanten,
  structuralWaits, findWaits, evaluateWin, explainWin,
} from './dist/index.js';

const rules = loadRuleSet('standard-riichi'); // 또는 'mamamo'
const hand = text => ({ concealed: parseTiles(text, rules) });

const shanten = calculateShanten(hand('123m456p789s1112z'), rules);
const discards = analyzeDiscards(hand('123456789m12345p'), rules);
const bestDiscards = discards.filter(candidate => candidate.optimal);
const structural = structuralWaits(hand('1112345678999m'), rules);
const waits = findWaits(hand('1112345678999m'), {
  winner: 1, dealer: 0, seatWind: 28, roundWind: 27, discarder: 2,
}, rules);
const win = evaluateWin(hand('123m456p789s11122z'), {
  winner: 1, dealer: 0, seatWind: 28, roundWind: 27,
  method: 'ron', discarder: 2, winningTile: 28,
}, rules);
console.log(shanten.shanten, bestDiscards, structural, waits, explainWin(win, rules));
```

타패의 최적 기준은 가장 낮은 구조 샹텐, 이어서 가장 많은 유효패 총 장수입니다. 동률은 모두 정답 후보로 반환합니다. 기대 타점·수비·순위까지 고려한 전략적 최적을 뜻하지 않습니다.

`knownOutside`에는 이 손패 밖에서 보이는 패만 한 번씩 넣습니다. 자신의 공개 세트는 `melds`에서 이미 계산합니다. 타패 분석 중 버린 패도 엔진이 반영하므로 중복으로 추가하지 않습니다. 잔여 0장의 대기는 구조적 대기로 유지하며 실제 론·쯔모 가능 여부, 프리텐과 별도로 반환합니다.

금액은 모두 `bigint`입니다. JSON으로 저장할 때는 예를 들어 `JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v)`처럼 문자열로 변환합니다.

## 규칙과 판정 근거

- `rules/mamamo-rules.yaml`: PDF 전사 규칙과 A01–A31 승인 기록
- `rules/engine-resolutions.yaml`: E01–E05, B01–B03 승인 보완값
- `rules/standard-riichi-rules.yaml`: 독립적인 표준 프로필
- `src/rules.ts`: 프로필 로딩, 보완값 적용, 동결된 규칙 컨텍스트
- `src/shapes.ts`, `src/shanten.ts`: 공통 패 구조와 활성화된 특수형
- `src/yaku.ts`, `src/fu.ts`, `src/score.ts`, `src/engine.ts`: 역·부·송금·최종 화료
- `src/game.ts`: 리치·부름·책임지불 추론·복수 화료 관련 정산·문제 검증
- `src/explain.ts`: 구조화된 판정 결과의 한국어 해설

규칙 YAML을 수정한 뒤 `npm.cmd run check`를 실행하면 카탈로그를 다시 생성한 후 검증합니다. `src/generated/catalog.ts`는 직접 편집하지 않습니다. 모든 주요 판정에 `RuleContext`를 전달하고, 결과와 문제에는 규칙 ID 및 프로필 해시를 연결합니다. 두 프로필은 전역 선택 상태를 공유하지 않습니다.

새 규칙 세트를 추가하려면 YAML과 출처를 작성하고 `RuleSetId`, 카탈로그 생성 목록, 로더의 정책을 확장합니다. 새 역은 문자열 실행 대신 명시적인 판정기를 등록하고 양성·음성·프로필 분리 테스트를 추가합니다. `loadRuleSet`의 결과는 동결되어 있으며, 임의 옵션 변경 API는 아직 없습니다.

## 현재 범위와 제한

- 저장된 B01–B03까지의 승인 기록을 확인했습니다. 과거 중단 보고는 역사 기록이며 현재 구현 상태는 `docs/engine-validation.md`를 기준으로 합니다.
- PDF 예시 72개 중 완성패 59개는 형태·관련 역을 검사합니다. PDF에 없는 화료패·론/쯔모 조건을 실제 원문으로 간주하지 않으며, 예시마다 유일한 최종 점수를 검증한 것은 아닙니다.
- 리치, 일발, 첫 쯔모, 프리텐 등 상황 이력은 호출자가 정확히 전달해야 합니다. 패산·턴 진행·순위·종국까지 자동 관리하는 대국 상태 머신은 아직 없습니다.
- 책임지불은 `inferLiability`에 선언 순서의 공개 세트를 전달해 구한 뒤 화료 입력의 `liabilities`로 전달합니다. 추론만으로 이력 검증 전체를 대체하지 않습니다.
- 유국·촌보·벌금 등의 정산 함수는 제공하지만 모든 도중유국 사건을 자동 판별하는 것은 아닙니다.
- 시드 기반 문제 생성·답안 제출·경과시간 측정·웹 UI가 구현되어 있습니다. 실물 문양의 SVG 패를 적용하고 PC·모바일 너비에서 기본 동작을 검증했습니다. 최적 타패는 레벨 1·2·3을 선택할 수 있고 기록도 레벨별로 집계합니다. 자세한 출제 기준은 [docs/discard-levels.md](docs/discard-levels.md)를 참고하세요. 폭넓은 브라우저 호환성 확인은 후속 범위입니다.
- 현재 성능 측정은 로컬 Node의 정해진 입력을 사용합니다. 브라우저 및 저사양 기기의 응답시간 보장은 별도 측정이 필요합니다.

## 다시 작업을 시작할 때

Work에서 `C:\AI\mamamo`를 프로젝트 폴더로 열고 다음처럼 요청하면 됩니다.

> README.md와 docs/RESUME.md, docs/engine-validation.md를 읽고 현재 코드 기준으로 이어서 작업해줘. 모든 파일은 C:\AI\mamamo에 저장해줘.

수정 전 복구본은 `.backups/mamamo-before-resume-20260922.zip`에 있습니다. 최초 위치 `C:\Users\QCELLS\Documents\mamamo-trainer`도 보존했습니다.





## 아바타와 방문자 수

아바타는 PC 96px(좁은 사이드바 88px), 모바일 80px로 표시한다. 재사용 파일은 `artifacts/avatar/mahjong-avatar-transparent.png`, 묶음은 `artifacts/mahjong-avatar.zip`에 저장했다. 웹페이지에는 다운로드 링크를 표시하지 않는다.

사이트 공용 방문자 수(오늘/누적)는 서버에 저장한다. 로컬 개발은 기존 `npm.cmd run dev`, 운영용은 `npm.cmd run check:web` 후 `npm.cmd run start:web`로 실행한다. 집계 기준과 저장 한계는 [docs/visitors.md](docs/visitors.md)를 참고한다. Render 무료 서버에서는 유휴 종료·재시작·재배포 때 방문자 기록이 초기화될 수 있다.

## 다른 사람이 접속하기

공개 주소: https://lets-play-mahjong.onrender.com/. 배포와 운영 방법은 [공개 안내](docs/public-access.md)를 참고한다.
