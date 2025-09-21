# Deployment Guide - Engage App

This guide provides step-by-step instructions for deploying the Engage app to the App Store and Google Play Store using EAS (Expo Application Services).

## Prerequisites

### 1. Development Environment

- Node.js 22.19.0 (as specified in package.json volta config)
- npm or yarn package manager
- Xcode (for iOS builds) - latest version
- Android Studio (for Android builds) - latest version

### 2. EAS CLI Setup

```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Verify login
eas whoami
```

### 3. Apple Developer Account

- Active Apple Developer Program membership ($99/year)
- App Store Connect access
- iOS Distribution Certificate
- App Store Provisioning Profile

### 4. Google Play Developer Account

- Google Play Console access ($25 one-time fee)
- Android Keystore for app signing
- Google Service Account (for automated submissions)

## Quick Start

### Check Prerequisites

```bash
npm run deploy:check
```

### Full Deployment Process

```bash
# 1. Update version (optional)
npm run deploy:version patch  # or minor, major

# 2. Run full deployment (test + build)
npm run deploy:full

# 3. Submit to app stores (after testing builds)
npm run deploy:submit
```

## Detailed Deployment Steps

### Step 1: Pre-Deployment Preparation

#### Update App Configuration

1. Review and update `app.json`:

   - App name and description
   - Bundle identifiers
   - Version numbers
   - Permissions
   - Icons and splash screens

2. Review and update `eas.json`:
   - Build profiles
   - Environment variables
   - Resource classes
   - Distribution settings

#### Version Management

```bash
# Patch version (1.0.0 -> 1.0.1)
npm run deploy:version patch

# Minor version (1.0.0 -> 1.1.0)
npm run deploy:version minor

# Major version (1.0.0 -> 2.0.0)
npm run deploy:version major
```

### Step 2: Testing

#### Run All Tests

```bash
npm run deploy:test
```

This runs:

- Unit tests with Jest
- TypeScript type checking
- ESLint code quality checks

#### Manual Testing

1. Test on physical iOS device
2. Test on physical Android device
3. Test all core functionality
4. Verify performance and memory usage

### Step 3: Building

#### Build for Both Platforms

```bash
npm run deploy:build
```

#### Build Individual Platforms

```bash
# iOS only
npm run deploy:build:ios

# Android only
npm run deploy:build:android
```

#### Monitor Build Progress

- Check build status in EAS dashboard
- Download builds when complete
- Test builds on physical devices

### Step 4: App Store Assets

#### Required Assets

1. **App Icons**

   - iOS: 1024x1024 PNG
   - Android: 512x512 PNG

