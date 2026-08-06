<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMatchStore } from '../stores/match'
import { ALL_AVATARS, resolveAvatar } from '../lib/roster'
import { fileToDownscaledDataUrl } from '../lib/photo'
import { oweLabel, receiveLabel, ruleForDifference } from '../scoring/handicapping'
import type { Side } from '../scoring/types'
import Portrait from '../components/Portrait.vue'
import CourtBackdrop from '../components/CourtBackdrop.vue'
import NumberSegment from '../components/NumberSegment.vue'
import ToggleRow from '../components/ToggleRow.vue'
import Glyphs from '../components/Glyphs.vue'

const router = useRouter()
const matchStore = useMatchStore()

const SIDES: Side[] = ['A', 'B']

// Per-side setup state. Both players are symmetric.
const names = reactive<Record<Side, string>>({ A: '', B: '' })
const avatarIds = reactive<Record<Side, string | null>>({ A: null, B: null })
const photos = reactive<Record<Side, string | undefined>>({ A: undefined, B: undefined })
// Handicaps are free-entry strings while typing; parsed to a number for the
// difference readout and rounded to 1 dp on blur.
const handicaps = reactive<Record<Side, string>>({ A: '', B: '' })

const gamesPerSet = ref(6)
const autoChase = ref(true)

const round1 = (n: number) => Math.round(n * 10) / 10
function parseHandicap(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? round1(n) : null
}
function formatHandicap(side: Side) {
  const n = parseHandicap(handicaps[side])
  if (n !== null) handicaps[side] = n.toFixed(1)
}

const handicapValue = (side: Side) => parseHandicap(handicaps[side])
const bothHandicaps = computed(
  () => handicapValue('A') !== null && handicapValue('B') !== null,
)
// The handicaps carry 1 dp, but the difference used for odds is rounded to the
// nearest whole number (which is how the handicapping sheet is indexed).
const handicapDiff = computed(() =>
  bothHandicaps.value ? Math.round(Math.abs(handicapValue('A')! - handicapValue('B')!)) : null,
)
// The higher handicap is the weaker player, who receives the odds — the
// difference works in their favour.
const favouredSide = computed<Side | null>(() => {
  if (!bothHandicaps.value) return null
  const a = handicapValue('A')!
  const b = handicapValue('B')!
  if (a === b) return null
  return a > b ? 'A' : 'B'
})

function displayName(side: Side): string {
  return names[side].trim() || (side === 'A' ? 'Player 1' : 'Player 2')
}
const otherSide = (side: Side): Side => (side === 'A' ? 'B' : 'A')

// --- Agreed odds ------------------------------------------------------------
// Players may agree to play at a different difference than the raw one. The
// stepper defaults to the actual difference and the favoured (weaker) player,
// but both can be overridden. Editing a handicap re-syncs to the new default.
const playingDiff = ref(0)
// Odds always favour the higher-handicap (weaker) player — not user-selectable.
// A tie falls to the server side (only relevant if the difference is stepped up
// from an equal-handicap starting point).
const receivingSide = computed<Side>(() => favouredSide.value ?? serverSide.value)

watch(handicapDiff, (d) => {
  if (d !== null) playingDiff.value = d
})

function stepDiff(delta: number) {
  playingDiff.value = Math.max(0, Math.min(60, playingDiff.value + delta))
}

const activeRule = computed(() =>
  playingDiff.value > 0 ? ruleForDifference(playingDiff.value) : null,
)

// Which side's character picker is open. Hidden by default; tapping the
// character image toggles it.
const openPicker = ref<Side | null>(null)
function togglePicker(side: Side) {
  openPicker.value = openPicker.value === side ? null : side
}

function portraitFor(side: Side) {
  return resolveAvatar(avatarIds[side], photos[side])
}

function pickAvatar(side: Side, id: string) {
  avatarIds[side] = id
  photos[side] = undefined // an avatar and an uploaded photo are mutually exclusive
  openPicker.value = null
}

async function onPhotoPicked(side: Side, event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  try {
    photos[side] = await fileToDownscaledDataUrl(file)
    avatarIds[side] = null
    openPicker.value = null
  } catch (err) {
    console.warn('[setup] failed to read photo', err)
  } finally {
    target.value = '' // allow re-selecting the same file
  }
}

function clearImage(side: Side) {
  photos[side] = undefined
  avatarIds[side] = null
}

// --- Serve order ------------------------------------------------------------
// The player who serves first is shown on top; dragging a card past the other
// swaps them, which is also how you choose who serves.
const serverSide = ref<Side>('A')
const isServer = (side: Side) => side === serverSide.value

