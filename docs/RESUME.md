# 개발 재개 기록 — 2026-09-22부터

## 최신 상태 — 2026-09-24

현재 규칙 엔진과 세 가지 웹 연습, 레벨 선택, 점수 계산표, 픽셀 아바타, 사이트 공용 방문자 수가 구현되어 있다. 웹의 아바타 다운로드 링크는 제거했다. 재개 명령과 공개 운영 상태는 [TOMORROW.md](TOMORROW.md), 작업 원칙은 [AGENTS.md](../AGENTS.md)를 확인한다. 마지막 `npm.cmd run check:web`: 14파일 472개 테스트·타입·린트·엔진/웹 빌드 통과. 공개 주소는 `https://lets-play-mahjong.onrender.com/`이다.


## 작업 위치

모든 후속 코드·테스트·규칙·문서는 `C:\AI\mamamo`에 저장한다. 원본 위치는 `C:\Users\QCELLS\Documents\mamamo-trainer`이며 보존했다. 원본의 소스·규칙·PDF·테스트·설정·기존 빌드 산출물 81개를 옮기고 내용 일치를 확인했다. PDF 분석용 임시 도구와 Git 메타데이터는 개발 소스로 취급하지 않는다. 의존성은 기존 설치본을 복사했고 `package-lock.json`으로 다시 설치할 수 있다.

수정 전 백업: `.backups/mamamo-before-resume-20260922.zip`.

## 어제 대화에서 확인한 승인

저장된 대화 `01a0c192-d4ae-71a3-a86b-f338141a6385`에서 E01–E05에 대한 “권장사항대로 진행”, B01–B03에 대한 “권장사항 반영” 답변을 확인했다. `engine-resolutions.yaml`의 승인 상태와 일치한다. 과거 README와 `engine-preflight-report.md`는 B01–B03 반영 이전 상태라 실제 코드보다 오래되었다.

2026-09-22 당시 작업 범위는 규칙 엔진·자동 테스트·문서·성능 검증이었다. 그 뒤 사용자 요청에 따라 웹 UI를 구현했다. 공개 배포는 아직 수행하지 않았다.

## 현재 코드와 실행

`npm.cmd run check`로 YAML·카탈로그·타입·린트·전체 테스트·빌드를 확인한다. `npm.cmd run example`로 실제 API 예제를 실행하고, `npm.cmd run bench`로 성능을 측정한다. 최종 검증 결과와 제한사항은 `engine-validation.md`를 확인한다.

개발을 중단하기 전에는 변경 내용을 파일에 저장하고 이 문서와 검증 보고를 갱신한다. 대화가 닫혀도 이 파일들과 README를 읽어 재개할 수 있다.

## 이번 재개 완료

2026-09-22: B01–B03 권장안을 사용자가 다시 확정했다. 코드 검토에서 발견한 2판 조건 우회와 입력 검증 오류를 수정했다. 전체 288개 테스트, 타입 검사, 린트, 빌드, 사용 예제가 통과했다. 성능 원본은 engine-benchmark.json, 상세 결과는 engine-validation.md에 저장했다. 다음 범위는 문제 생성·정답 검증 연결 및 웹 UI다.

## 2026-09-23 웹 실행 확인

기존 문서의 웹 UI 미구현 설명은 과거 상태다. 현재 src/practice와 web에는 타패·청일색 대기·화료 점수 문제 생성, 채점, 해설, 풀이 시간, 브라우저 내 학습 기록이 구현되어 있다. 이 시점에는 난이도 선택 전이었다.

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

## 2026-09-23 제목 L 및 판정 문구 후속 수정

`다른 선택` → `효율 낮음`, 제목 → `LET'S PLAY MAHJONG` (대문자 L + Arial). 전체 check:web 및 Chrome 반응형 확인 통과(465개 테스트). 상세 내용은 docs/web-progress.md의 같은 날짜 후속 항목을 참고한다. 실행: npm.cmd run dev 후 http://127.0.0.1:5173/.

완료: 사용자가 제공한 photo_2026-09-23_10-32-49.jpg를 바탕으로 내장 imagegen으로 픽셀 아바타를 제작했다. web/assets/player-avatar.png를 제목 옆 發 아이콘과 파비콘 대신 연결했다. 생성 프롬프트: docs/avatar-prompt.md. 전체 검증 및 Chrome PC·모바일 확인 통과.

## 2026-09-23 사용자 아바타·방문자 수 완료

