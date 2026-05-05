<script setup lang="ts">
import { computed } from 'vue'
import type { PointEvent, GamePoints } from '../scoring/types'

const props = defineProps<{
  events: PointEvent[]
  players: { A: string; B: string }
}>()

function fmtPoints(p: GamePoints): string {
  return p === 'AD' ? 'AD' : String(p)
}

function tagLabel(tag?: string): string {
  if (!tag) return ''
  return tag.replace(/-/g, ' ')
}

interface Group {
  setIndex: number
  gameIndex: number
  label: string
  events: PointEvent[]
}

// Group consecutive events by (setIndex, gameIndex) derived from scoreAfter.
const groups = computed<Group[]>(() => {
  const out: Group[] = []
  let lastKey = ''
  for (const ev of props.events) {
    const sa = ev.scoreAfter
    const setIndex = (sa?.setHistory?.length ?? 0) + 1 // current set number
    const gameIndex = (sa?.games?.A ?? 0) + (sa?.games?.B ?? 0) + 1
    const key = `${setIndex}-${gameIndex}`
    if (key !== lastKey) {
      out.push({
        setIndex,
        gameIndex,
        label: `Set ${setIndex}, Game ${gameIndex}`,
        events: [],
      })
      lastKey = key
    }
    out[out.length - 1].events.push(ev)
  }
  return out
})

function describe(ev: PointEvent): string {
  if (ev.chaseLaid) {
    return `Chase laid: ${ev.chaseLaid.replace(/-/g, ' ')}`
  }
  if (ev.winner) {
    const name = props.players[ev.winner]
    const points = ev.scoreAfter?.points
    const ptStr = points
      ? `${fmtPoints(points.A)}-${fmtPoints(points.B)}`
      : ''
    const tag = ev.tag ? ` (${tagLabel(ev.tag)})` : ''
    return `${name} ${ptStr}${tag}`
  }
  if (ev.note) return ev.note
  return 'Event'
}
</script>

<template>
  <div class="timeline">
    <div v-if="!events.length" class="muted center">No events yet.</div>
    <div v-for="g in groups" :key="`${g.setIndex}-${g.gameIndex}`" class="timeline-group">
      <div class="group-label muted">{{ g.label }}</div>
      <ul class="events">
        <li v-for="ev in g.events" :key="ev.id" class="event">
          <span class="bullet" :class="{ a: ev.winner === 'A', b: ev.winner === 'B' }"></span>
          <span class="desc">{{ describe(ev) }}</span>
          <span v-if="ev.endsSwitchedAfter" class="badge ends">Ends switched</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.timeline-group {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 0.6rem 0.8rem;
}
.group-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}
.events {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.event {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px dashed var(--border);
  font-size: 0.95rem;
}
.event:last-child { border-bottom: none; }
.bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
  flex-shrink: 0;
}
.bullet.a { background: var(--primary); }
.bullet.b { background: var(--accent); }
.desc { flex: 1; }
.ends { font-size: 0.75rem; }
</style>
