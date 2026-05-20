import { id } from '../lib/id'
import type {
  Action,
  Chase,
  ChaseValue,
  GamePoints,
  Match,
  MatchConfig,
  PointEvent,
  PointTag,
  ScoreSnapshot,
  Side,
} from './types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const other = (s: Side): Side => (s === 'A' ? 'B' : 'A')

const cloneSnapshot = (s: ScoreSnapshot): ScoreSnapshot => ({
  points: { A: s.points.A, B: s.points.B },
  games: { A: s.games.A, B: s.games.B },
  sets: { A: s.sets.A, B: s.sets.B },
  setHistory: s.setHistory.map((h) => ({ A: h.A, B: h.B })),
})

const emptySnapshot = (): ScoreSnapshot => ({
  points: { A: 0, B: 0 },
  games: { A: 0, B: 0 },
  sets: { A: 0, B: 0 },
  setHistory: [],
})

const nextPoint = (p: GamePoints): GamePoints => {
  if (p === 0) return 15
  if (p === 15) return 30
  if (p === 30) return 40
  return 40
}

// ---------------------------------------------------------------------------
// createMatch
// ---------------------------------------------------------------------------

export function createMatch(opts: {
  players: { A: string; B: string }
  config: MatchConfig
  servingEnd?: Side
  serving?: Side
}): Match {
  const serving = opts.serving ?? 'A'
  const servingEnd = opts.servingEnd ?? 'A'
  return {
    id: id(),
    startedAt: Date.now(),
    players: { ...opts.players },
    config: { ...opts.config },
    servingEnd,
    serving,
    initialServing: serving,
    initialServingEnd: servingEnd,
    pendingChases: [],
    playoffActive: false,
    playoffRemaining: 0,
    events: [],
    score: emptySnapshot(),
  }
}

// ---------------------------------------------------------------------------
// Game / set / match progression
// ---------------------------------------------------------------------------

function isSetWon(games: { A: number; B: number }, config: MatchConfig): Side | null {
  const target = config.gamesPerSet
  const { A, B } = games
  if (config.tiebreak) {
    if (A >= target && A - B >= 2) return 'A'
    if (B >= target && B - A >= 2) return 'B'
    if (A === target + 1 && B === target) return 'A'
    if (B === target + 1 && A === target) return 'B'
  } else {
    if (A >= target && A - B >= 2) return 'A'
    if (B >= target && B - A >= 2) return 'B'
  }
  return null
}

interface RawPointResult {
  score: ScoreSnapshot
  gameWon: boolean
  setWon: Side | null
  matchWon: Side | null
  serving: Side
}

