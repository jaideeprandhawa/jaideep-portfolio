import type { Pt } from "./checks";

/**
 * Deterministic sample strokes, stored as normalised point paths and run
 * through the same checks as hand-drawn input (this also serves keyboard users).
 */
export function emptyPage(): Pt[][] {
  return [];
}

/** A fat dot: a filled spiral so the ink area passes the blank check and fails the area check. */
export function dot(): Pt[][] {
  const loops = 6;
  const per = 20;
  const pts: Pt[] = [];
  for (let i = 0; i <= loops * per; i++) {
    const t = i / (loops * per);
    const angle = 2 * Math.PI * loops * t;
    const r = t;
    pts.push({
      x: 0.5 + 0.03 * r * Math.cos(angle),
      y: 0.5 + 0.09 * r * Math.sin(angle),
    });
  }
  return [pts];
}

/** A straight diagonal line: fills the bounding box (passes the area check) with no turning. */
export function straightLine(): Pt[][] {
  return [
    [
      { x: 0.12, y: 0.78 },
      { x: 0.88, y: 0.22 },
    ],
  ];
}

/**
 * A smooth cursive stroke (several stacked sine meanders over x = 0.1 + 0.8t),
 * long and wiggly enough to pass the length-over-diagonal and turning-angle checks
 * on both the 8:3 desktop and the 4:3 phone canvas.
 */
export function signatureStroke(): Pt[][] {
  const n = 260;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = 0.1 + 0.8 * t;
    const y =
      0.5 +
      0.34 * Math.sin(2 * Math.PI * 3.2 * t) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 1.5 * t)) +
      0.06 * Math.sin(2 * Math.PI * 7.3 * t + 1);
    pts.push({ x, y });
  }
  return [pts];
}
