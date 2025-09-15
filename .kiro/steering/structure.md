---
inclusion: always
---

# Project Architecture & File Organization

## Directory Structure

```
app/                    # Expo Router screens (file-based routing)
├── (tabs)/            # Tab navigation: index, today, stats
├── _layout.tsx        # Root layout with providers
└── modal.tsx          # Modal screens

src/                   # Core application logic
├── components/        # Business logic components
├── services/          # Database & API services
├── stores/            # Zustand state stores
├── types/             # TypeScript definitions
└── utils/             # Helper functions

components/ui/         # Reusable UI components (Gluestack)
hooks/                 # Custom React hooks
constants/             # App-wide constants & themes
assets/                # Images, fonts, static files
maestro/               # E2E test files
```

## Architecture Patterns

### Component Hierarchy

- **Screens** (`app/`): Route components, minimal logic, delegate to business components
- **Business** (`src/components/`): App-specific logic, data fetching, state management
- **UI** (`components/ui/`): Reusable, styled components with consistent theming

### State Management Flow

```
UI Component → Zustand Store → Service Layer → SQLite/AsyncStorage
```

- **Global**: Zustand stores (`src/stores/`) for habits, user data
- **Local**: React hooks for component state, forms, UI state
- **Persistence**: SQLite for structured data, AsyncStorage for preferences

### File Naming & Organization

```typescript
// Components: PascalCase.tsx
TaskCard.tsx, HabitList.tsx, StatsSummary.tsx

// Hooks: camelCase.ts with 'use' prefix
useHabitTracker.ts, useTaskCompletion.ts

// Services: camelCase.ts
databaseService.ts, habitService.ts

// Types: PascalCase interfaces
Task, HabitEntry, CompletionStatus

// Constants: UPPER_SNAKE_CASE
HABIT_CATEGORIES, DEFAULT_COLORS
```

### Import Order & Aliases

```typescript
// 1. External libraries
import React from 'react'
import { View } from 'react-native'

// 2. Internal modules (use @/ alias)
import { useAppStore } from '@/src/stores/app-store'
import { TaskCard } from '@/src/components/TaskCard'

// 3. Relative imports
import './styles.css'
```

### Platform-Specific Strategy

- **Default**: Cross-platform implementation
- **iOS**: `.ios.tsx` for iOS-specific features (SF Symbols, haptics)
- **Web**: `.web.tsx` for web adaptations (hover states, keyboard nav)
- **Priority**: iOS first, ensure Android compatibility

### Styling Approach

- **Primary**: NativeWind classes (`className="bg-blue-500 p-4"`)
- **Theming**: Custom design tokens in `tailwind.config.js`
- **Avoid**: StyleSheet.create() unless platform-specific styling needed
- **Global**: Shared styles in `global.css` for consistent theming
