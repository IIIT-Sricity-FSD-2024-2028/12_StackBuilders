import { useState } from "react";

export default function usePersistedTab(storageKey, fallback, allowedValues) {
  const [value, setValue] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return allowedValues.includes(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });

  function selectValue(nextValue) {
    const next = typeof nextValue === "function" ? nextValue(value) : nextValue;
    if (!allowedValues.includes(next)) return;
    setValue(next);
    try {
      sessionStorage.setItem(storageKey, next);
    } catch {
      // The selected tab still works when browser storage is unavailable.
    }
  }

  return [value, selectValue];
}
