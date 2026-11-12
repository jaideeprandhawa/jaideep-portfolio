import type { Outfit } from "./store";

export type Expr = "idle" | "blink" | "happy" | "sleep" | "dizzy" | "talk";
export type Legs = "stand" | "walk" | "dangle";

export const COLS = 14;
export const ROWS = 21; // 5 outfit rows above the 16-row base
const TOP = 5;

// Base sprite (spec), with one-pixel S shading down the right side of head and body.
const BASE = [
  "......AA......",
  "......DD......",
  "......DD......",
  "..DDDDDDDDDD..",
  "..DBBBBBBBSD..",
  "..DBDDDDDDSD..",
  "..DBDWDDWDSD..",
  "..DBDDDDDDSD..",
  "..DBBBBBBBSD..",
  "..DDDDDDDDDD..",
  "...DBBBBBSD...",
  ".DDBBBBBBBSDD.",
  ".DBDBBBBBSDBD.",
  "..DDBBBBBSDD..",
  "...DBD..DBD...",
  "...DDD..DDD...",
];

const LEGS: Record<Legs | "walk2", [string, string]> = {
  stand: ["...DBD..DBD...", "...DDD..DDD..."],
  walk: ["...DBD..DBD...", "...DDD...DDD.."],
  walk2: ["..DBD...DBD...", "..DDD...DDD..."],
  dangle: ["....DBDDBD....", "....DD..DD...."],
};

// Screen area: rows 5–7, cols 4–9 of the base.
function screen(expr: Expr, eyeDx: number, mouth: boolean): [string, string, string] {
  switch (expr) {
    case "blink":
      return ["DDDDDD", "DDDDDD", "DDDDDD"];
    case "happy":
      return ["DWDDWD", "WDWWDW", "DDDDDD"];
    case "sleep":
      return ["DDDDDD", "DDDDDD", "SSDDSS"];
    case "dizzy":
      return ["WDWWDW", "DWDDWD", "WDWWDW"];
    default: {
      const row = ["D", "D", "D", "D", "D", "D"];
      row[1 + eyeDx] = "W";
      row[4 + eyeDx] = "W";
      return ["DDDDDD", row.join(""), expr === "talk" && mouth ? "DDWWDD" : "DDDDDD"];
    }
  }
}

const OUTFITS: Record<Outfit, string[]> = {
  normal: [],
  // Mortarboard with a tassel (A), sitting over the antenna.
  grad: [
    "..............",
    "..............",
    ".SBBBBBBBBBBS.",
    "....SSSSSS.A..",
    "...........A..",
    "...........A..",
  ],
  // Headphones band over the head, ear cups at the sides, a tiny mic.
  radio: [
    "", "", "", "", "", "", "",
    "...SSSSSSSS...",
    "..S........S..",
    "",
    ".SS........SS.",
    ".SS........SS.",
    ".SS........SS.",
    ".S............",
    "..SA..........",
  ],
  // Goggles across the top of the head.
  lab: [
    "", "", "", "", "", "", "", "",
    "..SWWSSSSWWS..",
    "..SWWS..SWWS..",
  ],
};

export function compose(expr: Expr, eyeDx: number, mouth: boolean, legs: Legs, legFrame: number, outfit: Outfit): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill("."));
  BASE.forEach((row, r) => {
    for (let c = 0; c < COLS; c++) g[TOP + r][c] = row[c];
  });
  const sc = screen(expr, eyeDx, mouth);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) g[TOP + 5 + r][4 + c] = sc[r][c];
  const lg = legs === "walk" && legFrame === 1 ? LEGS.walk2 : LEGS[legs];
  for (let c = 0; c < COLS; c++) {
    g[TOP + 14][c] = lg[0][c];
    g[TOP + 15][c] = lg[1][c];
  }
  OUTFITS[outfit].forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] !== ".") g[r][c] = row[c];
  });
  return g.map((r) => r.join(""));
}

const NORMAL: Record<string, string> = { D: "#070B0A", B: "#4BD39B", S: "#0A7C4A", W: "#EEF2EF", A: "#FFB84D" };
const FAULT: Record<string, string> = { ...NORMAL, B: "#FFB84D", S: "#B97A1E" };

/** SVG markup with horizontal runs merged into single rects; antenna pixels get a class for the radio blink. */
export function toSvg(grid: string[], fault: boolean, dim: boolean): string {
  const pal = fault ? FAULT : NORMAL;
  let out = "";
  grid.forEach((row, y) => {
    let x = 0;
    while (x < COLS) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < COLS && row[x + w] === ch) w++;
      const ant = ch === "A" && y === TOP ? ' class="sig-ant"' : "";
      const op = dim && y >= TOP + 5 && y <= TOP + 7 && ch === "S" ? ' opacity="0.6"' : "";
      out += `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${pal[ch]}"${ant}${op}/>`;
      x += w;
    }
  });
  return `<svg viewBox="0 0 ${COLS} ${ROWS}" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
}

export const HEART_SVG =
  '<svg viewBox="0 0 5 4" width="100%" height="100%" shape-rendering="crispEdges"><rect x="0" y="0" width="2" height="1" fill="#FFB84D"/><rect x="3" y="0" width="2" height="1" fill="#FFB84D"/><rect x="0" y="1" width="5" height="1" fill="#FFB84D"/><rect x="1" y="2" width="3" height="1" fill="#FFB84D"/><rect x="2" y="3" width="1" height="1" fill="#FFB84D"/></svg>';
