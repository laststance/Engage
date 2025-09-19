# Journal Functionality E2E Tests

This directory contains comprehensive End-to-End tests for the journal functionality in the Engage app.

## Test Files

### 1. `journal-functionality.yaml`

**Comprehensive journal feature test**

Tests covered:

- ✅ Journal entry creation and editing
- ✅ Auto-save functionality with debouncing
- ✅ Character count display and limits
- ✅ Persistence across modal close/reopen
- ✅ Persistence across app restart
- ✅ Empty state handling and encouragement messages
- ✅ Character limit warnings and enforcement
- ✅ Blur-triggered auto-save
- ✅ Navigation persistence testing
- ✅ Different date isolation (each date has separate journal)

**Requirements covered:**

- 3.2: Journal entry creation and editing ✅
- 3.3: Auto-save functionality ✅
- 3.4: Placeholder text and empty state handling ✅
- 3.5: Journal persistence ✅
- 5.4: Data persistence across app sessions ✅

### 2. `journal-auto-save.yaml`

**Focused auto-save functionality test**

Tests covered:

- ✅ Debounced auto-save (1 second delay)
- ✅ Immediate save on blur
- ✅ Auto-save status indicators ("保存中", "保存済み")
- ✅ Rapid typing debouncing
- ✅ Persistence after app backgrounding
- ✅ Empty content auto-save handling

**Requirements covered:**

- 3.3: Auto-save functionality ✅
- 5.4: Data persistence ✅

### 3. `journal-placeholder-text.yaml`

**Dynamic placeholder text test**

Tests covered:

- ✅ Default placeholder text ("日記を書いてみましょう...")
- ✅ Completion-based placeholder ("達成したことについて振り返ってみましょう...")
- ✅ Empty state encouragement messages
- ✅ Focus/blur state changes
- ✅ Date-specific placeholder behavior

**Requirements covered:**

- 3.2: Placeholder text handling ✅
- 3.4: Empty state handling ✅

## Running the Tests

### Run all journal tests:

```bash
npm run test:e2e:journal
```

### Run individual test suites:

```bash
# Basic functionality
npm run test:e2e:journal:basic

# Auto-save specific
npm run test:e2e:journal:autosave

# Placeholder text specific
npm run test:e2e:journal:placeholder
```

### Run with iOS Simulator:

```bash
# Ensure iOS Simulator is running with Engage app installed
maestro test maestro/ios/journal-functionality.yaml
```

## Test Environment Requirements

### iOS Simulator Setup:

- iPhone 16 Pro Simulator (iOS 18.6) - recommended
- Engage app installed and accessible
- Simulator should be in portrait orientation
- Keyboard should be available for text input

### Maestro Configuration:

- Maestro CLI installed and configured
- Java 17+ environment (for Maestro)
- Network connectivity for app installation

## Test Data and State Management

### State Clearing:

All tests use `clearState` to ensure clean test environment:

- Clears app data and preferences
- Resets to initial app state
- Ensures test isolation

### Test Data:

Tests use Japanese text to match app localization:

- "今日は素晴らしい一日でした" (sample journal entry)
- "テスト中です" (test content)
- "バックグラウンドテスト" (background test)

## Known Limitations and Workarounds

### Coordinate-Based Navigation:

Due to Expo Router limitations with Maestro CLI (GitHub Issue #2448), tests use coordinate-based navigation:

```yaml
- tapOn:
    point: 50%, 93% # Today tab
```

### Timing Considerations:

- Auto-save debouncing: 1 second delay
- Animation waits: 500ms for UI transitions
- App restart: Full stop/launch cycle for persistence testing

### Platform Specificity:

- Tests optimized for iPhone screen dimensions
- Coordinates may need adjustment for different device sizes
- iOS-specific UI patterns and behaviors

## Troubleshooting

### Common Issues:

1. **Test fails at calendar date selection**

   - Ensure calendar is visible and interactive
   - Check simulator orientation (portrait required)
   - Verify app is fully loaded before test execution

2. **Auto-save timing issues**

   - Increase wait times if running on slower simulators
   - Check that debouncing delay matches implementation (1 second)

3. **Text input failures**

   - Ensure iOS Simulator keyboard is enabled
   - Check that text input field is properly focused
   - Verify Japanese text input is supported

4. **Persistence test failures**
   - Confirm app properly saves to SQLite database
   - Check that app restart fully clears memory state
   - Verify database persistence across app lifecycle

### Debug Commands:

```bash
# Run with verbose output
maestro test --debug maestro/ios/journal-functionality.yaml

# Take screenshots during test
maestro test --output screenshots/ maestro/ios/journal-functionality.yaml
```

## Test Coverage Summary

| Requirement                    | Test File                     | Status |
| ------------------------------ | ----------------------------- | ------ |
| 3.2 - Journal creation/editing | journal-functionality.yaml    | ✅     |
| 3.3 - Auto-save functionality  | journal-auto-save.yaml        | ✅     |
| 3.4 - Placeholder text         | journal-placeholder-text.yaml | ✅     |
| 3.5 - Journal persistence      | journal-functionality.yaml    | ✅     |
| 5.4 - Data persistence         | journal-auto-save.yaml        | ✅     |

**Total Requirements Covered: 5/5 (100%)**

## Future Enhancements

### Planned Test Additions:

- [ ] Journal search functionality testing
- [ ] Journal export/import testing
- [ ] Journal statistics validation
- [ ] Accessibility testing (VoiceOver support)
- [ ] Performance testing (large journal entries)
- [ ] Network offline/online behavior testing

### Android Support:

- [ ] Port tests to Android platform
- [ ] Handle Android-specific UI patterns
- [ ] Coordinate adjustments for Android devices

---

**Last Updated:** 2025-09-19
**Test Framework:** Maestro CLI
**Platform:** iOS (iPhone 16 Pro Simulator)
**App Version:** Engage v1.0.0
