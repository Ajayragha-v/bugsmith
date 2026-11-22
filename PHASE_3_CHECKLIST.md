# BUGSMITH — PHASE 3: CODE REPAIR WORKSPACE CHECKLIST

Status Legend:
- [ ] PENDING
- [x] PATCHED: Code written and unit-verified
- [x] VERIFIED: Tested in browser, built and verified without errors
- [!] BLOCKED: Blocked by external constraint

---

## 1. Project Inspection & Setup
- [x] Existing Next.js App Router structure inspected (`app/layout.tsx`, `app/page.tsx`, `components/BugsmithLanding.tsx`, `app/globals.css`). [VERIFIED]
- [x] Navigation and CTA components inspected. [VERIFIED]
- [x] Styling, typography and color palette inspected (`#090A0D`, `#F2F3F5`, `#C8323E`, `#747B87`, dark graphite). [VERIFIED]
- [x] Existing dependencies and absence of external editor or backend inspected. [VERIFIED]
- [x] Created `PHASE_3_CHECKLIST.md` to track progress across all requirements. [VERIFIED]

---

## 2. Page Identity & Route (/repair)
- [x] New `/repair` page created (`app/repair/page.tsx`). [VERIFIED]
- [x] Header includes Bugsmith branding with link back to home (`/`). [VERIFIED]
- [x] Primary heading: **"Let's fix something."** [VERIFIED]
- [x] Supporting text: *"Bring your code. Bugsmith will take a closer look."* [VERIFIED]
- [x] Minimal copy maintained without marketing paragraphs or unnecessary slash-separated technical labels. [VERIFIED]
- [x] No 3D mascot centerpiece on `/repair` (functional developer workspace). [VERIFIED]

---

## 3. Four Code Submission Methods
- [x] Clean tabbed / segmented navigation interface for the 4 methods (`Upload Files`, `Upload Project`, `GitHub`, `Paste Code`). [VERIFIED]
- [x] State preserved across tab switches (no accidental loss of inputs). [VERIFIED]

### Option 1 — Upload Files
- [x] Single file upload supported. [VERIFIED]
- [x] Multiple file upload supported. [VERIFIED]
- [x] Drag-and-drop file upload supported. [VERIFIED]
- [x] Display selected filenames, file sizes, and detected programming languages. [VERIFIED]
- [x] Remove individual selected files. [VERIFIED]
- [x] Replace uploaded files / Clear All. [VERIFIED]
- [x] Clear validation and error messages. [VERIFIED]

### Option 2 — Upload Project
- [x] ZIP project upload supported (`parseZipArchive`). [VERIFIED]
- [x] Folder selection supported (`webkitdirectory` / `parseDirectoryFiles`). [VERIFIED]
- [x] Compact project summary: Project name, number of files, detected languages, total upload size. [VERIFIED]
- [x] Exclusion of irrelevant directories (`node_modules`, `.git`, `.next`, `dist`, `build`, etc.). [VERIFIED]
- [x] File review list drawer before submission. [VERIFIED]

### Option 3 — GitHub
- [x] Clean GitHub submission interface. [VERIFIED]
- [x] Honest authentication state: indicates OAuth / backend integration is pending (no fake connection). [VERIFIED]
- [x] Repository URL input. [VERIFIED]
- [x] Branch selection input. [VERIFIED]
- [x] Subfolder / root directory input. [VERIFIED]
- [x] Repository review summary card. [VERIFIED]

### Option 4 — Paste Code
- [x] Large editable code area. [VERIFIED]
- [x] Synchronized line numbers (1..14+). [VERIFIED]
- [x] Language selection dropdown (20 languages) + auto-detection where possible. [VERIFIED]
- [x] Clear editor placeholder. [VERIFIED]
- [x] Copy and clear controls. [VERIFIED]
- [x] Basic code validation. [VERIFIED]

---

## 4. Required Repair Intent Input
- [x] Label: **"What needs to be fixed?"** [VERIFIED]
- [x] Placeholder: *"Describe the bug or the behaviour you expect."* [VERIFIED]
- [x] Multiline textarea supporting natural-language descriptions. [VERIFIED]
- [x] Mandatory validation (submission blocked with clear error banner if empty). [VERIFIED]

---

## 5. User-Defined Constraint Tests (Additional Requirement)
- [x] Label: **"Constraint tests"** [VERIFIED]
- [x] Subtitle: *"Define the rules your repaired code must satisfy."* [VERIFIED]
- [x] Placeholder: *"Example: Discount must be between 0 and 100%. Existing function signatures must remain unchanged. Empty input must return 0."* [VERIFIED]
- [x] Multiline textarea, separate from Repair Intent. [VERIFIED]
- [x] Optional field. [VERIFIED]
- [x] Persists across submission tab switches. [VERIFIED]
- [x] Included in structured submission payload under `constraintTests`. [VERIFIED]
- [x] Honest evaluation integration: automated constraint execution marked pending (no fabricated results). [VERIFIED]

---

## 6. Optional Error Context
- [x] Expandable section: **"Additional context (optional)"** (collapsed by default). [VERIFIED]
- [x] Error message or stack trace input. [VERIFIED]
- [x] Failed test output input. [VERIFIED]
- [x] Additional reproduction info input. [VERIFIED]
- [x] Fields remain optional. [VERIFIED]

---

## 7. Main Action & Evaluation Submission
- [x] Action button: **"Continue to Evaluation"**. [VERIFIED]
- [x] Client validation for code presence, repair intent, and file constraints. [VERIFIED]
- [x] Preparation of structured evaluation payload (`submissionMethod`, `source`, `repairIntent`, `constraintTests`, `additionalContext`). [VERIFIED]
- [x] Honest evaluation readiness presentation (no fake diffs or synthetic pass/fail results). [VERIFIED]
- [x] Clear validation error states when inputs are missing. [VERIFIED]

---

## 8. Landing Page Typography Refinement & Navigation
- [x] Header logo links back to `/`. [VERIFIED]
- [x] Landing page primary CTA (`RUN REPAIR BENCHMARKS →`) links to `/repair`. [VERIFIED]
- [x] Typography refined for improved readability (headline clamp, supporting text, button, technical labels). [VERIFIED]
- [x] Existing landing page hero composition, robot position, animations, and color palette preserved. [VERIFIED]

---

## 9. Verification & Quality Gates
- [x] TypeScript typecheck (`npm run typecheck` / `tsc --noEmit`) passes with 0 errors. [VERIFIED]
- [x] Next.js production build (`npm run build`) compiles successfully. [VERIFIED]
- [x] Responsive layout verified on mobile, tablet, and desktop. [VERIFIED]
- [x] Browser visual verification completed for both `/repair` and `/`. [VERIFIED]
