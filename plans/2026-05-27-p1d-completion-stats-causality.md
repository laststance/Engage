<!-- /autoplan restore point: /Users/ryotamurakami/.gstack/projects/laststance-Engage/codex-p1d-completion-stats-causality-autoplan-restore-20260527.md -->

# P1-D Completion To Stats Causality Plan

## Task

Implement `P1-D: Completion-to-stats causality` from `TODOS.md`.

## Autoplan Routing

- Source: `TODOS.md`
- UI scope: yes
- DX scope: no
- Routed skills: `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`
- Third-party docs: none required for the current scoped implementation

## Current Evidence

- `Calendar` already computes monthly completed tasks and active days, but an empty month only says "No completions yet" without telling the user what to do next.
- `Calendar` heatmap cells update from `achievementData`, but the selected-day summary does not recap what changed.
- `Statistics` shows zero-heavy stat cards when there are no completions, but the screen does not explain that completing a Today task is the next action that starts the stats.
- `Statistics` already receives computed weekly/monthly data, so this can be a presentational slice without store or database changes.

## Decision

Keep the slice scoped to Calendar and Statistics copy/recap states. Do not alter statistics calculations. Add small explanatory callouts that connect Today completions to Calendar and Stats, and cover the behavior with focused component tests plus existing simulator flows.

## Implementation Tasks

1. Add Calendar empty-month guidance that points users back to completing a Today habit.
2. Add Calendar selected-day recap when the selected date has completions.
3. Add Stats period recap for both empty and non-empty weekly/monthly periods.
4. Add localized copy and focused component tests.
5. Run typecheck, lint, full Jest, targeted Maestro Calendar/Stats smoke, gstack-review, PR, CodeRabbit, merge.
