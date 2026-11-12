import { Fragment } from "react";

const WORDS = [
  "YOLOX",
  "EfficientNet-B0",
  "FastAPI",
  "PPO",
  "Random Forest",
  "PSIM",
  "Google Cloud",
  "scikit-learn",
  "PyTorch",
  "TensorFlow",
  "CEDAR",
  "BHSig",
  "eSanjeevani",
  "IEEE UPCON",
  "Biomass and Bioenergy",
];

function Run({ hidden }: { hidden?: boolean }) {
  return (
    <div className={`flex items-center ${hidden ? "marquee-dup" : ""}`} aria-hidden={hidden ? "true" : undefined}>
      {WORDS.map((w) => (
        <Fragment key={w}>
          <span className="marquee-word">{w}</span>
          <span className="marquee-square" aria-hidden="true" />
        </Fragment>
      ))}
    </div>
  );
}

/** Flat signal band, one line scrolling left, one loop in 45s; content duplicated for a seamless loop. */
export default function Marquee() {
  return (
    <div className="marquee" data-testid="marquee">
      <p className="sr-only">Tools and venues: {WORDS.join(", ")}.</p>
      <div className="marquee-track" aria-hidden="true">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
