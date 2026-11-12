import { useEffect, useRef, useState } from "react";
import { m, useScroll } from "motion/react";
import { subscribeRaf } from "@/lib/raf";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { FINE_POINTER } from "./Magnetic";
import { setActiveChapter } from "@/lib/activeChapter";

export const CHAPTERS = [
  { id: "top", label: "top", field: "dark" },
  { id: "gate", label: "gate", field: "dark" },
  { id: "research", label: "research", field: "dark" },
  { id: "publications", label: "papers", field: "paper" },
  { id: "recognition", label: "awards", field: "signal" },
  { id: "experience", label: "experience", field: "dark" },
  { id: "about", label: "about", field: "paper" },
  { id: "contact", label: "contact", field: "dark" },
] as const;

/** Fixed 3px signal bar; scaleX written straight to the style by useScroll. */
function ProgressBar() {
  const { scrollYProgress } = useScroll();
  return <m.div className="progress-bar" style={{ scaleX: scrollYProgress }} aria-hidden="true" data-testid="scroll-progress" />;
}

/**
 * Tracks the chapter under the viewport's centre line: drives the rail's active
 * item and sets html[data-field] so the grain and rail adapt to paper/signal fields.
 */
function ChapterRail() {
  const [active, setActive] = useState("top");

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = e.target.id;
            setActive(id);
            setActiveChapter(id);
            const ch = CHAPTERS.find((c) => c.id === id);
            document.documentElement.dataset.field = ch?.field ?? "dark";
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    const observeAll = () => {
      CHAPTERS.forEach((c) => {
        const el = document.getElementById(c.id);
        if (el) io.observe(el);
      });
    };
    observeAll();
    // Chapters 02–08 mount from a lazy chunk; re-observe once they exist.
    window.addEventListener("chapters-ready", observeAll);
    return () => {
      window.removeEventListener("chapters-ready", observeAll);
      io.disconnect();
    };
  }, []);

  return (
    <nav className="chapter-rail" aria-label="Chapters" data-testid="chapter-rail">
      {CHAPTERS.map((c) => (
        <a
          key={c.id}
          href={`#${c.id}`}
          className="rail-item mono"
          data-active={active === c.id}
          aria-current={active === c.id ? "true" : undefined}
          data-testid={`rail-${c.label}-link`}
        >
          <span className="rail-bar" aria-hidden="true" />
          {c.label}
        </a>
      ))}
    </nav>
  );
}

/** 28px ring, lerp 0.2, grows to 56px over links/buttons. Pointer fine only; off under reduced motion. */
function Cursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;
    let tx = -100;
    let ty = -100;
    let cx = -100;
    let cy = -100;
    let hovering = false;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      const next = !!t?.closest("a, button, [role='radio'], canvas");
      if (next !== hovering) {
        hovering = next;
        dot.style.transform = next ? "scale(2)" : "scale(1)";
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    const unsub = subscribeRaf(() => {
      const dx = tx - cx;
      const dy = ty - cy;
      if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) return;
      cx += dx * 0.2;
      cy += dy * 0.2;
      ring.style.transform = `translate3d(${cx - 14}px, ${cy - 14}px, 0)`;
    });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      unsub();
    };
  }, []);

  return (
    <div ref={ringRef} className="cursor-ring" aria-hidden="true" data-testid="cursor-ring">
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}

export default function Chrome() {
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = usePrefersReducedMotion();
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <ProgressBar />
      <ChapterRail />
      {fine && !reduced && <Cursor />}
    </>
  );
}
