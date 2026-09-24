# 웹 연습 개발 상태

2026-09-22 시작. 사용자가 문제 생성기와 웹 연습 1·2·3 개발을 승인했다. 기존 엔진 코드는 유지한다.

| 단계 | 시작 상태 | 작업 |
|---|---|---|
| 연습 1 | 타패 분석·공동 최적만 있음 | 시드 기반 문제 생성, 타패 채점, 후보별 샹텐·유효패 해설 |
| 연습 2 | 전수 대기 탐색만 있음 | 청일색 문제 생성, 대기 집합 채점, 누락·오답 표시, 경과시간 |
| 연습 3 | 화료·지불 계산만 있음 | 화료 가능한 상황 생성, 총점·상대별 지불 채점, 역·부 해설 |
| 웹 | 없음 | 반응형 화면, 규칙/모드 전환, 웹 워커, 일시정지, 학습 기록, 재시도 |

각 단계마다 테스트하고 결과를 아래에 기록한다. 브라우저 확인 후 최종 설치·실행 안내를 갱신한다.

## 2026-09-23 웹 실행 확인

기존 문서의 웹 UI 미구현 설명은 과거 상태다. 현재 src/practice와 web에는 타패·청일색 대기·화료 점수 문제 생성, 채점, 해설, 풀이 시간, 브라우저 내 학습 기록이 구현되어 있다. 난이도 선택은 후속 범위다.

실행: C:\AI\mamamo에서 `npm.cmd run dev` 후 http://127.0.0.1:5173/ 접속. 터미널을 열어 두고 종료할 때 Ctrl+C를 누른다. web/index.html을 더블클릭하는 대신 로컬 서버 주소로 연다.

이번 확인: 규칙 YAML·카탈로그·엔진 타입 검사·린트·전체 테스트 10파일 341개 통과. 로컬 서버의 HTTP 200 응답 확인. 브라우저 자동 열기는 두 차례 도구 시간 초과로 실제 화면과 클릭 동작을 확인하지 못했다. 웹 빌드 성공 여부는 이번 기록에서 확정하지 않는다. 전체 재검증 명령은 `npm.cmd run check:web`다.

## 2026-09-23 실제 마작패 모양 적용

- 사용자 요청에 따라 web/tiles.ts의 공통 SVG 패 그림과 web/tiles.css의 입체 스타일을 추가했다. 통수는 원, 삭수는 대나무와 1삭의 새, 만수는 검은 숫자와 붉은 萬, 자패는 동남서북·빈 백패·녹색 發·붉은 中으로 표시한다.
- 손패, 대기 선택, 공개 세트, 화료패, 도라 표시패, 대기 해설에 같은 그림을 사용한다. 패 ID와 접근성 이름, 선택·채점 연결을 유지한다.
- npm.cmd run check:web 종료 코드 0. YAML·카탈로그·타입·린트·346개 테스트(11파일)·라이브러리 빌드·웹 타입 검사·Vite 빌드 모두 통과했다. 패 ID 대응, 문양 개수, 백패/1삭, 축소 표시와 잘못된 ID에 대한 회귀 테스트 5개를 추가했다.
- 일반 브라우저/Computer Use 도구는 응답하지 않아 별도 임시 프로필의 headless Chrome으로 검증했다. 34종 패 갤러리, 1440px 실제 연습 화면, 390px 화면의 스크린샷을 확인했다. 실제 SVG 클릭 후 타패 채점, 대기 해설, 도라·화료패 표시를 확인했고 런타임 예외는 없었다.
- 확인 결과: tmp/tile-browser-check.json. 화면: tmp/tile-gallery.png, tmp/tile-app-desktop.png, tmp/tile-app-mobile.png, tmp/tile-app-score.png.
- 다시 보기: npm.cmd run dev 후 http://127.0.0.1:5173/ 접속. 기존 페이지는 새로고침한다. 전체 재검증: npm.cmd run check:web.

