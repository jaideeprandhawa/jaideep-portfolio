import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { subscribeRaf } from "@/lib/raf";
import { scrollToChapter } from "@/lib/useSmoothScroll";
import { COLS, HEART_SVG, ROWS, compose, toSvg } from "./sprite";
import type { Expr, Legs } from "./sprite";
import { getSig, setSig, sigPos, useSig } from "./store";
import type { Outfit } from "./store";
import SigPanel from "./SigPanel";


type Mode = "off" | "pause" | "walk" | "drag" | "fly" | "play" | "dance" | "sleep" | "still";

const CHEER = ["Beep!", "Hi!", "Boop."];
const SILLY = [
  "I overfit on snacks.",
  "My loss function is mostly vibes.",
  "I once mistook a logo for a signature. The gate said no.",
  "Gradient descent: me, down the stairs.",
  "I flock, therefore I am.",
  "Jaideep taught me everything. Mostly pixels.",
  "Beep. That means hello.",
  "Random forest? I prefer a nice tree.",
];

const COMMENTS: [string, string][] = [
  ["gate", "Draw a signature. I’ll watch the gates."],
  ["research-row-2", "Bubbles! I did not make those."],
  ["research-row-3", "Try the fault buttons. Spicy waveforms."],
  ["research-row-4", "My cousins. Try catching them."],
  ["publications", "Four papers, three presentations."],
  ["recognition", "Best Student, Best Paper."],
  ["experience", "Four internships since 2024."],
  ["about", "He was a radio jockey on 90.8 MHz."],
  ["contact", "Say hi. I’ll pretend I wrote this."],
];

const CHAPTER_WORDS: Record<string, string> = {
  gate: "gate",
  research: "research",
  papers: "publications",
  awards: "recognition",
  experience: "experience",
  about: "about",
  contact: "contact",
};

export const WORDS = [
  "hello", "dance", "party", "sleep", "play", "radio", "grad", "lab", "normal", "fault", "train",
  "gate", "research", "papers", "awards", "experience", "about", "contact", "cv", "jaideep", "bye", "help",
];
const WORDS_BY_LEN = [...WORDS].sort((a, b) => b.length - a.length);

const rand = (a: number, b: number) => a + Math.random() * (b - a);

interface Bubble {
  id: number;
  text: string;
  live: boolean;
  align: "left" | "center" | "right";
}

