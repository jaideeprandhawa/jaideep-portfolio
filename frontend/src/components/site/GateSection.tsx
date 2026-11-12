import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import GateDemo from "./GateDemo";
import type { GateApi } from "./GateDemo";
import type { GateResult } from "@/lib/gate/checks";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { ChapterNum, Instrument } from "./Instrument";

const LIVE_KEYS = ["blank", "area", "contour"] as const;
const LIVE_LABELS: Record<(typeof LIVE_KEYS)[number], string> = {
  blank: "Blank image",
  area: "Signature area",
  contour: "Contour shape",
};

const SERVER_ROWS = [
  { id: "integrity", label: "Integrity, resolution, blur and brightness checks" },
  { id: "localization", label: "Signature localization (YOLOX)" },
  { id: "classification", label: "Classification (EfficientNet-B0)" },
];

const stateText = (state: "waiting" | "pass" | "reject") =>
  state === "waiting" ? "Waiting" : state === "pass" ? "Pass" : "Reject";

function readout(r: GateResult | null): string {
  const m = r?.metrics;
  if (!m) return "ink — · box — · path/diagonal —";
  const ratio = Number.isFinite(m.ratio) ? m.ratio.toFixed(1) : "—";
  return `ink ${(m.ink * 100).toFixed(2)}% · box ${Math.round(m.box * 100)}% · path/diagonal ${ratio}`;
}

/** Brackets drawn around the ink bounding box: signal on a pass, warn on a reject. */
function RegionOverlay({ result }: { result: GateResult }) {
  const box = result.inkBox;
  if (!box) return null;
  const color = result.rejected ? "var(--warn)" : "var(--signal)";
  const pad = 8;
  const left = Math.max(0, box.x - pad);
  const top = Math.max(0, box.y - pad);
  const w = box.w + pad * 2;
  const h = box.h + pad * 2;
  const s = { borderColor: color };
  const labelTop = top >= 30 ? top - 30 : top + h + 6;
  return (
    <div className="gate-overlay" aria-hidden="true" data-testid="gate-region-overlay">
      <span className="gate-bracket bracket tl" style={{ ...s, left, top }} />
      <span className="gate-bracket bracket tr" style={{ ...s, left: left + w - 18, top }} />
      <span className="gate-bracket bracket bl" style={{ ...s, left, top: top + h - 18 }} />
      <span className="gate-bracket bracket br" style={{ ...s, left: left + w - 18, top: top + h - 18 }} />
      <span
        className="gate-region-label mono"
        style={{ left, top: labelTop, background: "var(--ink)", color }}
        data-testid="gate-region-label"
      >
        {result.rejected ? "no valid region" : "signature region"}
      </span>
    </div>
  );
}

/**
 * Dark --ink-2 chapter with a pixel grid behind an instrument window. The
 * drawing area stays pure white so the checks stay valid. The demo code lazy
 * mounts within one viewport of the screen; the frame reserves its height.
 */
