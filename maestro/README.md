# Maestro E2E Tests

EngageアプリのProduction E2E向けMaestroテストスイート。

## Platform Support

| プラットフォーム | 状態 | ディレクトリ | 備考 |
|-----------------|------|-------------|------|
| **iOS** | 実装済み | `ios/` | Production build + iPhone Simulator |
| **Android** | 計画中 | `android/` | 将来実装予定 |

## Quick Start

### iOS テスト実行
```bash
# 1. Production E2E buildを起動
pnpm build:e2e

# 2. Main suiteを実行
pnpm test:e2e:production

# 3. 個別flowを実行
pnpm test:e2e:production:single maestro/ios/06-calendar-browsing.yaml
```

## Suite Policy

`pnpm test:e2e:production` と `pnpm test:e2e:ios` は `smoke`, `manual`, `nightly` tagged flowsを除外して、重複の少ないmain suiteだけを実行します。

### Main Suite
- `02-tab-navigation.yaml`: app shell / Expo Router / tab wiring
- `04-task-completion.yaml`: task assignment + completion
- `05-journal-entry.yaml`: journal input + autosave
- `06-calendar-browsing.yaml`: calendar navigation + DayModal date regression
- `07-edit-presets.yaml`: TaskPicker to PresetTaskEditor modal flow
- `10-data-persistence.yaml`: SQLite state survives restart
- `11-backup-create.yaml`: backup creation regression

### Tagged On-Demand Flows
- `01-app-launch.yaml` (`smoke`): launch-only diagnosis
- `03-task-selection.yaml` (`manual`): standalone TaskPicker assignment check
- `08-statistics.yaml` (`manual`): standalone statistics toggle check
- `09-settings.yaml` (`manual`): standalone Settings menu check

## Tags

```bash
# Main suiteと同じ除外条件を直接指定
maestro test maestro/ios/ --exclude-tags "smoke,manual,nightly"

# Launch smokeだけ実行
maestro test maestro/ios/ --include-tags smoke

# Manual redundancy checksだけ実行
maestro test maestro/ios/ --include-tags manual
```

## Selector Notes

- Prefer `id` selectors backed by React Native `testID`.
- Tab buttons use accessibility labels such as `today-tab`, `stats-tab`, and `calendar-tab`.
- Use `extendedWaitUntil` before assertions because app initialization and SQLite loading are async.
- Production build is required because DevTools can interfere with E2E stability.
