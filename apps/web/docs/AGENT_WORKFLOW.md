# Agent Workflow

## Purpose
Define a repeatable multi-agent execution loop for this repository.

## Roles
- `analyzer`: gathers findings and creates a scoped task list.
- `refactorer`: applies code changes only for approved scope.
- `validator`: runs gates and reports actionable failures.

## Loop
1. Read `docs/ARCHITECTURE.md`, `docs/CODING_RULES.md`, and `docs/REFAC_CHECKLIST.md`.
2. Run analyzer scripts and emit reports.
3. Run safe refactor scripts.
4. Run validators (`lint`, `typecheck`, `test`, `smoke`).
5. Publish summary and unresolved items.

## Constraints
- Prefer small, reversible patches.
- Never hide failing gates.
- Keep failure reports at file/line granularity when possible.

## Done Definition
- Required gates pass.
- Updated docs are consistent with code behavior.
- CI artifact includes failure/success summary.