// --- Drag-to-reorder (pointer based → works on touch and mouse) -------------
const dragSide = ref<Side | null>(null)
const dragY = ref(0)
let dragStartY = 0
let swapThreshold = 70

function slotStyle(side: Side) {
  const active = dragSide.value === side
  return {
    order: isServer(side) ? 0 : 2,
    transform: active ? `translateY(${dragY.value}px)` : undefined,
    transition: active ? 'none' : 'transform 0.18s var(--ease-spring)',
    zIndex: active ? 3 : undefined,
  }
}

function onDragStart(side: Side, e: PointerEvent) {
  openPicker.value = null
  dragSide.value = side
  dragStartY = e.clientY
  dragY.value = 0
  const handle = e.currentTarget as HTMLElement
  const slot = handle.closest('.player-slot') as HTMLElement | null
  swapThreshold = slot ? slot.offsetHeight * 0.45 : 70
  handle.setPointerCapture?.(e.pointerId)
}

function onDragMove(e: PointerEvent) {
  if (!dragSide.value) return
  dragY.value = e.clientY - dragStartY
}

function onDragEnd() {
  if (!dragSide.value) return
  const side = dragSide.value
  const crossed = isServer(side) ? dragY.value > swapThreshold : dragY.value < -swapThreshold
  if (crossed) serverSide.value = serverSide.value === 'A' ? 'B' : 'A'
  dragSide.value = null
  dragY.value = 0
}

function start() {
  if (!bothHandicaps.value) return // both handicaps are required
  matchStore.start({
    players: { A: displayName('A'), B: displayName('B') },
    config: { gamesPerSet: gamesPerSet.value, autoChase: autoChase.value },
    serving: serverSide.value,
    avatars: { A: avatarIds.A ?? undefined, B: avatarIds.B ?? undefined },
    photos: { A: photos.A, B: photos.B },
    handicaps: {
      A: handicapValue('A') ?? undefined,
      B: handicapValue('B') ?? undefined,
    },
    handicap:
      playingDiff.value > 0
        ? { difference: playingDiff.value, receivingSide: receivingSide.value }
        : undefined,
  })
  router.push('/match')
}
</script>

