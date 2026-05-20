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
  setsToWin: 2,
  gamesPerSet: 6,
  tiebreak: false,
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

describe('serving alternation', () => {
  it('alternates server when a game is won', () => {
    let m = newMatch({}, 'A')
    expect(m.serving).toBe('A')
    m = winGame(m, 'A')
    expect(m.serving).toBe('B')
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

  it('wins set at 7-5 (no tiebreak)', () => {
    let m = newMatch({ tiebreak: false })
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

  it('wins set at 7-6 with tiebreak enabled', () => {
    let m = newMatch({ tiebreak: true })
    // Alternate to reach 6-6
    for (let i = 0; i < 6; i++) {
      m = winGame(m, 'A')
      m = winGame(m, 'B')
    }
    expect(m.score.games).toEqual({ A: 6, B: 6 })
    // Win the tiebreak game (modeled as a single game)
    m = winGame(m, 'A')
    expect(m.score.sets.A).toBe(1)
    expect(m.score.setHistory[0]).toEqual({ A: 7, B: 6 })
  })
})

describe('match winning', () => {
  it('match ends when setsToWin reached', () => {
    let m = newMatch({ setsToWin: 2 })
    // Win 2 sets 6-0
    for (let s = 0; s < 2; s++) {
      for (let g = 0; g < 6; g++) m = winGame(m, 'A')
    }
    expect(isMatchOver(m)).toBe(true)
    expect(m.winner).toBe('A')
    expect(m.score.sets.A).toBe(2)
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

  it('one chase + set-deciding game with game point triggers playoff', () => {
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
