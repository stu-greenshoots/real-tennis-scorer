<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MatchTimer from '../components/MatchTimer.vue'
import PointTagPicker from '../components/PointTagPicker.vue'
import ChaseLinePicker from '../components/ChaseLinePicker.vue'
import Portrait from '../components/Portrait.vue'
import CourtBackdrop from '../components/CourtBackdrop.vue'
import Glyphs from '../components/Glyphs.vue'
import type { PointTag, Side, ChaseLine, GamePoints } from '../scoring/types'
import { useMatchStore } from '../stores/match'
import { PAUL, OPPONENT_AVATARS } from '../lib/roster'

const router = useRouter()
const matchStore = useMatchStore()

onMounted(() => {
  if (!matchStore.current) router.replace('/setup')
})

const match = computed(() => matchStore.current)
const baseUrl = import.meta.env.BASE_URL

const showTagPicker = ref(false)
const pendingSide = ref<Side | null>(null)
const showChasePicker = ref(false)
const showEndConfirm = ref(false)

function tapSide(side: Side) {
  if (!match.value) return
  if (match.value.playoffActive) {
    matchStore.dispatch({ type: 'awardPoint', side, tag: 'chase-won' })
    return
  }
  pendingSide.value = side
  showTagPicker.value = true
}

function onTagSelect(tag: PointTag) {
  if (pendingSide.value) {
    matchStore.dispatch({ type: 'awardPoint', side: pendingSide.value, tag })
  }
  showTagPicker.value = false
  pendingSide.value = null
}

function onTagCancel() {
  showTagPicker.value = false
  pendingSide.value = null
}

function onChaseSelect(payload: { line: ChaseLine; laidBy: Side }) {
  matchStore.dispatch({ type: 'layChase', line: payload.line, laidBy: payload.laidBy })
  showChasePicker.value = false
}

function undo() {
  matchStore.dispatch({ type: 'undo' })
}

function endMatch() {
  matchStore.endMatch()
  showEndConfirm.value = false
  router.push('/')
}

function dismissWinner() {
  const id = match.value?.id
  matchStore.clear()
  if (id) router.replace(`/match/${id}`)
  else router.replace('/')
}

function avatarFor(side: Side) {
  if (!match.value) return PAUL
  if (side === 'A') return PAUL
  const avId = match.value.avatars?.B
  if (!avId) return { id: 'opponent', bg: 'var(--accent)', silhouette: 'glasses' as const }
  return OPPONENT_AVATARS.find((o) => o.id === avId) ?? OPPONENT_AVATARS[0]
}

function pointLabel(p: GamePoints): string {
  if (p === 'AD') return 'AD'
  return String(p)
}

function deuceLabel(): string | null {
  const m = match.value
  if (!m) return null
  const { A, B } = m.score.points
  if (A === 40 && B === 40) return 'deuce'
  if (A === 'AD') return `AD ${m.players.A}`
  if (B === 'AD') return `AD ${m.players.B}`
  return null
}

function chaseBadgeText(): string | null {
  const m = match.value
  if (!m || m.pendingChases.length === 0) return null
  return m.pendingChases.map((c) => formatChaseLine(c.line)).join(' · ')
}

function formatChaseLine(line: string): string {
  const map: Record<string, string> = {
    'better-than-half-a-yard': '> ½ yd',
    'half-a-yard': '½ yd',
    'worse-than-half-a-yard': '< ½ yd',
    'last-gallery': 'last gal.',
    'second-gallery': '2nd gal.',
    'first-gallery': '1st gal.',
    'hazard-side': 'hazard',
    door: 'door',
  }
  return map[line] ?? `${line}`
}
</script>

