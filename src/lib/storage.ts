/**
 * Typed localStorage wrapper with schema versioning.
 *
 * - All reads are wrapped in try/catch so corrupted JSON or quota issues
 *   degrade gracefully (returning null and logging a warning).
 * - Schema version is stamped on first use. If we ever bump SCHEMA_VERSION
 *   in the future, add a migration here.
 */

const SCHEMA_VERSION = 1

const KEYS = {
  active: 'rts:active-match',
  history: 'rts:history',
  schemaVersion: 'rts:schema-version',
} as const

export { KEYS, SCHEMA_VERSION }

function hasStorage(): boolean {
  try {
    return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function load<T>(key: string): T | null {
  if (!hasStorage()) return null
  try {
    const raw = globalThis.localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[storage] failed to load key "${key}":`, err)
    return null
  }
}

export function save<T>(key: string, value: T): void {
  if (!hasStorage()) return
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.warn(`[storage] failed to save key "${key}":`, err)
  }
}

export function remove(key: string): void {
  if (!hasStorage()) return
  try {
    globalThis.localStorage.removeItem(key)
  } catch (err) {
    console.warn(`[storage] failed to remove key "${key}":`, err)
  }
}

// Initialise / check schema version on module load.
;(function initSchema() {
  if (!hasStorage()) return
  try {
    const raw = globalThis.localStorage.getItem(KEYS.schemaVersion)
    if (raw === null) {
      globalThis.localStorage.setItem(KEYS.schemaVersion, String(SCHEMA_VERSION))
      return
    }
    const stored = Number(raw)
    if (!Number.isFinite(stored) || stored !== SCHEMA_VERSION) {
      // TODO: implement migrations when SCHEMA_VERSION is bumped past 1.
      console.warn(
        `[storage] schema version mismatch (stored=${raw}, expected=${SCHEMA_VERSION}); no migration available yet`,
      )
    }
  } catch (err) {
    console.warn('[storage] schema init failed:', err)
  }
})()
