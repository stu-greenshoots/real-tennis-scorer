<script setup lang="ts">
import { computed } from 'vue'
import type { PointEvent, GamePoints, Match } from '../scoring/types'
import Portrait from './Portrait.vue'
import GlyphDivider from './GlyphDivider.vue'
import Glyphs from './Glyphs.vue'
import { PAUL, OPPONENT_AVATARS } from '../lib/roster'
import { formatChase } from '../scoring/format'

const props = defineProps<{
  events: PointEvent[]
  players: { A: string; B: string }
  match?: Match
}>()

function fmtPoints(p: GamePoints): string {
  return p === 'AD' ? 'AD' : String(p)
}

function tagLabel(tag?: string): string {
  if (!tag) return ''
  return tag.replace(/-/g, ' ')
}

const avatarA = computed(() => {
  const photo = props.match?.photos?.A
  return photo ? { ...PAUL, src: photo } : PAUL
})
const avatarB = computed(() => {
  const id = props.match?.avatars?.B
  const base = OPPONENT_AVATARS.find((o) => o.id === id) ??
    { id: 'opponent', bg: 'var(--accent)', silhouette: 'glasses' as const }
  const photo = props.match?.photos?.B
  return photo ? { ...base, src: photo } : base
})

interface Group {
  setIndex: number
  gameIndex: number
  label: string
  glyph: 'penthouse' | 'dedans' | 'grille' | 'tambour' | 'racquet'
  events: PointEvent[]
}

const GLYPH_ORDER: Group['glyph'][] = ['penthouse', 'dedans', 'grille', 'tambour', 'racquet']

const groups = computed<Group[]>(() => {
  const out: Group[] = []
  let lastKey = ''
  for (const ev of props.events) {
    const sa = ev.scoreAfter
    const setIndex = (sa?.setHistory?.length ?? 0) + 1
    const gameIndex = (sa?.games?.A ?? 0) + (sa?.games?.B ?? 0) + 1
    const key = `${setIndex}-${gameIndex}`
    if (key !== lastKey) {
      out.push({
        setIndex,
        gameIndex,
        label: `Set ${setIndex} · Game ${gameIndex}`,
        glyph: GLYPH_ORDER[out.length % GLYPH_ORDER.length],
        events: [],
      })
      lastKey = key
    }
    out[out.length - 1].events.push(ev)
  }
  return out
})

function tagBadge(ev: PointEvent): string {
  if (ev.chaseLaid) return formatChase(ev.chaseLaid)
  if (ev.tag) return tagLabel(ev.tag)
  if (ev.endsSwitchedAfter) return 'Ends switched'
  if (ev.note) return ev.note
  return ''
}
</script>

<template>
  <div class="timeline">
    <div v-if="!events.length" class="muted center" style="padding: 1rem;">No events yet.</div>
    <div v-for="g in groups" :key="`${g.setIndex}-${g.gameIndex}`" class="timeline-group">
      <GlyphDivider :glyph="g.glyph" :label="g.label" />
      <ul class="events">
        <li v-for="ev in g.events" :key="ev.id" class="event">
          <Portrait
            v-if="ev.winner === 'A'"
            v-bind="avatarA"
            :size="36"
          />
          <Portrait
            v-else-if="ev.winner === 'B'"
            v-bind="avatarB"
            :size="36"
          />
          <div v-else class="event-marker">
            <Glyphs :glyph="ev.chaseLaid ? 'penthouse' : 'ball'" :size="22" color="var(--text-muted)" />
          </div>
          <div class="event-text">
            <div class="event-line">
              <span v-if="ev.scoreAfter" class="score">
                {{ fmtPoints(ev.scoreAfter.points.A) }}–{{ fmtPoints(ev.scoreAfter.points.B) }}
              </span>
              <span class="tag">{{ tagBadge(ev) }}</span>
            </div>
            <div v-if="ev.winner" class="event-sub">{{ players[ev.winner] }}</div>
            <div v-else-if="ev.note" class="event-sub muted">{{ ev.note }}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.timeline { display: flex; flex-direction: column; gap: 0.5rem; }
.timeline-group { padding: 0; }
.events {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}
.event {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 0.25rem;
  border-bottom: 1px solid var(--line);
}
.event:last-child { border-bottom: none; }
.event-marker {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--surface-sunken);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.event-text { flex: 1; min-width: 0; }
.event-line { display: flex; gap: 0.4rem; align-items: baseline; }
.score {
  font-family: var(--font-display);
  font-size: 1.3rem;
  line-height: 1;
  font-weight: 700;
  color: var(--text);
}
.tag {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: capitalize;
}
.event-sub { font-size: 0.7rem; color: var(--text-faint); }
</style>
