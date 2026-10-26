<script setup lang="ts">
// A shower of real tennis balls (yellow-green felt with a stitched seam) for
// the end-of-match moment. Purely decorative; ignores pointer events.
const props = withDefaults(defineProps<{ count?: number }>(), { count: 36 })

const balls = Array.from({ length: props.count }, () => ({
  left: Math.random() * 100,
  size: 12 + Math.random() * 10,
  duration: 1.6 + Math.random() * 1.6,
  delay: Math.random() * 0.9,
  spin: Math.random() < 0.5 ? -1 : 1,
}))
</script>

<template>
  <div class="balls" aria-hidden="true">
    <i
      v-for="(b, i) in balls"
      :key="i"
      :style="{
        left: `${b.left}%`,
        width: `${b.size}px`,
        height: `${b.size}px`,
        animationDuration: `${b.duration}s`,
        animationDelay: `${b.delay}s`,
        '--spin': `${b.spin * 360}deg`,
      }"
    />
  </div>
</template>

<style scoped>
.balls {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 60;
}
i {
  position: absolute;
  top: -30px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #f1f6a8 0%, #d6de5c 45%, #b3bc3e 100%);
  box-shadow: inset -2px -2px 4px rgba(90, 90, 20, 0.35), 0 2px 4px rgba(60, 30, 15, 0.2);
  animation: fall linear forwards;
}
/* The stitched seam */
i::after {
  content: '';
  position: absolute;
  inset: 18% -30% 18% 38%;
  border-left: 1.5px dashed rgba(90, 80, 70, 0.7);
  border-radius: 50%;
}
@keyframes fall {
  to {
    transform: translateY(calc(100dvh + 60px)) rotate(var(--spin));
  }
}
@media (prefers-reduced-motion: reduce) {
  .balls { display: none; }
}
</style>
