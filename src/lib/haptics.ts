// ── Haptic Feedback ──
// Uses the Vibration API where available (mobile devices)

/**
 * Light tap — tile selection, toggle, nav tap
 */
export function hapticLight() {
  vibrate(10);
}

/**
 * Medium tap — save exercise, complete set
 */
export function hapticMedium() {
  vibrate(20);
}

/**
 * Success — session complete, PR achieved
 */
export function hapticSuccess() {
  vibrate([15, 50, 15]);
}

/**
 * Error — validation failure, blocked action
 */
export function hapticError() {
  vibrate([30, 30, 30]);
}

/**
 * Heavy — week complete, programme built
 */
export function hapticHeavy() {
  vibrate([20, 40, 20, 40, 20]);
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail — not all devices support vibration
    }
  }
}
