# Dependency patches

## decode-uri-component 0.5.0

The workspace override upgrades Expo Router's transitive URI decoder to the fixed version for [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). Expo Router 57 still uses query-string 7, which expects `require('decode-uri-component')` to return a callable function. Upstream 0.5.0 exports an ES module, so a direct override breaks parsing with `TypeError: decodeComponent is not a function`.

This patch changes only the package module type and function export to preserve the existing CommonJS contract. The upstream decoding algorithm remains unchanged. `src/services/__tests__/routingDependencies.test.ts` exercises the actual installed parser with encoded Japanese text, spaces and malformed UTF-8.

Remove this patch when Expo Router's query parser accepts the fixed decoder's native module format, then rerun the routing regression and native navigation tests.

## react-native-css-interop 0.2.6

This existing patch is retained unchanged by the daily-condition work.
