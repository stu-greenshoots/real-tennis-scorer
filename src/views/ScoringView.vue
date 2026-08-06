<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MatchTimer from '../components/MatchTimer.vue'
import ChaseLinePicker from '../components/ChaseLinePicker.vue'
import Portrait from '../components/Portrait.vue'
import CourtBackdrop from '../components/CourtBackdrop.vue'
import Glyphs from '../components/Glyphs.vue'
import type { PointTag, Side, ChaseValue, GamePoints, ChaseEnd } from '../scoring/types'
import { useMatchStore } from '../stores/match'
import { resolveAvatar } from '../lib/roster'
import { formatChase } from '../scoring/format'
import { concessionFifteensForGame, ruleForDifference } from '../scoring/handicapping'

const router = useRouter()
const matchStore = useMatchStore()

onMounted(() => {
  if (!matchStore.current) router.replace('/setup')
})

const match = computed(() => matchStore.current)
const baseUrl = import.meta.env.BASE_URL

const showEndConfirm = ref(false)
/** Which side currently has its chase picker open (in-place on the tile). */
const chasePickerSide = ref<Side | null>(null)

/**
 * Tile positions follow court ends, not the serving role. `servingEnd` only
 * flips when a chase playoff physically swaps the ends; normal game-end
 * alternation only changes the role labels on each tile, not their order.
 */
const topSide = computed<Side>(() => match.value?.servingEnd ?? 'A')
const bottomSide = computed<Side>(() => (topSide.value === 'A' ? 'B' : 'A'))

function award(side: Side, tag: PointTag) {
  if (!match.value) return
  matchStore.dispatch({ type: 'awardPoint', side, tag })
}

function awardChasePoint(side: Side) {
  matchStore.dispatch({ type: 'awardPoint', side, tag: 'chase-won' })
}

function openChaseFor(side: Side) {
  if (!match.value || match.value.playoffActive) return
  chasePickerSide.value = side
}

function chaseEndFor(side: Side): ChaseEnd {
  // The tile we tap is the player who played the chase shot; the chase lands
  // at the opposite end.
  return side === match.value!.serving ? 'hazard' : 'service'
}

function onChaseSelect(payload: { value: ChaseValue; laidBy: Side }) {
  matchStore.dispatch({ type: 'layChase', value: payload.value, laidBy: payload.laidBy })
  chasePickerSide.value = null
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
  return resolveAvatar(match.value?.avatars?.[side], match.value?.photos?.[side])
}

function pointLabel(p: GamePoints): string {
  if (p === 'AD') return 'AD'
  return String(p)
}

// Handicap "owe" display: a side below love shows "owe 15/30/40".
const FIFTEEN: Record<number, string> = { 1: '15', 2: '30', 3: '40' }
function oweFor(side: Side): number {
  return match.value?.score.owe?.[side] ?? 0
}
function mainPoints(side: Side): string {
  const owe = oweFor(side)
  if (owe > 0) return FIFTEEN[owe] ?? String(owe * 15)
  return pointLabel(match.value!.score.points[side])
}

/** The handicap concession in force for the current game, or null. */
const handicapGame = computed(() => {
  const m = match.value
  if (!m?.handicap) return null
  const rule = ruleForDifference(m.handicap.difference)
  if (!rule) return null
  const recv = m.handicap.receivingSide
  const ower: Side = recv === 'A' ? 'B' : 'A'
  const gameInSet = m.score.games.A + m.score.games.B + 1
  const recF = concessionFifteensForGame(rule.receive, gameInSet)
  const oweF = concessionFifteensForGame(rule.owe, gameInSet)
  return {
    difference: m.handicap.difference,
    recvName: m.players[recv],
    owerName: m.players[ower],
    recvText: recF > 0 ? `receives ${FIFTEEN[recF]}` : 'receives Love',
    oweText: oweF > 0 ? `owes ${FIFTEEN[oweF]}` : 'owes nothing',
    structural: rule.structural,
  }
})

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

function isServer(side: Side): boolean {
  return !!match.value && side === match.value.serving
}
</script>

