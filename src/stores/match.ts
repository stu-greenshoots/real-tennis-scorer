import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Action, Match, MatchConfig } from '../scoring/types'
import { createMatch, isMatchOver, reduce } from '../scoring/engine'
import { KEYS, load, remove, save } from '../lib/storage'
import { useHistoryStore } from './history'

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

function hydrate(): Match | null {
  const raw = load<unknown>(KEYS.active)
  if (raw === null) return null
  if (!isMatchShape(raw)) {
    console.warn('[match] discarded malformed active-match payload')
    remove(KEYS.active)
    return null
  }
  return raw
}

export const useMatchStore = defineStore('match', () => {
  const current = ref<Match | null>(null)

  // Hydrate from localStorage. If a stored match has already ended, push it
  // into history and clear the active slot.
  const hydrated = hydrate()
  if (hydrated) {
    if (hydrated.endedAt) {
      // Lazy import already happened at the top of the module — but the
      // history store may not be instantiated yet in some test setups, so
      // wrap defensively.
      try {
        useHistoryStore().add(hydrated)
      } catch (err) {
        console.warn('[match] failed to archive stored finished match:', err)
      }
      remove(KEYS.active)
    } else {
      current.value = hydrated
    }
  }

  // Auto-persist on every change. Deep watch because Match is a nested object
  // and engine reducers return new top-level refs anyway, but this covers
  // both shallow and deep mutations.
  watch(
    current,
    (next) => {
      if (next === null) {
        remove(KEYS.active)
      } else {
        save(KEYS.active, next)
      }
    },
    { deep: true },
  )

  const hasActiveMatch = computed(() => !!current.value && !current.value.endedAt)

  function start(
    players: { A: string; B: string },
    config: MatchConfig,
    avatars?: { A?: string; B?: string },
  ): void {
    const match = createMatch({ players, config })
    current.value = avatars ? { ...match, avatars } : match
  }

  function dispatch(action: Action): void {
    if (!current.value) {
      console.warn('[match] dispatch called with no active match')
      return
    }
    let next = reduce(current.value, action)
    if (isMatchOver(next) && !next.endedAt) {
      next = { ...next, endedAt: Date.now() }
    }
    current.value = next
    if (isMatchOver(next)) {
      // Archive into history. We keep `current` set so the UI can render a
      // "match won" screen; callers should call clear() once the user
      // dismisses it.
      try {
        useHistoryStore().add(next)
      } catch (err) {
        console.warn('[match] failed to archive finished match:', err)
      }
    }
  }

  function endMatch(): void {
    if (!current.value) return
    let next = reduce(current.value, { type: 'finish' })
    if (!next.endedAt) {
      next = { ...next, endedAt: Date.now() }
    }
    current.value = next
    try {
      useHistoryStore().add(next)
    } catch (err) {
      console.warn('[match] failed to archive ended match:', err)
    }
    current.value = null
  }

  function loadFromHistory(id: string): void {
    const match = useHistoryStore().getById(id)
    if (!match) {
      console.warn(`[match] history entry not found: ${id}`)
      return
    }
    // Deep clone so reviewing doesn't mutate the historical record.
    current.value = JSON.parse(JSON.stringify(match)) as Match
  }

  function clear(): void {
    current.value = null
  }

  return {
    current,
    hasActiveMatch,
    start,
    dispatch,
    endMatch,
    loadFromHistory,
    clear,
  }
})
