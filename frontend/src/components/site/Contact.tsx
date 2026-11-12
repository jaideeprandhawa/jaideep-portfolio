import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { toast } from "sonner";
import { m, useScroll, useTransform } from "motion/react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { subscribeRaf } from "@/lib/raf";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/hooks";
import { ChapterNum } from "./Instrument";
import { FINE_POINTER } from "./Magnetic";
import { GhostButton, GitHubMark, LinkedInMark, PrimaryButton } from "./Controls";
import { setSig, sigCommand, useSig } from "./sig/store";

const EMAIL = "jaideeprandhawa220@gmail.com";
const MAILTO_HREF =
  "mailto:jaideeprandhawa220@gmail.com?subject=Hello%20from%20your%20portfolio&body=Hello%20Jaideep%2C%0A%0A";
const GITHUB_URL = "https://github.com/jaideeprandhawa";
const LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL as string | undefined;

export default function Contact() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const fine = useMediaQuery(FINE_POINTER);
  const reduced = usePrefersReducedMotion();
  const [copied, setCopied] = useState(false);
  const sig = useSig();
  const { scrollYProgress } = useScroll({ target: footerRef, offset: ["start end", "end end"] });
  const clip = useTransform(scrollYProgress, (p) => `inset(${(1 - p) * 100}% 0 0 0)`);

  // Signal glow drifts ±40px with the pointer (transform only, lerped) while the chapter is on screen.
  useEffect(() => {
    const sec = sectionRef.current;
    const glow = glowRef.current;
    if (!sec || !glow || !fine || reduced) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let unsub: (() => void) | null = null;
    const onMove = (e: PointerEvent) => {
      const r = sec.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 80;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 80;
    };
    const frame = () => {
      if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) return;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    };
    const io = new IntersectionObserver((entries) => {
      const vis = entries.some((e) => e.isIntersecting);
      if (vis && !unsub) unsub = subscribeRaf(frame);
      if (!vis && unsub) {
        unsub();
        unsub = null;
      }
    });
    io.observe(sec);
    sec.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      io.disconnect();
      sec.removeEventListener("pointermove", onMove);
      unsub?.();
    };
  }, [fine, reduced]);

  const copyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast("Email address copied");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, []);

  return (
    <>
      <section id="contact" ref={sectionRef} className="relative overflow-hidden" data-testid="contact-section">
        <div className="wrap relative py-[clamp(96px,12vw,200px)]">
          <p className="mono mb-6 text-muted-dark">
            <ChapterNum n="08" name="contact" />
          </p>
          <h2 className="text-h2" data-reveal data-testid="contact-title">
            Let’s talk research.
          </h2>
          <p className="text-body mt-8 max-w-[60ch]" data-reveal style={{ "--i": 1 } as CSSProperties}>
            For collaborations, research positions or questions about any of the work above, write to me.
          </p>
          <div className="relative mt-14" data-reveal style={{ "--i": 2 } as CSSProperties}>
            <div ref={glowRef} className="glow left-[-160px] top-[-320px]" aria-hidden="true" />
            <a className="email-link text-h3 relative" href={`mailto:${EMAIL}`} aria-label={EMAIL} data-testid="contact-email-link">
              {Array.from(EMAIL).map((ch, i) => (
                <span key={i} className="email-ch" style={{ "--ci": i } as CSSProperties} aria-hidden="true">
                  {ch}
                </span>
              ))}
            </a>
          </div>
          <div className="relative mt-10 flex flex-wrap items-center gap-3" data-reveal style={{ "--i": 3 } as CSSProperties}>
            <PrimaryButton size="l" Icon={ArrowUpRight} magnetic href={MAILTO_HREF} data-testid="contact-email-button">
              Email me
            </PrimaryButton>
            <GhostButton size="m" className="copy-btn" onClick={copyAddress} testid="contact-copy-address-button">
              {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              <span aria-live="polite">{copied ? "Copied" : "Copy address"}</span>
            </GhostButton>
          </div>
          <div className="relative mt-3 flex flex-wrap items-center gap-3" data-reveal style={{ "--i": 4 } as CSSProperties}>
            <GhostButton size="m" href={GITHUB_URL} external className="ext-btn" testid="contact-github-link">
              <GitHubMark />
              GitHub
              <ArrowUpRight className="ext-arrow" size={16} aria-hidden="true" />
            </GhostButton>
            {LINKEDIN_URL && (
              <GhostButton size="m" href={LINKEDIN_URL} external className="ext-btn" testid="contact-linkedin-link">
                <LinkedInMark />
                LinkedIn
                <ArrowUpRight className="ext-arrow" size={16} aria-hidden="true" />
              </GhostButton>
            )}
          </div>
          <div className="relative mt-12 flex flex-wrap items-center gap-3" data-reveal style={{ "--i": 5 } as CSSProperties}>
            <p className="text-small text-muted-dark">Sig is my sidekick. Drag him around.</p>
            <GhostButton size="s" onClick={() => setSig({ panelOpen: true })} testid="footer-sig-secrets-button">
              Sig’s secrets
            </GhostButton>
            <GhostButton
              size="s"
              onClick={() => (sig.hidden ? sigCommand("call") : sigCommand("hide"))}
              testid="footer-sig-toggle-button"
            >
              {sig.hidden ? "Call Sig" : "Hide Sig"}
            </GhostButton>
          </div>
        </div>
      </section>
      <footer ref={footerRef} className="site-footer" data-testid="site-footer">
        <div className="wrap">
          <p className="text-display footer-wordmark relative" data-testid="footer-wordmark">
            <span className="footer-outline" aria-hidden="true">
              Jaideep Randhawa
            </span>
            <m.span className="footer-fill" style={reduced ? undefined : { clipPath: clip }}>
              Jaideep Randhawa
            </m.span>
          </p>
          <p className="mono footer-copy text-muted-dark">© 2026 Jaideep Randhawa</p>
        </div>
      </footer>
    </>
  );
}
