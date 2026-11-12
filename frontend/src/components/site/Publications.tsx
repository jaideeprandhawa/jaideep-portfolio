import type { CSSProperties, ReactNode } from "react";
import { ChapterNum } from "./Instrument";
import { TextLink } from "./Controls";

interface Entry {
  year: string;
  title: string;
  venue: ReactNode;
  authors: ReactNode;
  status?: string;
  doi?: { href: string; label: string };
}

const J = <strong>J. Randhawa</strong>;

const PAPERS: Entry[] = [
  {
    year: "2026",
    title: "AI-enabled practitioner profile image validation for trustworthy registration in eSanjeevani.",
    venue: (
      <>
        <em>Computer Methods and Programs in Biomedicine</em>, full-length article, manuscript CMPB-D-26-08675.
      </>
    ),
    authors: (
      <>
        {J}, S. P. Sood, R. Kumar, D. Bisht, S. Singh, G. S. Kapoor, S. Mansotra, M. Bhatia, D. Rajkumari and S.
        Syed-Abdul.
      </>
    ),
    status: "Under review: with the editor as of 20 October 2026.",
  },
  {
    year: "2026",
    title: "Phase-Adaptive Hybrid Modeling for Biogas Prediction in Anaerobic Digestion Systems.",
    venue:
      "1st International Conference on Computing, Communication, and Artificial Intelligence (IC3AI), Dr. B. R. Ambedkar NIT Jalandhar, 2026.",
    authors: <>{J}, S. Vishwakarma and S. Rani.</>,
    status: "Accepted; to appear in IEEE Xplore.",
  },
  {
    year: "2026",
    title:
      "Machine Learning-honing of biogas production from heterogeneous sweet sorghum biomass pre-treated with sweet lemon-derived bioenzyme.",
    venue: (
      <>
        <em>Biomass and Bioenergy</em>, vol. 213, p. 109456, 2026.
      </>
    ),
    authors: <>Y. Aggarwal, U. G. Phutela, S. Rani, {J} and S. Vishwakarma.</>,
    doi: { href: "https://doi.org/10.1016/j.biombioe.2026.109456", label: "10.1016/j.biombioe.2026.109456" },
  },
  {
    year: "2025",
    title: "Real-Time Fault Detection of LLC Converter Using Machine Learning and Cloud Computing.",
    venue:
      "2025 IEEE 12th Uttar Pradesh Section International Conference on Electrical, Electronics and Computer Engineering (UPCON), Varanasi, pp. 1 to 6, 2025.",
    authors: <>V. Bhardwaj, {J} and A. K. Verma.</>,
    doi: { href: "https://doi.org/10.1109/UPCON66414.2025.11454115", label: "10.1109/UPCON66414.2025.11454115" },
  },
];

const PRESENTATIONS: Entry[] = [
  {
    year: "2025",
    title: "Comparative Analysis of Multi-Agent DRL Strategies for Autonomous UAV Swarm Operations in Defence.",
    venue: "Poster, 68th Annual IETE Convention (AIC-2025), 27 to 28 September 2025.",
    authors: <>{J}, S. Vishwakarma and S. Rani.</>,
    status: "Winner of Best Paper Award.",
  },
  {
    year: "2025",
    title: "AI-driven prediction of biogas production from sweet sorghum biomass using temperature-based models.",
    venue:
      "ICSSR national seminar “Artificial Intelligence for Sustainable Agriculture: Innovations, Challenges, and Strategies for Collaboration,” Ludhiana, March 2025.",
    authors: <>Y. Aggarwal, I. Saini, {J}, S. Vishwakarma, S. Singh, U. G. Phutela and S. Rani.</>,
  },
  {
    year: "2025",
    title: "Design and Development of EV Chargers and Role of AI/ML in Autonomous E-Vehicles.",
    venue: "Poster, RISE UP Program, IIT Jammu, 22 July 2025.",
    authors: <>{J} and A. K. Verma.</>,
  },
];

function Row({ e, id }: { e: Entry; id: string }) {
  return (
    <li className="pub-row" data-testid={`publication-${id}`}>
      <p className="mono pub-year">{e.year}</p>
      <div className="pub-body">
        <h4 className="text-h3">{e.title}</h4>
        <p className="mono mt-3">{e.venue}</p>
        <p className="text-small mt-3">{e.authors}</p>
        {e.status && <p className="text-small mt-1">{e.status}</p>}
        {e.doi && (
          <p className="text-small mt-1">
            DOI{" "}
            <TextLink href={e.doi.href} external testid={`publication-doi-${id}-link`}>
              {e.doi.label}
            </TextLink>
            .
          </p>
        )}
      </div>
    </li>
  );
}

function Group({ title, entries, prefix }: { title: string; entries: Entry[]; prefix: string }) {
  return (
    <div className="mt-12 first:mt-0">
      <h3 className="text-h3 flex items-baseline gap-4" data-reveal>
        {title}
        <span className="mono text-signal-deep">{String(entries.length).padStart(2, "0")}</span>
      </h3>
      <ul className="bib mt-4" data-reveal style={{ "--i": 1 } as CSSProperties}>
        {entries.map((e, i) => (
          <Row key={e.title} e={e} id={`${prefix}${i + 1}`} />
        ))}
      </ul>
    </div>
  );
}

export default function Publications() {
  return (
    <section id="publications" className="on-paper relative" data-testid="publications-section">
      <div className="paper-dots" aria-hidden="true" />
      <div className="wrap relative py-[clamp(96px,12vw,200px)]">
        <div className="grid12 gap-y-12">
          <div className="col-span-12 min-[860px]:col-span-4">
            <div className="pub-head">
              <p className="mono mb-6">
                <ChapterNum n="04" name="papers" />
              </p>
              <h2 className="text-h2" data-reveal data-testid="publications-title">
                Four papers, three presentations.
              </h2>
            </div>
          </div>
          <div className="col-span-12 min-[860px]:col-start-5 min-[860px]:col-span-8">
            <Group title="Papers" entries={PAPERS} prefix="" />
            <Group title="Presentations" entries={PRESENTATIONS} prefix="p" />
          </div>
        </div>
      </div>
    </section>
  );
}