<template>
  <div v-if="match" class="view scoring-view">
    <CourtBackdrop :opacity="0.05" />
    <div class="scoring-content">
      <!-- Top bar with portraits + scores -->
      <div class="top-bar">
        <button class="back-btn" @click="router.push('/')" aria-label="Home">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6L9 12L15 18"/></svg>
        </button>
        <div class="player-summary">
          <Portrait v-bind="avatarFor('A')" :size="40" />
          <div class="ps-text">
            <div class="ps-score" :class="{ serving: match.serving === 'A' }">{{ pointLabel(match.score.points.A) }}</div>
            <div class="ps-name">{{ match.players.A }}<span v-if="match.serving === 'A'"> · srv</span></div>
          </div>
        </div>
        <div class="player-summary right">
          <div class="ps-text">
            <div class="ps-score" :class="{ serving: match.serving === 'B' }">{{ pointLabel(match.score.points.B) }}</div>
            <div class="ps-name">{{ match.players.B }}<span v-if="match.serving === 'B'"> · srv</span></div>
          </div>
          <Portrait v-bind="avatarFor('B')" :size="40" />
        </div>
      </div>

      <div v-if="deuceLabel()" class="deuce-pill">{{ deuceLabel() }}</div>

      <!-- Stats card: games / sets / timer -->
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Games</div>
          <div class="stat-val">{{ match.score.games.A }}<span class="dot">·</span>{{ match.score.games.B }}</div>
        </div>
        <div class="stat divider">
          <div class="stat-label">Sets</div>
          <div class="stat-val">{{ match.score.sets.A }}<span class="dot">·</span>{{ match.score.sets.B }}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Match</div>
          <div class="stat-val">
            <MatchTimer :startedAt="match.startedAt" :endedAt="match.endedAt" />
          </div>
        </div>
      </div>

      <div v-if="match.playoffActive" class="banner">
        <Glyphs glyph="penthouse" :size="16" />
        Playing off chases — switch ends!
      </div>
      <div v-else-if="chaseBadgeText()" class="banner chase-banner">
        <Glyphs glyph="penthouse" :size="16" />
        {{ match.pendingChases.length }} chase{{ match.pendingChases.length > 1 ? 's' : '' }} pending — {{ chaseBadgeText() }}
      </div>

      <!-- Big tap targets -->
      <div class="big-buttons">
        <div class="big-slot">
          <PointTagPicker
            v-if="showTagPicker && pendingSide === 'A'"
            side="A"
            :playerName="match.players.A"
            @select="onTagSelect"
            @cancel="onTagCancel"
          />
          <button v-else class="tap-target" @click="tapSide('A')">
            <div class="tap-content">
              <Portrait v-bind="avatarFor('A')" :size="100" />
              <div class="tap-text">
                <div class="tap-score">{{ pointLabel(match.score.points.A) }}</div>
                <div class="tap-name">{{ match.players.A }}</div>
                <div class="tap-cta">{{ match.playoffActive ? 'Award chase' : 'Tap to win point' }}</div>
              </div>
            </div>
          </button>
        </div>
        <div class="big-slot">
          <PointTagPicker
            v-if="showTagPicker && pendingSide === 'B'"
            side="B"
            :playerName="match.players.B"
            @select="onTagSelect"
            @cancel="onTagCancel"
          />
          <button v-else class="tap-target" @click="tapSide('B')">
            <div class="tap-content">
              <Portrait v-bind="avatarFor('B')" :size="100" />
              <div class="tap-text">
                <div class="tap-score">{{ pointLabel(match.score.points.B) }}</div>
                <div class="tap-name">{{ match.players.B }}</div>
                <div class="tap-cta">{{ match.playoffActive ? 'Award chase' : 'Tap to win point' }}</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div class="action-row">
        <button class="btn btn-small" @click="showChasePicker = true" :disabled="match.playoffActive">
          <Glyphs glyph="penthouse" :size="14" /> Chase
        </button>
        <button class="btn btn-small" @click="undo">↶ Undo</button>
        <button class="btn btn-small btn-danger" @click="showEndConfirm = true">End</button>
      </div>
    </div>

    <ChaseLinePicker
      v-if="showChasePicker"
      :players="match.players"
      @select="onChaseSelect"
      @cancel="showChasePicker = false"
    />

    <div v-if="showEndConfirm" class="modal-backdrop" @click.self="showEndConfirm = false">
      <div class="modal-sheet">
        <h3>End the match?</h3>
        <p class="muted">This will record the final score and return home.</p>
        <div class="row" style="gap: 0.5rem; margin-top: 0.75rem;">
          <button class="btn btn-block" @click="showEndConfirm = false">Cancel</button>
          <button class="btn btn-danger btn-block" @click="endMatch">End</button>
        </div>
      </div>
    </div>

    <div v-if="match.winner" class="modal-backdrop winner-backdrop">
      <div class="modal-sheet winner-sheet">
        <img :src="`${baseUrl}scenes/paul-victory.png`" alt="Victory" class="winner-img" />
        <div class="kicker">Match won</div>
        <h2 class="winner-title">{{ match.players[match.winner] }} takes it!</h2>
        <div class="winner-score">
          {{ match.score.setHistory.map((s) => `${s.A}–${s.B}`).join(' · ') || `${match.score.sets.A}–${match.score.sets.B} sets` }}
        </div>
        <div class="row" style="gap: 0.5rem;">
          <button class="btn btn-block" @click="matchStore.clear(); router.replace('/')">Home</button>
          <button class="btn btn-primary btn-block" @click="dismissWinner">View timeline</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="view center muted">Loading match…</div>
