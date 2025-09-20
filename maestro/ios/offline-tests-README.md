# Offline Functionality Tests

This directory contains Maestro E2E tests for verifying offline functionality and data persistence in the Engage app.

## Test Files

### 1. `offline-functionality.yaml`

**Purpose**: Tests core offline functionality and basic data persistence
**Coverage**:

- App launches and works without internet connection
- Task creation and completion work offline
- Journal entries can be created offline
- Navigation between tabs works offline
- Data persists after app restart
- Calendar and statistics remain functional offline

**Key Test Scenarios**:

- Create tasks while offline
- Complete tasks while offline
- Add journal entries while offline
- Navigate between all tabs
- Restart app and verify data persistence

### 2. `data-persistence-test.yaml`

**Purpose**: Comprehensive testing of data persistence and integrity
**Coverage**:

- Multiple task creation and completion
- Complex journal entries
- Data across different dates
- Statistics data aggregation
- Data integrity after app restarts
- Continued functionality after data restoration

**Key Test Scenarios**:

- Create comprehensive test data (multiple tasks, categories, dates)
- Force app restart to test persistence
- Verify all data types persist correctly
- Test continued data operations after restart

### 3. `backup-functionality.yaml`

**Purpose**: Tests backup and restore mechanisms (simulated through persistence)
**Coverage**:

- Data export/import simulation through app restarts
- Data integrity verification
- Backup data consistency
- System stability after backup operations

**Key Test Scenarios**:

- Create test data for backup
- Simulate backup/restore through app restart
- Verify data integrity after "restore"
- Test continued functionality after backup operations

### 4. `offline-error-handling.yaml`

**Purpose**: Tests graceful error handling in offline scenarios
**Coverage**:

- App startup without network
- Offline operation error handling
- Navigation stability offline
- Data operation reliability
- No error states for offline-capable features

**Key Test Scenarios**:

- Verify app starts without network errors
- Test all core operations work offline
- Stress test navigation and operations
- Verify no inappropriate error messages
- Test stability under offline conditions

## Running the Tests

### Prerequisites

1. iOS Simulator must be running
2. Engage app must be built and installed
3. Maestro must be installed and configured

### Individual Test Execution

```bash
# Test basic offline functionality
maestro test maestro/ios/offline-functionality.yaml

# Test comprehensive data persistence
maestro test maestro/ios/data-persistence-test.yaml

# Test backup functionality
maestro test maestro/ios/backup-functionality.yaml

# Test offline error handling
maestro test maestro/ios/offline-error-handling.yaml
```

### Run All Offline Tests

```bash
# Run all offline-related tests
maestro test maestro/ios/offline-functionality.yaml maestro/ios/data-persistence-test.yaml maestro/ios/backup-functionality.yaml maestro/ios/offline-error-handling.yaml
```

## Test Requirements Verification

These tests verify the following requirements:

### Requirement 5.1: Offline Core Features

- ✅ App functions normally without internet connection
- ✅ All core features available offline
- ✅ No network dependency for basic operations

### Requirement 5.2: Local Data Storage

- ✅ Data stored in local SQLite database
- ✅ Immediate persistence of changes
- ✅ Data integrity maintained

### Requirement 5.3: Data Restoration

- ✅ App restores all previously saved data
- ✅ Data consistency across app sessions
- ✅ No data loss during offline usage

### Requirement 5.4: Immediate Persistence

- ✅ Task completions immediately persisted
- ✅ Journal entries immediately persisted
- ✅ Changes survive app restarts

## Expected Test Results

### Success Criteria

- All tests should pass without network connectivity
- Data should persist across app restarts
- No error messages for offline-capable features
- All navigation and core features work offline
- Statistics and calendar remain functional

### Common Issues

1. **Network dependency**: Tests fail if app requires network for core features
2. **Data persistence**: Tests fail if data doesn't survive app restarts
3. **Error handling**: Tests fail if inappropriate error messages appear
4. **Performance**: Tests may timeout if offline operations are too slow

## Troubleshooting

### Test Failures

1. **App doesn't start**: Ensure app is properly built and installed
2. **Data not persisting**: Check SQLite database initialization
3. **Navigation issues**: Verify tab navigation works in manual testing
4. **Timeout errors**: Increase wait times for slower operations

### Debug Information

- Check app logs for database errors
- Verify SQLite file creation and permissions
- Monitor memory usage during offline operations
- Check for proper error handling in offline scenarios

## Integration with CI/CD

These tests can be integrated into CI/CD pipelines to ensure offline functionality remains intact across releases:

```bash
# Example CI script
npm run ios &
sleep 30  # Wait for app to start
maestro test maestro/ios/offline-functionality.yaml
maestro test maestro/ios/data-persistence-test.yaml
```

## Notes

- Tests simulate offline conditions by testing core functionality without network operations
- Backup functionality is tested through data persistence mechanisms
- Tests verify the underlying SQLite database operations that support offline functionality
- All tests should pass even when device has no internet connection
