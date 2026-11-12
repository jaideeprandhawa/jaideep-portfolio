import { useState } from "react";
import type { CSSProperties } from "react";
import { useMediaQuery } from "@/lib/hooks";
import { Ticker } from "./Research";
import { Segmented } from "./Controls";
import { observeReveal } from "@/lib/useReveal";

const COURSE_GROUPS = [
  {
    label: "Core computer science",
    items: [
      "Data Structures",
      "Algorithms",
      "Database Management Systems",
      "Operating Systems",
      "Computer Networks",
      "Computer Architecture",
      "Object-Oriented Programming",
      "Theory of Computation",
    ],
  },
  { label: "AI and data", items: ["Machine Learning", "Artificial Intelligence", "Natural Language Processing", "Soft Computing"] },
  { label: "Security", items: ["Cyber Security"] },
  { label: "Mathematics", items: ["Engineering Mathematics", "Discrete Mathematics"] },
  { label: "Project", items: ["Seminar and Technical Report"] },
];

const CERTS = [
  {
    provider: "NPTEL",
    items: [
      "Introduction to Industry 4.0 and Industrial Internet of Things",
      "Privacy and Security in Online Social Media",
      "Data Analytics Using Python",
      "Social Networks",
      "Organizational Behaviour",
      "Introduction to Large Language Models",
      "Responsible & Safe AI Systems",
      "Affective Computing",
    ],
  },
  { provider: "Infosys Springboard", items: ["C Programming", "Python Programming"] },
];

const WORKSHOPS = [
  { date: "July 2026", title: "NPTEL Star Felicitation Workshop", org: "IIT Roorkee" },
  { date: "April 2025", title: "IP Blueprint Workshop", org: "IPMCC GNDEC and PSCST" },
  { date: "March 2024", title: "Git and Linux Workshop", org: "Causmic Club, GNDEC. Second position" },
  { date: "February 2024", title: "IDE Bootcamp", org: "AICTE and the Ministry of Education, CIMP Patna" },
];

const COUNT = {
  coursework: COURSE_GROUPS.reduce((n, g) => n + g.items.length, 0),
  certifications: CERTS.reduce((n, g) => n + g.items.length, 0),
  workshops: WORKSHOPS.length,
};
const pad = (n: number) => String(n).padStart(2, "0");

function ColHead({ title, count }: { title: string; count: number }) {
  return (
    <h4 className="text-h3 flex items-baseline gap-3">
      {title}
      <span className="mono text-signal">{pad(count)}</span>
    </h4>
  );
}

function Coursework() {
  let k = 0;
  return (
    <div data-testid="education-coursework">
      <ColHead title="Coursework" count={COUNT.coursework} />
      {COURSE_GROUPS.map((g) => (
        <div key={g.label} className="mt-6">
          <p className="mono text-muted-dark">{g.label}</p>
          <ul className="mt-3 flex flex-wrap gap-2" data-reveal ref={(el) => observeReveal(el)}>
            {g.items.map((c) => (
              <li key={c} className="edu-chip text-small" style={{ "--ci": k++ } as CSSProperties}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Certifications() {
  return (
    <div data-testid="education-certifications">
      <ColHead title="Certifications" count={COUNT.certifications} />
      {CERTS.map((g) => (
        <div key={g.provider} className="mt-6">
          <p className="mono text-muted-dark">
            {g.provider} · {pad(g.items.length)}
          </p>
          <ul className="edu-rows mt-2">
            {g.items.map((c) => (
              <li key={c} className="text-small">
                {c}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Workshops() {
  return (
    <div data-testid="education-workshops">
      <ColHead title="Workshops" count={COUNT.workshops} />
      <ol className="edu-timeline mt-6">
        {WORKSHOPS.map((w) => (
          <li key={w.title} className="edu-tl-item">
            <span className="edu-tl-node" aria-hidden="true" />
            <p className="mono text-muted-dark">{w.date}</p>
            <p className="text-body font-semibold">{w.title}</p>
            <p className="text-small text-muted-dark">{w.org}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

const TABS = [
  { id: "coursework", name: "Coursework" },
  { id: "certifications", name: "Certifications" },
  { id: "workshops", name: "Workshops" },
] as const;

/** Education: header row with CGPA, three columns on desktop, a segmented control on phones. */
export default function Education() {
  const desktop = useMediaQuery("(min-width: 860px)");
  const [tab, setTab] = useState<string>("coursework");
  const panels = { coursework: <Coursework />, certifications: <Certifications />, workshops: <Workshops /> };

  return (
    <div className="mt-[clamp(64px,8vw,128px)]" data-testid="experience-education">
      <div className="flex flex-col gap-8 min-[860px]:flex-row min-[860px]:items-end min-[860px]:justify-between">
        <div data-reveal>
          <h3 className="text-h3">Education</h3>
          <p className="text-body mt-4">Guru Nanak Dev Engineering College, Ludhiana</p>
          <p className="text-body mt-1">
            B.Tech in Computer Science and Engineering <span className="mono text-muted-dark">2022 to 2026</span>
          </p>
        </div>
        <div data-reveal data-testid="education-cgpa">
          <p className="flex items-baseline gap-2">
            <Ticker value={9.33} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} testid="education-cgpa-figure" />
            <span className="text-h3 text-muted-dark">/10</span>
          </p>
          <p className="mono mt-2 text-muted-dark">CGPA</p>
        </div>
      </div>

      {desktop ? (
        <div className="grid12 mt-16 gap-y-12">
          <div className="col-span-4">{panels.coursework}</div>
          <div className="col-span-4">{panels.certifications}</div>
          <div className="col-span-4">{panels.workshops}</div>
        </div>
      ) : (
        <div className="mt-10">
          <div className="max-w-full overflow-x-auto">
            <Segmented
              group="edu"
              label="Education details"
              size="s"
              value={tab}
              onChange={setTab}
              options={TABS.map((t) => ({
                id: t.id,
                testid: `education-tab-${t.id}`,
                label: (
                  <>
                    {t.name} <span className="mono">{pad(COUNT[t.id])}</span>
                  </>
                ),
              }))}
            />
          </div>
          <div key={tab} className="edu-panel mt-8">
            {panels[tab as keyof typeof panels]}
          </div>
        </div>
      )}
    </div>
  );
}
