// https://docs.expo.dev/guides/using-eslint/
const { fixupConfigRules } = require('@eslint/compat');
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  // Expo still bundles React rules that use the pre-ESLint-10 context API.
  ...fixupConfigRules(expoConfig),
  {
    ignores: ['dist/*'],
  },
]);
