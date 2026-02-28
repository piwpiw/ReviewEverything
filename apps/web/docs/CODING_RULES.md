# Coding Rules

## Purpose
This document defines merge-blocking coding rules for `apps/web`.

## Required
- Use TypeScript types/interfaces for non-trivial data structures.
- Keep API contracts explicit and stable (`data`, `meta`, `error`).
- Prefer server components by default; use client components only when needed.
- Use `next/link` for internal navigation.
- Use `next/image` for campaign/media thumbnails unless there is a hard blocker.
- Handle async failures explicitly with safe fallback/error responses.

## Forbidden
- New `any` usage in app/runtime code.
- Silent catches that swallow errors.
- Inline DB query strings duplicated across routes.
- UI text corruption from encoding issues.

## Error Handling Standard
- `catch (error: unknown)` + safe formatter:
- Return structured errors in APIs.
- Log context once, not repeatedly in hot loops.

## Review Checklist
- Is behavior backward compatible?
- Are failure modes explicit?
- Is there a test for regression-sensitive logic?
- Do lint/typecheck/test pass locally and in CI?

## Test Minimum
- Unit tests for parser/normalizer/utility logic.
- API-path smoke checks for critical routes.
- Admin-trigger path should keep basic success/error behavior covered.
