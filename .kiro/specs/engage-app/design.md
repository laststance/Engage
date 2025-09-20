# Design Document

## Overview

This document outlines the technical design for the Engage mobile app that enables users to maintain daily routines through a simple flow: Calendar → Task Selection → Achievement → Journal Entry. The app follows a minimal, Apple HIG-compliant design with offline-first architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │    Business     │    │      Data       │
│     Layer       │◄──►│     Logic       │◄──►│     Layer       │
│                 │    │     Layer       │    │                 │
│ - React Native  │    │ - Zustand Store │    │ - SQLite DB     │
│ - Gluestack UI  │    │ - Custom Hooks  │    │ - Local Storage │
│ - NativeWind    │    │ - Utils         │    │ - File System   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Frontend Framework**: Expo + React Native
- **UI Library**: Gluestack UI + NativeWind for styling
- **State Management**: Zustand (lightweight, simple)
- **Local Database**: SQLite (expo-sqlite)
- **Notifications**: expo-notifications
- **Testing**: Maestro for E2E testing
- **CI/CD**: Expo Application Services (EAS)

## Components and Interfaces

### Core Components

#### 1. Calendar Component

```typescript
interface CalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  achievementData: Record<string, number> // date -> completion count
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  achievementData,
}) => {
  // Renders monthly calendar with heatmap visualization
  // Uses green intensity based on completion count (0-4+ tasks)
}
```

#### 2. Day Sheet Component

```typescript
interface DaySheetProps {
  date: string
  tasks: Task[]
  completions: Completion[]
  journalEntry: Entry | null
  onTaskToggle: (taskId: string) => void
  onJournalUpdate: (content: string) => void
}

const DaySheet: React.FC<DaySheetProps> = (props) => {
  // Displays selected tasks, completion checkboxes, and journal input
  // Shows dynamic category counters (事業: 2/3, 生活: 0/1, 勉強: 1/2, etc.)
  // Supports any number of custom categories beyond default presets
}
```

#### 3. Task Picker Modal

```typescript
interface TaskPickerProps {
  isVisible: boolean
  presetTasks: Task[]
  selectedTasks: string[]
  onTaskSelect: (taskIds: string[]) => void
  onClose: () => void
  onEditPresets: () => void
}

const TaskPicker: React.FC<TaskPickerProps> = (props) => {
  // Modal with dynamically categorized preset tasks
  // Supports custom categories beyond default "事業" and "生活" presets
  // Allows multi-selection with visual feedback
  // Includes edit button for preset and category management
}
```

#### 4. Statistics Component

```typescript
interface StatsProps {
  period: 'week' | 'month'
  onPeriodChange: (period: 'week' | 'month') => void
}

const Statistics: React.FC<StatsProps> = ({ period, onPeriodChange }) => {
  // Displays streak counter, completion rates, category breakdown
  // Switches between weekly and monthly views
}
```

#### 5. Preset Task Editor

```typescript
interface PresetEditorProps {
  tasks: Task[]
  onSave: (tasks: Task[]) => void
  onCancel: () => void
}

const PresetEditor: React.FC<PresetEditorProps> = (props) => {
  // Allows CRUD operations on preset tasks and categories
  // Supports custom categories beyond default "事業"/"生活" presets
  // Enables creation of new categories (study, health, finance, etc.)
  // Validates task titles, durations, and category assignments
}
```

### Navigation Structure

```
TabNavigator
├── Calendar Tab (Default)
│   └── CalendarScreen
│       └── DaySheet (Modal)
│           └── TaskPicker (Modal)
│               └── PresetEditor (Modal)
├── Today Tab
│   └── TodayScreen (Dedicated view for current date matching Today-View.png design)
│       └── TaskPicker (Modal)
│           └── PresetEditor (Modal)
└── Stats Tab
    └── StatisticsScreen
```

### Today Tab Implementation Details

The Today tab provides a dedicated interface for the current date that matches the `figma-design/Today-View.png` design exactly. Key implementation requirements:

