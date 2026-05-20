import type { Chase, ChaseValue, Match, PointEvent } from './types'

/**
 * Pre-existing flat chase identifiers (schema v1). Mapped to the new
 * structured ChaseValue shape so historical matches still render correctly.
 */
const LEGACY_LINE_MAP: Record<string, ChaseValue> = {
  '1': { end: 'service', modifier: 'exact', lines: ['1'] },
  '2': { end: 'service', modifier: 'exact', lines: ['2'] },
  '3': { end: 'service', modifier: 'exact', lines: ['3'] },
  '4': { end: 'service', modifier: 'exact', lines: ['4'] },
  '5': { end: 'service', modifier: 'exact', lines: ['5'] },
  '6': { end: 'service', modifier: 'exact', lines: ['6'] },
  'better-than-half-a-yard': { end: 'service', modifier: 'better', lines: ['1'] },
  'half-a-yard': { end: 'service', modifier: 'between', lines: ['1', '2'] },
  'worse-than-half-a-yard': { end: 'service', modifier: 'worse', lines: ['1'] },
  'last-gallery': { end: 'service', modifier: 'exact', lines: ['last-gallery'] },
  'second-gallery': { end: 'service', modifier: 'exact', lines: ['second-gallery'] },
  door: { end: 'service', modifier: 'exact', lines: ['door'] },
  'first-gallery': { end: 'service', modifier: 'exact', lines: ['first-gallery'] },
  'hazard-side': { end: 'hazard', modifier: 'exact', lines: ['hazard-1'] },
}

function upgradeChaseValue(raw: unknown): ChaseValue | null {
  if (typeof raw === 'string') return LEGACY_LINE_MAP[raw] ?? null
  if (raw && typeof raw === 'object') {
    const r = raw as Partial<ChaseValue>
    if (r.end && r.modifier && Array.isArray(r.lines)) return raw as ChaseValue
  }
  return null
}

/**
 * Upgrade an in-place legacy match payload (read from localStorage) into the
 * current schema. Returns the same reference so callers can chain.
 */
export function migrateMatch(match: Match): Match {
  if (Array.isArray(match.pendingChases)) {
    match.pendingChases = match.pendingChases
      .map((c) => {
        const legacy = (c as unknown as { line?: unknown }).line
        if ((c as Chase).value) return c as Chase
        const upgraded = upgradeChaseValue(legacy)
        if (!upgraded) return null
        return { value: upgraded, laidBy: c.laidBy, scoreAtLay: c.scoreAtLay } as Chase
      })
      .filter((c): c is Chase => c !== null)
  }
  if (Array.isArray(match.events)) {
    match.events = match.events.map((ev) => {
      const e = ev as PointEvent
      if (!e.chaseLaid) return e
      const upgraded = upgradeChaseValue(e.chaseLaid as unknown)
      if (!upgraded) {
        const { chaseLaid: _drop, ...rest } = e
        return rest as PointEvent
      }
      return { ...e, chaseLaid: upgraded }
    })
  }
  return match
}
