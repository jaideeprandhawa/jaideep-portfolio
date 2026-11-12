// Signature Gate — every threshold as a named constant in one place (brief §4 B).
// The browser checks run on the drawn strokes; on the white canvas with full-ink
// strokes, "fraction of dark pixels (luminance below 128)" is equivalent to the
// geometric ink rasterisation in checks.ts (CELL grid marked within stroke radius).

/** Stroke width in CSS pixels, drawn and measured. */
export const STROKE_WIDTH_CSS_PX = 3.5;

/** Cell edge (px) of the ink rasterisation grid used for the dark-pixel fraction. */
export const RASTER_CELL_PX = 2;

/** Check 1: dark pixels must cover at least 0.15% of the canvas. */
export const MIN_DARK_FRACTION = 0.0015;

/** Check 2: ink bounding box must cover at least 6% of the canvas area... */
export const MIN_AREA_FRACTION = 0.06;

/** ...and at least 25% of its width. */
export const MIN_BBOX_WIDTH_FRACTION = 0.25;

/** Check 3a: total stroke path length / bounding-box diagonal must be at least 1.8. */
export const MIN_LENGTH_OVER_DIAGONAL = 1.8;

/** Check 3b: summed absolute turning angle along the strokes, in radians (3π). */
export const MIN_TURNING_ANGLE = 3 * Math.PI;
