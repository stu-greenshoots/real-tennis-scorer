import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('stamps schema version on first import', async () => {
    const mod = await import('./storage')
    expect(localStorage.getItem(mod.KEYS.schemaVersion)).toBe(String(mod.SCHEMA_VERSION))
  })

  it('round-trips values via save/load', async () => {
    const { save, load } = await import('./storage')
    const payload = { a: 1, b: 'two', c: [1, 2, 3] }
    save('rts:test:roundtrip', payload)
    expect(load<typeof payload>('rts:test:roundtrip')).toEqual(payload)
  })

  it('returns null when JSON is corrupted', async () => {
    localStorage.setItem('rts:test:bad', '{ this is :: not json')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { load } = await import('./storage')
    expect(load('rts:test:bad')).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('returns null for missing keys', async () => {
    const { load } = await import('./storage')
    expect(load('rts:test:missing')).toBeNull()
  })

  it('warns on schema version mismatch but does not throw', async () => {
    localStorage.setItem('rts:schema-version', '999')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await import('./storage')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
