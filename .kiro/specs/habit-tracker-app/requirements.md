# Requirements Document

## Introduction

「生活（守る）× 事業（育てる）」を毎日まわせる、ミニマルで強力な習慣トラッカーアプリです。仕事がない日でも必ず「カレンダーを開く → タスクを選ぶ → 少なくとも 1 つ達成 → 日記をひと言書く」という流れを実行することで、「衰え感」を止めることを目的としています。

## Requirements

### Requirement 1

**User Story:** As a user, I want to view a monthly calendar with visual indicators of my daily achievements, so that I can quickly see my progress patterns and stay motivated.

#### Acceptance Criteria

1. WHEN the user opens the app THEN the system SHALL display a monthly calendar view as the default screen
2. WHEN tasks are completed on a specific date THEN the system SHALL display visual indicators (heatmap colors) on that calendar date
3. WHEN the user navigates between months THEN the system SHALL update the calendar display with the correct month and achievement indicators
4. WHEN the user taps on a calendar date THEN the system SHALL open the Day Sheet for that specific date

### Requirement 2

**User Story:** As a user, I want to select and manage daily tasks from customizable preset categories, so that I can easily choose relevant activities for both life maintenance and business growth.

#### Acceptance Criteria

1. WHEN the user taps on a calendar date THEN the system SHALL display a Day Sheet with task selection options
2. WHEN the user taps "タスクを選択" THEN the system SHALL display a modal with preset tasks categorized as "生活" and "事業"
3. WHEN the user selects tasks from the preset list THEN the system SHALL add those tasks to the current day's task list
4. WHEN tasks are added THEN the system SHALL display them in the Day Sheet with checkboxes for completion tracking
5. WHEN the user checks a task as complete THEN the system SHALL mark it as completed and update the progress counters
6. WHEN the user wants to edit preset tasks THEN the system SHALL provide an interface to add, edit, or delete preset tasks
7. WHEN the user modifies preset tasks THEN the system SHALL save the changes and make them available for future task selection

### Requirement 3

**User Story:** As a user, I want to write daily journal entries, so that I can reflect on my day and maintain a record of my thoughts and experiences.

#### Acceptance Criteria

1. WHEN the user is on the Day Sheet THEN the system SHALL display a journal section labeled "今日の振り返り"
2. WHEN the user taps on the journal section THEN the system SHALL allow text input for daily notes
3. WHEN the user writes in the journal THEN the system SHALL save the entry automatically
4. WHEN no journal entry exists THEN the system SHALL display placeholder text "日記を書いてみましょう..."
5. WHEN a journal entry is saved THEN the system SHALL persist it to local storage

### Requirement 4

**User Story:** As a user, I want to view statistics and analytics of my habit completion, so that I can track my progress and identify patterns in my behavior.

#### Acceptance Criteria

1. WHEN the user navigates to the statistics screen THEN the system SHALL display today's achievements summary
2. WHEN viewing statistics THEN the system SHALL show consecutive days streak counter
3. WHEN viewing weekly/monthly stats THEN the system SHALL display completion rates, active days, total tasks, and daily averages
4. WHEN viewing category breakdown THEN the system SHALL show separate counters for "事業" and "生活" categories
5. WHEN the user switches between "今週" and "今月" views THEN the system SHALL update all statistics accordingly

### Requirement 5

**User Story:** As a user, I want the app to work offline and store data locally, so that I can use it without internet connectivity and have reliable access to my data.

#### Acceptance Criteria

1. WHEN the user opens the app without internet connection THEN the system SHALL function normally with all core features available
2. WHEN data is created or modified THEN the system SHALL store it in local SQLite database
3. WHEN the app is closed and reopened THEN the system SHALL restore all previously saved data from local storage
4. WHEN tasks are completed or journal entries are made THEN the system SHALL immediately persist changes to local database

### Requirement 6

**User Story:** As a user, I want to receive daily reminders to use the app, so that I can maintain consistency in my habit tracking routine.

#### Acceptance Criteria

1. WHEN the app is first installed THEN the system SHALL request notification permissions from the user
2. WHEN notification permissions are granted THEN the system SHALL schedule daily reminder notifications
3. WHEN the daily reminder time arrives THEN the system SHALL send a notification encouraging the user to check their tasks
4. WHEN the user taps the notification THEN the system SHALL open the app to the current day's view

### Requirement 7

**User Story:** As a user, I want customizable preset task categories and examples, so that I can quickly get started and adapt the app to my specific needs.

#### Acceptance Criteria

1. WHEN the app is first launched THEN the system SHALL include default preset tasks for "事業" category including "ネットワーキング", "スキル学習 (30 分)", "アイデア記録"
2. WHEN the app is first launched THEN the system SHALL include default preset tasks for "生活" category including "運動 (20 分以上)", "読書・勉強", "家族との時間", "健康的な食事", "十分な睡眠 (7 時間)", "整理整頓", "財務管理", "趣味・リラックス"
3. WHEN the user first opens task selection THEN the system SHALL automatically suggest 3 recommended tasks to reduce initial friction
4. WHEN tasks have default time durations THEN the system SHALL display them in the task titles (e.g., "運動 (20 分以上)")
5. WHEN the user wants to customize preset tasks THEN the system SHALL allow adding new tasks, editing existing task titles and durations, and deleting unwanted tasks
6. WHEN the user creates custom tasks THEN the system SHALL persist them and make them available in future task selections

### Requirement 8

**User Story:** As a user, I want a clean, minimal interface following Apple HIG design principles, so that the app feels native and is easy to use on iOS devices.

#### Acceptance Criteria

1. WHEN the app is displayed THEN the system SHALL use Apple HIG-compliant spacing, typography, and visual hierarchy
2. WHEN displaying colors THEN the system SHALL use a minimal color palette with green for "生活" category and blue for "事業" category
3. WHEN showing interactive elements THEN the system SHALL provide clear visual feedback and appropriate touch targets
4. WHEN the app is used THEN the system SHALL maintain consistent navigation patterns and familiar iOS interaction paradigms
