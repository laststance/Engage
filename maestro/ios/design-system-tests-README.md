# Design System and UX Tests

This directory contains comprehensive E2E tests for validating the Apple HIG-compliant design system and user experience of the Engage app.

## Test Files

### 1. `design-system-validation.yaml`

**Purpose**: Validates Apple HIG compliance and design system consistency
**Command**: `npm run test:design-system`

**Tests**:

- Apple HIG typography scale
- Touch target sizes (minimum 44pt)
- Calendar interaction states
- Heatmap color system
- System color usage
- Consistent spacing (8pt grid)
- iOS-style shadows
- Accessibility compliance

### 2. `onboarding-flow-test.yaml`

**Purpose**: Tests first-run experience and user guidance
**Command**: `npm run test:onboarding`

**Tests**:

- Welcome screen and app explanation
- Task recommendation system
- Onboarding navigation
- Tooltip system
- Low-effort mode functionality
- Post-onboarding app functionality

### 3. `visual-feedback-test.yaml`

**Purpose**: Validates interaction states and visual feedback
**Command**: `npm run test:visual-feedback`

**Tests**:

- Enhanced pressable interactions
- Loading states and transitions
- Button press feedback
- Touch target responsiveness
- Animation timing
- State changes
- Rapid interaction handling

### 4. `figma-design-comparison.yaml`

**Purpose**: Takes comprehensive screenshots for Figma design comparison
**Command**: `npm run test:figma-comparison`

**Screenshots Captured**:

- Calendar view (`カレンダーview.png`)
- Today view (`Today-View.png`)
- Statistics view (`実績View.png`)
- Main view with day sheet (`メインView.png`)
- Task selection modal (`メインViewタスク選択.png`)
- Task selection after selection (`メインViewタスク選択後.png`)
- Preset editor interface
- Various interaction states

### 5. `design-system-test-suite.yaml`

**Purpose**: Comprehensive design system validation suite
**Command**: `npm run test:design-suite`

**Comprehensive Tests**:

- Typography validation
- Color system validation
- Spacing system validation (8pt grid)
- Touch target validation (44pt minimum)
- Shadow system validation
- Interaction states validation
- Category color system
- Heatmap color system
- Animation and transition validation
- Accessibility validation
- Visual hierarchy validation
- Consistency validation
- Final quality assurance

## Running Tests

### Individual Tests

```bash
# Test design system compliance
npm run test:design-system

# Test onboarding flow
npm run test:onboarding

# Test visual feedback
npm run test:visual-feedback

# Generate Figma comparison screenshots
npm run test:figma-comparison

# Run comprehensive design suite
npm run test:design-suite
```

### All Design System Tests

```bash
# Run all design system related tests
npm run test:design-system && npm run test:visual-feedback && npm run test:design-suite
```

### Full E2E Test Suite

```bash
# Run all E2E tests including design system tests
npm run test:e2e:ios
```

## Prerequisites

1. **iOS Simulator**: Tests are optimized for iPhone 16 Pro (iOS 18.6+)
2. **App Running**: Start the app with `npm run ios` before running tests
3. **Maestro**: Ensure Maestro is installed and configured
4. **Java Runtime**: Required for Maestro execution

## Test Workflow

1. **Start Development Environment**:

   ```bash
   # Start iOS app
   npm run ios

   # Wait for app initialization logs:
   # "App initialization completed successfully"
   # "Database initialized successfully"
   # "Preset initialization complete"
   ```

2. **Run Design System Tests**:

   ```bash
   # Quick validation
   npm run test:design-system

   # Comprehensive validation
   npm run test:design-suite
   ```

3. **Visual Validation**:
   ```bash
   # Generate screenshots for manual review
   npm run test:figma-comparison
   ```

## Screenshot Analysis

### Figma Design Comparison Process

1. **Run Figma Comparison Test**:

   ```bash
   npm run test:figma-comparison
   ```

2. **Locate Screenshots**:
   Screenshots are saved in: `/Users/$(whoami)/.maestro/tests/[latest-test-run]/`

