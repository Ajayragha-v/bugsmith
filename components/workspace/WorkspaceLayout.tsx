"use client";

import React, { useState } from "react";
import WorkspaceSidebar, { SidebarTab } from "./WorkspaceSidebar";
import WorkspaceHeader from "./WorkspaceHeader";
import NewEvaluationView from "./NewEvaluationView";
import EvaluationDashboardView from "./EvaluationDashboardView";

export default function WorkspaceLayout() {
  const [currentTab, setCurrentTab] = useState<SidebarTab>("new-evaluation");

  return (
    <div className="flex h-screen w-full bg-[#080B10] text-[#F4F7FA] overflow-hidden font-sans select-text">
      {/* 1. Persistent Sidebar Navigation */}
      <WorkspaceSidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
      />

      {/* 2. Main Application Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#080B10]">
        {/* Top Header */}
        <WorkspaceHeader currentTab={currentTab} />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === "new-evaluation" && (
            <NewEvaluationView
              onEvaluationStarted={() => setCurrentTab("dashboard")}
            />
          )}

          {currentTab === "dashboard" && (
            <EvaluationDashboardView
              onBackToNewEvaluation={() => setCurrentTab("new-evaluation")}
            />
          )}

          {/* Placeholders for upcoming phases */}
          {currentTab === "overview" && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <div className="border-b border-[#263341] pb-4">
                <h2 className="text-xl font-bold text-[#F4F7FA]">System Overview</h2>
                <p className="text-xs text-[#8B98A8]">
                  Stratified Git-Forensic Swarm Status and Active Worktree Topology.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-lg bg-[#101720] border border-[#263341]">
                  <span className="text-[#8B98A8] block">Evaluations</span>
                  <span className="text-xl font-bold text-[#F4F7FA] mt-1 block">0 Active</span>
                </div>
                <div className="p-4 rounded-lg bg-[#101720] border border-[#263341]">
                  <span className="text-[#8B98A8] block">Swarm Tiers</span>
                  <span className="text-xl font-bold text-[#42D99A] mt-1 block">3 Ready</span>
                </div>
                <div className="p-4 rounded-lg bg-[#101720] border border-[#263341]">
                  <span className="text-[#8B98A8] block">Grader Mode</span>
                  <span className="text-xl font-bold text-[#F4F7FA] mt-1 block">Zero-LLM</span>
                </div>
                <div className="p-4 rounded-lg bg-[#101720] border border-[#263341]">
                  <span className="text-[#8B98A8] block">Worktree Engine</span>
                  <span className="text-xl font-bold text-[#42D99A] mt-1 block">Ephemeral</span>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-[#101720] border border-[#263341] text-xs space-y-3">
                <div className="font-mono text-[#42D99A] font-bold uppercase tracking-wider">
                  Swarm Invariants Enforced
                </div>
                <ul className="space-y-1.5 text-zinc-400 font-mono text-[11px]">
                  <li>• Zero Raw Code in LangGraph State (metadata & pointers only)</li>
                  <li>• Strict Ephemeral Worktree Isolation off main_sha</li>
                  <li>• Anti-Goodhart Separation of Powers (Mutators cannot touch tests/contracts)</li>
                  <li>• Machine-parseable Git Trailers required on all automated commits</li>
                </ul>
              </div>
            </div>
          )}

          {currentTab === "agent-swarm" && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <div className="border-b border-[#263341] pb-4">
                <h2 className="text-xl font-bold text-[#F4F7FA]">Agent Swarm Panel</h2>
                <p className="text-xs text-[#8B98A8]">
                  Available transformation agents defined in Simulation/Transformer/.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    name: "AST Agent",
                    tier: "AST",
                    file: "ast_agent.py",
                    desc: "Structural transformations, constant folding, dead-code pruning, and list-comprehension optimization.",
                    status: "Standby",
                  },
                  {
                    name: "Bytecode Agent",
                    tier: "EXEC",
                    file: "bytecode_agent.py",
                    desc: "Python bytecode analysis and low-overhead opcode transformations.",
                    status: "Standby",
                  },
                  {
                    name: "Script Agent",
                    tier: "ARCH",
                    file: "script_agent.py",
                    desc: "Script-level modernization, f-string rewrites, and set-based lookup acceleration.",
                    status: "Standby",
                  },
                ].map((agent) => (
                  <div key={agent.name} className="p-5 rounded-lg bg-[#101720] border border-[#263341] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#F4F7FA]">{agent.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#151E29] border border-[#263341] text-[#42D99A]">
                        {agent.tier}
                      </span>
                    </div>
                    <p className="text-xs text-[#8B98A8] leading-relaxed">{agent.desc}</p>
                    <div className="pt-2 border-t border-[#263341] flex items-center justify-between text-[11px] font-mono text-[#8B98A8]">
                      <span>{agent.file}</span>
                      <span className="text-[#42D99A]">{agent.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTab === "forensics" && (
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              <div className="border-b border-[#263341] pb-4">
                <h2 className="text-xl font-bold text-[#F4F7FA]">Forensic Analysis Console</h2>
                <p className="text-xs text-[#8B98A8]">
                  Root-cause isolation engine (Simulation/Grader.py).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-lg bg-[#101720] border border-[#263341] space-y-2">
                  <span className="text-xs font-mono uppercase text-[#42D99A] font-bold">1. Git Bisect Localization</span>
                  <p className="text-xs text-[#8B98A8] leading-relaxed">
                    Binary searches commit lineage across agent branches to isolate the exact regressing commit with zero LLM inference.
                  </p>
                </div>
                <div className="p-5 rounded-lg bg-[#101720] border border-[#263341] space-y-2">
                  <span className="text-xs font-mono uppercase text-[#42D99A] font-bold">2. Delta Debugging (ddmin)</span>
                  <p className="text-xs text-[#8B98A8] leading-relaxed">
                    Minimizes multi-line candidate diffs down to the single bad hunk responsible for the test failure.
                  </p>
                </div>
              </div>
            </div>
          )}

          {["projects", "history", "settings"].includes(currentTab) && (
            <div className="p-8 max-w-4xl mx-auto text-center py-24 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#151E29] border border-[#263341] flex items-center justify-center text-[#8B98A8]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-[#F4F7FA] capitalize">
                {currentTab.replace("-", " ")} Module
              </h3>
              <p className="text-xs text-[#8B98A8] max-w-md mx-auto">
                Configured and structured for upcoming engineering phases. Use New Evaluation to submit code.
              </p>
              <button
                type="button"
                onClick={() => setCurrentTab("new-evaluation")}
                className="mt-3 px-4 py-2 rounded text-xs font-mono bg-[#151E29] hover:bg-[#263341] text-[#42D99A] border border-[#263341] transition"
              >
                Go to New Evaluation →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
