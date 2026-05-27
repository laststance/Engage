# UX Gap Report: Engage -- Mobile App

**Date**: 2026-05-23  
**Target**: iOS Simulator, iPhone 17, iOS 26.5  
**Category**: Mobile interaction quality, perceived polish, feedback, recovery  
**Session**: Local development build from `main`

## Overall Score: 43/100

| Dimension | Score | Verdict |
|-----------|-------|---------|
| Typography & Spacing | 16/25 | Needs Work |
| Interactive States | 7/25 | Critical |
| Content Hierarchy | 14/25 | Needs Work |
| Loading & Error UX | 6/25 | Critical |

Engage is functionally understandable, but it behaves more like a static form than a habit app people would trust daily. The biggest gap is not "missing animations"; it is missing acknowledgement: taps do not consistently depress, success is often silent, failures fall into alerts or console logs, and important state changes are visually subtle.

## Evidence Captured

| Flow | Screenshot |
|------|------------|
| Calendar home | [mobile-calendar-home.png](./screenshots/mobile-calendar-home.png) |
| Empty today screen | [mobile-today-empty.png](./screenshots/mobile-today-empty.png) |
| Task picker | [mobile-task-picker.png](./screenshots/mobile-task-picker.png) |
| Task selected | [mobile-task-picker-selected.png](./screenshots/mobile-task-picker-selected.png) |
| Task assigned | [mobile-today-assigned.png](./screenshots/mobile-today-assigned.png) |
| Task completed | [mobile-today-task-completed.png](./screenshots/mobile-today-task-completed.png) |
| Journal autosaved | [mobile-journal-autosaved.png](./screenshots/mobile-journal-autosaved.png) |
| Weekly stats | [mobile-stats-week.png](./screenshots/mobile-stats-week.png) |
| Monthly stats | [mobile-stats-month.png](./screenshots/mobile-stats-month.png) |
| Settings menu | [mobile-settings-menu.png](./screenshots/mobile-settings-menu.png) |
| Notification settings | [mobile-notifications-settings.png](./screenshots/mobile-notifications-settings.png) |

## Critical Gaps

### 1. No Shared Interaction Contract

**Score**: 7/25 Interactive States  
**Evidence**: `components/ui/pressable/index.tsx`, `src/components/DaySheet.tsx`, `src/components/TaskPicker.tsx`, `src/components/Calendar.tsx`

**What top-tier mobile apps do**: Todoist, Things, Streaks, Apple Health, and Duolingo make every touchable object feel physically touchable. Taps depress, selected states are obvious, disabled states explain themselves, and high-value actions use haptics sparingly.

**Your app**: The shared `Pressable` only defines focus and disabled opacity. Most screens pass static Tailwind classes, so `pressed`, `active`, `selected`, `busy`, and `disabled` are not normalized. Tabs have haptics, but task completion, selecting a task, confirming selection, changing period, and opening modals do not.

**Why this feels bad**: Users tap and then have to visually search the whole screen to learn whether anything happened.

**Fix**:

```tsx
// Create AppPressable as the only touch primitive for app interactions.
<Pressable
  hitSlop={8}
  accessibilityRole="button"
  accessibilityState={{ disabled, selected, busy }}
  onPressIn={() => Haptics.selectionAsync()}
  style={({ pressed }) => [
    baseStyle,
    pressed && { transform: [{ scale: 0.98 }], opacity: 0.86 },
    selected && selectedStyle,
    disabled && disabledStyle,
  ]}
/>
```

Acceptance criteria:
- Every tappable item has a visible pressed state within 50 ms.
- Selection controls expose `accessibilityState.selected` or `checked`.
- High-value events use consistent haptic feedback: select, complete, save success, validation failure.

### 2. Task Completion Has No Reward Moment

**Score**: Critical  
**Evidence**: [mobile-today-task-completed.png](./screenshots/mobile-today-task-completed.png), `src/components/DaySheet.tsx`

**What top-tier mobile apps do**: Habit apps make completion feel like closure. A checkbox flips with motion, progress moves, a small confirmation appears, and streak/progress changes are connected to the action.

**Your app**: Completion changes to a blue check and strikethrough. The row does not animate, the progress count changes quietly, no haptic fires, no toast appears, and the stats/streak impact is not previewed.

**Fix**:
- Add an animated checkbox state: unchecked -> checked with scale/spring.
- Add success haptic on complete and lighter haptic on undo.
- Show a tiny inline confirmation: "Completed. 1/1 today" for 1.5 seconds.
- Animate category progress count and row background for one frame cycle.
- When the last task for a day is completed, show a small completion panel rather than only changing `0/1` to `1/1`.

### 3. Save/Loading/Error Feedback Is Fragmented

