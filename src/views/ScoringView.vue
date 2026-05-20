<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MatchTimer from '../components/MatchTimer.vue'
import PointTagPicker from '../components/PointTagPicker.vue'
import ChaseLinePicker from '../components/ChaseLinePicker.vue'
import Portrait from '../components/Portrait.vue'
import CourtBackdrop from '../components/CourtBackdrop.vue'
import Glyphs from '../components/Glyphs.vue'
import type { PointTag, Side, ChaseValue, GamePoints, ChaseEnd } from '../scoring/types'
import { useMatchStore } from '../stores/match'
import { PAUL, OPPONENT_AVATARS } from '../lib/roster'
import { formatChase } from '../scoring/format'

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
const chasePickerEnd = ref<ChaseEnd>('hazard')
const chasePickerLaidBy = ref<Side>('A')
const showEndConfirm = ref(false)

/**
 * Server is always rendered at the top of the screen, receiver at the bottom.
 * `match.serving` flips both on normal game-end alternation and on chase
 * playoff start (where the engine swaps `serving` and `servingEnd` together),
 * so the same field drives the visual order in both cases.
 */
const topSide = computed<Side>(() => match.value?.serving ?? 'A')
const bottomSide = computed<Side>(() => (topSide.value === 'A' ? 'B' : 'A'))

function tapSide(side: Side) {
  if (!match.value) return
  if (match.value.playoffActive) {
    matchStore.dispatch({ type: 'awardPoint', side, tag: 'chase-won' })
    return
  }
  pendingSide.value = side
  showTagPicker.value = true
}

