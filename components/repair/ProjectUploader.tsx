"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { ProjectSummary } from "./types";
import { parseZipArchive, parseDirectoryFiles } from "./zipReader";
import { formatFileSize } from "./languageDetector";
import { setRobotFaceInteraction } from "../RobotFaceState";

interface ProjectUploaderProps {
  project: ProjectSummary | null;
  onChange: (project: ProjectSummary | null) => void;
  error?: string | null;
}

export default function ProjectUploader({ project, onChange, error }: ProjectUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFileList, setShowFileList] = useState(false);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleZipFile = async (file: File) => {
    try {
      setIsProcessing(true);
      const summary = await parseZipArchive(file);
      onChange(summary);
      setRobotFaceInteraction(summary.fileCount > 0 ? "CODE_RECEIVED" : "ERROR", 1800);
    } catch (err) {
      console.error("Failed to parse ZIP:", err);
      setRobotFaceInteraction("ERROR", 2400);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const firstFile = e.dataTransfer.files[0];
      if (firstFile.name.toLowerCase().endsWith(".zip")) {
        await handleZipFile(firstFile);
      } else {
        // Fallback for directory or multiple dropped files
        const summary = parseDirectoryFiles(e.dataTransfer.files);
        onChange(summary);
        setRobotFaceInteraction(summary.fileCount > 0 ? "CODE_RECEIVED" : "ERROR", 1800);
      }
    }
  };

  const handleZipInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleZipFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleFolderInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const summary = parseDirectoryFiles(e.target.files);
      onChange(summary);
      setRobotFaceInteraction(summary.fileCount > 0 ? "CODE_RECEIVED" : "ERROR", 1800);
      e.target.value = "";
    }
  };

  const handleReset = () => {
    onChange(null);
    setShowFileList(false);
  };

  return (
    <div className="project-uploader-container">
      {/* Hidden File Inputs */}
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip,application/zip"
        style={{ display: "none" }}
        onChange={handleZipInputChange}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in all modern browsers
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: "none" }}
        onChange={handleFolderInputChange}
      />

      {!project ? (
        <div
          className={`dropzone ${isDragging ? "dropzone-active" : ""} ${error ? "dropzone-error" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Upload Project Archive or Directory"
        >
          {isProcessing ? (
            <div className="dropzone-processing">
              <div className="processing-spinner" />
              <p className="dropzone-title">Parsing project archive & filtering artifacts...</p>
              <p className="dropzone-sub">Excluding node_modules, .git, and build artifacts</p>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="dropzone-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>

              <div className="dropzone-text-block">
                <p className="dropzone-title">
                  Upload complete project archive (.zip) or select directory
                </p>
                <p className="dropzone-sub">
                  Automatically filters out node_modules, .git, dist, and build caches
                </p>
              </div>

              <div className="project-action-buttons">
                <button
                  type="button"
                  className="btn-project-select"
                  onClick={() => zipInputRef.current?.click()}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <span>Select ZIP Archive</span>
                </button>

                <button
                  type="button"
                  className="btn-project-select"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Choose Folder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Compact Project Summary Card */
        <div className="project-summary-card">
          <div className="summary-top-bar">
            <div className="summary-title-col">
              <span className="summary-tag">
                {project.sourceType === "zip" ? "ZIP ARCHIVE" : "DIRECTORY TREE"}
              </span>
              <h3 className="project-name">{project.name}</h3>
            </div>
            <div className="summary-controls">
              <button
                type="button"
                className="btn-text-action"
                onClick={() => setShowFileList(!showFileList)}
              >
                {showFileList ? "Hide File List" : "Review Files"} ({project.fileCount})
              </button>
              <span className="action-divider" />
              <button
                type="button"
                className="btn-text-action action-danger"
                onClick={handleReset}
              >
                Replace Project
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="project-metrics-grid">
            <div className="metric-box">
              <span className="metric-label">PARSED FILES</span>
              <span className="metric-value">{project.fileCount}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">TOTAL SIZE</span>
              <span className="metric-value">{formatFileSize(project.totalSize)}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">DETECTED LANGUAGES</span>
              <div className="languages-tag-row">
                {project.languages.length > 0 ? (
                  project.languages.slice(0, 4).map((lang) => (
                    <span key={lang.language} className="lang-pill">
                      {lang.language} <span className="lang-pct">{lang.percentage}%</span>
                    </span>
                  ))
                ) : (
                  <span className="lang-pill">Generic Source</span>
                )}
              </div>
            </div>
          </div>

          {/* File Review Drawer */}
          {showFileList && (
            <div className="project-file-drawer">
              <div className="drawer-header">
                <span className="drawer-title">PROJECT SOURCE INVENTORY</span>
                <span className="drawer-sub">Excludes node_modules & build directories</span>
              </div>
              <div className="drawer-scroll">
                <table className="file-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>RELATIVE PATH</th>
                      <th style={{ textAlign: "left" }}>LANGUAGE</th>
                      <th style={{ textAlign: "right" }}>SIZE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.files.slice(0, 150).map((file) => (
                      <tr key={file.id} className="file-row">
                        <td className="file-name-cell">
                          <span className="file-symbol">📄</span>
                          <span className="file-name-text" title={file.relativePath}>
                            {file.relativePath}
                          </span>
                        </td>
                        <td className="file-lang-cell">
                          <span className="lang-pill">{file.language}</span>
                        </td>
                        <td className="file-size-cell">{formatFileSize(file.size)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {project.files.length > 150 && (
                  <div className="drawer-overflow-notice">
                    Showing first 150 of {project.files.length} files. All files will be included in the evaluation payload.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