**Score**: 6/25 Loading & Error UX  
**Evidence**: `src/components/JournalInput.tsx`, `src/components/PresetTaskEditor.tsx`, `src/components/BackupManager.tsx`, `src/stores/app-store.ts`

**What top-tier mobile apps do**: They use one clear state model: idle, dirty, saving, saved, failed. Errors stay near the thing that failed and include retry.

**Your app**:
- Journal auto-save catches errors with `console.error` only.
- `PresetTaskEditor` uses blocking alerts for validation and save failures.
- Backup/notification flows use modal alerts for routine outcomes.
- Store-level `isLoading` exists but screens mostly do not render a skeleton or overlay.

**Fix**:
- Add a shared operation feedback system: toast/banner + inline field error + retry.
- Journal should show `Saving...`, `Saved`, and `Could not save. Retry` in the same location.
- Replace success `Alert.alert` with non-blocking toast for successful backup/export/category/task changes.
- Use blocking alerts only for destructive confirmation or OS permission explanation.

### 4. Modal Transitions Feel Like Utility Screens, Not App Flows

**Score**: Critical  
**Evidence**: [mobile-task-picker.png](./screenshots/mobile-task-picker.png), [mobile-settings-menu.png](./screenshots/mobile-settings-menu.png)

**What top-tier mobile apps do**: Sheets retain context and show a clear path: title, purpose, selected count, primary action, close/cancel affordance, and visible drag/transition behavior.

**Your app**:
- TaskPicker opens with `pageSheet`, but the content feels like a full utility list.
- The selected count lives only in the confirm button.
- Closing/canceling has no "discard selected changes" awareness.
- Settings subviews replace content instantly with no transition or breadcrumb context.

**Fix**:
- Convert TaskPicker to a true bottom sheet or card-like page sheet with visible selected count in the header.
- Keep a sticky header: `Select Tasks` + `1 selected` + clear action.
- Add "Done" as primary; make Cancel secondary.
- Add cross-fade or slide for Settings subviews and keep the section context.

### 5. Empty States Do Not Start the User

**Score**: Critical  
**Evidence**: [mobile-today-empty.png](./screenshots/mobile-today-empty.png), [mobile-calendar-home.png](./screenshots/mobile-calendar-home.png)

**What top-tier mobile apps do**: Empty states teach through action. They answer "what happened", "why it matters", and "what to do now".

**Your app**:
- Today shows category headers with `0/0`, which reads like a bug or dead dashboard.
- Calendar says "No completions yet" but does not offer a primary action.
- The user must infer that "Select Tasks" is the starting point.

**Fix**:
- First-run Today: hero empty state with one primary button: "Choose today's habits".
- Hide category sections with `0/0`.
- Calendar empty summary should deep-link to Today or the selected date's task picker.
- Add a lightweight onboarding coach mark for the first task assignment.

### 6. Notification Settings Look Broken Before Permission

**Score**: Critical  
**Evidence**: [mobile-notifications-settings.png](./screenshots/mobile-notifications-settings.png), `src/components/NotificationSettings.tsx`

**What top-tier mobile apps do**: Permission screens explain the benefit before the OS prompt and show a clear recovery path if permission is denied.

**Your app**:
- A switch is shown even while permission is disabled.
- The dark "Done" button looks heavier than the actual enabling action.
- "Refresh Settings" is ambiguous.
- Disabled state is informational but not actionable.

**Fix**:
- Split into states: `notDetermined`, `denied`, `enabled`, `scheduled`.
- If denied, show "Open Settings" primary action.
- If not determined, show "Enable reminders" primary action with a benefit sentence.
- Move "Done" out of the action stack or make it a nav-level close affordance.

## Moderate Gaps

### 7. Visual System Is Inconsistent Across Screens

**Score**: 16/25 Typography & Spacing  
**Evidence**: Calendar uses rounded heatmap cells; Today uses flat rows; Stats uses cards and gradients; Settings uses iOS list style.

**Gap**: The app changes visual grammar per screen. This makes it feel assembled rather than designed.

**Fix**:
- Define screen templates: `AppScreen`, `AppSection`, `AppCard`, `AppListRow`, `AppPrimaryButton`, `AppSheet`.
- Use one radius scale, one shadow scale, one blue, one success green, one danger red.
- Keep Settings native-list style only if the whole settings area commits to iOS conventions.

### 8. Statistics Lack Causality

**Score**: Moderate  
**Evidence**: [mobile-stats-month.png](./screenshots/mobile-stats-month.png)

**Gap**: Stats show numbers, but not why they changed or what to do next. Completing a task on Today updates month stats, but the user never feels the connection.

**Fix**:
- After a completion, briefly highlight the affected stat when visiting Stats.
- Add "You completed 1 task today" recap near the streak card.
- Replace zero-heavy cards with explanations: "Complete any habit today to start a streak."
- Add progress bars only where they carry meaning; remove decorative mini chart icons.

