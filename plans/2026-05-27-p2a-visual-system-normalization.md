# P2-A Visual System Normalization

## Scope

- TODO: `P2-A: Visual system normalization`
- UI scope: yes
- DX scope: no
- Routed skills: `/autoplan` -> `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`

## Acceptance Mapping

- Define common `AppScreen`, `AppSection`, `AppCard`, `AppListRow`.
- Use them on Calendar, Today, Stats, and Settings surfaces.
- Normalize radius, card border/shadow, screen background, and list-row spacing.
- Keep existing user flows and Maestro selectors stable.

## Implementation Notes

- Reuse existing `AppPressable` for button/touch feedback.
- Do not add dependencies.
- Keep `TODOS.md`, `plans/`, and UX report artifacts local only.

## Validation Plan

- `pnpm typecheck`
- `pnpm lint`
- focused component tests for new primitives and touched screens
- relevant Maestro flows: Today, Calendar, Stats, Settings
