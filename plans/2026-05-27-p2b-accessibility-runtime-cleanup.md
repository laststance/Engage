# P2-B: Accessibility and Runtime-Warning Cleanup

Source: `TODOS.md` P2-B
Branch: `codex/p2b-accessibility-runtime-cleanup`

## Autoplan Routing

- CEO: Hold scope. This is the last Mobile UX slice; do not expand into a broad redesign.
- Design: Required. Calendar, segmented controls, and async buttons are user-facing interaction surfaces.
- Engineering: Required. Accessibility props and async disabled/busy states must be consistent with existing `AppPressable`.
- DX: Light. Runtime warning handling should be documented for QA so future simulator runs are interpretable.

## Plan

1. Calendar cells expose selected, current, and disabled states.
2. Stats segmented controls keep explicit selected state and tests cover it.
3. Async actions expose disabled/busy state where user actions can be blocked by pending work.
4. Known simulator/runtime warnings are documented only when they are platform/test-runner noise.

## Review Notes

- Reuse `AppPressable` instead of adding new primitives.
- Keep the blast radius to Calendar, Stats tests, async action controls, and QA notes.
- Do not commit local UX report artifacts or `TODOS.md` until the PR is merged.
