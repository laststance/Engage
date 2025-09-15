# E2E Tests with Maestro

This directory contains End-to-End tests for the Habit Tracker app using [Maestro](https://maestro.mobile.dev/).

## Test Files

- `app-launch.yaml` - Tests that the app launches successfully and shows main UI elements
- `basic-navigation.yaml` - Tests navigation between Calendar, Today, and Stats tabs
- `ui-elements.yaml` - Tests that UI elements are rendered correctly on each screen
- `test-suite.yaml` - Test suite configuration that runs all tests

## Current Status

⚠️ **Note**: Maestro E2E tests are configured but require a mobile device or simulator to run. For web testing, manual verification is currently used.

### Web Testing Alternative

For immediate testing on web, use the manual test script:

1. Open the app in browser: `http://localhost:8081`
2. Open browser console (F12)
3. Copy and paste the contents of `../test-manual.js`
4. Verify all tests pass

## Prerequisites

1. **Java 17+**: Required for Maestro

   ```bash
   brew install openjdk@17
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17
   ```

2. **Maestro**: Install the Maestro CLI

   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   export PATH="$PATH":"$HOME/.maestro/bin"
   ```

3. **Running App**: Make sure the app is running on a device or simulator
   ```bash
   npm start
   ```

## Running Tests

### All Tests

```bash
npm run test:e2e
# or
maestro test maestro/test-suite.yaml
```

### Individual Tests

```bash
# Test app launch
npm run test:e2e:app-launch

# Test navigation
npm run test:e2e:navigation

# Test UI elements
npm run test:e2e:ui
```

## Test Coverage

These tests verify:

✅ **App Launch**

- App starts successfully
- Main screen is displayed
- Tab bar is present with all three tabs

✅ **Navigation**

- Default Calendar tab is active
- Can navigate to Today tab
- Can navigate to Stats tab
- Can navigate back to Calendar tab

✅ **UI Elements**

- Calendar screen shows correct content
- Today screen shows correct content
- Stats screen shows correct content
- All tabs remain accessible

## Troubleshooting

### Common Issues

1. **"No devices found"**

   - Make sure you have a simulator running or device connected
   - For iOS: Open Simulator.app
   - For Android: Start an emulator or connect a device

2. **"App not found"**

   - Ensure the app is installed and running on the target device
   - Check that the `appId` in test files matches your app's bundle identifier

3. **"Java not found"**
   - Install Java 17+ and set JAVA_HOME environment variable
   - Add Maestro to your PATH

### Debugging Tests

Run tests with verbose output:

```bash
maestro test --debug maestro/basic-navigation.yaml
```

View test results in browser:

```bash
maestro test maestro/test-suite.yaml --format html
```

## Future Enhancements

As the app develops, these tests should be expanded to cover:

- Task selection and completion
- Journal entry creation
- Calendar date selection
- Statistics calculations
- Data persistence across app restarts