<template>
  <div class="view setup-view">
    <CourtBackdrop :opacity="0.06" />
    <div class="content">
      <header class="hdr">
        <button class="btn btn-ghost" @click="router.push('/')">‹ Back</button>
      </header>

      <div class="title-block">
        <div class="kicker">New match</div>
        <h1>Who's playing?</h1>
      </div>

      <div class="serve-note">
        <Glyphs glyph="racquet" :size="15" />
        <span>Top player serves first — drag a card to swap</span>
      </div>

      <div class="player-stack">
        <div
          v-for="side in SIDES"
          :key="side"
          class="player-slot"
          :style="slotStyle(side)"
        >
          <div class="slot-head">
            <button
              type="button"
              class="drag-handle"
              :aria-label="`Reorder ${names[side] || 'player'}`"
              @pointerdown="onDragStart(side, $event)"
              @pointermove="onDragMove"
              @pointerup="onDragEnd"
              @pointercancel="onDragEnd"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
              </svg>
            </button>
            <div class="role-tag" :class="{ server: isServer(side) }">
              <Glyphs v-if="isServer(side)" glyph="racquet" :size="13" />
              {{ isServer(side) ? 'Server · serves first' : 'Receiver' }}
            </div>
          </div>

          <div class="player-card" :class="{ 'card-server': isServer(side) }">
            <button
              type="button"
              class="portrait-btn"
              :class="{ open: openPicker === side }"
              aria-label="Choose character"
              @click="togglePicker(side)"
            >
              <Portrait v-bind="portraitFor(side)" :size="56" />
              <span class="portrait-edit" aria-hidden="true">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M4 20h4L18 10l-4-4L4 16z" />
                  <path d="M13 6l4 4" />
                </svg>
              </span>
            </button>
            <div class="player-name">
              <input
                v-model="names[side]"
                type="text"
                :placeholder="side === 'A' ? 'Player 1 name' : 'Player 2 name'"
              />
              <div class="hint">
                {{ isServer(side) ? 'Serves first · service end' : 'Tap the image to pick a character' }}
              </div>
            </div>
            <label class="hcp-field">
              <span class="hcp-label">Handicap</span>
              <input
                class="hcp-input"
                :class="{ empty: handicapValue(side) === null }"
                type="text"
                inputmode="decimal"
                v-model="handicaps[side]"
                @blur="formatHandicap(side)"
                placeholder="—"
                aria-label="Handicap"
              />
            </label>
          </div>

          <div v-if="openPicker === side" class="char-picker">
            <div class="char-grid">
              <button
                v-for="a in ALL_AVATARS"
                :key="a.id"
                type="button"
                class="char-opt"
                :class="{ active: avatarIds[side] === a.id && !photos[side] }"
                :aria-label="`Character ${a.id}`"
                @click="pickAvatar(side, a.id)"
              >
                <Portrait :id="a.id" :bg="a.bg" :silhouette="a.silhouette" :size="44" />
              </button>
            </div>
            <div class="char-actions">
              <label class="btn btn-ghost btn-sm file-btn">
                {{ photos[side] ? 'Replace photo' : 'Upload photo' }}
                <input
                  type="file"
                  accept="image/*"
                  class="photo-input"
                  @change="(e) => onPhotoPicked(side, e)"
                />
              </label>
              <button
                v-if="photos[side] || avatarIds[side]"
                type="button"
                class="btn btn-ghost btn-sm"
                @click="clearImage(side)"
              >
                Clear
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm picker-done"
                @click="openPicker = null"
              >
                Done
              </button>
            </div>
          </div>
        </div>

        <div class="serve-divider" :style="{ order: 1 }">
          <span class="line" />
          <span class="vs">vs</span>
          <span class="line" />
        </div>
      </div>

      <!-- Handicap odds -->
      <div v-if="bothHandicaps" class="hcp-panel">
        <div class="hcp-top">
          <span class="hcp-actual">Actual difference <strong>{{ handicapDiff }}</strong></span>
          <div class="stepper" role="group" aria-label="Handicap difference to play at">
            <button
              type="button"
              class="step-btn"
              :disabled="playingDiff <= 0"
              @click="stepDiff(-1)"
              aria-label="Lower difference"
            >
              −
            </button>
            <span class="step-val">{{ playingDiff }}</span>
            <button
              type="button"
              class="step-btn"
              :disabled="playingDiff >= 60"
              @click="stepDiff(1)"
              aria-label="Raise difference"
            >
              +
            </button>
          </div>
        </div>

        <div v-if="playingDiff === 0" class="hcp-level">
          <Glyphs glyph="ball" :size="15" /> Playing level — no odds
        </div>
        <template v-else-if="activeRule">
          <div class="hcp-favour">
            in favour of <strong>{{ displayName(receivingSide) }}</strong>
          </div>
          <div class="odds-grid">
            <div class="odds-row">
              <span class="odds-who">{{ displayName(receivingSide) }} <em>receiving</em></span>
              <span class="odds-val">{{ receiveLabel(activeRule.receive) }}</span>
            </div>
            <div class="odds-row">
              <span class="odds-who">{{ displayName(otherSide(receivingSide)) }} <em>owing</em></span>
              <span class="odds-val">{{ oweLabel(activeRule.owe) }}</span>
            </div>
          </div>
          <div v-if="activeRule.structural" class="odds-structural">
            <Glyphs glyph="tambour" :size="13" />
            <span>{{ activeRule.structural }}</span>
          </div>
        </template>
      </div>
      <div v-else class="hcp-summary">
        <span class="muted">Enter both handicaps to see the odds</span>
      </div>

      <!-- Match settings -->
      <div class="settings">
        <div class="row settings-row">
          <NumberSegment label="Games / set" v-model="gamesPerSet" :options="[6, 9, 10]" />
        </div>
        <ToggleRow
          v-model="autoChase"
          label="Auto-chase mode"
          sub="Engine handles end-switching for you"
        />
      </div>

      <div class="cta-row">
        <button
          class="btn btn-primary btn-lg btn-block"
          :disabled="!bothHandicaps"
          @click="start"
        >
          <Glyphs glyph="racquet" :size="18" />
          Start match
        </button>
        <div v-if="!bothHandicaps" class="cta-hint muted">
          Both players need a handicap to start
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-view { padding: 0; }
.content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem 1.25rem;
  gap: 0.85rem;
  overflow-y: auto;
}
.hdr { display: flex; }
.title-block { padding: 0; }
.title-block .kicker { color: var(--accent); }
.title-block h1 {
  margin-top: 0.15rem;
  font-size: 2.6rem;
  line-height: 0.95;
  color: var(--text);
}

.serve-note {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  padding-left: 0.15rem;
}
.serve-note svg { color: var(--accent); flex: 0 0 auto; }

