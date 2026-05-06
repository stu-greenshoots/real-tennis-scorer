export type Side = 'A' | 'B'

export type PointTag =
  | 'winner'
  | 'dedans'
  | 'grille'
  | 'gallery'
  | 'chase-won'
  | 'forced-error'
  | 'unforced-error'
  | 'let'

export type ChaseLine =
  | '1' | '2' | '3' | '4' | '5' | '6'
  | 'better-than-half-a-yard' | 'half-a-yard' | 'worse-than-half-a-yard'
  | 'last-gallery' | 'second-gallery' | 'door' | 'first-gallery'
  | 'hazard-side'

export type GamePoints = 0 | 15 | 30 | 40 | 'AD'

export interface ScoreSnapshot {
  points: { A: GamePoints; B: GamePoints }
  games: { A: number; B: number }
  sets: { A: number; B: number }
  setHistory: Array<{ A: number; B: number }>
}

export interface Chase {
  line: ChaseLine
  laidBy: Side
  scoreAtLay: ScoreSnapshot
}

export interface PointEvent {
  id: string
  ts: number
  winner: Side | null
  tag?: PointTag
  chaseLaid?: ChaseLine
  endsSwitchedAfter?: boolean
  scoreAfter: ScoreSnapshot
  note?: string
}

export interface MatchConfig {
  setsToWin: number
  gamesPerSet: number
  tiebreak: boolean
  autoChase: boolean
}

export interface Match {
  id: string
  startedAt: number
  endedAt?: number
  players: { A: string; B: string }
  config: MatchConfig
  servingEnd: Side
  serving: Side
  /** Initial serving side at match start — used to reconstruct state on undo. */
  initialServing: Side
  /** Initial servingEnd at match start — used to reconstruct state on undo. */
  initialServingEnd: Side
  pendingChases: Chase[]
  playoffActive: boolean
  playoffRemaining: number
  events: PointEvent[]
  score: ScoreSnapshot
  winner?: Side
  /** Optional avatar IDs (from src/lib/roster.ts) for visual personalisation. */
  avatars?: { A?: string; B?: string }
  /**
   * Optional uploaded photos (data URLs) for either player. When present these
   * take precedence over the avatar silhouette in the Portrait component.
   */
  photos?: { A?: string; B?: string }
}

export type Action =
  | { type: 'awardPoint'; side: Side; tag?: PointTag }
  | { type: 'layChase'; line: ChaseLine; laidBy: Side }
  | { type: 'startChasePlayoff' }
  | { type: 'undo' }
  | { type: 'finish' }