export default function Sig() {
  const sig = useSig();
  const layerRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hopRef = useRef<HTMLDivElement | null>(null);
  const squashRef = useRef<HTMLDivElement | null>(null);
  const flipRef = useRef<HTMLDivElement | null>(null);
  const artRef = useRef<HTMLDivElement | null>(null);
  const poolRef = useRef<HTMLSpanElement[]>([]);
  const busyRef = useRef<boolean[]>([]);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [live, setLive] = useState("");
  const [tools, setTools] = useState(false);

  const s = useRef({
    phone: false,
    reduced: false,
    px: 4,
    w: 56,
    h: 84,
    vw: 1024,
    vh: 768,
    floor: 600,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    mode: "off" as Mode,
    face: 1,
    targetX: 0,
    until: 0,
    legT: 0,
    legFrame: 0,
    bounces: 0,
    blinkAt: 0,
    blinkUntil: 0,
    exprOverride: null as Expr | null,
    exprUntil: 0,
    talkUntil: 0,
    faultUntil: 0,
    danceUntil: 0,
    danceX: 0,
    playUntil: 0,
    catches: 0,
    lastInput: 0,
    pointerX: -9999,
    pointerY: -9999,
    renderKey: "",
    faceApplied: 0,
    dragging: false,
    moved: false,
    downAt: 0,
    offX: 0,
    offY: 0,
    sx: new Float64Array(8),
    sy: new Float64Array(8),
    st: new Float64Array(8),
    si: 0,
    petTimer: 0,
    tapCount: 0,
    lastTapAt: 0,
    sillyIdx: 0,
    drawing: false,
    lastComment: -1e9,
    zTimer: 0,
    unsub: null as (() => void) | null,
    queue: [] as { text: string; live: boolean }[],
    showing: false,
    bubbleTimer: 0,
    idSeq: 0,
  }).current;

  // ---------- particles (pooled DOM nodes, WAAPI) ----------
  const spawn = useCallback(
    (kind: "heart" | "confetti" | "z" | "arc", n: number) => {
      if (s.reduced) return;
      const pool = poolRef.current;
      const colors = ["#4BD39B", "#EEF2EF", "#FFB84D"];
      for (let k = 0; k < n; k++) {
        const i = busyRef.current.findIndex((b) => !b);
        if (i < 0) return;
        busyRef.current[i] = true;
        const el = pool[i];
        const cx = s.x + s.w / 2;
        const cy = s.y + (kind === "z" ? s.h * 0.35 : s.h * 0.3);
        el.className = `sig-p sig-p-${kind}`;
        el.innerHTML = kind === "heart" ? HEART_SVG : kind === "z" ? "z" : kind === "arc" ? ")" : "";
        el.style.background = kind === "confetti" ? colors[k % 3] : "";
        const dx = kind === "confetti" ? rand(-140, 140) : kind === "arc" ? 24 + k * 10 : rand(-24, 24);
        const dy = kind === "confetti" ? rand(-200, -60) : rand(-90, -50);
        const dur = kind === "confetti" ? rand(900, 1400) : kind === "z" ? 1800 : 1100;
        const anim = el.animate(
          [
            { transform: `translate3d(${cx}px, ${cy}px, 0) scale(1)`, opacity: 1 },
            {
              transform: `translate3d(${cx + dx}px, ${cy + dy + (kind === "confetti" ? 160 : 0)}px, 0) rotate(${kind === "confetti" ? rand(-180, 180) : 0}deg)`,
              opacity: 0,
            },
          ],
          { duration: dur, delay: k * (kind === "arc" ? 120 : 20), easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "both" },
        );
        anim.onfinish = () => {
          busyRef.current[i] = false;
          el.className = "sig-p";
        };
      }
    },
    [s],
  );

  // ---------- speech bubble queue (current + two) ----------
  const showNext = useCallback(() => {
    const next = s.queue.shift();
    if (!next) {
      s.showing = false;
      return;
    }
    s.showing = true;
    const dur = 3200 + Math.max(0, next.text.length - 40) * 40;
    const cx = s.x + s.w / 2;
    const align = cx > s.vw - 130 ? "right" : cx < 130 ? "left" : "center";
    setBubble({ id: ++s.idSeq, text: next.text, live: next.live, align });
    if (next.live) setLive(next.text);
    s.talkUntil = performance.now() + Math.min(dur, 1600);
    window.clearTimeout(s.bubbleTimer);
    s.bubbleTimer = window.setTimeout(() => {
      setBubble(null);
      window.setTimeout(showNext, 220);
    }, dur);
  }, [s]);

  // Visitor-triggered replies interrupt whatever is showing; comments and follow-ups queue (max two).
  const say = useCallback(
    (text: string, isLive = true, interrupt = isLive) => {
      if (getSig().hidden) return;
      if (interrupt && s.showing) {
        s.queue = [{ text, live: isLive }];
        window.clearTimeout(s.bubbleTimer);
        setBubble(null);
        showNext();
      } else {
        if (s.queue.length >= 2) s.queue.shift();
        s.queue.push({ text, live: isLive });
        if (!s.showing) showNext();
      }
      wake();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s, showNext],
  );

  const setExpr = (e: Expr, ms: number) => {
    s.exprOverride = e;
    s.exprUntil = performance.now() + ms;
  };

  // ---------- rendering ----------
  const render = (t: number) => {
    const wrap = wrapRef.current;
    const art = artRef.current;
    const flip = flipRef.current;
    if (!wrap || !art || !flip) return;
    if (s.x !== sigPos.x || s.y !== sigPos.y) {
      wrap.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      sigPos.x = s.x;
      sigPos.y = s.y;
    }
    if (s.face !== s.faceApplied) {
      flip.style.transform = `scaleX(${s.face})`;
      s.faceApplied = s.face;
    }
    let expr: Expr = "idle";
    if (s.mode === "sleep") expr = "sleep";
    else if (s.exprOverride && t < s.exprUntil) expr = s.exprOverride;
    else if (t < s.blinkUntil) expr = "blink";
    else if (t < s.talkUntil) expr = "talk";
    let eyeDx = 0;
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const pdx = s.pointerX - cx;
    if (Math.abs(pdx) < 300 && Math.abs(s.pointerY - cy) < 300 && Math.abs(pdx) > 16) eyeDx = (pdx > 0 ? 1 : -1) * s.face;
    const mouth = Math.floor(t / 62.5) % 2 === 0;
    const legs: Legs = s.mode === "drag" ? "dangle" : s.mode === "walk" || s.mode === "play" || s.mode === "dance" ? "walk" : "stand";
    const fault = t < s.faultUntil;
    const outfit = getSig().outfit;
    const key = `${expr}${eyeDx}${expr === "talk" ? +mouth : 0}${legs}${legs === "walk" ? s.legFrame : 0}${outfit}${+fault}`;
    if (key !== s.renderKey) {
      s.renderKey = key;
      art.innerHTML = toSvg(compose(expr, eyeDx, mouth, legs, s.legFrame, outfit), fault, expr === "sleep");
    }
  };

  const landSquash = () => {
    if (s.reduced) return;
    squashRef.current?.animate([{ transform: "scaleY(0.88)" }, { transform: "scaleY(1)" }], {
      duration: 200,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    });
  };

  const hop = (px = 14) => {
    if (s.reduced) return;
    hopRef.current?.animate(
      [{ transform: "translateY(0)" }, { transform: `translateY(-${px}px)` }, { transform: "translateY(0)" }],
      { duration: 360, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  };

  const overPrimary = () => {
    const r = { l: s.x, r: s.x + s.w, t: s.y, b: s.y + s.h };
    return Array.from(document.querySelectorAll(".btn-primary")).some((el) => {
      const b = el.getBoundingClientRect();
      return b.right > r.l && b.left < r.r && b.bottom > r.t && b.top < r.b;
    });
  };

  const toPause = (t: number) => {
    s.mode = s.reduced ? "still" : "pause";
    s.vx = s.vy = 0;
    s.until = t + (overPrimary() ? Math.min(2000, rand(1500, 4000)) : rand(1500, 4000));
    if (Math.random() < 0.3) {
      setExpr("happy", 600);
      hop(6);
    }
  };

  // ---------- the frame loop (shared rAF) ----------
  const frame = (dt: number, t: number) => {
    const d = Math.min(dt, 50) / 1000;
    const k = dt / 16.67;
    if (t > s.blinkAt) {
      s.blinkUntil = t + 120;
      s.blinkAt = t + rand(3000, 6000);
    }
    switch (s.mode) {
      case "pause":
        if (t > s.until) {
          s.targetX = rand(8, Math.max(8, s.vw - s.w - 8));
          s.mode = "walk";
        }
        break;
      case "walk": {
        const dir = s.targetX > s.x ? 1 : -1;
        s.face = dir;
        s.x += dir * 60 * d;
        s.legT += dt;
        if (s.legT > 166) {
          s.legT = 0;
          s.legFrame ^= 1;
        }
        if ((dir > 0 && s.x >= s.targetX) || (dir < 0 && s.x <= s.targetX)) toPause(t);
        break;
      }
      case "fly": {
        s.vy += 2400 * d;
        s.x += s.vx * d;
        s.y += s.vy * d;
        if (s.x < 0) {
          s.x = 0;
          s.vx = -s.vx * 0.5;
        } else if (s.x > s.vw - s.w) {
          s.x = s.vw - s.w;
          s.vx = -s.vx * 0.5;
        }
        if (s.y < 0) {
          s.y = 0;
          s.vy = Math.abs(s.vy) * 0.5;
        }
        if (s.y >= s.floor) {
          s.y = s.floor;
          if (s.vy > 160) {
            s.vy = -s.vy * 0.42;
            s.bounces++;
            landSquash();
          } else {
            s.vy = 0;
            s.vx *= Math.pow(0.86, k);
            if (Math.abs(s.vx) < 8) {
              if (s.bounces >= 3) {
                setExpr("dizzy", 1500);
                say("Whoa!");
                s.until = t + 1500;
                s.mode = "pause";
              } else toPause(t);
              s.bounces = 0;
            }
          }
        }
        break;
      }
      case "play": {
        if (t > s.playUntil) {
          s.mode = "fly";
          say("Good game.");
          break;
        }
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        const dx = cx - s.pointerX;
        const dy = cy - s.pointerY;
        const dist = Math.hypot(dx, dy);
        if (dist < 180 && dist > 1) {
          s.vx += (dx / dist) * 2600 * d;
          s.vy += (dy / dist) * 2600 * d;
        } else {
          s.vx *= Math.pow(0.96, k);
          s.vy *= Math.pow(0.96, k);
        }
        const sp = Math.hypot(s.vx, s.vy);
        if (sp > 340) {
          s.vx = (s.vx / sp) * 340;
          s.vy = (s.vy / sp) * 340;
        }
        s.x += s.vx * d;
        s.y += s.vy * d;
        if (s.x < 0 || s.x > s.vw - s.w) {
          s.vx = -s.vx;
          s.x = Math.max(0, Math.min(s.vw - s.w, s.x));
        }
        if (s.y < 70 || s.y > s.floor) {
          s.vy = -s.vy;
          s.y = Math.max(70, Math.min(s.floor, s.y));
        }
        if (Math.abs(s.vx) > 4) s.face = s.vx > 0 ? 1 : -1;
        s.legT += dt;
        if (s.legT > 120) {
          s.legT = 0;
          s.legFrame ^= 1;
        }
        break;
      }
      case "dance": {
        if (t > s.danceUntil) {
          s.x = s.danceX;
          toPause(t);
          break;
        }
        const ph = (t % 1000) / 1000;
        s.x = s.danceX + Math.sin(ph * Math.PI * 2) * 22;
        s.face = Math.cos(ph * Math.PI * 2) > 0 ? 1 : -1;
        s.y = s.floor - Math.abs(Math.sin(ph * Math.PI * 4)) * 14;
        setExpr("happy", 200);
        break;
      }
    }
    if ((s.mode === "pause" || s.mode === "walk" || s.mode === "still") && t - s.lastInput > 30000) {
      goSleep();
      return;
    }
    render(t);
  };
  const frameRef = useRef(frame);
  frameRef.current = frame;

  const startLoop = () => {
    if (s.unsub || getSig().hidden) return;
    s.unsub = subscribeRaf((dt, t) => frameRef.current(dt, t));
  };
  const stopLoop = () => {
    s.unsub?.();
    s.unsub = null;
  };

  function goSleep() {
    s.mode = "sleep";
    s.x = s.vw - s.w - 8;
    s.y = s.floor;
    render(performance.now());
    stopLoop();
    window.clearInterval(s.zTimer);
    s.zTimer = window.setInterval(() => spawn("z", 1), 1400);
  }

  function wake() {
    s.lastInput = performance.now();
    if (s.mode === "sleep") {
      window.clearInterval(s.zTimer);
      s.mode = s.reduced ? "still" : "pause";
      s.until = performance.now() + 800;
      s.renderKey = "";
    }
    if (s.mode !== "off") startLoop();
  }

  const startPlay = () => {
    s.catches = 0;
    s.playUntil = performance.now() + 15000;
    s.mode = s.reduced ? "still" : "play";
    if (s.reduced) s.playUntil = performance.now() + 15000;
    s.vx = rand(-200, 200);
    s.vy = -200;
    say("Catch me! 15 seconds.");
  };

  // ---------- commands (keyboard words, panel chips, footer) ----------
  const run = useCallback(
    (word: string) => {
      const t = performance.now();
      wake();
      if (CHAPTER_WORDS[word]) {
        scrollToChapter(CHAPTER_WORDS[word]);
        say("Here we are.");
        return;
      }
      const outfit = (o: Outfit, line?: string) => {
        setSig({ outfit: o });
        s.renderKey = "";
        render(t);
        if (line) say(line);
      };
      switch (word) {
        case "hello":
          setExpr("happy", 1400);
          hop();
          say("Hello!");
          break;
        case "dance":
          if (s.reduced) setExpr("happy", 4000);
          else {
            s.danceX = Math.max(30, Math.min(s.vw - s.w - 30, s.x));
            s.danceUntil = t + 4000;
            s.mode = "dance";
          }
          break;
        case "party":
          setExpr("happy", 1500);
          spawn("confetti", 30);
          break;
        case "sleep":
          goSleep();
          break;
        case "play":
          startPlay();
          break;
        case "radio":
          outfit("radio", "On air, 90.8 MHz!");
          spawn("arc", 3);
          break;
        case "grad":
          outfit("grad", "Class of 2026.");
          break;
        case "lab":
          outfit("lab", "Lab mode.");
          break;
        case "normal":
          outfit("normal");
          break;
        case "fault":
          s.faultUntil = t + 2500;
          say("Fault detected. Just kidding.");
          break;
        case "train":
          say("Epoch 1: learning.");
          say("Epoch 2: still learning.", true, false);
          say("Epoch 3: nope, still learning.", true, false);
          break;
        case "cv": {
          say("Press the CV button. I’ll wait.");
          const btn = document.querySelector('[data-testid="nav-cv-button"]');
          btn?.classList.remove("pulse-ring");
          void (btn as HTMLElement | null)?.offsetWidth;
          btn?.classList.add("pulse-ring");
          window.setTimeout(() => btn?.classList.remove("pulse-ring"), 950);
          break;
        }
        case "jaideep":
          setExpr("happy", 1500);
          spawn("heart", 5);
          say("That’s my creator!");
          break;
        case "bye":
          setExpr("happy", 600);
          hop();
          window.setTimeout(() => run("hide"), 500);
          break;
        case "help":
          setSig({ panelOpen: true });
          break;
        case "hide":
          stopLoop();
          s.mode = "off";
          s.queue = [];
          setBubble(null);
          setSig({ hidden: true });
          break;
        case "call":
          setSig({ hidden: false });
          window.setTimeout(() => arrive(false), 50);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s, say, spawn],
  );

  function arrive(greet: boolean) {
    if (getSig().hidden) return;
    s.x = s.vw - s.w - 24;
    s.y = s.floor;
    s.face = -1;
    s.lastInput = performance.now();
    s.mode = s.reduced ? "still" : "pause";
    s.until = performance.now() + 2500;
    s.renderKey = "";
    render(performance.now());
    if (!s.reduced) {
      hopRef.current?.animate([{ transform: `translateY(${s.h + 40}px)` }, { transform: "translateY(0)" }], {
        duration: 500,
        easing: "cubic-bezier(0.23, 1, 0.32, 1)",
      });
    }
    startLoop();
    if (greet) {
      say("Hi, I’m Sig. Jaideep’s sidekick.", false);
      if (!getSig().introSeen) {
        window.setTimeout(() => {
          say("Psst. Pick me up. Drag me anywhere.", true, false);
          setSig({ introSeen: true });
        }, 6000);
      }
    } else say("I’m back!");
  }

  // ---------- setup ----------
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    s.phone = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
    s.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    s.px = s.phone ? 3 : 4;
    s.w = COLS * s.px;
    s.h = ROWS * s.px;
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none";
    layer.appendChild(probe);
    const measure = () => {
      s.vw = window.innerWidth;
      s.vh = window.innerHeight;
      s.floor = s.vh - probe.offsetHeight - 8 - s.h;
      if (s.mode !== "off" && s.mode !== "drag" && s.mode !== "play") {
        s.y = Math.min(s.y, s.floor);
        if (s.mode !== "fly") s.y = s.floor;
        s.x = Math.min(s.x, s.vw - s.w);
        render(performance.now());
      }
    };
    measure();
    window.addEventListener("resize", measure);

    // Pool of 40 particle nodes.
    const pool: HTMLSpanElement[] = [];
    for (let i = 0; i < 40; i++) {
      const el = document.createElement("span");
      el.className = "sig-p";
      el.setAttribute("aria-hidden", "true");
      layer.appendChild(el);
      pool.push(el);
    }
    poolRef.current = pool;
    busyRef.current = pool.map(() => false);

    const t0 = window.setTimeout(() => arrive(true), 2500);

    const onMove = (e: PointerEvent) => {
      s.pointerX = e.clientX;
      s.pointerY = e.clientY;
      if (e.pointerType === "mouse" || s.mode === "sleep") wake();
      else s.lastInput = performance.now();
    };
    const onDownDoc = (e: PointerEvent) => {
      s.lastInput = performance.now();
      const target = e.target as Element | null;
      const canvas = target?.closest('[data-testid="gate-canvas"], [data-testid="swarm-canvas"]');
      if (!canvas) return;
      if (canvas.getAttribute("data-testid") === "gate-canvas") s.drawing = true;
      const dist = Math.hypot(e.clientX - (s.x + s.w / 2), e.clientY - (s.y + s.h / 2));
      if (dist < 160 && s.mode !== "off" && s.mode !== "sleep") {
        const dir = e.clientX > s.x + s.w / 2 ? -1 : 1;
        if (s.reduced) {
          s.x = Math.max(0, Math.min(s.vw - s.w, s.x + dir * 120));
          render(performance.now());
        } else {
          s.mode = "fly";
          s.vx = dir * 280;
          s.vy = -520;
          startLoop();
        }
      }
    };
    const onUpDoc = () => {
      s.drawing = false;
    };
    let buf = "";
    let bufTimer = 0;
    const onKey = (e: KeyboardEvent) => {
      s.lastInput = performance.now();
      if (s.mode === "sleep") wake();
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
      const tgt = e.target as Element | null;
      if (tgt?.closest("input, textarea, select, button, [contenteditable='true'], canvas")) return;
      const ch = e.key.toLowerCase();
      if (ch < "a" || ch > "z") return;
      buf = (buf + ch).slice(-12);
      window.clearTimeout(bufTimer);
      bufTimer = window.setTimeout(() => (buf = ""), 2000);
      const hit = WORDS_BY_LEN.find((w) => buf.endsWith(w));
      if (hit) {
        buf = "";
        runRef.current(hit);
      }
    };
    const onCommand = (e: Event) => runRef.current((e as CustomEvent<string>).detail);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerdown", onDownDoc, { capture: true, passive: true });
    window.addEventListener("pointerup", onUpDoc, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener("sig:command", onCommand);

    // Chapter comments: first entry per visit, throttled, never while busy.
    const seen = new Set<string>(["top"]);
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const key = en.target.id || en.target.getAttribute("data-testid") || "";
          if (seen.has(key)) continue;
          const now = performance.now();
          const toast = document.querySelector("[data-sonner-toast]");
          if (now - s.lastComment < 8000 || s.dragging || s.drawing || toast || s.mode === "off" || s.mode === "sleep") continue;
          const text = COMMENTS.find((c) => c[0] === key)?.[1];
          if (!text) continue;
          seen.add(key);
          s.lastComment = now;
          say(s.phone ? text.split(/(?<=[.!?])\s/)[0] : text, false);
        }
      },
      { threshold: 0.35 },
    );
    const observe = () =>
      COMMENTS.forEach(([key]) => {
        const el = document.getElementById(key) ?? document.querySelector(`[data-testid="${key}"]`);
        if (el) io.observe(el);
      });
    observe();
    window.addEventListener("chapters-ready", observe);

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(s.zTimer);
      window.clearTimeout(s.bubbleTimer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerdown", onDownDoc, { capture: true });
      window.removeEventListener("pointerup", onUpDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("sig:command", onCommand);
      window.removeEventListener("chapters-ready", observe);
      io.disconnect();
      stopLoop();
      pool.forEach((el) => el.remove());
      probe.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runRef = useRef(run);
  runRef.current = run;

  // ---------- pointer on the sprite ----------
  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    wake();
    const now = performance.now();
    if (s.mode === "play") {
      s.catches++;
      say(`Caught ${s.catches}`);
      s.vx = rand(-340, 340);
      s.vy = rand(-340, -120);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    s.dragging = true;
    s.moved = false;
    s.downAt = now;
    s.offX = e.clientX - s.x;
    s.offY = e.clientY - s.y;
    s.si = 0;
    s.sx.fill(e.clientX);
    s.sy.fill(e.clientY);
    s.st.fill(now);
    s.mode = "drag";
    window.clearTimeout(s.petTimer);
    s.petTimer = window.setTimeout(() => {
      if (s.dragging && !s.moved) {
        setExpr("happy", 1500);
        spawn("heart", 4);
      }
    }, 600);
    render(now);
  };

  const onMoveSprite = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!s.dragging) return;
    const nx = e.clientX - s.offX;
    const ny = e.clientY - s.offY;
    if (Math.hypot(e.clientX - (s.downAt ? s.sx[0] : e.clientX), 0) > 4 || Math.abs(nx - s.x) + Math.abs(ny - s.y) > 4) s.moved = true;
    s.x = Math.max(0, Math.min(s.vw - s.w, nx));
    s.y = Math.max(0, Math.min(s.floor, ny));
    const i = s.si % 8;
    s.sx[i] = e.clientX;
    s.sy[i] = e.clientY;
    s.st[i] = performance.now();
    s.si++;
    render(performance.now());
  };

  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!s.dragging) return;
    s.dragging = false;
    window.clearTimeout(s.petTimer);
    const now = performance.now();
    if (!s.moved) {
      s.mode = s.reduced ? "still" : "pause";
      s.until = now + 1500;
      if (now - s.downAt < 400) onTap(now);
      return;
    }
    // Velocity from the last 80ms of samples.
    let ox = e.clientX;
    let oy = e.clientY;
    let ot = now;
    for (let j = 0; j < 8; j++) {
      if (now - s.st[j] <= 80 && s.st[j] < ot) {
        ot = s.st[j];
        ox = s.sx[j];
        oy = s.sy[j];
      }
    }
    const dtS = Math.max(0.016, (now - ot) / 1000);
    let vx = (e.clientX - ox) / dtS;
    let vy = (e.clientY - oy) / dtS;
    const sp = Math.hypot(vx, vy);
    if (sp > 2600) {
      vx = (vx / sp) * 2600;
      vy = (vy / sp) * 2600;
    }
    if (s.reduced) {
      s.mode = "still";
    } else {
      s.vx = vx;
      s.vy = vy;
      s.bounces = 0;
      s.mode = "fly";
    }
    render(now);
  };

  function onTap(now: number) {
    setTools(true);
    window.setTimeout(() => setTools(false), 3000);
    if (now - s.lastTapAt < 320) {
      s.lastTapAt = 0;
      startPlay();
      return;
    }
    s.tapCount = now - s.lastTapAt < 1500 ? s.tapCount + 1 : 1;
    s.lastTapAt = now;
    if (s.tapCount >= 10) {
      say(SILLY[s.sillyIdx % SILLY.length]);
      s.sillyIdx++;
    } else say(CHEER[(Math.random() * CHEER.length) | 0]);
  }

  return (
    <>
      <div ref={layerRef} className={`sig-layer ${sig.outfit === "radio" ? "sig-radio" : ""}`} data-hidden={sig.hidden} aria-hidden={sig.hidden ? "true" : undefined}>
        <div ref={wrapRef} className="sig-wrap" data-tools={tools} data-testid="sig">
          {bubble && (
            <div
              key={bubble.id}
              className={`sig-bubble sig-bubble-${bubble.align}`}
              aria-hidden="true"
              data-testid="sig-bubble"
            >
              {bubble.text}
            </div>
          )}
          <div className="sig-tools">
            <button type="button" className="sig-tool" aria-label="Hide Sig" onClick={() => run("hide")} data-testid="sig-hide-button">
              ×
            </button>
            <button type="button" className="sig-tool" aria-label="Sig’s secrets" onClick={() => setSig({ panelOpen: true })} data-testid="sig-secrets-button">
              ?
            </button>
          </div>
          <div ref={hopRef}>
            <div ref={squashRef} className="sig-squash">
              <div ref={flipRef}>
                <div
                  ref={artRef}
                  className="sig-art"
                  style={{ width: `calc(${COLS} * var(--sig-px))`, height: `calc(${ROWS} * var(--sig-px))` }}
                  onPointerDown={onDown}
                  onPointerMove={onMoveSprite}
                  onPointerUp={onUp}
                  onPointerCancel={onUp}
                  aria-hidden="true"
                  data-testid="sig-sprite"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="sr-only" aria-live="polite" data-testid="sig-live">
        {live}
      </div>
      <SigPanel onWord={(w) => run(w)} />
    </>
  );
}
