import { signatureStroke } from "@/lib/gate/samples";
import { Caption } from "../Instrument";

const VB_W = 800;
const VB_H = 300;

// Reuse the Gate's stored signature sample as the illustration path.
const PTS = signatureStroke()[0];
const D = PTS.map((p, i) => `${i === 0 ? "M" : "L"}${(p.x * VB_W).toFixed(1)} ${(p.y * VB_H).toFixed(1)}`).join(" ");
const minY = Math.min(...PTS.map((p) => p.y));
const maxY = Math.max(...PTS.map((p) => p.y));
const minX = Math.min(...PTS.map((p) => p.x));
const maxX = Math.max(...PTS.map((p) => p.x));
const PAD = 0.03;
const BOX = {
  left: `${(minX - PAD) * 100}%`,
  right: `${(1 - maxX - PAD) * 100}%`,
  top: `${Math.max(0, minY - PAD * 2) * 100}%`,
  bottom: `${Math.max(0, 1 - maxY - PAD * 2) * 100}%`,
};

/** A line drawing that draws itself, then brackets snap around it. Illustration only. */
export default function SignatureDrawing() {
  return (
    <div data-testid="signature-illustration">
      <div className="sig-stage" data-reveal>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block h-full w-full overflow-visible" aria-hidden="true">
          <path className="sig-path" d={D} pathLength={1} />
        </svg>
        <span className="sig-bracket bracket tl" style={{ left: BOX.left, top: BOX.top }} aria-hidden="true" />
        <span className="sig-bracket bracket tr" style={{ right: BOX.right, top: BOX.top }} aria-hidden="true" />
        <span className="sig-bracket bracket bl" style={{ left: BOX.left, bottom: BOX.bottom }} aria-hidden="true" />
        <span className="sig-bracket bracket br" style={{ right: BOX.right, bottom: BOX.bottom }} aria-hidden="true" />
        <span className="sig-label mono text-signal" style={{ left: BOX.left, top: BOX.top }} data-testid="signature-region-label">
          region found, then classified
        </span>
      </div>
      <Caption text="Illustration of the localise-then-classify idea." testid="caption-signature" className="mt-8 text-muted-dark" />
    </div>
  );
}
