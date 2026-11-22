"use client";

import { useEffect, useState } from "react";

export type LandingSection = "intro" | "platform" | "method" | "evidence" | "demo";

type Props = { activeSection: LandingSection };

const items: { label: string; href: string }[] = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#method" },
  { label: "Evidence", href: "#evidence" },
  { label: "Evaluation", href: "#demo" },
];

const labels: Record<LandingSection, string> = {
  intro: "INTRO",
  platform: "PLATFORM",
  method: "METHOD",
  evidence: "EVIDENCE",
  demo: "EVALUATION",
};

function BrandIcon() {
  return (
    <svg className="brand-icon" viewBox="0 0 42 42" aria-hidden="true">
      <rect x="5" y="5" width="32" height="32" rx="8" fill="none" stroke="currentColor" strokeWidth="1.65" />
      <path d="M13 16v7m16-7v7M14 29c3.8 2.8 10.2 2.8 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 5V2m-3 0h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="13" cy="15" r="1.5" fill="#d44850" /><circle cx="29" cy="15" r="1.5" fill="#d44850" />
    </svg>
  );
}

export default function HUDOverlay({ activeSection }: Props) {
  const [announcementOpen, setAnnouncementOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(range > 0 ? window.scrollY / range : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <header className="site-header">
        {announcementOpen && (
          <div className="announcement-bar">
            <p><span>NEW /</span> A better repair is one you can prove <b>↗</b></p>
            <button type="button" aria-label="Dismiss announcement" onClick={() => setAnnouncementOpen(false)}>×</button>
          </div>
        )}
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#intro" className="brand-lockup" aria-label="Bugsmith home" onClick={() => setMenuOpen(false)}>
            <BrandIcon />
            <span className="brand-name">bugsmith<span>.</span></span>
            <span className="brand-divider" />
            <span className="brand-edition">REPAIR INTELLIGENCE</span>
          </a>
          <button className="mobile-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <span /><span />
          </button>
          <div className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
            {items.map((item) => <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}<i /></a>)}
          </div>
          <a className="nav-cta" href="#demo">Explore the system <span>↗</span></a>
        </nav>
      </header>

      <aside className="right-scrubber" aria-label={`Current section ${labels[activeSection]}`}>
        <span className="scrubber-label">{labels[activeSection]}</span>
        <div className="scrubber-track">
          <span className="scrubber-progress" style={{ height: `${Math.max(0, Math.min(100, progress * 100))}%` }} />
          {items.map((item, index) => {
            const sections: LandingSection[] = ["platform", "method", "evidence", "demo"];
            const isActive = activeSection === sections[index];
            return <a key={item.href} href={item.href} className={`scrubber-node ${isActive ? "active" : ""}`} style={{ top: `${(index + 1) * 20}%` }} aria-label={`Go to ${item.label}`} />;
          })}
          <a href="#intro" className={`scrubber-node scrubber-start ${activeSection === "intro" ? "active" : ""}`} aria-label="Go to introduction" />
        </div>
        <a href="#demo" className="scrubber-menu">MENU <span>↓</span></a>
      </aside>
    </>
  );
}
