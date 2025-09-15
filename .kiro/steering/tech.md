---
inclusion: always
---

# Technology Stack & Development Rules

## Tech Stack (Exact Versions)

**Core**: React Native 0.81.4 + React 19.1.0 + Expo ~54.0.7 + TypeScript ~5.9.2  
**UI**: NativeWind 4.2.0 + Gluestack UI + TailwindCSS 3.4.17 + Reanimated 4.1.0  
**State**: Zustand 5.0.8 + Expo SQLite 16.0.8 + AsyncStorage 2.2.0

## Critical Rules

### ⚠️ Process Management

**NEVER** run `expo start`, `expo run:ios`, `expo run:android` directly - they block indefinitely.

```bash
# Always use tmux for dev servers
npx kill-port 8081 19000 19001 19002
tmux new -s expo-dev -d
tmux send-keys -t expo-dev 'npm run expo start --web' Enter
```

### Code Standards

- **TypeScript**: Strict mode, explicit types, no `any`
- **Components**: Functional only, hooks over classes
- **Styling**: NativeWind classes over StyleSheet.create()
- **Routing**: Expo Router file-based (`app/` directory)
- **State**: Zustand for global, React hooks for local

### Platform Priority

1. **iOS First** - Primary target, leverage iOS patterns
2. **Android Compatible** - Ensure cross-platform functionality
3. **Web Limited** - Basic support, mobile-first design

### Performance Requirements

- React Native Reanimated for all animations (60fps target)
- SQLite indexing for queries, list virtualization for large data
- Expo Image for optimized image loading
- Immediate UI feedback, smooth transitions

### Testing Strategy

- **E2E**: Maestro tests in `maestro/` directory
- **Command**: `npm run test:e2e`
- **Focus**: Core user flows (task completion, navigation, stats)
