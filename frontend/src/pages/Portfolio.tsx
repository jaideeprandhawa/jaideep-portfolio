import { Suspense, lazy } from "react";
import { LazyMotion, domMax } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import Chrome from "@/components/site/Chrome";
import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import Marquee from "@/components/site/Marquee";
import { useSmoothScroll } from "@/lib/useSmoothScroll";
import Sig from "@/components/site/sig/Sig";

const BelowFold = lazy(() => import("@/components/site/BelowFold"));

export default function Portfolio() {
  const lenisRef = useSmoothScroll();

  return (
    <LazyMotion features={domMax} strict>
      <a className="skip-link" href="#main" data-testid="skip-link">
        Skip to content
      </a>
      <Chrome />
      <Header
        onOpenChange={(open) => {
          const lenis = lenisRef.current;
          if (!lenis) return;
          if (open) lenis.stop();
          else lenis.start();
        }}
      />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Marquee />
        <Suspense fallback={<div style={{ minHeight: "100svh" }} aria-hidden="true" />}>
          <BelowFold />
        </Suspense>
      </main>
      <Sig />
      <Toaster
        position="bottom-center"
        duration={2500}
        theme="dark"
        mobileOffset="calc(16px + env(safe-area-inset-bottom))"
      />
    </LazyMotion>
  );
}
