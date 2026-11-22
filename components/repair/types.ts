export type SubmissionMethod = "files" | "project" | "github" | "paste";

export interface CodeFileItem {
  id: string;
  name: string;
  size: number;
  relativePath: string;
  language: string;
  lastModified?: number;
  contentSnippet?: string;
}

export interface ProjectSummary {
  name: string;
  fileCount: number;
  totalSize: number;
  languages: { language: string; count: number; percentage: number }[];
  files: CodeFileItem[];
  sourceType: "zip" | "directory";
}

export interface GitHubRepoConfig {
  repoUrl: string;
  branch: string;
  subfolder: string;
}

export interface PastedCodeConfig {
  code: string;
  language: string;
  lineCount: number;
  charCount: number;
}

export interface AdditionalContext {
  errorMessage: string;
  failedTestOutput: string;
  reproductionInfo: string;
}

export interface StructuredEvaluationPayload {
  submissionId: string;
  createdAt: string;
  submissionMethod: SubmissionMethod;
  source: {
    files?: Array<{ name: string; size: number; language: string; relativePath: string }>;
    project?: {
      name: string;
      fileCount: number;
      totalSize: number;
      languages: string[];
      sampleFiles: string[];
      sourceType: "zip" | "directory";
    };
    github?: {
      repoUrl: string;
      branch: string;
      subfolder: string;
      authIntegrationStatus: "pending_backend_oauth";
    };
    pastedCode?: {
      language: string;
      code: string;
      lineCount: number;
      charCount: number;
    };
  };
  repairIntent: string;
  constraintTests?: string;
  additionalContext?: {
    errorMessage?: string;
    failedTestOutput?: string;
    reproductionInfo?: string;
  };
  evaluationEngineStatus: {
    state: "payload_ready";
    automatedExecution: "pending_backend_connection";
    message: "Structured repair intent and source payload verified. Ready for evaluation engine ingest.";
  };
}
