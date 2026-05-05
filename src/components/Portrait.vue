<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Silhouette } from '../lib/roster'

const props = withDefaults(
  defineProps<{
    id: string
    bg?: string
    silhouette?: Silhouette
    size?: number
    name?: string
    showName?: boolean
    /** Optional override URL for the portrait image. Falls back to `/portraits/{id}.png`. */
    src?: string
  }>(),
  {
    bg: 'var(--primary)',
    silhouette: 'long-hair-beard',
    size: 80,
    showName: false,
  },
)

const stripeId = `stripe-${props.id}-${props.size}`
const imageFailed = ref(false)
const imgUrl = computed(() => {
  if (props.src) return props.src
  if (!props.id || props.id === 'opponent') return null
  return `${import.meta.env.BASE_URL}portraits/${props.id}.png`
})
</script>

<template>
  <div
    class="portrait"
    :style="{
      width: size + 'px',
      height: size + 'px',
      borderRadius: size * 0.18 + 'px',
      background: bg,
    }"
  >
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      class="art"
    >
      <defs>
        <pattern :id="stripeId" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(251,246,236,0.10)" stroke-width="3" />
        </pattern>
      </defs>
      <rect width="100" height="100" :fill="`url(#${stripeId})`" />
      <g
        :stroke="'rgba(251,246,236,0.85)'"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="rgba(251,246,236,0.85)"
      >
        <template v-if="silhouette === 'long-hair-beard'">
          <path d="M50 24 Q34 24 30 42 Q28 56 32 70 L32 88 L68 88 L68 70 Q72 56 70 42 Q66 24 50 24 Z" opacity="0.95" stroke="none" />
          <circle cx="50" cy="46" r="14" fill="var(--surface)" opacity="0.85" stroke="none" />
          <path d="M38 54 Q40 64 50 66 Q60 64 62 54 L62 70 Q56 76 50 76 Q44 76 38 70 Z" opacity="0.95" stroke="none" />
        </template>
        <template v-else-if="silhouette === 'moustache'">
          <ellipse cx="50" cy="42" rx="14" ry="16" fill="var(--surface)" opacity="0.85" stroke="none" />
          <path d="M36 32 Q50 28 64 32" fill="none" />
          <path d="M40 50 Q45 54 50 52 Q55 54 60 50" fill="none" />
          <rect x="32" y="58" width="36" height="30" rx="6" opacity="0.85" stroke="none" />
        </template>
        <template v-else-if="silhouette === 'ponytail'">
          <circle cx="50" cy="44" r="14" fill="var(--surface)" opacity="0.85" stroke="none" />
          <path d="M62 44 Q72 50 76 64 Q72 70 64 66" opacity="0.9" stroke="none" />
          <rect x="32" y="58" width="36" height="30" rx="6" opacity="0.85" stroke="none" />
          <path d="M38 38 Q44 28 56 30" fill="none" />
        </template>
        <template v-else-if="silhouette === 'bald-goatee'">
          <ellipse cx="50" cy="42" rx="13" ry="15" fill="var(--surface)" opacity="0.85" stroke="none" />
          <path d="M44 56 Q50 62 56 56 L56 62 Q50 68 44 62 Z" stroke="none" />
          <rect x="32" y="62" width="36" height="26" rx="6" opacity="0.85" stroke="none" />
        </template>
        <template v-else-if="silhouette === 'glasses'">
          <ellipse cx="50" cy="44" rx="14" ry="16" fill="var(--surface)" opacity="0.85" stroke="none" />
          <rect x="38" y="42" width="9" height="6" rx="1.5" fill="none" />
          <rect x="53" y="42" width="9" height="6" rx="1.5" fill="none" />
          <line x1="47" y1="45" x2="53" y2="45" />
          <rect x="32" y="58" width="36" height="30" rx="6" opacity="0.85" stroke="none" />
        </template>
        <template v-else-if="silhouette === 'messy-hair'">
          <path d="M36 30 L40 22 L44 30 L48 20 L52 30 L56 22 L60 30 L64 28 L62 38 L38 38 Z" opacity="0.9" stroke="none" />
          <circle cx="50" cy="46" r="12" fill="var(--surface)" opacity="0.85" stroke="none" />
          <rect x="34" y="58" width="32" height="30" rx="6" opacity="0.85" stroke="none" />
        </template>
        <template v-else-if="silhouette === 'hooded'">
          <path d="M28 38 Q50 18 72 38 L72 88 L28 88 Z" opacity="0.95" stroke="none" />
          <circle cx="44" cy="50" r="2" fill="var(--accent-soft)" stroke="none" />
          <circle cx="56" cy="50" r="2" fill="var(--accent-soft)" stroke="none" />
        </template>
      </g>
    </svg>
    <img
      v-if="imgUrl && !imageFailed"
      :src="imgUrl"
      :alt="name || id"
      class="real-img"
      @error="imageFailed = true"
    />
    <div v-if="showName && name && size >= 56" class="name-strip">{{ name }}</div>
  </div>
</template>

<style scoped>
.portrait {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1.5px var(--line-strong), var(--shadow-1);
}
.art {
  position: absolute;
  inset: 0;
}
.real-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  z-index: 1;
}
.name-strip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 3px 6px;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.6rem;
  letter-spacing: 0.3px;
  color: rgba(251,246,236,0.78);
  background: linear-gradient(to top, rgba(0,0,0,0.35), transparent);
  text-align: center;
  text-transform: uppercase;
}
</style>
