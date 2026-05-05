<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useHistoryStore } from '../stores/history'
import type { Match } from '../scoring/types'

const router = useRouter()
const historyStore = useHistoryStore()
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const matches = computed(() => {
  const list = [...historyStore.matches]
  list.sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt))
  return list
})

const pendingDelete = ref<string | null>(null)
const importMessage = ref<string | null>(null)

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

function askDelete(id: string, ev: Event) {
  ev.stopPropagation()
  pendingDelete.value = id
}

function confirmDelete() {
  if (pendingDelete.value) {
    historyStore.delete(pendingDelete.value)
  }
  pendingDelete.value = null
}

function exportAll() {
  const json = historyStore.exportAllJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `paul-tennis-history-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function pickImportFile() {
  fileInput.value?.click()
}

async function onFileChosen(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const result = historyStore.importJson(text)
    if (result.added === 0 && result.skipped === 0) {
      importMessage.value = "Couldn't read that file."
    } else {
      const skipNote = result.skipped > 0 ? `, ${result.skipped} skipped` : ''
      importMessage.value = `Imported ${result.added} match${result.added === 1 ? '' : 'es'}${skipNote}.`
    }
  } catch {
    importMessage.value = 'Import failed.'
  } finally {
    input.value = ''
    setTimeout(() => (importMessage.value = null), 4000)
  }
}
</script>

<template>
  <div class="view history-view">
    <header class="view-header">
      <button class="btn btn-ghost" @click="router.push('/')">‹ Home</button>
      <h1>History</h1>
      <span></span>
    </header>

    <div class="backup-row">
      <button class="btn btn-small" :disabled="matches.length === 0" @click="exportAll">
        Export backup
      </button>
      <button class="btn btn-small" @click="pickImportFile">Import backup</button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        style="display: none"
        @change="onFileChosen"
      />
    </div>
    <div v-if="importMessage" class="import-toast muted small">{{ importMessage }}</div>

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
        <div class="row bottom">
          <span class="players">{{ winnerSummary(m) }}</span>
          <button
            class="btn btn-ghost btn-small delete-btn"
            :aria-label="`Delete match ${m.players.A} vs ${m.players.B}`"
            @click="askDelete(m.id, $event)"
          >
            🗑
          </button>
        </div>
      </li>
    </ul>

    <div
      v-if="pendingDelete"
      class="modal-backdrop"
      @click.self="pendingDelete = null"
    >
      <div class="modal-sheet">
        <h3>Delete this match?</h3>
        <p class="muted">It'll be removed from history. Export a backup first if you want to keep it.</p>
        <div class="row" style="gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-block" @click="pendingDelete = null">Cancel</button>
          <button class="btn btn-danger btn-block" @click="confirmDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-view { display: flex; flex-direction: column; gap: 0.75rem; }
.backup-row {
  display: flex;
  gap: 0.5rem;
}
.backup-row .btn { flex: 1; }
.import-toast {
  text-align: center;
  padding: 0.5rem;
  background: var(--surface);
  border-radius: 8px;
}
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
.match-row .bottom {
  justify-content: space-between;
  align-items: center;
}
.players { font-weight: 600; }
.small { font-size: 0.8rem; }
.btn-small { min-height: 36px; padding: 0.3rem 0.7rem; font-size: 0.9rem; }
.delete-btn {
  font-size: 1.1rem;
  padding: 0.25rem 0.5rem;
  min-height: 32px;
}
</style>
