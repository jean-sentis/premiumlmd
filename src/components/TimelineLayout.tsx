import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import InlinePlanningSlot from "@/components/InlinePlanningSlot";

interface TimelineLayoutProps {
  children: React.ReactNode;
  pageTitle: React.ReactNode;
  mode?: "acheter" | "vendre";
  hideTimeline?: boolean;
  stickyLeft?: React.ReactNode;
  stickyRight?: React.ReactNode;
}

const TimelineLayout = ({ children, pageTitle, stickyLeft, stickyRight, hideTimeline = false }: TimelineLayoutProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const titleStickyRef = useRef<HTMLDivElement | null>(null);

  // Trigger animation on mount/route change
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Expose the sticky title height as a CSS variable so other sticky bars can align without "jump"
  useEffect(() => {
    const el = titleStickyRef.current;
    if (!el) return;

    const root = document.documentElement;
    const setVar = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      root.style.setProperty("--timeline-title-sticky-height", `${h}px`);
    };

    setVar();

    const ro = new ResizeObserver(() => setVar());
    ro.observe(el);

    window.addEventListener("resize", setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Spacer under fixed header */}
      <div style={{ height: "var(--header-height, var(--header-main-height, 145px))" }} />

      <main className="relative bg-background">
        {/* Titre de la page (FIXE) calé juste sous le header principal */}
        <div
          ref={titleStickyRef}
          className="fixed left-0 right-0 z-[45] bg-background pt-0 pb-2 border-b border-border/30"
          style={{
            top: "max(var(--header-main-height, 145px), calc(var(--header-sticky-top, 163px) - 25px))",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex items-center min-h-10">{stickyLeft}</div>
              <h1
                className={`text-lg md:text-xl font-serif tracking-wide text-center text-foreground uppercase transition-all duration-500 ease-out border-b-2 border-[hsl(var(--brand-secondary))] pb-1 px-4 ${
                  isVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {pageTitle}
              </h1>
              <div className="flex items-center justify-end min-h-10">{stickyRight}</div>
            </div>
          </div>
        </div>

        {/* Spacer sous le titre fixe pour éviter que le contenu passe dessous */}
        <div style={{ height: "var(--timeline-title-sticky-height, 52px)" }} />

        {/* Slot inline pour le planning - après le titre */}
        {!hideTimeline && <InlinePlanningSlot />}

        {children}
      </main>
    </div>
  );
};

export default TimelineLayout;

