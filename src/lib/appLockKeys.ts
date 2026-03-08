/** Single source of truth for all App Lock localStorage keys */
export const LOCK_KEYS = {
  enabled:    "ourvault_lock_enabled",
  pin:        "ourvault_lock_pin",
  unlockedAt: "ourvault_unlocked_at",
  biometric:  "ourvault_biometric",
} as const;

export const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
