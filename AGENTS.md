# 개발 원칙

- 작업 루트는 `C:\AI\mamamo`다. 보존용 원본 `C:\Users\QCELLS\Documents\mamamo-trainer`는 수정하지 않는다.
- 새 세션에서는 먼저 `AGENTS.md`와 `PROJECT_STATUS.md`를 읽는다. 마작 판정이나 규칙을 다룰 때 `MAHJONG_RULES.md`를 확인한다. 그다음 현재 작업과 직접 관련된 코드·문서만 확인한다. 전체 저장소와 긴 기록을 매번 다시 읽지 않는다.
- 기존 구현과 테스트를 먼저 확인한다. 이미 있는 기능을 재구현하지 않고, 정상 작동하는 기능을 요청 없이 임의로 변경하지 않는다.
- 마작 구현은 `MAHJONG_RULES.md`가 안내하는 규칙 YAML과 승인 보완값을 기준으로 한다. 정답을 바꾸는 모호함을 일반 마작 지식으로 임의 확정하지 않는다. `src/generated/catalog.ts`는 직접 편집하지 않는다.
- TypeScript strict, 기존 2칸 들여쓰기와 이름 규칙을 따른다. 의미 있는 코드 변경에는 관련 회귀 테스트를 추가하고 PowerShell에서 `npm.cmd run check:web`을 실행한다. 실패를 숨기려고 테스트를 삭제하거나 약화하지 않는다. UI 변경은 PC·모바일에서 확인한다.
- `.data/`, 원본 사진, `artifacts/`의 별도 아바타 파일은 Git에 넣지 않는다. 배포와 방문자 데이터의 현재 상태는 `PROJECT_STATUS.md`에서 확인한다.
- 의미 있는 기능 완료나 중요한 설계 변경 후 `PROJECT_STATUS.md`를 갱신한다. 상세 근거와 과거 과정은 관련 `docs/` 또는 `rules/` 문서에 둔다. 긴 로그와 테스트 출력 전체를 Context에 유지하지 않는다.