3. **Compare with Figma Designs**:

   - `figma-comparison-calendar-view.png` ↔ `figma-design/カレンダーview.png`
   - `figma-comparison-today-view.png` ↔ `figma-design/Today-View.png`
   - `figma-comparison-stats-view.png` ↔ `figma-design/実績View.png`
   - `figma-comparison-main-view.png` ↔ `figma-design/メインView.png`
   - `figma-comparison-task-selection.png` ↔ `figma-design/メインViewタスク選択.png`
   - `figma-comparison-task-selection-after.png` ↔ `figma-design/メインViewタスク選択後.png`

4. **Validation Checklist**:
   - [ ] Layout and spacing match exactly
   - [ ] Typography (font sizes, weights, colors) matches
   - [ ] Color palette matches design specifications
   - [ ] Interactive elements match design states
   - [ ] Icons and visual elements are positioned correctly
   - [ ] Component hierarchy matches design
   - [ ] Responsive behavior maintains design integrity

## Apple HIG Compliance Checklist

### Typography ✅

- [ ] Uses iOS typography scale (Large Title, Title 1-3, Headline, Body, etc.)
- [ ] Proper font weights and letter spacing
- [ ] Consistent text hierarchy
- [ ] Readable contrast ratios

### Colors ✅

- [ ] Uses iOS system colors
- [ ] Category colors follow design system
- [ ] Proper semantic color usage
- [ ] Consistent heatmap colors

### Spacing ✅

- [ ] Follows 8pt grid system
- [ ] Consistent component padding
- [ ] Proper layout margins
- [ ] Appropriate section spacing

### Touch Targets ✅

- [ ] Minimum 44pt touch targets
- [ ] Comfortable spacing between interactive elements
- [ ] Clear visual feedback on interaction
- [ ] Proper accessibility labels

### Shadows ✅

- [ ] iOS-style subtle shadows
- [ ] Consistent elevation system
- [ ] Proper shadow hierarchy
- [ ] Performance-optimized shadows

### Interactions ✅

- [ ] Smooth animations (60fps target)
- [ ] Proper transition timing
- [ ] Visual feedback on all interactions
- [ ] Consistent interaction patterns

## Troubleshooting

### Common Issues

1. **Test Failures Due to Missing Elements**:

   - Ensure app is fully loaded before running tests
   - Check that all required testIDs are implemented
   - Verify database initialization is complete

2. **Screenshot Comparison Issues**:

   - Ensure consistent simulator settings
   - Use same device type for all screenshots
   - Check for proper app state before screenshots

3. **Timing Issues**:
   - Increase wait times if animations are slow
   - Use `waitForAnimationToEnd` for complex transitions
   - Add `waitToSettleTimeoutMs` for interactive elements

### Debug Commands

```bash
# Check Maestro version
maestro --version

# Validate test file syntax
maestro test --dry-run maestro/ios/design-system-validation.yaml

# Run single test with verbose output
maestro test maestro/ios/design-system-validation.yaml --verbose
```

## Success Metrics

### Target Metrics

- **Design System Compliance**: 100% Apple HIG adherence
- **Visual Accuracy**: Pixel-perfect match with Figma designs
- **Interaction Quality**: Smooth 60fps animations
- **Accessibility**: Full VoiceOver/TalkBack support
- **Test Coverage**: All UI components and interactions tested

### Current Status

- ✅ Apple HIG typography implemented
- ✅ iOS system colors integrated
- ✅ 8pt grid spacing system
- ✅ 44pt minimum touch targets
- ✅ iOS-style shadows
- ✅ Enhanced interaction states
- ✅ Category color system
- ✅ Heatmap visualization
- ✅ Comprehensive test coverage

## Continuous Integration

These tests should be run:

- Before each release
- After design system changes
- When adding new UI components
- During Figma design updates
- As part of visual regression testing

## Documentation Updates

When modifying the design system:

1. Update design tokens in `constants/design-system.ts`
2. Update Tailwind configuration
3. Update component implementations
4. Run full test suite
5. Update screenshots and documentation
6. Validate Figma design compliance
