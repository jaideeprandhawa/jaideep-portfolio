import type { ReactNode } from "react";
import DecodeText from "./DecodeText";

/** Corner brackets: four 18px signal corners at 1.5px. */
export function Brackets() {
  return (
    <>
      <span className="bracket tl" aria-hidden="true" />
      <span className="bracket tr" aria-hidden="true" />
      <span className="bracket bl" aria-hidden="true" />
      <span className="bracket br" aria-hidden="true" />
    </>
  );
}

/** Instrument window — the only boxed element allowed: square, --ink-3, hairline outline, brackets, mono caption row. */
export function Instrument({
  children,
  caption,
  testid,
  label,
}: {
  children: ReactNode;
  caption: ReactNode;
  testid: string;
  label?: string;
}) {
  return (
    <figure className="instrument" data-testid={testid} aria-label={label}>
      <div className="instrument-body p-3">{children}</div>
      <figcaption className="mono instrument-caption">{caption}</figcaption>
      <Brackets />
    </figure>
  );
}

/** "02 / gate" chapter numeral, set in mono, decoded on view. */
export function ChapterNum({ n, name }: { n: string; name: string }) {
  return <DecodeText text={`${n} / ${name}`} className="mono chapter-num" testid={`chapter-num-${name}`} />;
}

/** Honesty caption under an illustration, Small mono. */
export function Caption({ text, testid, className }: { text: string; testid: string; className?: string }) {
  return (
    <p className={`mono caption ${className ?? ""}`}>
      <DecodeText text={text} testid={testid} />
    </p>
  );
}
