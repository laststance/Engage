#!/usr/bin/env node
/* global __dirname */

const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const defaultOutputDirectory = path.join(
  projectRoot,
  '.expo',
  'ios-headless',
  'build'
)

/**
 * Explains safe headless usage when main receives --help, before any build or simulator work starts.
 * @returns Nothing; usage text is written to stdout.
 * @example
 * printHelp() // => prints IOS_HEADLESS_UDID and IOS_HEADLESS_DEVICE_NAME usage
 */
function printHelp() {
  console.log(`Usage: pnpm ios:headless

Builds an embedded Release bundle without a persistent Metro development server,
boots CoreSimulator through simctl without opening Simulator.app, installs Engage,
and launches it.

Environment variables:
  IOS_HEADLESS_UDID         Reuse one specific available simulator.
  IOS_HEADLESS_DEVICE_NAME Name for the dedicated simulator (default: Engage Headless).
`)
}

/**
 * Gives every workflow helper one shell-free subprocess path whenever it invokes Expo, Xcode, or simctl.
 * @param {string} command - Executable available on PATH.
 * @param {string[]} args - Argument list passed directly to the executable.
 * @param {{ captureOutput?: boolean }} [options] - Whether stdout should be returned instead of inherited.
 * @returns {string} Captured stdout, or an empty string when output is inherited.
 * @example
 * runCommand('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], { captureOutput: true })
 */
function runCommand(command, args, options = {}) {
  const { captureOutput = false } = options
  console.log(`\n$ ${command} ${args.join(' ')}`)

  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: '1',
      EXPO_NO_TELEMETRY: '1',
      RCT_NO_LAUNCH_PACKAGER: '1',
    },
    stdio: captureOutput ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  })

  // Surface process creation failures before interpreting an absent exit status.
  if (result.error) {
    throw result.error
  }

  // Stop immediately when any native build or simulator command fails.
  if (result.status !== 0) {
    const signalDetail = result.signal ? ` (signal: ${result.signal})` : ''
    throw new Error(
      `${command} exited with status ${String(result.status)}${signalDetail}`
    )
  }

  return captureOutput ? result.stdout.trim() : ''
}

/**
 * Lets main derive the dedicated simulator label from app.json before selecting or creating a device.
 * @returns {{ appName: string }} Expo values required by the headless workflow.
 * @example
 * readExpoAppConfig() // => { appName: 'Engage' }
 */
function readExpoAppConfig() {
  const appJsonPath = path.join(projectRoot, 'app.json')
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
  const appName = appJson.expo?.name

  // Fail early because the app name also identifies the reusable simulator.
  if (!appName) {
    throw new Error('app.json must define expo.name')
  }

  return { appName }
}

/**
 * Gives main deterministic device metadata before resolveHeadlessDevice selects or creates a simulator.
 * @returns {Array<object>} Available simctl devices annotated with runtimeIdentifier.
 * @example
 * readAvailableDevices() // => [{ name: 'iPhone 17 Pro', udid: '...', runtimeIdentifier: '...iOS-26-5' }]
 */
function readAvailableDevices() {
  const rawDeviceList = runCommand(
    'xcrun',
    ['simctl', 'list', 'devices', 'available', '--json'],
    { captureOutput: true }
  )
  const parsedDeviceList = JSON.parse(rawDeviceList)

  return Object.entries(parsedDeviceList.devices)
    .filter(([runtimeIdentifier]) => runtimeIdentifier.includes('.iOS-'))
    .flatMap(([runtimeIdentifier, devices]) =>
      devices.map((device) => ({ ...device, runtimeIdentifier }))
    )
}

/**
 * Supplies resolveHeadlessDevice with a creatable iPhone only when no requested or dedicated device can be reused.
 * @returns {{ deviceTypeIdentifier: string, name: string, runtimeIdentifier: string }} Template for simctl create.
 * @example
 * readPreferredIPhoneTemplate() // => { name: 'iPhone 17 Pro', deviceTypeIdentifier: '...', runtimeIdentifier: '...iOS-26-5' }
 */