## 2026-09-23 최적 타패 레벨 선택 완료

사용자 요청으로 레벨 1(기존 기초)·2(유효패 비교)·3(복합 형태, 유효패 차이 1~2장)을 추가했다. 레벨별 문제 생성·채점·URL 재현·기록 분리 및 모바일 선택 화면을 연결했다. 레벨 2·3은 각각 검증된 20개 형태의 수패 배치/숫자 반전을 사용하고 엔진으로 매번 재검증한다. 이전 기록과 레벨 없는 링크는 레벨 1로 호환한다.

npm.cmd run check:web 종료 코드 0: 12파일 456개 테스트, 타입·린트·라이브러리 및 웹 빌드 통과. 실제 Chrome에서 레벨/규칙/모드 전환, 답안 제출, 기록 분리, 재현, 모바일 배치를 확인했다. 세부 출제 기준·파일·재실행 방법은 [discard-levels.md](discard-levels.md)를 참고한다.

실행: npm.cmd run dev 후 http://127.0.0.1:5173/?mode=discard&rules=mamamo&level=3 접속.

## 2026-09-23 글자 크기 확대 및 웹 제목 변경

- 사용자 표기 그대로 웹 제목을 `lET'S PLAY MAHJONG`으로 변경했다. 브라우저 탭, 사이드바 브랜드, 손패 보드 표기, 푸터, 페이지 설명과 JavaScript 비활성 안내에 반영했다. 규칙 프로필명은 마마모 로컬룰로 유지한다.
- `web/readability.css`: 주요 설명 16~17px, 해설 16px, 레벨 설명 14px, 해설 표 14px로 확대했다. 보조 안내·입력 라벨·버튼도 확대하고 모바일 단어 줄바꿈과 지불 내역 배치를 조정했다.
- `npm.cmd run check:web` 종료 코드 0: 12파일 456개 테스트, YAML·카탈로그·타입·린트·라이브러리 및 웹 빌드 통과.
- 실제 Chrome에서 1440·900·390·320px 너비 및 타패·대기·점수 화면의 제목, 계산된 글자 크기, 주요 영역 가로 넘침과 해설 표시를 회귀 확인했다. 런타임 예외와 가로 넘침 없음. PC·모바일 스크린샷 확인 완료.
- 확인 기록: `tmp/readability-browser-check.json`; 화면: `tmp/readability-1440.png`, `tmp/readability-390.png`, `tmp/readability-score-mobile.png`.
- 다시 보기: `npm.cmd run dev` 후 http://127.0.0.1:5173/ 접속 또는 기존 화면 새로고침. 전체 검증: `npm.cmd run check:web`.

## 2026-09-23 화료 점수 계산표 버튼

- 화료 점수 연습에서 오른쪽 아래 `점수 계산표` 버튼으로 언제든 참고 창을 연다. 풀이 전·중·채점 후·일시정지 상태에서도 사용할 수 있다. 다른 연습에서는 버튼을 숨긴다.
- 자/친, 론/쯔모 전환, 20·25·30~110부 × 1~4판, 만관 이상, 본장·공탁 안내를 제공한다. 현재 선택한 규칙과 문제의 친/자·화료 방법을 처음 표시한다.
- `src/practice/score-reference.ts`는 기존 calculateScore와 RuleContext로 표를 만든다. 표준 프로필의 절상만관 적용·카즈에 미적용, 마마모의 절상만관 미적용·카즈에 적용을 각각 반영한다. 20·25부 행은 점수 환산값이며 실제 화료 성립 조건은 별도라는 안내를 표시한다.
- `web/score-reference.ts`, `web/score-reference.css`: 접근성 이름이 있는 dialog, 닫기·Escape·바깥 클릭, 열기 버튼으로 초점 복귀, 모바일 가로 스크롤 안내를 구현했다. 표를 보는 동안 타이머만 정지하고 입력값·문제·채점 상태는 유지한다. 기존 수동 일시정지 상태를 임의 해제하지 않는다.
- `npm.cmd run check:web` 종료 코드 0. 13파일 465개 테스트, YAML·카탈로그·타입·린트·라이브러리 및 웹 빌드 통과. 점수표 회귀 테스트 9개 추가.
- 최종 빌드 후 Chrome에서 표 열기, 친/자·론/쯔모 금액, 타이머 정지·재개, 답안 보존, Escape·초점, 수동 일시정지 유지, 해설 후 열기, 규칙 전환 및 모바일 표시를 확인했다. 런타임 예외 없음.
- 확인 기록: `tmp/score-reference-browser-check.json`; 화면: `tmp/score-reference-desktop.png`, `tmp/score-reference-mobile.png`, `tmp/score-reference-additions.png`.
- 실행: `npm.cmd run dev` 후 http://127.0.0.1:5173/?mode=score 접속. 기존 화면은 새로고침한다. 재검증: `npm.cmd run check:web`.

