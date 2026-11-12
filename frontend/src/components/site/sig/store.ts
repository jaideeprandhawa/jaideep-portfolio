import { useSyncExternalStore } from "react";

export type Outfit = "normal" | "grad" | "radio" | "lab";

interface SigPersist {
  hidden: boolean;
  outfit: Outfit;
  introSeen: boolean;
}

interface SigState extends SigPersist {
  panelOpen: boolean;
}

const KEY = "sig:v1";

/** Live position written by Sig's loop, read by the panel when it opens (plain object; no React state). */
export const sigPos = { x: 0, y: 0 };

function load(): SigPersist {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<SigPersist>;
      return {
        hidden: !!v.hidden,
        outfit: (["normal", "grad", "radio", "lab"] as const).includes(v.outfit as Outfit) ? (v.outfit as Outfit) : "normal",
        introSeen: !!v.introSeen,
      };
    }
  } catch {
    /* storage unavailable */
  }
  return { hidden: false, outfit: "normal", introSeen: false };
}

let state: SigState = { ...load(), panelOpen: false };
const subs = new Set<() => void>();

export function getSig(): SigState {
  return state;
}

export function setSig(patch: Partial<SigState>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify({ hidden: state.hidden, outfit: state.outfit, introSeen: state.introSeen }));
  } catch {
    /* storage unavailable */
  }
  subs.forEach((fn) => fn());
}

export function useSig(): SigState {
  return useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => state,
    () => state,
  );
}

/** Commands from outside Sig (footer buttons, panel chips) go through one event. */
export function sigCommand(word: string) {
  window.dispatchEvent(new CustomEvent("sig:command", { detail: word }));
}
