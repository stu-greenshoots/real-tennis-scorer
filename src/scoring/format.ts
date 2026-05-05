import type { ChaseLine, Match, ScoreSnapshot } from './types'

export function formatPoints(score: ScoreSnapshot, deuceLabel = 'deuce'): string {
  const { A, B } = score.points
  if (A === 40 && B === 40) return `40-40 → ${deuceLabel}`
  if (A === 'AD') return `AD-40`
  if (B === 'AD') return `40-AD`
  return `${A}-${B}`
}

export function formatChase(line: ChaseLine): string {
  switch (line) {
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
      return `chase ${line}`
    case 'better-than-half-a-yard':
      return 'chase better than half a yard'
    case 'half-a-yard':
      return 'chase half a yard'
    case 'worse-than-half-a-yard':
      return 'chase worse than half a yard'
    case 'last-gallery':
      return 'chase last gallery'
    case 'second-gallery':
      return 'chase second gallery'
    case 'door':
      return 'chase door'
    case 'first-gallery':
      return 'chase first gallery'
    case 'hazard-side':
      return 'chase hazard side'
  }
}

export function formatScoreLine(match: Match): string {
  const setNum = match.score.setHistory.length + 1
  const gameNum = match.score.games.A + match.score.games.B + 1
  const a = match.players.A
  const b = match.players.B
  const ap = match.score.points.A
  const bp = match.score.points.B
  return `Set ${setNum}, Game ${gameNum} — ${a} ${ap}, ${b} ${bp}`
}
