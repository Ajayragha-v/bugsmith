"use client";

import { GitHubRepoConfig } from "./types";
import { clearRobotFaceInteraction, setRobotFaceInteraction } from "../RobotFaceState";

interface GitHubUploaderProps {
  config: GitHubRepoConfig;
  onChange: (config: GitHubRepoConfig) => void;
  error?: string | null;
}

export default function GitHubUploader({ config, onChange, error }: GitHubUploaderProps) {
  const handleUrlChange = (value: string) => {
    onChange({ ...config, repoUrl: value });
  };

  const handleBranchChange = (value: string) => {
    onChange({ ...config, branch: value });
  };

  const handleSubfolderChange = (value: string) => {
    onChange({ ...config, subfolder: value });
  };

  // Extract owner and repo for preview if valid URL
  let parsedRepo: { owner: string; name: string } | null = null;
  const match = config.repoUrl.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
  if (match) {
    parsedRepo = { owner: match[1], name: match[2].replace(/\.git$/, "") };
  }

  return (
    <div className="github-uploader-container">
      {/* Honest Integration Notice */}
      <div className="integration-pending-banner">
        <div className="pending-badge">INTEGRATION PENDING</div>
        <div className="pending-content">
          <h4 className="pending-title">GitHub OAuth & Webhook API Status</h4>
          <p className="pending-text">
            OAuth account linking is pending backend configuration. You can specify a public or accessible repository target below. Bugsmith will package these repository coordinates into the structured evaluation payload for runner execution.
          </p>
        </div>
      </div>

      <div className="github-form-card">
        {/* Repo URL Input */}
        <div className="form-field-group">
          <label htmlFor="github-repo-url" className="field-label">
            REPOSITORY URL <span className="label-required">*</span>
          </label>
          <div className="input-with-prefix">
            <span className="input-prefix-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </span>
            <input
              id="github-repo-url"
              type="url"
              className={`text-input text-input-prefixed ${error ? "input-has-error" : ""}`}
              placeholder="https://github.com/organization/repository"
              value={config.repoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              onFocus={() => setRobotFaceInteraction("LISTENING", 0)}
              onBlur={clearRobotFaceInteraction}
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          <span className="field-help-text">
            Provide the HTTPS clone URL of the repository to be repaired.
          </span>
        </div>

        {/* Branch & Subfolder Row */}
        <div className="form-fields-grid">
          <div className="form-field-group">
            <label htmlFor="github-branch" className="field-label">
              BRANCH NAME
            </label>
            <input
              id="github-branch"
              type="text"
              className="text-input"
              placeholder="main"
              value={config.branch}
              onChange={(e) => handleBranchChange(e.target.value)}
              spellCheck="false"
            />
            <span className="field-help-text">Target git branch (defaults to main).</span>
          </div>

          <div className="form-field-group">
            <label htmlFor="github-subfolder" className="field-label">
              WORKING DIRECTORY / ROOT
            </label>
            <input
              id="github-subfolder"
              type="text"
              className="text-input"
              placeholder="/"
              value={config.subfolder}
              onChange={(e) => handleSubfolderChange(e.target.value)}
              spellCheck="false"
            />
            <span className="field-help-text">Optional subfolder path for monorepos.</span>
          </div>
        </div>

        {/* Review Selected Repository */}
        {parsedRepo && (
          <div className="repo-preview-card">
            <div className="repo-preview-header">
              <span className="preview-label">REPOSITORY TARGET SPECIFICATION</span>
              <span className="status-pill status-ready">PAYLOAD TARGET CONFIGURED</span>
            </div>
            <div className="repo-preview-details">
              <div className="repo-detail-item">
                <span className="detail-name">Repository:</span>
                <span className="detail-value">{parsedRepo.owner}/{parsedRepo.name}</span>
              </div>
              <div className="repo-detail-item">
                <span className="detail-name">Branch:</span>
                <span className="detail-value">{config.branch || "main"}</span>
              </div>
              <div className="repo-detail-item">
                <span className="detail-name">Path:</span>
                <span className="detail-value">{config.subfolder || "/ (root)"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="validation-error-banner" role="alert">
          <span className="error-icon">!</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
