"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Stage {
  number: string;
  badge: string;
  title: string;
  summary: string;
  details: { label: string; desc: string }[];
  footerNote: string;
  tagline: string;
  iconType: "ingest" | "swarm" | "coord" | "verify" | "forensic" | "memory";
}

const STAGES: Stage[] = [
  {
    number: "01",
    badge: "INGESTION",
    title: "Codebase Ingestion",
    tagline: "Establish baseline commit from any software repository",
    summary: "Bugsmith accepts software projects from multiple sources to create a pristine evaluation state:",
    details: [
      { label: "Git repositories", desc: "Cloned with full branch and commit history." },
      { label: "Local directories", desc: "Uploaded directly from developer filesystems." },
      { label: "ZIP archives", desc: "Automated extraction and folder tree reconstruction." },
      { label: "Direct code input", desc: "Paste snippets or single-file scripts into sandbox." },
    ],
    footerNote: "The project is imported into a managed Git repository, establishing an initial baseline commit.",
    iconType: "ingest",
  },
  {
    number: "02",
    badge: "AGENT SWARM",
    title: "Intelligent Code Transformation",
    tagline: "Multi-layer mutations isolated across Git worktrees",
    summary: "Specialized agents work across different engineering layers without cross-contamination:",
    details: [
      {
        label: "AST Agent",
        desc: "Performs structural code transformations, constant folding, dead-code pruning, and list-comprehension optimization.",
      },
      {
        label: "Bytecode Agent",
        desc: "Analyzes Python bytecode instructions and applies low-overhead bytecode transformations.",
      },
      {
        label: "Script Agent",
        desc: "Applies script-level improvements such as string formatting modernization and set membership lookup optimization.",
      },
    ],
    footerNote: "The agents operate through isolated Git branches and ephemeral worktrees.",
    iconType: "swarm",
  },
  {
    number: "03",
    badge: "COORDINATION",
    title: "Parallel Execution & Coordination",
    tagline: "Concurrency control across isolated worker branches",
    summary: "The Transformer Coordinator manages agents, assigns work according to their tiers, and prevents merge collisions:",
    details: [
      { label: "Tier Assignment", desc: "Partitions search space between ARCH, AST, and EXEC tiers." },
      { label: "Ephemeral Worktrees", desc: "Parallel workers execute in isolated working copies off main SHA." },
      { label: "Conflict Separation", desc: "Guarantees mutation proposals never overwrite active contracts or tests." },
    ],
    footerNote: "This allows multiple transformation strategies to be explored simultaneously while keeping their modifications isolated.",
    iconType: "coord",
  },
  {
    number: "04",
    badge: "POST-COMMIT EVALUATION",
    title: "Automated Verification",
    tagline: "Deterministic gates: proof before acceptance",
    summary: "Every proposed commit passes through strict, non-negotiable evaluation gates:",
    details: [
      { label: "Contract separation checks", desc: "Anti-Goodhart enforcement verifying no test tampering." },
      { label: "Syntax & compilation checks", desc: "Tree-sitter AST validation and Python linter passes." },
      { label: "Automated test execution", desc: "Pytest and property test suites executed in sandbox." },
      { label: "Performance benchmarking", desc: "Memory consumption, execution latency, and profiler telemetry." },
    ],
    footerNote: "Changes that fail verification generate diagnostic feedback instead of being treated as successful improvements.",
    iconType: "verify",
  },
  {
    number: "05",
    badge: "FORENSIC GRADING",
    title: "Forensic Root-Cause Analysis",
    tagline: "Deterministic zero-LLM regression isolation",
    summary: "Bugsmith uses Git-based forensic analysis to pinpoint the exact failure reason:",
    details: [
      { label: "Git Bisect", desc: "Binary searches commit lineage to isolate the exact regressing commit." },
      { label: "Delta Debugging (ddmin)", desc: "Minimizes multi-line diffs to isolate the 1 bad hunk out of N changes." },
      { label: "Vertical Grading", desc: "Routes detected symptoms to the relevant engineering tier (ARCH, AST, EXEC, SPEC)." },
      { label: "Horizontal Grading", desc: "Traces the historical dependency chain responsible for the outcome." },
    ],
    footerNote: "Zero-LLM hard grading provides reproducible mathematical proof of failures.",
    iconType: "forensic",
  },
  {
    number: "06",
    badge: "LEARNING LOOP",
    title: "Causal Memory & Continuous Feedback",
    tagline: "Persistent causal rules & paired DPO preference minting",
    summary: "Bugsmith records verifiable outcomes to continuously strengthen future repair swarms:",
    details: [
      { label: "Causal Rule Storage", desc: "Distills verified milestones into persistent, machine-readable causal rules." },
      { label: "DPO Training Pairs", desc: "Mints chosen-vs-rejected commit pairs (training_pairs.jsonl) for model alignment." },
      { label: "Iterative Feedback", desc: "Supplies subsequent agents with explicit feedback packets and diagnostic tensors." },
    ],
    footerNote: "These mechanisms provide feedback that guides subsequent agent transformations toward faster convergence.",
    iconType: "memory",
  },
];

