<!-- /autoplan restore point: /Users/ryotamurakami/.gstack/projects/laststance-Engage/codex-p1b-notification-permission-states-autoplan-restore-20260527.md -->

# P1-B Notification Permission States Plan

## Task

Implement `P1-B: Notification permission states` from `TODOS.md`.

## Autoplan Routing

- Source: `TODOS.md`
- UI scope: yes
- DX scope: no
- Routed skills: `/plan-ceo-review`, `/plan-design-review`, `/plan-eng-review`
- Third-party docs: Context7 `/websites/expo_dev_versions_sdk_notifications`

## Current Evidence

- `useNotifications` was a stub that always returned disabled state.
- `NotificationSettings` rendered enabled/disabled only, used blocking alerts, and had a generic "Refresh Settings" action.
- Expo Notifications exposes `getPermissionsAsync`, `requestPermissionsAsync`, scheduled notification APIs, and permission statuses for denied/granted/undetermined.

## Decision

Wire the hook to Expo permission and schedule APIs, then render distinct not-requested, denied, enabled, and scheduled states. Keep the UI scoped to Settings > Notifications; defer onboarding and push token work.

## Implementation Tasks

1. Replace the stub hook with permission refresh, request, schedule, cancel, and Open Settings actions.
2. Render distinct permission and schedule state panels.
3. Make denied recovery use "Open Settings" as primary action.
4. Rename "Refresh Settings" to a user-facing permission check action.
5. Explain disabled controls when system permission is denied.
6. Add focused hook/component tests and Settings simulator QA.