## 2026-09-23 판정 문구와 제목 가독성 수정

- 타패 해설 표의 `다른 선택`을 `효율 낮음`으로 변경했다. 최적·공동 최적 및 채점 기준은 동일하다.
- 제목을 `LET'S PLAY MAHJONG`으로 대문자 L까지 통일했다. 브랜드·푸터·보드 제목은 Arial 계열 글꼴로 표시한다.
- `npm.cmd run check:web` 종료 코드 0: 13파일 465개 테스트, 규칙·타입·린트 및 라이브러리/웹 빌드 통과.
- Chrome에서 1440·900·390·320px 화면, 세 연습 모드, 제목/폰트/판정 문구/가로 넘침을 확인했다. 결과: `tmp/brand-browser-check.json`; 화면: `tmp/brand-1440.png`, `tmp/brand-390.png`.
- 남은 요청: 제목 옆 發 패를 사용자 본인의 작은 픽셀 캐릭터로 교체. 현재 원본 이미지 경로나 외형 특징을 질문한 상태이며, 자료가 없어 아직 아이콘은 교체하지 않았다. 자료 수신 후 imagegen으로 만들고 프로젝트 안에 저장·연결한다.
- 다시 보기: `npm.cmd run dev` 후 http://127.0.0.1:5173/ 접속 또는 새로고침. 재검증: `npm.cmd run check:web`.


## 2026-09-23 사용자 픽셀 아바타 적용 완료

- 위 자료 대기 요청은 해결했다. 사용자가 루트의 photo_2026-09-23_10-32-49.jpg를 제공했으며 내장 imagegen으로 픽셀 캐릭터를 만들었다.
- 검은 묶음머리·웃는 표정·리본 블라우스를 반영한 투명 PNG: web/assets/player-avatar.png. 제목 옆 發 패와 탭 파비콘을 교체했다. 브랜드 아바타 44×48px, 좁은 사이드바 30×41px, image-rendering:pixelated.
- 프롬프트와 제작 방식: docs/avatar-prompt.md. 원본 사진은 웹 코드에서 사용하지 않는다.
- 최종 npm.cmd run check:web 종료 코드 0: 465개 테스트·타입·린트·라이브러리/웹 빌드 통과. Chrome에서 1440·900·390·320px 및 세 모드의 이미지 로딩·투명 배경·제목·판정 문구·넘침 확인 통과. 런타임 예외 없음.
- 이미지 복사 당시 Vite 파일 감시가 EBUSY로 종료되어 미리보기 서버를 재시작한 뒤 검증했다. 최종 결과 tmp/avatar-browser-check.json, 화면 tmp/avatar-1440.png 및 tmp/avatar-390.png.
- 실행: npm.cmd run dev 후 http://127.0.0.1:5173/ 접속. 기존 화면 새로고침. 검증: npm.cmd run check:web.

## 2026-09-23 아바타 확대·재사용 파일·방문자 수