</template>

<style scoped>
.scoring-view { padding: 0; }
.scoring-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1rem 1rem;
  gap: 0.6rem;
  min-height: 0;
}
.top-bar {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  align-items: center;
  gap: 0.5rem;
}
.back-btn {
  background: transparent;
  border: 0;
  padding: 0.4rem;
  cursor: pointer;
  color: var(--text);
}
.player-summary {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.player-summary.right { flex-direction: row-reverse; }
.ps-text { display: flex; flex-direction: column; min-width: 0; }
.player-summary.right .ps-text { text-align: right; }
.ps-score {
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 0.9;
  font-weight: 700;
  color: var(--text);
}
.ps-score.serving { color: var(--primary); }
.ps-name {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.deuce-pill {
  align-self: center;
  padding: 0.2rem 0.7rem;
  background: var(--primary);
  color: var(--primary-contrast);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  background: var(--surface-raised);
  border-radius: var(--radius-3);
  border: 1px solid var(--line);
  padding: 0.5rem 0.5rem;
  text-align: center;
}
.stat .stat-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--text-muted);
}
.stat .stat-val {
  font-family: var(--font-num);
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text);
}
.stat .dot { color: var(--text-faint); margin: 0 0.3rem; }
.stat.divider { border-left: 1px solid var(--line); border-right: 1px solid var(--line); }

.big-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}
.big-slot {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
.big-slot > * { width: 100%; height: 100%; }

.tap-target {
  width: 100%;
  height: 100%;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-4);
  background: var(--surface-raised);
  box-shadow: var(--shadow-2);
  padding: 0.5rem;
  position: relative;
  overflow: hidden;
  transition: transform 0.15s var(--ease-spring);
}
.tap-target:active { transform: scale(0.985); }
.big-slot:nth-child(2) .tap-target { background: var(--surface); }

.tap-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  height: 100%;
}
.tap-text { text-align: left; }
.tap-score {
  font-family: var(--font-display);
  font-size: 4rem;
  line-height: 0.85;
  color: var(--text);
  font-weight: 700;
}
.tap-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
.tap-cta {
  font-size: 0.7rem;
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 0.2rem;
}

.action-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.4rem; }

.winner-sheet { text-align: center; }
.winner-img {
  width: 60%;
  max-width: 240px;
  margin: 0 auto 0.5rem;
  display: block;
}
.winner-title {
  font-size: 2.2rem;
  margin: 0.25rem 0 0.5rem;
  color: var(--primary);
}
.winner-score {
  font-family: var(--font-display);
  font-size: 1.6rem;
  color: var(--text);
  margin-bottom: 1rem;
}
</style>
