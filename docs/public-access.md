# 다른 사람에게 웹페이지 공개하기

이 사이트는 Node 서버가 화면과 `/api/visitors`를 함께 제공한다. 개발 주소(5173) 대신 운영 주소(3000)를 공개한다. 정적 HTML만 올리면 방문자 수 API가 작동하지 않는다.

## 빠른 공유: Cloudflare Quick Tunnel

1. `npm.cmd run check:web`로 빌드·검증한다.
2. 첫 PowerShell에서 `npm.cmd run start:web`을 실행하고 http://127.0.0.1:3000/ 에 접속해 확인한다.
3. Cloudflare 공식 [Windows 다운로드](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/)에서 64비트 `cloudflared` 실행 파일을 설치한다.
4. 두 번째 PowerShell에서 `cloudflared tunnel --url http://127.0.0.1:3000`을 실행한다. 터미널에 표시되는 `https://…trycloudflare.com` 주소를 다른 사람에게 공유한다.
5. 외부 기기에서 그 주소로 문제와 방문자 수가 열리는지 확인한다. 서버·터널·PC가 모두 켜져 있어야 한다.

[공식 안내](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)에 따르면 이 방법은 계정과 도메인 없이 임시 주소를 만들며 테스트·개발용이다. 새 터널은 주소가 바뀐다. 로컬 `.data/visitors.json`은 PC에 남는다. Cloudflare 설정 폴더에 `config.yaml`이 있으면 Quick Tunnel이 동작하지 않을 수 있다. Windows의 `cloudflared`는 수동으로 갱신한다.

## 고정 주소로 계속 공개하기

- **Cloudflare 관리형 터널:** 본인 도메인과 Cloudflare 계정을 연결해 고정 호스트명을 운영 서버 3000번에 연결한다. [공식 설정](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)을 따른다. PC는 계속 켜 둬야 한다.
- **Render 무료 웹 서비스:** 저장소 루트의 `render.yaml`은 Node 웹 서비스의 `plan: free`, 빌드·시작 명령, `HOST=0.0.0.0`을 지정한다. `.node-version`은 Node 24를 지정한다. GitHub의 비공개 저장소에 코드를 올리고 Render에서 해당 저장소를 연결해 Blueprint를 만들면 `onrender.com` 공개 주소가 발급된다. 화면과 문제 기능은 작동하지만 [15분 무접속 종료와 재시작·재배포 시 파일 손실](https://render.com/docs/free/) 때문에 현재 파일 기반 방문자 수는 초기화될 수 있다. 무료 웹 서비스에는 영구 디스크를 붙일 수 없다.
- **Render 유료 웹 서비스:** 방문자 수 보존이 필요하면 `VISITOR_DATA_FILE=/var/data/visitors.json`을 지정하고 `/var/data`에 [영구 디스크](https://render.com/docs/disks/)를 마운트한다.

## Render 무료 배포 순서

1. GitHub에 비공개 저장소를 만들고 이 폴더의 Git 이력을 연결해 푸시한다. `.gitignore`에서 `.data/`, 원본 사진, `artifacts/`의 별도 아바타 파일을 제외한다. 웹에 표시되는 `web/assets/player-avatar.png`는 배포에 필요하므로 포함한다.
2. Render 대시보드에서 **New > Blueprint**를 선택하고 저장소를 연결한다. `render.yaml`의 무료 웹 서비스를 확인한 뒤 배포한다. [Blueprint 설정 문서](https://render.com/docs/infrastructure-as-code/).
3. 발급된 `https://…onrender.com/`에서 게임 화면과 `/api/visitors`를 확인한다. 15분 이상 접속이 없으면 다음 첫 방문의 시작에 약 1분이 걸릴 수 있다. 방문자 수는 재시작 후 초기화될 수 있다.

## 현재 상태

공개 주소는 아직 만들지 않았다. Render 무료 배포 설정을 준비했고 로컬 Git 첫 커밋 `3af903f`을 만들었다. 원격 주소는 사용자가 지정한 `https://github.com/nariuniverse/LET-S-PLAY-MAHJONG`으로 설정했다. GitHub 인증 연결이 확인되지 않아 원격 이력 조회와 푸시는 아직 못 했다. `npm.cmd run check:web`에서 14파일 472개 테스트와 빌드가 통과했고 `HOST=0.0.0.0` 운영 서버에서 화면·방문자 API의 HTTP 200을 확인했다. 이 PC에서 `cloudflared` 명령은 확인되지 않았다.
