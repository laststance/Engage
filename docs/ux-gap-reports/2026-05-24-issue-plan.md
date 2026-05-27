# UX Remediation Issue Plan

**Date**: 2026-05-24

**Source audit**: [2026-05-23-mobile-app.md](./2026-05-23-mobile-app.md)

**Tracking file**: [../../TODOS.md](../../TODOS.md)

## Why This Should Be One Parent Issue

The audit found many symptoms, but they share one root: Engage does not consistently acknowledge user intent. Treating every symptom as an unrelated issue would create scattered polish work. The parent issue should preserve the larger product problem, while child issues should be scoped tightly enough to ship one at a time.

## Recommended GitHub Structure

### Parent Issue

Title:

```text
Mobile UX: raise interaction feedback quality to App Store baseline
```

Body:

```markdown
## Problem

Engage is functionally understandable, but it currently feels more like a static form than a daily habit app. The gap is not just missing animation. The app does not consistently acknowledge taps, selection, completion, saving, errors, or permission states.

Source audit: docs/ux-gap-reports/2026-05-23-mobile-app.md

## User Impact

- Users cannot always tell whether a tap worked.
- Completing a habit feels like a state flip, not a rewarding moment.
- Save and error states are fragmented across alerts, console logs, and invisible failures.
- Empty and permission states can look broken or dead-ended.
- The app feels lower quality than common mobile apps even when the data logic works.

## Goal

Raise Engage's mobile interaction quality to a trustworthy baseline through small PRs:

- Shared touch/pressed/haptic/accessibility contract
- Consistent operation feedback for save/success/failure/retry
- Better Today completion and first-run loop
- TaskPicker and notification state improvements
- Accessibility and runtime-warning cleanup

## Non-goals

- Full product redesign
- Cloud sync or analytics backend
- New recommendation engine
- Large-scale rebrand

## Child Issues

- [ ] Shared interaction feedback primitives
- [ ] Operation feedback system
- [ ] Today completion and first-run loop
- [ ] TaskPicker sheet quality
- [ ] Notification permission states
- [ ] Form safety for preset tasks and journal
- [ ] Completion-to-stats causality
- [ ] Visual system normalization
- [ ] Accessibility and runtime-warning cleanup

## Definition of Done

- Each child issue ships as a focused PR.
- Each PR includes simulator screenshots or a short screen recording for changed flows.
- `pnpm typecheck` and `pnpm lint` pass.
- Targeted tests cover changed logic.
- iOS simulator smoke checks pass for touched flows.
```

### Child Issue 1

Title:

```text
UX: introduce shared interaction feedback primitives
```

Scope:

- Create the app-level touch contract for pressed, disabled, selected, busy, hit slop, haptics, and accessibility state.
- Apply it to one vertical slice: task row completion, TaskPicker item selection, Stats period toggle, and Calendar date cell.

Acceptance:

- Every touched control visibly responds within 50 ms.
- Selectable controls expose selected or checked accessibility state.
- High-value interactions use consistent haptics.
- The implementation is reusable by later UX slices.

### Child Issue 2

Title:

```text
UX: add consistent save, success, error, and retry feedback
```

Scope:

- Add a lightweight toast/banner/inline feedback pattern.
- Replace console-only and routine success alerts in journal, preset editor, and backup flows.

Acceptance:

- Journal shows saving, saved, failed, and retry states near the input.
- Routine success does not block the user.
- Recoverable failures explain what happened and how to retry.

### Child Issue 3

Title:

```text
UX: improve Today first-run and task completion loop
```

Scope:

- Replace dead-looking empty sections with a first-run action.
- Make completion feel acknowledged with visual state, haptic feedback, and a short confirmation.

Acceptance:

- Empty Today clearly starts the user with "choose today's habits".
- Completing a task has a visible and tactile response.
- Last-task completion has a small closure moment.

### Child Issue 4

Title:

```text
UX: rework TaskPicker sheet interaction quality
```

Scope:

- Make the sheet communicate purpose, selected count, and confirm/cancel state.
- Improve selected item visibility and accessibility state.

Acceptance:

- Header shows selected count.
- Primary action remains easy to find.
- Changed selections are not lost silently.

### Child Issue 5

Title:

```text
UX: fix notification permission and disabled-state flow
```

Scope:

- Render permission states separately: not determined, denied, enabled, scheduled.
- Replace ambiguous refresh/disabled UI with clear actions.

Acceptance:

- Denied permission shows an "Open Settings" recovery path.
- Not-determined permission explains why reminders matter before prompting.
- Disabled controls explain why they are disabled.

### Child Issue 6

Title:

```text
UX: make forms feel safe for preset tasks and journal
```

Scope:

- Add inline validation, dirty/saved state, and recovery affordances.
- Avoid blocking alerts for routine form validation.

Acceptance:

- Empty and duplicate task names are explained inline.
- Save state is visible.
- Deleting or archiving has undo or confirmation where appropriate.

### Child Issue 7

Title:

```text
UX: connect Today completion to Calendar and Stats feedback
```

Scope:

- Make Calendar and Stats explain what changed and what to do next.
- Improve zero/empty states.

Acceptance:

- Calendar empty summary deep-links or guides users toward Today's habits.
- Stats zero states explain the next useful action.
- Recent completion can be seen or understood from summary context.

### Child Issue 8

Title:

```text
UX: normalize visual system across core screens
```

Scope:

- Define reusable screen, section, card, list row, button, and sheet patterns.
- Align spacing, radius, color, and shadow usage.

Acceptance:

- Calendar, Today, Stats, and Settings feel like one app.
- New patterns do not create nested-card layouts or unrelated decorative styling.

### Child Issue 9

Title:

```text
UX: improve accessibility state coverage and clean interaction warnings
```

Scope:

- Add selected, checked, busy, disabled, and current state where appropriate.
- Fix or document app-originated runtime warnings seen during interaction QA.

Acceptance:

- Calendar, segmented controls, selection rows, and async actions expose correct accessibility state.
- Interaction QA logs do not hide real app warnings.

## Suggested Execution Order

1. Shared interaction primitives
2. Today completion and first-run loop
3. Operation feedback system
4. TaskPicker sheet quality
5. Notification permission states
6. Form safety
7. Completion-to-stats causality
8. Accessibility/runtime warnings
9. Visual system normalization

The reason to put visual-system normalization later: the first three slices will reveal which shared primitives are actually needed. That keeps the design system grounded in shipped behavior instead of inventing components in the abstract.
