import { useRef, useState } from "react";
import { useInViewContinuous, usePrefersReducedMotion } from "@/lib/hooks";
import { useCanvasLoop } from "@/lib/useCanvasLoop";
import { Instrument } from "../Instrument";
import { Segmented } from "../Controls";

const CONDITIONS = [
  { id: "normal", label: "Normal operation", a: 1.0, f: 1.0, h: 0, fault: false },
  { id: "capacitor", label: "Resonant capacitor fault", a: 1.15, f: 1.25, h: 0, fault: true },
  { id: "magnetizing", label: "Magnetizing inductance fault", a: 1.1, f: 1.0, h: 0.35, fault: true },
  { id: "inductance", label: "Resonant inductance fault", a: 0.9, f: 0.8, h: 0, fault: true },
] as const;

const OMEGA = (2 * Math.PI) / 0.4; // critically damped spring, response 0.4s
const SIGNAL = "#4BD39B";
const WARN = "#FFB84D";
const GRID = "rgba(238,242,239,0.14)";

/**
 * Illustrative resonant-current waveform a·sin(f·t) + h·sin(3f·t), scrolling left.
 * Condition buttons morph the parameters with a critically damped spring.
 */
export default function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { ref, inView } = useInViewContinuous<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const [selected, setSelected] = useState(0);
  const [s] = useState(() => ({
    a: 1,
    f: 1,
    h: 0,
    va: 0,
    vf: 0,
    vh: 0,
    ta: 1,
    tf: 1,
    th: 0,
    phase: 0,
    color: SIGNAL,
  }));

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 0; gx <= w; gx += w / 8) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
    }
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    const mid = h / 2;
    const amp = h * 0.28;
    const cycles = 3;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const th = (x / w) * cycles * Math.PI * 2 + s.phase;
      const y = mid - (s.a * Math.sin(s.f * th) + s.h * Math.sin(3 * s.f * th)) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const loop = useCanvasLoop({
    name: "waveform",
    canvasRef,
    active: inView,
    reduced,
    staticFrame: draw,
    frame: (ctx, dt, _t, w, h) => {
      const d = dt / 1000;
      const w2 = OMEGA * OMEGA;
      s.va += ((s.ta - s.a) * w2 - 2 * OMEGA * s.va) * d;
      s.a += s.va * d;
      s.vf += ((s.tf - s.f) * w2 - 2 * OMEGA * s.vf) * d;
      s.f += s.vf * d;
      s.vh += ((s.th - s.h) * w2 - 2 * OMEGA * s.vh) * d;
      s.h += s.vh * d;
      s.phase += dt * 0.0012;
      draw(ctx, w, h);
    },
  });

  const choose = (i: number) => {
    const c = CONDITIONS[i];
    setSelected(i);
    s.ta = c.a;
    s.tf = c.f;
    s.th = c.h;
    s.color = c.fault ? WARN : SIGNAL;
    if (reduced || !inView) {
      s.a = c.a;
      s.f = c.f;
      s.h = c.h;
      s.va = s.vf = s.vh = 0;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && loop.current.w > 0) draw(ctx, loop.current.w, loop.current.h);
    }
  };

  const current = CONDITIONS[selected];

  return (
    <div ref={ref}>
      <Instrument
        testid="waveform-window"
        label="Stylised resonant-current waveform. Choose a condition with the buttons below the window."
        caption={
          <span className="flex flex-wrap justify-between gap-x-6 gap-y-1">
            <span data-testid="waveform-readout">Random Forest: 99% accuracy</span>
            <span style={{ color: current.fault ? "var(--warn)" : "var(--signal)" }} data-testid="waveform-condition">
              {current.label.toLowerCase()}
            </span>
          </span>
        }
      >
        <canvas ref={canvasRef} className="block aspect-[16/9] w-full" aria-hidden="true" data-testid="waveform-canvas" />
      </Instrument>
      <div className="mt-4 max-w-full">
        <Segmented
          group="wave"
          label="Converter condition"
          size="s"
          value={current.id}
          onChange={(id) => choose(CONDITIONS.findIndex((c) => c.id === id))}
          options={CONDITIONS.map((c) => ({ id: c.id, label: c.label, testid: `waveform-${c.id}-button` }))}
          testid="waveform-conditions"
        />
      </div>
    </div>
  );
}
