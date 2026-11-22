"use client";

import * as THREE from "three";
import type { RobotFaceExpression } from "./RobotFaceState";

type MouthStyle = "smile" | "flat" | "open" | "frown" | "grin";

type FaceStyle = {
  eyeWidth: number;
  eyeHeight: number;
  eyeOpen: number;
  pupilY: number;
  browLift: number;
  browTilt: number;
  smileEyes: number;
  scan: number;
  scanSpeed: number;
  mouth: MouthStyle;
};

const FACE_STYLES: Record<RobotFaceExpression, FaceStyle> = {
  IDLE: { eyeWidth: 0.39, eyeHeight: 0.49, eyeOpen: 0.84, pupilY: 0, browLift: 0.02, browTilt: 0, smileEyes: 0.08, scan: 0, scanSpeed: 0.8, mouth: "smile" },
  LISTENING: { eyeWidth: 0.40, eyeHeight: 0.54, eyeOpen: 0.96, pupilY: -0.01, browLift: 0.08, browTilt: 0, smileEyes: 0, scan: 0, scanSpeed: 0.8, mouth: "smile" },
  THINKING: { eyeWidth: 0.37, eyeHeight: 0.42, eyeOpen: 0.72, pupilY: 0.10, browLift: 0.05, browTilt: -0.10, smileEyes: 0, scan: 0, scanSpeed: 0.8, mouth: "flat" },
  CODE_RECEIVED: { eyeWidth: 0.42, eyeHeight: 0.61, eyeOpen: 1.12, pupilY: 0, browLift: 0.15, browTilt: 0, smileEyes: 0, scan: 0, scanSpeed: 0.8, mouth: "open" },
  ANALYZING: { eyeWidth: 0.39, eyeHeight: 0.47, eyeOpen: 0.82, pupilY: 0.01, browLift: -0.04, browTilt: -0.04, smileEyes: 0, scan: 0.10, scanSpeed: 1.55, mouth: "flat" },
  BUG_DETECTED: { eyeWidth: 0.42, eyeHeight: 0.59, eyeOpen: 1.08, pupilY: -0.02, browLift: 0.12, browTilt: 0.04, smileEyes: 0, scan: 0, scanSpeed: 0.8, mouth: "open" },
  REPAIRING: { eyeWidth: 0.38, eyeHeight: 0.40, eyeOpen: 0.68, pupilY: 0.01, browLift: -0.12, browTilt: -0.06, smileEyes: 0, scan: 0.05, scanSpeed: 0.9, mouth: "flat" },
  TESTING: { eyeWidth: 0.39, eyeHeight: 0.45, eyeOpen: 0.78, pupilY: 0, browLift: -0.04, browTilt: 0, smileEyes: 0, scan: 0.14, scanSpeed: 2.2, mouth: "flat" },
  SUCCESS: { eyeWidth: 0.40, eyeHeight: 0.50, eyeOpen: 0.82, pupilY: 0.04, browLift: 0.11, browTilt: 0, smileEyes: 1, scan: 0, scanSpeed: 0.8, mouth: "grin" },
  ERROR: { eyeWidth: 0.39, eyeHeight: 0.44, eyeOpen: 0.72, pupilY: -0.07, browLift: -0.14, browTilt: 0.10, smileEyes: 0, scan: 0, scanSpeed: 0.8, mouth: "frown" },
  SLEEPING: { eyeWidth: 0.39, eyeHeight: 0.45, eyeOpen: 0, pupilY: 0, browLift: -0.02, browTilt: 0, smileEyes: 0, scan: 0, scanSpeed: 0.8, mouth: "smile" },
};

const TRANSITION_SECONDS: Record<RobotFaceExpression, number> = {
  IDLE: 0.42,
  LISTENING: 0.32,
  THINKING: 0.55,
  CODE_RECEIVED: 0.20,
  ANALYZING: 0.36,
  BUG_DETECTED: 0.18,
  REPAIRING: 0.40,
  TESTING: 0.30,
  SUCCESS: 0.34,
  ERROR: 0.24,
  SLEEPING: 0.85,
};

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function cloneStyle(style: FaceStyle): FaceStyle {
  return { ...style };
}

function blendStyle(from: FaceStyle, to: FaceStyle, t: number): FaceStyle {
  return {
    eyeWidth: mix(from.eyeWidth, to.eyeWidth, t),
    eyeHeight: mix(from.eyeHeight, to.eyeHeight, t),
    eyeOpen: mix(from.eyeOpen, to.eyeOpen, t),
    pupilY: mix(from.pupilY, to.pupilY, t),
    browLift: mix(from.browLift, to.browLift, t),
    browTilt: mix(from.browTilt, to.browTilt, t),
    smileEyes: mix(from.smileEyes, to.smileEyes, t),
    scan: mix(from.scan, to.scan, t),
    scanSpeed: mix(from.scanSpeed, to.scanSpeed, t),
    mouth: t < 0.5 ? from.mouth : to.mouth,
  };
}