function readPreferredIPhoneTemplate() {
  const rawRuntimeList = runCommand(
    'xcrun',
    ['simctl', 'list', 'runtimes', 'available', '--json'],
    { captureOutput: true }
  )
  const parsedRuntimeList = JSON.parse(rawRuntimeList)
  const availableIOSRuntimes = parsedRuntimeList.runtimes
    .filter(
      (runtime) =>
        runtime.isAvailable && runtime.identifier.includes('.iOS-')
    )
    .sort((leftRuntime, rightRuntime) =>
      compareRuntimeVersions(leftRuntime.identifier, rightRuntime.identifier)
    )
  const newestRuntime = availableIOSRuntimes[0]

  // A native simulator cannot be created until an available iOS runtime exists.
  if (!newestRuntime) {
    throw new Error('No available iOS Simulator runtime is installed')
  }

  const supportedIPhones = newestRuntime.supportedDeviceTypes.filter(
    (deviceType) => deviceType.productFamily === 'iPhone'
  )
  const preferredDeviceType =
    supportedIPhones.find((deviceType) => deviceType.name.endsWith(' Pro')) ??
    supportedIPhones[0]

  // Keep the error actionable when Xcode has an iOS runtime but no iPhone type.
  if (!preferredDeviceType) {
    throw new Error('The newest iOS Simulator runtime supports no iPhone type')
  }

  return {
    deviceTypeIdentifier: preferredDeviceType.identifier,
    name: preferredDeviceType.name,
    runtimeIdentifier: newestRuntime.identifier,
  }
}

/**
 * Gives compareRuntimeVersions numeric segments whenever simulator runtimes need stable ordering.
 * @param {string} runtimeIdentifier - Identifier such as com.apple.CoreSimulator.SimRuntime.iOS-26-5.
 * @returns {number[]} Numeric runtime segments in major-to-patch order.
 * @example
 * readRuntimeVersionParts('...iOS-26-5') // => [26, 5]
 */
function readRuntimeVersionParts(runtimeIdentifier) {
  return runtimeIdentifier
    .replace(/^.*\.iOS-/, '')
    .split('-')
    .map((part) => Number(part))
}

/**
 * Lets device and template selectors prefer the newest installed iOS whenever they sort runtime identifiers.
 * @param {string} leftRuntime - First CoreSimulator runtime identifier.
 * @param {string} rightRuntime - Second CoreSimulator runtime identifier.
 * @returns {number} Negative when the left runtime is newer, positive when the right is newer.
 * @example
 * compareRuntimeVersions('...iOS-26-5', '...iOS-26-4') // => -1
 */
function compareRuntimeVersions(leftRuntime, rightRuntime) {
  const leftVersionParts = readRuntimeVersionParts(leftRuntime)
  const rightVersionParts = readRuntimeVersionParts(rightRuntime)
  const comparedPartCount = Math.max(
    leftVersionParts.length,
    rightVersionParts.length
  )

  // Compare each version segment until one installed runtime is newer.
  for (let index = 0; index < comparedPartCount; index += 1) {
    const difference =
      (rightVersionParts[index] ?? 0) - (leftVersionParts[index] ?? 0)

    if (difference !== 0) {
      return difference
    }
  }

  return 0
}

/**
 * Lets main choose a requested or dedicated simulator before building, creating one only when reuse is impossible.
 * @param {Array<object>} devices - Available simulators returned by simctl.
 * @param {string | undefined} requestedUdid - Optional explicit simulator UDID.
 * @param {string} deviceName - Reusable dedicated simulator name.
 * @param {() => object} readTemplateDevice - Lazily reads an iPhone type and iOS runtime only when creating a device.
 * @returns {object} Simulator metadata containing name, state, UDID, device type, and runtime.
 * @example
 * resolveHeadlessDevice(devices, undefined, 'Engage Headless', readTemplate) // => dedicated device metadata
 */
