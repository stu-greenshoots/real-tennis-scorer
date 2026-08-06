import { describe, it, expect } from 'vitest'
import {
  createMatch,
  reduce,
  isMatchOver,
  isSetDecidingGame,
  shouldTriggerChasePlayoff,
} from './engine'
import type { Action, ChaseValue, Match, MatchConfig, Side } from './types'

const serviceExact = (line: ChaseValue['lines'][number]): ChaseValue => ({
  end: 'service',
  modifier: 'exact',
  lines: [line],
})
const serviceBetween = (
  a: ChaseValue['lines'][number],
  b: ChaseValue['lines'][number],
): ChaseValue => ({ end: 'service', modifier: 'between', lines: [a, b] })

const baseConfig: MatchConfig = {
  gamesPerSet: 6,
  autoChase: true,
}

function newMatch(overrides: Partial<MatchConfig> = {}, serving: Side = 'A'): Match {
  return createMatch({
    players: { A: 'Paul', B: 'Other' },
    config: { ...baseConfig, ...overrides },
    servingEnd: 'A',
    serving,
  })
}

function award(m: Match, side: Side, tag?: Action extends { type: 'awardPoint'; tag?: infer T } ? T : never): Match {
  return reduce(m, { type: 'awardPoint', side, tag })
}

/** Win a whole game for `side` from 0-0. */
function winGame(m: Match, side: Side): Match {
  for (let i = 0; i < 4; i++) m = award(m, side)
  return m
}

describe('point progression', () => {
  it('advances 0 → 15 → 30 → 40 → game', () => {
    let m = newMatch()
    m = award(m, 'A')
    expect(m.score.points).toEqual({ A: 15, B: 0 })
    m = award(m, 'A')
    expect(m.score.points).toEqual({ A: 30, B: 0 })
    m = award(m, 'A')
    expect(m.score.points).toEqual({ A: 40, B: 0 })
    m = award(m, 'A')
    // game won → points reset, A games = 1
    expect(m.score.points).toEqual({ A: 0, B: 0 })
    expect(m.score.games).toEqual({ A: 1, B: 0 })
  })
})

describe('deuce / advantage', () => {
  it('handles deuce → AD → back to deuce → game from AD', () => {
    let m = newMatch()
    // Both to 40
    m = award(m, 'A')
    m = award(m, 'A')
    m = award(m, 'A')
    m = award(m, 'B')
    m = award(m, 'B')
    m = award(m, 'B')
    expect(m.score.points).toEqual({ A: 40, B: 40 })
    m = award(m, 'A')
    expect(m.score.points).toEqual({ A: 'AD', B: 40 })
    m = award(m, 'B')
    expect(m.score.points).toEqual({ A: 40, B: 40 })
    m = award(m, 'B')
    expect(m.score.points).toEqual({ A: 40, B: 'AD' })
    m = award(m, 'B')
    expect(m.score.games).toEqual({ A: 0, B: 1 })
    expect(m.score.points).toEqual({ A: 0, B: 0 })
  })
})

describe('serving on game end', () => {
  it('does not alternate when a game is won (real-tennis rule)', () => {
    let m = newMatch({}, 'A')
    expect(m.serving).toBe('A')
    m = winGame(m, 'A')
    expect(m.serving).toBe('A')
    m = winGame(m, 'B')
    expect(m.serving).toBe('A')
  })
})

describe('set winning', () => {
  it('wins set at 6-4', () => {
    let m = newMatch()
    // Interleave so we end exactly at 6-4 (A reaches 6 last)
    for (let i = 0; i < 4; i++) m = winGame(m, 'B')
    for (let i = 0; i < 6; i++) m = winGame(m, 'A')
    expect(m.score.sets.A).toBe(1)
    expect(m.score.setHistory[0]).toEqual({ A: 6, B: 4 })
  })

  it('wins set at 7-5 (win by two)', () => {
    let m = newMatch()
    // Build to 5-5
    for (let i = 0; i < 5; i++) m = winGame(m, 'A')
    for (let i = 0; i < 5; i++) m = winGame(m, 'B')
    expect(m.score.games).toEqual({ A: 5, B: 5 })
    // 6-5
    m = winGame(m, 'A')
    expect(m.score.sets.A).toBe(0)
    expect(m.score.games).toEqual({ A: 6, B: 5 })
    // 7-5
    m = winGame(m, 'A')
    expect(m.score.sets.A).toBe(1)
    expect(m.score.setHistory[0]).toEqual({ A: 7, B: 5 })
  })

  it('does not close the set at games-all + 1 (no tiebreak)', () => {
    let m = newMatch()
    // Alternate to reach 6-6
    for (let i = 0; i < 6; i++) {
      m = winGame(m, 'A')
      m = winGame(m, 'B')
    }
    expect(m.score.games).toEqual({ A: 6, B: 6 })
    // 7-6 does not win — a set needs a two-game margin.
    m = winGame(m, 'A')
    expect(m.score.sets.A).toBe(0)
    expect(m.score.games).toEqual({ A: 7, B: 6 })
    // 8-6 wins.
    m = winGame(m, 'A')
    expect(m.score.sets.A).toBe(1)
    expect(m.score.setHistory[0]).toEqual({ A: 8, B: 6 })
  })
})

