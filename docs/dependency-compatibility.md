# Dependency compatibility

`pnpm upgrade --latest` was applied for the October 2026 refresh. The newest stable
Expo release is SDK 57, which targets React Native 0.86 and React 19.2. The app
keeps Expo's supported runtime versions for React, React Native, AsyncStorage,
Gesture Handler, Safe Area Context, Screens, SVG, and Worklets. Reanimated 4.5.5
is the newest compatible patch in its Expo-supported minor line. The October 4
baseline passed its iOS Release build and all 12 production Maestro flows; the
October 15 refresh adds a thirteenth flow for the journal viewport regression.

The October 15 refresh keeps SDK 57 and the repository's 24-hour
`minimumReleaseAge` policy. Expo 57.0.28 and expo-build-properties 57.0.21 are the
newest eligible versions at validation time; newer patches published within the
waiting period are intentionally retained for a later refresh. The unrestricted
`--latest` attempt also selected the SDK 58 preview line, so the final update uses
the supported SDK 57 ranges for Expo and its native runtime dependencies.

For builds made with Xcode 27, `ios.enableSceneSupport` enables Expo's official
SDK 57 UIKit scene-lifecycle backport. Without it, the app terminates before the
calendar appears on iOS 27. See the [Expo migration guide](https://github.com/expo/fyi/blob/main/ios-scene-lifecycle.md#staying-on-sdk-57-with-xcode-27).
Maestro CLI 2.11.0 is pinned in CI so the journal viewport regression uses the same
runner as local verification.

NativeWind 4.2.7 still uses Tailwind CSS 3. Tailwind CSS 4 requires the NativeWind
5 release candidate and a styling migration. Expo's current ESLint plugins do not
support ESLint 10, so this project retains ESLint 9.39.5. React Test Renderer and
React type definitions stay on the React 19.2 line used by Expo.

TypeScript uses the [official side-by-side setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/):
`@typescript/native` provides the TypeScript 7.0.2 `tsc` binary, while the
`typescript` alias exposes TypeScript 6's JavaScript API to `ts-jest` and
`typescript-eslint`. The alias pins `@typescript/typescript6@6.0.2`; its
`pnpm exec tsc6 --version` binary reports 6.0.3.

The `expo.install.exclude` entries are intentional exceptions to Expo's exact
version suggestions: Jest 30 and its types passed the full unit suite; Reanimated
4.5.5 passed native iOS QA; and the TypeScript alias is required for the native
compiler transition. Revisit these exceptions when Expo or its tooling updates.

The security overrides select patched `brace-expansion`, `js-yaml`,
`postcss-selector-parser` (7.1.6), and `shell-quote` (1.11.0) releases. The October
15 refresh removes the selector parser's moderate advisory and shell-quote's
critical advisory. `pnpm audit --audit-level=moderate` still reports two high-severity
transitive advisories: [`braces`](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
through Metro/Tailwind tooling and [`node-forge`](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
through Expo CLI. Their currently published latest releases are 3.0.3 and
1.4.0, respectively; the advisory-fixed 3.0.4 and 1.4.1 releases are not
published yet. Recheck these before the next Store build.
