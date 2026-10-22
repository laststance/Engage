# App Store Metadata - Engage

## App Information

### Basic Details

- **App Name**: Engage
- **Subtitle**: Daily Habit Tracker
- **Bundle ID**: com.laststance.engage
- **iOS Version**: 1.0.14 (build 19)
- **Category**: Productivity
- **Content Rating**: 4+ (Ages 4 and up)

### Description

The published App Store listing is localized in Japanese. Use these release
notes when submitting the iOS 1.0.14 (19) build:

#### What's New (Japanese, 1.0.14)

iPhone Duoに対応しました。画面を開閉したり回転したりしても、タスクや日記を快適に操作できます。日記やタスクの編集時にキーボード周辺の余白が崩れる問題と、保存した日記の件数が統計にすぐ反映されない問題を修正しました。

#### Short Description (30 characters)

Minimal daily habit tracker

#### App Store Description

Build consistent daily habits with Engage - a minimal, powerful habit tracker designed for simplicity and effectiveness.

**Key Features:**
• **Visual Calendar**: See your progress at a glance with an intuitive heatmap calendar
• **Task Management**: Choose from preset tasks or create custom ones organized by categories
• **Daily Reflection**: Write brief journal entries to reflect on your day
• **Progress Tracking**: Monitor streaks, completion rates, and detailed statistics
• **Offline First**: All data stored locally on your device for complete privacy
• **Clean Design**: Apple HIG-compliant interface that feels native and intuitive

**Perfect for:**

- Building morning and evening routines
- Tracking business and personal development goals
- Maintaining work-life balance
- Creating sustainable habit loops

**Privacy Focused:**
Your data stays on your device. No cloud sync, no tracking, no ads. Just you and your habits.

Start your journey to better habits today with Engage's simple yet powerful approach to habit tracking.

### Keywords

habit, tracker, productivity, journal, routine, calendar, tasks, goals, daily, minimal, privacy, offline, streaks, progress

### App Store Connect Categories

- **Primary Category**: Productivity
- **Secondary Category**: Health & Fitness

### Age Rating

- **Rating**: 4+
- **Content Descriptors**: None
- **Gambling**: No
- **Contests**: No

## Screenshots Requirements

### iPhone Screenshots

- Preserve the currently approved conventional iPhone screenshot sets.
- **iPhone Duo outer display**: 1398 x 2034 pixels (portrait), or 2034 x 1398 (landscape).
- **iPhone Duo inner display**: 2007 x 2853 pixels (portrait), or 2853 x 2007 (landscape).
- Use JPEG or PNG without alpha/transparency. Capture the release candidate with synthetic demonstration data.
- Duo screenshots are optional on October 22, 2026 and enable the optimization badge. Apple states that they become required in April 2027 for apps built with iOS 27.1 SDK or later.

See [Apple's current screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications). Validate App Store Connect's accepted display-set identifiers at submission time.

Six Japanese release-candidate images are prepared from the 1.0.14 (19) non-E2E Release simulator app: Calendar, Today, and Stats on each Duo display. They use synthetic demonstration data, native portrait dimensions, and RGB JPEG without alpha; the release evidence manifest records SHA-256 hashes. They have not been uploaded.

Approved delivery plan: release 1.0.14 with the existing conventional iPhone screenshots. Once Apple accepts both Duo display sets, include all six images in the next app version and its App Review submission (1.0.15 if no intervening release occurs). An approved 1.0.14 listing cannot receive replacement screenshots directly. Revalidate the captures against that version's UI, retain the existing conventional images, and verify upload processing, review approval, and public availability separately. See [Apple's asset management guidance](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-your-app-store-assets).

Upload acceptance remains unconfirmed on October 22, 2026. Apple's September [DTS response](https://developer.apple.com/forums/thread/845505) schedules Duo uploads for later in 2026, and the current [ScreenshotDisplayType reference](https://developer.apple.com/documentation/appstoreconnectapi/screenshotdisplaytype) has no Duo case. The signed-in UI was not verified because its session expired. Later enablement remains possible; confirm that the current UI or API accepts both display sets before submission.