describe('match winning', () => {
  it('does not auto-end — sets accumulate until the match is ended manually', () => {
    let m = newMatch()
    // Win 3 sets 6-0
    for (let s = 0; s < 3; s++) {
      for (let g = 0; g < 6; g++) m = winGame(m, 'A')
    }
    expect(isMatchOver(m)).toBe(false)
    expect(m.winner).toBeUndefined()
    expect(m.score.sets.A).toBe(3)
  })
})

describe('chases — laying', () => {
  it('layChase pushes to queue without changing score', () => {
    let m = newMatch()
    m = award(m, 'A') // 15-0
    const before = JSON.stringify(m.score)
    m = reduce(m, { type: 'layChase', value: serviceExact('4'), laidBy: 'B' })
    expect(m.pendingChases.length).toBe(1)
    expect(m.pendingChases[0].value.lines).toEqual(['4'])
    expect(m.pendingChases[0].value.end).toBe('service')
    expect(m.pendingChases[0].laidBy).toBe('B')
    expect(JSON.stringify(m.score)).toBe(before)
  })
})

describe('chases — playoff trigger', () => {
  it('two chases trigger playoff: ends switch, playoffActive, playoffRemaining=2', () => {
    let m = newMatch({ autoChase: true })
    const beforeEnd = m.servingEnd
    m = reduce(m, { type: 'layChase', value: serviceExact('4'), laidBy: 'B' })
    expect(m.playoffActive).toBe(false)
    m = reduce(m, { type: 'layChase', value: serviceBetween('1', '2'), laidBy: 'A' })
    expect(m.playoffActive).toBe(true)
    expect(m.playoffRemaining).toBe(2)
    expect(m.servingEnd).not.toBe(beforeEnd)
  })

  it('one chase + set point triggers playoff', () => {
    // Build state: A has 5 games, B has 4. Current game: A is at 40, B at 30.
    // Winning the next point would give A the set (6-4).
    let m = newMatch({ autoChase: true })
    for (let i = 0; i < 5; i++) m = winGame(m, 'A')
    for (let i = 0; i < 4; i++) m = winGame(m, 'B')
    expect(m.score.games).toEqual({ A: 5, B: 4 })
    // Bring A to 40, B to 30
    m = award(m, 'A')
    m = award(m, 'A')
    m = award(m, 'A')
    m = award(m, 'B')
    m = award(m, 'B')
    expect(m.score.points).toEqual({ A: 40, B: 30 })
    expect(isSetDecidingGame(m)).toBe(true)
    // Lay one chase — should auto-trigger
    m = reduce(m, { type: 'layChase', value: serviceExact('3'), laidBy: 'B' })
    expect(m.playoffActive).toBe(true)
    expect(m.playoffRemaining).toBe(1)
  })

  it('one chase + game point in an ordinary game triggers playoff (not only set points)', () => {
    // Regression: reproduces the exported match where a chase was laid, play
    // continued, and a player reached 40 in game 1 (0-0 in games) — the playoff
    // must fire on any game point, not just set-deciding games.
    let m = newMatch({ autoChase: true })
    m = reduce(m, { type: 'layChase', value: serviceExact('3'), laidBy: 'B' })
    expect(m.playoffActive).toBe(false)
    m = award(m, 'A') // 15-0
    m = award(m, 'A') // 30-0
    m = award(m, 'B') // 30-15
    expect(m.playoffActive).toBe(false)
    m = award(m, 'A') // 40-15 → A at game point, one chase pending
    expect(isSetDecidingGame(m)).toBe(false)
    expect(m.playoffActive).toBe(true)
    expect(m.playoffRemaining).toBe(1)
  })

  it('one chase triggers playoff when a chase is laid at an existing game point', () => {
    // Player already at game point, then a chase is laid → play off immediately.
    let m = newMatch({ autoChase: true })
    m = award(m, 'A') // 15-0
    m = award(m, 'A') // 30-0
    m = award(m, 'A') // 40-0 → A at game point, no chase yet
    expect(m.playoffActive).toBe(false)
    m = reduce(m, { type: 'layChase', value: serviceExact('3'), laidBy: 'B' })
    expect(m.playoffActive).toBe(true)
    expect(m.playoffRemaining).toBe(1)
  })

  it('shouldTriggerChasePlayoff returns false with single chase, no game point', () => {
    let m = newMatch({ autoChase: false })
    m = reduce(m, { type: 'layChase', value: serviceExact('4'), laidBy: 'B' })
    expect(shouldTriggerChasePlayoff(m)).toBe(false)
  })
})

