import { useCallback, useEffect, useImperativeHandle, useRef } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { runChecks } from "@/lib/gate/checks";
import type { GateResult, Pt } from "@/lib/gate/checks";
import { STROKE_WIDTH_CSS_PX } from "@/lib/gate/thresholds";
import { dot, emptyPage, signatureStroke, straightLine } from "@/lib/gate/samples";

export interface GateApi {
  clear: () => void;
  applySample: (name: "empty" | "dot" | "line" | "signature") => void;
}

interface GateDemoProps {
  onResult: (result: GateResult | null) => void;
  apiRef: RefObject<GateApi | null>;
}

const SAMPLES = {
  empty: emptyPage,
  dot,
  line: straightLine,
  signature: signatureStroke,
} as const;

/**
 * The drawable canvas of the Signature Gate. Ink #0F1512 on white, 3.5 CSS px
 * strokes, Pointer Events with pointer capture, strokes kept as normalised
 * point arrays and redrawn from them on resize. The trained models are NOT
 * simulated — only the three browser-side checks run here.
 */
export default function GateDemo({ onResult, apiRef }: GateDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Pt[][]>([]);
  const drawingRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#0F1512";
    ctx.fillStyle = "#0F1512";
    ctx.lineWidth = STROKE_WIDTH_CSS_PX;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesRef.current) {
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x * w, stroke[0].y * h, STROKE_WIDTH_CSS_PX / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * w, stroke[0].y * h);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * w, stroke[i].y * h);
      }
      ctx.stroke();
    }
  }, []);

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }, [draw]);

  useEffect(() => {
    sizeCanvas();
    const canvas = canvasRef.current;
    const ro = new ResizeObserver(sizeCanvas);
    if (canvas) ro.observe(canvas);
    return () => ro.disconnect();
  }, [sizeCanvas]);

  const report = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onResult(runChecks(strokesRef.current, canvas.clientWidth, canvas.clientHeight));
  }, [onResult]);

  const clear = useCallback(() => {
    strokesRef.current = [];
    draw();
    onResult(null);
  }, [draw, onResult]);

  const applySample = useCallback(
    (name: "empty" | "dot" | "line" | "signature") => {
      strokesRef.current = SAMPLES[name]();
      draw();
      report();
    },
    [draw, report],
  );

  useImperativeHandle(apiRef, () => ({ clear, applySample }), [clear, applySample]);

  const toPt = (e: ReactPointerEvent<HTMLCanvasElement>): Pt => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([toPt(e)]);
    draw();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const strokes = strokesRef.current;
    const stroke = strokes[strokes.length - 1];
    if (!stroke) return;
    stroke.push(toPt(e));
    // Draw just the new segment; the transform is already scaled for devicePixelRatio.
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || stroke.length < 2) return;
    const a = stroke[stroke.length - 2];
    const b = stroke[stroke.length - 1];
    ctx.strokeStyle = "#0F1512";
    ctx.lineWidth = STROKE_WIDTH_CSS_PX;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x * canvas.clientWidth, a.y * canvas.clientHeight);
    ctx.lineTo(b.x * canvas.clientWidth, b.y * canvas.clientHeight);
    ctx.stroke();
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    report();
  };

  return (
    <canvas
      ref={canvasRef}
      className="gate-canvas"
      role="img"
      aria-label="Signature drawing area"
      data-testid="gate-canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
    />
  );
}
