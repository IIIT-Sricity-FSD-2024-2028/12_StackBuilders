import { useEffect, useRef } from "react";

const DEFAULT_REFRESH_INTERVAL = 15_000;

export default function useAutoRefresh(refresh, scopeKey = "", intervalMs = DEFAULT_REFRESH_INTERVAL) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!scopeKey) return undefined;

    let active = true;
    let running = false;
    let lastStartedAt = 0;

    const refreshIfVisible = async () => {
      if (!active || document.visibilityState === "hidden" || running || Date.now() - lastStartedAt < 1_000) return;
      running = true;
      lastStartedAt = Date.now();
      try {
        await refreshRef.current();
      } catch {
        // Keep the last good data on transient refresh failures; the initial load owns error reporting.
      } finally {
        running = false;
      }
    };

    const intervalId = window.setInterval(refreshIfVisible, intervalMs);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [scopeKey, intervalMs]);
}
