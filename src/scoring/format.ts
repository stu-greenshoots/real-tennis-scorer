import type { ChaseLine, ChaseValue, Match, ScoreSnapshot } from './types'

export function formatPoints(score: ScoreSnapshot, deuceLabel = 'deuce'): string {
  const { A, B } = score.points
  if (A === 40 && B === 40) return `40-40 → ${deuceLabel}`
  if (A === 'AD') return `AD-40`
  if (B === 'AD') return `40-AD`
  return `${A}-${B}`
}

/** Human label for a single chase-line id (no end / modifier wrapping). */
export function formatLine(line: ChaseLine): string {
  switch (line) {
    case '1':
      return '1 yard'
    case '2':
      return '2 yards'
    case '3':
      return '3 yards'
    case '4':
      return '4 yards'
    case '5':
      return '5 yards'
    case '6':
      return '6 yards'
    case 'last-gallery':
      return 'last gallery'
    case 'yard-worse':
      return 'yard worse'
    case 'second-gallery':
      return 'second gallery'
    case 'door':
      return 'the door'
    case 'first-gallery':
      return 'first gallery'
    case 'the-line':
      return 'the line'
    case 'hazard-1':
      return '1 yard'
    case 'hazard-2':
      return '2 yards'
    case 'hazard-second-gallery':
      return '2nd gallery'
    case 'hazard-door':
      return 'the door'
    case 'hazard-first-gallery':
      return '1st gallery'
    case 'hazard-line':
      return 'the line'
  }
}

export function formatChase(value: ChaseValue): string {
  // All chases are "Chase ..."; chases laid at the hazard end (the receiver's
  // end) get an extra "hazard" qualifier after the verb.
  const prefix = value.end === 'hazard' ? 'Chase hazard' : 'Chase'
  if (value.modifier === 'between' && value.lines.length === 2) {
    return `${prefix} between ${formatLine(value.lines[0])} and ${formatLine(value.lines[1])}`
  }
  const line = formatLine(value.lines[0])
  if (value.modifier === 'better') return `${prefix} better than ${line}`
  if (value.modifier === 'worse') return `${prefix} worse than ${line}`
  return `${prefix} ${line}`
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