export default function WorkingSection() {
  const [activeStage, setActiveStage] = useState<number | null>(null);

  return (
    <section id="how-it-works" className="relative z-20 w-full py-28 px-6 sm:px-10 lg:px-16 bg-[#07070a] border-t border-white/[0.06]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-72 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_#ff6600]" />
            <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
              The Bugsmith Pipeline
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-[-0.03em] text-white leading-tight mb-6">
            Inside the Intelligence That<br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-orange-300">
              Engineers Better Code.
            </span>
          </h2>

          <p className="max-w-3xl mx-auto text-zinc-400 text-sm sm:text-base leading-relaxed font-normal">
            Bugsmith transforms an existing codebase into an evolving engineering environment where specialized agents analyze changes, execute transformations, detect regressions, and verify outcomes through deterministic evaluation.
          </p>
        </div>

        {/* 6 Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {STAGES.map((stage, idx) => {
            const isHovered = activeStage === idx;

            return (
              <div
                key={stage.number}
                id={`stage-${stage.number}`}
                onMouseEnter={() => setActiveStage(idx)}
                onMouseLeave={() => setActiveStage(null)}
                className={`group relative flex flex-col justify-between rounded-2xl p-7 transition-all duration-300 border ${
                  isHovered
                    ? "bg-[#0e0e16] border-orange-500/50 shadow-[0_10px_35px_rgba(255,100,0,0.18)] translate-y-[-3px]"
                    : "bg-[#0a0a10]/80 border-white/[0.08] hover:border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
                }`}
              >
                {/* Card Top: Number + Badge */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-mono font-bold text-orange-500/40 group-hover:text-orange-400 transition-colors">
                      {stage.number}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:bg-orange-500/20 transition-all">
                      {stage.badge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-2 group-hover:text-orange-200 transition-colors">
                    {stage.title}
                  </h3>

                  <p className="text-xs text-orange-400/80 font-mono mb-4">
                    {stage.tagline}
                  </p>

                  <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed mb-5">
                    {stage.summary}
                  </p>

                  {/* Details List */}
                  <div className="space-y-2.5 mb-6">
                    {stage.details.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="text-orange-500 font-bold mt-0.5">•</span>
                        <div className="text-zinc-300 leading-snug">
                          <strong className="text-white font-medium">{item.label}: </strong>
                          <span className="text-zinc-400">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Note */}
                <div className="pt-4 border-t border-white/[0.06] text-[11px] text-zinc-500 font-mono italic">
                  {stage.footerNote}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-20 rounded-2xl bg-gradient-to-r from-orange-950/20 via-black to-orange-950/20 border border-orange-500/30 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(255,100,0,0.1)]">
          <div className="text-center sm:text-left">
            <h4 className="text-xl sm:text-2xl font-semibold text-white mb-2">
              Ready to verify repairs with deterministic proof?
            </h4>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Start with your code in the managed Git repair workspace. No hallucinations, only hard grader verification.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/repair"
              className="px-7 py-3 rounded-full text-xs sm:text-sm font-bold bg-white text-black hover:bg-zinc-100 transition shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-[1.03]"
            >
              Start a Repair
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
