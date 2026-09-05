# Engage TODOs

## Epic: Mobile UX Interaction Quality

Status: Proposed

Source report: [docs/ux-gap-reports/2026-05-23-mobile-app.md](docs/ux-gap-reports/2026-05-23-mobile-app.md)

Owner: Product / App UX

Created: 2026-05-24

Engage works functionally, but the app does not yet acknowledge user actions with the consistency expected from modern mobile apps. The core problem is not "missing animations"; it is missing feedback: taps, selection, completion, save, error, and permission states are too quiet or fragmented.

Keep this as one parent initiative. Implement it through small PRs that each improve one complete user loop.

### Management Shape

- Parent issue: "Mobile UX: raise interaction feedback quality to App Store baseline"
- Child issues: one issue per implementation slice below
- PR size: one slice at a time, preferably 1-3 screens or one shared primitive plus its first usages
- Evidence: each PR should include simulator screenshots or a short screen recording for the affected flows
- Validation: run `pnpm typecheck`, `pnpm lint`, and targeted tests for changed logic; run iOS simulator smoke checks for touched flows

### P0 Slices

- [x] **P0-A: Shared interaction feedback primitives** — shipped in PR #64 (`f4ee4ac`)
  - Files likely touched: `components/ui/pressable/index.tsx`, new app-level pressable/feedback utility, high-use touchables
  - Outcome: every common tappable control has visible pressed, disabled, selected, busy, and accessibility states
  - Acceptance:
    - Tappable controls visibly respond within 50 ms
    - Icon-only and row controls have normalized `hitSlop`
    - Selectable controls expose `accessibilityState.selected` or `checked`
    - High-value interactions use consistent haptics without feeling noisy

- [x] **P0-B: Operation feedback system** — shipped in PR #65 (`88ddb1e`)
  - Files likely touched: root layout/provider, `src/components/JournalInput.tsx`, `src/components/PresetTaskEditor.tsx`, `src/components/BackupManager.tsx`
  - Outcome: saving, saved, failed, retry, and success feedback use one consistent toast/banner/inline model
  - Acceptance:
    - Journal shows saving, saved, and failed states near the input
    - Routine success no longer uses blocking alerts
    - Recoverable failures include an inline retry path
    - Blocking alerts are reserved for destructive confirmation or OS permission explanation

- [x] **P0-C: Today completion and first-run loop** — shipped in PR #66 (`277f01e`)
  - Files likely touched: `src/components/DaySheet.tsx`, `src/hooks/useDayView.ts`, completion-related tests
  - Outcome: assigning and completing a task feels acknowledged, useful, and emotionally complete
  - Acceptance:
    - First-run Today has a clear primary action instead of empty `0/0` sections
    - Task completion triggers pressed state, haptic, visual completion state, and a short confirmation
    - Last-task completion has a small reward/closure moment
    - Undo or re-toggle does not feel like an error

### P1 Slices

- [x] **P1-A: TaskPicker sheet quality** — shipped in PR #67 (`bf52c44`)
  - Outcome: TaskPicker behaves like an intentional app flow, not a utility list
  - Acceptance:
    - Header shows selected count
    - Primary action is clear and sticky enough for long lists
    - Cancel/close behavior is understandable when selections changed
    - Selected items are visually and accessibly obvious

- [x] **P1-B: Notification permission states** — shipped in PR #68 (`5087e65`)
  - Outcome: reminder setup explains benefit, permission status, and recovery path
  - Acceptance:
    - `notDetermined`, `denied`, `enabled`, and `scheduled` states render differently
    - Denied permission shows "Open Settings" as the primary recovery action
    - Disabled controls explain why they are disabled
    - "Refresh Settings" is removed or renamed to a user-understandable action

- [x] **P1-C: Form safety for preset tasks and journal** — shipped in PR #69 (`db73758`)
  - Outcome: users can tell what is dirty, invalid, saved, failed, and undoable
  - Acceptance:
    - Preset task validation is inline while typing
    - Save is disabled only when invalid, with an explanation
    - Delete/archive actions offer undo or confirmation where appropriate
    - Journal keeps unsaved draft text recoverable if persistence fails

- [x] **P1-D: Completion-to-stats causality** — shipped in PR #70 (`7838347`)
  - Outcome: users can feel how Today's actions affect Calendar and Stats
  - Acceptance:
    - Calendar summary guides the user when there are no completions
    - Stats empty/zero-heavy states explain the next action
    - Completion changes are reflected with a subtle highlight or recap in Stats/Calendar

### P2 Slices

- [x] **P2-A: Visual system normalization** — shipped in PR #71 (`203352a`)
  - Outcome: Calendar, Today, Stats, and Settings look like one app
  - Acceptance:
    - Define and use common `AppScreen`, `AppSection`, `AppCard`, `AppListRow`, and button/sheet patterns
    - Radius, shadow, spacing, and semantic color usage are consistent
    - Settings either commits to iOS-list conventions or aligns with the rest of the app

- [x] **P2-B: Accessibility and runtime-warning cleanup** — shipped in PR #72 (`df2ec01`)
  - Outcome: QA can trust interaction behavior and VoiceOver state
  - Acceptance:
    - Calendar cells expose selected/current/disabled states
    - Segmented controls expose selected state
    - Async actions expose busy/disabled state
    - App-originated interaction warnings are fixed or explicitly documented as benign platform noise

### Not In Scope For This Epic

- Full redesign of the product IA
- New habit recommendation engine
- New analytics backend or cloud sync
- Large-scale rebrand
- Expanding E2E coverage beyond flows changed by these slices

### Suggested First PR

Start with **P0-A: Shared interaction feedback primitives** and apply it to one vertical flow:

1. Task row completion
2. TaskPicker item selection
3. Stats period segmented control
4. Calendar date cell

This proves the interaction contract once, then later PRs can spread it without re-litigating the feel of every control.

## Daily Condition Design Review Follow-up — 2026-09-05

- [ ] **Polish / Content quality: complete Japanese date and navigation copy.** The Japanese day view still shows English tab labels and an English month/weekday in the journal hint. This predates the condition feature; keep the shared navigation/date-formatting cleanup in a separate change. Evidence: the Today screenshots from the design audit on `codex/daily-condition`.
- [ ] **Verification / Accessibility: listen to condition save feedback with VoiceOver on a physical iPhone.** FINDING-004 now announces successful saves, failures, and clears after persistence; five regression tests cover the dispatch timing and Android live-region separation. Confirm spoken order and focus retention on device before treating audible behavior as verified.
- [ ] **Medium / Typography and responsive layout: refresh native text measurement after a live Dynamic Type change.** FINDING-006 reproduces on the baseline and the reviewed build: open Today, change iOS text size to accessibility-large while Calendar is inactive, then return to Calendar. Text paints at the larger size inside stale measured bounds until a cold restart. The shared Text wrapper and tab configuration need a separate native layout investigation that preserves unsaved drafts and font scaling. Cold-start large-text cell layout and scrolling are already fixed and verified by this review.
