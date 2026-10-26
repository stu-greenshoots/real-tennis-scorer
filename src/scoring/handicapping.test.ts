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
    expect(oweLabel(ruleForDifference(16)!.owe)).toBe('Owe half 30')
  })

  it('anything 50+ hits the open-ended top row with structural handicaps', () => {
    const r = ruleForDifference(75)!
    expect(oweLabel(r.owe)).toBe('Owe 40')
    expect(r.structural).toContain('One serve only')
  })

  it('structural handicaps start at difference 28', () => {
    expect(ruleForDifference(27)!.structural).toBeNull()
    expect(ruleForDifference(28)!.structural).toBe('One serve only. Tambour banned.')
  })

  it('chase restrictions start at difference 36 (Rec 30 / Owe 15 ^ abolished)', () => {
    expect(ruleForDifference(35)!.structural).toBe('One serve only. Tambour banned.')
    expect(ruleForDifference(36)!.structural).toContain('Chases worse than 3 & 4 banned')
  })

  // The "New Singles" column of the T&RA odds calculator effective 1 Aug 2026,
  // as [receive, owe] labels for each difference 1..50.
  const NEW_SINGLES: Record<number, [string, string]> = {}
  const row = (diffs: number[], rec: string, owe: string) =>
    diffs.forEach((d) => (NEW_SINGLES[d] = [rec, owe]))
  row([1], 'Love', 'Owe quarter 15')
  row([2], 'Love', 'Owe half 15')
  row([3], 'Rec half 15', 'Love')
  row([4], 'Love', 'Owe 15')
  row([5], 'Rec half 15', 'Owe half 15')
  row([6], 'Rec 15', 'Love')
  row([7], 'Rec half 15', 'Owe 15')
  row([8], 'Rec 15', 'Owe half 15')
  row([9], 'Rec half 15', 'Owe half 30')
  row([10, 11], 'Rec 15', 'Owe 15')
  row([12], 'Rec half 15', 'Owe 30')
  row([13], 'Rec 15', 'Owe half 30')
  row([14], 'Rec 15', 'Owe 30')
  row([15], 'Rec half 30', 'Owe 15')
  row([16, 17], 'Rec half 30', 'Owe half 30')
  row([18, 19], 'Rec half 30', 'Owe 30')
  row([20, 21], 'Rec 30', 'Owe 15')
  row([22, 23], 'Rec 30', 'Owe half 30')
  row([24, 25], 'Rec 30', 'Owe 30')
  row([26, 27], 'Rec 30', 'Owe 40')
  row([28, 29], 'Rec 30', 'Owe 15')
  row([30, 31], 'Rec 30', 'Owe half 30')
  row([32, 33], 'Rec 30', 'Owe 30')
  row([34, 35], 'Rec 30', 'Owe 40')
  row([36, 37], 'Rec 30', 'Owe half 30')
  row([38, 39], 'Rec 30', 'Owe 30')
  row([40, 41], 'Rec 30', 'Owe 40')
  row([42, 43], 'Rec 30', 'Owe 30')
  row([44, 45], 'Rec 30', 'Owe 40')
  row([46, 47], 'Rec 30', 'Owe half 30')
  row([48, 49], 'Rec 30', 'Owe 30')
  row([50], 'Rec 30', 'Owe 40')

  it.each(Object.entries(NEW_SINGLES).map(([d, v]) => [Number(d), ...v]))(
    'difference %i → %s / %s',
    (diff, rec, owe) => {
      const r = ruleForDifference(diff as number)!
      expect(receiveLabel(r.receive)).toBe(rec)
      expect(oweLabel(r.owe)).toBe(owe)
    },
  )
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
