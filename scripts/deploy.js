#!/usr/bin/env node

/**
 * Deployment Script for Engage App
 *
 * This script helps automate the deployment process for the Engage app
 * including building, testing, and submitting to app stores.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function execCommand(command, description) {
  log(`\n${description}...`, 'cyan')
  try {
    execSync(command, { stdio: 'inherit' })
    log(`✅ ${description} completed successfully`, 'green')
  } catch (error) {
    log(`❌ ${description} failed`, 'red')
    throw error
  }
}

function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'blue')

  // Check if EAS CLI is installed
  try {
    execSync('eas --version', { stdio: 'pipe' })
    log('✅ EAS CLI is installed', 'green')
  } catch (error) {
    log(
      '❌ EAS CLI is not installed. Please run: npm install -g @expo/eas-cli',
      'red'
    )
    process.exit(1)
  }

  // Check if logged in to EAS
  try {
    execSync('eas whoami', { stdio: 'pipe' })
    log('✅ Logged in to EAS', 'green')
  } catch (error) {
    log('❌ Not logged in to EAS. Please run: eas login', 'red')
    process.exit(1)
  }

  // Check if app.json exists
  if (!fs.existsSync('app.json')) {
    log('❌ app.json not found', 'red')
    process.exit(1)
  }
  log('✅ app.json found', 'green')

  // Check if eas.json exists
  if (!fs.existsSync('eas.json')) {
    log('❌ eas.json not found', 'red')
    process.exit(1)
  }
  log('✅ eas.json found', 'green')
}

function runTests() {
  log('\n🧪 Running tests...', 'blue')

  // Run unit tests
  try {
    execCommand('npm test', 'Running unit tests')
  } catch (error) {
    log('⚠️  Some unit tests failed, but continuing with deployment', 'yellow')
  }

  // Run type checking
  execCommand('npm run typecheck', 'Running TypeScript type checking')

  // Run linting
  execCommand('npm run lint', 'Running ESLint')
}

function buildApp(platform, profile = 'production') {
  log(`\n🏗️  Building ${platform} app with ${profile} profile...`, 'blue')

  const command = `eas build --platform ${platform} --profile ${profile} --non-interactive`
  execCommand(command, `Building ${platform} app`)
}

function submitApp(platform, profile = 'production') {
  log(`\n📤 Submitting ${platform} app to store...`, 'blue')

  const command = `eas submit --platform ${platform} --profile ${profile} --non-interactive`
  execCommand(command, `Submitting ${platform} app`)
}

function updateVersion(type = 'patch') {
  log(`\n📝 Updating version (${type})...`, 'blue')

  const appJsonPath = path.join(process.cwd(), 'app.json')
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))

  const currentVersion = appJson.expo.version
  const versionParts = currentVersion.split('.').map(Number)

  switch (type) {
    case 'major':
      versionParts[0]++
      versionParts[1] = 0
      versionParts[2] = 0
      break
    case 'minor':
      versionParts[1]++
      versionParts[2] = 0
      break
    case 'patch':
    default:
      versionParts[2]++
      break
  }

  const newVersion = versionParts.join('.')
  appJson.expo.version = newVersion

  // Update build numbers
  if (appJson.expo.ios) {
    const currentBuildNumber = parseInt(appJson.expo.ios.buildNumber || '1')
    appJson.expo.ios.buildNumber = (currentBuildNumber + 1).toString()
  }

  if (appJson.expo.android) {
    const currentVersionCode = parseInt(appJson.expo.android.versionCode || 1)
    appJson.expo.android.versionCode = currentVersionCode + 1
  }

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2))

  log(`✅ Version updated from ${currentVersion} to ${newVersion}`, 'green')

  if (appJson.expo.ios) {
    log(
      `✅ iOS build number updated to ${appJson.expo.ios.buildNumber}`,
      'green'
    )
  }

  if (appJson.expo.android) {
    log(
      `✅ Android version code updated to ${appJson.expo.android.versionCode}`,
      'green'
    )
  }
}

function showHelp() {
  log('\n📖 Engage App Deployment Script', 'bright')
  log('\nUsage: node scripts/deploy.js [command] [options]', 'cyan')
  log('\nCommands:', 'bright')
  log('  check          Check prerequisites', 'cyan')
  log('  test           Run tests only', 'cyan')
  log('  version        Update version (patch|minor|major)', 'cyan')
  log('  build          Build for both platforms', 'cyan')
  log('  build:ios      Build for iOS only', 'cyan')
  log('  build:android  Build for Android only', 'cyan')
  log('  submit         Submit to both app stores', 'cyan')
  log('  submit:ios     Submit to App Store only', 'cyan')
  log('  submit:android Submit to Google Play only', 'cyan')
  log('  deploy         Full deployment (test + build + submit)', 'cyan')
  log('  help           Show this help message', 'cyan')
  log('\nExamples:', 'bright')
  log('  node scripts/deploy.js check', 'yellow')
  log('  node scripts/deploy.js version minor', 'yellow')
  log('  node scripts/deploy.js build:ios', 'yellow')
  log('  node scripts/deploy.js deploy', 'yellow')
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const option = args[1]

  log('🚀 Engage App Deployment Script', 'bright')

  switch (command) {
    case 'check':
      checkPrerequisites()
      break

    case 'test':
      runTests()
      break

    case 'version':
      updateVersion(option || 'patch')
      break

    case 'build':
      checkPrerequisites()
      runTests()
      buildApp('ios')
      buildApp('android')
      break

    case 'build:ios':
      checkPrerequisites()
      runTests()
      buildApp('ios')
      break

    case 'build:android':
      checkPrerequisites()
      runTests()
      buildApp('android')
      break

    case 'submit':
      submitApp('ios')
      submitApp('android')
      break

    case 'submit:ios':
      submitApp('ios')
      break

    case 'submit:android':
      submitApp('android')
      break

    case 'deploy':
      checkPrerequisites()
      runTests()
      buildApp('ios')
      buildApp('android')
      log('\n🎉 Build completed! Ready for submission.', 'green')
      log('\nNext steps:', 'bright')
      log('1. Test the builds on physical devices', 'cyan')
      log('2. Upload app store assets and metadata', 'cyan')
      log('3. Run: node scripts/deploy.js submit', 'cyan')
      break

    case 'help':
    default:
      showHelp()
      break
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red')
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  log(`\n❌ Deployment failed: ${error.message}`, 'red')
  process.exit(1)
})

main()
