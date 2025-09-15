---
inclusion: always
---

# Product Requirements & Business Logic

## App Overview

**Engage** is a habit tracker focused on building consistent daily habits through task tracking, streak visualization, and reflective journaling. Privacy-first with local-only data storage.

## Core Features & Navigation

### Tab Structure

- **Today Tab**: Primary interface, current day's tasks with one-tap completion
- **Calendar Tab**: Month/week views with completion indicators and date navigation
- **Stats Tab**: Analytics, completion rates, streak analysis, progress trends
- **Modal**: Task creation/editing, journal entries, settings

### Habit Tracking System

- **Categories**: "business" and "life" with distinct visual styling and colors
- **Task States**: Not started → In progress → Completed/Skipped
- **Time Tracking**: Optional duration logging per task
- **Streaks**: Consecutive day completion tracking (per-task, not global)

## Business Logic Rules

### Task Management Flow

1. Tasks created as reusable templates
2. Daily instances generated automatically
3. Categories determine visual styling and grouping
4. Completion immediately updates streaks and statistics
5. Time tracking is optional and task-specific

### Streak Calculation (Critical Logic)

- **Streak Continues**: Task completed on consecutive days
- **Streak Breaks**: Missed days with no interaction (resets to 0)
- **Streak Neutral**: Intentionally skipped days (maintains current streak)
- **Per-Task Independence**: Each task has its own streak counter
- **No Global Streaks**: Only individual task streaks are tracked

### Data Architecture

- **SQLite**: Habit templates, daily completions, streaks, time logs
- **AsyncStorage**: User preferences, app settings, UI state
- **Local Only**: No cloud sync, complete privacy focus
- **Journal Integration**: Daily reflection entries linked to habit completion data

## UX Design Principles

### Mobile-First Interaction Design

- **Touch Targets**: Minimum 44pt tap areas for accessibility
- **Thumb Navigation**: Primary actions within thumb-reach zones
- **One-Tap Completion**: Primary action for task completion (no confirmation)
- **Swipe Navigation**: Between dates, calendar views, and tabs
- **Visual Feedback**: Immediate state changes with smooth animations

### Platform-Specific Design

- **iOS Primary**: Leverage iOS design patterns, SF Symbols, haptic feedback
- **Android Compatible**: Consistent experience with Material Design elements
- **Accessibility**: VoiceOver/TalkBack support, high contrast modes

### Visual Hierarchy & Motivation

- **Completion States**: Clear visual differentiation (colors, icons, progress)
- **Category Styling**: Distinct business vs life visual treatment
- **Progress Indicators**: Visual completion percentages and streak counters
- **Celebration**: Streak milestones, completion animations, positive reinforcement

### Performance Standards

- **60fps Animations**: React Native Reanimated for all transitions
- **Instant Launch**: App opens immediately to Today tab
- **Responsive UI**: Immediate feedback on all user interactions
- **Efficient Rendering**: List virtualization, optimized calendar views
