# 표준 리치마작 기본 프로필

`standard-riichi`는 이 프로젝트의 선택 가능한 4인 프로필 이름이며, 유일한 국제 표준이라는 주장이 아니다. 기준은 [EMA 2025 규칙집의 네덜란드 마작연맹 공개본](https://mahjongbond.org/wp-content/uploads/2025/10/riichi_rulebook_2025_final_draft_26.09.2025.pdf)이다. 일본식 4인 리치 규칙의 명확한 한 변형을 택했다. 천봉·작혼·일본 프로 단체의 다른 옵션은 섞지 않았다.

배포 파일명은 `riichi_rulebook_2025_final_draft_26.09.2025.pdf`, 내부 표기는 `2025 edition`, 서문은 August 2025다. 따라서 이 파일 스냅샷을 정확히 고정하고 다른 최종 배포본과 동일하다고 단정하지 않는다. 확인일 2026-09-21, 46쪽, SHA-256 `7B4713EB0F405FADE8E8268C78088785A8253AE761E44513983A474F2EABD1F0`. EMA 사이트 원본 링크는 도구에서 오류가 나 연맹의 공개 미러를 읽었다. 마마모 원본 분석은 이 자료와 독립적이다.

프로젝트 선택은 규칙집 안의 **비대회(casual)** 분기다. 따라서 촌보는 경기 종료 후 -20000점이 아니라 역만관 지불을 쓴다(17쪽). 시간제 대회 제한과 대회 등록 절차는 연습 규칙에서 사용하지 않는다. 2텐파이 대 2노텐은 총액 1500씩을 보존하고 화면상 송금 행렬만 각 상대에게 750으로 정규화한다. 이는 문서가 특정 상대 짝을 유일하게 지정했다는 뜻이 아니다.

## 기본값

아래 값은 미정 옵션 목록이 아니라 확정된 기본 프로필이다. 변경 가능 값은 YAML의 `options`에 구조화했다. 기본값 변경 시 완전한 정책과 새 프로필 버전이 필요하다.

|항목|옵션 ID|기본값|근거 PDF/인쇄 쪽|
|---|---|---|---|
|인원|`players`|`4`|7|
|시작점수|`startingPoints`|`30000`|6|
|반환점|`returnPoints`|`30000`|18|
|동장전/반장전|`gameLength`|`"east-south"`|10|
|쿠이탕|`kuitan`|`true`|23|
|아토즈케|`atozuke`|`true`|10, 15|
|적도라|`redFives`|`false`|6|
|더블론|`doubleRon`|`true`|11, 16|
|트리플론|`tripleRon`|`true`|11, 16|
|삼가화 처리|`tripleRonResolution`|`"all_win"`|11, 16|
|도중유국|`abortiveDraws`|`false`|16|
|사풍연타|`fourWindsAbort`|`false`|16|
|사가리치|`fourRiichiAbort`|`false`|16|
|사깡산료|`fourKansAbort`|`false`|12, 16|
|구종구패|`nineTerminalsAbort`|`false`|16|
|토비 종료|`bankruptcyEndsGame`|`false`|18, 22|
|서입|`westExtension`|`false`|18|
|절상만관|`kiriageMangan`|`true`|22|
|카즈에역만|`kazoeYakuman`|`false`|22, 23|
|복합역만|`multipleYakuman`|`false`|23|
|더블역만|`doubleYakuman`|`false`|25, 26|
|책임지불|`pao`|`true`|13|
|책임지불 대상|`paoYaku`|`["yaku.daisangen","yaku.daisuushii"]`|13|
|노텐벌금 총액|`notenTotal`|`3000`|16|
|연장봉 론|`honbaRon`|`300`|17|
|연장봉 쯔모 각 상대|`honbaTsumoEach`|`100`|17|
|리치봉|`riichiDeposit`|`1000`|14|
|친 연장|`dealerContinuation`|`"win_or_exhaustive_tenpai"`|17|
|형식 텐파이|`formalTenpai`|`true`|13|
|프리텐|`furiten`|`true`|13, 15|
|임시 프리텐 해제|`temporaryFuritenRelease`|`"next_draw_or_claim"`|13|
|리치 후 안깡|`riichiAnkan`|`"waits_and_all_decompositions_unchanged"`|14|
|국사 안깡 창깡|`kokushiRobAnkan`|`true`|15, 25|
|오픈리치|`openRiichi`|`false`|23, 24, 25, 26|
|리치 최소 패산|`riichiMinimumLiveTiles`|`1`|14|
|연풍 머리부|`doubleWindPairFu`|`2`|21|
|오라쓰 친 선택 종료|`allLastDealerStop`|`false`|17, 18|
|유국만관|`nagashiMangan`|`false`|23, 24, 25, 26|
|인화|`renhou`|`"exclusive_mangan"`|25|
|촌보 지불|`chombo`|`"casual_reverse_mangan"`|17|

## 읽을 때 주의할 프로필 차이

EMA 2025는 적도라·유국만관·도중유국·토비·서입·오픈리치를 사용하지 않는다. 세 명 론도 모두 정산하며 각 화료자에게 본장을 지불한다. 만관 절상은 4판30부와 3판60부에 적용한다. 11판 이상은 삼배만이고 판수역만은 없으며 역만끼리 더하거나 특수 대기에 두 배를 주지 않는다. 연풍 머리는 2부다. 인화는 다른 역·도라와 더하지 않는 5판이다. 근거는 같은 규칙집 11–26쪽이며, 정확한 규칙별 쪽수는 [YAML](standard-riichi-rules.yaml)에 있다.

아토즈케 `true`는 '화료 시 최소 1역'이라는 조건을 프로젝트 옵션명으로 표현한 것이다. 부름 순간 역 확정을 요구하는 추가 조건을 만들지 않았다. 순수 14패 효율의 기본 목표는 [설계 초안](engine-interface.md)에 있으며 규칙집 자체의 규칙으로 주장하지 않는다.

## 옵션 변경 계약

`options.<id>.default`와 `allowedValues`를 제공하지만 불완전한 조합을 허용하지 않는다. 예컨대 오픈리치 true를 택하면 공개 범위·공탁·프리텐·위험패 타패·벌금 규칙도 필요하다. `paoYaku`는 목록형 옵션이고 대상별 책임 발생 조건이 동반되어야 한다. 마마모 파일에서 누락값을 가져와 채우지 않는다. 기본 프로필 그대로의 점수식은 YAML `score.formula`에 완결되어 있으며, 표준 판정에 마마모 점수표를 참조하지 않는다.