export default function GateSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [near, setNear] = useState(false);
  const [result, setResult] = useState<GateResult | null>(null);
  const [version, setVersion] = useState(0);
  const [stops, setStops] = useState<number[]>([]);
  const demoApi = useRef<GateApi | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0% 100% 0%" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Packet stop positions: the vertical centre of each of the six stage rows.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      setStops(rowRefs.current.map((row) => (row ? row.offsetTop + row.offsetHeight / 2 - 4 : 0)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  const handleResult = (r: GateResult | null) => {
    setResult(r);
    setVersion((v) => v + 1);
  };

  const applySample = (name: "empty" | "dot" | "line" | "signature") => demoApi.current?.applySample(name);

  const packetStyle = stops.reduce<Record<string, string>>((acc, y, i) => {
    acc[`--s${i}`] = `${y}px`;
    return acc;
  }, {}) as CSSProperties;

  return (
    <section id="gate" ref={sectionRef} className="relative bg-ink-2" data-testid="gate-section">
      <div className="gate-pattern" aria-hidden="true" />
      <div className="wrap relative py-[clamp(72px,10vw,160px)]">
        <div className="grid12 gap-y-12">
          <div className="col-span-12 min-[860px]:col-span-5">
            <p className="mono mb-6 text-muted-dark">
              <ChapterNum n="02" name="gate" />
            </p>
            <h2 className="text-h2" data-reveal data-testid="gate-title">
              Every signature upload passes a gate.
            </h2>
            <p className="text-body gate-copy" data-reveal style={{ "--i": 1 } as CSSProperties}>
              At C-DAC Mohali I built a multi-stage validation pipeline for signature images uploaded to the eSanjeevani
              national telemedicine service. It checks image integrity and quality, locates the signature with YOLOX,
              classifies it with EfficientNet-B0 and rejects anything that is not a signature: logos, geometric
              patterns, drawings, textures. The models were trained on more than 18,000 multilingual signatures (CEDAR,
              BHSig-Hindi, BHSig-Bengali) plus more than 11,000 signature and non-signature samples.
            </p>
            <p className="text-body gate-copy" data-reveal style={{ "--i": 2 } as CSSProperties}>
              Draw below. Your browser runs the quality and shape checks live. The trained models run on the server in
              the real pipeline and are not simulated here. A scribble will pass the browser checks; telling a scribble
              from a signature is the classifier’s job.
            </p>
          </div>
          <div
            className="col-span-12 min-[860px]:col-start-6 min-[860px]:col-span-7"
            data-reveal
            style={{ "--i": 3 } as CSSProperties}
            data-testid="gate-demo-column"
          >
            <Instrument
              testid="gate-window"
              label="Signature drawing window. Draw with a pointer or use the sample buttons below."
              caption={
                <span aria-live="polite" data-testid="gate-readout">
                  {readout(result)}
                </span>
              }
            >
              <div className="gate-frame relative" data-testid="gate-frame">
                {near && (
                  <Suspense fallback={null}>
                    <GateDemo onResult={handleResult} apiRef={demoApi} />
                  </Suspense>
                )}
                {result && !reduced && <span key={`scan-${version}`} className="gate-scan" aria-hidden="true" />}
                {result && <RegionOverlay key={`ov-${version}`} result={result} />}
              </div>
            </Instrument>
            <p
              key={version}
              aria-live="polite"
              className={`gate-verdict ${result ? (result.rejected ? "reject shake" : "pass") : ""}`}
              data-testid="gate-verdict"
            >
              {result ? result.verdict : ""}
            </p>
            <ul className="gate-rows" ref={listRef}>
              {result && !reduced && stops.length === 6 && (
                <span key={`pk-${version}`} className="gate-packet" style={packetStyle} aria-hidden="true" />
              )}
              <li className="mono gate-group" aria-hidden="true">
                browser, live
              </li>
              {LIVE_KEYS.map((key, i) => {
                const state = result ? result[key] : "waiting";
                return (
                  <li
                    className="gate-row"
                    key={key}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    data-testid={`gate-row-${key}`}
                  >
                    <span className="gate-label">{LIVE_LABELS[key]}</span>
                    <span
                      key={`${version}-${key}`}
                      className={`gate-state row-state-in ${state}`}
                      style={{ "--i": i } as CSSProperties}
                      data-testid={`gate-state-${key}`}
                    >
                      {stateText(state)}
                    </span>
                  </li>
                );
              })}
              <li className="mono gate-group mt-3" aria-hidden="true">
                server, not simulated
              </li>
              {SERVER_ROWS.map((row, j) => (
                <li
                  className="gate-row"
                  key={row.id}
                  ref={(el) => {
                    rowRefs.current[3 + j] = el;
                  }}
                  data-testid={`gate-row-${row.id}`}
                >
                  <span className="gate-label text-muted-dark">{row.label}</span>
                  <span
                    key={`${version}-${row.id}`}
                    className="gate-state server row-state-in"
                    style={{ "--i": 3 + j } as CSSProperties}
                  >
                    Runs on the server
                  </span>
                </li>
              ))}
            </ul>
            <div className="gate-controls">
              <button type="button" className="btn-ghost btn-s" onClick={() => demoApi.current?.clear()} data-testid="gate-clear-button">
                Clear
              </button>
              <button type="button" className="btn-ghost btn-s" onClick={() => applySample("empty")} data-testid="gate-sample-empty-button">
                Empty page
              </button>
              <button type="button" className="btn-ghost btn-s" onClick={() => applySample("dot")} data-testid="gate-sample-dot-button">
                A dot
              </button>
              <button type="button" className="btn-ghost btn-s" onClick={() => applySample("line")} data-testid="gate-sample-line-button">
                A straight line
              </button>
              <button type="button" className="btn-ghost btn-s" onClick={() => applySample("signature")} data-testid="gate-sample-signature-button">
                A signature-like stroke
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
