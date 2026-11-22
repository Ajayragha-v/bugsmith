"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GestureType } from "./RobotScene";

export type PersonalityCategory =
  | "friendly"
  | "confident"
  | "sarcastic"
  | "annoyed"
  | "curious";

export type PersonalityMood = PersonalityCategory;

export type PersonalityQuote = {
  id: string;
  category: PersonalityCategory;
  mood: PersonalityCategory;
  moodLabel: string;
  text: string;
  expressionId: PersonalityCategory;
  gestureId: GestureType;
};

// Popup 1: Strict greeting popup
export const GREETING_QUOTE: PersonalityQuote = {
  id: "greeting",
  category: "friendly",
  mood: "friendly",
  moodLabel: "GREETING",
  text: "Hey there!",
  expressionId: "friendly",
  gestureId: "wave",
};

// Complete Database of 20 Developer-Humour Quotes across 5 Categories
export const PERSONALITY_QUOTES: PersonalityQuote[] = [
  // CATEGORY A — FRIENDLY / WELCOMING
  {
    id: "f1",
    category: "friendly",
    mood: "friendly",
    moodLabel: "FRIENDLY",
    text: "Relax. I've seen worse stack traces.",
    expressionId: "friendly",
    gestureId: "nod",
  },
  {
    id: "f2",
    category: "friendly",
    mood: "friendly",
    moodLabel: "FRIENDLY",
    text: "Don't panic. Panic creates more bugs.",
    expressionId: "friendly",
    gestureId: "nod",
  },
  {
    id: "f3",
    category: "friendly",
    mood: "friendly",
    moodLabel: "FRIENDLY",
    text: "Your code called. It needs some attention.",
    expressionId: "friendly",
    gestureId: "nod",
  },
  {
    id: "f4",
    category: "friendly",
    mood: "friendly",
    moodLabel: "FRIENDLY",
    text: "My favourite exercise? Running test suites.",
    expressionId: "friendly",
    gestureId: "nod",
  },

  // CATEGORY B — CONFIDENT / PROUD
  {
    id: "c1",
    category: "confident",
    mood: "confident",
    moodLabel: "CONFIDENT",
    text: "Is that a bug? I can fix that.",
    expressionId: "confident",
    gestureId: "think",
  },
  {
    id: "c2",
    category: "confident",
    mood: "confident",
    moodLabel: "CONFIDENT",
    text: "I named myself Bugsmith for a reason.",
    expressionId: "confident",
    gestureId: "think",
  },
  {
    id: "c3",
    category: "confident",
    mood: "confident",
    moodLabel: "CONFIDENT",
    text: "I was literally built for this.",
    expressionId: "confident",
    gestureId: "think",
  },
  {
    id: "c4",
    category: "confident",
    mood: "confident",
    moodLabel: "CONFIDENT",
    text: "Give me the code. I'll have a word with it.",
    expressionId: "confident",
    gestureId: "think",
  },

  // CATEGORY C — MISCHIEVOUS / SARCASTIC
  {
    id: "s1",
    category: "sarcastic",
    mood: "sarcastic",
    moodLabel: "SARCASTIC",
    text: "404: Bug not found. Just kidding, found it.",
    expressionId: "sarcastic",
    gestureId: "lookAround",
  },
  {
    id: "s2",
    category: "sarcastic",
    mood: "sarcastic",
    moodLabel: "SARCASTIC",
    text: "It works on your machine? Interesting.",
    expressionId: "sarcastic",
    gestureId: "lookAround",
  },
  {
    id: "s3",
    category: "sarcastic",
    mood: "sarcastic",
    moodLabel: "SARCASTIC",
    text: "I don't make mistakes. I generate debugging opportunities.",
    expressionId: "sarcastic",
    gestureId: "lookAround",
  },
  {
    id: "s4",
    category: "sarcastic",
    mood: "sarcastic",
    moodLabel: "SARCASTIC",
    text: "Plot twist: It was never a feature.",
    expressionId: "sarcastic",
    gestureId: "lookAround",
  },

  // CATEGORY D — ANNOYED / BUG HUNTER
  {
    id: "a1",
    category: "annoyed",
    mood: "annoyed",
    moodLabel: "BUG HUNTER",
    text: "Another bug? You know I love these.",
    expressionId: "annoyed",
    gestureId: "nod",
  },
  {
    id: "a2",
    category: "annoyed",
    mood: "annoyed",
    moodLabel: "BUG HUNTER",
    text: "Who invited this bug into our codebase?",
    expressionId: "annoyed",
    gestureId: "nod",
  },
  {
    id: "a3",
    category: "annoyed",
    mood: "annoyed",
    moodLabel: "BUG HUNTER",
    text: "A bug a day keeps the developers busy.",
    expressionId: "annoyed",
    gestureId: "nod",
  },
  {
    id: "a4",
    category: "annoyed",
    mood: "annoyed",
    moodLabel: "BUG HUNTER",
    text: "This bug picked the wrong codebase.",
    expressionId: "annoyed",
    gestureId: "nod",
  },

  // CATEGORY E — CURIOUS / THINKING
  {
    id: "q1",
    category: "curious",
    mood: "curious",
    moodLabel: "CURIOUS",
    text: "Your code is acting suspicious. Let me investigate.",
    expressionId: "curious",
    gestureId: "think",
  },
  {
    id: "q2",
    category: "curious",
    mood: "curious",
    moodLabel: "CURIOUS",
    text: "Let's see what this little troublemaker is hiding.",
    expressionId: "curious",
    gestureId: "think",
  },
  {
    id: "q3",
    category: "curious",
    mood: "curious",
    moodLabel: "CURIOUS",
    text: "Another day, another suspicious semicolon.",
    expressionId: "curious",
    gestureId: "think",
  },
  {
    id: "q4",
    category: "curious",
    mood: "curious",
    moodLabel: "CURIOUS",
    text: "You write the code. I'll question its life choices.",
    expressionId: "curious",
    gestureId: "think",
  },
];