2. **Screenshots**

   - iPhone: Multiple sizes (6.7", 6.1", 5.5")
   - Android: 1080x1920 minimum

3. **Store Listings**
   - App descriptions
   - Keywords
   - Privacy policy
   - Age ratings

#### Asset Locations

- Metadata: `store-assets/app-store-metadata.md`
- Privacy Policy: `store-assets/privacy-policy.md`
- Screenshots: `store-assets/screenshots/`

### Step 5: App Store Connect Setup (iOS)

#### Create App Record

1. Login to App Store Connect
2. Create new app record
3. Fill in app information:
   - Name: "Engage"
   - Bundle ID: "com.anonymous.engage"
   - SKU: "engage-habit-tracker"
   - Primary Language: Japanese or English

#### Configure App Information

1. **App Information**

   - Category: Productivity
   - Content Rights: No
   - Age Rating: 4+

2. **Pricing and Availability**

   - Price: Free
   - Availability: All territories

3. **App Privacy**
   - Data collection: None
   - Privacy policy URL: [Your URL]

#### Upload Build and Metadata

1. Upload build via EAS submit
2. Add app description and keywords
3. Upload screenshots
4. Set age rating
5. Add review notes

### Step 6: Google Play Console Setup (Android)

#### Create App

1. Login to Google Play Console
2. Create new app
3. Fill in app details:
   - App name: "Engage"
   - Default language: Japanese or English
   - App or game: App
   - Free or paid: Free

#### Configure Store Listing

1. **Main store listing**

   - Short description (80 chars)
   - Full description (4000 chars)
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots

2. **Content rating**

   - Complete questionnaire
   - Target age: Everyone

3. **App content**
   - Privacy policy URL
   - Ads declaration: No ads
   - Target audience: General audience

#### Upload Build

1. Upload AAB file via EAS submit
2. Configure release details
3. Set rollout percentage (start with 5-10%)

### Step 7: Submission

#### Submit to Both Stores

```bash
npm run deploy:submit
```

#### Submit Individual Platforms

```bash
# iOS App Store
npm run deploy:submit:ios

# Google Play Store
npm run deploy:submit:android
```

#### Review Process

- **iOS**: 1-7 days review time
- **Android**: 1-3 days review time

Monitor review status in respective consoles.

## Post-Deployment

### Launch Day Monitoring

1. **Monitor Metrics**

   - Download numbers
   - Crash reports
   - User reviews and ratings
   - Performance metrics

2. **User Support**
   - Respond to reviews
   - Address user feedback
   - Fix critical issues quickly

### Update Strategy

1. **Hotfixes**: Critical bugs, security issues
2. **Minor Updates**: Bug fixes, small features (monthly)
3. **Major Updates**: New features, UI changes (quarterly)

## Troubleshooting

### Common Build Issues

#### iOS Build Failures

```bash
# Clear Xcode cache
rm -rf ~/Library/Developer/Xcode/DerivedData

# Update CocoaPods
cd ios && pod install --repo-update
```

#### Android Build Failures

```bash
# Clean Gradle cache
cd android && ./gradlew clean

# Update Android SDK
# Use Android Studio SDK Manager
```

### Common Submission Issues

#### iOS Rejections

- **Missing Privacy Policy**: Add privacy policy URL
- **Incomplete App Information**: Fill all required fields
- **Performance Issues**: Optimize app performance
- **Design Guidelines**: Follow Apple HIG

#### Android Rejections

- **Policy Violations**: Review Google Play policies
- **Missing Permissions**: Declare all required permissions
- **Target SDK**: Update to latest Android API level
- **Content Rating**: Complete content rating questionnaire

### EAS Issues

#### Authentication Problems

```bash
# Re-login to EAS
eas logout
eas login
```

#### Build Quota Issues

- Check EAS usage in dashboard
- Upgrade plan if needed
- Optimize build frequency

## Environment Variables

### Production Environment

Set these in EAS dashboard or eas.json:

```json
{
  "env": {
    "NODE_ENV": "production",
    "REACT_NATIVE_NO_DEVTOOLS": "1"
  }
}
```

### Secrets Management

For sensitive data (API keys, certificates):

```bash
# Add secret to EAS
eas secret:create --scope project --name API_KEY --value "your-api-key"

# Use in eas.json
{
  "env": {
    "API_KEY": "${API_KEY}"
  }
}
```

## Automation

### CI/CD Pipeline

Consider setting up automated deployment:

1. GitHub Actions or similar CI/CD
2. Automated testing on PR
3. Automated builds on release tags
4. Automated submission to stores

### Example GitHub Action

```yaml
name: Deploy
on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22.19.0'
      - run: npm ci
      - run: npm run deploy:full
```

## Support and Resources

### Documentation

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

### Community

- [Expo Discord](https://chat.expo.dev/)
- [React Native Community](https://reactnative.dev/community/overview)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Emergency Contacts

- Apple Developer Support: developer.apple.com/support
- Google Play Support: support.google.com/googleplay/android-developer
- Expo Support: expo.dev/support

---

**Note**: This deployment guide assumes you have the necessary developer accounts and certificates. The actual deployment process may vary based on your specific setup and requirements.