function resolveHeadlessDevice(
  devices,
  requestedUdid,
  deviceName,
  readTemplateDevice
) {
  const newestDevices = [...devices].sort((leftDevice, rightDevice) =>
    compareRuntimeVersions(
      leftDevice.runtimeIdentifier,
      rightDevice.runtimeIdentifier
    )
  )

  // An explicit UDID always wins so callers can opt into their own simulator.
  if (requestedUdid) {
    const normalizedRequestedUdid = requestedUdid.trim().toLowerCase()
    const requestedDevice = newestDevices.find(
      (device) => device.udid.toLowerCase() === normalizedRequestedUdid
    )

    // Reject unavailable or non-iOS UDIDs before starting an expensive build.
    if (!requestedDevice) {
      throw new Error(
        `IOS_HEADLESS_UDID ${requestedUdid} is not an available simulator`
      )
    }

    return requestedDevice
  }

  // Reuse only a dedicated iPhone; a same-named iPad must not be selected accidentally.
  const existingDedicatedDevice = newestDevices.find(
    (device) =>
      device.name === deviceName &&
      device.deviceTypeIdentifier.includes('.iPhone-')
  )

  // Keeping one device avoids accumulating a fresh simulator on every run.
  if (existingDedicatedDevice) {
    return existingDedicatedDevice
  }

  // Query runtime capabilities only when reuse is impossible, then create a clean device without cloning user data.
  const templateDevice = readTemplateDevice()

  // Stop before simctl create when Xcode cannot provide a supported iPhone template.
  if (!templateDevice) {
    throw new Error('No iPhone Simulator template is available')
  }

  const createdUdid = runCommand(
    'xcrun',
    [
      'simctl',
      'create',
      deviceName,
      templateDevice.deviceTypeIdentifier,
      templateDevice.runtimeIdentifier,
    ],
    { captureOutput: true }
  )

  // simctl must return one UUID; anything else means creation did not complete cleanly.
  if (!/^[0-9A-F-]{36}$/i.test(createdUdid)) {
    throw new Error(`simctl returned an invalid device UDID: ${createdUdid}`)
  }

  return {
    ...templateDevice,
    name: deviceName,
    state: 'Shutdown',
    udid: createdUdid,
  }
}

/**
 * Lets main create an embedded Release app after device resolution without Expo installing it or opening Simulator.app.
 * @param {string} outputDirectory - Disposable directory where Expo copies the .app bundle.
 * @returns {string} Absolute output directory containing the built simulator app.
 * @example
 * buildSimulatorApp('/repo/.expo/ios-headless/build') // => same directory after a successful build
 */
function buildSimulatorApp(outputDirectory) {
  fs.rmSync(outputDirectory, { force: true, recursive: true })
  runCommand('pnpm', [
    'exec',
    'expo',
    'run:ios',
    '--configuration',
    'Release',
    '--device',
    'generic',
    '--output',
    outputDirectory,
    '--no-bundler',
  ])
  return outputDirectory
}

/**
 * Lets main locate Expo's copied product after a build, recursively handling nested output layouts.
 * @param {string} directory - Build-only output directory to search recursively.
 * @returns {string} Absolute path to the first simulator .app bundle.
 * @example
 * findAppBundle('/repo/.expo/ios-headless/build') // => '/repo/.expo/ios-headless/build/Engage.app'
 */
function findAppBundle(directory) {
  // A missing output means Expo never completed its build-only copy step.
  if (!fs.existsSync(directory)) {
    throw new Error(`Build output directory does not exist: ${directory}`)
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true })

  // Stop at an app bundle because its nested frameworks are not build candidates.
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    // Return the outer app before traversing its internal Frameworks directory.
    if (entry.isDirectory() && entry.name.endsWith('.app')) {
      return entryPath
    }

    // Search nested output layouts while ignoring directories without an app.
    if (entry.isDirectory()) {
      try {
        return findAppBundle(entryPath)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)

        // Ignore only an expected recursive miss; surface filesystem and parsing failures immediately.
        if (!errorMessage.startsWith('No .app bundle found')) {
          throw error
        }
      }
    }
  }

  throw new Error(`No .app bundle found below ${directory}`)
}