PC/모바일 아바타 확대, 별도 투명 PNG/ZIP, 화면 다운로드 링크, 사이트 공용 오늘·누적 방문자 수 구현. `npm.cmd run check:web`에서 14파일 472개 테스트와 웹 빌드가 통과했다. 운영 서버와 Chrome PC·모바일 검증 결과는 docs/web-progress.md 마지막 항목, 집계 및 배포 방법은 docs/visitors.md 참조. 개발: npm.cmd run dev; 로컬 운영: npm.cmd run start:web.

이후 사용자 요청에 따라 AGENTS.md를 현재 개발 상태로 갱신했다.

## 2026-09-23 다운로드 링크 제거와 사이트 공유 방법

웹페이지의 아바타 PNG 다운로드 링크를 제거했다. 별도 PNG/ZIP 파일은 보존했다. 공개 방법과 방문자 파일 유지 조건은 docs/public-access.md에 기록했다. 전체 472개 테스트와 웹 빌드 통과. 이어진 사용자 요청으로 AGENTS.md와 재개 문서를 갱신했다.

## 2026-09-23 작업 종료 — 내일 바로 재개

현재 상태와 실행 명령은 [TOMORROW.md](TOMORROW.md)에 모았다. 모든 코드·규칙·테스트·웹 빌드·재사용 아바타는 `C:\AI\mamamo`에 저장했다. 최종 검증 14파일 472개 테스트 및 타입·린트·빌드 통과, 최종 브라우저 확인 `tmp/public-share-browser-check.json` 통과. 다음 작업은 `docs/public-access.md`에 정리한 공개 방식 선택과 실행이다. 공개 주소는 아직 없으며 로컬에서 재개 가능하다.

## 2026-09-23 작업 지침 및 재개 문서 정리

사용자 요청에 따라 `AGENTS.md`를 현재 개발 범위와 실행·검증 규칙으로 갱신했다. `README.md`, `docs/RESUME.md`, `docs/engine-validation.md`, `docs/TOMORROW.md`도 최신 웹 기능·방문자 수·공개 미완료 상태와 일치하도록 바로잡았다. 코드 변경은 없으며 마지막 전체 검증은 14파일 472개 테스트 통과다. 잘못 이해해 새로 만들었던 `mamamo-current-20260923-155958.zip`과 해시 파일은 삭제했고 기존 `.backups` 파일은 보존했다.

## 2026-09-24 Render 무료 배포 준비

사용자가 Render 무료 서버를 선택했다. 루트에 `render.yaml`(무료 Node 웹 서비스, 빌드·시작 명령, HOST)과 `.node-version`(24)을 추가하고 `.gitignore`에서 별도 아바타 원본과 규칙 PDF·아바타 프롬프트를 제외했다. 배포 절차는 `docs/public-access.md`를 갱신했다. 공개 URL 발급에는 GitHub 저장소와 Render 계정 연결이 필요하다. 방문자 수 파일은 무료 서버의 유휴 종료·재시작·재배포 때 초기화될 수 있다.

`npm.cmd run check:web` 종료 코드 0: 14파일 472개 테스트, 타입·린트·엔진/웹 빌드 통과. `HOST=0.0.0.0`으로 운영 서버를 띄워 화면과 방문자 API에서 HTTP 200을 확인했다. 로컬 Git 저장소를 초기화하고 파일을 스테이징했으며 제외 대상이 들어가지 않았음을 확인했다.

이후 사용자 지정 GitHub 주소 `https://github.com/nariuniverse/LET-S-PLAY-MAHJONG`을 `origin`으로 설정하고 로컬 첫 커밋 `3af903f`을 만들었다. GitHub 연결은 현재 세션에서 미활성으로 확인됐고 Git CLI에도 인증 정보가 없어 원격 이력을 읽거나 푸시하지 못했다. Render 배포는 아직 시작되지 않았다.

Git 자격 증명 도구에서 사용자가 직접 로그인한 뒤 빈 원격 저장소를 확인하고 `main`을 푸시했다. 원격 커밋 `ef96412` 확인 완료. 공식 Render CLI v2.28.0을 `tmp/render-cli/`에 다운로드하고 SHA-256을 검증했지만 CLI 인증 승인 화면이 열리지 않아 중단했다. 사용자가 Render 대시보드에서 **New > Blueprint**로 저장소를 연결한 후 발급된 주소를 보내면 외부 동작을 검증한다.

사용자가 Render 대시보드에서 Blueprint를 배포해 `https://lets-play-mahjong.onrender.com/`를 발급했다. 외부 HTML·JS·CSS, 방문자 API GET·POST 모두 HTTP 200. 시험 방문 1건이 집계되고 쿠키가 설정됐으며 조회에서 같은 수치를 확인했다. Render 무료 서버이므로 유휴 종료·재시작·재배포 때 파일 기반 방문자 기록은 초기화될 수 있다.
