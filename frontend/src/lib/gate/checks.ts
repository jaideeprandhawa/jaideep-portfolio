import {
  MIN_AREA_FRACTION,
  MIN_BBOX_WIDTH_FRACTION,
  MIN_DARK_FRACTION,
  MIN_LENGTH_OVER_DIAGONAL,
  MIN_TURNING_ANGLE,
  RASTER_CELL_PX,
  STROKE_WIDTH_CSS_PX,
} from "./thresholds";

/** A point in normalised canvas coordinates (0..1 on both axes). */
export interface Pt {
  x: number;
  y: number;
}

export type RowState = "waiting" | "pass" | "reject";

export const MESSAGES = {
  blank: "Rejected: blank. Nothing was drawn.",
  small: "Rejected: too small to be a signature.",
  shape: "Rejected: looks like a dot or a straight line.",
  pass: "Passes the browser checks.",
} as const;

export interface InkBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Live measurements from the real canvas — surfaced in the mono readout, never invented. */
export interface GateMetrics {
  ink: number;
  box: number;
  ratio: number;
}

export interface GateResult {
  blank: RowState;
  area: RowState;
  contour: RowState;
  verdict: string;
  rejected: boolean;
  metrics: GateMetrics | null;
  inkBox: InkBox | null;
}

interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function bboxOf(strokes: Pt[][], w: number, h: number): Box {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (const stroke of strokes) {
    for (const p of stroke) {
      const px = p.x * w;
      const py = p.y * h;
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
  }
  return { minX, minY, maxX, maxY };
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = 0;
  if (lenSq > 0) {
    t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/**
 * Fraction of the canvas covered by ink. On the live canvas this is the fraction
 * of pixels with luminance below 128 (white background #FFFFFF, ink #0F1512);
 * rasterising the stroke geometry onto a CELL grid gives the same verdict.
 */
function inkFraction(strokes: Pt[][], w: number, h: number): number {
  const cell = RASTER_CELL_PX;
  const cols = Math.max(1, Math.ceil(w / cell));
  const rows = Math.max(1, Math.ceil(h / cell));
  const marked = new Uint8Array(cols * rows);
  const r = STROKE_WIDTH_CSS_PX / 2;
  let count = 0;

  for (const stroke of strokes) {
    for (let i = 1; i < stroke.length; i++) {
      const ax = stroke[i - 1].x * w;
      const ay = stroke[i - 1].y * h;
      const bx = stroke[i].x * w;
      const by = stroke[i].y * h;
      const c0 = Math.max(0, Math.floor((Math.min(ax, bx) - r) / cell));
      const c1 = Math.min(cols - 1, Math.floor((Math.max(ax, bx) + r) / cell));
      const r0 = Math.max(0, Math.floor((Math.min(ay, by) - r) / cell));
      const r1 = Math.min(rows - 1, Math.floor((Math.max(ay, by) + r) / cell));
      for (let row = r0; row <= r1; row++) {
        for (let col = c0; col <= c1; col++) {
          const idx = row * cols + col;
          if (marked[idx]) continue;
          const cx = col * cell + cell / 2;
          const cy = row * cell + cell / 2;
          if (distToSegment(cx, cy, ax, ay, bx, by) <= r) {
            marked[idx] = 1;
            count++;
          }
        }
      }
    }
  }
  return count / (cols * rows);
}

function strokeStats(strokes: Pt[][], w: number, h: number): { length: number; turning: number } {
  let length = 0;
  let turning = 0;
  for (const stroke of strokes) {
    const pts = stroke.map((p) => ({ x: p.x * w, y: p.y * h }));
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      length += len;
      if (i > 1) {
        const pdx = pts[i - 1].x - pts[i - 2].x;
        const pdy = pts[i - 1].y - pts[i - 2].y;
        const plen = Math.hypot(pdx, pdy);
        if (plen === 0) continue;
        // Angle between consecutive segment directions.
        const cross = pdx * dy - pdy * dx;
        const dot = pdx * dx + pdy * dy;
        turning += Math.abs(Math.atan2(cross, dot));
      }
    }
  }
  return { length, turning };
}

/**
 * The three browser-side checks, evaluated in order — a row after a failed
 * check stays "waiting", matching the gate narrative. An explicitly submitted
 * empty page fails check 1 ("Nothing was drawn"); the initial idle state is
 * handled by the caller (all rows "waiting", no verdict).
 */
export function runChecks(strokes: Pt[][], w: number, h: number): GateResult {
  const empty = strokes.length === 0 || strokes.every((s) => s.length === 0);
  if (empty) {
    return {
      blank: "reject",
      area: "waiting",
      contour: "waiting",
      verdict: MESSAGES.blank,
      rejected: true,
      metrics: null,
      inkBox: null,
    };
  }

  const darkFraction = inkFraction(strokes, w, h);
  const box = bboxOf(strokes, w, h);
  const bw = box.maxX - box.minX;
  const bh = box.maxY - box.minY;
  const { length, turning } = strokeStats(strokes, w, h);
  const diag = Math.hypot(bw, bh);
  const metrics: GateMetrics = {
    ink: darkFraction,
    box: w > 0 && h > 0 ? (bw * bh) / (w * h) : 0,
    ratio: diag > 0 ? length / diag : Infinity,
  };
  const inkBox: InkBox = { x: box.minX, y: box.minY, w: bw, h: bh };

  const blank: RowState = darkFraction >= MIN_DARK_FRACTION ? "pass" : "reject";
  if (blank === "reject") {
    return { blank, area: "waiting", contour: "waiting", verdict: MESSAGES.blank, rejected: true, metrics, inkBox };
  }

  const areaOk = (bw * bh) / (w * h) >= MIN_AREA_FRACTION && bw >= MIN_BBOX_WIDTH_FRACTION * w;
  const area: RowState = areaOk ? "pass" : "reject";
  if (!areaOk) {
    return { blank, area, contour: "waiting", verdict: MESSAGES.small, rejected: true, metrics, inkBox };
  }

  const contourOk = metrics.ratio >= MIN_LENGTH_OVER_DIAGONAL && turning >= MIN_TURNING_ANGLE;
  const contour: RowState = contourOk ? "pass" : "reject";
  return {
    blank,
    area,
    contour,
    verdict: contourOk ? MESSAGES.pass : MESSAGES.shape,
    rejected: !contourOk,
    metrics,
    inkBox,
  };
}
