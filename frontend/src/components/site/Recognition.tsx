import { useRef } from "react";
import { m, useScroll, useTransform } from "motion/react";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { ChapterNum } from "./Instrument";

const AWARDS = [
  {
    date: "April 2026",
    title: "Best Student Award",
    description:
      "Platinum Jubilee Foundation Day Celebrations, Guru Nanak Dev Engineering College. For academic excellence, leadership, co-curricular achievements and overall contribution to the institute.",
  },
  {
    date: "September 2025",
    title: "Best Paper Award",
    description:
      "68th IETE Annual Convention (AIC-2025), Innovative Digital Technologies and Applications for Sustainable Society Development.",
  },
  { date: "November 2025", title: "NPTEL Discipline Star and NPTEL Motivated Learner Star.", description: "" },
  { date: "2022 to 2026", title: "100% tuition fee waiver", description: "Awarded on a state rank of 21 in Punjab." },
  {
    date: "January 2024",
    title: "Merit-based Alumni Scholarship Award",
    description: "Guru Nanak Dev Engineering College, for staying in the top percentile of the batch.",
  },
  { date: "March 2024", title: "Second position", description: "Git and Linux Workshop, Guru Nanak Dev Engineering College." },
  { date: "2026", title: "AICTE Innovation Ambassador.", description: "" },
];

const N = AWARDS.length;
const pad = (n: number) => String(n).padStart(2, "0");

function Panel({ a, i }: { a: (typeof AWARDS)[number]; i: number }) {
  const year = a.date.match(/\d{4}/)?.[0] ?? "";
  return (
    <div className="rec-panel" data-testid={`recognition-row-${i + 1}`}>
      <span className="rec-numeral" aria-hidden="true">
        {year}
      </span>
      <div className="relative">
        <p className="mono">{a.date}</p>
        <h3 className="rec-title mt-6 max-w-[16ch]">{a.title}</h3>
        {a.description && <p className="text-body rec-desc">{a.description}</p>}
      </div>
      <p className="mono rec-counter">
        {pad(i + 1)} / {pad(N)}
      </p>
    </div>
  );
}

/**
 * Flat signal field. Desktop + fine pointer: a pinned horizontal scroller whose
 * track translateX is written straight to the style from scroll progress.
 * Phones, touch, narrower than 1024px and reduced motion: a vertical stack.
 */
export default function Recognition() {
  const pinRef = useRef<HTMLDivElement | null>(null);
  const wide = useMediaQuery("(min-width: 1024px) and (pointer: fine)");
  const reduced = usePrefersReducedMotion();
  const pinned = wide && !reduced;
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (v) => `${-v * (N - 1) * (100 / N)}%`);

  return (
    <section id="recognition" className="rec-section relative bg-signal text-ink" data-testid="recognition-section">
      <a href="#experience" className="skip-inline" data-testid="recognition-skip-link">
        Skip the awards
      </a>
      <div className="wrap pt-[clamp(96px,12vw,200px)]">
        <p className="mono mb-6">
          <ChapterNum n="05" name="awards" />
        </p>
        <h2 className="text-h2" data-reveal data-testid="recognition-title">
          Best Student, Best Paper.
        </h2>
      </div>
      <div ref={pinRef} className={pinned ? "rec-pin-active" : ""} style={pinned ? { height: `${N * 100}svh` } : undefined}>
        {pinned ? (
          <div className="rec-sticky">
            <m.div className="rec-track" style={{ x, width: `${N * 100}%` }} data-testid="recognition-track">
              {AWARDS.map((a, i) => (
                <Panel key={a.title} a={a} i={i} />
              ))}
            </m.div>
          </div>
        ) : (
          <div data-testid="recognition-stack">
            {AWARDS.map((a, i) => (
              <Panel key={a.title} a={a} i={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
