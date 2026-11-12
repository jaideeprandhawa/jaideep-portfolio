import { useEffect } from "react";
import GateSection from "@/components/site/GateSection";
import Research from "@/components/site/Research";
import Publications from "@/components/site/Publications";
import Recognition from "@/components/site/Recognition";
import Experience from "@/components/site/Experience";
import About from "@/components/site/About";
import Contact from "@/components/site/Contact";
import { useReveal } from "@/lib/useReveal";

/**
 * Chapters 02–08 live in their own chunk so the hero (and its LCP portrait)
 * renders from a smaller first bundle. On mount: wire scroll reveals and tell
 * the chapter rail the sections now exist.
 */
export default function BelowFold() {
  useReveal();
  useEffect(() => {
    window.dispatchEvent(new Event("chapters-ready"));
  }, []);

  return (
    <>
      <GateSection />
      <Research />
      <Publications />
      <Recognition />
      <Experience />
      <About />
      <Contact />
    </>
  );
}
