# Refactor Checklist

## Goal
Run refactors incrementally with measurable safety checks.

## Pre-Refactor
- Confirm target files and invariants.
- Confirm architecture contract in `docs/ARCHITECTURE.md`.
- Run baseline gates (`lint`, `typecheck`, `test`).

## Automated Passes
1. Analyzer
- Detect `any` hotspots.
- Detect `<img>` usages in TSX.
- Detect mojibake/replacement characters.
2. Refactorer
- Apply only safe codemods.
- Keep edits atomic and reversible.
3. Validator
- Run `lint`, `typecheck`, `test`, and optional smoke.

## Merge Criteria
- No new lint errors.
- No typecheck failures.
- Tests green.
- Smoke green for configured deployment target.

## Post-Refactor
- Update docs when invariants changed.
- Attach CI summary artifact.
- Record unresolved warnings with owner and next action.
