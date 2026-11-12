# Jaideep Randhawa – Personal Portfolio

Personal research portfolio showcasing machine learning research, publications, engineering internships, academic background, and interactive project demonstrations.

**Live Website:** [https://jaideeprandhawa.me](https://jaideeprandhawa.me)

---

## Technology Stack

- **Framework:** React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 & shadcn/ui
- **Motion & Utilities:** Motion, Lenis smooth scroll, Lucide icons, Sonner

## Portfolio Sections

- **Hero & CV:** Introduction, portrait viewfinder, and downloadable CV (`Jaideep_Randhawa_CV.pdf`).
- **Signature Gate:** Interactive client-side canvas demonstrating blank, area, and contour validation checks from the eSanjeevani signature pipeline.
- **Research & Projects:** Four project chapters covering eSanjeevani signature validation, hybrid ML for biogas production, real-time LLC converter fault detection, and deep reinforcement learning pursuit–evasion swarms.
- **Publications & Presentations:** Peer-reviewed journal articles, conference proceedings, and posters.
- **Recognition & Awards:** Academic honors, Best Student Award, and Best Paper Award.
- **Experience & Education:** Research internships (C-DAC Mohali, IIT Jammu, Khalis Foundation, IIIT Allahabad), B.Tech. CSE at GNDEC Ludhiana, coursework, certifications, and workshops.
- **About & Contact:** Research interests, technical skills, email, GitHub, and LinkedIn links.

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

Additional scripts (run inside `frontend/`):

```bash
npm run typecheck   # TypeScript check (tsc -b --noEmit)
npm run lint        # Oxlint check
npm run build       # Production build to frontend/dist/
```

## Deployment

This site is built as a static frontend and deployed automatically to **GitHub Pages** at `https://jaideeprandhawa.me` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on every push to `main`.
