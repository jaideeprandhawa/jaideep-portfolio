import { useRef } from "react";
import type { CSSProperties } from "react";
import { m, useMotionValueEvent, useScroll } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { ChapterNum } from "./Instrument";
import Education from "./Education";

const JOBS = [
  {
    org: "Centre for Development of Advanced Computing (C-DAC), Mohali.",
    meta: "AI/ML Intern, Jan to Jul 2026.",
    text: "Worked on eSanjeevani, the national telemedicine service: validation of doctor profiles and digital signatures, and secure profile-upload and authentication workflows that improve practitioner onboarding and reliability.",
  },
  {
    org: "Indian Institute of Technology Jammu.",
    meta: "Research Intern, Jun to Aug 2025.",
    text: "Explored AI and machine learning in EV chargers and autonomous electric vehicles; built the LLC converter fault-detection system; presented a poster at the RISE UP Program.",
  },
  {
    org: "Khalis Foundation.",
    meta: "Aug to Oct 2024.",
    text: "Built a custom Bani API on top of the existing BaniDB API and supported research on existing APIs, database fetching and feature extraction.",
  },
  {
    org: "Indian Institute of Information Technology Allahabad, Prayagraj.",
    meta: "Research Intern, Jun to Aug 2024.",
    text: "Worked on mission planning by a swarm of drones with deep reinforcement learning and developed the decentralized pursuit–evasion simulation.",
  },
];

export default function Experience() {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: timelineRef, offset: ["start 60%", "end 60%"] });

  // Nodes light up as the fill reaches them; attributes written directly, no React state.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const tl = timelineRef.current;
    if (!tl || reduced) return;
    const h = tl.offsetHeight || 1;
    nodeRefs.current.forEach((node) => {
      if (!node) return;
      const entry = node.parentElement;
      const pos = ((entry?.offsetTop ?? 0) + node.offsetTop + 6) / h;
      node.dataset.active = String(v >= pos);
    });
  });

  return (
    <section id="experience" className="relative" data-testid="experience-section">
      <div className="wrap py-[clamp(96px,12vw,200px)]">
        <p className="mono mb-6 text-muted-dark">
          <ChapterNum n="06" name="experience" />
        </p>
        <h2 className="text-h2" data-reveal data-testid="experience-title">
          Four internships since 2024.
        </h2>
        <div ref={timelineRef} className="exp-timeline mt-[clamp(48px,6vw,96px)]" data-testid="experience-timeline">
          <span className="spine-line" aria-hidden="true" />
          <span className="spine-fill-wrap" aria-hidden="true">
            <m.span className="spine-fill block" style={reduced ? undefined : { scaleY: scrollYProgress }} />
          </span>
          {JOBS.map((job, i) => (
            <div className="exp-entry" key={job.org} data-testid={`experience-job-${i + 1}`}>
              <span
                className="exp-node"
                aria-hidden="true"
                data-active={reduced ? "true" : "false"}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
              >
                <span className="node-base" />
                <span className="node-signal" />
              </span>
              <div className="exp-content" data-reveal style={{ "--i": 1 } as CSSProperties}>
                <p className="mono text-muted-dark">{job.meta}</p>
                <h3 className="text-h3 mt-3">{job.org}</h3>
                <p className="text-body mt-4 max-w-[65ch]">{job.text}</p>
              </div>
            </div>
          ))}
        </div>
        <Education />
      </div>
    </section>
  );
}
