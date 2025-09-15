# Database E2E Tests

This directory contains comprehensive End-to-End tests for database operations in the Engage app.

## Test Files

### 1. `database-operations.yaml`

**Purpose**: Tests basic database operations and data persistence across app restarts.

**Test Coverage**:

- App launch with clean state
- Task completion and persistence
- Journal entry creation and persistence
- Data integrity after app restart
- Cross-tab navigation with data verification

**Key Scenarios**:

- Complete a task and verify it persists after app restart
- Create journal entry and verify persistence
- Navigate between tabs and verify data consistency
- Test error handling with invalid operations

### 2. `database-crud.yaml`

**Purpose**: Tests Create, Read, Update, Delete operations through the UI.

**Test Coverage**:

- CREATE: Task selection, journal entry creation
- READ: Data verification after navigation
- UPDATE: Journal entry modification, task completion toggle
- DELETE: Journal entry clearing

**Key Scenarios**:

- Create and modify journal entries
- Toggle task completion status
- Verify data persistence across navigation
- Test with long text and special characters
- Verify DELETE operations work correctly

### 3. `database-integrity.yaml`

**Purpose**: Tests data consistency, constraints, and error handling.

**Test Coverage**:

- Default task seeding verification
- Data consistency across multiple operations
- Statistics and calendar heatmap consistency
- Edge cases with special characters and Unicode
- Stress testing with rapid operations
- Multiple app restart stability

**Key Scenarios**:

- Verify default tasks are properly seeded
- Test rapid task completion toggles
- Test special characters and Unicode in journal entries
- Multiple app restarts to test database stability
- Concurrent operation simulation

## Running the Tests

### Run All Database Tests

```bash
npm run test:e2e:database
```

### Run Individual Test Files

```bash
# Basic operations test
maestro test maestro/ios/database-operations.yaml

# CRUD operations test
maestro test maestro/ios/database-crud.yaml

# Data integrity test
maestro test maestro/ios/database-integrity.yaml
```

### Run All E2E Tests (including database tests)

```bash
npm run test:e2e:ios
```

## Test Requirements

### Prerequisites

- iOS Simulator running with the Engage app installed
- Maestro CLI installed and configured
- App should be in a clean state before running tests

### Environment Setup

```bash
# Set Java environment for Maestro
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$PATH"
```

## Test Scenarios Covered

### Data Persistence

- ✅ Task completions persist across app restarts
- ✅ Journal entries persist across app restarts
- ✅ Statistics reflect completed tasks correctly
- ✅ Calendar heatmap shows activity data

### CRUD Operations

- ✅ Create: Task selection, journal entries
- ✅ Read: Data verification after navigation
- ✅ Update: Journal modification, task toggle
- ✅ Delete: Journal entry clearing

### Data Integrity

- ✅ Default task seeding works correctly
- ✅ Multiple operations maintain consistency
- ✅ Special characters and Unicode handling
- ✅ Rapid operations don't corrupt data
- ✅ Multiple app restarts maintain stability

### Error Handling

- ✅ Invalid operations are handled gracefully
- ✅ Long text entries are processed correctly
- ✅ Empty entries are handled properly
- ✅ Concurrent operations don't cause issues

## Known Limitations

### Maestro Constraints

- Tests use coordinate-based navigation due to Expo Router limitations
- Some UI elements may not be accessible via testID
- Tests are optimized for iPhone 16 Pro Simulator

### Test Data

- Tests create and clean up their own data
- Some tests may leave minimal test data for verification
- Clean state is restored at the beginning of each test

## Troubleshooting

### Common Issues

1. **App not launching**: Ensure the app is properly installed on the simulator
2. **Element not found**: UI elements may have changed; update selectors
3. **Timing issues**: Increase delay values if operations are too fast
4. **Coordinate issues**: Adjust coordinates for different screen sizes

### Debug Mode

Add `--debug` flag to Maestro commands for detailed execution logs:

```bash
maestro test --debug maestro/ios/database-operations.yaml
```

## Future Improvements

### Planned Enhancements

- Add Android-specific database tests
- Implement more granular error scenario testing
- Add performance benchmarking for database operations
- Include backup/restore functionality testing

### Test Coverage Goals

- Achieve 100% coverage of database service methods
- Test all repository pattern implementations
- Verify all data transformation utilities
- Test migration system functionality
