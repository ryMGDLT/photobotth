## Summary

Refactor the wizard UI to feel like a real IRL photobooth: enforce a consistent **3:2 landscape** frame across the live camera view, captured photos, and photo previews; move all camera controls into a single overlay/bottom-sheet control surface (one source of truth); move Edit actions (Save / Draft / Download) into a matching overlay control bar; improve padding/margins and legibility in the Wizard header and Done screen; and update AGENTS.md with explicit UI/UX objectives.

## Current State Analysis (Repo Grounded)

### Camera step

- Live camera viewport is currently **portrait**: `aspect-[3/4]` in [camera-stage.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/camera-stage.tsx#L198-L207).
- Controls are duplicated:
  - Overlay controls exist (fullscreen/rotate/shutter + a “Filters & Effects” overlay panel) inside [camera-stage.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/camera-stage.tsx#L304-L462).
  - Separate right-side panels exist for capture mode / filters / effects + bottom buttons (“Enable camera”, “Countdown”, “Retake”) in [camera-stage.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/camera-stage.tsx#L465-L666).
- Capture output ratio is currently whatever the camera stream provides:
  - `getUserMedia` requests `width: 1280, height: 960` (already **4:3**) in [use-camera-booth.ts](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/hooks/use-camera-booth.ts#L110-L113).
  - Still captures set `canvas.width/height = video.videoWidth/video.videoHeight` (or swapped for rotation) and draw the full frame in [use-camera-booth.ts](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/hooks/use-camera-booth.ts#L153-L187).

### Editor step

- Preview image/video uses `aspect-[4/5]` (portrait) in [editor-panel.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/editor-panel.tsx#L86-L106).
- Actions (Save / Keep Draft / Download) are currently a standard button stack at the bottom in [editor-panel.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/editor-panel.tsx#L207-L239), not “overlay-like”.

### Done step

- “View Gallery” / “Take Another” are outline buttons with light text on a dark card background in [finish-screen.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/finish-screen.tsx#L38-L55); legibility can be low depending on background/opacity.

### Wizard header

- Header includes “FlashFrame Wizard” plus a descriptive line (“Keep the flow moving—…”) in [wizard-header.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/wizard-header.tsx#L41-L50).
- Layout is heavy on spacing and can look unbalanced on smaller widths (stats + exit cluster) in [wizard-header.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/wizard-header.tsx#L35-L83).

## Decisions Locked

- Camera ratio target: **Landscape 3:2** for live view + captured JPG + photo previews.
- Camera controls pattern: **Bottom sheet** overlay for mode/filters/effects (and related controls) and remove the redundant right-side panels.
- “Recent issues” reference: skipped (no external issue list to integrate in this change set).

## Proposed Changes (Decision-Complete)

### 1) Enforce 3:2 ratio across live camera + captured photos + previews

**Goal:** The user sees the same framing in Live → Editor → Gallery → Download (for single-photo captures).

- Update live camera viewport:
  - Change the main camera viewport wrapper from `aspect-[3/4]` to `aspect-[3/2]` in [camera-stage.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/camera-stage.tsx).
  - Keep `object-cover` on the video/webgl canvas to preserve “photobooth crop” feel.
  - Adjust max-width and centering so the live view is visually centered like a booth screen (no side panels).
- Update captured photo output:
  - In [use-camera-booth.ts](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/hooks/use-camera-booth.ts), introduce a small helper that:
    - Always sets the capture canvas to a fixed **3:2 landscape** output (e.g., derived from the source stream size but cropped to 3:2).
    - Crops the source frame to the 3:2 rectangle (center crop) before drawing.
    - Applies rotation inside the fixed 3:2 frame (rotation changes content orientation, but output stays 3:2).
  - Apply the same logic to:
    - Single photo capture path (existing `handleCapture`)
    - Video poster capture (`posterImage`) so thumbnails also match the 3:2 framing.
- Update photo previews:
  - Change preview aspect classes from `aspect-[4/5]` to `aspect-[3/2]` in:
    - [editor-panel.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/editor-panel.tsx)
    - [session-gallery.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/session-gallery.tsx) (thumbnail aspect)
  - Note: photo strips are a special output; the strip composition may remain strip-shaped, but each individual strip frame will be captured at 3:2.

### 2) Camera step: one-source-of-truth overlay controls + bottom sheet

**Goal:** No duplicated control surfaces. Everything the user can change lives in the overlay / bottom sheet.

- In [camera-stage.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/camera-stage.tsx):
  - Remove the entire right-side column panels (Capture Mode / Filters / Effects) and the bottom action group (“Enable Camera”, “Countdown”, “Retake”, download note).
  - Replace with a compact overlay control bar:
    - Center: shutter button (already exists).
    - Left/right: icon buttons that open a **bottom sheet**:
      - Mode (Photo / Strip / Video)
      - Filters
      - Effects
      - Countdown toggle + Retake (inside the same bottom sheet to keep overlay minimal)
  - Implement bottom sheet using plain Tailwind + React state (no new shadcn components are present in `components/ui/`).
    - Use `fixed inset-0` backdrop + `fixed bottom-0 left-0 right-0` sheet with safe-area padding.
    - Ensure keyboard + focus safety: close on ESC, close on backdrop click, focusable close button.
  - Ensure controls are disabled appropriately during busy/recording (same as today).

### 3) Editor step: move Save/Draft/Download into overlay action bar

**Goal:** Consistent “overlay controls” language between Camera and Editor.

- In [editor-panel.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/editor-panel.tsx):
  - Move “Save”, “Keep Draft”, “Download to Device” into an overlay bar anchored over the preview (bottom-center).
  - Remove the current stacked button section to reduce redundancy.
  - Keep the remaining preset/layout/sliders in the side column.
  - Maintain disabled states based on `busy`.

### 4) Done step: improve CTA text contrast

- In [finish-screen.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/finish-screen.tsx):
  - Adjust “View Gallery” and “Take Another” button styles so text is clearly legible:
    - Prefer light background + dark text (like Main Menu) or increase contrast via stronger border/background.
  - Ensure consistent icon + label alignment (padding/margins).

### 5) Wizard header: remove “Wizard” wording + simplify + fix spacing

- In [wizard-header.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/wizard-header.tsx):
  - Remove AI-ish title/description:
    - Replace “FlashFrame Wizard” badge with “FlashFrame”.
    - Remove the “Keep the flow moving—…” paragraph.
  - Reduce vertical padding and tighten spacing for mobile.
  - Make step indicator more subtle:
    - e.g. `Camera · 1/3` rather than large “Step 1 of 3 · …”.
  - Ensure exit/back controls don’t overflow on small screens.

### 6) Update AGENTS.md with explicit UI/UX objectives

- Append an “Objective” section (or add bullets under UI/UX) in [AGENTS.md](file:///c:/Users/shiro/dev-project-systems/photobotth/AGENTS.md):
  - Simple controls; eliminate redundancy.
  - Prefer one source of truth for control surfaces (avoid duplicated panels).
  - Mobile compatibility is required for all stage UIs.
  - Avoid verbose/assistant-y headings and descriptions in user-facing UI.

## File-Level Change List

- Update:
  - [features/photobooth/components/camera-stage.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/camera-stage.tsx)
  - [features/photobooth/hooks/use-camera-booth.ts](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/hooks/use-camera-booth.ts)
  - [features/photobooth/components/editor-panel.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/editor-panel.tsx)
  - [features/photobooth/components/session-gallery.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/session-gallery.tsx)
  - [features/photobooth/components/finish-screen.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/finish-screen.tsx)
  - [features/photobooth/components/wizard-header.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/wizard-header.tsx)
  - [AGENTS.md](file:///c:/Users/shiro/dev-project-systems/photobotth/AGENTS.md)
- Update tests (to match text/layout changes):
  - [features/photobooth/__tests__/photobooth-wizard.test.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/__tests__/photobooth-wizard.test.tsx)

## Assumptions

- “3:2 everywhere” applies to the **single-photo** workflow and thumbnails/previews; photo strips remain a distinct output shape but are built from 3:2 frames.
- We will not add new component libraries; bottom sheet is implemented with local markup + Tailwind.
- No new global state manager; keep state localized as per AGENTS.md.

## Verification Steps

- Visual regression (manual):
  - Camera frame displays as 3:2 and is centered on desktop and mobile.
  - All camera controls are only available via overlay + bottom sheet; right-side panels are gone.
  - Captured photo preview in Editor matches live framing (3:2).
  - Gallery thumbnails match 3:2 for photos.
  - Done screen buttons have high-contrast labels.
  - Wizard header has clean title (no “Wizard”), no extra description, and consistent spacing.
- Functional:
  - Capture photo/video works; strip mode still works.
  - Save/Draft/Download actions still work from Editor overlay.
- Tests:
  - Update failing RTL assertions tied to removed strings (“Live Camera Booth” can remain; header text assertions must reflect new wording).
