"use client";

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { PastedCodeConfig } from "./types";
import { SUPPORTED_LANGUAGES, detectLanguageFromCode } from "./languageDetector";
import { clearRobotFaceInteraction, reportRobotFaceActivity, setRobotFaceInteraction } from "../RobotFaceState";

interface CodeEditorProps {
  config: PastedCodeConfig;
  onChange: (config: PastedCodeConfig) => void;
  error?: string | null;
}

export default function CodeEditor({ config, onChange, error }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [autoDetectActive, setAutoDetectActive] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Synchronize scrolling between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCodeChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    reportRobotFaceActivity();
    const newCode = e.target.value;
    const lines = newCode.split("\n");
    const lineCount = lines.length;
    const charCount = newCode.length;

    let language = config.language;
    if (autoDetectActive && newCode.trim().length > 10) {
      const detected = detectLanguageFromCode(newCode);
      if (detected) {
        language = detected;
      }
    }

    onChange({
      code: newCode,
      language,
      lineCount,
      charCount,
    });
  };

  const handleLanguageSelect = (selectedLang: string) => {
    setAutoDetectActive(false);
    onChange({
      ...config,
      language: selectedLang,
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enable Tab indentation (2 spaces)
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const updated = val.substring(0, start) + "  " + val.substring(end);
      const lines = updated.split("\n");

      onChange({
        code: updated,
        language: config.language,
        lineCount: lines.length,
        charCount: updated.length,
      });

      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleCopy = async () => {
    if (!config.code) return;
    try {
      await navigator.clipboard.writeText(config.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    setAutoDetectActive(true);
    onChange({
      code: "",
      language: "TypeScript",
      lineCount: 1,
      charCount: 0,
    });
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Generate line numbers
  const totalDisplayLines = Math.max(15, config.lineCount);
  const lineNumbers = Array.from({ length: totalDisplayLines }, (_, i) => i + 1);

  return (
    <div className="code-editor-wrapper">
      {/* Editor Header Bar */}
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <label htmlFor="language-select" className="editor-label">
            LANGUAGE:
          </label>
          <div className="select-container">
            <select
              id="language-select"
              value={config.language}
              onChange={(e) => handleLanguageSelect(e.target.value)}
              className="lang-select"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.label}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          {autoDetectActive && (
            <span className="auto-detect-pill" title="Auto-detecting language based on code syntax">
              AUTO-DETECT ON
            </span>
          )}
        </div>

        <div className="editor-toolbar-right">
          <span className="stats-indicator">
            {config.lineCount} {config.lineCount === 1 ? "line" : "lines"} · {config.charCount} chars
          </span>
          <span className="action-divider" />
          <button
            type="button"
            className="editor-btn"
            onClick={handleCopy}
            disabled={!config.code}
            title="Copy code to clipboard"
          >
            {copied ? "✓ COPIED" : "COPY"}
          </button>
          <button
            type="button"
            className="editor-btn action-danger"
            onClick={handleClear}
            disabled={!config.code}
            title="Clear editor contents"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Code Editor Main Body */}
      <div className={`editor-main-container ${error ? "editor-has-error" : ""}`}>
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="editor-gutter"
          aria-hidden="true"
        >
          {lineNumbers.map((num) => (
            <div
              key={num}
              className={`gutter-line ${num <= config.lineCount && config.code ? "active-line" : ""}`}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={config.code}
          onChange={handleCodeChange}
          onFocus={() => setRobotFaceInteraction("LISTENING", 0)}
          onBlur={clearRobotFaceInteraction}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder="// Paste or write the source code that needs repair here...&#10;// Example:&#10;function calculateDiscount(price, userRole) {&#10;  if (userRole === 'VIP') return price * 0.20;&#10;  return price * 0.05;&#10;}"
          className="editor-textarea"
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="Source code input area"
        />
      </div>

      {/* Validation Error */}
      {error && (
        <div className="validation-error-banner" role="alert">
          <span className="error-icon">!</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
