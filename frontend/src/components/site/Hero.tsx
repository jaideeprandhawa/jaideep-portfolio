import { useEffect, useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { animate, m, useMotionValue } from "motion/react";
import { subscribeRaf } from "@/lib/raf";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { ArrowDownToLine } from "lucide-react";
import { FINE_POINTER, SPRING } from "./Magnetic";
import { PrimaryButton } from "./Controls";
import { Brackets } from "./Instrument";
import DecodeText from "./DecodeText";

const CV_PATH = "/Jaideep_Randhawa_CV.pdf";
const PORTRAIT_ALT =
  "Jaideep Randhawa in a dark blazer and white shirt, photographed against a grey studio backdrop.";
const SENTENCE =
  "Machine learning researcher. I build models for bioenergy, power converters, swarm robotics and the eSanjeevani national telemedicine service.";

export default function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const spotRef = useRef<HTMLDivElement | null>(null);
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = usePrefersReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);

  // Spotlight: --mx/--my live on the empty overlay only, lerped 0.15 on the shared rAF loop.
  useEffect(() => {
    const spot = spotRef.current;
    const sec = sectionRef.current;
    if (!spot || !sec) return;
    spot.style.setProperty("--mx", "70%");
    spot.style.setProperty("--my", "40%");
    if (!fine || reduced) return;
    const r0 = sec.getBoundingClientRect();
    let tx = r0.width * 0.7;
    let ty = r0.height * 0.4;
    let cx = tx;
    let cy = ty;
    let unsub: (() => void) | null = null;
    const onMove = (e: PointerEvent) => {
      const r = sec.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    };
    const frame = () => {
      const dx = tx - cx;
      const dy = ty - cy;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
      cx += dx * 0.15;
      cy += dy * 0.15;
      spot.style.setProperty("--mx", `${cx}px`);
      spot.style.setProperty("--my", `${cy}px`);
    };
    const io = new IntersectionObserver((entries) => {
      const vis = entries.some((e) => e.isIntersecting);
      if (vis && !unsub) unsub = subscribeRaf(frame);
      if (!vis && unsub) {
        unsub();
        unsub = null;
      }
    });
    io.observe(sec);
    sec.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      sec.removeEventListener("pointermove", onMove);
      unsub?.();
    };
  }, [fine, reduced]);

  const tiltOn = fine && !reduced;
  const onTilt = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!tiltOn) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    animate(ry, nx * 8, SPRING);
    animate(rx, -ny * 8, SPRING);
  };
  const onTiltLeave = () => {
    if (!tiltOn) return;
    animate(rx, 0, SPRING);
    animate(ry, 0, SPRING);
  };

  return (
    <section id="top" ref={sectionRef} className="relative" data-testid="hero-section">
      <div className="hero-pattern" aria-hidden="true">
        <div className="hero-dots" />
        <div ref={spotRef} className="hero-spotlight" />
      </div>
      <div className="wrap relative">
        <div className="grid12 hero-grid">
          <div className="hero-text col-span-12 min-[1024px]:col-span-8">
            <p className="mono mb-6 text-muted-dark">
              <DecodeText text="01 / top" testid="chapter-num-top" />
            </p>
            <h1 className="text-display hero-title" data-testid="hero-title">
              <span className="hero-line hero-reveal">Jaideep</span>
              <span className="hero-line hero-reveal" style={{ "--d": "70ms" } as CSSProperties}>
                Randhawa
              </span>
            </h1>
            <p
              className="text-body hero-reveal mt-[clamp(32px,4vw,48px)] max-w-[60ch]"
              style={{ "--d": "280ms" } as CSSProperties}
              data-testid="hero-tagline"
            >
              <DecodeText text={SENTENCE} />
            </p>
            <div className="hero-cta hero-reveal" style={{ "--d": "360ms" } as CSSProperties}>
              <PrimaryButton
                size="l"
                Icon={ArrowDownToLine}
                magnetic
                successMs={1200}
                href={CV_PATH}
                download="Jaideep_Randhawa_CV.pdf"
                aria-label="Download CV (PDF)"
                data-testid="hero-download-cv-button"
              >
                Download CV
              </PrimaryButton>
            </div>
            <p className="text-small hero-cred" data-testid="hero-credentials">
              B.Tech in Computer Science and Engineering, Guru Nanak Dev Engineering College, Ludhiana. CGPA 9.33/10.
            </p>
          </div>
          <div
            className="hero-media col-span-12 mt-12 self-center min-[1024px]:col-start-9 min-[1024px]:col-span-4 min-[1024px]:mt-0"
            style={{ perspective: "1000px" }}
            onPointerMove={onTilt}
            onPointerLeave={onTiltLeave}
            data-testid="hero-portrait"
          >
            <m.div style={{ rotateX: rx, rotateY: ry }}>
              <div className="viewfinder">
                <img
                  className="viewfinder-img"
                  src="/images/jaideep-portrait.jpg"
                  srcSet="/images/jaideep-480.webp 480w, /images/jaideep-800.webp 800w, /images/jaideep-1200.webp 1200w"
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  width={1254}
                  height={1254}
                  alt={PORTRAIT_ALT}
                  fetchPriority="high"
                  decoding="async"
                />
                <div className="viewfinder-scanlines" aria-hidden="true" />
                {!reduced && <div className="viewfinder-scan" aria-hidden="true" />}
                <span className="viewfinder-tab mono" data-testid="viewfinder-label">
                  detected: researcher
                </span>
                <Brackets />
              </div>
            </m.div>
          </div>
        </div>
      </div>
    </section>
  );
}
