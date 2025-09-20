# 🔔 Notification System Tests

This directory contains E2E tests for the Engage app's notification system functionality.

## 📋 Test Files

### Core Notification Tests

- **`notification-permissions.yaml`** - Tests the notification permission request flow
- **`notification-scheduling.yaml`** - Tests notification scheduling and time selection
- **`notification-deep-linking.yaml`** - Tests deep linking behavior from notifications
- **`notification-system-complete.yaml`** - Comprehensive test covering all notification features

## 🚀 Running Notification Tests

### Individual Tests

```bash
# Test notification permissions flow
maestro test maestro/ios/notification-permissions.yaml

# Test notification scheduling
maestro test maestro/ios/notification-scheduling.yaml

# Test deep linking simulation
maestro test maestro/ios/notification-deep-linking.yaml

# Run comprehensive notification test
maestro test maestro/ios/notification-system-complete.yaml
```

### All Notification Tests

```bash
# Run all notification-related tests
maestro test maestro/ios/notification-*.yaml
```

## 🧪 Test Coverage

### ✅ Covered Functionality

1. **Settings Access**

   - Navigation to notification settings via Stats screen
   - Settings button visibility and functionality
   - Modal opening and closing

2. **Permission Flow**

   - UI elements for permission requests
   - Toggle switch functionality
   - Permission status display

3. **Time Selection**

   - Multiple time slot options (8:00, 9:00, 12:00, 18:00, 20:00)
   - Time selection feedback
   - Current time display

4. **Settings Management**

   - Settings refresh functionality
   - Status information display
   - Help text visibility

5. **Deep Link Simulation**

   - Navigation to Today screen (notification target)
   - App state preservation after navigation
   - Cross-screen functionality

6. **UI Components**
   - All notification settings UI elements
   - Proper text display in Japanese
   - Button interactions and feedback

### ⚠️ Testing Limitations

1. **System Permission Dialog**

   - Cannot automate iOS system permission dialogs
   - Tests verify UI flow up to permission request
   - Actual permission granting must be tested manually

2. **Real Notification Delivery**

   - Cannot test actual notification delivery in simulator
   - Cannot automate notification tapping
   - Deep linking is simulated through manual navigation

3. **Background Behavior**
   - Cannot test notification behavior when app is backgrounded
   - Cannot test notification scheduling accuracy
   - Cannot test notification content in notification center

## 🔧 Manual Testing Required

The following aspects require manual testing on a physical device:

1. **Permission Granting**

   - Tap "Allow" on iOS permission dialog
   - Verify permission status updates correctly

2. **Notification Delivery**

   - Wait for scheduled notification time
   - Verify notification appears in notification center
   - Check notification content and appearance

3. **Notification Interaction**

   - Tap on delivered notification
   - Verify app opens to Today screen
   - Test deep linking with different notification types

4. **Background Scheduling**
   - Schedule notification and close app
   - Verify notification still delivers when app is closed
   - Test notification behavior after device restart

## 📊 Test Results Interpretation

### Success Criteria

- All UI elements are visible and interactive
- Navigation flows work correctly
- Settings persist across app sessions
- No crashes or errors during notification setup

### Common Issues

- Settings button not visible: Check Stats screen layout
- Modal not opening: Verify router navigation setup
- Time selection not working: Check button event handlers
- Deep linking simulation fails: Verify tab navigation coordinates

## 🛠️ Troubleshooting

### Test Failures

1. **Element not found**: Update testID or text selectors
2. **Navigation issues**: Verify tab coordinates for device screen size
3. **Timing issues**: Increase delay values for slower devices
4. **Modal issues**: Check modal presentation and dismissal logic

### Device-Specific Issues

- **iPhone sizes**: Adjust tap coordinates for different screen sizes
- **iOS versions**: Some notification features may vary by iOS version
- **Simulator limitations**: Use physical device for complete testing

## 📝 Notes

- Tests are optimized for iPhone 16 Pro Simulator (iOS 18.6)
- Coordinates may need adjustment for different device sizes
- Japanese text is used to match app localization
- Tests focus on UI interaction rather than actual notification delivery
