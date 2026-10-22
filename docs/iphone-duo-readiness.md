# iPhone Duo readiness

Assessed on October 22, 2026, against `origin/main` at `6742ccc` (Engage 1.0.13).
Status: source changes, iOS 1.0.14 (build 19) metadata, and six Store screenshot candidates are prepared. Current-head CI, native acceptance, and Store delivery are tracked separately in [PR #97](https://github.com/laststance/Engage/pull/97).

## Apple requirements and Engage decisions

Apple's October newsletter links to a three-step workflow: audit resizing assumptions, fix them, and exercise live resizing. Existing apps remain usable in compatibility layouts. Building with Xcode 27.1 enables the full display behavior and requires testing the new geometry before shipping. See [Apple's preparation guide](https://developer.apple.com/iphone-duo/prepare/).

| Area | Finding and action |
| --- | --- |
| Scene lifecycle | Already enabled with `expo-build-properties`; retained after updating Expo SDK 57.0.28 to 57.0.31. Prebuild generates `EXExpoAppSceneDelegate`. |
| Build SDK | Pin production iOS builds to `macos-tahoe-26.6-xcode-27.1`. Preview and E2E production profiles inherit it. Expo's automatic SDK 57 image does not guarantee Xcode 27.1. |
| Native scheme | Fresh prebuild generates the shared scheme `Engage`. Correct the production and E2E profiles from `engage` to `Engage`; the lowercase scheme fails with Xcode exit 65. |
| Screen geometry | Application code has no cached `Dimensions.get`, `UIScreen.main`, device-model size switches, or orientation-based layout branches. Existing flex layouts and scroll containers resize with their parents. |
| Safe areas | `AppScreen` previously padded only the top. Apply live left and right insets to protect content when system regions move to either side. Keep the existing bottom-inset ownership in navigation. |
| Orientation | Explicitly allow all four iOS orientations in `ios.infoPlist.UISupportedInterfaceOrientations`. The top-level `orientation: portrait` remains for Android. Expo's prebuild warning about overriding the abstract property on iOS is expected. |
| Modals | Native `pageSheet` roots now each own a `SafeAreaProvider`. Final iPhone 17 Pro landscape QA reproduced Dynamic Island occlusion in the day sheet and task picker: a safe-area view without a local native provider did not reliably follow sheet rotation. Preserve native safe-area measurement in all three modal flows. React Native ignores `supportedOrientations` for `pageSheet`; do not add an ineffective prop. |
| Keyboard resizing | Native QA found runaway JavaScript `KeyboardAvoidingView` padding after unfolding an open preset sheet, affecting both the sheet and underlying DaySheet. On iOS, delegate keyboard clearance to native ScrollView insets instead; preserve Android height behavior. |
| Compact journal editing | SE landscape QA found the journal hidden by its Done accessory because JavaScript heading scrolling overwrote native caret positioning. Keep focus/layout scrolling under native control on iOS; after the keyboard settles, align the heading only when the measured heading and writing box fit above it. Invalidate stale measurements during rotation or unfolding. Android retains its existing anchor. |
| Statistics freshness | Native QA also found a previously visited Stats tab retaining its old journal count. React Compiler caches calls to the stable `getStatsForPeriod` function while its underlying store data changes. Opt this screen out of compiler memoization with `use no memo`; preserve the shared store calculation and add a Release-native regression for save, revisit, and relaunch. |
| Device targeting | Keep `supportsTablet: false` and `requireFullScreen: false`. iPhone Duo support does not require expanding distribution to iPad. |
| Camera | Engage has no camera capture flow, so Duo camera-selection APIs are not applicable. |

Sources: [Expo build images](https://docs.expo.dev/build-reference/infrastructure/), [Expo build properties](https://docs.expo.dev/versions/latest/sdk/build-properties/), [React Native Modal](https://reactnative.dev/docs/modal#supportedorientations).

The statistics fix is an existing display-refresh defect discovered during this audit, not an iPhone Duo-only requirement. The compiler output confirms that both period calculations were cached by function identity. SQLite retains the new journal while the old screen displays zero. The narrowly scoped [React Compiler opt-out](https://react.dev/reference/react-compiler/directives/use-no-memo) keeps the rest of the application's compiler configuration enabled.

## Verification completed

The initial native checks below precede the 1.0.14 (19) metadata bump. Pre-patch dynamic recordings and post-patch automated results are distinguished below; the later release-candidate checks are recorded under Store delivery. None establishes acceptance or publication of a future signed Store build.

- Regression test fails on the original `AppScreen` because horizontal padding is missing, then passes with the fix.
- Synthetic right-edge, left-edge, and cleared insets update in the same mounted screen without losing the draft. Hook values are injected; this does not prove operating-system geometry.
- `pnpm test --runInBand`: 34 suites, 377 tests passed.
- `pnpm typecheck` and `pnpm lint`: passed.
- `pnpm exec expo config --type introspect --json`: verified generated orientations, Scene manifest, and full-screen setting.
- `pnpm exec expo prebuild --platform ios --no-install`: passed; generated native configuration retains Scene support and all four orientations.
- `pnpm exec expo export --platform ios --output-dir .expo/duo-export`: passed.
- Xcode 27.1 (27A9275) Release simulator build: passed with zero errors. Native dependency compiler warnings remain in the build log. Built `Info.plist` confirms `iphonesimulator27.1`, Scene support, all four orientations, and `UIRequiresFullScreen: false`.
- Apple exported `app-resizability` skill: completed a first-party source and generated-native audit. No further definite source defect was found; the native scenarios below remain the acceptance evidence.

The initial patch installation was blocked by the repository's `minimumReleaseAge: 1440`. The owner subsequently requested installing the eight compatible patches and adding pnpm exceptions. All eight are now installed, and `pnpm exec expo install --check` reports that dependencies are up to date.

| Direct dependency | Previous | Installed |
| --- | --- | --- |
| `@expo/metro-runtime` | 57.0.16 | 57.0.17 |
| `expo` | 57.0.28 | 57.0.31 |
| `expo-build-properties` | 57.0.21 | 57.0.22 |
| `expo-constants` | 57.0.21 | 57.0.22 |
| `expo-linking` | 57.0.12 | 57.0.13 |
| `expo-notifications` | 57.0.22 | 57.0.23 |
| `expo-router` | 57.0.26 | 57.0.29 |
| `expo-sharing` | 57.0.23 | 57.0.24 |

`minimumReleaseAgeExclude` now includes these exact versions plus six required transitive versions: `@expo/cli@57.0.32`, `@expo/config-plugins@57.0.11`, `@expo/router-server@57.0.14`, `@expo/ui@57.0.26`, `expo-modules-core@57.0.24`, and `expo-modules-jsi@57.1.3`. The 1440-minute policy and existing exceptions remain. Version-qualified exceptions follow the [pnpm dependency-resolution specification](https://pnpm.io/settings/dependency-resolution#minimumreleaseageexclude); future Expo versions are not automatically exempted. The manifest and lockfile were updated together, and frozen installation succeeds without a global age override.

After installing the patches, all 34 suites / 377 tests, typecheck, lint, iOS prebuild, and a fresh Xcode 27.1 Release simulator build passed. The rebuilt app passed **14/14 Duo flows in 6 minutes 38 seconds** and **3/3 compact iPhone SE flows in 1 minute 53 seconds**, including journal keyboard geometry, saved statistics, and persistence after relaunch. Generated and built native configuration still includes Scene support, four orientations, and no full-screen requirement. These patch-specific results, logs, and source/binary fingerprints are retained separately under `.gstack/qa-reports/expo-sdk57-patches/`. Both task-owned simulators were shut down after validation.

The dependency audit still reports two high-severity advisories: `node-forge@1.4.0` (GHSA-86w9-cpqp-85rv) and `braces@3.0.3` (GHSA-vfj7-8cjw-p6xm). Both resolutions and integrity hashes are identical in the pre-update and updated lockfiles. The npm audit response names `>=1.4.1` / `>=3.0.4` as patched ranges, but registry queries during release preparation confirm that neither version is published; GitHub advisories list no patched release. These existing findings remain unresolved and are disclosed separately from CI results; no audit suppression or security gate relaxation is applied.

## Native acceptance gate

Xcode first-launch setup is complete. The iOS 27.1 (24A94425) simulator runtime is installed. Testing uses newly created, isolated simulators: `Engage Duo QA` on iOS 27.1 and `Engage Compact QA` (iPhone SE, third generation) on iOS 27.0. Existing personal simulators are not used or erased.

The Release simulator build embeds JavaScript with `E2E_TEST=true`, `EXPO_PUBLIC_E2E_TEST=true`, and `REACT_NATIVE_NO_DEVTOOLS=1`. An arm64-only local xcconfig avoids unnecessary Intel simulator compilation. Apple's exported `device-interaction` skill provides native observation. Device Hub's actual Closed / Partially Open / Open and Rotate controls change the simulated hardware pose and display orientation. Xcode's synthetic orientation command changed the sensor direction without rotating this Duo's UI, so it was not used as evidence of display rotation.

- Before the dependency patches, the final Closed/portrait Duo build passed **14/14 Maestro flows** in 5 minutes 10 seconds, including task completion, date browsing, conditions, routine settings, preset editing, backup creation, tab/data persistence, journal keyboard geometry, and journal statistics refresh.
- Before the dependency patches, compact iPhone SE (third generation), iOS 27.0 passed **3/3 Maestro flows** in 1 minute 28 seconds, covering tab navigation, long journal input above the keyboard in both the date sheet and Today, and the new journal statistics/relaunch regression.
- Dynamic Duo QA exposed a native keyboard-layout feedback loop. The repaired build passed all 377 unit tests, typecheck/lint, the compact native regression, and the exact live unfolding reproduction. The preset container remains 627 points tall in a 669-point window after more than 15 seconds; the original grows beyond 1.2 million points. All 33 captured candidate keyboard-container checks are bounded by their application window.

| Candidate scenario | Observed result |
| --- | --- |
| Today journal, keyboard open | Closed → Open → Partially Open → Open → Closed, repeated for each display recording: the same 85-character text, focus, Saved indicator, and Done control remain available. |
| Journal rotation | Actual left landscape → right landscape → portrait: input stays usable; Done restores normal spacing. |
| Preset editor | Unfold with no keyboard: contents and Save/Cancel remain visible. Focused task-name draft survives Closed → Open → Closed; minutes accepts `30`; Done restores the footer without a blank gap. Synthetic changes were discarded. |
| Task picker | Closed → Open retains the task list, footer, and close control. |
| Date sheet | Closed → Open retains content. Focused journal survives Open → Closed; Done restores normal spacing. |
| Settings and tabs | Settings Closed → Open, Calendar/Today/Stats in both display sizes: navigation and essential controls remain usable. |
| Journal statistics refresh | The same Release-native regression fails before the compiler opt-out and passes afterward on Duo and iPhone SE. A previously visited Stats tab updates its journal count after saving, and the text persists after relaunch. |
| Compact non-Duo iPhone | Both normal navigation and long journal input above the keyboard pass on iPhone SE. |

The app uses JavaScript tabs and custom headers. They do not automatically become UIKit vertical bars. Their essential controls were usable in the tested native scenarios; no migration to native tabs was needed. The partially open journal scenario also remained usable. This is bounded scenario coverage, not proof of every possible fold angle or a native reserved-region API integration. Physical-device ergonomics and Android runtime behavior were not tested. See [Apple's detailed guidance](https://developer.apple.com/documentation/technologyoverviews/preparing-your-app-for-iphone-duo).

The initial native videos were recorded and sampled into frames for inspection before the dependency patches. Later 1.0.14 recordings cover the patched dependency graph, including actual fold/rotation and compact landscape input. The compact journal repair additionally requires both initial focus paths, long text, and rotation, while retaining the existing portrait heading/144-point editor assertions. See PR #97 for the final candidate's acceptance evidence. CoreSimulator allows one display recorder at a time, so the fold cycle was repeated separately for the outer and inner display. Inactive-display black frames are expected. Raw video timestamp discontinuities prevent using wall-clock offsets alone; inspected excerpts and native hierarchy captures provide the evidence.

Local evidence is retained under `.gstack/qa-reports/iphone-duo-native/`, including JUnit results, build logs, before/after videos, native hierarchies, a geometry checker, and source/binary fingerprints. These ignored local artifacts are not included in a Git commit.

## Store delivery

Release metadata is prepared for iOS 1.0.14 (build 19), with Japanese update notes in [App Store metadata](../store-assets/app-store-metadata.md). Non-E2E Release builds use Xcode 27.1. The final source candidate must pass unit tests, typecheck, lint, hosted CI, CodeRabbit, and native regression checks before merge; PR #97 records their current results. A signed distribution build, App Store submission, badge, and public release require separate evidence.

The approved delivery plan is to release 1.0.14 first while preserving the existing conventional iPhone screenshots. After Apple accepts both Duo display sets, submit the six images with the next app version and its App Review cycle (1.0.15 if no intervening release occurs). Screenshots cannot be added directly to an already approved 1.0.14 listing; revalidate the images against the follow-up version's UI and verify upload processing and review approval separately. This records the delivery plan, not a completed release or upload.

Apple's current [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) list:

- Outer display: 1398 × 2034 or 2034 × 1398 pixels.
- Inner display: 2007 × 2853 or 2853 × 2007 pixels.
- No alpha channel or transparency.

Six fresh Japanese screenshots now cover Calendar, Today, and Stats on both Duo displays, captured from the 1.0.14 (19) non-E2E Release simulator app with synthetic demonstration data. All six are RGB JPEGs at the native portrait dimensions above, without alpha. The local `screenshots/manifest.json` in the release evidence directory records their SHA-256 hashes and the app binary fingerprints. Earlier pre-patch Calendar captures remain historical evidence. No screenshots have been uploaded.

The specifications associate Duo screenshot submission with the optimization badge and require these screenshots from April 2027 for apps using iOS 27.1 SDK or later. See [Apple's submission announcement](https://developer.apple.com/news/?id=kkphp5qo).

Upload acceptance is unconfirmed as of October 22, 2026. Apple's September [DTS response](https://developer.apple.com/forums/thread/845505) schedules Duo asset-upload support for later in 2026. Neither the current [ScreenshotDisplayType reference](https://developer.apple.com/documentation/appstoreconnectapi/screenshotdisplaytype) nor the official OpenAPI 4.5.1 schema has a Duo case. The authenticated App Store Connect UI could not be checked because its session expired. Support may have been enabled after that announcement; verify the current UI or API accepts both display sets before claiming submission.
