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
