"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ContextMode, GestureType } from "./RobotScene";
import { RobotVisorTextureManager } from "./RobotVisorTexture";
import { advanceRobotFaceIdle } from "./RobotFaceState";
import type { RobotFaceExpression } from "./RobotFaceState";

export type RobotWalkControllerProps = {
  clonedScene: THREE.Object3D;
  offset: THREE.Vector3;
  scale: number;
  activeMode: ContextMode;
  currentGesture: GestureType;
  enableAutoGestures?: boolean;
  enableAutoMovement?: boolean;
  faceExpression: RobotFaceExpression;
  onGestureEnd: () => void;
  onWalkComplete?: () => void;
  onGreetingStart?: () => void;
  onGreetingEnd?: () => void;
  onUnitClick?: () => void;
  onTriggerRef?: (fn: (gesture: GestureType) => void) => void;
};

// Target angles in radians
// Character natural front in GLB is +X.
// At HERO_YAW = -1.75 rad (~ -100 deg): faces towards viewer (+Z) with subtle ~10 deg angle towards left headline.
// At WALK_LEFT_YAW = -2.70 rad (~ -155 deg): faces left into travel direction (-X) with 3/4 angle facing camera (+Z).
// At WALK_RIGHT_YAW = -0.75 rad (~ -43 deg): faces right into travel direction (+X).
const HERO_YAW = -1.75;
const WALK_LEFT_YAW = -2.70;
const WALK_RIGHT_YAW = -0.75;

// Desktop Protected text corridor: Left 35% is strictly protected
// Right 65% is safe roaming region: X in [-0.15, 0.55]
// Hero center position moved slightly left for optimal visual balance with editorial column
const MIN_ROAM_X = -0.15;
const MAX_ROAM_X = 0.55;
const HERO_STOP_X = 0.20;

