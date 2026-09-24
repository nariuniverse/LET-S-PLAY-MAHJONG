# 현재 적용 규칙 안내

이 문서는 마작 구현을 시작할 때 읽는 짧은 안내다. 규칙의 세부 조건·출처·승인값은 아래 기존 파일이 정본이며, 이곳에 전체 규칙표를 복사하지 않는다.

| 범위 | 정본·설명 |
|---|---|
| 마마모 로컬룰 | [mamamo-rules.yaml](rules/mamamo-rules.yaml) — 원본 PDF 전사, 출처 쪽수, A01–A31 승인값 |
| 추가 승인 보완값 | [engine-resolutions.yaml](rules/engine-resolutions.yaml) — E01–E05·B01–B03. 마마모 YAML의 해당 항목보다 우선 |
| 표준 리치마작 프로필 | [standard-riichi-rules.yaml](rules/standard-riichi-rules.yaml) — EMA 2025 공개본 기반 4인 비대회 기본값. 해설은 [standard-riichi-profile.md](rules/standard-riichi-profile.md) |
| 두 프로필 비교·출처 | [rule-differences.md](rules/rule-differences.md), [source-index.md](rules/source-index.md) |
| 엔진 검증·제한 | [engine-validation.md](docs/engine-validation.md) |

## 현재 게임에 적용되는 핵심

- 두 프로필은 각각 독립적이다. 표준 규칙의 빈값을 마마모 규칙에서 채우거나 그 반대로 섞지 않는다. 둘 다 4인용이며 현재 적도라를 사용하지 않는다.
- `standard-riichi`는 EMA 규칙집의 비대회 분기를 고정한 프로젝트 프로필이다. 만관 절상은 적용하고 카즈에역만은 적용하지 않는다. 세 명 동시 론은 모두 화료로 정산한다.
- `mamamo`는 로컬 PDF와 사용자 승인값을 따른다. 만관 절상은 적용하지 않고 카즈에역만을 적용한다. 더블론은 둘 다 정산하고 트리플론은 도중유국으로 처리한다. 친의 화료 5회 연속 이후에는 모든 플레이어에게 도라를 제외한 최소 2판 조건이 적용된다. 정확한 조건·예외와 역만 조합은 YAML 및 승인 보완값을 확인한다.
- 패 표기는 `m` 만수, `p` 통수, `s` 삭수, `z` 자패(`1` 동·`2` 남·`3` 서·`4` 북·`5` 백·`6` 발·`7` 중)다. 이는 프로젝트 입력 표기이며 원문 규칙의 표기법이라고 주장하지 않는다.
- 연습의 타패 정답은 규칙 엔진에서 계산한 구조 샹텐과 유효패 장수로 결정한다. 화료 가능 여부에는 역·부·점수와 상황 입력을 적용한다. 상세 호출 계약은 `rules/engine-interface.md`와 `README.md`를 본다.

규칙을 바꿀 때는 YAML의 출처와 승인 상태를 먼저 확인하고, 판정에 영향을 주는 변경은 해당 회귀 테스트로 검증한다. 모호한 규칙을 새로 발견하면 임의로 답을 정하지 말고 문제 생성을 막는 기존 정책을 따른다. 카탈로그는 검증 명령으로 다시 생성하며 `src/generated/catalog.ts`를 직접 편집하지 않는다.
