<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import MatchTimer from '../components/MatchTimer.vue'
import ChaseLinePicker from '../components/ChaseLinePicker.vue'
import Portrait from '../components/Portrait.vue'
import CourtBackdrop from '../components/CourtBackdrop.vue'
import Glyphs from '../components/Glyphs.vue'
import FallingBalls from '../components/FallingBalls.vue'
import { burst, tick } from '../lib/haptics'
import type { PointTag, Side, ChaseValue, GamePoints, ChaseEnd } from '../scoring/types'
import { useMatchStore } from '../stores/match'
import { resolveAvatar } from '../lib/roster'
import { formatChase } from '../scoring/format'
import { deucePointWins } from '../scoring/engine'
import {
  concessionFifteensForGame,
  concessionLabel,
  ruleForDifference,
  type Concession,
} from '../scoring/handicapping'

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

// --- Feedback ----------------------------------------------------------------
// Every point pops the score and glows the winner's tile, shows a receipt with
// Undo, and gives a haptic tick. A game drops in a banner; a set shows a card
// that stays until tapped; ending the match shows the result with falling balls.
const TAG_LABEL: Partial<Record<PointTag, string>> = {
  winner: 'Stroke',
  dedans: 'Dedans',
  grille: 'Grille',
  gallery: 'Winning gallery',
  'chase-won': 'Chase',
}
const NUMBER_WORDS = ['love', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const numWord = (n: number) => NUMBER_WORDS[n] ?? String(n)
const otherOf = (side: Side): Side => (side === 'A' ? 'B' : 'A')

/** Replays the pop/glow animations: bumping `n` remounts the animated nodes. */
const pop = ref<{ side: Side; n: number } | null>(null)
const gamesBump = ref(0)
const receipt = ref<string | null>(null)
const banner = ref<{ side: Side; title: string; sub: string } | null>(null)
const setCard = ref<{ side: Side; title: string; sub: string } | null>(null)
let receiptTimer: ReturnType<typeof setTimeout> | undefined
let bannerTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => {
  clearTimeout(receiptTimer)
  clearTimeout(bannerTimer)
})

function showReceipt(text: string) {
  receipt.value = text
  clearTimeout(receiptTimer)
  receiptTimer = setTimeout(() => (receipt.value = null), 3500)
}
function showBanner(b: { side: Side; title: string; sub: string }) {
  banner.value = b
  clearTimeout(bannerTimer)
  bannerTimer = setTimeout(() => (banner.value = null), 2200)
}
function clearFeedback() {
  receipt.value = null
  banner.value = null
  setCard.value = null
}

/** "Paul leads three games to two" / "two games all". */
function gamesLine(games: { A: number; B: number }): string {
  const m = match.value!
  if (games.A === games.B) return `${numWord(games.A)} games all`
  const lead: Side = games.A > games.B ? 'A' : 'B'
  return `${m.players[lead]} leads ${numWord(games[lead])} games to ${numWord(games[otherOf(lead)])}`
}
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

function score(side: Side, tag: PointTag) {
  const m = match.value
  if (!m) return
  const before = {
    games: m.score.games.A + m.score.games.B,
    sets: m.score.sets.A + m.score.sets.B,
  }
  matchStore.dispatch({ type: 'awardPoint', side, tag })
  const after = match.value
  if (!after) return

  const name = after.players[side]
  const label = TAG_LABEL[tag] ?? 'Point'
  pop.value = { side, n: (pop.value?.n ?? 0) + 1 }

  if (after.score.sets.A + after.score.sets.B > before.sets) {
    const last = after.score.setHistory[after.score.setHistory.length - 1]
    gamesBump.value++
    banner.value = null
    setCard.value = {
      side,
      title: `Set to ${name}`,
      sub: `${last[side]}–${last[otherOf(side)]} · sets ${after.score.sets[side]}–${after.score.sets[otherOf(side)]}`,
    }
    showReceipt(`${label} to ${name} · Set`)
    burst(4)
  } else if (after.score.games.A + after.score.games.B > before.games) {
    gamesBump.value++
    showBanner({ side, title: `Game, ${name}`, sub: cap(gamesLine(after.score.games)) })
    showReceipt(`${label} to ${name} · Game`)
    burst(3)
  } else {
    const p = after.score.points
    const line = p.A === 40 && p.B === 40 ? 'Deuce' : `${pointText(side)}–${pointText(otherOf(side))}`
    showReceipt(`${label} to ${name} · ${line}`)
    tick()
  }
}

