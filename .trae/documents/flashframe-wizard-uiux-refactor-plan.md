## Summary

Refactor the current “/” experience into a true Main Menu (Landing Page) and move the photobooth capture/edit flow into a strict, locked wizard under “/start”. Keep “/gallery” and “/about” as their own pages, but unify the look/feel via reusable layout/header components and consistent spacing.

## Current State Analysis (Repo Grounded)

- Routes today:
  - “/” renders [page.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/app/page.tsx#L1-L5) → [PhotoboothApp](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/photobooth-app.tsx#L24-L199), which includes an internal “welcome → camera → editor → success” state machine.
  - “/gallery” renders [gallery/page.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/app/gallery/page.tsx#L1-L5) → [GalleryPageContainer](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/gallery-page-container.tsx#L1-L57).
  - “/about” renders [about/page.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/app/about/page.tsx#L1-L57).
- Navigation:
  - [SectionNav](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/section-nav.tsx#L8-L42) links to “/”, “/gallery”, “/about”.
  - [SessionBanner](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/session-banner.tsx#L1-L67) shows SectionNav + ThemeToggle + session stats and expects `currentPage` including wizard steps.
- Wizard behavior:
  - Current wizard state is local state inside [PhotoboothApp](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/photobooth-app.tsx#L24-L199). “success” currently offers “View Gallery” and “Take Another”, but no “Main Menu”.
  - Gallery selection currently routes back to “/” ([gallery-page-container.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/gallery-page-container.tsx#L43-L49)), which will show the welcome step first.
- Session state:
  - Session photos and active selection are hydrated in [usePhotoboothGallery](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/hooks/use-photobooth-gallery.ts#L26-L156) and the active photo id is persisted in `sessionStorage`.

## Decisions Locked (From Clarifications)

- Wizard flow: 3-step (Camera → Edit/Save/Download → Finish).
- Navigation during wizard: locked (no free nav to Gallery/About while in Start).
- Gallery behavior: selecting a photo routes to Start at the Edit step with that photo selected.

## Proposed Changes

### 1) Routes: Main Menu + Start Wizard

- Update [app/page.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/app/page.tsx) to render a new Main Menu page component (Landing Page) instead of the wizard.
  - Landing UI requirements:
    - Title: “Welcome to Flashframe Photobooth”
    - Buttons: Start, Gallery, About us
    - Start routes to “/start” (wizard entry).
- Add a new “/start” route:
  - Create [app/start/page.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/app/start/page.tsx) to render the wizard entry.
  - Keep the wizard as a client component (camera + IndexedDB + media APIs).

### 2) Wizard Refactor (Strict 3-Step, Locked Navigation)

- Refactor [photobooth-app.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/photobooth-app.tsx) into a dedicated wizard component, e.g.:
  - Rename to `photobooth-wizard.tsx` (kebab-case per AGENTS.md).
  - Remove the internal “welcome” step entirely (welcome becomes Landing at “/”).
  - Wizard steps (string union) become: `"camera" | "editor" | "finish"`.
- Support opening directly into editor from Gallery:
  - On “/start”, read `searchParams` (e.g. `?step=editor`) to initialize the wizard step.
  - If `step=editor` but there is no `activePhotoId`, fall back to `"camera"`.
- Add a Finish step component:
  - New `finish-screen.tsx` under `features/photobooth/components/`.
  - Must include a “Back to Main Menu” button routing to “/”.
  - Also include “View Gallery” and “Take Another” actions (the current success step already has similar behavior).
  - Optional: show “Download last photo” if an active photo exists (reuse `downloadPhoto`).
- Locked navigation:
  - Do not render [SectionNav](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/section-nav.tsx) anywhere inside the wizard.
  - Provide explicit wizard navigation affordances:
    - Camera step: “Next” is gated on having at least one captured photo (already transitions on capture).
    - Editor step: add explicit “Continue” to reach Finish (independent of Save/Download so users can proceed after any action).
    - Provide “Exit to Main Menu” button (with confirm dialog if we decide to protect against accidental exits).

### 3) Navigation & Shared UI: Uniform, Reusable Elements

- Introduce a small set of reusable, presentational-only building blocks under `features/photobooth/components/` (no business logic):
  - `page-shell.tsx`: consistent max-width, padding, and responsive layout (mirrors the existing `main` container classes used across pages).
  - `site-header.tsx`: brand + optional subtitle + optional actions (ThemeToggle) + `SectionNav` (for non-wizard pages).
  - `wizard-header.tsx`: step title + step indicator (1/3, 2/3, 3/3) + “Exit to Main Menu” action.
- Update [SessionBanner](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/session-banner.tsx) usage:
  - Keep SessionBanner for Gallery/About if it matches the desired look; otherwise fold its UI into `site-header.tsx` and deprecate SessionBanner.
  - Ensure the “locked wizard” requirement is satisfied by not reusing SessionBanner in Start (since it currently always includes SectionNav).
- Update [SectionNav](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/section-nav.tsx) to reflect the new IA:
  - Add “Start” pointing to “/start”.
  - Rename the “/” item label to “Main Menu” (or “Home”) so “/” is clearly not the wizard anymore.
  - Remove the `currentPage` compatibility hack if no longer needed (prefer pathname-only).

### 4) Gallery → Start (Edit Step) Wiring

- Update [gallery-page-container.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/gallery-page-container.tsx#L43-L49):
  - On photo select: keep `setActivePhotoId(id)` (so the wizard opens with that selection),
  - Then route to `/start?step=editor` (instead of `/`).

### 5) Type Safety Cleanup (Small but High Value)

- Remove the `any` usage in [PhotoboothApp applyEdits](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/photobooth-app.tsx#L88-L91) during the refactor:
  - Use `EditorSettings` for the settings payload.
  - Keep “logic out of UI” by only typing the handler signatures; the actual edit logic remains in services/hooks.

### 6) Tests Update (Vitest + RTL)

- Update [photobooth-app.test.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/__tests__/photobooth-app.test.tsx) to target the renamed wizard component and the new behavior:
  - Add a test that rendering `/start` wizard begins at Camera by default.
  - Add a test that when initialized with `?step=editor` and there is an active photo, it renders the editor UI.
  - Update/replace the existing tests that currently pass a non-existent `currentPage` prop to PhotoboothApp.
- Add/adjust tests for Gallery routing behavior:
  - Mock `useRouter().push` and assert it is called with `/start?step=editor` when selecting a photo.

## File-Level Change List (Concrete Targets)

- Update:
  - [app/page.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/app/page.tsx)
  - [features/photobooth/components/section-nav.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/section-nav.tsx)
  - [features/photobooth/components/gallery-page-container.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/gallery-page-container.tsx)
  - [features/photobooth/__tests__/photobooth-app.test.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/__tests__/photobooth-app.test.tsx)
- Refactor/Rename:
  - [features/photobooth/components/photobooth-app.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/features/photobooth/components/photobooth-app.tsx) → `photobooth-wizard.tsx`
- Add:
  - [app/start/page.tsx](file:///c:/Users/shiro/dev-project-systems/photobotth/app/start/page.tsx)
  - `features/photobooth/components/main-menu.tsx` (Landing UI)
  - `features/photobooth/components/wizard-header.tsx`
  - `features/photobooth/components/finish-screen.tsx`
  - (Optional) `features/photobooth/components/page-shell.tsx`, `features/photobooth/components/site-header.tsx` if it materially reduces duplication across pages.

## Assumptions

- “Main Menu (Landing Page)” is the “/” route and is separate from the wizard.
- “Start” is the “/start” route (wizard).
- No new persistence model is required; we continue using the existing IndexedDB/session storage strategy in the photobooth feature.

## Verification Steps (After Implementation)

- Unit/integration:
  - Run `npm test` and ensure all Vitest tests pass (especially updated wizard + gallery routing tests).
- Manual UX checks (dev server):
  - “/” shows Main Menu with Start/Gallery/About actions.
  - “Start” enters Camera step and does not show free navigation.
  - Capture a photo → transitions to Editor.
  - From Editor → Continue → Finish.
  - Finish page:
    - “Back to Main Menu” routes to “/”.
    - “View Gallery” routes to “/gallery”.
    - “Take Another” routes back to Camera step.
  - From “/gallery”, selecting a photo routes to “/start?step=editor” and lands in the Editor with that photo active.
