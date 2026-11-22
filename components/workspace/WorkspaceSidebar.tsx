"use client";

import React from "react";
import Link from "next/link";

export type SidebarTab =
  | "overview"
  | "new-evaluation"
  | "dashboard"
  | "projects"
  | "agent-swarm"
  | "history"
  | "forensics"
  | "settings";

interface SidebarProps {
  currentTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

interface NavItem {
  id: SidebarTab;
  label: string;
  badge?: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-[#42D99A]" : "text-[#8B98A8]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "new-evaluation",
    label: "New Evaluation",
    badge: "Primary",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-[#42D99A]" : "text-[#8B98A8]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: "dashboard",
    label: "Evaluation Dashboard",
    badge: "Live",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-[#42D99A]" : "text-[#8B98A8]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "projects",
    label: "Projects",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-[#42D99A]" : "text-[#8B98A8]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    id: "agent-swarm",
    label: "Agent Swarm",
    badge: "3 Tiers",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-[#42D99A]" : "text-[#8B98A8]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "Evaluation History",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-[#42D99A]" : "text-[#8B98A8]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "forensics",
    label: "Forensic Analysis",
    badge: "ddmin",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-[#42D99A]" : "text-[#8B98A8]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (active) => (
      <svg className={`w-4 h-4 ${active ? "text-[#42D99A]" : "text-[#8B98A8]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function WorkspaceSidebar({ currentTab, onTabChange }: SidebarProps) {
  const [backendOnline, setBackendOnline] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/status");
        if (res.ok) setBackendOnline(true);
      } catch {
        try {
          const res2 = await fetch("/api/backend/status");
          if (res2.ok) setBackendOnline(true);
        } catch {
          setBackendOnline(false);
        }
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);
  return (
    <aside className="w-64 flex-shrink-0 bg-[#080B10] border-r border-[#263341] flex flex-col justify-between select-none">
      {/* Top Branding */}
      <div>
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#263341]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-sm bg-[#42D99A] shadow-[0_0_10px_#42D99A]" />
              <div className="absolute inset-0 rounded-sm border border-[#42D99A]/50" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-[#F4F7FA]">
                BUGSMITH<span className="text-[#42D99A]">.</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B98A8] -mt-0.5">
                ENGINEERING PLATFORM
              </span>
            </div>
          </Link>

          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#101720] border border-[#263341] text-[#8B98A8]">
            v1.0
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#8B98A8]/70">
            Workspace Navigation
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#151E29] text-[#F4F7FA] border border-[#263341] shadow-sm"
                    : "text-[#8B98A8] hover:text-[#F4F7FA] hover:bg-[#101720]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                      isActive
                        ? "bg-[#42D99A]/10 text-[#42D99A] border-[#42D99A]/30"
                        : "bg-[#101720] text-[#8B98A8] border-[#263341]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom System Status Indicator */}
      <div className="p-4 border-t border-[#263341] bg-[#101720]/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B98A8]">
            System Status
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? "bg-[#42D99A] shadow-[0_0_6px_#42D99A]" : "bg-[#F5B84B]"}`} />
            <span className={`text-[10px] font-mono ${backendOnline ? "text-[#42D99A]" : "text-[#F5B84B]"}`}>
              {backendOnline ? "LIVE CONNECTED" : "LOCAL MODE"}
            </span>
          </div>
        </div>

        <div className="space-y-1 text-[11px] font-mono text-[#8B98A8]">
          <div className="flex justify-between">
            <span>Swarm Tiers:</span>
            <span className="text-[#F4F7FA]">ARCH, AST, EXEC</span>
          </div>
          <div className="flex justify-between">
            <span>Hard Grader:</span>
            <span className="text-[#42D99A]">Zero-LLM</span>
          </div>
          <div className="flex justify-between">
            <span>Server Port:</span>
            <span className="text-[#F4F7FA]">8000</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
