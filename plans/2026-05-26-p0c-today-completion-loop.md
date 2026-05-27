<!-- /autoplan restore point: /Users/ryotamurakami/.gstack/projects/laststance-Engage/codex-p0c-today-completion-loop-autoplan-restore-20260526.md -->

# P0-C Today Completion Loop Plan

## Task

Implement `P0-C: Today completion and first-run loop` from `TODOS.md`.

## Autoplan Routing

- Source: `TODOS.md`
- UI scope: yes
- DX scope: no
- Routed skills: `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`

## Current Evidence

- `DaySheet` already uses `AppPressable`, haptics, busy state, checked accessibility state, and completion/error feedback.
- Empty days already have a primary `empty-task-selection-button`.
- The remaining gap is closure when the last visible task becomes complete, and clearer first-run empty copy.

## Decision

Keep the PR scoped to `DaySheet`: improve the first-run empty state and show a distinct all-done acknowledgement when the final assigned task is completed. Do not add gamification or new data state.

## Implementation Tasks

1. Add an `allCompleted` task feedback kind.
2. Detect when a successful completion completes every visible task.
3. Render a short all-done closure message.
4. Tune empty-state copy to guide first-run users to task selection.
5. Add focused `DaySheet` tests.
6. Run validation, review, Simulator QA, PR, CodeRabbit, merge.
