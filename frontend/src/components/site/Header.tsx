import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { m } from "motion/react";
import { ArrowDownToLine, Menu, X } from "lucide-react";
import type { CSSProperties } from "react";
import { PrimaryButton, SEG_SPRING } from "./Controls";
import { useActiveChapter } from "@/lib/activeChapter";

const CV_PATH = "/Jaideep_Randhawa_CV.pdf";

const SECTIONS = [
  { id: "research", label: "Research" },
  { id: "publications", label: "Publications" },
  { id: "experience", label: "Experience" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

/** Glass capsule of links with one indicator that follows hover and returns to the chapter in view. */
function NavCapsule() {
  const active = useActiveChapter();
  const [hover, setHover] = useState<string | null>(null);
  const target = hover ?? (SECTIONS.some((s) => s.id === active) ? active : null);
  return (
    <nav className="nav-capsule" aria-label="Site sections" onPointerLeave={() => setHover(null)} data-testid="nav-capsule">
      {SECTIONS.map((s) => {
        const isActive = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="nav-item"
            data-active={isActive}
            aria-current={isActive ? "true" : undefined}
            onPointerEnter={() => setHover(s.id)}
            onFocus={() => setHover(s.id)}
            onBlur={() => setHover(null)}
            data-testid={`nav-${s.id}-link`}
          >
            {target === s.id && (
              <m.span
                layoutId="nav-ind"
                className={`seg-ind ${isActive ? "seg-ind-active" : ""}`}
                transition={SEG_SPRING}
                data-testid="nav-indicator"
              />
            )}
            <span className="seg-label">{s.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

export default function Header({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY > 8;
      setScrolled((prev) => (prev === s ? prev : s));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const change = (next: boolean) => {
    setOpen(next);
    document.documentElement.dataset.sheet = next ? "open" : "closed";
    onOpenChange?.(next);
  };

  return (
    <Dialog.Root open={open} onOpenChange={change}>
      <header className="site-header" data-scrolled={scrolled} data-testid="site-header">
        <div className="wrap header-inner">
          <a href="#top" className="wordmark" data-testid="nav-wordmark-link">
            <span className="wordmark-dot" aria-hidden="true" />
            Jaideep Randhawa
          </a>
          <NavCapsule />
          <div className="header-actions">
            <PrimaryButton
              size="s"
              Icon={ArrowDownToLine}
              href={CV_PATH}
              download="Jaideep_Randhawa_CV.pdf"
              aria-label="Download CV (PDF)"
              successMs={1200}
              className="nav-cv"
              data-testid="nav-cv-button"
            >
              CV
            </PrimaryButton>
            <Dialog.Trigger className="btn-ghost btn-m menu-btn" data-testid="menu-open-button" aria-label={open ? "Close menu" : "Open menu"}>
              {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
              Menu
            </Dialog.Trigger>
          </div>
        </div>
      </header>
      <Dialog.Portal>
        <Dialog.Backdrop className="menu-backdrop" />
        <Dialog.Popup className="menu-popup" data-lenis-prevent data-testid="menu-sheet">
          <div className="menu-top">
            <span className="wordmark">
              <span className="wordmark-dot" aria-hidden="true" />
              Jaideep Randhawa
            </span>
            <Dialog.Close className="btn-ghost btn-m" data-testid="menu-close-button" aria-label="Close menu">
              <X size={18} aria-hidden="true" />
              Close
            </Dialog.Close>
          </div>
          <nav className="menu-nav" aria-label="Site sections">
            {SECTIONS.map((s, i) => (
              <a
                key={s.id}
                className="menu-link"
                href={`#${s.id}`}
                style={{ "--i": i } as CSSProperties}
                data-testid={`sheet-${s.id}-link`}
                onClick={() => change(false)}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <PrimaryButton
            size="l"
            Icon={ArrowDownToLine}
            href={CV_PATH}
            download="Jaideep_Randhawa_CV.pdf"
            aria-label="Download CV (PDF)"
            successMs={1200}
            className="menu-cv"
            data-testid="sheet-cv-button"
          >
            Download CV
          </PrimaryButton>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