- 기존 픽셀 아바타의 표시 크기를 PC 96px(좁은 사이드바 88px), 모바일 80px로 키웠다. 투명 PNG 원본을 `artifacts/avatar/mahjong-avatar-transparent.png`에 별도로 복사하고 `artifacts/mahjong-avatar.zip`도 만들었다. 페이지 푸터에 PNG 다운로드 링크를 추가했다. 두 PNG의 해시가 같음을 확인했다.
- 사이트 공용 방문자 수를 오늘/누적으로 표시한다. Vite 개발·미리보기와 운영 Node 서버 모두 `/api/visitors`를 제공하며, 서버 파일에 저장한다. 브라우저별 중복과 한국 시간의 날짜 경계, 오류 표시, 서버 재시작 및 운영 파일 제공 방식을 구현했다. 자세한 집계 기준·운영 명령·영구 저장 조건은 `docs/visitors.md`.
- `npm.cmd run check:web` 종료 코드 0. 14파일 472개 테스트, 타입·린트·라이브러리와 웹 빌드 모두 통과. 새 방문자 관련 회귀 테스트 7개 포함.
- 운영용 서버 HTTP 검증 `node tmp/check-production-counter.mjs` 통과: 정적 페이지, 공용 집계, 같은 쿠키 재방문, 비공개 파일 차단 확인. 개발 서버 Chrome 확인 `node tmp/check-identity-browser.mjs` 통과: 1440·900·390·320px, 세 연습 모드, 투명 PNG와 96/88/80px 표시, 다운로드 링크, 방문자 수, 다른 쿠키, API 장애 표시, 가로 넘침 및 런타임 예외 확인. 화면: `tmp/identity-390.png`, `tmp/visitors-footer-mobile.png`; 결과: `tmp/identity-browser-check.json`.
- `AGENTS.md`는 기존 파일을 확인했고 사용자 요청에 따라 수정하지 않았다.
- 실행: `npm.cmd run dev` → http://127.0.0.1:5173/ (개발) 또는 `npm.cmd run start:web` → http://127.0.0.1:3000/ (빌드된 운영용 로컬 서버). 실제 공개 배포 주소는 제공되지 않아 인터넷 배포는 하지 않았다.

## 2026-09-23 다운로드 링크 제거와 공개 방법 조사

사용자 요청으로 푸터의 `아바타 PNG 저장` 링크와 전용 CSS를 제거했다. 별도 PNG/ZIP 파일은 `artifacts` 안에 보존했다. 사이트를 다른 사람에게 공개하는 구체적 방법과 방문자 파일 보존 조건은 [public-access.md](public-access.md)에 정리했다. 원본 사진은 `.gitignore`에 추가했다. 실제 공개 주소는 아직 생성하지 않았다.

`npm.cmd run check:web` 종료 코드 0: 14파일 472개 테스트, 타입·린트·웹 빌드 통과. 다시 보기: `npm.cmd run dev` 후 http://127.0.0.1:5173/ 접속 또는 새로고침.

최종 Chrome 확인: `node tmp/check-public-share-browser.mjs` 종료 코드 0. PC 1440·900px, 모바일 390·320px 및 세 모드에서 다운로드 링크 없음, 아바타·방문자 수 정상, 가로 넘침·런타임 예외 없음. 결과: `tmp/public-share-browser-check.json`. 사용자가 설치한 공개 터널은 없어 외부 인터넷 주소는 아직 발급하지 않았다.

## 2026-09-23 개발 지침 최신화

`AGENTS.md`, `README.md`, `docs/RESUME.md`, `docs/engine-validation.md`, `docs/TOMORROW.md`의 현행 상태를 코드에 맞게 정리했다. 새 코드 변경 없음. 이전 `npm.cmd run check:web` 결과(14파일 472개 테스트) 유효. 재개 시 `docs/TOMORROW.md`를 읽는다.
