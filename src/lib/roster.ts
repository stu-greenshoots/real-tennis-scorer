export type Silhouette =
  | 'long-hair-beard'
  | 'moustache'
  | 'ponytail'
  | 'bald-goatee'
  | 'glasses'
  | 'messy-hair'
  | 'hooded'

export interface Avatar {
  id: string
  bg: string
  silhouette: Silhouette
}

/** The locked Player A — Paul. */
export const PAUL: Avatar = {
  id: 'paul',
  bg: 'var(--primary)',
  silhouette: 'long-hair-beard',
}

/**
 * Anonymous avatar slots Player B can pick from. No character names —
 * just a face. The user types whatever name they want for their opponent.
 */
export const OPPONENT_AVATARS: Avatar[] = [
  { id: 'opp-veteran',   bg: 'var(--accent)',  silhouette: 'moustache' },
  { id: 'opp-ponytail',  bg: '#7a2530',         silhouette: 'ponytail' },
  { id: 'opp-bald',      bg: '#4a7a3a',         silhouette: 'bald-goatee' },
  { id: 'opp-glasses',   bg: 'var(--slate)',    silhouette: 'glasses' },
  { id: 'opp-messy',     bg: '#c98c2a',         silhouette: 'messy-hair' },
  { id: 'opp-hooded',    bg: '#1a1410',         silhouette: 'hooded' },
]

/** Every selectable character. Either player can be any of these. */
export const ALL_AVATARS: Avatar[] = [PAUL, ...OPPONENT_AVATARS]

const AVATAR_PLACEHOLDER: Avatar = {
  id: 'opponent',
  bg: 'var(--surface-sunken)',
  silhouette: 'long-hair-beard',
}

/**
 * Resolve a stored avatar id (and optional uploaded photo) to the props the
 * Portrait component expects. Both players are symmetric — either can be any
 * character — so lookups span the whole roster rather than assuming A = Paul.
 */
export function resolveAvatar(
  id: string | null | undefined,
  photo?: string,
): { id: string; bg: string; silhouette: Silhouette; src?: string } {
  const base = (id ? ALL_AVATARS.find((a) => a.id === id) : undefined) ?? AVATAR_PLACEHOLDER
  return photo ? { ...base, src: photo } : base
}