Engage remains iPhone-only (`supportsTablet: false`). Preserve inherited iPad assets if App Store Connect carries them forward; this release does not expand iPad distribution.

### Screenshot Descriptions

1. **Calendar View**: Monthly calendar with completion heatmap
2. **Today View**: Current day's tasks and progress
3. **Task Selection**: Choosing tasks from preset categories
4. **Statistics View**: Progress tracking and analytics
5. **Journal Entry**: Daily reflection interface

## App Preview Video (Optional)

- **Duration**: 15-30 seconds
- **Format**: MP4 or MOV
- **Resolution**: Same as screenshot requirements
- **Content**: Quick demo of core workflow (Calendar → Tasks → Completion → Journal)

## App Store Review Information

### Demo Account (if needed)

Not required - app works without account creation

### Review Notes

This app is a simple habit tracker that works entirely offline. No user accounts, no network requests, no sensitive data collection. All data is stored locally using SQLite.

Key testing flows:

1. Open app → Calendar tab → Select today's date
2. Tap "タスクを選択" → Select tasks → Confirm
3. Complete tasks by tapping checkboxes
4. Write journal entry in text field
5. Check Statistics tab for progress tracking

The app includes Japanese text as it's designed for Japanese users, but all core functionality works without language barriers.

### Export Compliance

- **Uses Encryption**: No
- **ITSAppUsesNonExemptEncryption**: false

## Google Play Store Metadata

### Short Description (80 characters)

Minimal habit tracker with calendar view, task management, and daily journaling

### Full Description

Build consistent daily habits with Engage - a minimal, powerful habit tracker designed for simplicity and effectiveness.

**Key Features:**
• Visual Calendar: See your progress at a glance with an intuitive heatmap calendar
• Task Management: Choose from preset tasks or create custom ones organized by categories  
• Daily Reflection: Write brief journal entries to reflect on your day
• Progress Tracking: Monitor streaks, completion rates, and detailed statistics
• Offline First: All data stored locally on your device for complete privacy
• Clean Design: Material Design-compliant interface that feels native and intuitive

**Perfect for:**

- Building morning and evening routines
- Tracking business and personal development goals
- Maintaining work-life balance
- Creating sustainable habit loops

**Privacy Focused:**
Your data stays on your device. No cloud sync, no tracking, no ads. Just you and your habits.

Start your journey to better habits today with Engage's simple yet powerful approach to habit tracking.

### Content Rating

- **Target Age Group**: Everyone
- **Content Rating**: Everyone
- **Ads**: No
- **In-App Purchases**: No

### Store Listing Assets

- **High-res icon**: 512 x 512 pixels
- **Feature graphic**: 1024 x 500 pixels
- **Phone screenshots**: 1080 x 1920 pixels (minimum 2, maximum 8)
- **Tablet screenshots**: 1200 x 1920 pixels (optional)

## Privacy Policy

A privacy policy is required for both app stores. Key points:

- No data collection
- All data stored locally
- No third-party services
- No analytics or tracking
- Optional notification permissions
- Data export/backup capabilities

## Marketing Materials

### Press Kit

- App icon (various sizes)
- Screenshots
- App description
- Developer information
- Press release template

### Social Media

- Twitter/X announcement
- LinkedIn post
- Product Hunt submission (optional)

## Launch Strategy

### Soft Launch

1. TestFlight beta with internal team
2. External TestFlight with 50-100 users
3. Gather feedback and iterate
4. Final polish based on feedback

### Full Launch

1. Submit to App Store and Google Play simultaneously
2. Monitor reviews and ratings
3. Respond to user feedback
4. Plan first update based on user requests

## Post-Launch Monitoring

### Key Metrics

- Download numbers
- User ratings and reviews
- Crash reports
- User feedback themes
- Feature requests

### Update Schedule

- Bug fixes: As needed
- Feature updates: Monthly
- Major updates: Quarterly
