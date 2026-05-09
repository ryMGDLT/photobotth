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

## Final Rule

When there is a conflict between complex AI features and performance, choose performance (keep the frame rate high).
When there is a conflict between convenience and browser compatibility, choose compatibility.
