<!-- /autoplan restore point: /Users/ryotamurakami/.gstack/projects/laststance-Engage/codex-p0b-operation-feedback-autoplan-restore-20260526.md -->

# P0-B Operation Feedback Plan

## Task

Implement `P0-B: Operation feedback system` from `TODOS.md`.

## Autoplan Routing

- Source: `TODOS.md`
- UI scope: yes
- DX scope: no
- Routed skills: `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`
- Skipped skill: `/plan-devex-review` because this is a user-facing mobile feedback task.

## Current Evidence

- `JournalInput` has saving/saved text but logs failed autosaves with no visible recovery.
- `BackupManager` uses blocking alerts for routine success and recoverable failures.
- `PresetTaskEditor` uses blocking alerts for validation and recoverable save/category failures.
- Destructive confirmation alerts in `BackupManager` and `PresetTaskEditor` are still appropriate.

## Decision

Add one shared inline feedback primitive and use it for non-destructive operation states. Keep destructive confirmation alerts.

## Implementation Tasks

1. Add `OperationFeedback` component for saving, success, error, and optional retry action.
2. Update `JournalInput` to show saving, saved, and failed states near the input, including retry.
3. Update `BackupManager` success/failure feedback to inline banners with retry for recoverable failures.
4. Update `PresetTaskEditor` validation/save/category errors to inline banners while keeping destructive confirmation alerts.
5. Add focused tests for the new feedback contract.
6. Run typecheck, lint, unit tests, review, simulator QA, PR, CodeRabbit, merge.
