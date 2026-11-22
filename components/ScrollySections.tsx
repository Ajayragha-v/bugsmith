"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { LandingSection } from "./HUDOverlay";

type Props = {
  activeSection: LandingSection;
  onActiveSectionChange: (section: LandingSection) => void;
};

const RobotScene = dynamic(() => import("./RobotScene"), {
  ssr: false,
  loading: () => <div className="robot-scene-placeholder"><span>LOADING ORIGINAL MODEL</span></div>,
});

const capabilities = [
  { number: "01", code: "INTENT / CONTEXT", title: "Intent matching", text: "Judge a proposed change against the problem it claims to solve — not just the lines it touches." },
  { number: "02", code: "BEHAVIOUR / TESTS", title: "Behavioural validation", text: "Check that the repaired path behaves as expected under targeted examples and edge cases." },
  { number: "03", code: "BASELINE / DIFF", title: "Regression analysis", text: "Compare candidate outcomes with the baseline and surface collateral damage beyond the patch." },
  { number: "04", code: "MAINTAINABILITY / SIGNAL", title: "Quality grading", text: "Assess structural quality without allowing a cosmetic score to overrule correctness gates." },
];

const process = [
  { number: "01", title: "Analyse", text: "Read the repair intent, candidate diff and surrounding project context." },
  { number: "02", title: "Grade", text: "Combine intent, behavioural, regression and quality evidence into a traceable assessment." },
  { number: "03", title: "Verify", text: "Run required checks and keep correctness gates separate from softer quality signals." },
  { number: "04", title: "Learn", text: "Store verified outcomes so future grading and calibration can improve from evidence." },
];

