"use client";

import React, { useState, useEffect, useRef } from "react";

export interface PipelineStage {
  name: string;
  status: "idle" | "running" | "completed" | "failed";
  duration: string;
  summary: string;
}

export interface AgentTelemetry {
  name: string;
  tier: "AST" | "EXEC" | "ARCH" | "SPEC";
  worktree: string;
  branch: string;
  transformations: string[];
  pass_rate: string;
  status: string;
}

export interface EvaluationData {
  evaluation_id: string;
  project_name: string;
  language: string;
  status: "INITIALIZED" | "RUNNING" | "CONVERGED" | "REGRESSION_DETECTED" | "TAMPER_BLOCKED" | "COMPLETED";
  start_time: string;
  end_time?: string;
  metrics: {
    issues_detected: number;
    mutations_generated: number;
    mutations_verified: number;
    progress: number;
  };
  pipeline: PipelineStage[];
  agents: AgentTelemetry[];
  diff: {
    baseline_code: string;
    mutated_code: string;
    unified_patch: string;
    commit_sha: string;
    commit_message: string;
    verdict: "PASSED" | "REVERTED" | "QUARANTINED" | "PENDING";
    perf_delta: {
      cpu: string;
      memory: string;
      time: string;
    };
  };
  forensic: {
    has_regression: boolean;
    root_commit?: string;
    minimal_diff?: string;
    bisect_path?: Array<{ step: number; commit: string; status: "BAD" | "GOOD"; log: string }>;
    attribution_matrix: {
      SPEC: string;
      ARCH: string;
      AST: string;
      EXEC: string;
    };
    causal_rules: string[];
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  severity: "INFO" | "WARN" | "PASS" | "FAIL" | "REVERT";
  message: string;
}

interface EvaluationDashboardProps {
  onBackToNewEvaluation?: () => void;
  initialScenario?: string;
}

const DEFAULT_EVALUATION: EvaluationData = {
  evaluation_id: "eval-default-convergence",
  project_name: "data_pipeline.py (Production Optimizer)",
  language: "Python 3.14",
  status: "CONVERGED",
  start_time: "2026-11-22 01:51:33 UTC",
  end_time: "2026-11-22 01:51:36 UTC",
  metrics: {
    issues_detected: 0,
    mutations_generated: 2,
    mutations_verified: 2,
    progress: 100,
  },
  pipeline: [
    { name: "Repository Ingestion", status: "completed", duration: "142ms", summary: "Baseline software ingested from Git" },
    { name: "Baseline Analysis", status: "completed", duration: "98ms", summary: "Parent-Contract-Hash synchronized" },
    { name: "Agent Coordination", status: "completed", duration: "215ms", summary: "Transformer Coordinator allocated isolated worktrees" },
    { name: "Code Transformation", status: "completed", duration: "380ms", summary: "Slots injection and list comprehension vectorization applied" },
    { name: "Post-Commit Evaluation", status: "completed", duration: "460ms", summary: "Contract separation OK, 3/3 tests passed, CPU -34.2%" },
    { name: "Forensic Grading", status: "completed", duration: "180ms", summary: "Verdict: PRAISE (+1.0 reward). Zero-LLM Proof." },
    { name: "Patch Review", status: "completed", duration: "55ms", summary: "Verified patch synthesized and available for export" },
  ],
  agents: [
    {
      name: "AST Agent",
      tier: "AST",
      worktree: ".worktrees/evo-gen1-ast",
      branch: "evo/gen1/ast-ast-mutator-01",
      transformations: ["SlotsInjection", "ListCompVectorizer", "ConstantFolding"],
      pass_rate: "100%",
      status: "Active",
    },
    {
      name: "Bytecode Agent",
      tier: "EXEC",
      worktree: ".worktrees/evo-gen2-exec",
      branch: "evo/gen2/exec-exec-mutator-01",
      transformations: ["OpcodeOptimizer", "GlobalBindingCache"],
      pass_rate: "100%",
      status: "Standby",
    },
    {
      name: "Script Agent",
      tier: "ARCH",
      worktree: ".worktrees/evo-gen3-arch",
      branch: "evo/gen3/arch-arch-mutator-01",
      transformations: ["SetMembershipAcceleration", "FStringModernizer"],
      pass_rate: "100%",
      status: "Standby",
    },
  ],
  diff: {
    baseline_code: `class Record:\n    def __init__(self, name, value):\n        self.name = name\n        self.value = value\n\nclass DataPipeline:\n    def __init__(self):\n        self.records = []\n        self.valid_types = ["A", "B", "C", "D"]\n\n    def process(self, items):\n        result = []\n        for item in items:\n            result.append(item * 2)\n        return result\n\n    def filter_valid(self, records):\n        output = []\n        for r in records:\n            if r.name in ["A", "B", "C", "D"]:\n                output.append(r)\n        return output\n\n    def compute_stats(self):\n        BATCH_SIZE = 32 * 1024\n        TIMEOUT = 60 * 60 * 24\n        return {"batch": BATCH_SIZE, "timeout": TIMEOUT}`,
    mutated_code: `class Record:\n    __slots__ = ('name', 'value')\n\n    def __init__(self, name, value):\n        self.name = name\n        self.value = value\n\nclass DataPipeline:\n    __slots__ = ('records', 'valid_types')\n\n    def __init__(self):\n        self.records = []\n        self.valid_types = ['A', 'B', 'C', 'D']\n\n    def process(self, items):\n        result = [item * 2 for item in items]\n        return result\n\n    def filter_valid(self, records):\n        output = []\n        for r in records:\n            if r.name in ['A', 'B', 'C', 'D']:\n                output.append(r)\n        return output\n\n    def compute_stats(self):\n        BATCH_SIZE = 32768\n        TIMEOUT = 86400\n        return {'batch': BATCH_SIZE, 'timeout': TIMEOUT}`,
    unified_patch: `--- baseline/data_pipeline.py\n+++ mutated/data_pipeline.py\n@@ -1,27 +1,29 @@\n class Record:\n+    __slots__ = ('name', 'value')\n+\n     def __init__(self, name, value):\n         self.name = name\n         self.value = value\n \n class DataPipeline:\n+    __slots__ = ('records', 'valid_types')\n+\n     def __init__(self):\n         self.records = []\n-        self.valid_types = ["A", "B", "C", "D"]\n+        self.valid_types = ['A', 'B', 'C', 'D']\n \n     def process(self, items):\n-        result = []\n-        for item in items:\n-            result.append(item * 2)\n+        result = [item * 2 for item in items]\n         return result\n \n     def filter_valid(self, records):\n         output = []\n         for r in records:\n-            if r.name in ["A", "B", "C", "D"]:\n+            if r.name in ['A', 'B', 'C', 'D']:\n                 output.append(r)\n         return output\n \n     def compute_stats(self):\n-        BATCH_SIZE = 32 * 1024\n-        TIMEOUT = 60 * 60 * 24\n-        return {"batch": BATCH_SIZE, "timeout": TIMEOUT}\n+        BATCH_SIZE = 32768\n+        TIMEOUT = 86400\n+        return {'batch': BATCH_SIZE, 'timeout': TIMEOUT}`,
    commit_sha: "21ae5bd26861435228cbe3b5847eede48fa746a3",
    commit_message: "ast(Vectorize): loop to list comprehension & slots injection",
    verdict: "PASSED",
    perf_delta: {
      cpu: "-34.2%",
      memory: "-18.7%",
      time: "-28.5ms",
    },
  },
  forensic: {
    has_regression: false,
    attribution_matrix: {
      SPEC: "Contract Guard: Invariants Satisfied (No SLA breaches)",
      ARCH: "Architecture Integrity: Clean",
      AST: "Structural Mutations: Verified (Slots + ListComp)",
      EXEC: "Runtime Execution: Verified (0 regressions, 3/3 tests passed)",
    },
    causal_rules: [
      "Rule-AST-01: __slots__ injection reduces per-instance memory allocation by 22%",
      "Rule-AST-02: List comprehension vectorization optimizes opcode looping overhead",
    ],
  },
};

export default function EvaluationDashboardView({
  onBackToNewEvaluation,
  initialScenario = "A",
}: EvaluationDashboardProps) {
  const [evaluation, setEvaluation] = useState<EvaluationData>(DEFAULT_EVALUATION);
  const [isRunning, setIsRunning] = useState(false);
  const [diffViewMode, setDiffViewMode] = useState<"unified" | "side-by-side">("unified");
  const [activeAgentTab, setActiveAgentTab] = useState<number>(0);
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [autoScrollLog, setAutoScrollLog] = useState(true);

  // Terminal Logs State
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: "01:51:33", severity: "INFO", message: "Bugsmith Evaluation Engine initialized [Eval ID: eval-default-convergence]" },
    { id: "2", timestamp: "01:51:33", severity: "INFO", message: "Stage 1 [Ingestion]: Source repository baseline ingested." },
    { id: "3", timestamp: "01:51:34", severity: "INFO", message: "Stage 2 [Baseline]: Synchronizing Parent-Contract-Hash and compiling AST..." },
    { id: "4", timestamp: "01:51:34", severity: "INFO", message: "Stage 3 [Coordination]: Isolated worktrees allocated off main_sha." },
    { id: "5", timestamp: "01:51:35", severity: "INFO", message: "Stage 4 [Transform]: AST Agent applied slots injection and list comprehension." },
    { id: "6", timestamp: "01:51:35", severity: "PASS", message: "Stage 5 [Evaluation]: All 3 unit tests passed. CPU -34.2%, Memory -18.7%." },
    { id: "7", timestamp: "01:51:36", severity: "PASS", message: "Stage 6 [Forensic]: Verdict: PRAISE (+1.0 reward). Candidate promoted to main." },
    { id: "8", timestamp: "01:51:36", severity: "PASS", message: "Stage 7 [Review]: Verified patch ready for export." },
  ]);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log
  useEffect(() => {
    if (autoScrollLog && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScrollLog]);

  // Connect to SSE stream
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource("http://localhost:8000/stream");
      evtSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.node === "log") {
            setLogs((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                timestamp: data.timestamp || new Date().toLocaleTimeString(),
                severity: data.severity || "INFO",
                message: data.message || "",
              },
            ]);
          } else if (data.node === "eval_start") {
            setIsRunning(true);
            setEvaluation((prev) => ({
              ...prev,
              evaluation_id: data.evaluation_id,
              project_name: data.project_name || prev.project_name,
              status: "RUNNING",
              start_time: data.start_time,
              metrics: { ...prev.metrics, progress: 15 },
            }));
          } else if (data.node === "stage_update") {
            setEvaluation((prev) => {
              const updatedStages = [...prev.pipeline];
              if (updatedStages[data.stage_idx]) {
                updatedStages[data.stage_idx] = {
                  ...updatedStages[data.stage_idx],
                  status: data.status,
                  duration: data.duration || updatedStages[data.stage_idx].duration,
                  summary: data.summary || updatedStages[data.stage_idx].summary,
                };
              }
              const progressCalc = Math.min(
                100,
                Math.round(((data.stage_idx + 1) / updatedStages.length) * 100)
              );
              return {
                ...prev,
                pipeline: updatedStages,
                metrics: { ...prev.metrics, progress: progressCalc },
              };
            });
          } else if (data.node === "evaluation_complete" && data.evaluation) {
            setIsRunning(false);
            setEvaluation(data.evaluation);
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch {
      // fallback
    }

    // Also fetch initial latest evaluation from backend with catch-up polling
    const fetchLatest = () => {
      fetch("http://localhost:8000/api/evaluation/latest")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.evaluation_id) {
            setEvaluation(data);
          }
        })
        .catch(() => {});
    };

    fetchLatest();
    const timer1 = setTimeout(fetchLatest, 1000);
    const timer2 = setTimeout(fetchLatest, 2500);

    return () => {
      if (evtSource) evtSource.close();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Trigger evaluation
  const handleRunEvaluation = async (scenarioId: "A" | "B" | "C" | "custom") => {
    setIsRunning(true);
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        severity: "INFO",
        message: `Operator triggered ${scenarioId === "custom" ? "Custom Ingested Codebase" : `Scenario ${scenarioId}`} evaluation...`,
      },
    ]);

    try {
      const res = await fetch("http://localhost:8000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: scenarioId,
          evaluation_id: `eval-${Date.now().toString(36)}`,
          project_name:
            scenarioId === "A"
              ? "data_pipeline.py (AST & EXEC Convergence)"
              : scenarioId === "B"
              ? "math_kernel.py (Multi-Hunk Regression Bisect)"
              : scenarioId === "C"
              ? "solver.py (Anti-Goodhart Tamper Defense)"
              : "Custom Ingested Codebase",
        }),
      });
      if (res.ok) {
        // Poll for completion after 2.5s
        setTimeout(async () => {
          try {
            const latest = await fetch("http://localhost:8000/api/evaluation/latest");
            if (latest.ok) {
              const data = await latest.json();
              if (data && data.evaluation_id) {
                setEvaluation(data);
                setIsRunning(false);
              }
            }
          } catch {}
        }, 2500);
      }
    } catch {
      setIsRunning(false);
    }
  };

  // Cancel evaluation
  const handleCancelEvaluation = async () => {
    try {
      await fetch("http://localhost:8000/api/evaluate/cancel", { method: "POST" });
      setIsRunning(false);
      setEvaluation((prev) => ({ ...prev, status: "INITIALIZED" }));
    } catch {}
  };

  // Copy Commit SHA
  const handleCopySha = () => {
    if (evaluation.diff?.commit_sha) {
      navigator.clipboard.writeText(evaluation.diff.commit_sha);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  // Download Patch (.patch)
  const handleDownloadPatch = () => {
    const patchContent =
      evaluation.diff?.unified_patch ||
      `# Bugsmith Verified Patch\n# Commit: ${evaluation.diff.commit_sha}\n# Verdict: ${evaluation.diff.verdict}\n\n${evaluation.diff.mutated_code}`;
    const blob = new Blob([patchContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bugsmith-patch-${evaluation.diff.commit_sha.slice(0, 8)}.patch`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Evaluation Report (JSON)
  const handleExportReport = () => {
    const jsonStr = JSON.stringify(evaluation, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bugsmith-evaluation-report-${evaluation.evaluation_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONVERGED":
      case "COMPLETED":
        return "text-[#42D99A] bg-[#42D99A]/10 border-[#42D99A]/40";
      case "RUNNING":
        return "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/40 animate-pulse";
      case "REGRESSION_DETECTED":
        return "text-[#F5B84B] bg-[#F5B84B]/10 border-[#F5B84B]/40";
      case "TAMPER_BLOCKED":
        return "text-[#F16B6B] bg-[#F16B6B]/10 border-[#F16B6B]/40";
      default:
        return "text-[#8B98A8] bg-[#151E29] border-[#263341]";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "PASS":
        return "bg-[#42D99A]/20 text-[#42D99A] border-[#42D99A]/40";
      case "FAIL":
        return "bg-[#F16B6B]/20 text-[#F16B6B] border-[#F16B6B]/40";
      case "WARN":
        return "bg-[#F5B84B]/20 text-[#F5B84B] border-[#F5B84B]/40";
      case "REVERT":
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
      default:
        return "bg-[#38bdf8]/20 text-[#38bdf8] border-[#38bdf8]/40";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. TOP STATUS BAR */}
      <div className="bg-[#101720] border border-[#263341] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase border ${getStatusColor(evaluation.status)}`}>
                ● {evaluation.status}
              </span>
              <span className="text-xs font-mono text-[#8B98A8]">
                Lang: <span className="text-[#F4F7FA]">{evaluation.language}</span>
              </span>
              <span className="text-xs font-mono text-[#8B98A8] hidden sm:inline">
                Started: <span className="text-[#F4F7FA]">{evaluation.start_time}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <h1 className="text-lg sm:text-xl font-bold text-[#F4F7FA] tracking-tight">
                {evaluation.project_name}
              </h1>
              <span className="text-xs font-mono text-[#8B98A8] bg-[#080B10] px-2 py-0.5 rounded border border-[#263341]">
                ID: {evaluation.evaluation_id}
              </span>
            </div>
          </div>

          {/* Action Bar (Top Right) */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onBackToNewEvaluation && (
              <button
                type="button"
                onClick={onBackToNewEvaluation}
                className="px-3.5 py-2 rounded text-xs font-medium text-[#8B98A8] hover:text-[#F4F7FA] bg-[#151E29] hover:bg-[#263341] border border-[#263341] transition flex items-center gap-1.5"
              >
                <span>← New Submission</span>
              </button>
            )}

            {isRunning ? (
              <button
                type="button"
                onClick={handleCancelEvaluation}
                className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-[#F16B6B] bg-[#F16B6B]/10 hover:bg-[#F16B6B]/20 border border-[#F16B6B]/40 transition flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#F16B6B] animate-ping" />
                <span>Cancel Run</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleRunEvaluation("custom")}
                className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-[#080B10] bg-[#42D99A] hover:bg-[#38c287] transition shadow-[0_0_15px_rgba(66,217,154,0.3)] flex items-center gap-1.5"
              >
                <span>Rerun Evaluation ↻</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Scenario Trigger Bar (Judges / Operator Panel) */}
        <div className="pt-3 border-t border-[#263341] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#8B98A8] font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#42D99A]" />
            <span>Interactive Scenario Triggers:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => handleRunEvaluation("A")}
              className="px-3 py-1.5 rounded text-xs font-mono bg-[#151E29] hover:bg-[#263341] text-[#42D99A] border border-[#263341] hover:border-[#42D99A]/50 transition disabled:opacity-50"
            >
              ▶ Scenario A: Convergence (AST + EXEC)
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => handleRunEvaluation("B")}
              className="px-3 py-1.5 rounded text-xs font-mono bg-[#151E29] hover:bg-[#263341] text-[#F5B84B] border border-[#263341] hover:border-[#F5B84B]/50 transition disabled:opacity-50"
            >
              ▶ Scenario B: Multi-Hunk Bisect + ddmin
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => handleRunEvaluation("C")}
              className="px-3 py-1.5 rounded text-xs font-mono bg-[#151E29] hover:bg-[#263341] text-[#F16B6B] border border-[#263341] hover:border-[#F16B6B]/50 transition disabled:opacity-50"
            >
              🛡️ Scenario C: Anti-Goodhart Defense
            </button>
          </div>
        </div>
      </div>

      {/* 2. EVALUATION METRICS (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Issues Detected */}
        <div className="p-4 rounded-lg bg-[#101720] border border-[#263341] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8B98A8]">1. Issues Detected</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                evaluation.metrics.issues_detected === 0
                  ? "bg-[#42D99A] shadow-[0_0_8px_#42D99A]"
                  : "bg-[#F16B6B] shadow-[0_0_8px_#F16B6B]"
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#F4F7FA]">
              {evaluation.metrics.issues_detected}
            </span>
            <span className="text-[11px] text-[#8B98A8]">
              {evaluation.metrics.issues_detected === 0 ? "0 regressions" : "Isolated via Bisect"}
            </span>
          </div>
        </div>

        {/* Metric 2: Mutations Generated */}
        <div className="p-4 rounded-lg bg-[#101720] border border-[#263341] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8B98A8]">2. Mutations Generated</span>
            <span className="text-[10px] font-mono text-[#38bdf8] bg-[#38bdf8]/10 px-1.5 py-0.5 rounded border border-[#38bdf8]/30">
              Swarm
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#F4F7FA]">
              {evaluation.metrics.mutations_generated}
            </span>
            <span className="text-[11px] text-[#8B98A8]">AST + EXEC + ARCH</span>
          </div>
        </div>

        {/* Metric 3: Mutations Verified */}
        <div className="p-4 rounded-lg bg-[#101720] border border-[#263341] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8B98A8]">3. Mutations Verified</span>
            <span className="text-[10px] font-mono text-[#42D99A] bg-[#42D99A]/10 px-1.5 py-0.5 rounded border border-[#42D99A]/30">
              Deterministic
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#42D99A]">
              {evaluation.metrics.mutations_verified}
            </span>
            <span className="text-[11px] text-[#8B98A8]">Passed Zero-LLM gates</span>
          </div>
        </div>

        {/* Metric 4: Evaluation Progress */}
        <div className="p-4 rounded-lg bg-[#101720] border border-[#263341] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8B98A8]">4. Progress</span>
            <span className="text-xs font-mono font-bold text-[#42D99A]">
              {evaluation.metrics.progress}%
            </span>
          </div>
          <div className="w-full bg-[#080B10] h-2 rounded-full overflow-hidden border border-[#263341]">
            <div
              className="bg-[#42D99A] h-full transition-all duration-500 rounded-full shadow-[0_0_8px_#42D99A]"
              style={{ width: `${evaluation.metrics.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. PIPELINE VISUALIZATION (7 STAGES) */}
      <div className="bg-[#101720] border border-[#263341] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#263341] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#42D99A]" />
            <h2 className="text-xs font-mono uppercase font-bold text-[#F4F7FA] tracking-wider">
              Deterministic 7-Stage Verification Pipeline
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#8B98A8]">
            Git-Based Ephemeral Worktree Lifecycle
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
          {evaluation.pipeline.map((stage, idx) => {
            const isCompleted = stage.status === "completed";
            const isRunningStage = stage.status === "running";
            const isFailed = stage.status === "failed";

            return (
              <div
                key={stage.name}
                className={`p-3 rounded-md border flex flex-col justify-between transition-all ${
                  isRunningStage
                    ? "bg-[#151E29] border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                    : isFailed
                    ? "bg-[#F16B6B]/5 border-[#F16B6B]/40"
                    : isCompleted
                    ? "bg-[#151E29] border-[#42D99A]/30"
                    : "bg-[#080B10]/60 border-[#263341]"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#8B98A8]">0{idx + 1}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRunningStage
                          ? "bg-[#38bdf8] animate-ping"
                          : isFailed
                          ? "bg-[#F16B6B]"
                          : isCompleted
                          ? "bg-[#42D99A]"
                          : "bg-[#263341]"
                      }`}
                    />
                  </div>
                  <div className="text-xs font-semibold text-[#F4F7FA] leading-tight">
                    {stage.name}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#263341]/60 flex items-center justify-between text-[10px] font-mono">
                  <span
                    className={
                      isFailed
                        ? "text-[#F16B6B]"
                        : isCompleted
                        ? "text-[#42D99A]"
                        : isRunningStage
                        ? "text-[#38bdf8]"
                        : "text-[#8B98A8]"
                    }
                  >
                    {stage.status.toUpperCase()}
                  </span>
                  <span className="text-[#8B98A8]">{stage.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN SPLIT: (Left: Live Activity Log & Forensic View) + (Right: Agent Telemetry & Code Diff) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Live Terminal Log + Forensic Grading View */}
        <div className="space-y-6">
          {/* Live Activity Log */}
          <div className="bg-[#101720] border border-[#263341] rounded-lg overflow-hidden shadow-sm flex flex-col h-[340px]">
            <div className="px-4 py-3 bg-[#151E29] border-b border-[#263341] flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-[#F4F7FA]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#42D99A] animate-pulse" />
                <span className="font-bold">Live Activity Log & Forensic Console</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAutoScrollLog(!autoScrollLog)}
                  className={`text-[11px] font-mono px-2 py-0.5 rounded border transition ${
                    autoScrollLog
                      ? "text-[#42D99A] border-[#42D99A]/40 bg-[#42D99A]/10"
                      : "text-[#8B98A8] border-[#263341]"
                  }`}
                >
                  {autoScrollLog ? "Auto-Scroll: ON" : "Auto-Scroll: OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-[11px] font-mono text-[#8B98A8] hover:text-[#F4F7FA]"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 bg-[#020617] overflow-y-auto font-mono text-xs space-y-2 select-text">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-zinc-500 text-[11px] shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 border ${getSeverityBadge(
                      log.severity
                    )}`}
                  >
                    {log.severity}
                  </span>
                  <span className="text-zinc-300 break-all">{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Forensic Grading View (Bisect, ddmin, 2D Attribution) */}
          <div className="bg-[#101720] border border-[#263341] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#263341] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔍</span>
                <h3 className="text-xs font-mono uppercase font-bold text-[#F4F7FA] tracking-wider">
                  Forensic Grading & Root-Cause Attribution
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#42D99A]">
                Deterministic Zero-LLM Bisect
              </span>
            </div>

            {/* 2D Attribution Matrix Swimlanes */}
            <div className="space-y-2 text-xs font-mono">
              <div className="text-[11px] text-[#8B98A8] uppercase tracking-wider font-semibold">
                2D Attribution Matrix:
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-2.5 rounded bg-[#080B10] border-l-4 border-pink-500 flex items-center justify-between">
                  <span className="text-pink-400 font-bold">[SPEC]</span>
                  <span className="text-zinc-300 text-[11px]">
                    {evaluation.forensic?.attribution_matrix?.SPEC || "Contract Guard: Invariants Synced"}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#080B10] border-l-4 border-cyan-400 flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">[ARCH]</span>
                  <span className="text-zinc-300 text-[11px]">
                    {evaluation.forensic?.attribution_matrix?.ARCH || "Architecture Integrity: Clean"}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#080B10] border-l-4 border-[#42D99A] flex items-center justify-between">
                  <span className="text-[#42D99A] font-bold">[AST]</span>
                  <span className="text-zinc-300 text-[11px]">
                    {evaluation.forensic?.attribution_matrix?.AST || "Structural Mutations: Verified"}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#080B10] border-l-4 border-amber-400 flex items-center justify-between">
                  <span className="text-amber-400 font-bold">[EXEC]</span>
                  <span className="text-zinc-300 text-[11px]">
                    {evaluation.forensic?.attribution_matrix?.EXEC || "Runtime Execution: Verified"}
                  </span>
                </div>
              </div>
            </div>

            {/* If Regression Detected: show ddmin minimal diff & Git Bisect path */}
            {evaluation.forensic?.has_regression && (
              <div className="p-4 rounded-lg bg-[#F16B6B]/10 border border-[#F16B6B]/30 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#F16B6B] font-bold">
                  <span>⚠ REGRESSION DETECTED & ISOLATED</span>
                </div>

                {evaluation.forensic?.root_commit && (
                  <div className="text-zinc-300">
                    <span className="text-[#8B98A8]">Root Bad Commit:</span>{" "}
                    <span className="text-[#F16B6B] font-bold">
                      {evaluation.forensic.root_commit.slice(0, 8)}
                    </span>
                  </div>
                )}

                {evaluation.forensic?.minimal_diff && (
                  <div className="space-y-1">
                    <span className="text-[#8B98A8] text-[11px] block">
                      ddmin Minimal Culprit Hunk (Delta Reduction):
                    </span>
                    <pre className="p-2 rounded bg-[#080B10] text-[#F16B6B] border border-[#F16B6B]/40 text-[11px] overflow-x-auto">
                      {evaluation.forensic.minimal_diff}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Causal Rules Minted */}
            {evaluation.forensic?.causal_rules && evaluation.forensic.causal_rules.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#263341] text-xs font-mono">
                <span className="text-[11px] text-[#8B98A8] uppercase tracking-wider font-semibold">
                  Causal Memory Rules Persisted:
                </span>
                <ul className="space-y-1 text-zinc-300 text-[11px]">
                  {evaluation.forensic.causal_rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-[#42D99A]">✓</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Agent Telemetry Panel + Code Diff Viewer */}
        <div className="space-y-6">
          {/* Agent Telemetry Panel */}
          <div className="bg-[#101720] border border-[#263341] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#263341] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <h3 className="text-xs font-mono uppercase font-bold text-[#F4F7FA] tracking-wider">
                  Agent Telemetry & Isolated Worktrees
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#42D99A]">
                {evaluation.agents.length} Swarm Agents
              </span>
            </div>

            {/* Agent Select Tabs */}
            <div className="flex items-center gap-1.5 border-b border-[#263341] pb-2">
              {evaluation.agents.map((agent, i) => (
                <button
                  key={agent.name}
                  type="button"
                  onClick={() => setActiveAgentTab(i)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition ${
                    activeAgentTab === i
                      ? "bg-[#151E29] text-[#42D99A] border border-[#42D99A]/40"
                      : "text-[#8B98A8] hover:text-[#F4F7FA]"
                  }`}
                >
                  {agent.name} ({agent.tier})
                </button>
              ))}
            </div>

            {/* Active Agent Telemetry Card */}
            {evaluation.agents[activeAgentTab] && (
              <div className="p-4 rounded-md bg-[#080B10] border border-[#263341] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F4F7FA]">
                      {evaluation.agents[activeAgentTab].name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#151E29] text-[#42D99A] border border-[#263341]">
                      Tier: {evaluation.agents[activeAgentTab].tier}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#42D99A] font-semibold">
                    Status: {evaluation.agents[activeAgentTab].status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#8B98A8] block">Assigned Worktree:</span>
                    <span className="text-zinc-300">{evaluation.agents[activeAgentTab].worktree}</span>
                  </div>
                  <div>
                    <span className="text-[#8B98A8] block">Git Branch:</span>
                    <span className="text-zinc-300">{evaluation.agents[activeAgentTab].branch}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#8B98A8] text-[11px] block mb-1">
                    Proposed Transformations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {evaluation.agents[activeAgentTab].transformations.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#151E29] text-zinc-300 border border-[#263341]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#263341] flex items-center justify-between text-[11px]">
                  <span className="text-[#8B98A8]">Verification Pass Rate:</span>
                  <span className="font-bold text-[#42D99A]">
                    {evaluation.agents[activeAgentTab].pass_rate}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Code Diff & Verification Panel */}
          <div className="bg-[#101720] border border-[#263341] rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#263341] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">📝</span>
                <h3 className="text-xs font-mono uppercase font-bold text-[#F4F7FA] tracking-wider">
                  Code Diff & Verification Verdict
                </h3>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center p-0.5 rounded bg-[#080B10] border border-[#263341]">
                <button
                  type="button"
                  onClick={() => setDiffViewMode("unified")}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                    diffViewMode === "unified"
                      ? "bg-[#151E29] text-[#42D99A]"
                      : "text-[#8B98A8] hover:text-[#F4F7FA]"
                  }`}
                >
                  Unified Diff
                </button>
                <button
                  type="button"
                  onClick={() => setDiffViewMode("side-by-side")}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                    diffViewMode === "side-by-side"
                      ? "bg-[#151E29] text-[#42D99A]"
                      : "text-[#8B98A8] hover:text-[#F4F7FA]"
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            {/* Commit Meta & Performance Delta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-[#080B10] border border-[#263341] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#8B98A8]">Commit Hash:</span>
                  <button
                    type="button"
                    onClick={handleCopySha}
                    className="text-[#42D99A] hover:underline"
                  >
                    {copiedSha ? "Copied!" : "Copy SHA"}
                  </button>
                </div>
                <div className="text-zinc-200 font-bold truncate">
                  {evaluation.diff?.commit_sha || "HEAD"}
                </div>
                <div className="text-[11px] text-[#8B98A8] truncate">
                  {evaluation.diff?.commit_message}
                </div>
              </div>

              <div className="p-3 rounded bg-[#080B10] border border-[#263341] space-y-1">
                <div className="text-[#8B98A8]">Performance Delta:</div>
                <div className="flex items-center gap-3 pt-0.5">
                  <span className="text-[#42D99A] font-bold">
                    CPU: {evaluation.diff?.perf_delta?.cpu || "0%"}
                  </span>
                  <span className="text-[#42D99A] font-bold">
                    Mem: {evaluation.diff?.perf_delta?.memory || "0%"}
                  </span>
                  <span className="text-[#42D99A] font-bold">
                    Time: {evaluation.diff?.perf_delta?.time || "0ms"}
                  </span>
                </div>
              </div>
            </div>

            {/* Diff Content Viewer */}
            {diffViewMode === "unified" ? (
              <pre className="p-4 rounded-lg bg-[#020617] border border-[#263341] font-mono text-xs text-zinc-300 overflow-x-auto max-h-[300px] leading-relaxed">
                {evaluation.diff?.unified_patch.split("\n").map((line, idx) => {
                  const isAdd = line.startsWith("+") && !line.startsWith("+++");
                  const isDel = line.startsWith("-") && !line.startsWith("---");
                  return (
                    <div
                      key={idx}
                      className={
                        isAdd
                          ? "bg-[#42D99A]/15 text-[#42D99A] px-1 rounded-xs"
                          : isDel
                          ? "bg-[#F16B6B]/15 text-[#F16B6B] px-1 rounded-xs"
                          : ""
                      }
                    >
                      {line}
                    </div>
                  );
                })}
              </pre>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                <div>
                  <span className="text-[11px] font-mono text-[#8B98A8] block mb-1">
                    Baseline Code (v0):
                  </span>
                  <pre className="p-3 rounded bg-[#020617] border border-[#263341] font-mono text-[11px] text-zinc-400 overflow-x-auto">
                    {evaluation.diff?.baseline_code}
                  </pre>
                </div>
                <div>
                  <span className="text-[11px] font-mono text-[#42D99A] block mb-1">
                    Mutated / Verified Code:
                  </span>
                  <pre className="p-3 rounded bg-[#020617] border border-[#42D99A]/30 font-mono text-[11px] text-[#F4F7FA] overflow-x-auto">
                    {evaluation.diff?.mutated_code}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. PATCH EXPORT & ACTION BAR */}
      <div className="bg-[#101720] border border-[#263341] rounded-lg p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#42D99A]" />
            <span className="text-[#F4F7FA] font-bold">Verified Code Transformation Ready</span>
          </div>
          <span className="text-[#8B98A8] text-[11px]">
            Target SHA: {evaluation.diff?.commit_sha?.slice(0, 10)} | Verdict: {evaluation.diff?.verdict}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPatch}
            className="px-4 py-2.5 rounded text-xs font-mono font-bold bg-[#151E29] hover:bg-[#263341] text-[#42D99A] border border-[#42D99A]/40 transition flex items-center gap-1.5"
          >
            <span>Download Patch (.patch)</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="px-4 py-2.5 rounded text-xs font-mono font-bold bg-[#151E29] hover:bg-[#263341] text-[#F4F7FA] border border-[#263341] transition flex items-center gap-1.5"
          >
            <span>{copiedReport ? "Exported Report!" : "Export Report (JSON)"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleRunEvaluation("custom")}
            className="px-5 py-2.5 rounded text-xs font-bold uppercase tracking-wider bg-[#42D99A] hover:bg-[#38c287] text-[#080B10] transition shadow-[0_0_15px_rgba(66,217,154,0.3)] flex items-center gap-1.5"
          >
            <span>Apply to Repository →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