function applyRawPoint(match: Match, winner: Side): RawPointResult {
  const score = cloneSnapshot(match.score)
  const loser = other(winner)
  const wp = score.points[winner]
  const lp = score.points[loser]
  let gameWon = false

  if (wp === 40 && (lp === 0 || lp === 15 || lp === 30)) {
    gameWon = true
  } else if (wp === 40 && lp === 40) {
    score.points[winner] = 'AD'
  } else if (wp === 40 && lp === 'AD') {
    score.points[loser] = 40
  } else if (wp === 'AD') {
    gameWon = true
  } else {
    score.points[winner] = nextPoint(wp as GamePoints)
  }

  const serving = match.serving
  let setWon: Side | null = null
  let matchWon: Side | null = null

  if (gameWon) {
    score.points = { A: 0, B: 0 }
    score.games[winner] += 1
    // Real-tennis rule: serving does not alternate when a game is won.
    // The only thing that swaps serving (and ends) is a chase playoff.

    setWon = isSetWon(score.games, match.config)
    if (setWon) {
      score.sets[setWon] += 1
      score.setHistory.push({ A: score.games.A, B: score.games.B })
      score.games = { A: 0, B: 0 }
      if (score.sets[setWon] >= match.config.setsToWin) {
        matchWon = setWon
      }
    }
  }

  return { score, gameWon, setWon, matchWon, serving }
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

export function isMatchOver(match: Match): boolean {
  return match.winner !== undefined
}

export function isSetDecidingGame(match: Match): boolean {
  const { games } = match.score
  for (const side of ['A', 'B'] as Side[]) {
    const trial = { A: games.A, B: games.B }
    trial[side] += 1
    if (isSetWon(trial, match.config)) return true
  }
  return false
}

function sideAtGamePoint(score: ScoreSnapshot): Side | null {
  const { A, B } = score.points
  if (A === 'AD') return 'A'
  if (B === 'AD') return 'B'
  if (A === 40 && (B === 0 || B === 15 || B === 30)) return 'A'
  if (B === 40 && (A === 0 || A === 15 || A === 30)) return 'B'
  return null
}

export function shouldTriggerChasePlayoff(match: Match): boolean {
  if (match.playoffActive) return false
  const n = match.pendingChases.length
  if (n >= 2) return true
  if (n === 1 && isSetDecidingGame(match) && sideAtGamePoint(match.score) !== null) {
    return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Reducer parts
// ---------------------------------------------------------------------------

function makeEvent(partial: Omit<PointEvent, 'id' | 'ts'>): PointEvent {
  return { id: id(), ts: Date.now(), ...partial }
}

function reduceAwardPoint(match: Match, side: Side, tag?: PointTag): Match {
  if (match.winner) return match

  if (tag === 'let') {
    const ev = makeEvent({
      winner: null,
      tag: 'let',
      scoreAfter: cloneSnapshot(match.score),
      note: 'let — replay',
    })
    return { ...match, events: [...match.events, ev] }
  }

  if (match.playoffActive) {
    const result = applyRawPoint(match, side)
    const newPending = match.pendingChases.slice(1)
    const remaining = match.playoffRemaining - 1
    const playoffActive = remaining > 0
    const ev = makeEvent({
      winner: side,
      tag: 'chase-won',
      scoreAfter: result.score,
      note: 'playoff: chase resolved',
    })
    let next: Match = {
      ...match,
      score: result.score,
      serving: result.serving,
      pendingChases: newPending,
      playoffActive,
      playoffRemaining: Math.max(0, remaining),
      winner: result.matchWon ?? match.winner,
      events: [...match.events, ev],
    }
    if (result.matchWon && !next.endedAt) next = { ...next, endedAt: Date.now() }
    return next
  }

  const result = applyRawPoint(match, side)
  const ev = makeEvent({
    winner: side,
    tag,
    scoreAfter: result.score,
  })
  let next: Match = {
    ...match,
    score: result.score,
    serving: result.serving,
    events: [...match.events, ev],
    winner: result.matchWon ?? match.winner,
  }
  if (result.matchWon && !next.endedAt) next = { ...next, endedAt: Date.now() }
  if (!next.winner && next.config.autoChase && shouldTriggerChasePlayoff(next)) {
    next = startPlayoff(next)
  }
  return next
}

function reduceLayChase(match: Match, value: ChaseValue, laidBy: Side): Match {
  if (match.winner) return match
  const chase: Chase = { value, laidBy, scoreAtLay: cloneSnapshot(match.score) }
  const ev = makeEvent({
    winner: null,
    chaseLaid: value,
    scoreAfter: cloneSnapshot(match.score),
    note: `chase laid by ${laidBy}`,
  })
  let next: Match = {
    ...match,
    pendingChases: [...match.pendingChases, chase],
    events: [...match.events, ev],
  }

  if (next.config.autoChase && shouldTriggerChasePlayoff(next)) {
    next = startPlayoff(next)
  }
  return next
}

/**
 * Begin a chase playoff. Swaps ends, marks playoffActive, and emits a marker
 * event with `endsSwitchedAfter: true` and a descriptive note. We chose to
 * emit a *separate* marker event (rather than mutating the previous event)
 * because (a) it preserves the immutability/append-only feel of the events
 * log, and (b) it makes undo trivial (just pop the last event).
 */
function startPlayoff(match: Match): Match {
  // Ends switch — and so do the server / receiver roles.
  const newServingEnd = other(match.servingEnd)
  const newServing = other(match.serving)
  const ev = makeEvent({
    winner: null,
    endsSwitchedAfter: true,
    scoreAfter: cloneSnapshot(match.score),
    note: `playing off ${match.pendingChases.length} chase(s); ends switched`,
  })
  return {
    ...match,
    servingEnd: newServingEnd,
    serving: newServing,
    playoffActive: true,
    playoffRemaining: match.pendingChases.length,
    events: [...match.events, ev],
  }
}

// ---------------------------------------------------------------------------
// Undo via replay
// ---------------------------------------------------------------------------

function reduceUndo(match: Match): Match {
  if (match.events.length === 0) return match
  const trimmed = match.events.slice(0, -1)

  let m: Match = {
    ...match,
    score: emptySnapshot(),
    serving: match.initialServing,
    servingEnd: match.initialServingEnd,
    pendingChases: [],
    playoffActive: false,
    playoffRemaining: 0,
    events: [],
    winner: undefined,
    endedAt: undefined,
  }
  for (const ev of trimmed) {
    m = replayEvent(m, ev)
  }
  return m
}

function replayEvent(match: Match, ev: PointEvent): Match {
  // 'let' marker
  if (ev.tag === 'let') {
    return { ...match, events: [...match.events, ev] }
  }
  // Chase laid
  if (ev.chaseLaid && ev.winner === null) {
    const laidBy = deriveLaidBy(ev)
    const chase: Chase = {
      value: ev.chaseLaid,
      laidBy,
      scoreAtLay: cloneSnapshot(match.score),
    }
    return {
      ...match,
      pendingChases: [...match.pendingChases, chase],
      events: [...match.events, ev],
    }
  }
  // Playoff-start marker
  if (ev.endsSwitchedAfter && ev.winner === null) {
    return {
      ...match,
      servingEnd: other(match.servingEnd),
      serving: other(match.serving),
      playoffActive: true,
      playoffRemaining: match.pendingChases.length,
      events: [...match.events, ev],
    }
  }
  // Awarded point (chase-won during playoff or normal)
  if (ev.winner) {
    if (match.playoffActive) {
      const result = applyRawPoint(match, ev.winner)
      const newPending = match.pendingChases.slice(1)
      const remaining = match.playoffRemaining - 1
      return {
        ...match,
        score: result.score,
        serving: result.serving,
        pendingChases: newPending,
        playoffActive: remaining > 0,
        playoffRemaining: Math.max(0, remaining),
        winner: result.matchWon ?? match.winner,
        events: [...match.events, ev],
      }
    }
    const result = applyRawPoint(match, ev.winner)
    return {
      ...match,
      score: result.score,
      serving: result.serving,
      winner: result.matchWon ?? match.winner,
      events: [...match.events, ev],
    }
  }
  return { ...match, events: [...match.events, ev] }
}

function deriveLaidBy(ev: PointEvent): Side {
  if (ev.note) {
    const m = /by\s+([AB])\b/.exec(ev.note)
    if (m) return m[1] as Side
  }
  return 'A'
}

// ---------------------------------------------------------------------------
// Public reduce
// ---------------------------------------------------------------------------

export function reduce(match: Match, action: Action): Match {
  switch (action.type) {
    case 'awardPoint':
      return reduceAwardPoint(match, action.side, action.tag)
    case 'layChase':
      return reduceLayChase(match, action.value, action.laidBy)
    case 'startChasePlayoff':
      if (match.playoffActive || match.pendingChases.length === 0) return match
      return startPlayoff(match)
    case 'undo':
      return reduceUndo(match)
    case 'finish':
      return { ...match, endedAt: match.endedAt ?? Date.now() }
    default:
      return match
  }
}
