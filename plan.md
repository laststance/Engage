# Daily condition tracking

Selected by the user: pattern A, five always-visible faces below the date.

- Record overall physical and mental condition as Very low, Low, Okay, Good, or Great.
- Save on tap; tapping the selected face is a no-op. Clear explicitly restores the unrecorded state.
- Share the same picker between Today and the calendar day detail, with date-bound actions.
- Show a small face below the calendar date while retaining the existing completion heatmap.
- Store one optional `Entry.conditionLevel` per day through migration 6. Preserve the journal when changing condition and vice versa.
- Serialize saves with journal writes and backups. Roll back optimistic selection on failure and allow retry.
- Load all daily entries so historical calendar conditions survive restart. Accept legacy backups without a condition.
- Validate migration, persistence, failure, backup compatibility, accessibility, and native behavior with SQLite, component, store, and Maestro regressions.

Verification: typecheck and lint passed; all 359 tests across 29 suites passed. The embedded iOS Release build passed Maestro checks for condition recording, historical dates, clearing, journal preservation, cold starts, task selection, task completion, and nested preset saving.

Design references: [Daylio](https://daylio.net/), [Bearable](https://bearable.app/support/howto/configure-and-enter-data-into-bearable/), [Apple Health](https://support.apple.com/guide/iphone/log-your-state-of-mind-iph6a6decb13/ios).

# Daily routine tasks

Selected by the user: pattern 1, a switch in the existing preset editor.
The other design alternatives were not selected or implemented.

## Behavior

- Each preset exposes “Automatically add every day”. Existing tasks default to off.
- Saving a newly enabled routine starts it on the next local calendar day.
- Startup, foregrounding, and local midnight add eligible tasks as incomplete assignments.
- Yesterday's completion does not affect today's assignment. Unopened past days are not filled.
- A task removed from today's selection stays removed after reopening or restarting the app.
- Disabling a routine preserves existing assignments and history.
- Backup and restore preserve both the routine schedule and each day's application history.
- A Today picker draft closes on date change; the next opening waits for fresh assignments.
- Pending journal text is saved against its original date when the day view changes.

## Implementation

- `PresetTaskEditor`: native Switch, translated explanation, existing Save/Discard flow.
- `Task.dailyAutoAddFrom`: optional local start date, persisted by database migration 4.
- `daily_task_applications`: per-task/day application history with cascading task deletion; migration 5 indexes task-history cleanup.
- `useCurrentDay`: shared AppState subscription and local-midnight timer.
- Store mutations serialize background routine refreshes with user edits and restore operations.
- Database and backup validation reject nonexistent Gregorian dates before persistence.

## Verification

- Component regressions for switch drafts, persistence payloads, midnight saving, and Today picker sessions.
- Real SQLite regressions for migration, idempotency, manual selections, completion, exclusion, rollback, and backup compatibility.
- Fake-clock coverage for midnight, foreground transitions, and subscription cleanup.
- Maestro flow `maestro/ios/13-daily-routine-setting.yaml` checks native Save/Discard and restart persistence.

## Design references

- [Things repeating to-dos](https://culturedcode.com/things/support/articles/2803564/)
- [Habitify repeat settings](https://intercom.help/habitify-app/en/articles/12395893-good-habit-setting-repeat)
