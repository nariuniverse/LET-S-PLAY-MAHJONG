export type RuleSetId = 'standard-riichi' | 'mamamo';
export type Tile = number;
export type Player = 0 | 1 | 2 | 3;
export type WinMethod = 'ron' | 'tsumo';
export type Form = 'normal' | 'seven-pairs' | 'orphans' | 'knitted' | 'seven-stars' | 'unrelated';
export type Wait = 'ryanmen' | 'kanchan' | 'penchan' | 'shanpon' | 'tanki' | 'special';
export interface SourcePage { source: string; pdf: number; printed: string | null }
export interface Definition {
  id: string; name: string; enabled: boolean; category: string;
  closedValue: number | null; openValue: number | null; yakumanMultiplier: number;
  openEligible: boolean; conditions: Readonly<Record<string, unknown>>;
  exclusions: readonly string[]; stackingRules: Readonly<Record<string, unknown>>;
  paymentRules: Readonly<Record<string, unknown>>; sourcePages: readonly SourcePage[];
}
export interface Policies {
  forms: readonly Form[]; copies: number; openTanyao: boolean;
  multipleYakuman: boolean; kiriage: boolean; kazoe: boolean; kokushiDouble: boolean;
  pinfuTsumo: number; pinfuRon: number; doubleWindPair: number;
  honbaRon: number; honbaTsumo: number; deposit: number;
  specialPinfu: boolean; paoYaku: readonly string[];
  tripleRon: 'all_win' | 'abortive_draw'; multipleRonHonba: 'each' | 'nearest';
  openRiichi: boolean; twoHanAfterDealerWins: number | null;
  renhou: 'exclusive_mangan' | 'baiman';
}
export interface RuleContext {
  readonly ruleSet: RuleSetId; readonly profileHash: string;
  readonly definitions: Readonly<Record<string, Definition>>;
  readonly policies: Readonly<Policies>;
}
export interface Meld {
  kind: 'chi' | 'pon' | 'ankan' | 'daiminkan' | 'kakan';
  tiles: readonly Tile[]; from?: Player; claimedTile?: Tile;
}
export interface Hand { concealed: readonly Tile[]; melds?: readonly Meld[] }
export interface Block { kind: 'sequence' | 'triplet' | 'quad'; tile: Tile; open: boolean; meldIndex?: number }
export interface Decomposition { form: Form; blocks: readonly Block[]; pair: Tile | null; specialTiles: readonly Tile[] }
export interface Placement { wait: Wait; blockIndex: number | null; pair: boolean }
export interface Situation {
  winner: Player; dealer: Player; seatWind: Tile; roundWind: Tile; method: WinMethod; winningTile: Tile;
  discarder?: Player;
  riichi?: 'none' | 'riichi' | 'double' | 'open'; ippatsu?: boolean;
  firstOwnDraw?: boolean; beforeFirstOwnDraw?: boolean; initialDeal?: boolean; noCalls?: boolean;
  drawSource?: 'live' | 'rinshan' | 'last-live'; lastDiscard?: boolean;
  robKan?: 'added' | 'concealed'; dealerConsecutiveWins?: number;
  ownDiscards?: readonly Tile[]; temporaryFuriten?: boolean; riichiFuriten?: boolean;
  deadHand?: boolean;
  doraIndicators?: readonly Tile[]; uraIndicators?: readonly Tile[];
  honba?: number; riichiSticks?: number; liabilities?: readonly Liability[]; additions?: readonly Transfer[];
}
export interface Evidence { ruleSet: RuleSetId; ruleId: string; sources: readonly SourcePage[] }
export interface YakuMatch extends Evidence { name: string; han: number; yakuman: number; closed: boolean; specialConditions: readonly string[] }
export interface Excluded { ruleId: string; reason: string; by?: string }
export interface YakuResult { recognized: readonly YakuMatch[]; excluded: readonly Excluded[]; han: number; yakuman: number; dora: number; fixedLimit: Limit | null }
export interface FuEntry { kind: string; fu: number; tile?: Tile; open?: boolean; ruleId: string }
export interface FuResult { entries: readonly FuEntry[]; beforeRounding: number; rounded: number; fixed: boolean; exceptions: readonly string[] }
export type Limit = 'none' | 'mangan' | 'haneman' | 'baiman' | 'sanbaiman' | 'yakuman';
export interface Liability { ruleId: string; player: Player; multiplier: number }
export interface Transfer { from: Player | 'pool'; to: Player | 'pool'; points: bigint; reason: string; ruleId: string }
export interface ScoreInput {
  winner: Player; dealer: Player; method: WinMethod; discarder?: Player;
  han: number; fu: number; yakuman?: number; fixedLimit?: Limit | null;
  honba?: number; riichiSticks?: number; liabilities?: readonly Liability[]; additions?: readonly Transfer[];
}
export interface ScoreResult {
  ruleSet: RuleSetId; base: bigint; limit: Limit; transfers: readonly Transfer[];
  opponentPayments: Readonly<Record<Player, bigint>>; totalGain: bigint;
  handPayments: bigint; honbaPayments: bigint; depositPayments: bigint; additionalPayments: bigint;
  rounding: readonly { unrounded: bigint; rounded: bigint; factor: bigint }[];
  balanced: boolean; ruleIds: readonly string[];
}
export interface FuritenResult { discard: boolean; temporary: boolean; permanent: boolean; ronAllowed: boolean; tsumoAllowed: boolean; ruleIds: readonly string[] }
export interface Candidate { decomposition: Decomposition; placement: Placement; yaku: YakuResult; fu: FuResult; score: ScoreResult }
export interface WinResult {
  ruleSet: RuleSetId; valid: boolean; errors: readonly string[]; canWin: boolean;
  furiten: FuritenResult; candidates: readonly Candidate[]; best: readonly Candidate[];
  decompositions: readonly Decomposition[]; reasons: readonly string[];
}
