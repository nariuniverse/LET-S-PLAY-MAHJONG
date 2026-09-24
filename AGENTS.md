# Repository Guidelines

## 작업 위치와 재개

실제 개발 루트는 `C:\AI\mamamo`다. 이전 원본 `C:\Users\QCELLS\Documents\mamamo-trainer`는 수정하지 않는다. 재개할 때 `README.md`, `docs/RESUME.md`, `docs/engine-validation.md`, `docs/TOMORROW.md`를 먼저 읽는다. 현재 규칙 엔진과 최적 타패(레벨 1·2·3), 청일색 대기, 화료 점수 웹 연습이 구현되어 있다. 화료 점수 계산표를 언제든 열 수 있다. 제목은 `LET'S PLAY MAHJONG`, 타패 판정 표시는 `최적 / 공동 최적 / 효율 낮음`이다. 공개 주소는 `https://lets-play-mahjong.onrender.com/`이며 Render 무료 플랜에서 운영한다.

## 프로젝트 구조

- `rules/`: 표준 리치마작·마마모 로컬룰의 YAML 원문과 승인 보완값.
- `src/`: 규칙 엔진과 `practice/` 문제 생성·채점; `server/`는 공용 방문자 수 API.
- `web/`: Vite/TypeScript 화면, SVG 패, 픽셀 아바타. 별도 원본 PNG는 `artifacts/avatar/`에 보관하며 웹페이지에 다운로드 링크를 두지 않는다.
- `tests/`: Vitest의 `unit/`, `practice/`, `regression/`, `random/`, `server/`.
- `docs/`: 검증·진행 기록, 방문자 집계와 공개 방법. `dist/`, `web-dist/`는 빌드 결과.

## 실행·검증 명령

PowerShell에서 `npm.cmd`를 사용한다. `npm.cmd ci`는 의존성을 설치한다. `npm.cmd run dev`는 로컬 웹 `http://127.0.0.1:5173/`을 연다. `npm.cmd run check:web`은 YAML·카탈로그·타입·ESLint·전체 테스트·엔진/웹 빌드를 검증한다. 운영용 로컬 서버는 빌드 후 `npm.cmd run start:web`으로 `http://127.0.0.1:3000/`에서 실행한다. 마지막 전체 검증은 14파일 472개 테스트 통과였다.

## 코드와 규칙

TypeScript strict 설정과 기존 코드의 2칸 들여쓰기·camelCase 함수/변수·PascalCase 타입을 따른다. ESLint를 통과시킨다. `src/generated/catalog.ts`를 직접 편집하지 않는다. 정답을 바꾸는 모호한 규칙은 일반 마작 지식으로 임의 확정하지 말고 `rules/`의 명세와 승인값을 따른다.

## 테스트와 작업 기록

의미 있는 코드 변경에는 해당 `tests/**/*.test.ts` 회귀 테스트를 추가하고 `npm.cmd run check:web`을 실행한다. 실패를 숨기려고 테스트를 삭제하거나 약화하지 않는다. UI 변경은 PC·모바일에서 확인한다. 변경 후 상태·재실행 방법을 `docs/RESUME.md`와 관련 문서에 남긴다.

## 방문자 수와 공개

방문자 수는 Node 서버 파일 `.data/visitors.json`에 저장한다. 정적 호스팅만 하면 API가 작동하지 않는다. `.data/`와 원본 사진은 공개 저장소에 넣지 않는다. 임시 공개·고정 주소 절차는 `docs/public-access.md`에 있다. 이 폴더에는 Git 이력이 없어 기존 커밋 규칙은 없다. Git을 도입하면 변경 목적을 제목에 쓰고 PR에는 동작 변화·검증 결과·UI 스크린샷을 적는다.
