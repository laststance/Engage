# Engage

Engage is a React Native habit tracker built with Expo. It focuses on daily task completion, streak tracking, reflective journaling, and local-first backup/restore.

## Stack

- Expo SDK 57
- React Native 0.86
- React 19.2
- Expo Router
- SQLite via `expo-sqlite`
- Zustand
- NativeWind with Tailwind CSS v3
- Jest and React Native Testing Library
- Maestro for iOS E2E tests

## Requirements

- Node.js 22.20.0
- pnpm 11.13.0 through Corepack
- Xcode 26.4 or newer for Expo SDK 57 iOS builds
- Maestro for E2E testing
- Expo development and E2E scripts pin Metro to port 8090.

```bash
corepack enable
pnpm install
```

## Development

```bash
pnpm start
pnpm ios
pnpm ios:headless
pnpm android
pnpm web
```

`pnpm ios:headless` uses Expo's generic build-only mode plus `simctl` to build
an embedded Release bundle, boot a dedicated `Engage Headless` device, and
launch the app without opening `Simulator.app` or starting a persistent Metro
development server. Override the dedicated device with
`IOS_HEADLESS_UDID=<udid>` when needed.

## Quality Checks

`pnpm lint` is configured with `--max-warnings 0`, so warnings fail the command.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm quality:fallow
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
docs/                   Internal docs, reports, and planning artifacts
maestro/ios/            Maestro E2E flows
src/components/         App feature components
src/hooks/              App hooks
src/services/           SQLite, repositories, backup, offline services
src/stores/             Zustand app store
src/types/              Domain types
src/utils/              Date, statistics, and business logic helpers
website/                Static support and privacy pages published by GitHub Pages
```

## Notes

- Keep native package versions compatible with Expo SDK 57. Use `pnpm exec expo install --check` before merging dependency updates.
- Regenerate ignored `ios/` and `android/` projects with `pnpm exec expo prebuild --clean` after an SDK change; inspect local native customizations first because clean prebuild replaces those directories.
- Keep Tailwind on v3 while using NativeWind 4.x.
- Keep task assignment and completion separate: `completed=false` means assigned, `completed=true` means done.
