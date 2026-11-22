"use client";

import React from "react";
import Link from "next/link";
import { SidebarTab } from "./WorkspaceSidebar";

interface HeaderProps {
  currentTab: SidebarTab;
}

const TAB_TITLES: Record<SidebarTab, { title: string; subtitle: string }> = {
  "overview": {
    title: "System Overview",
    subtitle: "High-level metrics, active worktrees, and evaluation status.",
  },
  "new-evaluation": {
    title: "Code Intelligence Workspace",
    subtitle: "Submit your codebase. Let Bugsmith analyze, transform, evaluate, and verify every proposed change.",
  },
  "dashboard": {
    title: "Evaluation Workspace Dashboard",
    subtitle: "Multi-panel telemetry, pipeline verification gates, code diffs, and forensic root-cause attribution.",
  },
  "projects": {
    title: "Project Registry",
    subtitle: "Managed Git baselines and active project workspaces.",
  },
  "agent-swarm": {
    title: "Agent Swarm Configuration",
    subtitle: "Status and capabilities of AST, Bytecode, and Script agents.",
  },
  "history": {
    title: "Evaluation History",
    subtitle: "Log of past mutations, verification passes, and regressions.",
  },
  "forensics": {
    title: "Forensic Analysis Console",
    subtitle: "Git Bisect lineage, delta debugging (ddmin), and attribution grids.",
  },
  "settings": {
    title: "Platform Configuration",
    subtitle: "Worktree paths, compiler flags, and test runners.",
  },
};

export default function WorkspaceHeader({ currentTab }: HeaderProps) {
  const meta = TAB_TITLES[currentTab] || TAB_TITLES["new-evaluation"];

  return (
    <header className="h-16 px-6 bg-[#080B10] border-b border-[#263341] flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="text-xs font-mono text-[#8B98A8]">
          <span className="text-[#8B98A8]/60">WORKSPACE</span> /{" "}
          <span className="text-[#F4F7FA] font-medium">{meta.title}</span>
        </div>

        <span className="hidden sm:inline-block w-px h-3.5 bg-[#263341]" />

        <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-[#151E29] border border-[#263341] text-[#42D99A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#42D99A] animate-pulse" />
          <span>ENGINE READY</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden md:inline-block text-xs font-mono text-[#8B98A8] italic">
          Engineering Code That Proves Itself.
        </span>

        <Link
          href="/"
          className="text-xs font-mono text-[#8B98A8] hover:text-[#F4F7FA] px-2.5 py-1 rounded border border-[#263341] hover:bg-[#101720] transition"
        >
          ← Return Home
        </Link>
      </div>
    </header>
  );
}
