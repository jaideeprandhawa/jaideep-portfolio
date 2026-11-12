import { useState } from "react";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { m } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { ArrowUpRight, Check } from "lucide-react";
import { MagneticAnchor } from "./Magnetic";

type Size = "l" | "m" | "s";
type IconCmp = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;

/** Round ink chip at the right end of a primary capsule; icon exits down while a copy enters from above. */
function Chip({ Icon, size, done, nudge }: { Icon: IconCmp; size: Size; done?: boolean; nudge?: boolean }) {
  const px = size === "l" ? 18 : 16;
  const Shown = done ? Check : Icon;
  return (
    <span className={`btn-chip ${nudge && !done ? "chip-nudge" : "chip-swap"}`} aria-hidden="true">
      <span className="chip-icon">
        <Shown size={px} strokeWidth={2.25} />
      </span>
      {!nudge && (
        <span className="chip-icon chip-icon-2">
          <Shown size={px} strokeWidth={2.25} />
        </span>
      )}
    </span>
  );
}

interface PrimaryProps extends Omit<HTMLMotionProps<"a">, "children"> {
  size: Size;
  Icon: IconCmp;
  children: ReactNode;
  magnetic?: boolean;
  /** Show a Check in the chip for this many ms after a click. */
  successMs?: number;
}

/** Primary capsule: signal gradient, glow layer, one-shot shine, icon chip. */
export function PrimaryButton({ size, Icon, children, magnetic, successMs, className, onClick, ...rest }: PrimaryProps) {
  const [done, setDone] = useState(false);
  const cls = `btn-primary btn-${size} ${className ?? ""}`;
  const nudge = Icon === ArrowUpRight;
  const handle: HTMLMotionProps<"a">["onClick"] = (e) => {
    onClick?.(e);
    if (successMs) {
      setDone(true);
      window.setTimeout(() => setDone(false), successMs);
    }
  };
  const inner = (
    <>
      <span className="btn-shine" aria-hidden="true" />
      <span className="btn-label">{children}</span>
      <Chip Icon={Icon} size={size} done={done} nudge={nudge} />
    </>
  );
  if (magnetic) {
    return (
      <MagneticAnchor className={cls} onClick={handle} {...rest}>
        {inner}
      </MagneticAnchor>
    );
  }
  return (
    <m.a className={cls} onClick={handle} {...rest}>
      {inner}
    </m.a>
  );
}

/** Ghost capsule (button or link). */
export function GhostButton({
  size,
  href,
  external,
  children,
  className,
  testid,
  ...rest
}: {
  size: Size;
  href?: string;
  external?: boolean;
  children: ReactNode;
  className?: string;
  testid?: string;
  onClick?: () => void;
  type?: "button";
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  style?: React.CSSProperties;
}) {
  const cls = `btn-ghost btn-${size} ${className ?? ""}`;
  if (href) {
    return (
      <a
        className={cls}
        href={href}
        data-testid={testid}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} data-testid={testid} {...rest}>
      {children}
    </button>
  );
}

/** In-text link: signal colour, underline draws in from the left on hover/focus; external ones get a small arrow. */
export function TextLink({ href, children, external, testid }: { href: string; children: ReactNode; external?: boolean; testid?: string }) {
  return (
    <a
      className="tlink"
      href={href}
      data-testid={testid}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="tlink-text">{children}</span>
      {external && <ArrowUpRight className="tlink-arrow" size="0.8em" aria-hidden="true" />}
    </a>
  );
}

export interface SegOption {
  id: string;
  label: ReactNode;
  testid?: string;
}

const SEG_SPRING = { type: "spring", duration: 0.35, bounce: 0 } as const;

/**
 * Segmented control: a glass capsule with one indicator (Motion layoutId) behind
 * the active option. Keyboard: arrow keys move the selection (radiogroup).
 */
export function Segmented({
  options,
  value,
  onChange,
  group,
  label,
  size = "m",
  testid,
}: {
  options: SegOption[];
  value: string;
  onChange: (id: string) => void;
  group: string;
  label: string;
  size?: "m" | "s";
  testid?: string;
}) {
  const idx = options.findIndex((o) => o.id === value);
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % options.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx + options.length - 1) % options.length;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].id);
    const btn = e.currentTarget.querySelectorAll<HTMLButtonElement>("[role='radio']")[next];
    btn?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={`seg seg-${size}`} onKeyDown={onKey} data-testid={testid}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className="seg-item"
            data-active={active}
            onClick={() => onChange(o.id)}
            data-testid={o.testid}
          >
            {active && <m.span layoutId={`${group}-ind`} className="seg-ind seg-ind-active" transition={SEG_SPRING} />}
            <span className="seg-label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export { SEG_SPRING };

/** Inline brand marks, 24px, currentColor. */
export function GitHubMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function LinkedInMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