### 9. Forms Do Not Feel Safe

**Score**: Moderate  
**Evidence**: `src/components/PresetTaskEditor.tsx`, `src/components/JournalInput.tsx`

**Gap**: Preset editing validates at save time with alerts; journal auto-save failure is invisible. Users cannot tell what is saved, dirty, invalid, or recoverable.

**Fix**:
- Add dirty indicators to task editor rows.
- Validate duplicate/empty task names inline while typing.
- Disable Save only when invalid and explain why.
- Add undo for delete/archive operations.
- Journal should persist unsaved draft state locally if save fails.

### 10. Touch Targets Exist, but Hit Quality Is Uneven

**Score**: Moderate  
**Evidence**: `Calendar.tsx` has 44px-ish cells, but icon-only controls and some category chips have no shared `hitSlop`.

**Gap**: Minimum size is often present, but perceived hit area is not normalized. Some controls feel easy; others feel fragile.

**Fix**:
- Add `hitSlop={8}` to icon-only controls.
- Use the shared `AppPressable` contract for calendar cells, task rows, header icons, settings rows, chips, and segmented controls.
- Add pressed opacity/scale to all controls, not only buttons.

### 11. Accessibility State Is Under-Specified

**Score**: Moderate  
**Evidence**: Task rows have role/label, but selected items, stats period toggle, switch-like choices, and calendar selected/today states do not consistently expose `accessibilityState`.

**Gap**: VoiceOver can read labels, but it cannot reliably announce selected, checked, busy, or current states.

**Fix**:
- Task checkbox row: `accessibilityState={{ checked: isCompleted }}`
- TaskPicker item: `accessibilityState={{ selected: isSelected }}`
- Stats segmented control: `accessibilityState={{ selected: selectedPeriod === 'week' }}`
- Calendar cell: `accessibilityState={{ selected: isSelected(date), disabled: !isCurrentMonth }}`
- Async buttons: `accessibilityState={{ busy: isLoading, disabled: isLoading }}`

### 12. Console Noise Hides Real UX Failures

**Score**: Moderate  
**Evidence**: Local run logs show repeated Reanimated render warnings and UIKit/CoreHaptics noise while interacting.

**Gap**: The app may be usable, but noisy runtime logs make it harder to trust motion/interaction behavior during QA.

**Fix**:
- Track and fix the Reanimated "Reading/Writing value during render" source.
- Add a dev-only log filter only after identifying benign platform noise.
- Add QA acceptance that an interaction pass has no app-originated warnings.

## Strengths

- The app has a simple information architecture: Calendar, Today, Stats.
- Core flows are discoverable after exploration.
- Touch target sizing is partly considered (`min-h-[44px]`, `touch-target-minimum`).
- Journal has an auto-save affordance and character count.
- Modal nesting constraints were considered in Today/TaskPicker/PresetEditor.
- Recent icon polish improved first impression.

## Recommended Remediation Plan

| Priority | Gap | Estimated Effort |
|----------|-----|------------------|
| P0 | Create shared `AppPressable` + haptic/pressed/accessibility contract | M |
| P0 | Add operation feedback system: toast, inline error, retry, busy state | M |
| P0 | Redesign Today empty/task-completion feedback loop | M |
| P1 | Rework TaskPicker sheet header, selected count, confirm/cancel states | M |
| P1 | Fix Notification Settings permission-state UX | S |
| P1 | Add inline validation and dirty/saved states to PresetTaskEditor | M |
| P1 | Connect completion actions to Stats/Calendar feedback | M |
| P2 | Normalize visual system tokens and screen templates | L |
| P2 | Improve accessibility state coverage | S |
| P2 | Clean runtime warnings during interaction QA | S |

## Suggested First Implementation Slice

Start with one end-to-end vertical slice rather than polishing every screen separately:

1. Build `src/components/ui/AppPressable.tsx`
2. Add a tiny `useInteractionFeedback()` hook using `expo-haptics`
3. Apply it to task rows, TaskPicker items, segmented controls, calendar cells, and settings rows
4. Add a `FeedbackToast` or banner mounted at app root
5. Make task completion show: pressed state -> haptic -> animated checkbox -> toast -> category progress highlight

This single slice should make the app feel materially better without needing a full redesign first.

## Issue Candidates

1. UX Gap: Introduce shared mobile interaction feedback primitives
2. UX Gap: Add visible task-completion reward and progress acknowledgement
3. UX Gap: Replace alert/console-only feedback with toast and inline recovery
4. UX Gap: Redesign first-run and empty Today/Calendar states
5. UX Gap: Rework notifications permission and disabled states
6. UX Gap: Add accessibility state to selectable and async controls
