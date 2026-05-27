<!-- /autoplan restore point: /Users/ryotamurakami/.gstack/projects/laststance-Engage/codex-p1c-form-safety-autoplan-restore-20260527.md -->

# P1-C Form Safety For Preset Tasks And Journal Plan

## Task

Implement `P1-C: Form safety for preset tasks and journal` from `TODOS.md`.

## Autoplan Routing

- Source: `TODOS.md`
- UI scope: yes
- DX scope: no
- Routed skills: `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`
- Third-party docs: none required for the current scoped implementation

## Current Evidence

- `PresetTaskEditor` validates empty and duplicate task names only when the user presses Save.
- `PresetTaskEditor` disables Save only while saving, so invalid forms can still be submitted without an inline reason.
- `PresetTaskEditor` already confirms delete through a destructive `Alert`, so deletion has a safety step but no adjacent explanatory state.
- `JournalInput` keeps failed text and offers retry, but it does not explicitly tell the user when local draft text is unsaved after a persistence failure.
- `JournalInput` autosaves by debounce and blur; the P1-C change should preserve that flow instead of introducing a manual save workflow.

## Decision

Keep the slice scoped to the existing editor and journal components. Add always-visible inline validation and disabled-save explanations to `PresetTaskEditor`, keep destructive delete confirmation, and make `JournalInput` distinguish unsaved draft, failed draft, saving, and saved states without losing user text.

## Implementation Tasks

1. Add typed preset-task validation that reports empty titles and duplicate title/category pairs while the user types.
2. Render inline validation messages beside the affected preset task rows.
3. Disable PresetTaskEditor Save only when the form is invalid or saving, and explain why it is disabled.
4. Keep delete confirmation as the delete/archive safety mechanism and ensure tests cover it.
5. Make JournalInput show an unsaved draft state before autosave and after failed persistence while preserving the typed text.
6. Extend focused component tests and run Settings/Today simulator QA for the touched flows.
