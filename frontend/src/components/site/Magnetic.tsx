import { useEffect, useRef } from "react";
import type { ReactNode, PointerEvent as ReactPointerEvent } from "react";
import { animate, m, useMotionValue } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";

export const SPRING = { type: "spring", duration: 0.4, bounce: 0 } as const;
export const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/** Primary buttons drift up to `strength` px toward the pointer within `radius` px. Pointer fine only. */
export function MagneticAnchor({
  children,
  strength = 8,
  radius = 80,
  ...rest
}: HTMLMotionProps<"a"> & { children: ReactNode; strength?: number; radius?: number }) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!fine || reduced) return;
    let tx = 0;
    let ty = 0;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ex = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const ey = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      const d = Math.hypot(ex, ey);
      let nx = 0;
      let ny = 0;
      if (d < radius) {
        const ox = e.clientX - (r.left + r.width / 2);
        const oy = e.clientY - (r.top + r.height / 2);
        const len = Math.hypot(ox, oy) || 1;
        const pull = strength * (1 - d / radius);
        nx = (ox / len) * pull;
        ny = (oy / len) * pull;
      }
      if (Math.abs(nx - tx) > 0.25 || Math.abs(ny - ty) > 0.25) {
        tx = nx;
        ty = ny;
        animate(x, tx, SPRING);
        animate(y, ty, SPRING);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [fine, reduced, radius, strength, x, y]);

  return (
    <m.a ref={ref} style={{ x, y }} {...rest}>
      {children}
    </m.a>
  );
}

/** Hover drift toward the pointer (skills). Pointer fine only. */
export function DriftSpan({ children, className, strength = 6 }: { children: ReactNode; className?: string; strength?: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = usePrefersReducedMotion();
  const on = fine && !reduced;

  const onMove = (e: ReactPointerEvent<HTMLSpanElement>) => {
    if (!on) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    animate(x, nx * strength, SPRING);
    animate(y, ny * strength, SPRING);
  };
  const onLeave = () => {
    if (!on) return;
    animate(x, 0, SPRING);
    animate(y, 0, SPRING);
  };

  return (
    <m.span className={className} style={{ x, y, display: "inline-block" }} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </m.span>
  );
}
