"use client";

import { useSyncExternalStore } from "react";

export const ROBOT_FACE_EXPRESSIONS = [
  "IDLE",
  "LISTENING",
  "THINKING",
  "CODE_RECEIVED",
  "ANALYZING",
  "BUG_DETECTED",
  "REPAIRING",
  "TESTING",
  "SUCCESS",
  "ERROR",
  "SLEEPING",
] as const;

export type RobotFaceExpression = (typeof ROBOT_FACE_EXPRESSIONS)[number];

type FaceEntry = {
  expression: RobotFaceExpression;
  timer: ReturnType<typeof setTimeout> | null;
};

type FaceListener = () => void;

let applicationEntry: FaceEntry | null = null;
let interactionEntry: FaceEntry | null = null;
let automaticExpression: RobotFaceExpression = "IDLE";
let idleSeconds = 0;
const listeners = new Set<FaceListener>();

const priorities: Record<RobotFaceExpression, number> = {
  ERROR: 100,
  SUCCESS: 90,
  ANALYZING: 70,
  BUG_DETECTED: 70,
  REPAIRING: 70,
  TESTING: 70,
  CODE_RECEIVED: 65,
  LISTENING: 45,
  THINKING: 40,
  SLEEPING: 10,
  IDLE: 0,
};

function notify() {
  listeners.forEach((listener) => listener());
}

function clearEntry(entry: FaceEntry | null) {
  if (entry?.timer) clearTimeout(entry.timer);
}

export function subscribeRobotFace(listener: FaceListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRobotFaceExpression(): RobotFaceExpression {
  return applicationEntry?.expression ?? interactionEntry?.expression ?? automaticExpression;
}

export function useRobotFaceExpression(): RobotFaceExpression {
  return useSyncExternalStore(
    subscribeRobotFace,
    getRobotFaceExpression,
    () => "IDLE"
  );
}

/**
 * Integration point for real pipeline events. Call this only when the
 * corresponding application event actually occurs. No backend is connected yet.
 */
export function setRobotFaceApplicationState(
  expression: RobotFaceExpression,
  durationMs?: number
) {
  idleSeconds = 0;
  automaticExpression = "IDLE";

  if (expression === "IDLE") {
    clearEntry(applicationEntry);
    applicationEntry = null;
    notify();
    return;
  }

  if (
    applicationEntry &&
    priorities[expression] < priorities[applicationEntry.expression]
  ) {
    return;
  }

  clearEntry(applicationEntry);
  const entry: FaceEntry = { expression, timer: null };
  applicationEntry = entry;

  if (durationMs && durationMs > 0) {
    entry.timer = setTimeout(() => {
      if (applicationEntry !== entry) return;
      applicationEntry = null;
      notify();
    }, durationMs);
  }

  notify();
}

/** Short lived user reactions never replace an active application state. */
export function setRobotFaceInteraction(
  expression: RobotFaceExpression,
  durationMs = 1600
) {
  idleSeconds = 0;
  automaticExpression = "IDLE";
  clearEntry(interactionEntry);

  const entry: FaceEntry = { expression, timer: null };
  interactionEntry = entry;
  if (durationMs > 0) {
    entry.timer = setTimeout(() => {
      if (interactionEntry !== entry) return;
      interactionEntry = null;
      notify();
    }, durationMs);
  }
  notify();
}

export function clearRobotFaceInteraction() {
  clearEntry(interactionEntry);
  interactionEntry = null;
  notify();
}

export function reportRobotFaceActivity() {
  idleSeconds = 0;
  if (automaticExpression === "SLEEPING") {
    automaticExpression = "IDLE";
    notify();
  }
}

/** Called by the existing render loop; sleep is an automatic, low priority state. */
export function advanceRobotFaceIdle(dt: number) {
  if (applicationEntry || interactionEntry) {
    idleSeconds = 0;
    return;
  }

  idleSeconds += dt;
  const next = idleSeconds >= 90 ? "SLEEPING" : "IDLE";
  if (automaticExpression !== next) {
    automaticExpression = next;
    notify();
  }
}