function openChaseFor(side: Side) {
  if (!match.value || match.value.playoffActive) return
  // The tile we tap is the player who played the chase shot; the chase lands
  // at the opposite end.
  chasePickerLaidBy.value = side
  chasePickerEnd.value = side === match.value.serving ? 'hazard' : 'service'
  showChasePicker.value = true
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

function onChaseSelect(payload: { value: ChaseValue; laidBy: Side }) {
  matchStore.dispatch({ type: 'layChase', value: payload.value, laidBy: payload.laidBy })
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
  const photo = match.value.photos?.[side]
  const base =
    side === 'A'
      ? PAUL
      : (() => {
          const avId = match.value!.avatars?.B
          if (!avId) return { id: 'opponent', bg: 'var(--accent)', silhouette: 'glasses' as const }
          return OPPONENT_AVATARS.find((o) => o.id === avId) ?? OPPONENT_AVATARS[0]
        })()
  return photo ? { ...base, src: photo } : base
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

function roleLabel(side: Side): string {
  if (!match.value) return ''
  return side === match.value.serving ? 'Server' : 'Receiver'
}
</script>

<template>
  <div v-if="match" class="view scoring-view">
    <CourtBackdrop :opacity="0.05" />
    <div class="scoring-content">
      <!-- Top bar: stats + back -->
      <div class="top-bar">
        <button class="back-btn" @click="router.push('/')" aria-label="Home">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6L9 12L15 18"/></svg>
        </button>
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
      </div>

      <div v-if="deuceLabel()" class="deuce-pill">{{ deuceLabel() }}</div>

      <div v-if="match.playoffActive && match.pendingChases.length > 0" class="banner chase-banner">
        <div class="banner-head">
          <Glyphs glyph="penthouse" :size="16" />
          Playing off chases — switch ends!
        </div>
        <ul class="chase-list">
          <li v-for="(c, i) in match.pendingChases" :key="i">{{ formatChase(c.value) }}</li>
        </ul>
      </div>
      <div v-else-if="match.playoffActive" class="banner">
        <Glyphs glyph="penthouse" :size="16" />
        Playing off chases — switch ends!
      </div>
      <div v-else-if="match.pendingChases.length > 0" class="banner chase-banner">
        <div class="banner-head">
          <Glyphs glyph="penthouse" :size="16" />
          {{ match.pendingChases.length }} chase{{ match.pendingChases.length > 1 ? 's' : '' }} pending
        </div>
        <ul class="chase-list">
          <li v-for="(c, i) in match.pendingChases" :key="i">{{ formatChase(c.value) }}</li>
        </ul>
      </div>

      <!-- Server on top, receiver below. The tiles re-order whenever serving
           switches, so each player's name + avatar moves with their role. -->
      <div class="big-buttons">
        <div class="big-slot top-slot">
          <PointTagPicker
            v-if="showTagPicker && pendingSide === topSide"
            :side="topSide"
            :playerName="match.players[topSide]"
            @select="onTagSelect"
            @cancel="onTagCancel"
          />
          <div v-else class="slot-wrap">
            <button class="tap-target" @click="tapSide(topSide)">
              <div class="tap-content">
                <Portrait v-bind="avatarFor(topSide)" :size="100" />
                <div class="tap-text">
                  <div class="tap-score">{{ pointLabel(match.score.points[topSide]) }}</div>
                  <div class="tap-name">{{ match.players[topSide] }}</div>
                  <div class="tap-role">{{ roleLabel(topSide) }}</div>
                  <div class="tap-cta">{{ match.playoffActive ? 'Award chase' : 'Tap to win point' }}</div>
                </div>
              </div>
            </button>
            <button
              v-if="!match.playoffActive"
              class="chase-btn"
              type="button"
              @click="openChaseFor(topSide)"
            >
              <Glyphs glyph="penthouse" :size="14" /> Set chase
            </button>
          </div>
        </div>
        <div class="big-slot bottom-slot">
          <PointTagPicker
            v-if="showTagPicker && pendingSide === bottomSide"
            :side="bottomSide"
            :playerName="match.players[bottomSide]"
            @select="onTagSelect"
            @cancel="onTagCancel"
          />
          <div v-else class="slot-wrap">
            <button class="tap-target" @click="tapSide(bottomSide)">
              <div class="tap-content">
                <Portrait v-bind="avatarFor(bottomSide)" :size="100" />
                <div class="tap-text">
                  <div class="tap-score">{{ pointLabel(match.score.points[bottomSide]) }}</div>
                  <div class="tap-name">{{ match.players[bottomSide] }}</div>
                  <div class="tap-role">{{ roleLabel(bottomSide) }}</div>
                  <div class="tap-cta">{{ match.playoffActive ? 'Award chase' : 'Tap to win point' }}</div>
                </div>
              </div>
            </button>
            <button
              v-if="!match.playoffActive"
              class="chase-btn"
              type="button"
              @click="openChaseFor(bottomSide)"
            >
              <Glyphs glyph="penthouse" :size="14" /> Set chase
            </button>
          </div>
        </div>
      </div>

      <div class="action-row">
        <button class="btn btn-small" @click="undo">↶ Undo</button>
        <button class="btn btn-small btn-danger" @click="showEndConfirm = true">End match</button>
      </div>
    </div>

    <ChaseLinePicker
      v-if="showChasePicker"
      :end="chasePickerEnd"
      :laidBy="chasePickerLaidBy"
      :laidByName="match.players[chasePickerLaidBy]"
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
  grid-template-columns: auto 1fr;
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
.slot-wrap { position: relative; width: 100%; height: 100%; }

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
.bottom-slot .tap-target { background: var(--surface); }

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
.tap-role {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 0.1rem;
}
.tap-cta {
  font-size: 0.7rem;
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 0.2rem;
}
.chase-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--surface-sunken);
  color: var(--text);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-pill);
  padding: 0.3rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.chase-btn:active { transform: scale(0.96); }

.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }

.banner-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
}
.chase-list {
  list-style: none;
  margin: 0.3rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.chase-list li {
  font-size: 0.85rem;
  color: var(--text);
  padding-left: 0.6rem;
  position: relative;
}
.chase-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--accent);
}

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
