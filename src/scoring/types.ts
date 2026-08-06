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

/**
 * Service-end chase line identifiers, ordered from far end of the court
 * (closest to back wall) toward the net. Indexing-by-position is significant —
 * the chase picker uses neighbour-position for the "between" modifier
 * adjacency check.
 */
export const SERVICE_LINES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  'last-gallery',
  'yard-worse',
  'second-gallery',
  'door',
  'first-gallery',
  'the-line',
] as const

export type ServiceLine = (typeof SERVICE_LINES)[number]

/** Hazard-end chase line identifiers, same ordering convention. */
export const HAZARD_LINES = [
  'hazard-1',
  'hazard-2',
  'hazard-second-gallery',
  'hazard-door',
  'hazard-first-gallery',
  'hazard-line',
] as const

export type HazardLine = (typeof HAZARD_LINES)[number]

export type ChaseLine = ServiceLine | HazardLine

export type ChaseEnd = 'service' | 'hazard'

export type ChaseModifier = 'exact' | 'better' | 'worse' | 'between'

/**
 * Structured chase value. `lines` has length 1 for exact/better/worse and
 * length 2 (adjacent) for between.
 */
export interface ChaseValue {
  end: ChaseEnd
  modifier: ChaseModifier
  lines: ChaseLine[]
}

export type GamePoints = 0 | 15 | 30 | 40 | 'AD'

export interface ScoreSnapshot {
  points: { A: GamePoints; B: GamePoints }
  games: { A: number; B: number }
  sets: { A: number; B: number }
  setHistory: Array<{ A: number; B: number }>
  /**
   * Handicap "owe" — fifteens still owed this game before a side's score can
   * advance past love (0 = none). Present only for handicap matches.
   */
  owe?: { A: number; B: number }
}

export interface Chase {
  value: ChaseValue
  laidBy: Side
  scoreAtLay: ScoreSnapshot
}

export interface PointEvent {
  id: string
  ts: number
  winner: Side | null
  tag?: PointTag
  chaseLaid?: ChaseValue
  endsSwitchedAfter?: boolean
  scoreAfter: ScoreSnapshot
  note?: string
}

export interface MatchConfig {
  gamesPerSet: number
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
  /** Player handicaps (real-tennis handicapping), to 1 decimal place. */
  handicaps?: { A?: number; B?: number }
  /**
   * The agreed handicap odds actually being played — the whole-number
   * difference (which may be adjusted away from the raw handicap difference)
   * and which side receives (the other side owes). Absent when playing level.
   */
  handicap?: { difference: number; receivingSide: Side }
  /**
   * Optional uploaded photos (data URLs) for either player. When present these
   * take precedence over the avatar silhouette in the Portrait component.
   */
  photos?: { A?: string; B?: string }
}

export type Action =
  | { type: 'awardPoint'; side: Side; tag?: PointTag }
  | { type: 'layChase'; value: ChaseValue; laidBy: Side }
  | { type: 'startChasePlayoff' }
  | { type: 'undo' }
  | { type: 'finish' }