- **Content Synchronization**: The Today tab displays identical content to what would be shown when selecting today's date in the Calendar tab
- **State Sharing**: Both Calendar tab (when today's date is selected) and Today tab share the same underlying data and state
- **Design Fidelity**: The Today tab implementation must match the Today-View.png Figma design pixel-perfectly
- **Feature Parity**: All functionality available in the Calendar tab's day view (task selection, completion, journal entry) must be available in the Today tab

## Data Models

### Category System Design

The app uses a flexible category system where "事業" (business) and "生活" (life) are merely default preset categories provided for initial user convenience. Users can create unlimited custom categories such as "勉強" (study), "健康" (health), "財務" (finance), etc. The system is designed to support any number of categories with dynamic color assignment and statistics calculation.

**Key Design Principles:**

- Categories are stored in a separate `categories` table with `id` and `name` fields
- Tasks reference categories via `category_id` foreign key, not hardcoded enums
- UI components dynamically render all available categories
- Statistics and progress tracking work with any number of categories
- Default presets ("事業", "生活") are seeded on first launch but can be modified or deleted

### Database Schema

```sql
-- Categories table (supports custom categories beyond default presets)
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Tasks table (preset and custom tasks)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category_id TEXT NOT NULL,
  default_minutes INTEGER,
  archived INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- Daily journal entries
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD format
  note TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Task completions
CREATE TABLE completions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  task_id TEXT NOT NULL,
  minutes INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
  UNIQUE(date, task_id)
);

-- App settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### TypeScript Interfaces

```typescript
export interface Category {
  id: string
  name: string
}

export interface Task {
  id: string
  title: string
  categoryId: string // References category.id - supports any custom category
  defaultMinutes?: number
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface Entry {
  id: string
  date: string // YYYY-MM-DD
  note: string
  createdAt: number
  updatedAt: number
}

export interface Completion {
  id: string
  date: string // YYYY-MM-DD
  taskId: string
  minutes?: number
  createdAt: number
}

export interface DayData {
  date: string
  tasks: Task[]
  completions: Completion[]
  entry: Entry | null
}

export interface StatsData {
  streakDays: number
  completionRate: number
  activeDays: number
  totalTasks: number
  dailyAverage: number
  journalDays: number
  categoryBreakdown: Record<string, { completed: number; total: number }> // Flexible for any categories
}
```

## State Management

### Zustand Store Structure

```typescript
interface AppState {
  // Data
  categories: Category[] // Supports custom categories beyond default presets
  tasks: Task[]
  entries: Record<string, Entry> // date -> entry
  completions: Record<string, Completion[]> // date -> completions

  // UI State
  selectedDate: string
  isTaskPickerVisible: boolean
  isPresetEditorVisible: boolean
  isCategoryEditorVisible: boolean
  currentTab: 'calendar' | 'today' | 'stats'

  // Actions
  loadData: () => Promise<void>
  selectDate: (date: string) => void
  toggleTaskCompletion: (date: string, taskId: string) => Promise<void>
  updateJournalEntry: (date: string, content: string) => Promise<void>
  addTasksToDate: (date: string, taskIds: string[]) => Promise<void>
  updatePresetTasks: (tasks: Task[]) => Promise<void>
  createCategory: (category: Omit<Category, 'id'>) => Promise<void>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  // Computed
  getStatsForPeriod: (period: 'week' | 'month') => StatsData
  getAchievementData: () => Record<string, number>
  getDayData: (date: string) => DayData
}
```

## Error Handling

### Database Error Handling

```typescript
class DatabaseService {
  async executeQuery<T>(query: string, params?: any[]): Promise<T> {
    try {
      const result = await this.db.execAsync(query, params)
      return result
    } catch (error) {
      console.error('Database query failed:', error)
      throw new DatabaseError('Failed to execute query', error)
    }
  }
}

class DatabaseError extends Error {
  constructor(message: string, public originalError: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}
```

### UI Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
```

## Testing Strategy

### Unit Testing

- **Database Layer**: Test CRUD operations, data integrity, migrations
- **Business Logic**: Test state management, calculations, data transformations
- **Components**: Test rendering, user interactions, prop handling

### Integration Testing

- **Data Flow**: Test complete user journeys from UI to database
- **State Synchronization**: Test Zustand store updates and persistence
- **Navigation**: Test screen transitions and modal interactions

### E2E Testing with Maestro

```yaml
# maestro/complete_daily_flow.yaml
appId: com.anonymous.engage
---
- launchApp
- tapOn: '14' # Calendar date
- tapOn: 'タスクを選択'
- tapOn: '運動 (20分以上)'
- tapOn: 'ネットワーキング'
- tapOn: '確定 (2個)'
- tapOn:
    id: 'task-checkbox-0'
- tapOn:
    id: 'journal-input'
- inputText: '今日は運動ができて良かった'
- tapOn: '保存'
- assertVisible: '1日連続'
```

### Performance Testing

- **Database Performance**: Test query execution times with large datasets
- **Memory Usage**: Monitor memory consumption during extended usage
- **Battery Impact**: Test notification scheduling and background processing

## Figma Design Implementation Process

### Design Reference Files

The app implementation must match the Figma design files located in the `figma-design/` folder:

- `Today-View.png` - Today tab dedicated interface for current date
- `カレンダーview.png` - Calendar screen with monthly view and heatmap
- `メインView.png` - Main day view with task list and journal
- `メインViewタスク選択.png` - Task selection modal interface
- `メインViewタスク選択後.png` - Day view after task selection
- `実績View.png` - Statistics and achievements screen

### Implementation Verification Process

For each UI component and screen, follow this 4-step verification process:

1. **Faithful Recreation**: Implement the UI component to match the corresponding Figma design file exactly
2. **Screenshot Comparison**: Take screenshots of the implemented component and compare with the reference Figma design
3. **Difference Identification**: Identify and document any visual differences between implementation and design
4. **Iterative Refinement**: Modify the implementation to address differences and repeat steps 2-4 until perfect match is achieved

### Design Validation Checklist

For each screen implementation, verify:

- [ ] Layout and spacing match Figma design exactly
- [ ] Typography (font sizes, weights, colors) matches design
- [ ] Color palette matches specified colors in design
- [ ] Interactive elements (buttons, inputs) match design states
- [ ] Icons and visual elements are positioned correctly
- [ ] Component hierarchy and z-index match design
- [ ] Responsive behavior maintains design integrity

## Design System

### Color Palette

```typescript
const colors = {
  primary: {
    // Default category colors (can be customized per category)
    business: '#007AFF', // iOS Blue - default for "事業" preset
    life: '#34C759', // iOS Green - default for "生活" preset
    // Additional colors for custom categories
    study: '#FF9500', // Orange
    health: '#FF2D92', // Pink
    finance: '#5856D6', // Purple
    // System generates colors for new categories
  },
  neutral: {
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
  },
  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
  },
}
```

### Typography

```typescript
const typography = {
  largeTitle: { fontSize: 34, fontWeight: '700' },
  title1: { fontSize: 28, fontWeight: '700' },
  title2: { fontSize: 22, fontWeight: '700' },
  title3: { fontSize: 20, fontWeight: '600' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 17, fontWeight: '400' },
  callout: { fontSize: 16, fontWeight: '400' },
  subhead: { fontSize: 15, fontWeight: '400' },
  footnote: { fontSize: 13, fontWeight: '400' },
  caption1: { fontSize: 12, fontWeight: '400' },
  caption2: { fontSize: 11, fontWeight: '400' },
}
```

### Spacing System

```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}
```

## Notification System

### Daily Reminder Implementation

```typescript
class NotificationService {
  async scheduleDailyReminder(hour: number = 9, minute: number = 0) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '今日の習慣をチェックしましょう',
        body: 'カレンダーを開いて、今日のタスクを選んでみませんか？',
        data: { type: 'daily_reminder' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    })
  }

  async handleNotificationResponse(response: NotificationResponse) {
    if (response.notification.request.content.data?.type === 'daily_reminder') {
      // Navigate to today's view
      navigationRef.navigate('Today')
    }
  }
}
```

## Offline-First Architecture

### Data Synchronization Strategy

```typescript
class SyncService {
  async syncWhenOnline() {
    if (!this.isOnline()) return

    try {
      // Future: Upload local changes to cloud
      // Future: Download remote changes
      // Future: Resolve conflicts
    } catch (error) {
      console.warn('Sync failed, will retry later:', error)
    }
  }

  private isOnline(): boolean {
    // Check network connectivity
    return true // Placeholder for actual implementation
  }
}
```

### Local Storage Management

```typescript
class StorageService {
  async backup(): Promise<string> {
    const data = await this.exportAllData()
    return JSON.stringify(data)
  }

  async restore(backupData: string): Promise<void> {
    const data = JSON.parse(backupData)
    await this.importAllData(data)
  }

  private async exportAllData() {
    return {
      tasks: await this.db.getAllAsync('SELECT * FROM tasks'),
      entries: await this.db.getAllAsync('SELECT * FROM entries'),
      completions: await this.db.getAllAsync('SELECT * FROM completions'),
      settings: await this.db.getAllAsync('SELECT * FROM settings'),
    }
  }
}
```

## Security Considerations

### Data Protection

- All data stored locally in SQLite database
- No sensitive personal information collected
- User data remains on device until explicit cloud sync (future feature)
- Notification permissions requested with clear explanation

### Privacy Compliance

- No analytics or tracking without explicit consent
- Journal entries encrypted at rest (future enhancement)
- Clear data deletion options in settings
- Transparent privacy policy regarding data usage
