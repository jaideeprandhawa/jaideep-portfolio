import { useEffect, useRef } from "react";
import Lenis from "lenis";

let shared: Lenis | null = null;

/** Scroll to a chapter by id (Lenis when available, instant otherwise). */
export function scrollToChapter(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const y = Math.max(0, target.getBoundingClientRect().top + window.scrollY - pad);
  if (shared) shared.scrollTo(y, { duration: 1.2, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo(0, y);
}

const HEADER_OFFSET = 0; // Lenis already honours html { scroll-padding-top } (header height + breathing room)

/**
 * One Lenis instance, created in an effect and destroyed in the cleanup so
 * StrictMode does not leave two running. In-page anchors are handled here:
 * preventDefault, lenis.scrollTo with the header offset, then pushState with
 * the plain #id. prefers-reduced-motion: no Lenis at all — instant native jumps.
 */
export function useSmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let cancelled = false;

    const setup = () => {
      if (mq.matches || lenis || cancelled) return;
      lenis = new Lenis({
        autoRaf: true,
        lerp: 0.09,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 1,
      });
      lenisRef.current = lenis;
      shared = lenis;
    };

    const teardown = () => {
      lenis?.destroy();
      lenis = null;
      shared = null;
      lenisRef.current = null;
    };

    const onMotionChange = () => {
      if (mq.matches) teardown();
      else setup();
    };

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#" || hash === "#main") return;
      const target = document.querySelector(hash);
      if (!target) return;
      if (lenis && !mq.matches) {
        event.preventDefault();
        // Numeric target from the live layout: Lenis' element-target maths can use a stale internal scroll value.
        const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const y = Math.max(0, (target as HTMLElement).getBoundingClientRect().top + window.scrollY - pad + HEADER_OFFSET);
        lenis.scrollTo(y, {
          duration: 1.2,
          easing: (t: number) => 1 - Math.pow(1 - t, 4),
        });
        history.pushState(null, "", hash);
      }
      // Reduced motion or no Lenis: the browser jumps instantly (scroll-padding-top handles the offset).
    };

    setup();
    mq.addEventListener("change", onMotionChange);
    document.addEventListener("click", onClick);
    return () => {
      cancelled = true;
      mq.removeEventListener("change", onMotionChange);
      document.removeEventListener("click", onClick);
      teardown();
    };
  }, []);

  return lenisRef;
}
