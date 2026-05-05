<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore } from '../stores/history'
import type { Match } from '../scoring/types'

const router = useRouter()
const historyStore = useHistoryStore()

const matches = computed(() => {
  const list = [...historyStore.matches]
  list.sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt))
  return list
})

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function finalScoreLine(m: Match): string {
  const sets = m.score.setHistory
  if (!sets || sets.length === 0) {
    return `${m.score.sets.A}–${m.score.sets.B} sets`
  }
  return sets.map((s) => `${s.A}–${s.B}`).join(', ')
}

function winnerSummary(m: Match): string {
  if (m.winner) {
    const w = m.players[m.winner]
    const l = m.players[m.winner === 'A' ? 'B' : 'A']
    return `${w} def. ${l}`
  }
  return `${m.players.A} vs ${m.players.B}`
}

function open(m: Match) {
  router.push(`/match/${m.id}`)
}
</script>

<template>
  <div class="view history-view">
    <header class="view-header">
      <button class="btn btn-ghost" @click="router.push('/')">‹ Home</button>
      <h1>History</h1>
      <span></span>
    </header>

    <div v-if="matches.length === 0" class="card center muted">
      No matches yet.
    </div>

    <ul v-else class="match-list">
      <li
        v-for="m in matches"
        :key="m.id"
        class="match-row card"
        @click="open(m)"
      >
        <div class="row top">
          <span class="date muted">{{ formatDate(m.startedAt) }}</span>
          <span class="muted small">{{ finalScoreLine(m) }}</span>
        </div>
        <div class="players">{{ winnerSummary(m) }}</div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.history-view { display: flex; flex-direction: column; gap: 0.75rem; }
.match-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.match-row {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.match-row .top { justify-content: space-between; }
.players { font-weight: 600; }
.small { font-size: 0.8rem; }
</style>
