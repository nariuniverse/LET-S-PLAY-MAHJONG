# 개발 재개 안내 — 2026-09-23

개발 루트: `C:\AI\mamamo`. 먼저 `README.md`, `docs/RESUME.md`, `docs/engine-validation.md`와 이 문서를 읽는다. 이전 원본 `C:\Users\QCELLS\Documents\mamamo-trainer`는 수정하지 않는다. `AGENTS.md`의 현재 작업 지침을 따른다.

## 현재 구현

- 리치마작 규칙 엔진과 두 규칙 프로필, YAML 검증·생성 카탈로그. `src/generated/catalog.ts`는 직접 수정하지 않는다.
- 웹의 최적 타패(레벨 1·2·3), 청일색 대기, 화료 점수 및 계산표. 실제 문양의 SVG 패, 타이머, 브라우저별 연습 기록, 모바일 대응.
- 제목 `LET'S PLAY MAHJONG`, 타패 표의 `최적 / 공동 최적 / 효율 낮음`.
- 사용자 사진에서 만든 픽셀 아바타. 웹 표시 크기는 PC 96px(좁은 화면 88px)·모바일 80px. 별도 투명 PNG는 `artifacts/avatar/mahjong-avatar-transparent.png`, ZIP은 `artifacts/mahjong-avatar.zip`. 웹페이지의 다운로드 링크는 제거한 상태.
- 사이트 공용 방문자 수(오늘/누적): Node 서버의 `/api/visitors`, 쿠키 중복 방지, 한국 시간 날짜 경계, `.data/visitors.json` 영구 파일. 개발 집계는 `.data/visitors-dev.json`로 분리. 집계 기준은 `docs/visitors.md`.

## 재실행

```powershell
cd C:\AI\mamamo
npm.cmd ci                  # node_modules가 없다면 한 번
npm.cmd run dev             # 개발 웹: http://127.0.0.1:5173/
```

운영용 로컬 서버는 `npm.cmd run check:web`로 검증·빌드한 다음 `npm.cmd run start:web`을 실행한다. 주소는 http://127.0.0.1:3000/. 마지막 전체 검증은 **14파일 472개 테스트, 타입 검사·린트·엔진/웹 빌드 모두 통과**. 다운로드 링크 제거 후 Chrome PC·모바일과 세 모드에서 가로 넘침·런타임 예외 없음. 결과는 `tmp/public-share-browser-check.json`, 더 자세한 기록은 `docs/web-progress.md`.

## 다음 선택

사용자는 Render 무료 배포를 선택했다. `render.yaml`과 `.node-version`을 준비했고 세부 절차는 `docs/public-access.md`에 있다. 다음 단계는 GitHub 비공개 저장소와 Render 계정을 연결해 Blueprint를 배포하고 `onrender.com` 주소를 확인하는 것이다. **아직 공개 주소 발급·배포는 하지 않았다.** 방문자 수 파일은 무료 서버의 유휴 종료·재시작·재배포 때 초기화될 수 있다. Git 저장소에 원본 사진이나 `.data`, `artifacts/`의 별도 아바타 파일을 넣지 않는다.
로컬 Git 첫 커밋 `3af903f`을 만들고 `origin`을 `https://github.com/nariuniverse/LET-S-PLAY-MAHJONG`으로 지정했다. GitHub 인증이 확인되지 않아 원격 조회와 푸시는 아직 못 했다. 전체 `check:web` 14파일 472개 테스트와 빌드, 운영 서버 화면·방문자 API의 HTTP 200을 확인했다.

## 작업 기록

최신 구현과 실행 방법은 이 문서, 검증은 `docs/engine-validation.md`, 날짜별 변경은 `docs/web-progress.md`를 참고한다. 작업을 마칠 때 `AGENTS.md`와 관련 문서가 실제 코드 상태를 설명하는지 갱신한다.
