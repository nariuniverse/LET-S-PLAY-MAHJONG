> 이 문서는 1단계 설계 제안을 보존한 기록이다. 현재 구현된 실제 API는 ../src/types.ts 및 ../README.md를 확인한다.

# 규칙 컨텍스트와 연습 판정 인터페이스 초안

이 문서는 데이터/인터페이스 제안이다. 웹게임, UI, TypeScript 엔진은 구현하지 않았다. 검증 스크립트의 예시 패 검사는 명세 검수 전용이며 실행 게임 엔진으로 사용하지 않는다.

## 파일과 값의 의미

- `ruleSet`는 `standard-riichi` 또는 `mamamo`이며 필수다. 전역 기본 규칙이나 다른 세트의 상속은 없다.
- `enabled: true`는 채택 확인, `false`는 비채택, `null`은 미확정이다. null을 거짓/0으로 바꾸지 않는다.
- 일반역의 `closedValue/openValue`는 **역 자체의 판수**다. openValue null은 멘젠 한정이다. 값 0인 무역과 다르다. 역만은 두 판수 필드를 사용하지 않고 `yakumanMultiplier` 및 `openEligible`로 표현한다. 인화처럼 고정 한도인 항목은 `paymentRules.fixedLimit`를 먼저 본다.
- `conditions`는 선언적 조건 데이터다. 이름이 같은 조건 키의 의미를 숨은 프로그램 관행으로 보충하지 않는다. `null`, `unresolved`, `ambiguityIds`가 있는 정책은 관련 입력에서 확정 판정을 할 수 없다. `notes`의 문장·원문은 실행 명령이 아니다.
- `confidence: high`는 글자/값을 명확히 읽었다는 뜻이다. 미기재 조건까지 확정되었다는 뜻이 아니다. medium은 해석·파생 포함, low는 판독 약함, unknown은 알 수 없음이다.
- 명시된 `exclusions`와 `stackingRules.included`는 중복 금지/이미 포함됨이다. 둘은 추가 판수를 주지 않는다. 마마모의 포괄 중복 규칙은 A04가 해결되기 전 추정하지 않는다.
- 완성패 예시는 총 14장 또는 깡 수만큼 추가된 물리 패다. `winningTile: null`, `winMethod: null`, `openMelds: null`은 원문에서 그 정보가 주어지지 않았다는 뜻이다. 모든 그림을 멘젠론 예시로 간주하지 않는다.
- 패 문자열은 m=만, p=통, s=삭, z=동남서북백발중(1–7). 그룹 순서는 유지했지만 정렬을 강제하지 않는다. 0은 적5로 자동 해석하지 않는다. 원문에 수패 종류가 없는 쿠이카에 예는 rank-only로 보존한다.

## 계층

|계층|공통 작업|규칙별 정책|
|---|---|---|
|표현/파서|문자열 문법, 패 ID, 물리 매수 벡터|허용 종류·장수·적패 구성|
|형태 분해|순쯔·커쯔·머리 후보 열거, 고정 부로 보존|채택 화료형·깡·치또이·국사·특수형|
|샹텐/텐파이/대기|후보 손과 한 패 추가 후보 열거|화료형별 거리·노텐 정의·물리 매수 제한|
|합법 화료|입력 이력 연결|역 요구·두판묶음·프리텐·오픈리치|
|역·판·부|하나의 일관된 분해에 증거 연결|역 카탈로그·배타·중복·부·최대 점수 선택|
|점수/지불|가산 항목과 송금 행렬 표현|한도·반올림·본장·공탁·책임·복수 화료|
|진행/벌칙|사건 기록, 국 상태 표현|리치·부름·유국·친 연장·벌칙|
|연습|문제 데이터·시간 기록·해설 근거|생성 가능한 문제 영역·정답 기준·차단 사유|

공통 4몸통1머리 분해는 가능한 분해만 반환한다. 그 결과가 곧 해당 규칙의 유효 화료는 아니다. 마마모의 조합룡·칠성불고·십삼불탑에는 독립된 형태 정책이 필요하다. 샹텐을 보통형/치또이/국사의 최솟값으로 고정하면 이 경우 틀릴 수 있다.

## 선언만 제공하는 타입 예시

