import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Match } from '../scoring/types'
import { KEYS, load, save } from '../lib/storage'

/**
 * Soft cap on how many matches we keep in localStorage. Each match is a few
 * KB and the localStorage budget is ~5MB; 200 leaves plenty of headroom.
 */
const HISTORY_CAP = 200

function isMatchShape(value: unknown): value is Match {
  if (!value || typeof value !== 'object') return false
  const m = value as Partial<Match>
  return (
    typeof m.id === 'string' &&
    typeof m.startedAt === 'number' &&
    !!m.players &&
    typeof m.players.A === 'string' &&
    typeof m.players.B === 'string' &&
    !!m.config &&
    !!m.score &&
    Array.isArray(m.events)
  )
}

function hydrate(): Match[] {
  const raw = load<unknown>(KEYS.history)
  if (!Array.isArray(raw)) return []
  const matches = raw.filter(isMatchShape)
  if (matches.length !== raw.length) {
    console.warn(
      `[history] discarded ${raw.length - matches.length} malformed match entr${
        raw.length - matches.length === 1 ? 'y' : 'ies'
      }`,
    )
  }
  return matches
}

export const useHistoryStore = defineStore('history', () => {
  const matches = ref<Match[]>(hydrate())

  // Auto-persist on any change.
  watch(
    matches,
    (next) => {
      save(KEYS.history, next)
    },
    { deep: true },
  )

  function list(): Match[] {
    return matches.value
  }

  function getById(id: string): Match | undefined {
    return matches.value.find((m) => m.id === id)
  }

  function add(match: Match): void {
    // Dedupe by id — replace any existing entry with the same id.
    const without = matches.value.filter((m) => m.id !== match.id)
    without.unshift(match)
    // Apply soft cap (oldest dropped first).
    if (without.length > HISTORY_CAP) {
      without.length = HISTORY_CAP
    }
    matches.value = without
  }

  function remove(id: string): void {
    matches.value = matches.value.filter((m) => m.id !== id)
  }

  function clear(): void {
    matches.value = []
  }

  function exportJson(id: string): string {
    const match = getById(id)
    return match ? JSON.stringify(match, null, 2) : ''
  }

  function exportAllJson(): string {
    return JSON.stringify({ version: 1, matches: matches.value }, null, 2)
  }

  /**
   * Import matches from a JSON string. Accepts either:
   *  - the full export shape `{ version, matches: [...] }`
   *  - a bare array of matches
   *  - a single match object
   * Merges by id (existing entries are replaced). Returns counts.
   */
  function importJson(raw: string): { added: number; skipped: number } {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { added: 0, skipped: 0 }
    }
    let incoming: unknown[]
    if (Array.isArray(parsed)) {
      incoming = parsed
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { matches?: unknown }).matches)) {
      incoming = (parsed as { matches: unknown[] }).matches
    } else if (parsed && typeof parsed === 'object') {
      incoming = [parsed]
    } else {
      return { added: 0, skipped: 0 }
    }
    let added = 0
    let skipped = 0
    for (const item of incoming) {
      if (isMatchShape(item)) {
        add(item)
        added++
      } else {
        skipped++
      }
    }
    return { added, skipped }
  }

  return {
    matches,
    list,
    getById,
    add,
    delete: remove,
    clear,
    exportJson,
    exportAllJson,
    importJson,
  }
})
