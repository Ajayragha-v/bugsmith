"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { RobotFaceExpression } from "./RobotFaceState";

const RobotScene = dynamic(() => import("./RobotScene"), {
  ssr: false,
  loading: () => (
    <div className="landing-robot-loading" role="status" aria-live="polite">
      <span className="landing-status-dot" />
      <span>Preparing the Bugsmith guide</span>
    </div>
  ),
});

const stages = [
  {
    number: "01",
    title: "Describe the repair",
    text: "Share the code, the bug, and the behaviour you expect.",
  },
  {
    number: "02",
    title: "Review the evidence",
    text: "Assess intent, behaviour, regressions, and code quality.",
  },
  {
    number: "03",
    title: "Verify the change",
    text: "Keep required checks distinct from softer quality signals.",
  },
];

const sources = ["Files", "Project", "GitHub", "Paste code"];

function RobotFacePreview({
  selected,
  onSelect,
}: {
  selected: RobotFaceExpression | null;
  onSelect: (expression: RobotFaceExpression | null) => void;
}) {
  if (process.env.NODE_ENV !== "development") return null;

  const expressions: RobotFaceExpression[] = [
    "IDLE", "LISTENING", "THINKING", "CODE_RECEIVED", "ANALYZING", "BUG_DETECTED",
    "REPAIRING", "TESTING", "SUCCESS", "ERROR", "SLEEPING",
  ];

  return (
    <details className="robot-face-preview">
      <summary>Face preview</summary>
      <div className="robot-face-preview-options">
        <button type="button" className={!selected ? "selected" : ""} onClick={() => onSelect(null)}>Live state</button>
        {expressions.map((expression) => (
          <button
            type="button"
            key={expression}
            className={selected === expression ? "selected" : ""}
            onClick={() => onSelect(expression)}
          >
            {expression.replaceAll("_", " ")}
          </button>
        ))}
      </div>
    </details>
  );
}

export default function BugsmithLanding() {
  const [facePreview, setFacePreview] = useState<RobotFaceExpression | null>(null);

  return (
    <>
    <main className="landing-page">
      <header className="landing-header">
        <Link href="/" className="landing-brand" aria-label="Bugsmith home">
          Bugsmith<span>.</span>
        </Link>
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#evidence">Evidence</a>
          <Link className="landing-nav-cta" href="/repair">Start a repair</Link>
        </nav>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span className="landing-status-dot" /> Code repair evaluation</p>
          <h1 id="landing-title">Make repairs<br />prove themselves.</h1>
          <p className="landing-lede">
            Bugsmith helps you judge a code repair by what it fixes, what it changes, and what still works.
          </p>
          <div className="landing-actions">
            <Link className="landing-primary-button" href="/repair">Start with your code <span aria-hidden="true">→</span></Link>
            <a className="landing-secondary-link" href="#how-it-works">See how it works</a>
          </div>
          <p className="landing-note">The repair workspace prepares your submission. Live automated evaluation is not connected yet.</p>
        </div>

        <div className="landing-hero-visual" aria-label="Bugsmith robot guide">
          <div className="landing-orbit landing-orbit-one" />
          <div className="landing-orbit landing-orbit-two" />
          <div className="landing-robot-frame">
            <RobotScene
              activeSection="intro"
              enableAutoGestures={false}
              enableAutoMovement
              faceExpressionOverride={facePreview}
            />
          </div>
          <span className="landing-visual-caption">Your repair guide</span>
        </div>
      </section>

      <section className="landing-submission" aria-label="Ways to submit code">
        <p>Bring a single file, a project, a repository, or a code snippet.</p>
        <ul>{sources.map((source) => <li key={source}>{source}</li>)}</ul>
      </section>

      <section id="how-it-works" className="landing-process">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">A clear path from bug to confidence</p>
          <h2>Every repair needs a reason.</h2>
        </div>
        <div className="landing-stage-grid">
          {stages.map((stage) => (
            <article className="landing-stage" key={stage.number}>
              <span className="landing-stage-number">{stage.number}</span>
              <h3>{stage.title}</h3>
              <p>{stage.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="evidence" className="landing-evidence">
        <div>
          <p className="landing-eyebrow">Evidence over assumption</p>
          <h2>Know what passed<br />and why.</h2>
        </div>
        <div className="landing-evidence-copy">
          <p>Bugsmith is designed to make repair decisions explainable, from the stated intent to the checks behind the result.</p>
          <p className="landing-note">Public benchmark results will appear when they are measured and independently verified.</p>
          <Link className="landing-secondary-link" href="/repair">Prepare a repair submission <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="landing-brand" aria-label="Bugsmith home">Bugsmith<span>.</span></Link>
        <span>Code repair evaluation, grounded in evidence.</span>
      </footer>
    </main>
    <RobotFacePreview selected={facePreview} onSelect={setFacePreview} />
    </>
  );
}