.player-stack {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: relative;
}
.player-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.slot-head { display: flex; align-items: center; gap: 0.5rem; }
.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border: 0;
  border-radius: var(--radius-2);
  background: var(--surface-sunken);
  color: var(--text-faint);
  cursor: grab;
  touch-action: none;
}
.drag-handle:active { cursor: grabbing; color: var(--text-muted); }
.role-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  color: var(--text-faint);
}
.role-tag.server { color: var(--primary); }
.role-tag.server svg { color: var(--accent); }

.player-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem;
  border-radius: var(--radius-3);
  background: var(--surface-raised);
  border: 1.5px solid var(--line);
}
.player-card.card-server {
  border-color: var(--primary);
  box-shadow: var(--shadow-2);
}

.portrait-btn {
  position: relative;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-3);
  flex: 0 0 auto;
  line-height: 0;
}
.portrait-edit {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--primary-contrast);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-1);
}
.portrait-btn.open .portrait-edit { background: var(--accent); }

.player-name {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.player-name input {
  height: 36px;
  font-weight: 700;
  font-size: 1rem;
  border: 1px solid transparent;
  background: transparent;
  padding: 0 0.25rem;
}
.player-name input:focus {
  border-color: var(--line-strong);
  background: var(--surface);
}
.hint { font-size: 0.7rem; color: var(--text-muted); padding-left: 0.25rem; }

.hcp-field {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}
.hcp-label {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-muted);
}
.hcp-input {
  width: 78px;
  height: 40px;
  padding: 0 0.35rem;
  text-align: center;
  font-family: var(--font-num);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  background: var(--surface);
  border: 1.5px solid var(--line-strong);
  border-radius: var(--radius-2);
}
.hcp-input:focus { border-color: var(--primary); outline: none; }
.hcp-input.empty { border-style: dashed; border-color: var(--accent); }

.hcp-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.2rem;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-3);
  background: var(--surface-raised);
  border: 1px solid var(--line);
  font-size: 0.9rem;
  text-align: center;
}

.hcp-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: var(--radius-3);
  background: var(--surface-raised);
  border: 1px solid var(--accent-soft);
}
.hcp-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.hcp-actual { font-size: 0.8rem; color: var(--text-muted); }
.hcp-actual strong {
  font-family: var(--font-num);
  font-size: 1rem;
  color: var(--text);
  margin-left: 0.15rem;
}
.stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  background: var(--surface-sunken);
  border-radius: var(--radius-pill);
  padding: 0.15rem;
}
.step-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  color: var(--primary);
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: var(--shadow-1);
}
.step-btn:disabled { opacity: 0.35; cursor: default; box-shadow: none; }
.step-val {
  min-width: 2.2rem;
  text-align: center;
  font-family: var(--font-num);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent);
}

.hcp-level {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  padding: 0.2rem 0;
}
.hcp-favour {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}
.hcp-favour strong { color: var(--primary); }
.swap-btn {
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
}
.odds-grid {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.odds-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0.55rem;
  background: var(--surface);
  border-radius: var(--radius-2);
}
.odds-who { font-weight: 700; font-size: 0.9rem; color: var(--text); }
.odds-who em {
  font-style: normal;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-left: 0.35rem;
}
.odds-val {
  font-family: var(--font-num);
  font-weight: 800;
  font-size: 1rem;
  color: var(--accent);
  white-space: nowrap;
}
.odds-structural {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--text-muted);
  padding: 0.3rem 0.1rem 0;
}
.odds-structural svg { color: var(--accent); flex: 0 0 auto; margin-top: 0.1rem; }

.cta-hint { text-align: center; font-size: 0.72rem; margin-top: 0.35rem; }

.char-picker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem;
  border-radius: var(--radius-3);
  background: var(--surface);
  border: 1px solid var(--line);
}
.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(46px, 1fr));
  gap: 0.4rem;
}
.char-opt {
  padding: 3px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-2);
  background: transparent;
  cursor: pointer;
  line-height: 0;
  transition: border-color 0.15s;
}
.char-opt.active { border-color: var(--primary); background: var(--surface-raised); }
.char-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.file-btn { cursor: pointer; }
.picker-done { margin-left: auto; color: var(--primary); }

.photo-input { display: none; }
.btn-sm { font-size: 0.75rem; padding: 0.3rem 0.55rem; }

.serve-divider {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  justify-content: center;
}
.serve-divider .line { flex: 1; max-width: 60px; height: 1px; background: var(--line); }
.serve-divider .vs {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--accent);
}

.settings { display: flex; flex-direction: column; gap: 0.6rem; }
.settings-row { gap: 1rem; }
.cta-row { padding-top: 0.5rem; }
</style>
