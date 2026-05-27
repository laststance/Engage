<!-- /autoplan restore point: /Users/ryotamurakami/.gstack/projects/laststance-Engage/codex-p0a-interaction-feedback-autoplan-restore-20260526-215335.md -->

# P0-A Interaction Feedback Plan

## Task

Implement `P0-A: Shared interaction feedback primitives` from `TODOS.md` as the next small PR slice.

## Autoplan Routing

- Source: `TODOS.md` and `docs/ux-gap-reports/2026-05-24-issue-plan.md`
- UI scope: yes
- DX scope: no
- Routed skills: `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`
- Skipped skill: `/plan-devex-review` because this is an end-user mobile interaction task, not a developer-facing API, CLI, SDK, or docs change.

## Current Evidence

- `src/components/AppPressable.tsx` already provides pressed, selected, checked, busy, haptic, accessibility, and `hitSlop` behavior.
- `src/hooks/useInteractionFeedback.ts` already wraps Expo Haptics safely.
- `src/components/DaySheet.tsx` already applies `AppPressable` to Today task assignment and completion controls.
- `src/components/TaskPicker.tsx` already applies `AppPressable` to task item selection and sheet actions.
- `src/components/Statistics.tsx` still uses raw `Pressable` for the week/month segmented control.
- `src/components/Calendar.tsx` still uses raw `Pressable` for month navigation and date cells.

## CEO Review

Premise: the smallest useful product improvement is not inventing another primitive. The primitive exists. The highest-leverage work is finishing the promised vertical slice so users get consistent feedback across Today, TaskPicker, Stats, and Calendar.

Decision: hold the slice to shared press feedback and accessibility states. Defer operation toasts, first-run copy, notification permission recovery, and broader visual normalization to later TODO slices.

## Design Review

Interaction State Coverage: 7/10 before this PR. Task row and TaskPicker already acknowledge taps. Stats and Calendar still feel quieter because selected controls do not expose state through the shared primitive.

Target: selected period toggles and selected calendar cells should have visible pressed feedback, a normalized touch target, selected accessibility state, and light selection haptics.

## Engineering Review

Architecture: reuse `AppPressable`; do not add a second touch wrapper.

Data flow:

```text
User tap -> AppPressable -> useInteractionFeedback -> component state callback
                                  |
                                  v
                     accessibilityState + class feedback
```

Test plan:

- Calendar: selected date cell exposes selected accessibility state.
- Calendar: today/current date remains announced through localized accessibility labels because React Native does not support `accessibilityState.current`.
- Statistics: week/month toggles expose selected accessibility state after toggling.
- Existing interaction tests should continue to pass.

## Implementation Tasks

1. Replace Stats segmented toggle raw `Pressable` with `AppPressable`.
2. Replace Calendar nav/date raw `Pressable` with `AppPressable`.
3. Add focused tests for selected/current accessibility state.
4. Run `pnpm typecheck`, `pnpm lint`, and targeted component tests.
5. Run `/review` before PR.
6. Run iOS Simulator QA for Calendar, Today, TaskPicker, and Stats touched flows.

## GSTACK REVIEW REPORT

| Review | Routed Skill | Status | Findings |
| --- | --- | --- | --- |
| CEO | `/plan-ceo-review` | pass | Reuse existing primitive; avoid scope creep into later UX slices. |
| Design | `/plan-design-review` | pass | Finish the visible interaction contract on Stats and Calendar. |
| Eng | `/plan-eng-review` | pass | Small, low-risk reuse path with focused component tests. |
| DX | `/plan-devex-review` | not applicable | End-user mobile UI change, not a developer-facing surface. |
