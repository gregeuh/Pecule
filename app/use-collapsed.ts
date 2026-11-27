"use client";
import { useSyncExternalStore } from "react";

/**
 * A big home card folded to one line, remembered on this device. `signature` describes what the card says: when it
 * changes (a new advice, another duplicate), the card opens again once, so nothing new goes unseen.
 */
const KEY = "pecule-collapsed";
const listeners = new Set<() => void>();
const read = (): Record<string, string> => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useCollapsed(id: string, signature: string): [boolean, () => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read()[id] ?? "",
    () => "",
  );
  const collapsed = stored === signature;
  const toggle = () => {
    const all = read();
    if (collapsed) delete all[id];
    else all[id] = signature;
    // Keep the memory small: only the cards folded lately.
    const entries = Object.entries(all).slice(-40);
    try {
      localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
    listeners.forEach((l) => l());
  };
  return [collapsed, toggle];
}
