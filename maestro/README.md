# Maestro E2E Tests

EngageアプリのiOS Production E2E向けMaestroテストスイート。

## Platform Support

| プラットフォーム | 状態 | ディレクトリ | 備考 |
|-----------------|------|-------------|------|
| **iOS** | 実装済み | `ios/` | Production build + iPhone Simulator |

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
- `05-journal-entry.yaml`: journal input + autosave, including the footer above the compact-iPhone keyboard
- `06-calendar-browsing.yaml`: calendar navigation + DayModal date regression
- `07-edit-presets.yaml`: TaskPicker to PresetTaskEditor modal flow + keyboard/category stability regression
- `10-data-persistence.yaml`: SQLite state survives restart
- `11-backup-create.yaml`: backup creation regression
- `12-calendar-preset-save.yaml`: nested Calendar preset save returns to DayModal without a white screen
- `13-daily-routine-setting.yaml`: daily routine selection persists after saving
- `14-daily-condition.yaml`: daily condition persists independently of journal text
- `15-calendar-content-reachability.yaml`: lower calendar content remains reachable on compact iPhones or with larger text
- `16-tab-restore.yaml`: redux-storage-middleware restores the Stats tab when relaunch sets `clearState: false`
- `17-journal-keyboard-visibility.yaml`: keeps the journal below the fixed header and above the keyboard after short/long input and autosave in Calendar and Today

### Journal viewport regression

Use Maestro CLI **2.11.0**, also pinned in the iOS workflow. Run the viewport flow
on a compact iPhone as well as the current iOS runtime:

```bash
maestro --udid <simulator-udid> test maestro/ios/17-journal-keyboard-visibility.yaml
```

Build the full suite with `pnpm build:e2e`. For the headless alternative, use
`E2E_TEST=true EXPO_PUBLIC_E2E_TEST=true pnpm ios:headless` so tab-persistence flows
can observe their save-completion markers. Rebuild the embedded bundle after
changing these environment variables; Metro's transform cache may otherwise
retain the ordinary Release configuration. When using `expo export:embed` to
refresh an existing bundle, pass `--reset-cache` without `CI` in the environment:
Expo intentionally ignores that flag in CI. Confirm the generated bundle contains
`session-tab-saved-` before running the full suite.

The flow uses `below`/`above` selectors to check the editor's top-edge ordering
against the fixed header and keyboard accessory. Checking only
`journal-text-input` visibility can miss a field whose first line is hidden behind
the header. A separate `height: 144` assertion (with one-point tolerance) rejects
an editor that grows with long input; relative selectors alone do not check its
bottom edge. Run this flow on a compact iPhone to exercise keyboard constraints.

CI keeps the Release configuration but builds only the runner's native simulator
architecture (`arm64` or `x86_64`) through a temporary Xcode configuration file.
Building both simulator architectures duplicated native compilation and exceeded
the 40-minute build deadline. This override applies only to the CI simulator
build. The test-results artifact includes Expo build output and detailed Xcode
logs even when the build fails before Maestro starts, plus the JUnit report when
Maestro runs.

### iOS 27 launch failures

An app built with Xcode 27 must use UIKit's scene lifecycle on iOS 27. A crash
containing `UIScene life cycle is required for apps built with this SDK` happens
before the calendar renders, so a later `calendar-screen` timeout is a symptom of
the native launch failure. Check the simulator crash report before changing test
timeouts or selectors.

Engage enables the supported SDK 57 backport through
`expo-build-properties` → `ios.enableSceneSupport`. After changing this setting,
regenerate the ignored native project with `pnpm exec expo prebuild --platform ios --clean`
and build the app again. The generated AppDelegate must implement
`ExpoReactNativeFactoryProvider`, and Info.plist must declare
`UIApplicationSceneManifest` with `EXExpoAppSceneDelegate`.

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

## Known Benign Simulator Logs

These messages can appear during Maestro/XCTest runs without indicating an app-originated interaction bug:

- `XCTAutomationSupportErrorUnknownElement: Error getting main window Unknown kAXError value -25218`
- `XCTAutomationSupport Automation type mismatch`
- `RCTScrollViewComponentView implements focusItemsInRect`
- `UIKeyboardLayoutStar implements focusItemsInRect`
- `NSBundle (null) initWithPath failed because the resolved path is empty or nil`
- `TextInputUI Received external candidate resultset`
- `CoreHaptics ... hapticpatternlibrary.plist could not be opened`

Treat them as platform or test-runner noise unless they accompany a failed assertion, a stuck flow, or a reproducible app UI regression.
