"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PersonalityQuote } from "./RobotPersonalityController";

export type RobotSpeechBubbleProps = {
  quote: PersonalityQuote | null;
  isVisible: boolean;
  anchorPos: { x: number; y: number } | null;
  onNext?: () => void;
  onDismiss?: () => void;
};

export default function RobotSpeechBubble({
  quote,
  isVisible,
  anchorPos,
  onNext,
  onDismiss,
}: RobotSpeechBubbleProps) {
  // Reveal text with quick, natural character typing animation
  const [displayedText, setDisplayedText] = useState("");
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure window dimensions for responsive clamping
  const [windowSize, setWindowSize] = useState({ width: 1440, height: 900 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animate text typing when quote changes or becomes visible
  useEffect(() => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }

    if (!quote || !isVisible) {
      setDisplayedText("");
      return;
    }

    const fullText = quote.text;
    let charIndex = 0;
    setDisplayedText("");

    // Quick reveal: ~20ms per character
    const typeChar = () => {
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex));
        charIndex++;
        typingTimer.current = setTimeout(typeChar, 20);
      }
    };

    // Brief 80ms start delay
    typingTimer.current = setTimeout(typeChar, 80);

    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [quote, isVisible]);

  // Compute responsive position relative to robot head
  const { x, y, isDesktopLayout } = useMemo(() => {
    const isDesktop = windowSize.width >= 900;
    const bubbleW = Math.min(320, windowSize.width - 32);
    const bubbleH = 110;

    if (!anchorPos) {
      return { x: windowSize.width * 0.6, y: windowSize.height * 0.35, isDesktopLayout: isDesktop };
    }

    if (isDesktop) {
      // Desktop: place to the LEFT of the robot's head
      // Pointer points to the right towards the robot
      const rawX = anchorPos.x - bubbleW - 28;
      // Prevent overlapping the left headline (which ends around 520px on desktop)
      const minLeft = Math.max(24, Math.min(540, windowSize.width * 0.40));
      const clampedX = Math.max(minLeft, Math.min(windowSize.width - bubbleW - 24, rawX));

      // Vertically align with head
      const clampedY = Math.max(76, Math.min(windowSize.height - bubbleH - 70, anchorPos.y - 55));

      return { x: clampedX, y: clampedY, isDesktopLayout: true };
    } else {
      // Mobile / tablet: place ABOVE the robot's head
      // Pointer points downwards toward the head
      const clampedX = Math.max(16, Math.min(windowSize.width - bubbleW - 16, anchorPos.x - bubbleW / 2));
      const clampedY = Math.max(68, anchorPos.y - bubbleH - 24);

      return { x: clampedX, y: clampedY, isDesktopLayout: false };
    }
  }, [anchorPos, windowSize]);

  if (!quote) return null;

  return (
    <div
      className={`robot-speech-bubble-wrapper ${isVisible ? "visible" : "hidden"} ${
        isDesktopLayout ? "layout-desktop" : "layout-mobile"
      }`}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
      onClick={onNext}
      role="status"
      aria-live="polite"
      title="Click to hear next message"
    >
      <div className="speech-bubble-card">
        {/* Mood Indicator Badge */}
        <div className="speech-bubble-header">
          <span className="speech-mood-indicator" />
          <span className="speech-mood-label">MOOD // {quote.moodLabel}</span>
          <span className="speech-skip-hint">CLICK TO SKIP ↻</span>
        </div>

        {/* Message Text with Typewriter Effect */}
        <p className="speech-bubble-text">
          {displayedText}
          {displayedText.length < quote.text.length && (
            <span className="speech-typing-cursor" />
          )}
        </p>

        {/* Tail pointer pointing toward robot head */}
        {isDesktopLayout ? (
          <div className="speech-bubble-tail-right" aria-hidden="true">
            <svg width="18" height="24" viewBox="0 0 18 24" fill="none">
              <path
                d="M0 6C0 6 8 8 16 12C8 16 0 18 0 18V6Z"
                fill="#F6F7F9"
              />
            </svg>
          </div>
        ) : (
          <div className="speech-bubble-tail-bottom" aria-hidden="true">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
              <path
                d="M6 0C6 0 8 8 12 16C16 8 18 0 18 0H6Z"
                fill="#F6F7F9"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
