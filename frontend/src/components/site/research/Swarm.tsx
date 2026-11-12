import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useInViewContinuous, usePrefersReducedMotion } from "@/lib/hooks";
import { useCanvasLoop } from "@/lib/useCanvasLoop";
import { Instrument } from "../Instrument";

const MAX = 90;
const FLEE_R = 140;
const SEP_R = 22;
const NEIGH_R = 56;
const MAX_SPEED = 2.2; // px per frame at 60fps
const MIN_SPEED = 0.7;
const TRAIL = "rgba(19,29,24,0.14)";
const INK3 = "#131D18";
const SIGNAL = "#4BD39B";
const WARN = "#FFB84D";

/**
 * Rule-based flocking (separation, alignment, cohesion) plus a flee rule from
 * the pursuer. Pursuer = pointer; on touch, the finger while down; idle 2s →
 * slow Lissajous wander. Typed arrays allocated once; nothing allocated per frame.
 */
export default function Swarm() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { ref, inView } = useInViewContinuous<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const [s] = useState(() => ({
    count:
      typeof window !== "undefined" && (window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches) ? 48 : MAX,
    x: new Float32Array(MAX),
    y: new Float32Array(MAX),
    vx: new Float32Array(MAX),
    vy: new Float32Array(MAX),
    px: 0,
    py: 0,
    tx: 0,
    ty: 0,
    lastInput: -1e9,
    down: false,
    seeded: false,
  }));

  const seed = (w: number, h: number) => {
    for (let i = 0; i < MAX; i++) {
      s.x[i] = Math.random() * w;
      s.y[i] = Math.random() * h;
      const a = Math.random() * Math.PI * 2;
      s.vx[i] = Math.cos(a) * 1.2;
      s.vy[i] = Math.sin(a) * 1.2;
    }
    s.px = s.tx = w * 0.5;
    s.py = s.ty = h * 0.5;
    s.seeded = true;
  };

  const drawAgents = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = SIGNAL;
    ctx.beginPath();
    for (let i = 0; i < s.count; i++) {
      const sp = Math.hypot(s.vx[i], s.vy[i]) || 1;
      const ux = s.vx[i] / sp;
      const uy = s.vy[i] / sp;
      const x = s.x[i];
      const y = s.y[i];
      ctx.moveTo(x + ux * 6, y + uy * 6);
      ctx.lineTo(x - ux * 3 - uy * 3, y - uy * 3 + ux * 3);
      ctx.lineTo(x - ux * 3 + uy * 3, y - uy * 3 - ux * 3);
      ctx.closePath();
    }
    ctx.fill();
    ctx.strokeStyle = WARN;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.px, s.py, 10, 0, Math.PI * 2);
    ctx.stroke();
  };

  const staticFrame = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = INK3;
    ctx.fillRect(0, 0, w, h);
    drawAgents(ctx);
  };

  useCanvasLoop({
    name: "swarm",
    canvasRef,
    active: inView && !paused,
    reduced,
    onResize: (_ctx, w, h) => {
      if (!s.seeded) seed(w, h);
    },
    staticFrame,
    frame: (ctx, dt, t, w, h) => {
      const k = dt / 16.67;
      // Pursuer: pointer / finger, or a slow Lissajous wander after 2s idle.
      if (!s.down && performance.now() - s.lastInput > 2000) {
        s.tx = w * (0.5 + 0.38 * Math.sin(t * 0.00031));
        s.ty = h * (0.5 + 0.36 * Math.sin(t * 0.00047 + 1));
      }
      s.px += (s.tx - s.px) * Math.min(1, 0.12 * k);
      s.py += (s.ty - s.py) * Math.min(1, 0.12 * k);

      const n = s.count;
      for (let i = 0; i < n; i++) {
        const xi = s.x[i];
        const yi = s.y[i];
        let sx = 0;
        let sy = 0;
        let ax = 0;
        let ay = 0;
        let cx = 0;
        let cy = 0;
        let nc = 0;
        for (let j = 0; j < n; j++) {
          if (j === i) continue;
          const dx = s.x[j] - xi;
          const dy = s.y[j] - yi;
          const d2 = dx * dx + dy * dy;
          if (d2 < NEIGH_R * NEIGH_R) {
            ax += s.vx[j];
            ay += s.vy[j];
            cx += dx;
            cy += dy;
            nc++;
            if (d2 < SEP_R * SEP_R && d2 > 0) {
              const d = Math.sqrt(d2);
              sx -= dx / d / d;
              sy -= dy / d / d;
            }
          }
        }
        let fx = sx * 18;
        let fy = sy * 18;
        if (nc > 0) {
          fx += (ax / nc - s.vx[i]) * 0.05 + (cx / nc) * 0.0012;
          fy += (ay / nc - s.vy[i]) * 0.05 + (cy / nc) * 0.0012;
        }
        const pdx = xi - s.px;
        const pdy = yi - s.py;
        const pd = Math.hypot(pdx, pdy);
        if (pd < FLEE_R && pd > 0.5) {
          const wgt = 24 / pd; // weighted by 1/distance
          fx += (pdx / pd) * wgt * 0.12;
          fy += (pdy / pd) * wgt * 0.12;
        }
        let vx = s.vx[i] + fx * k;
        let vy = s.vy[i] + fy * k;
        const sp = Math.hypot(vx, vy);
        if (sp > MAX_SPEED) {
          vx = (vx / sp) * MAX_SPEED;
          vy = (vy / sp) * MAX_SPEED;
        } else if (sp < MIN_SPEED && sp > 0) {
          vx = (vx / sp) * MIN_SPEED;
          vy = (vy / sp) * MIN_SPEED;
        }
        s.vx[i] = vx;
        s.vy[i] = vy;
        let nx = xi + vx * k;
        let ny = yi + vy * k;
        if (nx < 0) nx += w;
        else if (nx > w) nx -= w;
        if (ny < 0) ny += h;
        else if (ny > h) ny -= h;
        s.x[i] = nx;
        s.y[i] = ny;
      }

      ctx.fillStyle = TRAIL;
      ctx.fillRect(0, 0, w, h);
      drawAgents(ctx);
    },
    onSlow: () => {
      s.count = Math.max(24, Math.floor(s.count * 0.6));
    },
  });

  const toLocal = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    s.tx = e.clientX - r.left;
    s.ty = e.clientY - r.top;
    s.lastInput = performance.now();
  };

  return (
    <div ref={ref}>
      <Instrument
        testid="swarm-window"
        label="Flocking field: green agents flee an amber pursuer that follows your pointer."
        caption="Rule-based flocking with a flee rule. A stand-in for the PPO-trained policies from the IIIT Allahabad work, not those policies."
      >
        <canvas
          ref={canvasRef}
          className="block aspect-[4/3] w-full"
          style={{ touchAction: "pan-y" }}
          aria-hidden="true"
          data-testid="swarm-canvas"
          onPointerMove={(e) => {
            if (e.pointerType === "mouse" || e.pointerType === "pen" || s.down) toLocal(e);
          }}
          onPointerDown={(e) => {
            s.down = true;
            toLocal(e);
          }}
          onPointerUp={() => {
            s.down = false;
          }}
          onPointerCancel={() => {
            s.down = false;
          }}
          onPointerLeave={() => {
            s.down = false;
          }}
        />
      </Instrument>
      <div className="mt-4">
        <button
          type="button"
          className="btn-ghost btn-s"
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
          data-testid="swarm-pause-button"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>
    </div>
  );
}