```ts
type RuleSetId = "standard-riichi" | "mamamo";
type Decision<T> =
  | { status: "resolved"; value: T; evidence: RuleEvidence[] }
  | { status: "unresolved"; ambiguityIds: string[]; blockedOperations: string[] };

interface RuleContext {
  ruleSet: RuleSetId;
  specVersion: string;
  profileHash: string;          // 세트·옵션·확정 답변의 해시
  policies: Readonly<PolicyBundle>;
  unresolvedIds: readonly string[];
}
interface RuleEvidence {
  ruleSet: RuleSetId;
  ruleId: string;
  sourcePages: { source: string; pdf: number; printed: string | null }[];
}
interface HandState {
  concealedTiles: Tile[];
  melds: Meld[];                // 종류·호출자·제공자·안깡 여부·물리4장 보존
  drawnTile?: Tile;
  winningTile?: Tile;
  winMethod?: "ron" | "tsumo";
}
interface GameContext {
  dealer: PlayerId;
  seatWinds: Record<PlayerId, Wind>;
  roundWind: Wind;
  scores: Record<PlayerId, number>;
  liveWallRemaining: number;
  doraIndicators: Tile[];
  uraIndicators: Tile[];
  visibleTiles: Tile[];
  discards: DiscardEvent[];     // 부름으로 강에서 없어진 패도 이력 유지
  events: GameEvent[];          // 부름·간과·리치·깡·반칙 시점
  riichi: Record<PlayerId, RiichiState>;
  furiten: Record<PlayerId, FuritenState>;
  honba: number;
  dealerOwnContinuations: number;
  dealerConsecutiveWins: number;
  riichiPool: Deposit[];        // 낸 사람·현재국/이전국 구분
  fines: Fine[];
  liablePlayers: LiabilityEvent[];
}
interface PaymentResult {
  transfers: { from: PlayerId | "pool"; to: PlayerId | "pool"; points: number;
               reason: string; ruleId: string }[];
  handPayments: number;
  honbaPayments: number;
  depositPayments: number;
  penaltyPayments: number;
}
interface RuleEngineDraft {
  validateTiles(input: HandState, ruleSet: RuleContext): Decision<TileValidation>;
  calculateShanten(input: HandState, ruleSet: RuleContext): Decision<ShantenResult>;
  isTenpai(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<boolean>;
  findWaits(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<WaitResult>;
  canWin(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<boolean>;
  evaluateFuriten(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<FuritenState>;
  evaluateYaku(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<YakuMatch[]>;
  countHan(matches: YakuMatch[], game: GameContext, ruleSet: RuleContext): Decision<HanResult>;
  calculateFu(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<FuResult>;
  calculateScore(input: ScoringInput, ruleSet: RuleContext): Decision<ScoreResult>;
  calculatePayments(input: ScoringInput, game: GameContext, ruleSet: RuleContext): Decision<PaymentResult>;
  canRiichi(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<boolean>;
  evaluateDora(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<DoraResult>;
  legalCalls(input: HandState, game: GameContext, ruleSet: RuleContext): Decision<Call[]>;
  resolveDraw(game: GameContext, ruleSet: RuleContext): Decision<DrawResult>;
  resolvePenalty(event: GameEvent, game: GameContext, ruleSet: RuleContext): Decision<PaymentResult>;
  generateProblem(request: ProblemRequest, ruleSet: RuleContext): Decision<Problem>;
  explainAnswer(problem: Problem, answer: Answer, ruleSet: RuleContext): Decision<Explanation>;
}
```

위 타입의 Tile·Meld·PolicyBundle 등의 세부 정의는 다음 단계에서 작성한다. 문제·정답·해설·캐시 키 모두 ruleSet/specVersion/profileHash를 저장한다. 같은 손패라도 다른 규칙 세트의 답안을 재사용하지 않는다.

## 연습별 입력과 정답 제안

1. 연습 1의 '최적'은 유일한 마작 규칙이 아니다. 프로젝트 기본 제안은 **최소 구조 샹텐 → 최대 보이는 패 기준 유효패 매수**의 사전식 비교다. 동일 점수 타패는 모두 정답으로 인정한다. 기대 타점·방어·순위 최적화는 별도 목표 옵션이어야 한다. 순수 14패 문제는 완성 상태 입력과 타패 후13패를 구별하며, 손패·공개패·버림패를 중복 집계하지 않는다. 정보가 없으면 손패 이외 전부 미지라는 가정을 문제에 표시한다. 마마모 채택 형태가 확정되지 않으면 그 형태를 놓칠 수 있는 샹텐 문제를 생성하지 않는다.
2. 연습 2는 13패 청일색 형태에 한 패를 추가해 완성되는 **구조적 대기 종류**를 기본 정답으로 제안한다. 청일색으로 완성될 수 있는 7쌍도 포함하며, 깡·부로는 문제 입력에 있을 때만 처리한다. '론 가능 대기'나 '실제로 남아 있는 대기'는 별도 결과 필드다. 프리텐은 구조대기를 없애지 않으며 잔여0도 구조대기와 구분한다. 같은 패5장 요구는 불가다. 시간은 문제 공개부터 제출까지 단조 시계로 재며 탭 숨김/중단 여부를 기록한다. PDF의 실전 타패 벌금 시간을 이 모드에 옮기지 않는다.
3. 연습 3은 손패만으로 생성하지 않는다. 화료패·론/쯔모·친자·장풍/자풍·리치/오픈·도라/뒷도라·부름·본장·공탁·책임지불·복수화료·반칙을 입력한다. 화료 점수와 각 상대 지불액, 공탁 수령, 벌금을 분리해서 답한다. 같은 조합의 여러 분해에서 역과 부를 교차 합산하지 않는다.

위 연습 목표·시간 측정 방식은 **프로젝트 설계 제안**이며 PDF 추출 규칙이 아니다. 기본 목표를 확정할 때 이 차이를 유지한다.

## 미확정 문제 차단

각 문제는 필요한 ruleId 집합을 선언한다. 국제역 채택·부·점수표·중복 등의 의존성 중 미해결 값이 있으면 generateProblem은 문제 대신 unresolved와 A번호를 반환해야 한다. 후보 해석을 정답으로 저장하거나 standard-riichi 값으로 대체하지 않는다. 사용자 확인을 받으면 원문 전사 값을 덮어쓰지 않고 별도 resolution 레코드(확인일·선택 해석·영향 규칙)를 추가하고 프로필 버전을 올린다.

이번 요청에서는 치명적인 모호성이 남으면 구현하지 말라는 사용자의 조건이 있으므로, 일부 표준 문제만 안전하다는 이유로 웹게임 구현을 시작하지 않는다.
