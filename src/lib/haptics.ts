/**
 * Haptic feedback that also works on iPhone.
 *
 * Android exposes `navigator.vibrate`. iOS Safari doesn't, but since iOS 18 it
 * plays a system haptic when a native switch (`<input type="checkbox" switch>`)
 * is toggled. Clicking the label of a throwaway switch fires that tick. It only
 * works inside (or just after) a user tap, which is when we call it. If Apple
 * changes this, the tick silently stops and nothing else is affected.
 */

function iosTick() {
  try {
    const label = document.createElement('label')
    label.ariaHidden = 'true'
    label.style.display = 'none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    document.head.appendChild(label)
    label.click()
    document.head.removeChild(label)
  } catch {
    // No haptics available — feedback is a nicety, never an error.
  }
}

/** One light tick: a point or a chase laid. */
export function tick(): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(12)
    return
  }
  iosTick()
}

/** A short burst of ticks: a game, set or match won. */
export function burst(count = 3): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(Array.from({ length: count * 2 - 1 }, (_, i) => (i % 2 ? 50 : 18)))
    return
  }
  for (let i = 0; i < count; i++) setTimeout(iosTick, i * 110)
}
