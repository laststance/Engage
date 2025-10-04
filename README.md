# Engage - Habit Tracker App 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   pnpm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
pnpm reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Available Scripts

### 🚀 Development Scripts

```bash
# Start development server
pnpm start                    # Start Expo dev server
pnpm ios                  # Start iOS development build
pnpm android             # Start Android development build
pnpm web                 # Start web development build

# Code quality
pnpm lint                # Run ESLint
pnpm typecheck          # Run TypeScript type checking
pnpm test                   # Run Jest unit tests
ppnpm test:watch         # Run Jest in watch mode
ppnpm test:coverage      # Run Jest with coverage report
```

### 🧪 E2E Testing Scripts

This project includes E2E tests using [Maestro](https://maestro.mobile.dev/) with **DevTools-free Production Builds** for stable testing.

#### Prerequisites

1. Install Java 17 or higher
2. Install Maestro: `curl -Ls "https://get.maestro.mobile.dev" | bash`

#### Production Build E2E Testing (Recommended)

**🎯 DevTools-Free Environment** - Uses Release configuration without React Native DevTools interference.

```bash
# Step 1: Start Production Build (DevTools disabled)
pnpm build:e2e           # Start E2E production build
pnpm build:e2e:restart   # Clean restart production build

# Step 2: Run E2E Tests (after build completes ~3-5 minutes)
ppnpm test:e2e:production              # Run all E2E tests
ppnpm test:e2e:production:single       # Run single test file

# Clean up processes if needed
pnpm build:e2e:clean     # Stop production build processes
ppnpm test:e2e:clean      # Kill DevTools processes
```

#### Development Build E2E Testing

```bash
# Quick testing with development build (may show DevTools)
ppnpm test:e2e:ios        # Run all E2E tests
```

#### Example Workflow

```bash
# 1. Start DevTools-free production build
pnpm build:e2e

# 2. Wait for build completion (watch terminal output)
#    Look for: "Build Succeeded" and "Opening on iPhone 16 Pro"

# 3. Run specific test
ppnpm test:e2e:production:single maestro/ios/app-launch.yaml

# 4. Run all tests
ppnpm test:e2e:production
```

**✨ Benefits of Production Build Testing:**
- ✅ No React Native DevTools interference
- ✅ Stable and consistent test execution
- ✅ Production-like performance testing
- ✅ Clean Mac desktop during testing

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
