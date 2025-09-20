# Implementation Plan

- [x] 1. Project Setup and Core Infrastructure

  - [x] 1.1 Research and install latest development tools

    - Search for latest Expo CLI installation methods and best practices
    - Research current versions of Gluestack UI, NativeWind, Zustand, and expo-sqlite
    - Verify compatibility between all dependencies
    - _Requirements: 8.1, 8.4_

  - [x] 1.2 Initialize Expo project with TypeScript and dependencies

    - Create new Expo project with TypeScript template
    - Install and configure Gluestack UI, NativeWind, Zustand, and expo-sqlite
    - Set up project structure with proper folder organization
    - Create basic navigation structure with tab navigator
    - _Requirements: 8.1, 8.4_

  - [x] 1.3 Create E2E test for basic app navigation
    - Write Maestro test to verify app launches successfully
    - Test tab navigation between Calendar, Today, and Stats screens
    - Verify basic UI elements are rendered correctly
    - _Requirements: 8.1, 8.4_

- [x] 2. Database Layer Implementation

  - [x] 2.1 Create SQLite database schema and migration system

    - Implement database initialization with tasks, entries, completions, and settings tables
    - Create migration system for future schema updates
    - Add proper indexes for query optimization
    - _Requirements: 5.2, 5.3_

  - [x] 2.2 Implement database service layer with CRUD operations

    - Create DatabaseService class with methods for all table operations
    - Implement error handling and transaction management
    - Add data validation and constraint checking
    - Write unit tests for database operations
    - _Requirements: 5.2, 5.4_

  - [x] 2.3 Create data access layer and repository pattern

    - Implement TaskRepository, EntryRepository, and CompletionRepository
    - Add methods for complex queries (statistics, date ranges)
    - Create data transformation utilities
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [x] 2.4 Create E2E test for database operations
    - Write Maestro test to verify data persistence across app restarts
    - Test database CRUD operations through UI interactions
    - Verify data integrity and error handling
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 3. State Management and Business Logic

  - [x] 3.1 Implement Zustand store with core state structure

    - Create main app store with tasks, entries, completions state
    - Implement UI state management (selected date, modal visibility)
    - Add computed selectors for derived data
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 3.2 Create business logic actions and data flow

    - Implement task completion toggle functionality
    - Create journal entry update logic
    - Add task selection and day data management
    - Write unit tests for business logic
    - _Requirements: 2.5, 3.3, 3.5_

  - [x] 3.3 Implement statistics calculation engine

    - Create functions to calculate streak days, completion rates
    - Implement weekly and monthly statistics aggregation
    - Add category breakdown calculations (supports any categories including default presets and custom categories)
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 3.4 Create E2E test for state management
    - Write Maestro test to verify state persistence and updates
    - Test business logic through user interactions
    - Verify statistics calculations are correct
    - _Requirements: 2.5, 3.3, 3.5, 4.2, 4.3, 4.4, 4.5_