function award(side: Side, tag: PointTag) {
  score(side, tag)
}

function awardChasePoint(side: Side) {
  score(side, 'chase-won')
}

/** A side's points for the receipt, e.g. "30", "AD" or "owe 15". */
function pointText(side: Side): string {
  return oweFor(side) > 0 ? `owe ${mainPoints(side)}` : pointLabel(match.value!.score.points[side])
}

// --- Match result -------------------------------------------------------------
// The match has no automatic finish; ending it shows the result before home.
const finalResult = ref<{
  id: string
  winner: Side | null
  title: string
  sub: string
  sets: string
  portrait: ReturnType<typeof resolveAvatar> | null
} | null>(null)

function resultOf(m: NonNullable<typeof match.value>) {
  const { sets, games, setHistory } = m.score
  let winner: Side | null = null
  if (sets.A !== sets.B) winner = sets.A > sets.B ? 'A' : 'B'
  else if (games.A !== games.B) winner = games.A > games.B ? 'A' : 'B'
  const played = [...setHistory, ...(games.A + games.B > 0 ? [games] : [])]
  const sub =
    sets.A !== sets.B
      ? `${numWord(Math.max(sets.A, sets.B))} sets to ${numWord(Math.min(sets.A, sets.B))}`
      : winner
        ? `Ahead ${Math.max(games.A, games.B)}–${Math.min(games.A, games.B)} in games`
        : 'All square'
  return {
    id: m.id,
    winner,
    title: winner ? `${m.players[winner]} takes it!` : 'Honours even',
    sub: cap(sub),
    sets: played.map((g) => `${g.A}–${g.B}`).join(' · '),
    portrait: winner ? avatarFor(winner) : null,
  }
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
  showReceipt(`Chase laid · ${formatChase(payload.value)}`)
  tick()
}

function undo() {
  matchStore.dispatch({ type: 'undo' })
  clearFeedback()
}

function endMatch() {
  const m = match.value
  if (!m) return
  const result = resultOf(m)
  clearFeedback()
  matchStore.endMatch()
  showEndConfirm.value = false
  finalResult.value = result
  burst(4)
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
  // Name the odds, and for half/quarter odds say what they come to this game
  // (e.g. "owe quarter 15 — nothing this game"), so a 0 on the tile makes sense.
  function part(c: Concession, verb: string): string | null {
    if (c.kind === 'none') return null
    const f = concessionFifteensForGame(c, gameInSet)
    const base = `${verb} ${concessionLabel(c)}`
    if (c.cadence === 'full') return base
    return `${base} (${f > 0 ? FIFTEEN[f] : 'nothing'} this game)`
  }
  return {
    difference: m.handicap.difference,
    parts: [
      [m.players[recv], part(rule.receive, 'receives')],
      [m.players[ower], part(rule.owe, 'owes')],
    ].filter((p): p is [string, string] => p[1] !== null),
    structural: rule.structural,
  }
})