export default function RobotWalkController({
  clonedScene,
  offset,
  scale,
  activeMode,
  currentGesture,
  enableAutoGestures = true,
  enableAutoMovement = false,
  faceExpression,
  onGestureEnd,
  onWalkComplete,
  onGreetingStart,
  onGreetingEnd,
  onUnitClick,
  onTriggerRef,
}: RobotWalkControllerProps) {
  // Transform group references
  const rootGroupRef = useRef<THREE.Group>(null);
  const orientGroupRef = useRef<THREE.Group>(null);
  const stageRef = useRef<THREE.Group>(null);

  // Visor Texture Manager for original face display
  const visorManagerRef = useRef<RobotVisorTextureManager | null>(null);

  // Bone references
  const hipLRef = useRef<THREE.Object3D | null>(null);
  const hipRRef = useRef<THREE.Object3D | null>(null);
  const kneeLRef = useRef<THREE.Object3D | null>(null);
  const kneeRRef = useRef<THREE.Object3D | null>(null);
  const armR1Ref = useRef<THREE.Object3D | null>(null);
  const armR2Ref = useRef<THREE.Object3D | null>(null);
  const armL1Ref = useRef<THREE.Object3D | null>(null);
  const armL2Ref = useRef<THREE.Object3D | null>(null);
  const spineRef = useRef<THREE.Object3D | null>(null);
  const headRef = useRef<THREE.Object3D | null>(null);
  const earLRef = useRef<THREE.Object3D | null>(null);
  const earRRef = useRef<THREE.Object3D | null>(null);

  // Cached rest quaternions
  const restQuats = useRef<{
    hipL: THREE.Quaternion;
    hipR: THREE.Quaternion;
    kneeL: THREE.Quaternion;
    kneeR: THREE.Quaternion;
    armR1: THREE.Quaternion;
    armR2: THREE.Quaternion;
    armL1: THREE.Quaternion;
    armL2: THREE.Quaternion;
    spine: THREE.Quaternion;
    head: THREE.Quaternion;
  } | null>(null);

  // Interaction tracking state (Normalized Device Coordinates: Left = -1, Right = +1, Top = +1, Bottom = -1)
  const pointer = useRef({ x: 0, y: 0, inActiveRegion: false });
  const activeGestureRef = useRef<GestureType>(currentGesture);
  const gestureProgressRef = useRef<number>(0);
  const gestureDurationRef = useRef<number>(0);
  const isGreetingWave = useRef<boolean>(false);

  // Motion activity tracking (watches for idle > 5 seconds)
  const physicalActivityTimer = useRef<number>(0);
  const lastActionType = useRef<string>("none");
  const gestureCooldown = useRef<number>(0);
  const autonomousActionWait = useRef<number>(2.2 + Math.random() * 1.8);
  const prefersReducedMotion = useRef(false);

  // Smoothed head rotation angles (quaternion-based update avoiding Euler accumulation)
  const smoothedHeadPitch = useRef(0);
  const smoothedHeadYaw = useRef(0);
  const smoothedHeadRoll = useRef(0);
  const smoothedSpinePitch = useRef(0);
  const smoothedSpineYaw = useRef(0);
  const animationEuler = useRef(new THREE.Euler());
  const animationQuaternion = useRef(new THREE.Quaternion());
  const restArmR1Z = useRef(0);
  const restArmL1Z = useRef(0);

  // Locomotion state (Entrance + Bounded Roaming)
  const locomotion = useRef({
    time: 0,
    isWalking: true,
    isRoaming: false,
    hasCompletedEntrance: false,
    startX: 3.2, // Enters from off-screen right
    targetX: HERO_STOP_X, // Final hero position in right 65%
    walkDuration: 3.2,
    currentX: 3.2,
    currentYaw: WALK_LEFT_YAW,
    targetYaw: HERO_YAW,
    walkBlend: 1.0,
    roamTimer: 0,
    strideCycle: 0,
    jumpTime: 0,
    jumpDuration: 1.05,
  });

  // Method to play interactive gestures
  const playGesture = useCallback((gesture: GestureType) => {
    // CELEBRATION RULE: Celebration is strictly reserved for meaningful user interaction
    activeGestureRef.current = gesture;
    gestureProgressRef.current = 0;
    physicalActivityTimer.current = 0; // Reset physical activity watchdog

    if (gesture === "wave") {
      gestureDurationRef.current = 2.6;
    } else if (gesture === "nod") {
      gestureDurationRef.current = 2.0;
    } else if (gesture === "lookAround") {
      gestureDurationRef.current = 3.2;
    } else if (gesture === "think") {
      gestureDurationRef.current = 2.8;
    } else if (gesture === "celebrate") {
      gestureDurationRef.current = 3.0;
    } else {
      gestureDurationRef.current = 0;
    }
  }, []);

  // Expose trigger ref
  useEffect(() => {
    onTriggerRef?.(playGesture);
  }, [onTriggerRef, playGesture]);

  // Sync external prop changes
  useEffect(() => {
    if (currentGesture !== "idle") {
      playGesture(currentGesture);
    }
  }, [currentGesture, playGesture]);

  // Initialize Visor Texture Manager on cloned mesh
  useEffect(() => {
    let skinnedMesh: THREE.SkinnedMesh | null = null;
    clonedScene.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh && !skinnedMesh) {
        skinnedMesh = obj as THREE.SkinnedMesh;
      }
    });

    if (skinnedMesh) {
      visorManagerRef.current = new RobotVisorTextureManager(skinnedMesh);
      visorManagerRef.current.setExpression(faceExpression);
    }

    return () => {
      visorManagerRef.current?.dispose();
      visorManagerRef.current = null;
    };
  }, [clonedScene]);

  // Sync centralized application and interaction states to the visor.
  useEffect(() => {
    visorManagerRef.current?.setExpression(faceExpression);
  }, [faceExpression]);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      prefersReducedMotion.current = reduceMotion;
      if (reduceMotion) {
        locomotion.current.isWalking = false;
        locomotion.current.hasCompletedEntrance = true;
        locomotion.current.currentX = HERO_STOP_X;
        locomotion.current.currentYaw = HERO_YAW;
        locomotion.current.walkBlend = 0;
        onWalkComplete?.();
      }
    }
  }, [onWalkComplete]);

  // Cache bones and store rest-pose quaternions
  useEffect(() => {
    const hipL = clonedScene.getObjectByName("Noga1L_09") || null;
    const hipR = clonedScene.getObjectByName("Noga1R_011") || null;
    const kneeL = clonedScene.getObjectByName("Noga2L_010") || null;
    const kneeR = clonedScene.getObjectByName("Noga2R_012") || null;
    const armR1 = clonedScene.getObjectByName("ruka1R_07") || null;
    const armR2 = clonedScene.getObjectByName("ruka2R_08") || null;
    const armL1 = clonedScene.getObjectByName("ruka1L_05") || null;
    const armL2 = clonedScene.getObjectByName("ruka2L_06") || null;
    const spine = clonedScene.getObjectByName("spina_01") || null;
    const head = clonedScene.getObjectByName("Head_02") || null;
    const earL = clonedScene.getObjectByName("uhoL_03") || null;
    const earR = clonedScene.getObjectByName("uhoR_04") || null;

    hipLRef.current = hipL;
    hipRRef.current = hipR;
    kneeLRef.current = kneeL;
    kneeRRef.current = kneeR;
    armR1Ref.current = armR1;
    armR2Ref.current = armR2;
    armL1Ref.current = armL1;
    armL2Ref.current = armL2;
    spineRef.current = spine;
    headRef.current = head;
    earLRef.current = earL;
    earRRef.current = earR;

    if (hipL && hipR && kneeL && kneeR && armR1 && armR2 && armL1 && armL2 && spine && head) {
      restQuats.current = {
        hipL: hipL.quaternion.clone(),
        hipR: hipR.quaternion.clone(),
        kneeL: kneeL.quaternion.clone(),
        kneeR: kneeR.quaternion.clone(),
        armR1: armR1.quaternion.clone(),
        armR2: armR2.quaternion.clone(),
        armL1: armL1.quaternion.clone(),
        armL2: armL2.quaternion.clone(),
        spine: spine.quaternion.clone(),
        head: head.quaternion.clone(),
      };
      restArmR1Z.current = new THREE.Euler().setFromQuaternion(armR1.quaternion, "XYZ").z;
      restArmL1Z.current = new THREE.Euler().setFromQuaternion(armL1.quaternion, "XYZ").z;
    }

    clonedScene.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  // Pointer tracking in rightmost 65% region (NDC: Left = -1, Right = +1)
  // Left 35% boundary corresponds to NDC nx = -0.30
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const handlePointerMove = (e: PointerEvent) => {
      const nx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, 1 - (e.clientY / window.innerHeight) * 2));

      pointer.current.x = nx;
      pointer.current.y = ny;

      // Only active in right 65% interaction zone (nx >= -0.30)
      if (nx >= -0.30) {
        pointer.current.inActiveRegion = true;
        // Physical motion from cursor tracking resets activity watchdog
        physicalActivityTimer.current = 0;
      } else {
        // Left 35% is protected text region: smooth return to neutral forward gaze
        pointer.current.inActiveRegion = false;
      }

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        pointer.current.inActiveRegion = false;
      }, 3500);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      clearTimeout(idleTimer);
    };
  }, []);

  // Main 60fps render loop
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = clock.elapsedTime;
    const loc = locomotion.current;
    const rests = restQuats.current;
    // Face animation is independent of the body rig. Keep it running even if
    // a model version is missing one of the optional locomotion bones.
    advanceRobotFaceIdle(dt);
    visorManagerRef.current?.update(dt);
    if (!rests) return;

    // --- 1. PROCEDURAL ENTRANCE WALKING & WORLD TRANSLATION ---
    if (loc.isWalking) {
      loc.time += dt;
      loc.strideCycle += dt * 6.2;
      const progress = Math.min(loc.time / loc.walkDuration, 1.0);

      // Deceleration curve in final 25% of travel distance
      let u = progress;
      if (u > 0.75) {
        const decel = (u - 0.75) / 0.25;
        const eased = 1.0 - Math.pow(1.0 - decel, 3);
        u = 0.75 + 0.25 * eased;
      }

      const totalDist = loc.startX - loc.targetX;
      loc.currentX = loc.startX - u * totalDist;

      // Rotate from travel yaw to hero yaw in final 35% of entrance
      if (progress > 0.65) {
        const tRot = (progress - 0.65) / 0.35;
        const rotEased = 1.0 - Math.pow(1.0 - tRot, 2);
        loc.currentYaw = THREE.MathUtils.lerp(WALK_LEFT_YAW, HERO_YAW, rotEased);
      } else {
        loc.currentYaw = WALK_LEFT_YAW;
      }

      // Smoothly blend walking cycle to 0 as robot stops
      loc.walkBlend = Math.max(0, 1.0 - Math.pow(progress, 3));

      // Reset activity timer during physical entrance
      physicalActivityTimer.current = 0;

      if (progress >= 1.0) {
        loc.isWalking = false;
        loc.hasCompletedEntrance = true;
        loc.currentX = loc.targetX;
        loc.currentYaw = HERO_YAW;
        loc.walkBlend = 0;

        onWalkComplete?.();

        if (enableAutoGestures) {
          isGreetingWave.current = true;
          playGesture("wave");
          onGreetingStart?.();
        }
      }
    } else if (loc.isRoaming) {
      // --- 2. BOUNDED ROAMING IN RIGHTMOST 65% ---
      loc.roamTimer += dt;
      loc.strideCycle += dt * 5.8;
      const rProgress = Math.min(loc.roamTimer / 2.4, 1.0);

      // Smooth ease in/out translation
      const easeRoam = 0.5 - 0.5 * Math.cos(rProgress * Math.PI);
      const roamDist = loc.startX - loc.targetX;
      loc.currentX = loc.startX - easeRoam * roamDist;

      // Turn into travel direction
      loc.currentYaw = THREE.MathUtils.lerp(loc.currentYaw, loc.targetYaw, dt * 6.0);

      loc.walkBlend = Math.sin(rProgress * Math.PI);
      physicalActivityTimer.current = 0;

      if (rProgress >= 1.0) {
        loc.isRoaming = false;
        loc.currentX = loc.targetX;
        loc.walkBlend = 0;
        loc.targetYaw = HERO_YAW;
        lastActionType.current = "roam";
      }
    } else {
      // Stationary idle: orient smoothly to target yaw (Hero Yaw)
      loc.currentYaw = THREE.MathUtils.damp(loc.currentYaw, loc.targetYaw, 5.0, dt);
      loc.walkBlend = THREE.MathUtils.damp(loc.walkBlend, 0, 8.0, dt);
    }

    // Give the landing page guide occasional bursts of movement after its
    // entrance. The short walks stay within the hero's existing safe bounds.
    if (
      enableAutoMovement &&
      !prefersReducedMotion.current &&
      loc.hasCompletedEntrance &&
      !loc.isWalking &&
      !loc.isRoaming &&
      loc.jumpTime <= 0 &&
      activeGestureRef.current === "idle"
    ) {
      autonomousActionWait.current -= dt;
      if (autonomousActionWait.current <= 0) {
        if (Math.random() < 0.55) {
          let targetPos = MIN_ROAM_X + Math.random() * (MAX_ROAM_X - MIN_ROAM_X);
          if (Math.abs(targetPos - loc.currentX) < 0.22) {
            targetPos = loc.currentX < (MIN_ROAM_X + MAX_ROAM_X) / 2 ? MAX_ROAM_X : MIN_ROAM_X;
          }
          loc.startX = loc.currentX;
          loc.targetX = THREE.MathUtils.clamp(targetPos, MIN_ROAM_X, MAX_ROAM_X);
          loc.targetYaw = loc.targetX < loc.startX ? WALK_LEFT_YAW : WALK_RIGHT_YAW;
          loc.roamTimer = 0;
          loc.isRoaming = true;
        } else {
          loc.jumpTime = 0.001;
        }
        autonomousActionWait.current = 2.4 + Math.random() * 2.8;
      }
    }

    let jumpLift = 0;
    let jumpArmLift = 0;
    if (loc.jumpTime > 0) {
      loc.jumpTime += dt;
      const jumpProgress = Math.min(1, loc.jumpTime / loc.jumpDuration);
      const hop = Math.max(0, Math.sin(jumpProgress * Math.PI * 2));
      jumpLift = Math.pow(hop, 0.72) * 0.46;
      jumpArmLift = Math.pow(hop, 0.72);
      if (jumpProgress >= 1) loc.jumpTime = 0;
    }

    // Apply translation to root group
    if (rootGroupRef.current) {
      rootGroupRef.current.position.x = loc.currentX;
    }
    // Apply orientation to orient group
    if (orientGroupRef.current) {
      orientGroupRef.current.rotation.y = loc.currentYaw;
    }

    // --- 3. IDLE ACTIVITY WATCHDOG (< 5 SECONDS WITHOUT MOVEMENT) ---
    // If the robot has been physically motionless for ~4.5 seconds:
    // Trigger subtle non-celebration autonomous action
    if (enableAutoGestures && !loc.isWalking && !loc.isRoaming) {
      gestureCooldown.current = Math.max(0, gestureCooldown.current - dt);

      if (activeGestureRef.current === "idle" && !pointer.current.inActiveRegion) {
        physicalActivityTimer.current += dt;

        if (physicalActivityTimer.current >= 4.5 && gestureCooldown.current <= 0) {
          physicalActivityTimer.current = 0;
          gestureCooldown.current = 4.0;

          // Pick non-celebration action: lookAround, nod, think, or short roam
          const actions = ["lookAround", "nod", "think", "roam"].filter(
            (a) => a !== lastActionType.current
          );
          const chosen = actions[Math.floor(Math.random() * actions.length)];
          lastActionType.current = chosen;

          if (chosen === "roam") {
            // Pick a safe waypoint within [MIN_ROAM_X, MAX_ROAM_X]
            const targetPos =
              loc.currentX > HERO_STOP_X
                ? MIN_ROAM_X + Math.random() * 0.25 // Walk leftward
                : HERO_STOP_X + Math.random() * 0.30; // Walk rightward

            loc.startX = loc.currentX;
            loc.targetX = THREE.MathUtils.clamp(targetPos, MIN_ROAM_X, MAX_ROAM_X);
            loc.targetYaw = loc.targetX < loc.startX ? WALK_LEFT_YAW : WALK_RIGHT_YAW;
            loc.roamTimer = 0;
            loc.isRoaming = true;
          } else {
            playGesture(chosen as GestureType);
          }
        }
      }
    }

    // --- 4. GESTURE PROGRESSION ---
    let gestureWeight = 0;
    if (activeGestureRef.current !== "idle") {
      gestureProgressRef.current += dt;
      const progress = gestureProgressRef.current / Math.max(0.01, gestureDurationRef.current);

      if (progress >= 1.0) {
        const finished = activeGestureRef.current;
        activeGestureRef.current = "idle";
        gestureProgressRef.current = 0;
        gestureDurationRef.current = 0;

        if (finished === "wave" && isGreetingWave.current) {
          isGreetingWave.current = false;
          onGreetingEnd?.();
        }
        onGestureEnd();
      } else {
        // Smooth bell curve envelope 0 -> 1 -> 0
        gestureWeight = Math.sin(progress * Math.PI);
      }
    }

    // --- 5. PROCEDURAL BIPED WALKING KINEMATICS ---
    const strideFreq = 6.2;
    const stride = loc.isWalking || loc.isRoaming ? loc.strideCycle : time * strideFreq;
    const walkBlend = loc.walkBlend;
    const armR1RestZ = restArmR1Z.current;
    const armL1RestZ = restArmL1Z.current;

    // Natural alternating leg swinging
    const legSwingMax = 0.52 * walkBlend;
    const legL = Math.sin(stride) * legSwingMax;
    const legR = -Math.sin(stride) * legSwingMax;

    // Knee bending during backswing
    const kneeBendMax = 0.75 * walkBlend;
    const kneeL = Math.max(0, -Math.sin(stride - 0.4)) * kneeBendMax;
    const kneeR = Math.max(0, Math.sin(stride - 0.4)) * kneeBendMax;

    // Pelvic bounce and lateral weight transfer
    const verticalBounce = -Math.abs(Math.sin(stride)) * 0.08 * walkBlend;
    const lateralSway = Math.cos(stride) * 0.03 * walkBlend;

    if (stageRef.current) {
      stageRef.current.position.y = verticalBounce + jumpLift;
      stageRef.current.position.x = lateralSway;
    }

    // Apply leg rotations
    if (hipLRef.current) {
      hipLRef.current.quaternion
        .copy(rests.hipL)
        .multiply(animationQuaternion.current.setFromEuler(animationEuler.current.set(0, 0, legL, "XYZ")));
    }
    if (hipRRef.current) {
      hipRRef.current.quaternion
        .copy(rests.hipR)
        .multiply(animationQuaternion.current.setFromEuler(animationEuler.current.set(0, 0, legR, "XYZ")));
    }
    if (kneeLRef.current) {
      kneeLRef.current.quaternion
        .copy(rests.kneeL)
        .multiply(animationQuaternion.current.setFromEuler(animationEuler.current.set(0, 0, kneeL, "XYZ")));
    }
    if (kneeRRef.current) {
      kneeRRef.current.quaternion
        .copy(rests.kneeR)
        .multiply(animationQuaternion.current.setFromEuler(animationEuler.current.set(0, 0, -kneeR, "XYZ")));
    }

    // Counterbalancing arm swing
    const armSwingMax = 0.45 * walkBlend;
    const defaultArmR1Z = armR1RestZ + Math.sin(stride) * armSwingMax;
    const defaultArmL1Z = armL1RestZ - Math.sin(stride) * armSwingMax;

    // --- 6. GESTURE & CURSOR TRACKING BLENDING ---
    let targetArmR1Z = defaultArmR1Z;
    let targetArmR1Y = 0;
    let targetArmR2Z = 0;
    let targetArmL1Z = defaultArmL1Z;
    let targetArmL1Y = 0;
    let targetArmL2Z = 0;

    if (jumpArmLift > 0 && activeGestureRef.current === "idle") {
      targetArmR1Z = armR1RestZ + 0.82 * jumpArmLift;
      targetArmL1Z = armL1RestZ - 0.82 * jumpArmLift;
    }

    let gestureHeadPitch = 0;
    let gestureHeadYaw = 0;
    let gestureHeadRoll = 0;
    let targetEarBonus = 0;

    // Cursor tracking: only active in right 65% interaction region
    // Correct directions: Right -> Look Right (+Yaw), Left -> Look Left (-Yaw), Up -> Look Up (-Pitch), Down -> Look Down (+Pitch)
    let passiveHeadYaw = 0;
    let passiveHeadPitch = 0;
    let passiveHeadRoll = 0;
    let passiveSpineYaw = 0;
    let passiveSpinePitch = 0;

    if (pointer.current.inActiveRegion && !loc.isWalking && !loc.isRoaming) {
      const maxYaw = 0.55;
      const maxPitch = 0.32;
      const maxRoll = 0.08;

      passiveHeadYaw = THREE.MathUtils.clamp(pointer.current.x * maxYaw, -maxYaw, maxYaw);
      passiveHeadPitch = THREE.MathUtils.clamp(-pointer.current.y * maxPitch, -maxPitch, maxPitch);
      passiveHeadRoll = -pointer.current.x * maxRoll;

      passiveSpineYaw = pointer.current.x * 0.18;
      passiveSpinePitch = -pointer.current.y * 0.10;
    }

    // Context evaluation pillar idle poses
    if (activeMode === "analyse") {
      passiveHeadPitch -= 0.08;
      passiveHeadRoll += 0.05;
    } else if (activeMode === "grade") {
      passiveHeadPitch -= 0.10; // Proud upright
    } else if (activeMode === "verify") {
      passiveHeadPitch += 0.06; // Focused scan
    } else if (activeMode === "learn") {
      passiveHeadRoll -= 0.06;
    }

    // Specific Gestures
    const currentG = activeGestureRef.current;
    if (currentG === "wave") {
      // GREETING WAVE: Right arm raised, hand waving back and forth
      targetArmR1Z = 0.95 + Math.sin(time * 11) * 0.32;
      targetArmR1Y = 0.35;
      targetArmR2Z = 0.45;
      gestureHeadYaw = -0.15;
      gestureHeadRoll = 0.08;
      targetEarBonus = 0.18;
    } else if (currentG === "nod") {
      // GENTLE NOD
      gestureHeadPitch = Math.sin(time * 8.5) * 0.18;
      targetArmR1Z = armR1RestZ + 0.12;
      targetArmL1Z = armL1RestZ - 0.12;
      targetEarBonus = 0.12;
    } else if (currentG === "lookAround") {
      // LOOK AROUND / SARCASTIC GLANCE
      gestureHeadYaw = Math.sin(time * 2.8) * 0.50;
      gestureHeadPitch = Math.cos(time * 2.2) * 0.12;
      gestureHeadRoll = Math.sin(time * 2.5) * 0.10;
      targetEarBonus = 0.14;
    } else if (currentG === "think") {
      // CURIOUS / THINKING INVESTIGATION
      targetArmR1Z = 0.70;
      targetArmR1Y = 0.45;
      targetArmR2Z = 0.65;
      gestureHeadPitch = -0.08;
      gestureHeadYaw = 0.18;
      gestureHeadRoll = 0.12;
      targetEarBonus = 0.15;
    } else if (currentG === "celebrate") {
      // CELEBRATION (Triggered strictly on meaningful user interaction)
      targetArmR1Z = 1.15;
      targetArmL1Z = -1.15;
      targetArmR2Z = Math.sin(time * 12) * 0.25;
      targetArmL2Z = -Math.sin(time * 12) * 0.25;
      gestureHeadPitch = -0.15 + Math.sin(time * 14) * 0.06;
      targetEarBonus = 0.24;
    }

    // Priority blending: Explicit gestures override passive cursor tracking
    const finalHeadYaw = THREE.MathUtils.lerp(passiveHeadYaw, gestureHeadYaw, gestureWeight);
    const finalHeadPitch = THREE.MathUtils.lerp(passiveHeadPitch, gestureHeadPitch, gestureWeight);
    const finalHeadRoll = THREE.MathUtils.lerp(passiveHeadRoll, gestureHeadRoll, gestureWeight);

    const finalSpineYaw = THREE.MathUtils.lerp(passiveSpineYaw, 0, gestureWeight * 0.7);
    const finalSpinePitch = THREE.MathUtils.lerp(passiveSpinePitch, 0, gestureWeight * 0.7);

    // Apply head quaternion rotation
    smoothedHeadPitch.current = THREE.MathUtils.damp(smoothedHeadPitch.current, finalHeadPitch, 7.0, dt);
    smoothedHeadYaw.current = THREE.MathUtils.damp(smoothedHeadYaw.current, finalHeadYaw, 7.0, dt);
    smoothedHeadRoll.current = THREE.MathUtils.damp(smoothedHeadRoll.current, finalHeadRoll, 7.0, dt);

    if (headRef.current) {
      headRef.current.quaternion
        .copy(rests.head)
        .multiply(
          animationQuaternion.current.setFromEuler(
            animationEuler.current.set(smoothedHeadPitch.current, smoothedHeadYaw.current, smoothedHeadRoll.current, "YXZ")
          )
        );
    }

    // Apply spine rotation
    smoothedSpinePitch.current = THREE.MathUtils.damp(smoothedSpinePitch.current, finalSpinePitch, 6.0, dt);
    smoothedSpineYaw.current = THREE.MathUtils.damp(smoothedSpineYaw.current, finalSpineYaw, 6.0, dt);

    if (spineRef.current) {
      const breath = Math.sin(time * 1.8) * 0.012;
      spineRef.current.quaternion
        .copy(rests.spine)
        .multiply(
          animationQuaternion.current.setFromEuler(
            animationEuler.current.set(smoothedSpinePitch.current + breath, smoothedSpineYaw.current, 0, "YXZ")
          )
        );
    }

    // Apply arm rotations
    if (armR1Ref.current) {
      armR1Ref.current.rotation.z = THREE.MathUtils.damp(armR1Ref.current.rotation.z, targetArmR1Z, 8, dt);
      armR1Ref.current.rotation.y = THREE.MathUtils.damp(armR1Ref.current.rotation.y, targetArmR1Y, 8, dt);
    }
    if (armR2Ref.current) {
      armR2Ref.current.rotation.z = THREE.MathUtils.damp(armR2Ref.current.rotation.z, targetArmR2Z, 12, dt);
    }

    if (armL1Ref.current) {
      armL1Ref.current.rotation.z = THREE.MathUtils.damp(armL1Ref.current.rotation.z, targetArmL1Z, 8, dt);
      armL1Ref.current.rotation.y = THREE.MathUtils.damp(armL1Ref.current.rotation.y, targetArmL1Y, 8, dt);
    }
    if (armL2Ref.current) {
      armL2Ref.current.rotation.z = THREE.MathUtils.damp(armL2Ref.current.rotation.z, targetArmL2Z, 12, dt);
    }

    // Ear antennae twitch
    if (earLRef.current && earRRef.current) {
      const earTwitch = Math.sin(time * 3.2) * 0.04;
      earLRef.current.rotation.x = THREE.MathUtils.damp(
        earLRef.current.rotation.x,
        -0.44 + targetEarBonus + earTwitch,
        5,
        dt
      );
      earRRef.current.rotation.x = THREE.MathUtils.damp(
        earRRef.current.rotation.x,
        -0.44 + targetEarBonus + earTwitch * 0.85,
        5,
        dt
      );
    }
  });

  return (
    // 1. Root group: physically translates across the screen in world space within rightmost 65% [0.35, 1.30]
    <group ref={rootGroupRef} position={[locomotion.current.startX, 0, 0]}>
      {/* 2. Orientation group: turns toward walking travel direction or hero facing angle */}
      <group ref={orientGroupRef} rotation={[0, WALK_LEFT_YAW, 0]}>
        {/* 3. Base bounding-box grounding and scaling offset */}
        <group position={offset.toArray()} scale={scale}>
          <group ref={stageRef}>
            <primitive object={clonedScene} onClick={onUnitClick} />
          </group>
        </group>
      </group>
    </group>
  );
}
