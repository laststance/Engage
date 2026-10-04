# Dependency compatibility

`pnpm upgrade --latest` was applied for the October 2026 refresh. The newest stable
Expo release is SDK 57, which targets React Native 0.86 and React 19.2. The app
keeps Expo's supported runtime versions for React, React Native, AsyncStorage,
Gesture Handler, Safe Area Context, Screens, SVG, and Worklets. Reanimated 4.5.5
is the newest compatible patch in its Expo-supported minor line; the iOS Release
build and all 12 production Maestro flows passed with it.

NativeWind 4.2.7 still uses Tailwind CSS 3. Tailwind CSS 4 requires the NativeWind
5 release candidate and a styling migration. Expo's current ESLint plugins do not
support ESLint 10, so this project retains ESLint 9.39.5. React Test Renderer and
React type definitions stay on the React 19.2 line used by Expo.

TypeScript uses the [official side-by-side setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/):
`@typescript/native` provides the TypeScript 7.0.2 `tsc` binary, while the
`typescript` alias exposes TypeScript 6's JavaScript API to `ts-jest` and
`typescript-eslint`. `pnpm exec tsc6 --version` reports 6.0.3.

The `expo.install.exclude` entries are intentional exceptions to Expo's exact
version suggestions: Jest 30 and its types passed the full unit suite; Reanimated
4.5.5 passed native iOS QA; and the TypeScript alias is required for the native
compiler transition. Revisit these exceptions when Expo or its tooling updates.

The security overrides now select patched `brace-expansion` and `js-yaml`
releases. `pnpm audit --audit-level=moderate` still reports two high-severity
transitive advisories: [`braces`](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
through Metro/Tailwind tooling and [`node-forge`](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
through Expo CLI. Their currently published latest releases are 3.0.3 and
1.4.0, respectively; the advisory-fixed 3.0.4 and 1.4.1 releases are not
published yet. Recheck these before the next Store build.