describe('chases — playoff resolution', () => {
  it('awardPoint during playoff is chase-won, decrements remaining, drains queue', () => {
    let m = newMatch({ autoChase: true })
    m = reduce(m, { type: 'layChase', value: serviceExact('4'), laidBy: 'B' })
    m = reduce(m, { type: 'layChase', value: serviceExact('3'), laidBy: 'A' })
    expect(m.playoffActive).toBe(true)
    expect(m.playoffRemaining).toBe(2)

    m = award(m, 'A')
    expect(m.playoffRemaining).toBe(1)
    expect(m.playoffActive).toBe(true)
    expect(m.pendingChases.length).toBe(1)
    expect(m.events[m.events.length - 1].tag).toBe('chase-won')
    expect(m.score.points).toEqual({ A: 15, B: 0 })

    m = award(m, 'B')
    expect(m.playoffRemaining).toBe(0)
    expect(m.playoffActive).toBe(false)
    expect(m.pendingChases.length).toBe(0)
    expect(m.score.points).toEqual({ A: 15, B: 15 })
  })
})

describe('undo', () => {
  it('restores state after a normal point', () => {
    let m = newMatch()
    m = award(m, 'A')
    m = award(m, 'A')
    const snapshot = JSON.stringify({ score: m.score, serving: m.serving })
    m = award(m, 'B')
    m = reduce(m, { type: 'undo' })
    expect(JSON.stringify({ score: m.score, serving: m.serving })).toBe(snapshot)
  })

  it('restores state after a chase lay', () => {
    let m = newMatch({ autoChase: false })
    m = award(m, 'A')
    const before = { score: JSON.stringify(m.score), pending: m.pendingChases.length }
    m = reduce(m, { type: 'layChase', value: serviceExact('4'), laidBy: 'B' })
    expect(m.pendingChases.length).toBe(1)
    m = reduce(m, { type: 'undo' })
    expect(JSON.stringify(m.score)).toBe(before.score)
    expect(m.pendingChases.length).toBe(before.pending)
  })

  it('restores state after a full playoff', () => {
    let m = newMatch({ autoChase: true })
    m = reduce(m, { type: 'layChase', value: serviceExact('4'), laidBy: 'B' })
    m = reduce(m, { type: 'layChase', value: serviceExact('3'), laidBy: 'A' })
    // playoff begins; remaining 2
    m = award(m, 'A') // resolve first, playoff still active
    const checkpoint = {
      score: JSON.stringify(m.score),
      playoffActive: m.playoffActive,
      remaining: m.playoffRemaining,
      pending: m.pendingChases.length,
    }
    m = award(m, 'B') // resolve second, playoff ends
    expect(m.playoffActive).toBe(false)
    m = reduce(m, { type: 'undo' })
    expect(JSON.stringify(m.score)).toBe(checkpoint.score)
    expect(m.playoffActive).toBe(checkpoint.playoffActive)
    expect(m.playoffRemaining).toBe(checkpoint.remaining)
    expect(m.pendingChases.length).toBe(checkpoint.pending)
  })
})

describe('let tag', () => {
  it('does not change score and does not lay a chase', () => {
    let m = newMatch()
    m = award(m, 'A') // 15-0
    const before = JSON.stringify(m.score)
    m = reduce(m, { type: 'awardPoint', side: 'A', tag: 'let' })
    expect(JSON.stringify(m.score)).toBe(before)
    expect(m.pendingChases.length).toBe(0)
    expect(m.events[m.events.length - 1].tag).toBe('let')
    expect(m.events[m.events.length - 1].winner).toBeNull()
  })
})

