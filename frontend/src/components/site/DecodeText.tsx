import { useEffect, useRef } from "react";
import { subscribeRaf } from "@/lib/raf";

const GLYPHS = "01#*";
const DURATION = 600;

function scrambled(text: string, revealed: number): string {
  let s = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    s += i < revealed || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
  }
  return s;
}

/**
 * Resolves random characters into the real text over 600ms, once, on entering
 * view. The real text stays in the DOM for screen readers (sr-only); the
 * animating copy is aria-hidden. Reduced motion or no JS: the final text.
 */
export default function DecodeText({ text, className, testid }: { text: string; className?: string; testid?: string }) {
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const animRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const el = animRef.current;
    if (!host || !el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    let unsub: (() => void) | null = null;
    let started = false;
    el.textContent = scrambled(text, 0);
    const io = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((e) => e.isIntersecting)) return;
        started = true;
        io.disconnect();
        let elapsed = 0;
        unsub = subscribeRaf((dt) => {
          elapsed += dt;
          const p = Math.min(1, elapsed / DURATION);
          el.textContent = p >= 1 ? text : scrambled(text, Math.floor(p * text.length));
          if (p >= 1) {
            unsub?.();
            unsub = null;
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(host);
    return () => {
      io.disconnect();
      unsub?.();
      el.textContent = text;
    };
  }, [text]);

  return (
    <span ref={hostRef} className={className} data-testid={testid}>
      <span className="sr-only">{text}</span>
      <span ref={animRef} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