function deuceLabel(): string | null {
  const m = match.value
  if (!m) return null
  const { A, B } = m.score.points
  if (A === 40 && B === 40) return deucePointWins(m) ? 'game point' : 'deuce'
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
            <div class="stat-val" :key="`games-${gamesBump}`" :class="{ bump: gamesBump > 0 }">{{ match.score.games.A }}<span class="dot">·</span>{{ match.score.games.B }}</div>
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
          <template v-for="([name, text], i) in handicapGame.parts" :key="name">
            <span v-if="i > 0" class="hcp-dot">·</span>
            <span>{{ name }} {{ text }}</span>
          </template>
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
      <div v-else-if="match.pendingChases.length > 0" class="banner chase-banner chase-banner-compact">
        <Glyphs glyph="penthouse" :size="16" />
        <span class="chase-count">{{ match.pendingChases.length }} pending:</span>
        <span class="chase-inline">{{ match.pendingChases.map((c) => formatChase(c.value)).join(' · ') }}</span>
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
          <span v-if="pop?.side === side" :key="`glow-${pop.n}`" class="tile-glow" aria-hidden="true" />
          <header class="tile-head">
            <Portrait v-bind="avatarFor(side)" :size="48" />
            <div class="tile-info">
              <div class="tile-name">{{ match.players[side] }}</div>
              <div class="tile-role">{{ roleLabel(side) }}</div>
            </div>
            <div
              class="tile-score"
              :key="pop?.side === side ? `score-${pop.n}` : 'score'"
              :class="{ 'is-owe': oweFor(side) > 0, pop: pop?.side === side }"
            >
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

    <div v-if="receipt" class="receipt" role="status">
      <span>{{ receipt }}</span>
      <button type="button" class="receipt-undo" @click="undo">Undo</button>
    </div>

    <button v-if="banner" type="button" class="game-banner" @click="banner = null">
      <Portrait v-bind="avatarFor(banner.side)" :size="52" />
      <span class="gb-text">
        <span class="gb-title">{{ banner.title }}</span>
        <span class="gb-sub">{{ banner.sub }}</span>
      </span>
    </button>

    <div v-if="setCard" class="modal-backdrop set-backdrop" @click.self="setCard = null">
      <div class="set-card">
        <Portrait v-bind="avatarFor(setCard.side)" :size="96" />
        <div class="kicker">Set won</div>
        <h2 class="set-title">{{ setCard.title }}</h2>
        <div class="set-sub">{{ setCard.sub }}</div>
        <button class="btn btn-primary set-ok" @click="setCard = null">Carry on</button>
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
  <div v-else-if="finalResult" class="view final-view">
    <CourtBackdrop :opacity="0.06" />
    <FallingBalls />
    <div class="final-content">
      <Portrait v-if="finalResult.portrait" v-bind="finalResult.portrait" :size="140" />
      <div class="kicker">Match over</div>
      <h1 class="final-title">{{ finalResult.title }}</h1>
      <div class="final-sub">{{ finalResult.sub }}</div>
      <div v-if="finalResult.sets" class="final-sets">{{ finalResult.sets }}</div>
      <div class="final-actions">
        <button class="btn btn-lg btn-block" @click="router.replace('/')">Home</button>
        <button class="btn btn-primary btn-lg btn-block" @click="router.replace(`/match/${finalResult.id}`)">
          View match
        </button>
      </div>
    </div>
  </div>
  <div v-else class="view center muted">Loading match…</div>
</template>

<style scoped>
/* Pin the scoring screen to the visible viewport (dvh tracks Safari's
   toolbars) so the tiles share the space that's actually on screen. If it
   still doesn't fit, the content scrolls instead of clipping buttons. */
.scoring-view {
  padding: 0;
  flex: none;
  height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}
.scoring-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.6rem 0.85rem 0.85rem;
  gap: 0.5rem;
  min-height: 0;
  overflow-y: auto;
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
  flex: 1 0 auto;
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
  transition: flex 0.2s var(--ease-spring);
}
.tile { position: relative; }
.tile-receiver { background: var(--surface); }
.tile-glow {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  pointer-events: none;
  animation: tile-glow 0.7s ease;
}
@keyframes tile-glow {
  0% { box-shadow: 0 0 0 0 rgba(205, 163, 90, 0); }
  30% { box-shadow: 0 0 0 4px rgba(205, 163, 90, 0.9); }
  100% { box-shadow: 0 0 0 0 rgba(205, 163, 90, 0); }
}
.tile-score.pop { animation: score-pop 0.5s var(--ease-spring); }
@keyframes score-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.45); color: var(--accent); }
  100% { transform: scale(1); }
}
.stat-val.bump { animation: games-bump 0.6s var(--ease-spring); }
@keyframes games-bump {
  0% { transform: scale(1); }
  40% { transform: scale(1.5); color: var(--accent); }
  100% { transform: scale(1); }
}
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
.tile-name, .tile-role { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
  min-height: 48px;
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

.chase-banner-compact { padding: 0.45rem 0.75rem; flex-wrap: wrap; row-gap: 0.1rem; }
.chase-count { white-space: nowrap; }
.chase-inline { font-weight: 600; color: var(--text); }

.action-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }

