# Engage

Engage is a React Native habit tracker built with Expo. It focuses on daily task completion, streak tracking, reflective journaling, and local-first backup/restore.

## Stack

- Expo SDK 55
- React Native 0.83
- React 19.2
- Expo Router
- SQLite via `expo-sqlite`
- Zustand
- NativeWind with Tailwind CSS v3
- Jest and React Native Testing Library
- Maestro for iOS E2E tests

## Requirements

- Node.js 22.20.0
- pnpm 10.33.4 through Corepack
- Xcode 16.1 or newer for React Native 0.83 iOS builds
- Maestro for E2E testing

```bash
corepack enable
pnpm install
```

## Development

```bash
pnpm start
pnpm ios
pnpm android
pnpm web
```

## Quality Checks

`pnpm lint` is configured with `--max-warnings 0`, so warnings fail the command.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm exec expo install --check
pnpm audit --audit-level=moderate
```

## E2E Testing

The recommended iOS E2E flow uses a release build with React Native DevTools disabled.

```bash
pnpm build:e2e
pnpm test:e2e:production
```

Useful maintenance commands:

```bash
pnpm build:e2e:clean
pnpm test:e2e:clean
pnpm test:e2e:production:single maestro/ios/app-launch.yaml
```

## Deployment

Deployment scripts are wrapped by `scripts/deploy.js`.

```bash
pnpm deploy:check
pnpm deploy:version
pnpm deploy:build
pnpm deploy:submit
pnpm deploy:full
```

## Project Structure

```text
app/                    Expo Router screens and tab navigation
components/             Shared Gluestack UI primitives
constants/              Theme and design-system tokens
docs/                   Static support and privacy pages
maestro/ios/            Maestro E2E flows
src/components/         App feature components
src/hooks/              App hooks
src/services/           SQLite, repositories, backup, offline services
src/stores/             Zustand app store
src/types/              Domain types
src/utils/              Date, statistics, and business logic helpers
```

## Notes

- Keep native package versions compatible with Expo SDK 55. Use `pnpm exec expo install --check` before merging dependency updates.
- Keep Tailwind on v3 while using NativeWind 4.x.
- Keep task assignment and completion separate: `completed=false` means assigned, `completed=true` means done.
