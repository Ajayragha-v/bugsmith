"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { CodeFileItem } from "./types";
import { detectLanguageFromFilename, formatFileSize } from "./languageDetector";
import { setRobotFaceInteraction } from "../RobotFaceState";

interface FilesUploaderProps {
  files: CodeFileItem[];
  onChange: (files: CodeFileItem[]) => void;
  error?: string | null;
}

export default function FilesUploader({ files, onChange, error }: FilesUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processFileList = (incomingList: FileList | File[]) => {
    const newItems: CodeFileItem[] = [];
    const existingNames = new Set(files.map((f) => f.name));

    for (let i = 0; i < incomingList.length; i++) {
      const file = incomingList[i];
      // Generate a unique ID
      const fileId = `file-${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const lang = detectLanguageFromFilename(file.name);

      // If replacing file with same name, or add new
      newItems.push({
        id: fileId,
        name: file.name,
        size: file.size,
        relativePath: file.name,
        language: lang,
        lastModified: file.lastModified,
      });
    }

    // Merge or append while avoiding duplicate filenames
    const filteredExisting = files.filter(
      (f) => !newItems.some((ni) => ni.name === f.name)
    );
    onChange([...filteredExisting, ...newItems]);
    if (newItems.length > 0) setRobotFaceInteraction("CODE_RECEIVED", 1800);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
      // Reset input so re-selecting same file triggers change
      e.target.value = "";
    }
  };

  const handleRemoveFile = (idToRemove: string) => {
    onChange(files.filter((f) => f.id !== idToRemove));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="uploader-container">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      {/* Drag & Drop Zone */}
      <div
        className={`dropzone ${isDragging ? "dropzone-active" : ""} ${error ? "dropzone-error" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload files: Drag and drop or browse"
      >
        <div className="dropzone-content">
          <div className="dropzone-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="dropzone-text-block">
            <p className="dropzone-title">
              Drop source files here, or <span className="dropzone-link">browse</span>
            </p>
            <p className="dropzone-sub">
              Supports .ts, .js, .py, .go, .rs, .java, .cpp, .c, .cs, .rb, .sql, .html, .css and more
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="validation-error-banner" role="alert">
          <span className="error-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="file-list-card">
          <div className="file-list-header">
            <div className="file-list-title-group">
              <span className="file-list-title">SELECTED FILES</span>
              <span className="file-list-badge">{files.length} file{files.length > 1 ? "s" : ""}</span>
            </div>
            <div className="file-list-actions">
              <button
                type="button"
                className="btn-text-action"
                onClick={() => fileInputRef.current?.click()}
              >
                + Add More
              </button>
              <span className="action-divider" />
              <button
                type="button"
                className="btn-text-action action-danger"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="file-items-scroll">
            <table className="file-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>FILE NAME</th>
                  <th style={{ textAlign: "left" }}>LANGUAGE</th>
                  <th style={{ textAlign: "right" }}>SIZE</th>
                  <th style={{ textAlign: "center", width: "40px" }}></th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="file-row">
                    <td className="file-name-cell">
                      <span className="file-symbol">📄</span>
                      <span className="file-name-text" title={file.name}>
                        {file.name}
                      </span>
                    </td>
                    <td className="file-lang-cell">
                      <span className="lang-pill">{file.language}</span>
                    </td>
                    <td className="file-size-cell">{formatFileSize(file.size)}</td>
                    <td className="file-delete-cell">
                      <button
                        type="button"
                        className="btn-remove-file"
                        title={`Remove ${file.name}`}
                        aria-label={`Remove ${file.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(file.id);
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
