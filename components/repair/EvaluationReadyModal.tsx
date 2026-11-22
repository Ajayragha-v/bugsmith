"use client";

import { useState } from "react";
import { StructuredEvaluationPayload } from "./types";

interface EvaluationReadyModalProps {
  payload: StructuredEvaluationPayload;
  onClose: () => void;
  onReset: () => void;
}

export default function EvaluationReadyModal({
  payload,
  onClose,
  onReset,
}: EvaluationReadyModalProps) {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container">
        {/* Modal Top Bar */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-status-dot" />
            <span className="modal-status-badge">PAYLOAD PREPARED // EVALUATION READY</span>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="modal-body">
          <div className="modal-summary-banner">
            <h2 id="modal-title" className="modal-title">
              Ready for Repair Evaluation
            </h2>
            <p className="modal-desc">
              Your source submission, repair intent and constraint tests have been validated and compiled into a structured evaluation payload.
            </p>
          </div>

          {/* Integration Notice */}
          <div className="modal-notice-box">
            <div className="notice-icon">ℹ</div>
            <div className="notice-text">
              <strong className="notice-highlight">Evaluation Engine Integration Point:</strong>
              <p>
                The frontend has compiled and structured your input. Automated repair execution and constraint verification are pending live backend runner attachment. No synthetic or simulated results are fabricated.
              </p>
            </div>
          </div>

          {/* Submission Details Breakdown */}
          <div className="submission-breakdown-grid">
            <div className="breakdown-card">
              <span className="breakdown-label">SUBMISSION METHOD</span>
              <span className="breakdown-val uppercase">{payload.submissionMethod}</span>
            </div>
            <div className="breakdown-card">
              <span className="breakdown-label">SUBMISSION ID</span>
              <span className="breakdown-val font-mono">{payload.submissionId}</span>
            </div>
            <div className="breakdown-card full-width">
              <span className="breakdown-label">REPAIR INTENT</span>
              <p className="breakdown-text">{payload.repairIntent}</p>
            </div>

            {payload.constraintTests && (
              <div className="breakdown-card full-width accent-border">
                <div className="constraint-header-row">
                  <span className="breakdown-label">USER CONSTRAINT TESTS</span>
                  <span className="pending-chip">AUTOMATED EXECUTION PENDING</span>
                </div>
                <p className="breakdown-text whitespace-pre-wrap">{payload.constraintTests}</p>
              </div>
            )}
          </div>

          {/* JSON Payload Inspector */}
          <div className="payload-inspector-group">
            <div className="inspector-toolbar">
              <span className="inspector-title">STRUCTURED EVALUATION PAYLOAD (JSON)</span>
              <button
                type="button"
                className="btn-copy-payload"
                onClick={handleCopy}
              >
                {copied ? "✓ COPIED TO CLIPBOARD" : "COPY PAYLOAD JSON"}
              </button>
            </div>
            <pre className="payload-json-view">
              <code>{jsonString}</code>
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary-action"
            onClick={onReset}
          >
            Start New Repair
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={onClose}
          >
            Return to Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