/**
 * Lets main read the native identifier after finding the app so installAndLaunch cannot use stale app.json data.
 * @param {string} appBundlePath - Built simulator .app directory.
 * @returns {string} CFBundleIdentifier embedded in the built Info.plist.
 * @example
 * readBuiltBundleIdentifier('/tmp/Engage.app') // => 'com.laststance.engage'
 */
function readBuiltBundleIdentifier(appBundlePath) {
  return runCommand(
    'plutil',
    [
      '-extract',
      'CFBundleIdentifier',
      'raw',
      '-o',
      '-',
      path.join(appBundlePath, 'Info.plist'),
    ],
    { captureOutput: true }
  )
}

/**
 * Lets main perform the final boot, install, and launch after the Release app and native identifier are ready.
 * @param {object} device - Resolved simulator metadata with its UDID.
 * @param {string} appBundlePath - Built simulator .app directory.
 * @param {string} bundleIdentifier - Native bundle identifier to launch.
 * @returns {string} simctl launch output containing the app process identifier.
 * @example
 * installAndLaunch(device, '/tmp/Engage.app', 'com.laststance.engage') // => 'com.laststance.engage: 12345'
 */
function installAndLaunch(device, appBundlePath, bundleIdentifier) {
  // bootstatus -b is idempotent, avoiding races when another process boots the device.
  runCommand('xcrun', ['simctl', 'bootstatus', device.udid, '-b'])
  runCommand('xcrun', ['simctl', 'install', device.udid, appBundlePath])
  return runCommand(
    'xcrun',
    [
      'simctl',
      'launch',
      '--terminate-running-process',
      device.udid,
      bundleIdentifier,
    ],
    { captureOutput: true }
  )
}

/**
 * Coordinates the complete workflow whenever the npm entrypoint guard invokes it for pnpm ios:headless.
 * @returns Nothing; failures set a non-zero process exit code through the entrypoint guard.
 * @example
 * main() // => builds, boots, installs, and launches Engage without Simulator.app
 */
function main() {
  // Help must remain side-effect-free: no native build and no simulator creation.
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printHelp()
    return
  }

  const { appName } = readExpoAppConfig()
  const requestedUdid = process.env.IOS_HEADLESS_UDID?.trim() || undefined
  const deviceName = process.env.IOS_HEADLESS_DEVICE_NAME ?? `${appName} Headless`
  const availableDevices = readAvailableDevices()
  const device = resolveHeadlessDevice(
    availableDevices,
    requestedUdid,
    deviceName,
    readPreferredIPhoneTemplate
  )
  const buildDirectory = buildSimulatorApp(defaultOutputDirectory)
  const appBundlePath = findAppBundle(buildDirectory)
  const bundleIdentifier = readBuiltBundleIdentifier(appBundlePath)
  const launchOutput = installAndLaunch(
    device,
    appBundlePath,
    bundleIdentifier
  )

  console.log(`\n✅ ${appName} launched headlessly`)
  console.log(`   Device: ${device.name} (${device.udid})`)
  console.log(`   App: ${appBundlePath}`)
  console.log(`   Process: ${launchOutput}`)
  console.log(
    '   Simulator.app was not opened; the device remains booted for Maestro.'
  )
}

// Execute only for the npm entrypoint so helpers remain importable for future tests.
if (require.main === module) {
  try {
    main()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Headless iOS launch failed: ${errorMessage}`)
    process.exitCode = 1
  }
}

module.exports = {
  compareRuntimeVersions,
  findAppBundle,
  resolveHeadlessDevice,
}
