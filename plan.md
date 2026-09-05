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
- `daily_task_applications`: per-task/day application history with cascading task deletion.
- `useCurrentDay`: shared AppState subscription and local-midnight timer.
- Store mutations serialize background routine refreshes with user edits and restore operations.

## Verification

- Component regressions for switch drafts, persistence payloads, midnight saving, and Today picker sessions.
- Real SQLite regressions for migration, idempotency, manual selections, completion, exclusion, rollback, and backup compatibility.
- Fake-clock coverage for midnight, foreground transitions, and subscription cleanup.
- Maestro flow `maestro/ios/13-daily-routine-setting.yaml` checks native Save/Discard and restart persistence.

## Design references

- [Things repeating to-dos](https://culturedcode.com/things/support/articles/2803564/)
- [Habitify repeat settings](https://intercom.help/habitify-app/en/articles/12395893-good-habit-setting-repeat)
