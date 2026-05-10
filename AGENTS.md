# AGENTS.md - Photobooth Engineering Standards

This document defines the engineering standards that all AI agents must follow when contributing to the **Photobooth** project.

## Core Principles

- **Feature-Based Architecture**: All domain-specific logic must live inside `features/`.
- **Client-Side Heavy**: This application runs largely in the browser (MediaPipe, IndexedDB). 
- **SSR Safety**: Use "use client" directives and browser-checks (e.g., `typeof window !== 'undefined'`) for all camera and storage services.
- **Strict TypeScript**: Avoid `any`. Use Zod for runtime type validation.
- **Keep logic out of UI**: Components should handle rendering; services should handle logic (MediaPipe setup, data persistence).
- **No Global State**: Prefer localized state or specialized storage services over heavy global state managers.

## Required Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 4 + Shadcn/UI
- **Computer Vision**: MediaPipe (Face Mesh)
- **Storage**: IndexedDB (Browser-based local storage)
- **Validation**: Zod
- **Testing**: Vitest + React Testing Library

## Feature-Based Folder Structure

The project follows a standard Next.js structure but encapsulates domain logic within `features/`.

```text
photobooth/
  app/                    # Next.js App Router (Pages, Layouts, CSS)
  features/
    photobooth/           # Main domain feature
      components/         # UI components (CameraStage, Editor, Gallery)
      services/           # Logic (PhotoEditor, PhotoboothStorage)
      schemas/            # Zod validation for photo metadata
      types/              # Shared TypeScript types
      utils/              # Helpers for photo manipulation
      __tests__/          # Unit tests for services
  components/             # Shared presentational components (ui/ folder)
  hooks/                  # Shared React hooks (use-media-query, etc.)
  lib/                    # Utility singletons and generic helpers
  public/                 # Static assets (overlays, models)
```

## Service Design Standards

### Storage Services (IndexedDB)
- Encapsulate all browser storage logic in `features/<feature>/services/`.
- Always handle "Database Busy" or "Quota Exceeded" errors.
- Ensure services do not crash during Server-Side Rendering (SSR).

Example Pattern:
```ts
export async function getStoredPhotos() {
  if (typeof window === 'undefined') return []; // SSR Safety
  const db = await openDatabase();
  // ... storage logic
}
```

### AI & Vision Services (MediaPipe)
- Initialize MediaPipe models once and reuse the instance.
- Clean up webcam streams and model listeners when components unmount.
- Keep coordinate transformation logic in `utils/`.

## Component Standards

- Use **Shadcn/UI** for base components.
- Favor **Server Components** for layouts and static shells.
- Use **Client Components** (`"use client"`) for anything touching MediaPipe, Canvas, or IndexedDB.
- Co-locate feature-specific UI in `features/<feature>/components/`.

## UI/UX & Design Standards

- **Uniform Layout**: All primary stage containers (Camera, Editor, Gallery) must use consistent aspect ratios and padding. Avoid layout shifts when switching pages.
- **Visual Excellence**: Implement designs that feel premium:
    - Use curated color palettes (OKLCH/HSL).
    - Use modern typography (Google Fonts).
    - Implement smooth micro-animations for interactions.
- **Responsiveness**: All containers must fit uniformly to the page width while maintaining their internal aspect ratio (e.g., using `aspect-ratio` or `object-fit`).
- **Objective**:
    - Use simple controls and eliminate redundant buttons (one source of truth per stage).
    - Keep user-facing titles and instructions minimal; avoid verbose "assistant-like" copy.
    - Ensure mobile-view compatibility for every stage and control surface.
    - When recurring UI regressions appear, encode the fix as a documented rule here to prevent repeat work.

### UI Objectives (Recurring Fixes)

The following principles must be followed to prevent repeated work:

1. **Simple Controls**: Eliminate complexity by having one source of truth per stage. Camera/Filter/Effect controls belong strictly on the camera overlay buttons.

2. **Reduce Redundant Buttons**: Avoid multiple buttons serving the same purpose. Each action should have a single, clear control point.

3. **Mobile-View Compatibility**: Every stage and control surface must be responsive and functional on mobile devices.

4. **Eliminate AI-Agent Added Descriptions**: Remove verbose titles and descriptions added by AI agents (e.g., "Live Camera Booth", "Edit + Style", "FlashFrame" branding). Keep user-facing text minimal and functional.

5. **Consistent Aspect Ratio**: All photo previews and captures must maintain a uniform 3:2 aspect ratio.

6. **Uniform Padding/Margins**: Components must have consistent spacing across all wizard stages to prevent layout shifts.

## Validation & Types

- Use **Zod** to validate photo metadata and session objects.
- Export types inferred from Zod schemas.
- Filenames should follow `name.schema.ts` or `name.types.ts`.

## Naming Conventions

- **Files**: kebab-case (e.g., `camera-stage.tsx`, `storage.service.ts`).
- **Components**: PascalCase (e.g., `PhotoboothApp`).
- **Functions/Variables**: camelCase.
- **Constants**: UPPER_SNAKE_CASE.

## Agent Execution Rules

All AI agents working in this project must:
- Add new code to the correct feature instead of generic folders.
- Reuse existing `PhotoboothStorage` service for persistence.
- Update tests when changing core logic in `services/`.
- Ensure all new components are responsive and follow Tailwind 4 standards.
- **Never** add Prisma or SQL dependencies unless explicitly requested.
- **Always** assume the role of "Act as a Senior Fullstack Developer" when implementing changes, planning, fixing errors, or running commands.
- **Prompt for human confirmation** when confused about changes or uncertain about implementation direction.

### Production Readiness Rules

The following rules must be followed for production/demo-ready code:

1. **No Ref Access During Render:** Never access `ref.current` during component render phase. Use state or effects instead.
2. **Complete Dependency Arrays:** All `useEffect`/`useMemo`/`useCallback` dependencies must be exhaustive. No missing refs or values.
3. **Input Sanitization:** All user-generated filenames/inputs must be strictly sanitized (remove path traversal chars, limit length to 100 chars).
4. **Minimum Touch Targets:** All interactive elements must be minimum **44px** on mobile (`min-h-[44px] min-w-[44px]`).
5. **Memory Cleanup:** All `MediaStream`, `MediaRecorder`, and canvas contexts must be explicitly cleaned up on unmount.
6. **Error User Feedback:** All errors must be surfaced to UI with clear messages, not just console logging.

## Stability Guidelines

- **Stop breaking features if they are stable and reusable** - Before modifying any working feature, consider if the change is necessary and test thoroughly
- **Prioritize reusable components of Shadcn and Tailwind instead of creating new** - Use existing UI components and utilities before building custom solutions
- **Test regressions before deploying** - Ensure existing functionality remains intact after changes
- **Keep changes minimal and focused** - Avoid over-engineering solutions that could break existing features

## Final Rule

When there is a conflict between complex AI features and performance, choose performance (keep the frame rate high).
When there is a conflict between convenience and browser compatibility, choose compatibility.