- [x] 4. Core UI Components Development

  - [x] 4.1 Create Calendar component with heatmap visualization

    - Implement monthly calendar grid layout
    - Add heatmap coloring based on completion data
    - Create month navigation functionality
    - Handle date selection and tap events
    - **Figma Design Implementation Process:**
      - Reference `figma-design/カレンダーview.png` for exact visual specifications
      - Take screenshot of implemented calendar component
      - Compare screenshot with `figma-design/カレンダーview.png`
      - Identify and fix any visual differences (spacing, colors, typography, layout)
      - Repeat comparison and refinement until implementation matches Figma design exactly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.2 Build Day Sheet component for task management

    - Create task list display with category grouping
    - Implement completion checkboxes with visual feedback
    - Add progress counters for each category (事業: 2/3, 生活: 0/1, 勉強: 1/2, etc. - supports any custom categories)
    - Create journal input section with placeholder text
    - **Figma Design Implementation Process:**
      - Reference `figma-design/メインView.png` and `figma-design/メインViewタスク選択後.png` for exact visual specifications
      - Take screenshot of implemented Day Sheet component
      - Compare screenshot with corresponding Figma design files
      - Identify and fix any visual differences (task layout, checkbox styling, progress counters, journal section)
      - Repeat comparison and refinement until implementation matches Figma design exactly
    - _Requirements: 2.1, 2.4, 2.5, 3.1, 3.2, 3.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.3 Implement Task Picker modal with preset selection

    - Create categorized task list (supports all categories including default "生活" and "事業" presets plus custom categories)
    - Add multi-selection functionality with visual indicators
    - Implement task confirmation and cancellation
    - Add edit button for preset management
    - **Figma Design Implementation Process:**
      - Reference `figma-design/メインViewタスク選択.png` for exact visual specifications
      - Take screenshot of implemented Task Picker modal
      - Compare screenshot with `figma-design/メインViewタスク選択.png`
      - Identify and fix any visual differences (modal layout, task categories, selection indicators, buttons)
      - Repeat comparison and refinement until implementation matches Figma design exactly
    - _Requirements: 2.2, 2.3, 2.6, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.4 Create Statistics screen with analytics display

    - Implement today's achievements summary
    - Add streak counter with prominent display
    - Create weekly/monthly toggle with data updates
    - Display completion rates, active days, and averages
    - **Figma Design Implementation Process:**
      - Reference `figma-design/実績View.png` for exact visual specifications
      - Take screenshot of implemented Statistics screen
      - Compare screenshot with `figma-design/実績View.png`
      - Identify and fix any visual differences (layout, charts, counters, toggle buttons)
      - Repeat comparison and refinement until implementation matches Figma design exactly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.5 Create E2E test for core UI components
    - Write Maestro test for calendar navigation and date selection
    - Test Day Sheet task management and journal functionality
    - Verify Task Picker modal and Statistics screen interactions
    - **Figma Design Validation:**
      - Take screenshots during E2E test execution
      - Compare test screenshots with all Figma design files
      - Verify visual consistency across all screens during user interactions
      - Document any remaining visual discrepancies for final polish
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Preset Task Management System

  - [x] 5.1 Implement default preset tasks initialization

    - Create initial task seeding with default preset categories ("事業" and "生活") and their associated tasks
    - Add default tasks with proper titles and time durations
    - Implement first-launch task suggestion (3 recommended tasks)
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 5.2 Build Preset Task Editor interface

    - Create CRUD interface for managing preset tasks
    - Implement task title and duration editing
    - Add category assignment functionality (supports assigning tasks to any existing category or creating new custom categories)
    - Create task deletion with confirmation
    - _Requirements: 2.6, 2.7, 7.5, 7.6_

  - [x] 5.3 Integrate preset management with task selection

    - Connect preset editor to task picker modal
    - Ensure real-time updates when presets are modified
    - Implement proper state synchronization
    - _Requirements: 2.6, 2.7, 7.5, 7.6_

  - [x] 5.4 Create E2E test for preset task management
    - Write Maestro test for preset task CRUD operations
    - Test integration between preset editor and task picker
    - Verify default task initialization and suggestions
    - _Requirements: 2.6, 2.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 6. Journal and Entry Management

  - [x] 6.1 Implement journal entry creation and editing

    - Create text input component with proper styling
    - Add auto-save functionality for journal entries
    - Implement placeholder text and empty state handling
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Create journal persistence and retrieval system

    - Implement journal entry saving to database
    - Add journal loading for specific dates
    - Create journal entry validation and error handling
    - _Requirements: 3.3, 3.5, 5.4_

  - [x] 6.3 Create E2E test for journal functionality
    - Write Maestro test for journal entry creation and editing
    - Test journal persistence across app sessions
    - Verify auto-save and placeholder text functionality
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 5.4_