describe('hazard tags', () => {
  it.each(['dedans', 'grille', 'gallery'] as const)('%s awards a normal point', (tag) => {
    let m = newMatch()
    m = reduce(m, { type: 'awardPoint', side: 'A', tag })
    expect(m.score.points).toEqual({ A: 15, B: 0 })
    expect(m.events[m.events.length - 1].tag).toBe(tag)
    expect(m.events[m.events.length - 1].winner).toBe('A')
  })
})

describe('handicap odds', () => {
  function hcpMatch(difference: number, receivingSide: Side): Match {
    return createMatch({
      players: { A: 'Paul', B: 'Other' },
      config: { ...baseConfig },
      serving: 'A',
      servingEnd: 'A',
      handicap: { difference, receivingSide },
    })
  }

  it('pre-loads the receiver ahead at game 1 (diff 6 = Rec 15)', () => {
    const m = hcpMatch(6, 'A')
    expect(m.score.points).toEqual({ A: 15, B: 0 })
    expect(m.score.owe).toEqual({ A: 0, B: 0 })
  })

  it('pre-loads receiver ahead and ower behind (diff 24 = Rec 30 / Owe 40)', () => {
    const m = hcpMatch(24, 'A')
    expect(m.score.points).toEqual({ A: 30, B: 0 })
    expect(m.score.owe).toEqual({ A: 0, B: 3 })
  })

  it('paying off owed points does not advance the score until the debt clears', () => {
    let m = hcpMatch(24, 'A') // B owes 40 (3 fifteens)
    m = award(m, 'B')
    expect(m.score.owe).toEqual({ A: 0, B: 2 })
    expect(m.score.points.B).toBe(0)
    m = award(m, 'B')
    m = award(m, 'B')
    expect(m.score.owe).toEqual({ A: 0, B: 0 })
    expect(m.score.points.B).toBe(0)
    // Debt cleared — now points advance normally.
    m = award(m, 'B')
    expect(m.score.points.B).toBe(15)
  })

  it('a receiver starting at 30 wins the game in two points', () => {
    let m = hcpMatch(22, 'A') // Rec 30 / Owe 30
    expect(m.score.points.A).toBe(30)
    m = award(m, 'A') // 40
    m = award(m, 'A') // game
    expect(m.score.games.A).toBe(1)
    // Game 2 re-loads the same concessions (full cadence).
    expect(m.score.points.A).toBe(30)
    expect(m.score.owe).toEqual({ A: 0, B: 2 })
  })

  it('half concessions skip game 1 and apply from game 2 (diff 5 = Rec/Owe half 15)', () => {
    let m = hcpMatch(5, 'A')
    // Game 1 (odd) — half 15 reduces to nothing.
    expect(m.score.points).toEqual({ A: 0, B: 0 })
    expect(m.score.owe).toEqual({ A: 0, B: 0 })
    // A wins game 1.
    m = winGame(m, 'A')
    // Game 2 (even) — the full half-value applies.
    expect(m.score.points.A).toBe(15)
    expect(m.score.owe).toEqual({ A: 0, B: 1 })
  })

  it('owe is not paid during a chase playoff (a point resolves the chase)', () => {
    let m = hcpMatch(4, 'A') // B owes 15
    expect(m.score.owe).toEqual({ A: 0, B: 1 })
    m = reduce(m, { type: 'layChase', value: serviceExact('4'), laidBy: 'B' })
    m = reduce(m, { type: 'layChase', value: serviceExact('3'), laidBy: 'A' })
    expect(m.playoffActive).toBe(true)
    m = award(m, 'B') // chase-won during playoff
    expect(m.score.points.B).toBe(15) // scored, not paid off
    expect(m.score.owe).toEqual({ A: 0, B: 1 }) // debt untouched
    expect(m.playoffRemaining).toBe(1)
  })

  it('undo restores the pre-loaded handicap start of the game', () => {
    let m = hcpMatch(6, 'A') // A starts at 15
    m = award(m, 'A') // 30
    expect(m.score.points.A).toBe(30)
    m = reduce(m, { type: 'undo' })
    expect(m.score.points.A).toBe(15)
    expect(m.score.owe).toEqual({ A: 0, B: 0 })
  })
})
