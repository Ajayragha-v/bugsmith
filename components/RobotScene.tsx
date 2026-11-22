"use client";

import { Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import RobotWalkController from "./RobotWalkController";
import type { PersonalityMood } from "./RobotPersonalityController";
import { reportRobotFaceActivity, setRobotFaceInteraction, useRobotFaceExpression } from "./RobotFaceState";
import type { RobotFaceExpression } from "./RobotFaceState";

const MODEL_PATH = "/models/bugsmith-robot.glb";

export type ContextMode = "idle" | "analyse" | "grade" | "verify" | "learn";

export type GestureType = "idle" | "wave" | "nod" | "lookAround" | "think" | "celebrate";

export type RobotSceneHandle = {
  playGesture: (gesture: GestureType) => void;
  cycleNextGesture: () => void;
};

type RobotSceneProps = {
  activeMode?: ContextMode;
  activeSection?: string;
  enableAutoGestures?: boolean;
  enableAutoMovement?: boolean;
  faceExpressionOverride?: RobotFaceExpression | null;
  currentGesture?: GestureType;
  currentMood?: PersonalityMood | "neutral";
  onGestureChange?: (gesture: GestureType) => void;
  onWalkComplete?: () => void;
  onGreetingStart?: () => void;
  onGreetingEnd?: () => void;
  onHeadScreenPosition?: (pos: { x: number; y: number }) => void;
  onUnitClick?: () => void;
};

function ModelLoader() {
  return null;
}

function HeadScreenTracker({
  headBone,
  onScreenPos,
}: {
  headBone: THREE.Object3D | null;
  onScreenPos?: (pos: { x: number; y: number }) => void;
}) {
  const { camera, size, gl } = useThree();
  const tempVec = useRef(new THREE.Vector3());
  const lastPos = useRef({ x: 0, y: 0 });

  useFrame(() => {
    if (!headBone || !onScreenPos) return;

    headBone.getWorldPosition(tempVec.current);
    // Anchor slightly above center of head
    tempVec.current.y += 0.38;
    tempVec.current.x -= 0.10;

    tempVec.current.project(camera);

    // Get canvas client bounding box in window
    const rect = gl.domElement.getBoundingClientRect();
    const x = rect.left + (tempVec.current.x * 0.5 + 0.5) * rect.width;
    const y = rect.top + (-tempVec.current.y * 0.5 + 0.5) * rect.height;

    // Only invoke callback if moved more than 0.5px
    if (Math.abs(x - lastPos.current.x) > 0.5 || Math.abs(y - lastPos.current.y) > 0.5) {
      lastPos.current = { x, y };
      onScreenPos({ x, y });
    }
  });

  return null;
}

type RobotModelContainerProps = {
  activeMode: ContextMode;
  currentGesture: GestureType;
  enableAutoGestures: boolean;
  enableAutoMovement: boolean;
  faceExpression: RobotFaceExpression;
  onGestureEnd: () => void;
  onWalkComplete?: () => void;
  onGreetingStart?: () => void;
  onGreetingEnd?: () => void;
  onHeadScreenPosition?: (pos: { x: number; y: number }) => void;
  onTriggerRef: (fn: (gesture: GestureType) => void) => void;
  onUnitClick?: () => void;
};

function RobotModelContainer({
  activeMode,
  currentGesture,
  enableAutoGestures,
  enableAutoMovement,
  faceExpression,
  onGestureEnd,
  onWalkComplete,
  onGreetingStart,
  onGreetingEnd,
  onHeadScreenPosition,
  onTriggerRef,
  onUnitClick,
}: RobotModelContainerProps) {
  const { scene } = useGLTF(MODEL_PATH);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // Compute exact bounding box and normalize scale & ground offset.
  // Original geometry, materials, textures, UVs, and armature remain 100% untouched.
  const { scale, offset, headBone } = useMemo(() => {
    clonedScene.updateMatrixWorld(true);
    clonedScene.traverse((object) => {
      if ((object as THREE.SkinnedMesh).isSkinnedMesh) {
        const skinned = object as THREE.SkinnedMesh;
        skinned.computeBoundingBox();
        skinned.computeBoundingSphere();
      }
    });

    const bounds = new THREE.Box3().setFromObject(clonedScene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const height = Math.max(size.y, 0.001);

    // Target height: 3.1 units for a prominent hero stance
    const targetHeight = 3.1;
    const s = targetHeight / height;

    const head = clonedScene.getObjectByName("Head_02") || null;

    return {
      scale: s,
      // Grounding: place base of bounding box exactly at y = 0
      // Center X and Z so rotation happens around the character center
      offset: new THREE.Vector3(-center.x * s, -bounds.min.y * s, -center.z * s),
      headBone: head,
    };
  }, [clonedScene]);

  return (
    <>
      <RobotWalkController
        clonedScene={clonedScene}
        offset={offset}
        scale={scale}
        activeMode={activeMode}
        currentGesture={currentGesture}
        enableAutoGestures={enableAutoGestures}
        enableAutoMovement={enableAutoMovement}
        faceExpression={faceExpression}
        onGestureEnd={onGestureEnd}
        onWalkComplete={onWalkComplete}
        onGreetingStart={onGreetingStart}
        onGreetingEnd={onGreetingEnd}
        onUnitClick={onUnitClick}
        onTriggerRef={onTriggerRef}
      />
      <HeadScreenTracker headBone={headBone} onScreenPos={onHeadScreenPosition} />
    </>
  );
}

function ResponsiveFraming() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const width = size.width;
    if (width < 640) {
      camera.position.set(0, 1.45, 5.5);
      camera.fov = 36;
    } else if (width < 1024) {
      camera.position.set(0, 1.48, 5.2);
      camera.fov = 34;
    } else {
      camera.position.set(0, 1.5, 4.8);
      camera.fov = 34;
    }
    camera.lookAt(0, 1.45, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

const GESTURE_CYCLE: GestureType[] = ["wave", "nod", "lookAround", "think", "celebrate"];

const RobotScene = forwardRef<RobotSceneHandle, RobotSceneProps>(function RobotScene(
  {
    activeMode = "analyse",
    currentGesture = "idle",
    enableAutoGestures = true,
    enableAutoMovement = false,
    faceExpressionOverride = null,
    onGestureChange,
    onWalkComplete,
    onGreetingStart,
    onGreetingEnd,
    onHeadScreenPosition,
    onUnitClick,
  },
  ref
) {
  const applicationFaceExpression = useRobotFaceExpression();
  const faceExpression = process.env.NODE_ENV === "development" && faceExpressionOverride
    ? faceExpressionOverride
    : applicationFaceExpression;
  const [internalGesture, setInternalGesture] = useState<GestureType>(currentGesture);
  const triggerRef = useRef<((gesture: GestureType) => void) | null>(null);
  const cycleIndex = useRef(0);

  useEffect(() => {
    reportRobotFaceActivity();
    setRobotFaceInteraction("SLEEPING", 420);
  }, []);

  // Sync internal state with prop
  useEffect(() => {
    setInternalGesture(currentGesture);
  }, [currentGesture]);

  const handlePlayGesture = useCallback((gesture: GestureType) => {
    setInternalGesture(gesture);
    onGestureChange?.(gesture);
    if (triggerRef.current) {
      triggerRef.current(gesture);
    }
  }, [onGestureChange]);

  const handleCycleNext = useCallback(() => {
    cycleIndex.current = (cycleIndex.current + 1) % GESTURE_CYCLE.length;
    const nextGesture = GESTURE_CYCLE[cycleIndex.current];
    handlePlayGesture(nextGesture);
  }, [handlePlayGesture]);

  useImperativeHandle(ref, () => ({
    playGesture: handlePlayGesture,
    cycleNextGesture: handleCycleNext,
  }));

  const handleCanvasClick = () => {
    handleCycleNext();
    reportRobotFaceActivity();
    setRobotFaceInteraction("LISTENING", 1300);
    onUnitClick?.();
  };

  const handleGestureEnd = useCallback(() => {
    setInternalGesture("idle");
    onGestureChange?.("idle");
  }, [onGestureChange]);

  return (
    <div
      className="robot-canvas-container"
      aria-label="Bugsmith interactive 3D robot"
      onClick={handleCanvasClick}
      style={{ cursor: "pointer" }}
    >
      <Canvas
        shadows
        dpr={[1, 1.25]}
        camera={{ position: [0, 1.5, 4.8], fov: 34, near: 0.1, far: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#090A0D", 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <ResponsiveFraming />

        {/* Ambient & Hemisphere base fill */}
        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#f2f3f5", "#090A0D", 0.85]} />

        {/* Key light — crisp directional lighting with wide coverage covering entrance path */}
        <directionalLight
          position={[4.2, 6.5, 4.5]}
          intensity={2.6}
          castShadow
          shadow-mapSize={[512, 512]}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-camera-left={-3.5}
          shadow-camera-right={4.5}
          shadow-camera-top={3.5}
          shadow-camera-bottom={-0.5}
          shadow-bias={-0.0001}
          color="#ffffff"
        />

        {/* Secondary fill — cool slate grey to reveal mechanical depth */}
        <directionalLight
          position={[-4.5, 3.2, 2.5]}
          intensity={1.1}
          color="#747B87"
        />

        {/* Crisp rim light — delineates robot silhouette against deep black */}
        <directionalLight
          position={[0, 4.8, -4.2]}
          intensity={1.9}
          color="#f2f3f5"
        />

        {/* Industrial red accent point lights (#C8323E) */}
        <pointLight
          position={[1.8, 1.1, 2.0]}
          intensity={14}
          distance={6}
          color="#C8323E"
        />
        <pointLight
          position={[-1.8, 0.5, 0.8]}
          intensity={6}
          distance={4}
          color="#C8323E"
        />

        {/* Realistic ground contact shadow across full travel span */}
        <ContactShadows
          position={[1.0, 0, 0]}
          opacity={0.65}
          scale={[8.0, 4.8]}
          blur={1.8}
          far={3}
          resolution={256}
          frames={1}
          color="#040507"
        />

        {/* Model loaded with Suspense */}
        <Suspense fallback={<ModelLoader />}>
          <RobotModelContainer
            activeMode={activeMode}
            currentGesture={internalGesture}
            faceExpression={faceExpression}
            enableAutoGestures={enableAutoGestures}
            enableAutoMovement={enableAutoMovement}
            onGestureEnd={handleGestureEnd}
            onWalkComplete={onWalkComplete}
            onGreetingStart={onGreetingStart}
            onGreetingEnd={onGreetingEnd}
            onHeadScreenPosition={onHeadScreenPosition}
            onUnitClick={handleCanvasClick}
            onTriggerRef={(fn) => {
              triggerRef.current = fn;
            }}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

export default RobotScene;

useGLTF.preload(MODEL_PATH);