/** Paints animated eyes into the existing visor UV island, without adding geometry. */
export class RobotVisorTextureManager {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly emissiveTexture: THREE.CanvasTexture;
  private readonly material: THREE.MeshStandardMaterial;
  private currentExpression: RobotFaceExpression = "IDLE";
  private fromStyle = cloneStyle(FACE_STYLES.IDLE);
  private toStyle = cloneStyle(FACE_STYLES.IDLE);
  private transitionProgress = 1;
  private transitionDuration = 0.4;
  private elapsed = 0;
  private blinkTimer = 0;
  private nextBlinkTime = 3.2 + Math.random() * 2.2;
  private blinkProgress = 0;
  private isBlinking = false;
  private glanceTimer = 0;
  private nextGlanceTime = 1.5 + Math.random() * 2.5;
  private pupilX = 0;
  private targetPupilX = 0;
  private frameAccumulator = 0;
  private textureDirty = true;
  private isDisposed = false;
  private readonly motionQuery: MediaQueryList;
  private reducedMotion: boolean;

  // Solved from the existing GLB visor UV island. These map normalized screen
  // coordinates onto the original face screen; no mesh or body transforms change.
  private readonly A_U = 0;
  private readonly B_U = 427;
  private readonly A_V = -235;
  private readonly B_V = -8;
  private readonly CX = 1942;
  private readonly CY = 1453;
  private readonly TEXTURE_SCALE = 0.5;

  constructor(skinnedMesh: THREE.SkinnedMesh) {
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = this.motionQuery.matches;
    this.motionQuery.addEventListener("change", this.handleMotionPreferenceChange);

    const originalMaterial = skinnedMesh.material as THREE.MeshStandardMaterial;
    this.material = originalMaterial.clone();
    skinnedMesh.material = this.material;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 2048;
    this.canvas.height = 2048;
    const context = this.canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context is unavailable for the robot visor.");
    this.ctx = context;

    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, 2048, 2048);
    if (originalMaterial.emissiveMap?.image) {
      try {
        const image = originalMaterial.emissiveMap.image as CanvasImageSource;
        this.ctx.drawImage(image, 0, 0, 2048, 2048);
      } catch {
        // A black visor remains a safe fallback when the source texture is unavailable.
      }
    }