.receipt {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 56px);
  transform: translateX(-50%);
  width: min(calc(100% - 1.7rem), 460px);
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.6rem 0.55rem 0.9rem;
  border-radius: var(--radius-3);
  background: #2a201a;
  color: var(--primary-contrast);
  box-shadow: var(--shadow-3);
  font-size: 0.88rem;
  font-weight: 600;
  animation: rise 0.25s var(--ease-spring);
}
.receipt span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.receipt-undo {
  flex: 0 0 auto;
  border: 0;
  height: 32px;
  padding: 0 0.85rem;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--text);
  font-family: var(--font-body);
  font-weight: 700;
  cursor: pointer;
}
@keyframes rise { from { transform: translate(-50%, 16px); opacity: 0; } }

.game-banner {
  position: fixed;
  left: 50%;
  top: calc(env(safe-area-inset-top) + 4.2rem);
  transform: translateX(-50%);
  width: min(calc(100% - 1.7rem), 460px);
  z-index: 41;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 0;
  border-radius: var(--radius-4);
  background: var(--primary);
  color: var(--primary-contrast);
  box-shadow: var(--shadow-3);
  text-align: left;
  cursor: pointer;
  animation: drop 0.35s var(--ease-spring);
}
.gb-text { display: flex; flex-direction: column; min-width: 0; }
.gb-title { font-family: var(--font-display); font-size: 2rem; line-height: 0.95; }
.gb-sub { font-family: var(--font-body); font-size: 0.82rem; opacity: 0.85; }
@keyframes drop { from { transform: translate(-50%, -140%); opacity: 0; } }

.set-backdrop { align-items: center; }
.set-card {
  width: min(calc(100% - 2rem), 360px);
  background: var(--surface-raised);
  border-radius: var(--radius-5);
  padding: 1.25rem 1.1rem 1.1rem;
  box-shadow: var(--shadow-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  text-align: center;
  animation: card-in 0.35s var(--ease-spring);
}
.set-title { font-size: 2.3rem; color: var(--primary); margin: 0; }
.set-sub { font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 0.6rem; }
.set-ok { width: 100%; height: 48px; }
@keyframes card-in { from { transform: scale(0.9); opacity: 0; } }

.final-view { padding: 0; }
.final-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 1.5rem 1.25rem;
  text-align: center;
}
.final-title { font-size: 2.8rem; color: var(--primary); margin: 0.2rem 0 0; }
.final-sub { font-family: var(--font-display); font-size: 1.7rem; }
.final-sets { font-variant-numeric: tabular-nums; color: var(--text-muted); font-weight: 700; }
.final-actions { display: flex; gap: 0.5rem; width: 100%; margin-top: 1rem; }

@media (prefers-reduced-motion: reduce) {
  .tile-glow, .tile-score.pop, .stat-val.bump, .receipt, .game-banner, .set-card { animation: none; }
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
