import { useState, useEffect, useCallback } from "react";

export const PIN_KEY = "ourvault_pin";
export const LOCK_KEY = "ourvault_lock_method";
// How many ms of background before re-locking (15 seconds)
const LOCK_TIMEOUT_MS = 15_000;

export type LockMethod = "pin" | "biometric" | null;

function getLockMethod(): LockMethod {
  const v = localStorage.getItem(LOCK_KEY);
  return v === "pin" || v === "biometric" ? v : null;
}

export function useAppLock(isAuthenticated: boolean) {
  const [locked, setLocked] = useState<boolean>(() => {
    // Lock immediately on first load if a method is configured
    return !!getLockMethod();
  });

  const unlock = useCallback(() => setLocked(false), []);

  // Track when the page was hidden so we can re-lock after LOCK_TIMEOUT_MS
  useEffect(() => {
    if (!isAuthenticated) return;

    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (document.visibilityState === "visible") {
        const method = getLockMethod();
        if (!method) return;
        const elapsed = hiddenAt ? Date.now() - hiddenAt : Infinity;
        if (elapsed >= LOCK_TIMEOUT_MS) {
          setLocked(true);
        }
        hiddenAt = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthenticated]);

  // If user disables lock in settings while unlocked, remove lock state
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCK_KEY && !e.newValue) {
        setLocked(false);
      }
      if (e.key === LOCK_KEY && e.newValue) {
        // new method set — lock immediately
        setLocked(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const lockMethod = getLockMethod();

  return { locked: isAuthenticated && locked && !!lockMethod, lockMethod, unlock };
}
