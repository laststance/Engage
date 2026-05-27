<!-- /autoplan restore point: /Users/ryotamurakami/.gstack/projects/laststance-Engage/codex-p1a-taskpicker-sheet-quality-autoplan-restore-20260527.md -->

# P1-A TaskPicker Sheet Quality Plan

## Task

Implement `P1-A: TaskPicker sheet quality` from `TODOS.md`.

## Autoplan Routing

- Source: `TODOS.md`
- UI scope: yes
- DX scope: no
- Routed skills: `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`
- Third-party docs: Context7 `/gluestack/gluestack-ui` for Button/Pressable state patterns

## Current Evidence

- `TaskPicker` already renders as a modal sheet and keeps the primary confirm action outside the scroll view.
- Task rows already use `AppPressable`, selected visual border, check icon, haptics, and `accessibilityState.selected`.
- The missing pieces are header selection count, clearer changed-selection affordance, and more explicit selected row labeling.

## Decision

Keep the PR scoped to `TaskPicker`: preserve the existing modal architecture, add visible selection count and dirty state, make dirty close/cancel understandable, and strengthen selected row accessibility.

## Implementation Tasks

1. Show selected count in the sheet header.
2. Show unsaved-change state when local selection differs from opened selection.
3. Change dirty cancel/close affordances to discard-language.
4. Add selected row status text and accessibility labels/hints.
5. Extend TaskPicker unit tests and Maestro task-selection QA.
6. Run validation, review, Simulator QA, PR, CodeRabbit, merge.