    this.emissiveTexture = new THREE.CanvasTexture(this.canvas);
    this.emissiveTexture.flipY = false;
    this.emissiveTexture.colorSpace = THREE.SRGBColorSpace;
    this.emissiveTexture.generateMipmaps = false;
    this.emissiveTexture.minFilter = THREE.LinearFilter;
    this.emissiveTexture.magFilter = THREE.LinearFilter;
    this.material.emissiveMap = this.emissiveTexture;
    this.material.emissive = new THREE.Color(1, 1, 1);
    this.material.emissiveIntensity = 1;
    this.material.needsUpdate = true;
    this.renderVisor(this.fromStyle, this.fromStyle, this.toStyle, 1, 0, 0, 0);
  }

  public setExpression(expression: RobotFaceExpression) {
    if (this.currentExpression === expression) return;
    const current = this.transitionProgress >= 1
      ? cloneStyle(this.toStyle)
      : blendStyle(this.fromStyle, this.toStyle, this.ease(this.transitionProgress));
    this.fromStyle = current;
    this.toStyle = cloneStyle(FACE_STYLES[expression]);
    this.currentExpression = expression;
    this.transitionProgress = 0;
    this.transitionDuration = TRANSITION_SECONDS[expression];
    if (this.reducedMotion) {
      this.fromStyle = cloneStyle(this.toStyle);
      this.transitionProgress = 1;
    }
    this.textureDirty = true;
  }

  private handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches;
    if (this.reducedMotion) {
      this.fromStyle = cloneStyle(this.toStyle);
      this.transitionProgress = 1;
      this.pupilX = 0;
      this.targetPupilX = 0;
      this.isBlinking = false;
      this.blinkProgress = 0;
    }
    this.textureDirty = true;
  };

  public update(dt: number) {
    if (this.isDisposed) return;
    this.elapsed += dt;
    if (this.reducedMotion) {
      if (this.textureDirty) {
        this.renderVisor(this.toStyle, this.fromStyle, this.toStyle, 1, 0, 0, 0);
        this.textureDirty = false;
      }
      return;
    }
    let animating = false;

    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + dt / this.transitionDuration);
      animating = this.transitionProgress < 1;
      this.textureDirty = true;
    }

    if (this.currentExpression !== "SLEEPING") {
      this.blinkTimer += dt;
      if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
        this.isBlinking = true;
        this.blinkTimer = 0;
      }
      if (this.isBlinking) {
        this.blinkProgress = Math.sin(Math.min(1, this.blinkTimer / 0.14) * Math.PI);
        if (this.blinkTimer >= 0.14) {
          this.isBlinking = false;
          this.blinkProgress = 0;
          this.nextBlinkTime = 3.2 + Math.random() * 2.8;
        }
        this.textureDirty = true;
        animating = true;
      }
    }

    if (this.currentExpression === "IDLE") {
      this.glanceTimer += dt;
      if (this.glanceTimer >= this.nextGlanceTime) {
        this.targetPupilX = (Math.random() - 0.5) * 0.12;
        this.glanceTimer = 0;
        this.nextGlanceTime = 1.8 + Math.random() * 3.2;
      }
    } else if (this.currentExpression === "THINKING") {
      this.targetPupilX = -0.07;
    } else if (this.currentExpression === "ANALYZING" || this.currentExpression === "TESTING") {
      this.targetPupilX = 0;
    } else {
      this.targetPupilX = 0;
    }

    const previousPupilX = this.pupilX;
    const scanStyle = this.transitionProgress >= 1 ? this.toStyle : blendStyle(this.fromStyle, this.toStyle, this.ease(this.transitionProgress));
    const scan = scanStyle.scan * Math.sin(this.elapsed * scanStyle.scanSpeed);
    const desiredPupilX = THREE.MathUtils.clamp(this.targetPupilX + scan, -0.12, 0.12);
    this.pupilX = THREE.MathUtils.damp(this.pupilX, desiredPupilX, 4.5, dt);
    if (Math.abs(previousPupilX - this.pupilX) > 0.001) {
      this.textureDirty = true;
      animating = true;
    }

    if (this.currentExpression === "SLEEPING") {
      this.textureDirty = true;
      animating = true;
    }

    this.frameAccumulator += dt;
    const scanning = this.currentExpression === "ANALYZING" || this.currentExpression === "TESTING";
    const renderInterval = this.currentExpression === "SLEEPING"
      ? 1 / 8
      : scanning
        ? 1 / 12
        : animating
          ? 1 / 24
          : 0.15;
    if (this.textureDirty && this.frameAccumulator >= renderInterval) {
      this.frameAccumulator = 0;
      const t = this.ease(this.transitionProgress);
      const style = blendStyle(this.fromStyle, this.toStyle, t);
      const breathing = this.currentExpression === "SLEEPING" ? Math.sin(this.elapsed * 1.2) * 0.012 : 0;
      this.renderVisor(style, this.fromStyle, this.toStyle, t, this.blinkProgress, this.pupilX, breathing);
      this.textureDirty = false;
    }
  }

  private ease(value: number) {
    return 1 - Math.pow(1 - value, 3);
  }

  private renderVisor(
    style: FaceStyle,
    fromStyle: FaceStyle,
    toStyle: FaceStyle,
    transition: number,
    blink: number,
    pupilX: number,
    breathing = 0
  ) {
    const ctx = this.ctx;
    ctx.fillStyle = "#000000";
    ctx.fillRect(1600 * this.TEXTURE_SCALE, 950 * this.TEXTURE_SCALE, 700 * this.TEXTURE_SCALE, 1000 * this.TEXTURE_SCALE);
    ctx.save();
    ctx.setTransform(
      this.A_U * this.TEXTURE_SCALE,
      this.B_U * this.TEXTURE_SCALE,
      this.A_V * this.TEXTURE_SCALE,
      this.B_V * this.TEXTURE_SCALE,
      this.CX * this.TEXTURE_SCALE,
      this.CY * this.TEXTURE_SCALE
    );

    // Keep every facial feature inside the physical visor screen.
    ctx.beginPath();
    ctx.roundRect(-0.96, -0.90, 1.92, 1.80, 0.16);
    ctx.clip();

    const eyeOpen = Math.max(0, style.eyeOpen * (1 - blink));
    this.drawEye(-0.42, 0.18 + breathing, style, eyeOpen, pupilX);
    this.drawEye(0.42, 0.18 + breathing, style, eyeOpen, pupilX);
    this.drawBrows(style);

    if (transition < 1 && fromStyle.mouth !== toStyle.mouth) {
      ctx.globalAlpha = 1 - transition;
      this.drawMouth(fromStyle.mouth);
      ctx.globalAlpha = transition;
      this.drawMouth(toStyle.mouth);
      ctx.globalAlpha = 1;
    } else {
      this.drawMouth(style.mouth);
    }

    ctx.restore();
    this.emissiveTexture.needsUpdate = true;
  }

  private drawEye(x: number, y: number, style: FaceStyle, open: number, pupilX: number) {
    const ctx = this.ctx;
    const rx = style.eyeWidth / 2;
    const ry = Math.max(0.012, (style.eyeHeight / 2) * open);

    if (open < 0.08) {
      ctx.beginPath();
      ctx.moveTo(x - rx, y);
      ctx.quadraticCurveTo(x, y - 0.07, x + rx, y);
      ctx.strokeStyle = "#DDF7FF";
      ctx.lineWidth = 0.035;
      ctx.lineCap = "round";
      ctx.stroke();
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();

    const sclera = ctx.createRadialGradient(x - rx * 0.25, y - ry * 0.36, 0.01, x, y, rx * 1.2);
    sclera.addColorStop(0, "#FFFFFF");
    sclera.addColorStop(0.68, "#E8F4F8");
    sclera.addColorStop(1, "#A7C4D0");
    ctx.fillStyle = sclera;
    ctx.fillRect(x - rx, y - ry, rx * 2, ry * 2);

    const irisX = x + pupilX;
    const irisY = y - style.pupilY;
    const irisR = Math.min(rx * 0.52, ry * 0.72);
    const iris = ctx.createRadialGradient(irisX - irisR * 0.22, irisY - irisR * 0.25, 0.005, irisX, irisY, irisR);
    iris.addColorStop(0, "#81E9FF");
    iris.addColorStop(0.56, "#35B9DD");
    iris.addColorStop(1, "#14728F");
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, irisR, irisR * 1.06, 0, 0, Math.PI * 2);
    ctx.fillStyle = iris;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(irisX, irisY, irisR * 0.48, irisR * 0.57, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#102B3A";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(irisX - irisR * 0.25, irisY - irisR * 0.30, irisR * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(irisX + irisR * 0.22, irisY + irisR * 0.20, irisR * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(185,235,247,0.8)";
    ctx.lineWidth = 0.018;
    ctx.stroke();

    const lid = THREE.MathUtils.clamp(1 - open, 0, 0.36);
    if (lid > 0.01) {
      ctx.beginPath();
      ctx.moveTo(x - rx, y - ry * 0.3);
      ctx.quadraticCurveTo(x, y - ry * (1.2 + lid), x + rx, y - ry * 0.3);
      ctx.strokeStyle = "rgba(93,169,190,0.95)";
      ctx.lineWidth = 0.035;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    if (style.smileEyes > 0.1) {
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.9, y + ry * 0.22);
      ctx.quadraticCurveTo(x, y + ry * (0.85 + style.smileEyes * 0.7), x + rx * 0.9, y + ry * 0.22);
      ctx.strokeStyle = `rgba(33,104,126,${style.smileEyes * 0.75})`;
      ctx.lineWidth = 0.045 * style.smileEyes;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  private drawBrows(style: FaceStyle) {
    const ctx = this.ctx;
    const centers = [-0.42, 0.42];
    ctx.strokeStyle = "rgba(181,231,244,0.92)";
    ctx.lineWidth = 0.035;
    ctx.lineCap = "round";
    centers.forEach((x, index) => {
      const tilt = style.browTilt * (index === 0 ? -1 : 1);
      const y = 0.52 + style.browLift;
      ctx.beginPath();
      ctx.moveTo(x - 0.15, y - tilt);
      ctx.quadraticCurveTo(x, y + 0.06 - Math.abs(style.browLift) * 0.3, x + 0.15, y + tilt);
      ctx.stroke();
    });
  }

  private drawMouth(style: MouthStyle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "#DDF7FF";
    ctx.fillStyle = "rgba(221,247,255,0.92)";
    ctx.lineWidth = 0.035;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    if (style === "open") {
      ctx.ellipse(0, -0.48, 0.085, 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (style === "flat") {
      ctx.moveTo(-0.18, -0.48);
      ctx.lineTo(0.18, -0.48);
      ctx.stroke();
    } else if (style === "frown") {
      ctx.moveTo(-0.20, -0.50);
      ctx.quadraticCurveTo(0, -0.62, 0.20, -0.50);
      ctx.stroke();
    } else if (style === "grin") {
      ctx.moveTo(-0.23, -0.43);
      ctx.quadraticCurveTo(0, -0.68, 0.23, -0.43);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.16, -0.47);
      ctx.quadraticCurveTo(0, -0.58, 0.16, -0.47);
      ctx.strokeStyle = "rgba(77,166,190,0.9)";
      ctx.lineWidth = 0.018;
      ctx.stroke();
    } else {
      ctx.moveTo(-0.21, -0.46);
      ctx.quadraticCurveTo(0, -0.60, 0.21, -0.46);
      ctx.stroke();
    }
    ctx.restore();
  }

  public dispose() {
    this.isDisposed = true;
    this.motionQuery.removeEventListener("change", this.handleMotionPreferenceChange);
    this.emissiveTexture.dispose();
    this.material.dispose();
  }
}
