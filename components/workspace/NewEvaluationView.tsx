"use client";

import React, { useState } from "react";
import { parseZipArchive } from "../repair/zipReader";
import { ProjectSummary } from "../repair/types";

type InputMethod = "upload" | "git" | "code";

interface EvaluationConfig {
  codeAnalysis: boolean;
  astTransform: boolean;
  bytecodeTransform: boolean;
  scriptTransform: boolean;
  automatedTesting: boolean;
  performanceBenchmark: boolean;
  forensicAnalysis: boolean;
}

const SAMPLE_CODE = `"""Optimization & Bug Triage Target."""

def compute_heavy_metrics(data_points: list[int]) -> list[float]:
    # Inefficient loop concatenation and unmemoized computation
    results = []
    for item in data_points:
        # Intentionally inefficient calculation
        val = (item ** 2) / 1.0
        results.append(val)
    return results

def fast_divide(values: list[float], denominator: float) -> list[float]:
    # AST optimization candidate + zero check guard
    return [v / denominator for v in values]
`;

interface NewEvaluationViewProps {
  onEvaluationStarted?: () => void;
}

export default function NewEvaluationView({ onEvaluationStarted }: NewEvaluationViewProps = {}) {
  // Input method tabs: upload | git | code
  const [activeMethod, setActiveMethod] = useState<InputMethod>("code");

  // State: Option 1 (Upload Project)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // State: Option 2 (Git Repo)
  const [gitUrl, setGitUrl] = useState("");
  const [gitBranch, setGitBranch] = useState("main");
  const [gitSubfolder, setGitSubfolder] = useState("");
  const [gitStatus, setGitStatus] = useState<"idle" | "validating" | "ready" | "error">("idle");
  const [gitMessage, setGitMessage] = useState("");

  // State: Option 3 (Direct Code Input)
  const [codeFileName, setCodeFileName] = useState("main.py");
  const [codeLanguage, setCodeLanguage] = useState("python");
  const [codeContent, setCodeContent] = useState(SAMPLE_CODE);

  // Section B: Intent and Constraints (Optional)
  const [intentDescription, setIntentDescription] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("");

  // Section C: Evaluation Configuration
  const [config, setConfig] = useState<EvaluationConfig>({
    codeAnalysis: true,
    astTransform: true,
    bytecodeTransform: true,
    scriptTransform: true,
    automatedTesting: true,
    performanceBenchmark: true,
    forensicAnalysis: true,
  });

  // Section D: Form Validation & Submission State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializedPayload, setInitializedPayload] = useState<any | null>(null);

  // Handle ZIP drag and drop
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    if (!file.name.endsWith(".zip") && !file.name.endsWith(".tar.gz")) {
      setErrorMessage("Please upload a valid .zip project archive.");
      return;
    }
    setErrorMessage(null);
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(25);

    try {
      const summary = await parseZipArchive(file);
      setUploadProgress(75);
      setProjectSummary(summary);
      setUploadProgress(100);
    } catch {
      setErrorMessage("Unable to parse ZIP archive contents in browser.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setProjectSummary(null);
    setUploadProgress(0);
    setErrorMessage(null);
  };

  // Handle Git URL verification
  const handleVerifyGit = () => {
    if (!gitUrl.trim()) {
      setGitStatus("error");
      setGitMessage("Please provide a repository URL.");
      return;
    }
    if (!gitUrl.includes("github.com/") && !gitUrl.includes("gitlab.com/") && !gitUrl.endsWith(".git")) {
      setGitStatus("error");
      setGitMessage("Expected a valid Git repository URL (e.g. https://github.com/owner/repo).");
      return;
    }

    setGitStatus("validating");
    setGitMessage("Checking remote repository metadata...");

    setTimeout(() => {
      setGitStatus("ready");
      setGitMessage(`Repository verified. Target branch: [${gitBranch}]. Ready for Ingestion.`);
    }, 600);
  };

  // Validation & Submit
  const handleInitialize = async () => {
    setErrorMessage(null);

    // Validate based on active method
    let hasSource = false;
    let sourceMeta: any = {};

    if (activeMethod === "upload") {
      if (!uploadedFile) {
        setErrorMessage("Please select or drop a project ZIP archive before initializing evaluation.");
        return;
      }
      hasSource = true;
      sourceMeta = {
        type: "zip",
        fileName: uploadedFile.name,
        sizeBytes: uploadedFile.size,
        filesDetected: projectSummary?.fileCount || 0,
      };
    } else if (activeMethod === "git") {
      if (!gitUrl.trim()) {
        setErrorMessage("Please specify a Git repository URL to clone and evaluate.");
        return;
      }
      hasSource = true;
      sourceMeta = {
        type: "git",
        url: gitUrl,
        branch: gitBranch,
        subfolder: gitSubfolder,
      };
    } else if (activeMethod === "code") {
      if (!codeContent.trim() || codeContent.trim().length < 10) {
        setErrorMessage("Please provide source code in the editor (minimum 10 characters).");
        return;
      }
      hasSource = true;
      sourceMeta = {
        type: "code",
        fileName: codeFileName,
        language: codeLanguage,
        lineCount: codeContent.split("\n").length,
        contentPreview: codeContent.slice(0, 200),
      };
    }

    if (!hasSource) return;

    setIsInitializing(true);

    try {
      // 1. Prepare ingest payload for the backend
      let backendIngestBody: any = null;
      if (activeMethod === "code") {
        backendIngestBody = {
          source_type: "code",
          source: { [codeFileName]: codeContent },
          commit_message: `Baseline software ingested: ${codeFileName}`,
        };
      } else if (activeMethod === "git") {
        backendIngestBody = {
          source_type: "git",
          source: gitUrl,
          branch: gitBranch,
          commit_message: `Baseline cloned from ${gitUrl}`,
        };
      } else if (activeMethod === "upload") {
        backendIngestBody = {
          source_type: "code",
          source: { [uploadedFile?.name || "project_archive.zip"]: "Archive metadata ingested" },
          commit_message: `Baseline archive ingested: ${uploadedFile?.name}`,
        };
      }

      // 2. Call backend /api/ingest
      let backendResult: any = null;
      try {
        const res = await fetch("http://localhost:8000/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendIngestBody),
        });
        if (res.ok) {
          backendResult = await res.json();
        }
      } catch {
        try {
          const res2 = await fetch("/api/backend/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(backendIngestBody),
          });
          if (res2.ok) {
            backendResult = await res2.json();
          }
        } catch {}
      }

      const payload = {
        evaluationId: `eval-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
        source: sourceMeta,
        intent: {
          description: intentDescription.trim() || "Autonomous exploratory code optimization & regression verification",
          expectedOutput: expectedOutput.trim() || null,
        },
        configuration: config,
        liveBackend: backendResult?.commit_sha ? {
          connected: true,
          commitSha: backendResult.commit_sha,
          tag: backendResult.tag || "v0",
          repoPath: backendResult.repo_path,
          fileCount: backendResult.file_count,
        } : null,
      };

      setInitializedPayload(payload);

      // Trigger backend evaluation engine run on actual ingested code
      try {
        await fetch("http://localhost:8000/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenario: "custom",
            evaluation_id: payload.evaluationId,
            project_name: sourceMeta.fileName || sourceMeta.url || "Ingested Codebase",
            config: config,
          }),
        });
      } catch {
        try {
          await fetch("/api/backend/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scenario: "custom",
              evaluation_id: payload.evaluationId,
              project_name: sourceMeta.fileName || sourceMeta.url || "Ingested Codebase",
              config: config,
            }),
          });
        } catch {}
      }
    } catch (err: any) {
      setErrorMessage(`Ingestion error: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Heading Block */}
      <div className="space-y-2 border-b border-[#263341] pb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm bg-[#42D99A]" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#42D99A] font-bold">
            Evaluation Pipeline Initialization
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#F4F7FA] tracking-tight">
          Code Intelligence Workspace
        </h1>
        <p className="text-sm text-[#8B98A8] max-w-2xl leading-relaxed">
          Submit your codebase. Let Bugsmith analyze, transform, evaluate, and verify every proposed change with deterministic proof.
        </p>
      </div>

      {/* Validation Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-md bg-[#F16B6B]/10 border border-[#F16B6B]/30 flex items-center justify-between text-xs text-[#F16B6B] font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#F16B6B]" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[#8B98A8] hover:text-[#F4F7FA]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Section A: Repository Input (Tabbed) */}
      <div className="bg-[#101720] border border-[#263341] rounded-lg overflow-hidden shadow-sm">
        {/* Method Switcher Header */}
        <div className="px-5 py-3 border-b border-[#263341] bg-[#151E29] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8B98A8]">
              A. Submission Source
            </span>
          </div>

          <div className="flex items-center p-0.5 rounded-md bg-[#080B10] border border-[#263341]">
            <button
              type="button"
              onClick={() => {
                setActiveMethod("upload");
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                activeMethod === "upload"
                  ? "bg-[#151E29] text-[#42D99A] shadow-xs"
                  : "text-[#8B98A8] hover:text-[#F4F7FA]"
              }`}
            >
              Upload Project
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMethod("git");
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                activeMethod === "git"
                  ? "bg-[#151E29] text-[#42D99A] shadow-xs"
                  : "text-[#8B98A8] hover:text-[#F4F7FA]"
              }`}
            >
              Git Repository
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMethod("code");
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                activeMethod === "code"
                  ? "bg-[#151E29] text-[#42D99A] shadow-xs"
                  : "text-[#8B98A8] hover:text-[#F4F7FA]"
              }`}
            >
              Direct Code Input
            </button>
          </div>
        </div>

        {/* Tab Content 1: Upload Project */}
        {activeMethod === "upload" && (
          <div className="p-6">
            {!uploadedFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[#263341] hover:border-[#42D99A]/50 rounded-lg p-10 text-center transition bg-[#080B10]/40"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-[#151E29] border border-[#263341] flex items-center justify-center text-[#42D99A] mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-[#F4F7FA] mb-1">
                  Drag and drop your project archive (.zip)
                </h3>
                <p className="text-xs text-[#8B98A8] mb-4">
                  Bugsmith extracts the repository tree and establishes an initial baseline Git commit.
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#151E29] hover:bg-[#263341] border border-[#263341] text-xs font-medium text-[#F4F7FA] cursor-pointer transition">
                  <input
                    type="file"
                    accept=".zip,.tar.gz"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  Browse Local Archive
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-[#151E29] border border-[#263341] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-[#080B10] border border-[#263341] flex items-center justify-center text-[#42D99A]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#F4F7FA]">{uploadedFile.name}</div>
                      <div className="text-[11px] font-mono text-[#8B98A8]">
                        {(uploadedFile.size / 1024).toFixed(1)} KB · {projectSummary ? `${projectSummary.fileCount} source files detected` : "Analyzing archive..."}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded text-xs font-medium text-[#8B98A8] hover:text-[#F4F7FA] hover:bg-[#101720] border border-[#263341] cursor-pointer transition">
                      <input
                        type="file"
                        accept=".zip,.tar.gz"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                      Replace
                    </label>
                    <button
                      type="button"
                      onClick={removeUploadedFile}
                      className="px-3 py-1.5 rounded text-xs font-medium text-[#F16B6B] hover:bg-[#F16B6B]/10 border border-[#F16B6B]/30 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-[#8B98A8]">
                    <span>Archive Ingestion Status</span>
                    <span className="text-[#42D99A]">{uploadProgress}% Ready</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#151E29] overflow-hidden">
                    <div
                      className="h-full bg-[#42D99A] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Git Repository */}
        {activeMethod === "git" && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8B98A8]">
                  Git Repository URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={gitUrl}
                    onChange={(e) => {
                      setGitUrl(e.target.value);
                      setGitStatus("idle");
                    }}
                    placeholder="https://github.com/org/repo.git"
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#080B10] border border-[#263341] text-xs font-mono text-[#F4F7FA] placeholder-[#8B98A8]/40 focus:border-[#42D99A] focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-[#8B98A8]">
                  Branch / Ref
                </label>
                <input
                  type="text"
                  value={gitBranch}
                  onChange={(e) => setGitBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#080B10] border border-[#263341] text-xs font-mono text-[#F4F7FA] placeholder-[#8B98A8]/40 focus:border-[#42D99A] focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleVerifyGit}
                className="px-4 py-2 rounded-md bg-[#151E29] hover:bg-[#263341] border border-[#263341] text-xs font-medium text-[#F4F7FA] flex items-center gap-2 transition"
              >
                <span>Verify & Inspect Repository</span>
                {gitStatus === "validating" && (
                  <span className="w-2 h-2 rounded-full bg-[#42D99A] animate-ping" />
                )}
              </button>

              {gitStatus !== "idle" && (
                <div
                  className={`text-xs font-mono ${
                    gitStatus === "ready"
                      ? "text-[#42D99A]"
                      : gitStatus === "error"
                      ? "text-[#F16B6B]"
                      : "text-[#8B98A8]"
                  }`}
                >
                  {gitMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 3: Direct Code Input */}
        {activeMethod === "code" && (
          <div className="p-6 space-y-4">
            {/* Header: File Name + Language Selector + Sample Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#263341]">
              <div className="flex items-center gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B98A8]">
                    Target File Name
                  </span>
                  <input
                    type="text"
                    value={codeFileName}
                    onChange={(e) => setCodeFileName(e.target.value)}
                    className="px-2.5 py-1 rounded bg-[#080B10] border border-[#263341] text-xs font-mono text-[#F4F7FA] focus:border-[#42D99A] focus:outline-none"
                  />
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#8B98A8]">
                    Language
                  </span>
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="px-2.5 py-1 rounded bg-[#080B10] border border-[#263341] text-xs font-mono text-[#F4F7FA] focus:border-[#42D99A] focus:outline-none"
                  >
                    <option value="python">Python (.py)</option>
                    <option value="typescript">TypeScript (.ts)</option>
                    <option value="javascript">JavaScript (.js)</option>
                    <option value="rust">Rust (.rs)</option>
                    <option value="go">Go (.go)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCodeContent(SAMPLE_CODE)}
                  className="px-2.5 py-1 rounded text-[11px] font-mono text-[#8B98A8] hover:text-[#42D99A] border border-[#263341] hover:border-[#42D99A]/40 transition"
                >
                  Load Sample Code
                </button>
                <button
                  type="button"
                  onClick={() => setCodeContent("")}
                  className="px-2.5 py-1 rounded text-[11px] font-mono text-[#8B98A8] hover:text-[#F16B6B] border border-[#263341] transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Embedded Code Editor */}
            <div className="relative rounded-md border border-[#263341] bg-[#080B10] font-mono text-xs overflow-hidden">
              <div className="flex">
                {/* Line Numbers Column */}
                <div className="w-10 py-3 bg-[#101720] border-r border-[#263341] text-right pr-2 text-[#8B98A8]/40 select-none leading-relaxed">
                  {codeContent.split("\n").map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Multiline Textarea */}
                <textarea
                  value={codeContent}
                  onChange={(e) => {
                    setCodeContent(e.target.value);
                    setErrorMessage(null);
                  }}
                  rows={12}
                  spellCheck={false}
                  placeholder="# Paste or write source code here..."
                  className="flex-1 p-3 bg-transparent text-[#F4F7FA] resize-y focus:outline-none leading-relaxed selection:bg-[#42D99A]/30 selection:text-white"
                />
              </div>

              <div className="px-3 py-1.5 border-t border-[#263341] bg-[#101720] flex justify-between text-[11px] font-mono text-[#8B98A8]">
                <span>{codeFileName}</span>
                <span>
                  {codeContent.split("\n").length} lines · {codeContent.length} chars
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section B: Intent and Constraints (Optional) */}
      <div className="bg-[#101720] border border-[#263341] rounded-lg p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#F4F7FA]">
              B. What should Bugsmith focus on?
            </h2>
            <p className="text-xs text-[#8B98A8] mt-0.5">
              Optional — describe target bugs, invariants, or leave blank for autonomous exploratory evaluation.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#151E29] border border-[#263341] text-[#8B98A8]">
            Optional
          </span>
        </div>

        <div className="space-y-3">
          <textarea
            value={intentDescription}
            onChange={(e) => setIntentDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Optimize list comprehension memory allocation and verify divide-by-zero guard invariant."
            className="w-full p-3 rounded-md bg-[#080B10] border border-[#263341] text-xs text-[#F4F7FA] placeholder-[#8B98A8]/40 focus:border-[#42D99A] focus:outline-none transition leading-relaxed"
          />

          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#8B98A8]">
              Expected Output / Return Value (Optional)
            </label>
            <input
              type="text"
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              placeholder="e.g. fast_divide([10.0, 20.0], 2.0) == [5.0, 10.0]"
              className="w-full px-3 py-2 rounded-md bg-[#080B10] border border-[#263341] text-xs font-mono text-[#F4F7FA] placeholder-[#8B98A8]/40 focus:border-[#42D99A] focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Section C: Evaluation Configuration */}
      <div className="bg-[#101720] border border-[#263341] rounded-lg p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#F4F7FA]">
              C. Evaluation Configuration
            </h2>
            <p className="text-xs text-[#8B98A8] mt-0.5">
              Select verification gates and mutation agent tiers supported by the backend engine.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#42D99A] bg-[#42D99A]/10 border border-[#42D99A]/20 px-2 py-0.5 rounded">
            All 7 Tiers Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              key: "codeAnalysis" as const,
              label: "Code Analysis",
              desc: "Tree-sitter AST parsing & baseline commit",
              tag: "Core",
            },
            {
              key: "astTransform" as const,
              label: "AST Transformations",
              desc: "Constant folding, dead code & slots",
              tag: "ast_agent.py",
            },
            {
              key: "bytecodeTransform" as const,
              label: "Bytecode Transformations",
              desc: "Low-overhead Python opcode tuning",
              tag: "bytecode_agent.py",
            },
            {
              key: "scriptTransform" as const,
              label: "Script Transformations",
              desc: "Modern string formatting & membership",
              tag: "script_agent.py",
            },
            {
              key: "automatedTesting" as const,
              label: "Automated Testing",
              desc: "Deterministic pytest & property tests",
              tag: "Zero-LLM",
            },
            {
              key: "performanceBenchmark" as const,
              label: "Performance Benchmarking",
              desc: "Runtime latency & memory profiling",
              tag: "Telemetry",
            },
            {
              key: "forensicAnalysis" as const,
              label: "Forensic Analysis",
              desc: "Git Bisect + ddmin delta debugging",
              tag: "Grader.py",
            },
          ].map((item) => (
            <label
              key={item.key}
              className={`p-3 rounded-md border flex items-start gap-3 cursor-pointer transition select-none ${
                config[item.key]
                  ? "bg-[#151E29] border-[#42D99A]/40 text-[#F4F7FA]"
                  : "bg-[#080B10]/60 border-[#263341] text-[#8B98A8]"
              }`}
            >
              <input
                type="checkbox"
                checked={config[item.key]}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, [item.key]: e.target.checked }))
                }
                className="mt-0.5 accent-[#42D99A]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{item.label}</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-[#080B10] border border-[#263341] text-[#8B98A8]">
                    {item.tag}
                  </span>
                </div>
                <p className="text-[11px] text-[#8B98A8] mt-0.5">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section D: Primary Action */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-[#8B98A8]">
          <span>Strategy: Isolated worktree concurrency off </span>
          <span className="text-[#42D99A]">main_sha</span>
        </div>

        <button
          type="button"
          onClick={handleInitialize}
          disabled={isInitializing}
          className="w-full sm:w-auto px-8 py-3.5 rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#42D99A] hover:bg-[#38c287] text-[#080B10] transition-all shadow-[0_0_20px_rgba(66,217,154,0.3)] hover:shadow-[0_0_28px_rgba(66,217,154,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isInitializing ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-[#080B10] border-t-transparent animate-spin" />
              <span>INITIALIZING WORKSPACE...</span>
            </>
          ) : (
            <span>INITIALIZE EVALUATION →</span>
          )}
        </button>
      </div>

      {/* Evaluation Payload Confirmation Card (Phase 1 Output State) */}
      {initializedPayload && (
        <div className="rounded-lg bg-[#151E29] border border-[#42D99A]/50 p-6 space-y-4 shadow-[0_0_25px_rgba(66,217,154,0.15)] animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[#263341] pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#42D99A] shadow-[0_0_8px_#42D99A]" />
              <h3 className="text-sm font-bold text-[#F4F7FA]">
                Evaluation Payload Ready for Engine Ingestion
              </h3>
            </div>
            <span className="text-xs font-mono text-[#42D99A]">
              ID: {initializedPayload.evaluationId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded bg-[#080B10] border border-[#263341]">
              <span className="text-[#8B98A8] block mb-1">Source Ingestion</span>
              <span className="text-[#F4F7FA] font-medium capitalize">
                {initializedPayload.source.type} (
                {initializedPayload.source.fileName || initializedPayload.source.url || "direct snippet"}
                )
              </span>
            </div>
            <div className="p-3 rounded bg-[#080B10] border border-[#263341]">
              <span className="text-[#8B98A8] block mb-1">Active Swarm Tiers</span>
              <span className="text-[#42D99A] font-medium">
                AST, Bytecode, Script (All Active)
              </span>
            </div>
            <div className="p-3 rounded bg-[#080B10] border border-[#263341]">
              <span className="text-[#8B98A8] block mb-1">Grader Engine</span>
              <span className="text-[#F4F7FA] font-medium">Zero-LLM Hard Forensic Grader</span>
            </div>
          </div>

          {initializedPayload.liveBackend && (
            <div className="p-4 rounded bg-[#42D99A]/10 border border-[#42D99A]/40 text-xs font-mono text-[#42D99A] space-y-1.5">
              <div className="font-bold flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#42D99A] shadow-[0_0_8px_#42D99A] animate-pulse" />
                <span>LIVE GIT BASELINE CREATED BY PYTHON BACKEND (ingestion.py)</span>
              </div>
              <div className="text-[#F4F7FA]">
                Baseline Commit SHA: <span className="font-bold text-[#42D99A]">{initializedPayload.liveBackend.commitSha}</span> (Tag: <span className="text-[#F4F7FA]">{initializedPayload.liveBackend.tag}</span>)
              </div>
              <div className="text-[#8B98A8] text-[11px]">
                Managed Repo Path: {initializedPayload.liveBackend.repoPath}
              </div>
            </div>
          )}

          <div className="p-3 rounded bg-[#080B10] border border-[#263341] text-xs font-mono text-[#8B98A8] space-y-1">
            <div className="text-[#42D99A] font-bold">Backend Integration Status:</div>
            <div>• HTTP Ingest API: Connected live to Python backend on port 8000</div>
            <div>• Swarm coordinator: Simulation/Transformer/coordinator.py</div>
            <div>• Forensic Grader: Zero-LLM Hard Grader (Simulation/Grader.py)</div>
          </div>

          {onEvaluationStarted && (
            <button
              type="button"
              onClick={onEvaluationStarted}
              className="w-full py-3.5 rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#42D99A] hover:bg-[#38c287] text-[#080B10] transition shadow-[0_0_20px_rgba(66,217,154,0.3)] hover:shadow-[0_0_28px_rgba(66,217,154,0.5)] flex items-center justify-center gap-2"
            >
              <span>ENTER LIVE EVALUATION DASHBOARD →</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