<template>
  <div v-if="match" class="view scoring-view">
    <CourtBackdrop :opacity="0.05" />
    <div class="scoring-content">
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

      <div v-if="handicapGame" class="hcp-strip">
        <div class="hcp-strip-main">
          <span class="hcp-badge">HCP {{ handicapGame.difference }}</span>
          <span>{{ handicapGame.recvName }} {{ handicapGame.recvText }}</span>
          <span class="hcp-dot">·</span>
          <span>{{ handicapGame.owerName }} {{ handicapGame.oweText }}</span>
        </div>
        <div v-if="handicapGame.structural" class="hcp-strip-struct">
          <Glyphs glyph="tambour" :size="12" /> {{ handicapGame.structural }}
        </div>
      </div>

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

      <div class="tiles">
        <section
          v-for="side in [topSide, bottomSide]"
          :key="side"
          class="tile"
          :class="{
            'tile-server': isServer(side),
            'tile-receiver': !isServer(side),
            'tile-active': chasePickerSide === side,
            'tile-compact': chasePickerSide !== null && chasePickerSide !== side,
          }"
        >
          <header class="tile-head">
            <Portrait v-bind="avatarFor(side)" :size="56" />
            <div class="tile-info">
              <div class="tile-name">{{ match.players[side] }}</div>
              <div class="tile-role">{{ roleLabel(side) }}</div>
            </div>
            <div class="tile-score" :class="{ 'is-owe': oweFor(side) > 0 }">
              <span v-if="oweFor(side) > 0" class="owe-lead">owe</span>{{ mainPoints(side) }}
            </div>
          </header>

          <div v-if="chasePickerSide !== null && chasePickerSide !== side" class="tile-body-empty"></div>
          <div v-else class="tile-body">
            <ChaseLinePicker
              v-if="chasePickerSide === side"
              :end="chaseEndFor(side)"
              :laidBy="side"
              :laidByName="match.players[side]"
              @select="onChaseSelect"
              @cancel="chasePickerSide = null"
            />
            <div v-else-if="match.playoffActive" class="actions single">
              <button class="btn btn-primary btn-action" @click="awardChasePoint(side)">
                Award chase to {{ match.players[side] }}
              </button>
            </div>
            <div v-else class="actions" :class="isServer(side) ? 'four' : 'three'">
              <button class="btn btn-action" @click="award(side, 'winner')">Stroke</button>
              <template v-if="isServer(side)">
                <button class="btn btn-action" @click="award(side, 'gallery')">Winning Gallery</button>
                <button class="btn btn-action" @click="award(side, 'grille')">Grille</button>
              </template>
              <template v-else>
                <button class="btn btn-action" @click="award(side, 'dedans')">Dedans</button>
              </template>
              <button class="btn btn-action btn-chase" @click="openChaseFor(side)">
                <Glyphs glyph="penthouse" :size="14" /> Lay Chase
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="action-row">
        <button class="btn btn-small" @click="undo">↶ Undo</button>
        <button class="btn btn-small btn-danger" @click="showEndConfirm = true">End match</button>
      </div>
    </div>

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
  padding: 0.6rem 0.85rem 0.85rem;
  gap: 0.5rem;
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
  padding: 0.45rem 0.5rem;
  text-align: center;
}
.stat .stat-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: var(--text-muted);
}
.stat .stat-val {
  font-family: var(--font-num);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}
.stat .dot { color: var(--text-faint); margin: 0 0.3rem; }
.stat.divider { border-left: 1px solid var(--line); border-right: 1px solid var(--line); }

.tiles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}
.tile {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--surface-raised);
  border-radius: var(--radius-4);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-2);
  padding: 0.55rem 0.6rem;
  flex: 1 1 0;
  min-height: 0;
  transition: flex 0.2s var(--ease-spring);
}
.tile-receiver { background: var(--surface); }
.tile-active { flex: 1 1 auto; }
.tile-compact {
  flex: 0 0 auto;
  gap: 0;
}
.tile-compact .tile-head { padding: 0; }
.tile-body-empty { display: none; }

.tile-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.tile-info { flex: 1; min-width: 0; }
.tile-name {
  font-family: var(--font-display);
  font-size: 1.4rem;
  line-height: 1;
  font-weight: 700;
  color: var(--text);
}
.tile-role {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--primary);
  margin-top: 0.1rem;
}
.tile-score {
  font-family: var(--font-display);
  font-size: 2.6rem;
  line-height: 0.9;
  font-weight: 700;
  color: var(--text);
}
.tile-score.is-owe { color: var(--primary); font-size: 1.9rem; }
.owe-lead {
  font-family: var(--font-body);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  vertical-align: middle;
  margin-right: 0.2rem;
  color: var(--text-muted);
}

.hcp-strip {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.35rem 0.6rem;
  border-radius: var(--radius-2);
  background: var(--surface-raised);
  border: 1px solid var(--accent-soft);
}
.hcp-strip-main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--text);
}
.hcp-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: var(--primary-contrast);
  background: var(--primary);
  border-radius: var(--radius-pill);
  padding: 0.1rem 0.4rem;
}
.hcp-dot { color: var(--text-faint); }
.hcp-strip-struct {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: var(--text-muted);
}
.hcp-strip-struct svg { color: var(--accent); flex: 0 0 auto; }

.tile-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.actions {
  display: grid;
  gap: 0.55rem;
  flex: 1;
  width: 100%;
}
.actions.four {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.actions.three {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}
.actions.three > :last-child { grid-column: 1 / span 2; }
.actions.single { display: flex; }

.btn-action {
  font-size: 1.1rem;
  font-weight: 700;
  min-height: 64px;
  height: 100%;
  width: 100%;
  text-transform: none;
  letter-spacing: 0;
  border-radius: var(--radius-3);
  box-shadow: var(--shadow-1);
  transition: transform 0.12s var(--ease-spring);
}
.btn-action:active { transform: scale(0.97); }
.btn-chase {
  background: var(--surface-sunken);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 1.05rem;
}

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

.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }

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
