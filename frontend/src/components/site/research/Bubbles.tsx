import { useRef, useState } from "react";
import { useInViewContinuous, usePrefersReducedMotion } from "@/lib/hooks";
import { useCanvasLoop } from "@/lib/useCanvasLoop";

const MAX = 28;

/** Rising-bubble decoration behind the biogas text. 28 circles (14 on phones), stroke only, recycled at the top. */
export default function Bubbles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { ref, inView } = useInViewContinuous<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const [state] = useState(() => ({
    count: typeof window !== "undefined" && (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches) ? 14 : MAX,
    bx: new Float32Array(MAX),
    y: new Float32Array(MAX),
    r: new Float32Array(MAX),
    v: new Float32Array(MAX),
    ph: new Float32Array(MAX),
    seeded: false,
  }));

  const seed = (w: number, h: number) => {
    for (let i = 0; i < MAX; i++) {
      state.bx[i] = Math.random() * w;
      state.y[i] = Math.random() * h;
      state.r[i] = 2 + Math.random() * 7;
      state.v[i] = 0.18 + Math.random() * 0.4;
      state.ph[i] = Math.random() * Math.PI * 2;
    }
    state.seeded = true;
  };

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(75,211,155,0.35)";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    for (let i = 0; i < state.count; i++) {
      const x = state.bx[i] + Math.sin(t * 0.0008 + state.ph[i]) * 10;
      ctx.moveTo(x + state.r[i], state.y[i]);
      ctx.arc(x, state.y[i], state.r[i], 0, Math.PI * 2);
    }
    ctx.stroke();
  };

  useCanvasLoop({
    name: "bubbles",
    canvasRef,
    active: inView,
    reduced,
    dprCap: 1.5,
    onResize: (_ctx, w, h) => {
      if (!state.seeded) seed(w, h);
    },
    staticFrame: (ctx, w, h) => draw(ctx, w, h, 0),
    frame: (ctx, dt, t, w, h) => {
      const k = dt / 16.67;
      for (let i = 0; i < state.count; i++) {
        state.y[i] -= state.v[i] * k;
        if (state.y[i] < -state.r[i]) {
          state.y[i] = h + state.r[i];
          state.bx[i] = Math.random() * w;
        }
      }
      draw(ctx, w, h, t);
    },
    onSlow: () => {
      state.count = Math.max(8, Math.floor(state.count / 2));
    },
  });

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <canvas ref={canvasRef} className="block h-full w-full opacity-60" data-testid="bubbles-canvas" />
    </div>
  );
}