export type IntroSequenceState =
  | "WAITING_ENTRANCE"
  | "POPUP_1_GREETING"
  | "POPUP_2_QUOTE"
  | "INTRO_COMPLETED";

export type PersonalityState = {
  currentQuote: PersonalityQuote | null;
  currentMood: PersonalityMood | "neutral";
  isBubbleVisible: boolean;
  introState: IntroSequenceState;
  startGreetingPopup: () => void;
  finishGreetingWave: () => void;
  triggerMoodQuote: (mood: PersonalityMood) => void;
  dismissBubble: () => void;
};

const LAST_QUOTE_KEY = "bugsmith_last_quote_id";

export function useRobotPersonality(
  onTriggerGesture?: (gesture: GestureType) => void
): PersonalityState {
  const [currentQuote, setCurrentQuote] = useState<PersonalityQuote | null>(null);
  const [currentMood, setCurrentMood] = useState<PersonalityMood | "neutral">("neutral");
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [introState, setIntroState] = useState<IntroSequenceState>("WAITING_ENTRANCE");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Step 1: Start Popup 1 ("Hey there!") when the robot begins its greeting wave
  const startGreetingPopup = useCallback(() => {
    clearTimer();
    setIntroState("POPUP_1_GREETING");
    setCurrentQuote(GREETING_QUOTE);
    setCurrentMood(GREETING_QUOTE.expressionId);
    setIsBubbleVisible(true);

    if (onTriggerGesture) {
      onTriggerGesture("wave");
    }
  }, [clearTimer, onTriggerGesture]);

  // Step 2: Triggered when the greeting wave completely finishes
  const finishGreetingWave = useCallback(() => {
    clearTimer();
    // Dismiss Popup 1
    setIsBubbleVisible(false);

    // Smooth transition into Popup 2 (random personality quote)
    timerRef.current = setTimeout(() => {
      // Pick random quote from all 20, avoiding previous session quote if possible
      let lastId: string | null = null;
      try {
        lastId = sessionStorage.getItem(LAST_QUOTE_KEY);
      } catch {
        // Safe fallback
      }

      const candidates = PERSONALITY_QUOTES.filter((q) => q.id !== lastId);
      const pool = candidates.length > 0 ? candidates : PERSONALITY_QUOTES;
      const selected = pool[Math.floor(Math.random() * pool.length)];

      try {
        sessionStorage.setItem(LAST_QUOTE_KEY, selected.id);
      } catch {
        // Safe fallback
      }

      setIntroState("POPUP_2_QUOTE");
      setCurrentQuote(selected);
      setCurrentMood(selected.expressionId);
      setIsBubbleVisible(true);

      // Trigger matching body gesture for this quote
      if (onTriggerGesture) {
        onTriggerGesture(selected.gestureId);
      }

      // Keep Popup 2 visible for EXACTLY 5.0 seconds
      timerRef.current = setTimeout(() => {
        // Fade out Popup 2
        setIsBubbleVisible(false);

        // Return to active neutral state
        timerRef.current = setTimeout(() => {
          setCurrentMood("neutral");
          setIntroState("INTRO_COMPLETED");
          // No more automatic speech bubbles!
        }, 400); // 400ms fade duration
      }, 5000); // Exactly 5 seconds
    }, 350); // Pause between wave end and Popup 2
  }, [clearTimer, onTriggerGesture]);

  // User manual trigger (e.g. from context evaluation pillars or direct click)
  const triggerMoodQuote = useCallback(
    (mood: PersonalityMood) => {
      clearTimer();
      const candidates = PERSONALITY_QUOTES.filter((q) => q.mood === mood);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      if (chosen) {
        setCurrentQuote(chosen);
        setCurrentMood(chosen.expressionId);
        setIsBubbleVisible(true);

        if (onTriggerGesture) {
          onTriggerGesture(chosen.gestureId);
        }

        // Visible for 5 seconds then fade
        timerRef.current = setTimeout(() => {
          setIsBubbleVisible(false);
          timerRef.current = setTimeout(() => {
            setCurrentMood("neutral");
          }, 400);
        }, 5000);
      }
    },
    [clearTimer, onTriggerGesture]
  );

  // Dismiss currently visible bubble immediately
  const dismissBubble = useCallback(() => {
    clearTimer();
    setIsBubbleVisible(false);
    timerRef.current = setTimeout(() => {
      setCurrentMood("neutral");
      if (introState === "POPUP_1_GREETING") {
        setIntroState("POPUP_2_QUOTE");
      } else {
        setIntroState("INTRO_COMPLETED");
      }
    }, 300);
  }, [clearTimer, introState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    currentQuote,
    currentMood,
    isBubbleVisible,
    introState,
    startGreetingPopup,
    finishGreetingWave,
    triggerMoodQuote,
    dismissBubble,
  };
}
