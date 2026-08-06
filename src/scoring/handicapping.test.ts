import { describe, it, expect } from 'vitest'
import {
  concessionFifteensForGame,
  concessionLabel,
  oweLabel,
  receiveLabel,
  ruleForDifference,
  type Concession,
} from './handicapping'

describe('ruleForDifference', () => {
  it('returns null when level (0 or below)', () => {
    expect(ruleForDifference(0)).toBeNull()
    expect(ruleForDifference(-3)).toBeNull()
  })

  it('matches the sheet at difference 2 (receiving Love, owing owe half 15)', () => {
    const r = ruleForDifference(2)!
    expect(r.receive).toEqual({ kind: 'none' })
    expect(r.owe).toEqual({ kind: 'points', fifteens: 1, cadence: 'half' })
    expect(receiveLabel(r.receive)).toBe('Love')
    expect(oweLabel(r.owe)).toBe('Owe half 15')
  })

  it('difference 1 owes quarter 15', () => {
    expect(oweLabel(ruleForDifference(1)!.owe)).toBe('Owe quarter 15')
  })

  it('collapses ranges — 16 and 17 share a row', () => {
    expect(ruleForDifference(16)).toBe(ruleForDifference(17))
    expect(receiveLabel(ruleForDifference(16)!.receive)).toBe('Rec half 30')
    expect(oweLabel(ruleForDifference(16)!.owe)).toBe('Owe 30')
  })

  it('anything 50+ hits the open-ended top row with structural handicaps', () => {
    const r = ruleForDifference(75)!
    expect(oweLabel(r.owe)).toBe('Owe 40')
    expect(r.structural).toContain('One serve only')
  })

  it('structural handicaps start at difference 26', () => {
    expect(ruleForDifference(25)!.structural).toBeNull()
    expect(ruleForDifference(26)!.structural).toBe('One serve only. Tambour banned.')
  })
})

describe('concessionLabel', () => {
  it.each([
    [{ kind: 'none' } as Concession, 'Love'],
    [{ kind: 'points', fifteens: 1, cadence: 'full' } as Concession, '15'],
    [{ kind: 'points', fifteens: 2, cadence: 'full' } as Concession, '30'],
    [{ kind: 'points', fifteens: 3, cadence: 'full' } as Concession, '40'],
    [{ kind: 'points', fifteens: 2, cadence: 'half' } as Concession, 'half 30'],
    [{ kind: 'points', fifteens: 1, cadence: 'quarter' } as Concession, 'quarter 15'],
  ])('%o → %s', (c, label) => {
    expect(concessionLabel(c)).toBe(label)
  })
})

describe('concessionFifteensForGame (cadence)', () => {
  const half30: Concession = { kind: 'points', fifteens: 2, cadence: 'half' }
  const half15: Concession = { kind: 'points', fifteens: 1, cadence: 'half' }
  const quarter15: Concession = { kind: 'points', fifteens: 1, cadence: 'quarter' }
  const full30: Concession = { kind: 'points', fifteens: 2, cadence: 'full' }

  it('half 30 → 15, 30, 15, 30 across games 1..4 (one fifteen less on odd games)', () => {
    expect([1, 2, 3, 4].map((g) => concessionFifteensForGame(half30, g))).toEqual([1, 2, 1, 2])
  })

  it('half 15 → 0, 15, 0, 15', () => {
    expect([1, 2, 3, 4].map((g) => concessionFifteensForGame(half15, g))).toEqual([0, 1, 0, 1])
  })

  it('quarter 15 → only on every 4th game', () => {
    expect([1, 2, 3, 4, 8].map((g) => concessionFifteensForGame(quarter15, g))).toEqual([0, 0, 0, 1, 1])
  })

  it('full 30 → 30 every game', () => {
    expect([1, 2, 3].map((g) => concessionFifteensForGame(full30, g))).toEqual([2, 2, 2])
  })

  it('none → 0 always', () => {
    expect(concessionFifteensForGame({ kind: 'none' }, 2)).toBe(0)
  })
})
