/**
 * Real-tennis handicapping (singles). The difference between the two players'
 * handicaps (rounded to the nearest whole number) indexes into this table,
 * which splits the odds across both players: the weaker player (higher
 * handicap) *receives* a start each game, and the stronger player (lower
 * handicap) *owes* points each game.
 *
 * Transcribed from Paul's handicapping sheet.
 */

/**
 * A per-game concession. `none` = Love (no concession). Otherwise `fifteens`
 * is the value in fifteens (1 = 15, 2 = 30, 3 = 40) and `cadence` is how often
 * it applies within a set:
 *  - full:    every game
 *  - half:    the full value on even games (2, 4, 6…), one fifteen less on odd
 *  - quarter: the full value on every 4th game, one fifteen less otherwise
 * Game numbering is 1-based and resets each set.
 */
export type Concession =
  | { kind: 'none' }
  | { kind: 'points'; fifteens: 1 | 2 | 3; cadence: 'full' | 'half' | 'quarter' }

export interface HandicapRule {
  /** Inclusive lower bound of the handicap difference this row covers. */
  min: number
  /** Inclusive upper bound (Infinity for the open-ended top row). */
  max: number
  /** What the weaker (receiving) player gets each game. */
  receive: Concession
  /** What the stronger (owing) player gives up each game. */
  owe: Concession
  /** Additional structural handicaps (display-only for now), or null. */
  structural: string | null
}

const none: Concession = { kind: 'none' }
const P = (
  fifteens: 1 | 2 | 3,
  cadence: 'full' | 'half' | 'quarter' = 'full',
): Concession => ({ kind: 'points', fifteens, cadence })

// Structural handicaps stack in at higher differences. These are shown as a
// reminder; the engine does not enforce them yet.
const S_BASE = 'One serve only. Tambour banned.'
const S_34 = `${S_BASE} Chases worse than 3 & 4 banned. No hazard chases when playing off. Service end conceded at one chase.`
const S_42 = `${S_BASE} Chases worse than 3 banned. No hazard chases when playing off. Service end conceded at one chase.`
const S_46 = `${S_BASE} Chases worse than 2 & 3 banned. No hazard chases when playing off. Service end conceded at one chase.`

export const HANDICAP_RULES: HandicapRule[] = [
  { min: 1, max: 1, receive: none, owe: P(1, 'quarter'), structural: null },
  { min: 2, max: 2, receive: none, owe: P(1, 'half'), structural: null },
  { min: 3, max: 3, receive: P(1, 'half'), owe: none, structural: null },
  { min: 4, max: 4, receive: none, owe: P(1, 'full'), structural: null },
  { min: 5, max: 5, receive: P(1, 'half'), owe: P(1, 'half'), structural: null },
  { min: 6, max: 6, receive: P(1, 'full'), owe: none, structural: null },
  { min: 7, max: 7, receive: P(1, 'half'), owe: P(1, 'full'), structural: null },
  { min: 8, max: 8, receive: P(1, 'full'), owe: P(1, 'half'), structural: null },
  { min: 9, max: 9, receive: P(1, 'half'), owe: P(2, 'half'), structural: null },
  { min: 10, max: 10, receive: P(1, 'full'), owe: P(1, 'full'), structural: null },
  { min: 11, max: 11, receive: P(1, 'half'), owe: P(2, 'full'), structural: null },
  { min: 12, max: 12, receive: P(1, 'full'), owe: P(2, 'half'), structural: null },
  { min: 13, max: 13, receive: P(1, 'full'), owe: P(2, 'full'), structural: null },
  { min: 14, max: 14, receive: P(2, 'half'), owe: P(1, 'full'), structural: null },
  { min: 15, max: 15, receive: P(2, 'half'), owe: P(2, 'half'), structural: null },
  { min: 16, max: 17, receive: P(2, 'half'), owe: P(2, 'full'), structural: null },
  { min: 18, max: 19, receive: P(2, 'full'), owe: P(1, 'full'), structural: null },
  { min: 20, max: 21, receive: P(2, 'full'), owe: P(2, 'half'), structural: null },
  { min: 22, max: 23, receive: P(2, 'full'), owe: P(2, 'full'), structural: null },
  { min: 24, max: 25, receive: P(2, 'full'), owe: P(3, 'full'), structural: null },
  { min: 26, max: 27, receive: P(2, 'full'), owe: P(1, 'full'), structural: S_BASE },
  { min: 28, max: 29, receive: P(2, 'full'), owe: P(2, 'half'), structural: S_BASE },
  { min: 30, max: 31, receive: P(2, 'full'), owe: P(2, 'full'), structural: S_BASE },
  { min: 32, max: 33, receive: P(2, 'full'), owe: P(3, 'full'), structural: S_BASE },
  { min: 34, max: 35, receive: P(2, 'full'), owe: P(1, 'full'), structural: S_34 },
  { min: 36, max: 37, receive: P(2, 'full'), owe: P(2, 'half'), structural: S_34 },
  { min: 38, max: 39, receive: P(2, 'full'), owe: P(2, 'full'), structural: S_34 },
  { min: 40, max: 41, receive: P(2, 'full'), owe: P(3, 'full'), structural: S_34 },
  { min: 42, max: 43, receive: P(2, 'full'), owe: P(2, 'full'), structural: S_42 },
  { min: 44, max: 45, receive: P(2, 'full'), owe: P(3, 'full'), structural: S_42 },
  { min: 46, max: 47, receive: P(2, 'full'), owe: P(2, 'half'), structural: S_46 },
  { min: 48, max: 49, receive: P(2, 'full'), owe: P(2, 'full'), structural: S_46 },
  { min: 50, max: Infinity, receive: P(2, 'full'), owe: P(3, 'full'), structural: S_46 },
]

/** The rule for a whole-number handicap difference, or null when level (0). */
export function ruleForDifference(diff: number): HandicapRule | null {
  if (!Number.isFinite(diff) || diff < 1) return null
  return HANDICAP_RULES.find((r) => diff >= r.min && diff <= r.max) ?? null
}

const FIFTEEN_LABEL: Record<1 | 2 | 3, string> = { 1: '15', 2: '30', 3: '40' }

/** Bare concession label, matching the sheet's wording (no Rec/Owe prefix). */
export function concessionLabel(c: Concession): string {
  if (c.kind === 'none') return 'Love'
  const pts = FIFTEEN_LABEL[c.fifteens]
  if (c.cadence === 'half') return `half ${pts}`
  if (c.cadence === 'quarter') return `quarter ${pts}`
  return pts
}

/** How the receiving (weaker) player's concession reads, e.g. "Rec half 15". */
export function receiveLabel(c: Concession): string {
  return c.kind === 'none' ? 'Love' : `Rec ${concessionLabel(c)}`
}

/** How the owing (stronger) player's concession reads, e.g. "Owe half 15". */
export function oweLabel(c: Concession): string {
  return c.kind === 'none' ? 'Love' : `Owe ${concessionLabel(c)}`
}

/**
 * Fifteens (0..3) the concession is worth in a given game of the set. See the
 * `Concession` doc comment for the cadence rules. `gameInSet` is 1-based.
 */
export function concessionFifteensForGame(c: Concession, gameInSet: number): number {
  if (c.kind === 'none') return 0
  const full = c.fifteens
  const lower = Math.max(0, full - 1)
  if (c.cadence === 'full') return full
  if (c.cadence === 'half') return gameInSet % 2 === 0 ? full : lower
  return gameInSet % 4 === 0 ? full : lower // quarter
}
