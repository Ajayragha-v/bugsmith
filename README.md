# Bugsmith Web

Bugsmith's public-facing scrollytelling website. This is a web experience, separate from the planned Windows desktop application.

## Stack

- Next.js App Router + React + TypeScript
- React Three Fiber + Three.js + Drei for the original Sketchfab robot
- GSAP + ScrollTrigger for reveal and horizontal-scroll choreography
- Lenis for smooth scrolling
- Tailwind CSS 4 foundation plus a custom CSS design system

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Verify

```bash
npm run typecheck
npm run build
```

## Main files

- `app/page.tsx` — application entry page.
- `app/layout.tsx` — metadata and global stylesheet.
- `app/globals.css` — complete responsive visual system.
- `components/BugsmithLanding.tsx` — page shell and active-section state.
- `components/HUDOverlay.tsx` — announcement bar, navigation and right-side progress scrubber.
- `components/ScrollySections.tsx` — hero, capabilities, method, Evidence & Benchmarks, and interactive evaluation walkthrough.
- `components/RobotScene.tsx` — loads and animates the supplied original GLB.
- `components/SmoothScroll.tsx` — Lenis / GSAP ScrollTrigger synchronization.
- `public/models/bugsmith-robot.glb` — byte-for-byte copy of the supplied 3D model.

## Robot asset handling

The supplied model is loaded from `/models/bugsmith-robot.glb`. The source GLB is copied unchanged. The app does not recolour, re-texture, remesh, or re-rig it. The scene applies only a containing-group fit-to-view transform, camera framing, lighting and subtle outer-group parallax. The embedded animation clip is played when available.

The GLB metadata identifies the asset as **“Robot from the series Love death and robots”** by **GreenG** (Sketchfab author `AngelNebesniy`), with a CC BY 4.0 attribution entry and this source URL:

<https://sketchfab.com/3d-models/robot-from-the-series-love-death-and-robots-3c2c43c8737341e5816c61634782373a>

The site footer displays attribution and links to the source and CC BY 4.0 licence. The uploaded model's licence metadata does not necessarily clear rights in the underlying franchise character or series. Obtain any separate rights needed before public commercial release.

## Accuracy notes

- The “Run sample walkthrough” panel is an illustrative front-end interaction. It is not connected to the live Bugsmith grading engine.
- No benchmark scores, customer testimonials, accuracy claims or speed claims are fabricated. The Evidence & Benchmarks section describes the intended evaluation evidence and explicitly marks public benchmark results as not yet published.
- The robot asset is approximately 23.7 MB. It is intentionally kept unchanged for this first integration; consider a separately generated optimized delivery copy only after confirming that optimization preserves the appearance and animation.

## Robot face state integration

The robot's animated eyes and expressions are painted into the existing visor UV island by `components/RobotVisorTexture.ts`. The renderer adds no geometry and does not change the GLB body. `components/RobotFaceState.ts` provides the shared state interface: use `setRobotFaceApplicationState` for real pipeline events and `setRobotFaceInteraction` for short user reactions. Application states take priority over temporary interactions.

The current frontend connects code-editor focus, file or project selection, and local payload preparation to face reactions. The `/repair` page does not currently mount the 3D robot, so those shared states become visible when a robot scene is mounted. There is no live analysis, repair, or verification backend event in this project, so `ANALYZING`, `BUG_DETECTED`, `REPAIRING`, `TESTING`, `SUCCESS`, and `ERROR` are not claimed as live pipeline results. Connect those states only when the corresponding real events are available. The face preview controls are shown only in development and override the renderer locally without changing shared application state.
