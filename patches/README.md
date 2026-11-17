# Dependency patches

## Removed URI decoder patch

Expo Router 58 no longer depends on query-string or decode-uri-component. The
CommonJS compatibility patch for the previous SDK's parser has been removed.
The routing regression now exercises Expo Router's installed query parser.

## react-native-css-interop 0.2.7

The existing patch is unchanged while its dependency target moves to 0.2.7.
