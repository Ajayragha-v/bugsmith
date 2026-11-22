"use client";

import { useState } from "react";
import {
  SubmissionMethod,
  CodeFileItem,
  ProjectSummary,
  GitHubRepoConfig,
  PastedCodeConfig,
  AdditionalContext,
  StructuredEvaluationPayload,
} from "./types";
import FilesUploader from "./FilesUploader";
import ProjectUploader from "./ProjectUploader";
import GitHubUploader from "./GitHubUploader";
import CodeEditor from "./CodeEditor";
import EvaluationReadyModal from "./EvaluationReadyModal";
import { setRobotFaceInteraction } from "../RobotFaceState";

interface FormErrors {
  source?: string;
  repairIntent?: string;
}

export default function CodeRepairWorkspace() {
  // Navigation / Tab Selection
  const [activeTab, setActiveTab] = useState<SubmissionMethod>("files");

  // Submission Sources State (preserved across tab switching)
  const [files, setFiles] = useState<CodeFileItem[]>([]);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [github, setGithub] = useState<GitHubRepoConfig>({
    repoUrl: "",
    branch: "main",
    subfolder: "",
  });
  const [pastedCode, setPastedCode] = useState<PastedCodeConfig>({
    code: "",
    language: "TypeScript",
    lineCount: 1,
    charCount: 0,
  });

  // Repair Intent (Mandatory)
  const [repairIntent, setRepairIntent] = useState("");

  // Constraint Tests (Additional Requirement - Optional multiline)
  const [constraintTests, setConstraintTests] = useState("");

  // Optional Context (Accordion)
  const [showAdditionalContext, setShowAdditionalContext] = useState(false);
  const [additionalContext, setAdditionalContext] = useState<AdditionalContext>({
    errorMessage: "",
    failedTestOutput: "",
    reproductionInfo: "",
  });

  // Validation & Ready State
  const [errors, setErrors] = useState<FormErrors>({});
  const [evaluationPayload, setEvaluationPayload] =
    useState<StructuredEvaluationPayload | null>(null);

  // Validation Logic
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 1. Source validation
    if (activeTab === "files") {
      if (files.length === 0) {
        newErrors.source = "Please select or drop at least one source file to evaluate.";
      }
    } else if (activeTab === "project") {
      if (!project || project.files.length === 0) {
        newErrors.source = "Please upload a project ZIP archive or select a project directory.";
      }
    } else if (activeTab === "github") {
      if (!github.repoUrl.trim()) {
        newErrors.source = "Please enter a valid GitHub repository URL.";
      } else if (!github.repoUrl.includes("github.com/")) {
        newErrors.source = "Repository URL must be a valid GitHub URL (e.g. https://github.com/owner/repo).";
      }
    } else if (activeTab === "paste") {
      if (!pastedCode.code.trim()) {
        newErrors.source = "Please paste or enter source code into the editor.";
      } else if (pastedCode.code.trim().length < 5) {
        newErrors.source = "Code snippet is too short to evaluate. Please provide complete code.";
      }
    }

    // 2. Repair Intent validation (Mandatory)
    if (!repairIntent.trim()) {
      newErrors.repairIntent = "Please describe what needs to be fixed before proceeding to evaluation.";
    } else if (repairIntent.trim().length < 5) {
      newErrors.repairIntent = "Please provide a slightly more descriptive repair intent.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToEvaluation = () => {
    if (!validateForm()) {
      return;
    }

    // Build structured payload
    const submissionId = `bugsmith-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    const payload: StructuredEvaluationPayload = {
      submissionId,
      createdAt: timestamp,
      submissionMethod: activeTab,
      source: {},
      repairIntent: repairIntent.trim(),
      constraintTests: constraintTests.trim() ? constraintTests.trim() : undefined,
      additionalContext:
        additionalContext.errorMessage.trim() ||
        additionalContext.failedTestOutput.trim() ||
        additionalContext.reproductionInfo.trim()
          ? {
              errorMessage: additionalContext.errorMessage.trim() || undefined,
              failedTestOutput: additionalContext.failedTestOutput.trim() || undefined,
              reproductionInfo: additionalContext.reproductionInfo.trim() || undefined,
            }
          : undefined,
      evaluationEngineStatus: {
        state: "payload_ready",
        automatedExecution: "pending_backend_connection",
        message:
          "Structured repair intent and source payload verified. Ready for evaluation engine ingest.",
      },
    };

    if (activeTab === "files") {
      payload.source.files = files.map((f) => ({
        name: f.name,
        size: f.size,
        language: f.language,
        relativePath: f.relativePath,
      }));
    } else if (activeTab === "project" && project) {
      payload.source.project = {
        name: project.name,
        fileCount: project.fileCount,
        totalSize: project.totalSize,
        languages: project.languages.map((l) => `${l.language} (${l.percentage}%)`),
        sampleFiles: project.files.slice(0, 50).map((f) => f.relativePath),
        sourceType: project.sourceType,
      };
    } else if (activeTab === "github") {
      payload.source.github = {
        repoUrl: github.repoUrl.trim(),
        branch: github.branch.trim() || "main",
        subfolder: github.subfolder.trim() || "/",
        authIntegrationStatus: "pending_backend_oauth",
      };
    } else if (activeTab === "paste") {
      payload.source.pastedCode = {
        language: pastedCode.language,
        code: pastedCode.code,
        lineCount: pastedCode.lineCount,
        charCount: pastedCode.charCount,
      };
    }

    setEvaluationPayload(payload);
    setRobotFaceInteraction("CODE_RECEIVED", 1800);
  };

  const handleResetAll = () => {
    setFiles([]);
    setProject(null);
    setGithub({ repoUrl: "", branch: "main", subfolder: "" });
    setPastedCode({ code: "", language: "TypeScript", lineCount: 1, charCount: 0 });
    setRepairIntent("");
    setConstraintTests("");
    setAdditionalContext({ errorMessage: "", failedTestOutput: "", reproductionInfo: "" });
    setErrors({});
    setEvaluationPayload(null);
  };

  return (
    <div className="workspace-card">
      {/* 4 Submission Methods Segmented Tabs */}
      <div className="submission-tabs" role="tablist" aria-label="Code submission methods">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "files"}
          className={`submission-tab ${activeTab === "files" ? "tab-active" : ""}`}
          onClick={() => {
            setActiveTab("files");
            if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
          }}
        >
          <span className="tab-icon">📁</span>
          <span className="tab-label">Upload Files</span>
          {files.length > 0 && <span className="tab-count-badge">{files.length}</span>}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "project"}
          className={`submission-tab ${activeTab === "project" ? "tab-active" : ""}`}
          onClick={() => {
            setActiveTab("project");
            if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
          }}
        >
          <span className="tab-icon">📦</span>
          <span className="tab-label">Upload Project</span>
          {project && <span className="tab-count-badge">{project.fileCount}</span>}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "github"}
          className={`submission-tab ${activeTab === "github" ? "tab-active" : ""}`}
          onClick={() => {
            setActiveTab("github");
            if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
          }}
        >
          <span className="tab-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </span>
          <span className="tab-label">GitHub</span>
          {github.repoUrl && <span className="tab-count-badge">Configured</span>}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "paste"}
          className={`submission-tab ${activeTab === "paste" ? "tab-active" : ""}`}
          onClick={() => {
            setActiveTab("paste");
            if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
          }}
        >
          <span className="tab-icon">📝</span>
          <span className="tab-label">Paste Code</span>
          {pastedCode.code && <span className="tab-count-badge">{pastedCode.lineCount}L</span>}
        </button>
      </div>

      {/* Dynamic Submission Panel */}
      <div className="dynamic-submission-panel">
        {activeTab === "files" && (
          <FilesUploader
            files={files}
            onChange={(newFiles) => {
              setFiles(newFiles);
              if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
            }}
            error={errors.source}
          />
        )}

        {activeTab === "project" && (
          <ProjectUploader
            project={project}
            onChange={(newProject) => {
              setProject(newProject);
              if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
            }}
            error={errors.source}
          />
        )}

        {activeTab === "github" && (
          <GitHubUploader
            config={github}
            onChange={(newConfig) => {
              setGithub(newConfig);
              if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
            }}
            error={errors.source}
          />
        )}

        {activeTab === "paste" && (
          <CodeEditor
            config={pastedCode}
            onChange={(newConfig) => {
              setPastedCode(newConfig);
              if (errors.source) setErrors((prev) => ({ ...prev, source: undefined }));
            }}
            error={errors.source}
          />
        )}
      </div>

      {/* Section Divider */}
      <hr className="workspace-divider" />

      {/* Required Repair Intent Section */}
      <div className="workspace-section">
        <div className="section-label-row">
          <label htmlFor="repair-intent-input" className="workspace-label">
            What needs to be fixed? <span className="label-required">*</span>
          </label>
          <span className="label-pill">MANDATORY</span>
        </div>
        <textarea
          id="repair-intent-input"
          value={repairIntent}
          onChange={(e) => {
            setRepairIntent(e.target.value);
            if (errors.repairIntent) {
              setErrors((prev) => ({ ...prev, repairIntent: undefined }));
            }
          }}
          placeholder="Describe the bug or the behaviour you expect."
          className={`repair-intent-textarea ${errors.repairIntent ? "input-has-error" : ""}`}
          rows={3}
        />
        {errors.repairIntent && (
          <div className="field-error-message" role="alert">
            {errors.repairIntent}
          </div>
        )}
      </div>

      {/* User-Defined Constraint Tests (Additional Requirement) */}
      <div className="workspace-section">
        <div className="section-label-row">
          <div>
            <label htmlFor="constraint-tests-input" className="workspace-label">
              Constraint tests
            </label>
            <p className="workspace-sublabel">
              Define the rules your repaired code must satisfy.
            </p>
          </div>
          <span className="label-pill pill-optional">OPTIONAL</span>
        </div>
        <textarea
          id="constraint-tests-input"
          value={constraintTests}
          onChange={(e) => setConstraintTests(e.target.value)}
          placeholder="Example: Discount must be between 0 and 100%. Existing function signatures must remain unchanged. Empty input must return 0."
          className="constraint-tests-textarea"
          rows={3}
        />
      </div>

      {/* Optional Additional Context Accordion */}
      <div className="workspace-accordion">
        <button
          type="button"
          className="accordion-toggle"
          onClick={() => setShowAdditionalContext(!showAdditionalContext)}
          aria-expanded={showAdditionalContext}
        >
          <span className="accordion-title">Additional context (optional)</span>
          <span className="accordion-chevron">
            {showAdditionalContext ? "▲ Collapse" : "▼ Expand"}
          </span>
        </button>

        {showAdditionalContext && (
          <div className="accordion-content">
            <div className="accordion-field">
              <label htmlFor="error-message-input" className="context-field-label">
                ERROR MESSAGE OR STACK TRACE
              </label>
              <textarea
                id="error-message-input"
                value={additionalContext.errorMessage}
                onChange={(e) =>
                  setAdditionalContext({ ...additionalContext, errorMessage: e.target.value })
                }
                placeholder="Paste runtime error logs, stack traces or compiler messages..."
                className="context-textarea font-mono"
                rows={3}
                spellCheck="false"
              />
            </div>

            <div className="accordion-field">
              <label htmlFor="failed-test-input" className="context-field-label">
                FAILED TEST OUTPUT
              </label>
              <textarea
                id="failed-test-input"
                value={additionalContext.failedTestOutput}
                onChange={(e) =>
                  setAdditionalContext({ ...additionalContext, failedTestOutput: e.target.value })
                }
                placeholder="Paste failed Jest, Pytest, Go test, or Cargo test assertion outputs..."
                className="context-textarea font-mono"
                rows={3}
                spellCheck="false"
              />
            </div>

            <div className="accordion-field">
              <label htmlFor="repro-info-input" className="context-field-label">
                ADDITIONAL REPRODUCTION INFORMATION
              </label>
              <textarea
                id="repro-info-input"
                value={additionalContext.reproductionInfo}
                onChange={(e) =>
                  setAdditionalContext({ ...additionalContext, reproductionInfo: e.target.value })
                }
                placeholder="Steps to reproduce, environment variables, dependencies or flags..."
                className="context-textarea"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Action Bar */}
      <div className="workspace-footer-action">
        <button
          type="button"
          className="btn-continue-evaluation"
          onClick={handleContinueToEvaluation}
        >
          <span>Continue to Evaluation</span>
          <span className="btn-arrow">→</span>
        </button>
      </div>

      {/* Evaluation Ready Modal */}
      {evaluationPayload && (
        <EvaluationReadyModal
          payload={evaluationPayload}
          onClose={() => setEvaluationPayload(null)}
          onReset={handleResetAll}
        />
      )}
    </div>
  );
}
