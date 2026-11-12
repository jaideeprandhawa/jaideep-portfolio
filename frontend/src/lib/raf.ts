type FrameFn = (dt: number, t: number) => void;

const subscribers = new Set<FrameFn>();
let rafId = 0;
let last = 0;
let running = false;

function loop(t: number) {
  const dt = last ? Math.min(64, t - last) : 16.7;
  last = t;
  subscribers.forEach((fn) => fn(dt, t));
  rafId = requestAnimationFrame(loop);
}

function start() {
  if (running) return;
  running = true;
  last = 0;
  rafId = requestAnimationFrame(loop);
}

function stop() {
  running = false;
  cancelAnimationFrame(rafId);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (subscribers.size > 0) start();
  });
}

/**
 * One shared requestAnimationFrame loop for the cursor, the spotlight and every
 * canvas visual. Pauses when the tab is hidden; stops itself with no subscribers.
 * Returns an unsubscribe function.
 */
export function subscribeRaf(fn: FrameFn): () => void {
  subscribers.add(fn);
  if (!document.hidden) start();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) stop();
  };
}
