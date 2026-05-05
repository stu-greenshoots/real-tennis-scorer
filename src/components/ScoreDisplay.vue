<script setup lang="ts">
import { computed } from 'vue'
import type { Match, GamePoints } from '../scoring/types'

const props = defineProps<{ match: Match }>()

// Local fallback formatter; Agent 2's format.ts will export formatPoints
// once ready. We could import it, but to avoid circular blocker risk
// we keep this local — formatting rules are trivial.
function formatPoints(p: GamePoints): string {
  return p === 'AD' ? 'AD' : String(p)
}

const score = computed(() => props.match.score)
const players = computed(() => props.match.players)

function gamePoints(side: 'A' | 'B'): string {
  return formatPoints(score.value.points[side])
}
</script>

<template>
  <div class="score-display card">
    <div class="row sides">
      <div class="side">
        <div class="name">{{ players.A }}</div>
        <div class="points">{{ gamePoints('A') }}</div>
        <div class="meta muted">
          <span>Games {{ score.games.A }}</span>
          <span>Sets {{ score.sets.A }}</span>
        </div>
      </div>
      <div class="vs muted">vs</div>
      <div class="side">
        <div class="name">{{ players.B }}</div>
        <div class="points">{{ gamePoints('B') }}</div>
        <div class="meta muted">
          <span>Games {{ score.games.B }}</span>
          <span>Sets {{ score.sets.B }}</span>
        </div>
      </div>
    </div>
    <div v-if="score.setHistory && score.setHistory.length" class="set-history muted">
      <span v-for="(s, i) in score.setHistory" :key="i" class="set-chip">
        {{ s.A }}–{{ s.B }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.score-display { display: flex; flex-direction: column; gap: 0.5rem; }
.sides {
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.name { font-weight: 600; }
.points {
  font-size: 2.2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--primary);
  line-height: 1.1;
}
.meta {
  display: flex;
  gap: 0.6rem;
  font-size: 0.85rem;
}
.vs { font-size: 0.85rem; }
.set-history {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
.set-chip {
  padding: 0.15rem 0.5rem;
  background: var(--surface-2);
  border-radius: 999px;
  border: 1px solid var(--border);
}
</style>
