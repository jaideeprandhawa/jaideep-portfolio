import { Fragment } from "react";
import type { CSSProperties } from "react";
import { ChapterNum } from "./Instrument";
import { DriftSpan } from "./Magnetic";

// Separators ride inside the preceding item so a comma never starts a line.
const joinList = (items: string[], end = "") =>
  items.map((it, i) => (
    <Fragment key={it}>
      <DriftSpan>{it + (i < items.length - 2 ? "," : i === items.length - 1 ? end : "")}</DriftSpan>
      {i < items.length - 1 && (i === items.length - 2 ? " and " : " ")}
    </Fragment>
  ));

const GROUPS = [
  { name: "Languages:", proficient: ["Python", "SQL"], familiar: ["C", "C++"] },
  { name: "Libraries:", proficient: ["pandas", "NumPy", "scikit-learn"], familiar: ["PyTorch", "TensorFlow"] },
];
const TOOLS = ["Git", "Jupyter Notebook", "Google Colab", "FastAPI", "Google Cloud", "MS Excel"];

export default function About() {
  return (
    <section id="about" className="on-paper relative" data-testid="about-section">
      <div className="paper-dots" aria-hidden="true" />
      <div className="wrap relative py-[clamp(96px,12vw,200px)]">
        <div className="grid12 gap-y-16">
          <div className="col-span-12 min-[1024px]:col-span-6">
            <p className="mono mb-6">
              <ChapterNum n="07" name="about" />
            </p>
            <h2 className="text-h2" data-reveal data-testid="about-title">
              In the lab, and on the radio.
            </h2>
            <p className="text-body mt-8 max-w-[65ch]" data-reveal style={{ "--i": 1 } as CSSProperties}>
              My research sits where machine learning meets systems that have to work: bioenergy plants, power
              converters, drone swarms and a national health platform. I am interested in predictive and hybrid models
              built on large simulation and real-world datasets, in responsible and secure AI, and in getting models into
              a form that can be deployed.
            </p>
            <p className="mono mt-8 flex items-center gap-3" data-reveal data-testid="about-onair-tag">
              <span className="onair-dot" aria-hidden="true" />
              on air · 90.8 MHz
            </p>
            <p className="text-body mt-4 max-w-[65ch]" data-reveal style={{ "--i": 2 } as CSSProperties}>
              Outside the lab I convened the Data Science Club at GNDEC (2024 to 2025) and was a radio jockey on 90.8
              MHz, the campus community FM station (2023 to 2025), recording bytes, interviewing guests and hosting
              on-air shows. I taught English and Science to class 9 students at Usaari Evening School, run by the NGO
              Initiators of Change, and have volunteered with the National Service Scheme, Civil Defence and the Bureau
              of Indian Standards as a Manak Mitra. I also served on the Hostel Mess Committee (2022 to 2025) and the
              Sports Committee (2025).
            </p>
          </div>
          <div
            className="col-span-12 min-[1024px]:col-start-8 min-[1024px]:col-span-5 min-[1024px]:pt-24"
            data-reveal
            style={{ "--i": 2 } as CSSProperties}
            data-testid="about-skills"
          >
            {GROUPS.map((g, gi) => (
              <div key={g.name} className={gi > 0 ? "mt-12" : undefined}>
                <h3 className="mono">{g.name}</h3>
                <p className="mt-3">
                  <span className="mono">Proficient in </span>
                  <span className="text-h3 font-semibold">{joinList(g.proficient, ";")}</span>
                </p>
                <p className="text-body skill-familiar mt-2">
                  <span className="mono">familiar with </span>
                  {joinList(g.familiar, ".")}
                </p>
              </div>
            ))}
            <div className="mt-12">
              <h3 className="mono">Tools:</h3>
              <p className="text-body mt-3">
                {TOOLS.map((t, i) => (
                  <Fragment key={t}>
                    <DriftSpan>{t + (i < TOOLS.length - 1 ? "," : ".")}</DriftSpan>
                    {i < TOOLS.length - 1 && " "}
                  </Fragment>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