const evidence = [
  { label: "TARGET BEHAVIOUR", title: "What was fixed?", text: "The report ties a candidate to the stated repair intent and the checks that exercise that path." },
  { label: "BASELINE COMPARISON", title: "What changed?", text: "A before-and-after view makes file scope, diagnostic deltas and unexpected changes inspectable." },
  { label: "REGRESSION RECORD", title: "What stayed intact?", text: "Existing checks are compared against the baseline so a local fix cannot hide wider breakage." },
  { label: "QUALITY SIGNALS", title: "What improved?", text: "Maintainability and static-analysis signals are reported separately from mandatory pass/fail gates." },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span className="arrow-glyph" aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

function DemoEvaluation() {
  const [ran, setRan] = useState(false);
  const [tab, setTab] = useState<"diff" | "evidence">("diff");

  return (
    <div className={`evaluation-window ${ran ? "evaluation-ran" : ""}`}>
      <div className="evaluation-window-top">
        <div className="window-dots"><i /><i /><i /></div>
        <span>BUGSMITH / CANDIDATE REVIEW</span>
        <span className="window-run-id">DEMO TRACE / 001</span>
      </div>
      <div className="evaluation-toolbar">
        <div className="file-context"><span className="python-icon">Py</span> pricing/discount.py <span className="file-caret">⌄</span></div>
        <span className="demo-label">SIMULATED WALKTHROUGH</span>
      </div>
      <div className="evaluation-tabs" role="tablist" aria-label="Evaluation demo views">
        <button type="button" role="tab" aria-selected={tab === "diff"} className={tab === "diff" ? "selected" : ""} onClick={() => setTab("diff")}>Patch diff</button>
        <button type="button" role="tab" aria-selected={tab === "evidence"} className={tab === "evidence" ? "selected" : ""} onClick={() => setTab("evidence")}>Evidence report</button>
      </div>

      {tab === "diff" ? (
        <div className="code-diff-grid">
          <div className="code-pane code-before">
            <div className="code-pane-title"><span className="state-icon state-remove">−</span> ORIGINAL / BEFORE</div>
            <pre><code><span className="line-number">1</span><span className="kw">def</span> final_price(price, discount):{"\n"}<span className="line-number">2</span>    <span className="kw">return</span> price * discount{"\n"}</code></pre>
            <span className="code-pane-note">TARGET BEHAVIOUR NOT MET</span>
          </div>
          <div className="code-pane code-after">
            <div className="code-pane-title"><span className="state-icon state-add">+</span> CANDIDATE / PROPOSED</div>
            <pre><code><span className="line-number">1</span><span className="kw">def</span> final_price(price, discount):{"\n"}<span className="line-number">2</span>    <span className="kw">return</span> price * (<span className="num">1</span> - discount){"\n"}</code></pre>
            <span className="code-pane-note">EXPECTED DISCOUNTED PRICE</span>
          </div>
        </div>
      ) : (
        <div className="evidence-report">
          <div><span className="report-index">01</span><span><b>Intent match</b><small>Candidate preserves the non-discounted portion of the price.</small></span><em className={ran ? "pass" : "pending"}>{ran ? "MATCHED" : "READY"}</em></div>
          <div><span className="report-index">02</span><span><b>Target behaviour</b><small>Illustrative input: price 100, discount 0.2 → expected 80.</small></span><em className={ran ? "pass" : "pending"}>{ran ? "PASSED" : "READY"}</em></div>
          <div><span className="report-index">03</span><span><b>Regression checks</b><small>Would be run against the project's existing baseline suite.</small></span><em className={ran ? "pass" : "pending"}>{ran ? "DEMO ONLY" : "NOT RUN"}</em></div>
          <p className="report-disclaimer">This is a front-end walkthrough using a fixed example. It is not connected to the Bugsmith grading engine.</p>
        </div>
      )}

      <div className="evaluation-window-footer">
        <div className="evaluation-state"><span className={ran ? "state-live" : "state-idle"} />{ran ? "SAMPLE TRACE DISPLAYED" : "AWAITING SAMPLE RUN"}</div>
        <button type="button" className="run-demo-button" onClick={() => { setRan((value) => !value); setTab("evidence"); }}>
          {ran ? "Reset walkthrough" : "Run sample walkthrough"} <Arrow />
        </button>
      </div>
    </div>
  );
}

export default function ScrollySections({ activeSection, onActiveSectionChange }: Props) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (!reduceMotion) {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro.fromTo(".hero-kicker", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
          .fromTo(".hero-title-line", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, "-=0.25")
          .fromTo(".hero-description, .hero-actions, .hero-proof-points", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.1 }, "-=0.45")
          .fromTo(".intent-card", { x: -18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7 }, "-=0.65")
          .fromTo(".hero-robot-label", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55 }, "-=0.5");

        gsap.utils.toArray<HTMLElement>(".reveal").forEach((element) => {
          gsap.fromTo(element, { y: 34, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 0.75,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          });
        });

        const track = document.querySelector<HTMLElement>(".capability-track");
        const viewport = document.querySelector<HTMLElement>(".capability-viewport");
        if (track && viewport && window.matchMedia("(min-width: 900px)").matches) {
          gsap.to(track, {
            x: () => Math.min(0, viewport.clientWidth - track.scrollWidth),
            ease: "none",
            scrollTrigger: {
              trigger: "#platform",
              start: "top top+=90",
              end: "bottom bottom",
              scrub: 0.65,
              invalidateOnRefresh: true,
            },
          });
        }
      }

      const ids: LandingSection[] = ["intro", "platform", "method", "evidence", "demo"];
      ids.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;
        ScrollTrigger.create({
          trigger: element,
          start: "top center",
          end: "bottom center",
          onEnter: () => onActiveSectionChange(id),
          onEnterBack: () => onActiveSectionChange(id),
        });
      });
    });

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      window.cancelAnimationFrame(refreshFrame);
      ctx.revert();
    };
  }, [onActiveSectionChange]);

  return (
    <main className="scrolly-content">
      <section id="intro" className="hero-section page-section" aria-labelledby="hero-title">
        <div className="hero-grid hero-grid-a" /><div className="hero-grid hero-grid-b" />
        <div className="hero-layout">
          <div className="hero-copy-column">
            <div className="hero-kicker"><span className="signal-dot" /> AUTONOMOUS REPAIR EVALUATION <i /></div>
            <div className="intent-card hud-corners">
              <div className="intent-card-heading"><span>REPAIR INTENT / 001</span><b><i /> LIVE SIGNAL</b></div>
              <p>WHY DID THIS PATCH PASS?</p>
              <small>SHOW THE EVIDENCE. NOT JUST THE SCORE.</small>
              <div className="intent-card-foot"><span>DECISION TRACE</span><strong>AWAITING EVALUATION <b>↗</b></strong></div>
            </div>
            <div className="hero-heading-block">
              <span className="hero-overline">CODE REPAIR / QUALITY INTELLIGENCE</span>
              <h1 id="hero-title"><span className="hero-title-line">Make repairs</span><span className="hero-title-line">prove</span><span className="hero-title-line">themselves<span className="title-red">.</span></span></h1>
              <p className="hero-description">Bugsmith evaluates code repairs against intent, behaviour, regressions and maintainability — then learns from verified outcomes.</p>
              <div className="hero-actions">
                <a className="button-primary" href="#demo">Explore the evaluation <Arrow diagonal /></a>
                <a className="button-secondary" href="#method">How it works <Arrow /></a>
              </div>
              <div className="hero-proof-points"><span><i>✓</i> Evidence first</span><span><i>✓</i> Regression aware</span><span><i>✓</i> Outcome driven</span></div>
            </div>
          </div>

          <div className="hero-visual-column">
            <div className="robot-glow" />
            <div className="robot-orbit orbit-one" /><div className="robot-orbit orbit-two" />
            <div className="robot-scene-slot"><RobotScene activeSection={activeSection} /></div>
            <div className="hero-robot-label"><span className="live-dot" /> BUGSMITH UNIT / ORIGINAL MODEL <b>001</b></div>
            <div className="hero-side-index"><span>01 / ANALYSE</span><span>02 / GRADE</span><span>03 / VERIFY</span><span>04 / LEARN</span></div>
          </div>
        </div>
        <div className="hero-bottomline"><span>BUILDER / EVALUATOR / VERIFIER</span><span>SCROLL TO INSPECT <b>↓</b></span></div>
      </section>

      <section id="platform" className="platform-section page-section" aria-labelledby="platform-title">
        <div className="platform-sticky">
          <div className="section-topline reveal"><span>01 / PLATFORM</span><span>A REPAIR IS A CLAIM. EVIDENCE MAKES IT CREDIBLE.</span></div>
          <div className="section-heading-row reveal"><div><span className="section-eyebrow">FOUR CONNECTED DISCIPLINES</span><h2 id="platform-title">A better way to<br /><em>judge the change.</em></h2></div><p>Correctness is non-negotiable. Quality is measured in context. Every decision should be explainable.</p></div>
          <div className="capability-rail-label"><span>CAPABILITY INDEX <b>01—04</b></span><span>SCROLL TO MOVE THROUGH THE SYSTEM <i>↓</i></span></div>
          <div className="capability-viewport"><div className="capability-track">
            {capabilities.map((item) => <article className="capability-card" key={item.number}><div className="capability-card-top"><span>[ {item.number} ]</span><span className="capability-cross">＋</span></div><small>{item.code}</small><h3>{item.title}</h3><p>{item.text}</p><div className="capability-card-bottom"><span>BUGSMITH / ENGINE</span><b>↗</b></div></article>)}
          </div></div>
          <div className="rail-footer"><span>FROM PROPOSED PATCH</span><i /><span>TO VERIFIED OUTCOME</span></div>
        </div>
      </section>

      <section id="method" className="method-section page-section" aria-labelledby="method-title">
        <div className="section-topline reveal"><span>02 / METHOD</span><span>NO SHORTCUTS FROM PATCH TO PASS.</span></div>
        <div className="section-heading-row method-heading reveal"><div><span className="section-eyebrow">THE EVALUATION SEQUENCE</span><h2 id="method-title">Analyse. Grade.<br /><em>Verify. Learn.</em></h2></div><p>One pipeline that separates mandatory correctness gates from adaptive quality signals.</p></div>
        <div className="method-flow">
          {process.map((step) => <article className="method-step reveal" key={step.number}><div className="method-step-top"><span>{step.number}</span><b>↗</b></div><h3>{step.title}</h3><p>{step.text}</p><i /></article>)}
        </div>
        <div className="grading-dimensions reveal"><span>GRADING DIMENSIONS</span><div><b>INTENT</b><i>/</i><b>BEHAVIOUR</b><i>/</i><b>REGRESSIONS</b><i>/</i><b>QUALITY</b></div></div>
      </section>

      <section id="evidence" className="evidence-section page-section" aria-labelledby="evidence-title">
        <div className="section-topline reveal"><span>03 / EVIDENCE & BENCHMARKS</span><span>NO SCORE WITHOUT A TRACEABLE REASON.</span></div>
        <div className="evidence-heading reveal"><span className="section-eyebrow">THE STANDARD BEHIND THE DECISION</span><h2 id="evidence-title">Evidence over<br /><em>assumption.</em></h2><p>Bugsmith is designed to make each repair decision inspectable: what was tested, what changed, what passed and what remains uncertain.</p></div>
        <div className="evidence-grid">
          {evidence.map((item, index) => <article className="evidence-card reveal" key={item.label}><span className="evidence-index">0{index + 1}</span><small>{item.label}</small><h3>{item.title}</h3><p>{item.text}</p><span className="evidence-card-rule" /></article>)}
        </div>
        <div className="benchmark-panel reveal"><div className="benchmark-copy"><span className="section-eyebrow">BENCHMARK METHOD</span><h3>Measure the system.<br /><em>Publish only what holds up.</em></h3><p>We won't display invented accuracy or speed claims. Benchmark results belong here once they have been measured on a documented dataset and repeatable evaluation protocol.</p></div><div className="benchmark-checklist"><div><span>01</span><b>Fixed evaluation set</b><small>Versioned examples and labelled outcomes</small></div><div><span>02</span><b>Independent verification</b><small>Separate acceptance criteria from grader predictions</small></div><div><span>03</span><b>Reported error rates</b><small>False accepts, false rejects and evaluation cost</small></div><div className="benchmark-status"><i /> BENCHMARK RESULTS / NOT PUBLISHED</div></div></div>
      </section>

      <section id="demo" className="demo-section page-section" aria-labelledby="demo-title">
        <div className="section-topline reveal"><span>04 / INTERACTIVE EVALUATION</span><span>A SAMPLE WALKTHROUGH — NOT A LIVE ENGINE RUN.</span></div>
        <div className="demo-heading-row reveal"><div><span className="section-eyebrow">INSPECT A REPAIR CANDIDATE</span><h2 id="demo-title">Don't take the patch<br /><em>at its word.</em></h2></div><p>Follow a small example from proposed change to evidence. The walkthrough is illustrative until the live Bugsmith engine is connected.</p></div>
        <div className="demo-window-wrap reveal"><DemoEvaluation /></div>
        <div className="demo-bottom-note"><span>ILLUSTRATIVE INPUT / 100.00</span><span>OUTPUT EXPECTED / 80.00</span><span>NO LIVE GRADER CONNECTED</span></div>
        <div className="final-cta reveal"><div><span className="section-eyebrow">A BETTER REPAIR IS ONE YOU CAN PROVE</span><h2>Make it <em>earn the pass.</em></h2></div><a href="#demo" className="button-primary">Explore the evaluation <Arrow diagonal /></a></div>
      </section>

      <footer id="footer" className="site-footer">
        <a href="#intro" className="footer-brand">bugsmith<span>.</span></a>
        <p>REPAIR INTELLIGENCE / GROUNDED IN EVIDENCE</p>
        <div className="footer-links"><a href="#platform">PLATFORM</a><a href="#method">METHOD</a><a href="#evidence">EVIDENCE</a><span>© BUGSMITH 2026</span></div>
        <div className="asset-credit">Robot model: “Robot from the series Love, Death & Robots” by GreenG · <a href="https://sketchfab.com/3d-models/robot-from-the-series-love-death-and-robots-3c2c43c8737341e5816c61634782373a" target="_blank" rel="noreferrer">Sketchfab source</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. Character/IP rights require separate review before commercial release.</div>
      </footer>
    </main>
  );
}

