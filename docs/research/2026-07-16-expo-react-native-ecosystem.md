# Expo and React Native Ecosystem Upgrade Research

- **Research date:** 2026-07-16 JST
- **Scope:** Engage dependency upgrade from Expo SDK 55, with TypeScript 7 and incompatible releases excluded
- **Source policy:** Official Expo, React Native, React, Apple, and Android documentation only

## Executive decision

Upgrade Engage to **Expo SDK 57**, the latest stable Expo SDK as of this research date. Perform the migration in two verified hops, **SDK 55 → SDK 56 → SDK 57**, because SDK 56 contains the meaningful compatibility breakpoints while SDK 57 is primarily the React Native 0.86 update.

Use Expo's compatibility resolver as the source of truth for Expo-managed packages:

~~~sh
npx expo install expo@^56.0.0 --fix
npx expo-doctor@latest

npx expo install expo@^57.0.0 --fix
npx expo-doctor@latest
~~~

Do not independently select the newest npm versions of React Native, React, Expo Router, or Expo modules. Each Expo SDK targets one React Native version, and Expo publishes the tested version matrix in its [SDK reference](https://docs.expo.dev/versions/v57.0.0/).

Keep TypeScript on the newest Expo-supported **6.x** release selected by the SDK 57 resolver. SDK 56 explicitly moved the template baseline to **TypeScript 6.0.3**; TypeScript 7 remains intentionally excluded. See the [SDK 56 release notes](https://expo.dev/changelog/sdk-56).

## Supported version matrix

| Expo SDK | React Native | React | Minimum Node.js | Minimum iOS | Native build tool |
| --- | --- | --- | --- | --- | --- |
| 55, baseline | 0.83 | 19.2.0 | 20.19.x | iOS 15.1 | Xcode 26.2+ |
| 56, migration checkpoint | 0.85 | 19.2.3 | 22.13.x | iOS 16.4 | Xcode 26.4+ |
| 57, target | 0.86 | 19.2.3 | 22.13.x | iOS 16.4 | Xcode 26.4+ |

SDK 56 and 57 compile and target Android API 36 and support Android 7+. The complete matrix is maintained in the [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/).

Engage already pins Node 22.20.0 through Volta, so the Node requirement is satisfied. The user-visible platform trade-off is the loss of iOS 15 support: moving beyond SDK 55 raises the deployment target to iOS 16.4.

## Mandatory compatibility work

### 1. Expo Router import migration

Expo Router in SDK 56 no longer allows application code to import directly from <code>@react-navigation/*</code>. Before this upgrade, Engage had direct imports in:

- <code>app/_layout.tsx</code> from <code>@react-navigation/native</code>
- <code>components/haptic-tab.tsx</code> from <code>@react-navigation/bottom-tabs</code> and <code>@react-navigation/elements</code>

The replacements are:

| Current source | SDK 56+ source |
| --- | --- |
| <code>@react-navigation/native</code> | <code>expo-router/react-navigation</code> |
| <code>@react-navigation/elements</code> | <code>expo-router/react-navigation</code> |
| <code>@react-navigation/bottom-tabs</code> | <code>expo-router/js-tabs</code> |

Expo provides an official codemod:

~~~sh
npx expo-codemod sdk-56-expo-router-react-navigation-replace app
npx expo-codemod sdk-56-expo-router-react-navigation-replace components
~~~

The codemod's default example targets <code>src</code>, but Engage's imports live in <code>app</code> and <code>components</code>. Verify the result manually rather than relying on the temporary node_modules compatibility shim. See the [SDK 55 to 56 Router migration guide](https://docs.expo.dev/router/migrate/sdk-55-to-56/).

### 2. New Architecture is no longer optional

Expo SDK 55 and later run entirely on React Native's New Architecture; it cannot be disabled. Engage should not add or retain a <code>newArchEnabled</code> escape hatch. Run <code>npx expo-doctor@latest</code> after each dependency batch to detect third-party packages whose metadata or runtime support is incompatible. See Expo's [New Architecture guide](https://docs.expo.dev/guides/new-architecture/).

### 3. Android edge-to-edge behavior

Android edge-to-edge is mandatory for the target Android API level. Expo SDK 55 already made several status-bar and navigation-bar background/translucency settings deprecated or no-ops. React Native 0.86 adds fixes for:

- <code>KeyboardAvoidingView</code> under Android 15+
- <code>measureInWindow</code> and window dimensions
- <code>StatusBar</code> behavior inside <code>Modal</code>
- navigation-bar contrast and inset handling

These fixes are directly relevant because Engage uses multiple modals and keyboard-avoiding layouts. Validate every modal, sheet, tab bar, keyboard transition, and safe-area boundary on Android after the SDK 57 hop. Sources: [Expo SDK 55 notes](https://expo.dev/changelog/sdk-55), [React Native 0.86 release](https://reactnative.dev/blog/2026/06/11/react-native-0.86), and [Android 15 behavior changes](https://developer.android.com/about/versions/15/behavior-changes-15).

### 4. Reanimated and Hermes V1 memory regression

SDK 56 enables Hermes V1 by default, and SDK 57 updates React Native Reanimated to 4.5 and Worklets to 0.10. Expo documents a known **25–30% memory increase** when Reanimated is imported with Hermes V1 unless Worklets bundle mode is enabled.

Engage did not call any Reanimated API, so this upgrade removes the unnecessary global side-effect import from <code>app/_layout.tsx</code>. It also removes the two NativeWind <code>transition-colors</code> utilities that caused CSS Interop to load Reanimated lazily. The SDK-compatible packages remain installed to satisfy NativeWind's peer and Babel integration, without an application code path that initializes Reanimated. Treat memory profiling and cold-launch checks as release gates if future UI work starts importing Reanimated.

Worklets Bundle Mode is promising, but its current setup still requires Babel and Metro changes plus temporary Metro patches for seamless bundling and Fast Refresh. Do not enable it as part of this compatibility-focused upgrade; reassess it when Engage introduces worklets. See the [SDK 57 release notes](https://expo.dev/changelog/sdk-57), the [SDK 57 Reanimated reference](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/), and the [Worklets Bundle Mode setup](https://docs.swmansion.com/react-native-worklets/docs/bundleMode/setup/).

### 5. Vector icon packages are now scoped

Expo no longer recommends the monolithic <code>@expo/vector-icons</code> package. Engage migrates its Ionicons and Android Material Icons fallback to <code>@react-native-vector-icons/ionicons</code> and <code>@react-native-vector-icons/material-icons</code>. Root imports preserve Expo Go and over-the-air update compatibility without a config plugin or native regeneration.

The Android export confirms that both font files are bundled. This compatibility-first mode adds roughly 747 KB of icon font assets; static icon packages can reduce that later, but require a config plugin and a new native build. See the [Expo icon guide](https://docs.expo.dev/guides/icons/), the [React Native Vector Icons migration guide](https://github.com/oblador/react-native-vector-icons/blob/master/MIGRATION.md), and its [Expo setup guide](https://github.com/oblador/react-native-vector-icons/blob/master/docs/SETUP-EXPO.md).

### 6. Native project regeneration changed

SDK 57 changes <code>expo prebuild</code> to clean and regenerate native directories by default. Before running it, inspect whether <code>ios/</code> or <code>android/</code> contain intentional manual edits. Use <code>--no-clean</code> only when those edits must be preserved, and review the generated native diff either way. See the [SDK 57 release notes](https://expo.dev/changelog/sdk-57).

### 7. File-system API migration can remain separate

Engage's backup service still uses <code>expo-file-system/legacy</code> alongside the newer <code>Paths</code> API. The dependency upgrade does not require a simultaneous backup rewrite, but the newer File and Directory APIs make copy and move operations asynchronous in SDK 56. Keep backup/restore behavior covered while updating, then migrate the legacy calls in a focused follow-up so dependency and data-migration risk are not mixed. See the [SDK 56 release notes](https://expo.dev/changelog/sdk-56).

## New capabilities worth trying

| Capability | Status in the target stack | Engage opportunity |
| --- | --- | --- |
| React Compiler | Stable compiler; Expo SDK 54+ integration | Keep <code>experiments.reactCompiler: true</code>. Run the compiler healthcheck and use <code>use no memo</code> only for measured exceptions. Do not mass-delete existing memoization without profiling. |
| React 19.2 <code>&lt;Activity&gt;</code> | Stable React API | Preserve Today/Calendar/Stats screen state while hidden and optionally pre-render likely next views. Prototype before replacing router lifecycle behavior. |
| React 19.2 <code>useEffectEvent</code> | Stable React API | Separate non-reactive notification/network callbacks from Effects and reduce accidental re-subscriptions. |
| React Native shared animation backend | RN 0.85+ | Test smoother transitions shared by Animated and Reanimated; native-driver layout-property support remains experimental and should be isolated. |
| React Native DevTools theme emulation | RN 0.86 | Test light/dark themes without changing the simulator or device theme. |
| Expo SQLite typed SQL template | SDK 57 | Evaluate <code>db.sql</code> for safely escaped, inferred queries in repositories; do not bypass the current repository abstraction. |
| Expo SQLite ArrayBuffer BLOB support | SDK 56+ | Enables binary backup or attachment data without manual byte-array conversions if Engage adds richer journal media later. |
| Expo SQLite inspector and change sessions | SDK 56+ | Inspect data from the dev menu and build efficient change-set-based backup/sync experiments. |
| Expo UI | Stable in SDK 56 | Prototype a small settings surface with native SwiftUI/Jetpack Compose primitives. It is not a reason to rewrite the existing design system. |
| Inline Expo native modules | Stable SDK 56 workflow | Add a tiny native capability directly from the app if a future habit or health integration needs one, without publishing a separate module package. |
| Expo Router Native Tabs | Alpha in current docs | A system-native tab-bar experiment could improve platform fidelity, but it should remain separate from this upgrade because Engage has a custom haptic JS tab button and the API is still subject to change. |
| Expo Router toolbar badges | SDK 57 | Consider a native-style badge for overdue or incomplete daily tasks where it improves navigation clarity. |

Primary feature references: [React Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1), [Expo React Compiler guide](https://docs.expo.dev/guides/react-compiler/), [React 19.2](https://react.dev/blog/2025/10/01/react-19-2), [React Native 0.85](https://reactnative.dev/blog/2026/04/07/react-native-0.85), [Expo SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/), [Expo SDK 56](https://expo.dev/changelog/sdk-56), and [Expo Router Native Tabs](https://docs.expo.dev/router/advanced/native-tabs/).

## Store and build requirements

- Apple requires uploads from 2026-04-28 onward to be built with the iOS/iPadOS 26 SDK or later. SDK 57's Xcode 26.4 minimum satisfies this requirement. See [Apple Developer News](https://developer.apple.com/news/?id=ueeok6yw).
- Google Play currently requires new apps and updates to target Android API 35. The deadline advances to API 36 on 2026-08-31. SDK 57 already targets API 36. See the [Android target API requirements](https://developer.android.com/google/play/requirements/target-sdk) and [Google Play policy help](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).
- Expo Go availability can lag the SDK release in app stores. Use a development build and Engage's existing DevTools-free production E2E build for authoritative validation.

## Recommended execution plan

1. Record the clean baseline: typecheck, lint, unit tests, Expo doctor, Expo install check, and current production E2E smoke.
2. Upgrade only to SDK 56 with <code>npx expo install expo@^56.0.0 --fix</code>.
3. Migrate the three direct React Navigation import sources, then run Expo doctor, typecheck, lint, unit tests, and native smoke tests.
4. Confirm TypeScript remains on Expo-supported 6.x and explicitly reject TypeScript 7.
5. Upgrade to SDK 57 with <code>npx expo install expo@^57.0.0 --fix</code>.
6. Update non-Expo dependencies in small compatible batches, honoring peer ranges and rerunning Expo doctor after each batch.
7. Review regenerated native projects, then run iOS and Android production builds.
8. Run Maestro production E2E plus physical-device checks for offline startup, task completion, journaling, backup/restore, notifications, modals, keyboard behavior, tab insets, and dark mode.
9. Profile launch and navigation memory because of the documented Hermes/Reanimated regression.

Expo's general [SDK upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/) recommends upgrading incrementally and running both <code>expo install --fix</code> and Expo Doctor.

## Dependency policy for this upgrade

- **Expo-managed packages:** accept the versions produced by <code>npx expo install --fix</code>.
- **React and React Native:** use the exact SDK 57 compatibility line, not the newest standalone release.
- **TypeScript:** latest Expo-supported 6.x only; TypeScript 7 excluded.
- **Router and navigation:** use Expo Router's SDK 57 entry points; remove direct application imports from <code>@react-navigation/*</code> where the migration guide requires it.
- **Native modules:** require New Architecture support and a clean Expo Doctor result.
- **Other JavaScript-only packages:** update to latest stable unless peer ranges, tests, or behavior checks show incompatibility.
- **Experimental APIs:** evaluate behind focused prototypes; do not couple Native Tabs or native-driver layout animations to the core dependency migration.

## Official source index

- [Expo SDK 57 release notes](https://expo.dev/changelog/sdk-57)
- [Expo SDK 57 version matrix](https://docs.expo.dev/versions/v57.0.0/)
- [Expo SDK 56 release notes](https://expo.dev/changelog/sdk-56)
- [Expo Router SDK 55 to 56 migration](https://docs.expo.dev/router/migrate/sdk-55-to-56/)
- [Expo SDK upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Expo New Architecture guide](https://docs.expo.dev/guides/new-architecture/)
- [Expo React Compiler guide](https://docs.expo.dev/guides/react-compiler/)
- [Expo SQLite SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [React Native 0.86 release](https://reactnative.dev/blog/2026/06/11/react-native-0.86)
- [React Native 0.85 release](https://reactnative.dev/blog/2026/04/07/react-native-0.85)
- [React Native supported versions](https://reactnative.dev/versions)
- [React Compiler 1.0](https://react.dev/blog/2025/10/07/react-compiler-1)
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2)
- [Apple SDK upload requirement](https://developer.apple.com/news/?id=ueeok6yw)
- [Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk)
