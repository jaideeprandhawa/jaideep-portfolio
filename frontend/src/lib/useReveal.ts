import { useEffect } from "react";

let observer: IntersectionObserver | null = null;

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Observe one element for the one-time scroll reveal (used by lazily mounted trees too). */
export function observeReveal(el: HTMLElement | null) {
  if (!el) return;
  if (!("IntersectionObserver" in window) || reducedMotion()) {
    el.classList.add("is-in");
    return;
  }
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
  }
  observer.observe(el);
}

/**
 * Wire every [data-reveal] element on the page. The hidden initial state only
 * exists under html.js (set by an inline head script), so the page reads fully
 * with JavaScript disabled or when the observer is unsupported.
 */
export function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window) || reducedMotion()) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    els.forEach((el) => observeReveal(el));
    return () => {
      observer?.disconnect();
      observer = null;
    };
  }, []);
}
