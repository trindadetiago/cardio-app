#!/usr/bin/env node
/* eslint-env node */
/**
 * Uninstall the app from the booted iOS simulator or a connected Android
 * device, wiping its sandbox (including the SQLite DB).
 *
 * Usage:
 *   node scripts/reset-app.js ios       # iOS only
 *   node scripts/reset-app.js android   # Android only
 *   node scripts/reset-app.js all       # both (default)
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const appJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8')
);

const iosBundleId = appJson.expo?.ios?.bundleIdentifier;
const explicitAndroidPkg = appJson.expo?.android?.package;
const androidPkg =
  explicitAndroidPkg ?? (iosBundleId ? iosBundleId.replace(/-/g, '_') : null);

if (!iosBundleId) {
  console.warn('app.json has no expo.ios.bundleIdentifier — iOS reset will be skipped.');
}

const target = process.argv[2] ?? 'all';

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function resetIos() {
  if (!iosBundleId) return;
  try {
    run(`xcrun simctl uninstall booted ${iosBundleId}`);
    console.log(`✓ Removed ${iosBundleId} from booted iOS simulator.`);
  } catch (e) {
    console.error(`✗ iOS uninstall failed: ${e.message}`);
    console.error('  Hints: is a simulator booted? (xcrun simctl list devices booted)');
  }
}

function resetAndroid() {
  if (!androidPkg) return;
  try {
    run(`adb uninstall ${androidPkg}`);
    console.log(`✓ Removed ${androidPkg} from connected Android device.`);
  } catch (e) {
    console.error(`✗ Android uninstall failed: ${e.message}`);
    console.error(`  Hints: is a device/emulator attached? (adb devices)`);
    console.error(`  Package guessed as "${androidPkg}". Override with expo.android.package in app.json.`);
  }
}

switch (target) {
  case 'ios':
    resetIos();
    break;
  case 'android':
    resetAndroid();
    break;
  case 'all':
    resetIos();
    resetAndroid();
    break;
  default:
    console.error(`Unknown target "${target}". Use ios|android|all.`);
    process.exit(1);
}

console.log('\nNext: run `npm run ios` (or `npm run android`) to reinstall with a fresh DB.');
