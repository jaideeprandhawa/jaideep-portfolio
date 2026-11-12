import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { subscribeRaf } from "./raf";

declare global {
  interface Window {
    __fps?: Record<string, number>;
  }
}

export interface CanvasLoopOptions {
  name: string;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  active: boolean;
  reduced: boolean;
  dprCap?: number;
  onResize?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  frame: (ctx: CanvasRenderingContext2D, dt: number, t: number, w: number, h: number) => void;
  staticFrame: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  /** Called once if the first 60 frames average under 50fps, so the visual can shed load. */
  onSlow?: () => void;
}

function isPhone(): boolean {
  return window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
}

/**
 * Sizes a canvas to its box (devicePixelRatio capped at 2, 1.5 on phones),
 * runs `frame` on the shared rAF loop only while `active`, draws one static
 * frame under reduced motion, and records fps in window.__fps[name].
 */
export function useCanvasLoop(opts: CanvasLoopOptions) {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const size = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = opts.canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const o = optsRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      const cap = Math.min(o.dprCap ?? 2, isPhone() ? 1.5 : 2);
      const dpr = Math.min(window.devicePixelRatio || 1, cap);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      size.current.w = w;
      size.current.h = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.onResize?.(ctx, w, h);
      o.staticFrame(ctx, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [opts.canvasRef]);

  useEffect(() => {
    const canvas = opts.canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (opts.reduced || !opts.active) {
      if (size.current.w > 0) optsRef.current.staticFrame(ctx, size.current.w, size.current.h);
      return;
    }
    if (!window.__fps) window.__fps = {};
    const fps = window.__fps;
    const name = opts.name;
    let frames = 0;
    let firstSum = 0;
    let secFrames = 0;
    let secTime = 0;
    let slowChecked = false;
    const unsub = subscribeRaf((dt, t) => {
      frames++;
      if (frames <= 60) firstSum += dt;
      if (frames === 60 && !slowChecked) {
        slowChecked = true;
        const avg = 1000 / (firstSum / 60);
        fps[name + "_first60"] = Math.round(avg);
        if (avg < 50) optsRef.current.onSlow?.();
      }
      secFrames++;
      secTime += dt;
      if (secTime >= 1000) {
        fps[name] = Math.round((secFrames * 1000) / secTime);
        secFrames = 0;
        secTime = 0;
      }
      optsRef.current.frame(ctx, dt, t, size.current.w, size.current.h);
    });
    return unsub;
  }, [opts.active, opts.reduced, opts.canvasRef, opts.name]);

  return size;
}
