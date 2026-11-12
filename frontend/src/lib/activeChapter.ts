import { useSyncExternalStore } from "react";

// The chapter under the viewport centre line, written by the chapter rail's observer.
let current = "top";
const subs = new Set<() => void>();

export function setActiveChapter(id: string) {
  if (id === current) return;
  current = id;
  subs.forEach((fn) => fn());
}

export function getActiveChapter() {
  return current;
}

export function useActiveChapter(): string {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => current,
    () => current,
  );
}