- [x] 7. Notification System Implementation

  - [x] 7.1 Research notification implementation best practices

    - Search for latest expo-notifications setup and configuration methods
    - Research iOS and Android notification permission handling
    - Verify notification scheduling and deep linking approaches
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.2 Set up notification permissions and scheduling

    - Request notification permissions on app launch
    - Implement daily reminder notification scheduling
    - Create notification content and timing configuration
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.3 Handle notification responses and app navigation

    - Implement notification tap handling
    - Add deep linking to today's view from notifications
    - Create notification settings management
    - _Requirements: 6.3, 6.4_

  - [x] 7.4 Create E2E test for notification system
    - Write Maestro test for notification permission flow
    - Test notification scheduling and delivery (if possible)
    - Verify deep linking from notifications to app
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Design System and UI Polish

  - [ ] 8.1 Implement Apple HIG-compliant design system

    - Create color palette with default themes for preset categories (blue for "事業", green for "生活") and additional colors for custom categories
    - Implement typography system following iOS standards
    - Add consistent spacing and layout patterns
    - **Figma Design Implementation Process:**
      - Extract exact color values, typography specifications, and spacing from all Figma design files
      - Implement design tokens that match Figma specifications exactly
      - Take screenshots of design system components
      - Compare with Figma design files to ensure consistency
      - Refine design tokens until they produce pixel-perfect matches with Figma designs
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 8.2 Add visual feedback and interaction states

    - Implement proper touch targets and feedback
    - Add loading states and transitions
    - Create empty state illustrations and copy
    - Polish calendar heatmap visualization
    - **Figma Design Implementation Process:**
      - Reference all Figma design files for interaction state specifications
      - Implement hover, pressed, and disabled states as shown in designs
      - Take screenshots of all interaction states
      - Compare with Figma design specifications for interactive elements
      - Refine interaction feedback until it matches Figma design exactly
    - _Requirements: 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 8.3 Create onboarding and first-run experience

    - Implement welcome screen with app explanation
    - Add automatic selection of 3 recommended tasks
    - Create helpful tooltips and guidance
    - Implement low-effort mode with encouraging placeholders
    - _Requirements: 7.3_

  - [ ] 8.4 Create E2E test for design system and UX
    - Write Maestro test for onboarding flow
    - Test visual feedback and interaction states
    - Verify Apple HIG compliance through UI interactions
    - **Final Figma Design Validation:**
      - Take comprehensive screenshots of entire app during E2E testing
      - Create side-by-side comparison with all Figma design files
      - Document final visual accuracy report
      - Ensure 100% visual match with Figma designs before deployment
    - _Requirements: 7.3, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9. Data Persistence and Offline Support

  - [ ] 9.1 Implement comprehensive offline functionality

    - Ensure all core features work without internet connection
    - Add proper error handling for offline scenarios
    - Implement data consistency checks
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 9.2 Create data backup and export functionality

    - Implement local data backup system
    - Add data export capabilities for user peace of mind
    - Create data integrity validation
    - _Requirements: 5.3, 5.4_

  - [ ] 9.3 Create E2E test for offline functionality
    - Write Maestro test for offline app usage
    - Test data persistence and backup functionality
    - Verify app behavior without internet connection
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 10. Complete User Flow Integration Testing

  - [ ] 10.1 Create comprehensive E2E test for main user flow

    - Write Maestro test for complete calendar → task selection → completion → journal flow
    - Test the core user journey: "カレンダーを開く → タスクを選ぶ → 少なくとも 1 つ達成 → 日記をひと言書く"
    - Verify streak counter updates and statistics accuracy
    - _Requirements: All core requirements (1.1-4.5)_

  - [ ] 10.2 Write comprehensive unit tests

    - Test database operations and data integrity
    - Test business logic and state management
    - Test component rendering and user interactions
    - _Requirements: All requirements validation_

  - [ ] 10.3 Performance optimization and testing
    - Optimize database queries and indexing
    - Test app performance with large datasets
    - Implement memory usage monitoring
    - _Requirements: 5.2, 5.3_

- [ ] 11. Figma Design Validation and Visual Quality Assurance

  - [ ] 11.1 Comprehensive Figma design comparison audit

    - Take high-resolution screenshots of all implemented screens
    - Create detailed side-by-side comparison with each Figma design file
    - Document pixel-level differences and create improvement plan
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 11.2 Visual refinement and pixel-perfect implementation

    - Address all identified visual differences from Figma comparison
    - Refine spacing, typography, colors, and layout to match Figma exactly
    - Implement any missing visual details or micro-interactions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 11.3 Final visual validation and approval

    - Take final screenshots of all screens after refinements
    - Perform final comparison with Figma design files
    - Obtain visual approval confirmation that implementation matches Figma designs 100%
    - Create visual quality assurance report
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 12. Final Integration and Deployment Preparation

  - [ ] 12.1 Research deployment best practices

    - Search for latest EAS build and deployment configuration methods
    - Research App Store and Google Play submission requirements
    - Verify TestFlight and internal testing setup procedures
    - _Requirements: All requirements_

  - [ ] 12.2 Integration testing and bug fixes

    - Test complete app functionality end-to-end
    - Fix any integration issues between components
    - Validate all requirements are met
    - _Requirements: All requirements_

  - [ ] 12.3 Prepare for deployment with EAS

    - Configure EAS build and deployment settings
    - Create app store assets and metadata
    - Set up TestFlight/internal testing distribution
    - _Requirements: All requirements_

  - [ ] 12.4 Final E2E regression testing
    - Run complete test suite to ensure no regressions
    - Test app on multiple devices and screen sizes
    - Verify all features work correctly before deployment
    - **Final Figma Design Validation:**
      - Perform final visual validation on target devices
      - Ensure Figma design fidelity is maintained across different screen sizes
      - Document final visual quality assurance approval
    - _Requirements: All requirements including 9.1, 9.2, 9.3, 9.4, 9.5_
