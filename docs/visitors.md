# 사이트 방문자 수와 실행

## 집계 기준

화면 하단에 오늘/누적 방문자를 표시한다. 모든 브라우저가 같은 서버의 `/api/visitors`에 접속하여 공용 파일에 집계한다. localStorage의 개인 방문 횟수가 아니다.

- 오늘: 한국 시간(UTC+9) 하루 동안 방문한 서로 다른 브라우저 수.
- 누적: 집계를 시작한 뒤 방문한 서로 다른 브라우저 수. 같은 브라우저가 다음 날 방문해도 누적은 증가하지 않는다.
- HttpOnly/SameSite=Lax 쿠키의 무작위 식별자를 사용한다. 서버에는 식별자의 SHA-256 해시와 마지막 방문일만 저장한다. 이름·사진·IP 주소는 기록하지 않는다.
- 쿠키 삭제, 다른 기기/브라우저, 시크릿 창, 쿠키 만료(마지막 방문부터 1년)는 새 방문자로 셀 수 있다. 사람 단위의 정확한 고유 인원이나 봇 제외 통계는 아니다.
- 방문 시 한 번 집계한다. 같은 쿠키의 새로고침·문제/모드 전환은 중복 집계하지 않는다. 최초 쿠키를 받기 전 여러 탭을 동시에 열면 중복될 수 있다.
- API나 저장소에 오류가 있으면 숫자를 지어내지 않고 `—`와 일시적인 조회 불가 안내를 표시한다. 게임은 계속 사용할 수 있다.

## 로컬 개발

`npm.cmd run dev` → http://127.0.0.1:5173/.
Vite 서버가 API도 제공한다. `.data/visitors-dev.json`에 저장한다. `npm.cmd run preview`는 `.data/visitors-preview.json`을 사용한다. 개발/화면 테스트 방문자는 운영 집계와 분리한다.

## 운영용 실행

Node.js 24와 영구 저장이 가능한 서버를 사용한다. 프로젝트 루트에서 다음 순서로 실행한다.

```powershell
npm.cmd run check:web
npm.cmd run start:web
```

http://127.0.0.1:3000/ 에서 빌드된 `web-dist`와 공용 방문자 API를 함께 제공한다. 이미 빌드되어 있으면 `start:web`만 실행한다. 빌드 또는 운영 파일 수정 후에는 서버를 재시작한다.

환경 변수:
- `PORT`: 기본 3000.
- `HOST`: 기본 127.0.0.1. 외부 서버에서 직접 수신하려면 해당 배포 환경에 맞게 설정한다.
- `VISITOR_DATA_FILE`: 기본 `.data/visitors.json`, 프로젝트 기준 상대 경로 또는 절대 경로. 운영 시 영구 볼륨의 파일 경로를 지정한다.

동일 파일을 사용하는 Node 프로세스는 하나만 실행한다. 한 프로세스 안의 동시 요청은 순차 저장하고 임시 파일 작성 후 교체한다. 다중 서버/서버리스 환경은 별도 공유 데이터베이스 연결이 필요하다. `.data`를 백업하고 배포/재빌드 때 유지한다. `.gitignore`에서 제외했고 웹 정적 파일로 제공하지 않는다. 잘못된 저장 파일은 0으로 초기화하지 않고 오류로 처리한다.

공개 배포 주소는 아직 지정되지 않았다. 현재 구현과 확인은 로컬 서버에서 완료했다. `web-dist` 파일만 정적 호스팅에 올리면 API가 없으므로 방문자 집계는 작동하지 않는다. 실제 공개 운영은 위 Node 서버를 배포하고 영구 저장소를 연결해야 한다.

## 파일과 재검증

- 서버: `src/server/visitors.ts`, `scripts/serve-web.mjs`, `vite.config.ts`.
- 화면: `web/visitors.ts`, `web/identity.css`, `web/main.ts`.
- 회귀 테스트: `tests/server/visitors.test.ts` (별도 브라우저·재방문·재시작·한국 날짜 경계·동시 요청·손상된 저장소·HTTP 쿠키/메서드/오류).
- 전체 검증: `npm.cmd run check:web`.
- 운영 HTTP 확인: `node tmp/check-production-counter.mjs` (별도 임시 데이터 파일).
- Chrome 확인: `node tmp/check-identity-browser.mjs` (별도 임시 브라우저 프로필, 개발 집계 파일 사용).

구현 참고: [Node 파일 시스템 문서](https://nodejs.org/api/fs.html), [Vite 서버 플러그인 문서](https://vite.dev/guide/api-plugin.html).
