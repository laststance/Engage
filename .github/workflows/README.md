# GitHub Actions Workflows Documentation

Comprehensive CI/CD workflows for the Engage mobile application.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
  - [CI (Continuous Integration)](#ci-continuous-integration)
  - [E2E Tests](#e2e-tests)
  - [Security Scanning](#security-scanning)
  - [Release & Deployment](#release--deployment)
  - [Code Quality](#code-quality)
- [Dependency Management](#dependency-management)
- [Required Secrets](#required-secrets)
- [Setup Instructions](#setup-instructions)
- [Troubleshooting](#troubleshooting)

## Overview

This project uses GitHub Actions for automated testing, security scanning, quality checks, and deployment. All workflows are designed to provide fast feedback, maintain code quality, and automate the release process.

### Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PR/Push           Manual              Schedule                │
│     │                 │                    │                    │
│     ├─→ CI ──────────┐                    │                    │
│     ├─→ Security ────┤                    ├─→ Security         │
│     ├─→ Quality ─────┤                    ├─→ E2E              │
│     │                 │                    │                    │
│     │                 ├─→ Release          │                    │
│     │                 ├─→ E2E              │                    │
│     │                 │                    │                    │
│     └─────────────────┴────────────────────┴──────────────────→ │
│                                                                 │
│  Dependabot (Weekly)                                            │
│     └─→ Auto-update dependencies                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Workflows

### CI (Continuous Integration)

**File**: `ci.yml`

**Triggers**:
- Push to `main` branch
- Pull requests to `main`

**Jobs**:

1. **Lint** (10 min timeout)
   - Runs ESLint on the codebase
   - Enforces code style and best practices

2. **Type Check** (10 min timeout)
   - Runs TypeScript compiler in check mode
   - Ensures type safety across the project

3. **Unit Tests** (15 min timeout)
   - Runs Jest unit tests with coverage
   - Uploads coverage to Codecov
   - Artifacts: Coverage reports (30 days retention)

4. **Build Validation** (20 min timeout)
   - Validates Expo configuration
   - Runs prebuild for iOS and Android
   - Ensures the app builds successfully

**Concurrency**: Cancels previous runs on new pushes to the same PR

**Success Criteria**: All jobs must pass for CI to be considered successful

### E2E Tests

**File**: `e2e.yml`

**Triggers**:
- Manual dispatch
- Push to `main` (when app code or tests change)
- Scheduled: Daily at 2 AM UTC

**Jobs**:

1. **E2E iOS** (60 min timeout, macOS runner)
   - Sets up iOS simulator (iPhone 15 Pro)
   - Builds production E2E app
   - Runs Maestro tests from `maestro/ios/`
   - Uploads test results and simulator logs
   - **Note**: This uses macOS runners which are more expensive

2. **E2E Android** (Currently disabled)
   - Placeholder for future Android E2E tests
   - Enable by setting `if: false` to `if: true`

**Concurrency**: Only one E2E run at a time

**Artifacts**:
- Maestro test results (30 days)
- Simulator logs (7 days)

**Cost Optimization**: Runs on schedule or manual trigger to reduce macOS runner usage

### Security Scanning

**File**: `security.yml`

**Triggers**:
- Push to `main`
- Pull requests to `main`
- Scheduled: Weekly on Mondays at 3 AM UTC
- Manual dispatch

**Jobs**:

1. **CodeQL Analysis** (20 min timeout)
   - Static code analysis for JavaScript/TypeScript
   - Security and quality queries
   - Reports findings to GitHub Security tab

2. **Dependency Review** (PRs only)
   - Reviews new/changed dependencies
   - Fails on moderate+ severity vulnerabilities
   - Blocks GPL-3.0 and AGPL-3.0 licenses

3. **npm Audit** (10 min timeout)
   - Scans for vulnerable dependencies
   - Fails on high/critical vulnerabilities
   - Warnings for moderate vulnerabilities

4. **Secret Scanning** (10 min timeout)
   - Uses TruffleHog to detect secrets
   - Scans commit history
   - Only verified secrets reported

**Permissions**: Requires `security-events: write` for CodeQL

**Configuration**: See `.github/codeql-config.yml` for CodeQL settings

### Release & Deployment

**File**: `release.yml`

**Trigger**: Manual dispatch only

**Inputs**:
- `version`: Version bump type (patch/minor/major)
- `platform`: Target platform (both/ios/android)
- `skip_submit`: Build only without app store submission

**Jobs**:

1. **Validate** (20 min timeout)
   - Runs full CI suite
   - Checks deployment requirements
   - Ensures app is ready for release

2. **Version Bump**
   - Updates version in package.json and app.json
   - Commits and pushes changes
   - Outputs new version number

3. **Build iOS** (45 min timeout, conditional)
   - Uses EAS Build for production iOS build
   - Skipped if platform is android

4. **Build Android** (45 min timeout, conditional)
   - Uses EAS Build for production Android build
   - Skipped if platform is ios

5. **Submit iOS** (20 min timeout, conditional)
   - Submits to App Store via EAS Submit
   - Skipped if `skip_submit` is true

6. **Submit Android** (20 min timeout, conditional)
   - Submits to Google Play via EAS Submit
   - Skipped if `skip_submit` is true

7. **Create Release**
   - Generates changelog from commits
   - Creates GitHub release with tag
   - Includes build status in release notes

8. **Notify**
   - Posts summary to workflow summary
   - Shows status of all release steps

**Required Secrets**:
- `EXPO_TOKEN`
- `EXPO_APPLE_APP_SPECIFIC_PASSWORD`

**Usage Example**:
```bash
# Go to Actions tab → Release & Deployment → Run workflow
# Select version type: patch (1.0.0 → 1.0.1)
# Select platform: both
# Uncheck skip_submit to submit to stores
```

### Code Quality

**File**: `quality.yml`

**Triggers**:
- Pull requests to `main`

**Jobs**:

1. **Coverage Enforcement** (15 min timeout)
   - Runs tests with coverage
   - Checks 70% minimum threshold
   - Uploads coverage reports

2. **Bundle Size Analysis** (15 min timeout)
   - Analyzes node_modules size
   - Counts dependencies
   - Tracks bundle metrics

3. **Code Metrics** (10 min timeout)
   - Counts TypeScript lines
   - Counts test lines
   - Calculates test/code ratio

4. **PR Comment**
   - Creates/updates quality report comment on PR
   - Shows coverage, bundle size, code metrics
   - Provides at-a-glance quality overview

**PR Comment Example**:

```markdown
## 📊 Code Quality Report

### Test Coverage
| Metric | Coverage |
|--------|----------|
| Statements | 85.3% |
| Branches | 78.6% |
| Functions | 82.1% |
| Lines | 85.7% |

### Code Metrics
- **TypeScript Lines**: 12,534
- **Test Lines**: 3,421
- **Test/Code Ratio**: 27.3%

### Bundle Analysis
- **node_modules Size**: 456M
- **Dependencies**: 45
- **Dev Dependencies**: 23
```

## Dependency Management

**File**: `dependabot.yml`

**Configuration**:

- **Schedule**: Weekly on Mondays at 9 AM JST
- **Ecosystems**: npm, GitHub Actions
- **Grouping**:
  - Production dependencies grouped together
  - Dev dependencies grouped separately
  - Minor and patch updates grouped
- **Limits**: Up to 10 open PRs
- **Auto-labels**: `dependencies`, `automated`
- **Reviewers**: Auto-assigned to maintainers

**Dependency Groups**:

1. **Production Dependencies**
   - All runtime dependencies except types and testing tools
   - Groups minor and patch updates
   - Major updates remain separate

2. **Dev Dependencies**
   - Testing libraries, type definitions, build tools
   - Groups minor and patch updates
   - Major updates remain separate

**Auto-merge Strategy** (requires setup):
- Minor and patch updates can be auto-merged if CI passes
- Major updates require manual review

## Required Secrets

Configure these secrets in GitHub repository settings:

### Essential (Required for CI/CD)

- **`EXPO_TOKEN`**
  - Get from: https://expo.dev/settings/access-tokens
  - Used for: EAS Build, EAS Submit, Expo CLI operations
  - Required by: ci.yml, e2e.yml, release.yml

### Optional (For Enhanced Features)

- **`CODECOV_TOKEN`**
  - Get from: https://codecov.io
  - Used for: Coverage reporting
  - Required by: ci.yml (coverage upload)
  - Workflow continues if missing (fail_ci_if_error: false)

- **`EXPO_APPLE_APP_SPECIFIC_PASSWORD`**
  - Get from: https://appleid.apple.com/account/manage
  - Used for: App Store submission
  - Required by: release.yml (iOS submission)

### Security Scanning (Automatic)

- **`GITHUB_TOKEN`**
  - Automatically provided by GitHub
  - Used for: All workflows (checkout, comments, releases)

## Setup Instructions

### 1. Initial Setup

1. **Enable GitHub Actions**
   ```bash
   # In your repository settings:
   # Settings → Actions → General → Allow all actions
   ```

2. **Configure Secrets**
   ```bash
   # Go to: Settings → Secrets and variables → Actions → New repository secret

   # Add required secrets:
   - EXPO_TOKEN
   - EXPO_APPLE_APP_SPECIFIC_PASSWORD (for releases)
   - CODECOV_TOKEN (optional)
   ```

3. **Enable Dependabot**
   ```bash
   # Go to: Settings → Security & analysis
   # Enable: Dependabot alerts, Dependabot security updates
   ```

### 2. Expo and EAS Configuration

1. **Login to Expo**
   ```bash
   npx expo login
   ```

2. **Create Expo Access Token**
   ```bash
   # Visit: https://expo.dev/settings/access-tokens
   # Create a new token with "Read and write" permissions
   # Add to GitHub secrets as EXPO_TOKEN
   ```

3. **Configure EAS Build**
   ```bash
   # Ensure eas.json is properly configured
   # Update Apple ID and credentials in eas.json
   ```

### 3. Codecov Setup (Optional)

1. **Sign up for Codecov**
   ```bash
   # Visit: https://codecov.io
   # Connect your GitHub repository
   ```

2. **Get Upload Token**
   ```bash
   # In Codecov: Settings → Your repository → Upload token
   # Add to GitHub secrets as CODECOV_TOKEN
   ```

### 4. Testing Workflows

1. **Test CI Workflow**
   ```bash
   # Create a PR and ensure all checks pass
   git checkout -b test-ci
   git commit --allow-empty -m "test: trigger CI"
   git push origin test-ci
   # Create PR on GitHub
   ```

2. **Test Release Workflow**
   ```bash
   # Go to: Actions → Release & Deployment → Run workflow
   # Select: version=patch, platform=both, skip_submit=true
   # Monitor the workflow run
   ```

## Troubleshooting

### Common Issues

#### 1. CI Workflow Fails on Build Check

**Problem**: Expo prebuild fails with configuration errors

**Solution**:
```bash
# Validate Expo configuration locally
npx expo config --type public

# Check for errors and fix in app.json
```

#### 2. E2E Tests Fail on iOS Simulator

**Problem**: Maestro can't find the app or simulator

**Solution**:
```bash
# Check simulator availability
xcrun simctl list devices available

# Manually test E2E build
npm run build:e2e
sleep 180
npm run test:e2e:production
```

#### 3. Security Scan Fails with Vulnerabilities

**Problem**: npm audit finds high/critical vulnerabilities

**Solution**:
```bash
# Check audit locally
npm audit

# Fix automatically if possible
npm audit fix

# For unfixable issues, assess risk and create exceptions
```

#### 4. Release Workflow Fails on Version Bump

**Problem**: Git push fails due to permissions

**Solution**:
- Ensure `GITHUB_TOKEN` has write permissions
- Check branch protection rules don't block bot commits
- Verify the workflow has correct permissions in YAML

#### 5. Dependabot PRs Fail CI

**Problem**: Dependency updates break tests

**Solution**:
```bash
# Review the Dependabot PR locally
gh pr checkout <pr-number>
npm install
npm test

# Fix breaking changes
# Push fixes to the Dependabot branch
```

### Getting Help

#### Workflow Logs

1. Go to **Actions** tab in GitHub
2. Select the failed workflow run
3. Click on the failed job
4. Expand the failing step to see detailed logs

#### Debugging Workflows

Enable debug logging:

```bash
# In repository settings:
# Settings → Secrets and variables → Actions
# Add new secret:
# ACTIONS_STEP_DEBUG = true
# ACTIONS_RUNNER_DEBUG = true
```

#### Contact Points

- **GitHub Actions Issues**: Repository Issues tab
- **Expo/EAS Issues**: https://github.com/expo/expo/issues
- **Maestro Issues**: https://github.com/mobile-dev-inc/maestro/issues

## Workflow Status Badges

Add these badges to your README.md:

```markdown
[![CI](https://github.com/USERNAME/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/ci.yml)
[![Security](https://github.com/USERNAME/REPO/actions/workflows/security.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/security.yml)
[![E2E Tests](https://github.com/USERNAME/REPO/actions/workflows/e2e.yml/badge.svg)](https://github.com/USERNAME/REPO/actions/workflows/e2e.yml)
```

## Best Practices

### For Developers

1. **Before Pushing**
   ```bash
   npm run lint          # Check code style
   npm run typecheck     # Check types
   npm test              # Run tests
   ```

2. **Creating PRs**
   - Wait for CI to pass before requesting review
   - Address quality report findings
   - Keep PRs focused and small

3. **Reviewing Dependabot PRs**
   - Check the changelog for breaking changes
   - Verify CI passes
   - Test locally if changes affect critical dependencies

### For Maintainers

1. **Release Process**
   - Ensure all PRs merged to main have passed CI
   - Use semantic versioning (patch/minor/major)
   - Review changelog before releasing
   - Test builds before submitting to stores

2. **Security**
   - Review security scan results weekly
   - Update dependencies promptly
   - Don't ignore security warnings

3. **Performance**
   - Monitor workflow execution times
   - Optimize slow jobs
   - Use caching effectively

## Cost Optimization

### GitHub Actions Minutes

- **Linux runners**: 1x multiplier (cheapest)
- **macOS runners**: 10x multiplier (expensive)
- **Strategies**:
  - Use ubuntu-latest for most jobs
  - Use macOS only for iOS-specific tasks (E2E)
  - Run E2E tests on schedule or manual trigger
  - Set reasonable timeouts
  - Enable concurrency cancellation

### Storage

- **Artifacts retention**:
  - Coverage reports: 30 days
  - E2E results: 30 days
  - Logs: 7 days
- Clean up old artifacts regularly

## Future Enhancements

### Planned Improvements

- [ ] Android E2E testing with Maestro
- [ ] Performance benchmarking workflow
- [ ] Automated changelog generation
- [ ] Preview deployments for PRs (using EAS Updates)
- [ ] Automated screenshot testing
- [ ] Bundle size tracking over time
- [ ] Accessibility testing automation

### Contributing

To propose workflow improvements:

1. Create an issue describing the enhancement
2. Discuss the approach with maintainers
3. Submit a PR with workflow changes
4. Test thoroughly before merging

---

**Last Updated**: 2025-10-02
**Maintained by**: Engage Development Team
