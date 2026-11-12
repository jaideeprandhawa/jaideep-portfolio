import type { CSSProperties, ReactNode } from "react";
import NumberFlow from "@number-flow/react";
import type { Format } from "@number-flow/react";
import { useInViewOnce, usePrefersReducedMotion } from "@/lib/hooks";
import { ChapterNum, Caption } from "./Instrument";
import SignatureDrawing from "./research/SignatureDrawing";
import Bubbles from "./research/Bubbles";
import Waveform from "./research/Waveform";
import Swarm from "./research/Swarm";

interface TickerProps {
  value: number;
  format?: Format;
  suffix?: string;
  testid: string;
  className?: string;
}

/** NumberFlow ticker: 0 → target the first time it is in view, once. */
export function Ticker({ value, format, suffix, testid, className = "figure" }: TickerProps) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>();
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    const shown = new Intl.NumberFormat("en-US", { useGrouping: true, ...(format as Intl.NumberFormatOptions) }).format(value) + (suffix ?? "");
    return (
      <span className={className} data-testid={testid}>
        {shown}
      </span>
    );
  }

  return (
    <span ref={ref} className={className} data-testid={testid}>
      <NumberFlow value={inView ? value : 0} format={format} suffix={suffix} />
    </span>
  );
}

interface ChapterProps {
  index: number;
  pattern: "pixels" | "pcb" | "hex" | "bubbles";
  figure?: ReactNode;
  figureLabel?: string;
  title: string;
  meta: string;
  children: ReactNode;
  visual: ReactNode;
}

/** One full-height project chapter: sticky text cols 1–5, visual cols 7–12, a pattern of its own. */
function ProjectChapter({ index, pattern, figure, figureLabel, title, meta, children, visual }: ChapterProps) {
  return (
    <article className={`research-chapter pattern-${pattern}`} data-testid={`research-row-${index}`}>
      {pattern === "bubbles" ? <Bubbles /> : <div className="research-bg" aria-hidden="true" />}
      <div className="wrap relative">
        <div className="grid12 gap-y-12">
          <div className="chapter-text col-span-12 min-[1024px]:col-span-5">
            {figure && (
              <div data-reveal>
                {figure}
                {figureLabel && <span className="text-small figure-label">{figureLabel}</span>}
              </div>
            )}
            <h3 className={`text-h3 ${figure ? "mt-10" : ""}`} data-reveal>
              {title}
            </h3>
            <p className="mono mt-3 text-muted-dark" data-reveal>
              {meta}
            </p>
            <p className="text-body mt-4 max-w-[65ch]" data-reveal style={{ "--i": 1 } as CSSProperties}>
              {children}
            </p>
          </div>
          <div className="research-visual col-span-12 self-center min-[1024px]:col-start-7 min-[1024px]:col-span-6" data-reveal style={{ "--i": 2 } as CSSProperties}>
            {visual}
          </div>
        </div>
      </div>
    </article>
  );
}

function BiogasVisual() {
  // Ring gauge is real data: R² 0.89 → 89% of the circumference filled.
  return (
    <div className="flex flex-col gap-12 min-[600px]:flex-row min-[600px]:items-center" data-testid="biogas-visual">
      <div>
        <div className="ring-wrap" data-reveal>
          <svg viewBox="0 0 200 200" className="block h-auto w-full -rotate-90" aria-hidden="true">
            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--line-dark)" strokeWidth="10" />
            <circle className="ring-fg" cx="100" cy="100" r="90" />
          </svg>
          <div className="ring-value">
            <Ticker
              value={0.89}
              format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
              testid="research-figure-2"
              className="text-h2 text-signal tabular"
            />
          </div>
        </div>
        <p className="text-small mt-4 text-muted-dark">R² of the hybrid model</p>
      </div>
      <div>
        <p className="big-readout" data-testid="biogas-readout-bioenzyme">10% bioenzyme</p>
        <p className="big-readout mt-3" data-testid="biogas-readout-days">4 days</p>
        <p className="big-readout mt-3" data-testid="biogas-readout-temp">92 to 94 °F</p>
        <Caption text="Optimum found experimentally." testid="caption-biogas" className="mt-6 text-muted-dark" />
      </div>
    </div>
  );
}

export default function Research() {
  return (
    <section id="research" className="relative" data-testid="research-section">
      <div className="wrap pt-[clamp(96px,12vw,200px)]">
        <p className="mono mb-6 text-muted-dark">
          <ChapterNum n="03" name="research" />
        </p>
        <h2 className="text-h2" data-reveal data-testid="research-title">
          Four projects, four fields.
        </h2>
      </div>
      <ProjectChapter
        index={1}
        pattern="pixels"
        figure={<Ticker value={18000} format={{ useGrouping: true }} suffix="+" testid="research-figure-1" />}
        figureLabel="multilingual signatures used to train"
        title="Signature validation for eSanjeevani."
        meta="C-DAC Mohali, Jan to Jul 2026"
        visual={<SignatureDrawing />}
      >
        A FastAPI pipeline that combines YOLOX localization and an EfficientNet-B0 classifier with image-quality and
        contour checks, GPU-accelerated inference and a REST API, built for the national telemedicine platform.
      </ProjectChapter>
      <ProjectChapter
        index={2}
        pattern="bubbles"
        title="Hybrid machine learning for biogas production."
        meta="GNDEC Ludhiana and Punjab Agricultural University, Jan to Mar 2025"
        visual={<BiogasVisual />}
      >
        A hybrid model that couples physical simulation with machine learning to predict biogas yield from
        heterogeneous sweet sorghum biomass pretreated with a sweet-lemon (<em>Citrus limetta</em>) bioenzyme.
        Experimentally, 10% bioenzyme for four days at 92 to 94 °F gave the best yield. A companion study (Aug to Nov
        2025) builds a predictive model for total solids content to find the best pretreatment duration and
        concentration. Published in <em>Biomass and Bioenergy</em> (2026); a phase-adaptive follow-up is accepted at
        IC3AI.
      </ProjectChapter>
      <ProjectChapter
        index={3}
        pattern="pcb"
        figure={<Ticker value={99} suffix="%" testid="research-figure-3" />}
        figureLabel="accuracy with Random Forest"
        title="Real-time fault detection for LLC resonant converters."
        meta="IIT Jammu, Jun to Aug 2025"
        visual={
          <>
            <Waveform />
            <Caption text="Illustration: stylised waveforms, not PSIM data." testid="caption-waveform" className="mt-6 text-muted-dark" />
          </>
        }
      >
        A monitoring system that tells normal operation apart from three faults (resonant capacitor, magnetizing
        inductance, resonant inductance), trained on more than 1.2 million PSIM simulation samples and connected to
        Google Cloud for remote monitoring and predictive maintenance. Random Forest reached 99% accuracy with a training
        time of 111.43 seconds. Presented at IEEE UPCON 2025.
      </ProjectChapter>
      <ProjectChapter
        index={4}
        pattern="hex"
        figure={
          <span className="figure" data-testid="research-figure-4">
            Best Paper
          </span>
        }
        figureLabel="AIC-2025, IETE"
        title="Pursuit–evasion with deep reinforcement learning."
        meta="IIIT Allahabad, Summer 2024"
        visual={<Swarm />}
      >
        A decentralized pursuit–evasion simulation in which several evaders learn, with PPO in a custom PyGame
        environment, to avoid a single pursuer. Separately, a poster comparing multi-agent DRL strategies for UAV swarm
        operations won the Best Paper Award at the 68th IETE Annual Convention (AIC-2025).
      </ProjectChapter>
    </section>
  );
}
