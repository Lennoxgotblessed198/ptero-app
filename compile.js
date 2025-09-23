#!/usr/bin/env node
/**
 * Cross-platform build helper.
 * Detects OS and runs electron-builder with appropriate targets.
 * Additionally attempts to create a desktop/menu shortcut after build
 * on Linux (using .desktop), on Windows (Start Menu link via electron-builder),
 * and on macOS (handled by .app bundle; we optionally symlink to /Applications if missing).
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function build() {
  const platform = process.platform;
  let targetArgs = '';
  if (platform === 'win32') {
    targetArgs = '--win';
  } else if (platform === 'linux') {
    targetArgs = '--linux';
  } else if (platform === 'darwin') {
    targetArgs = '--mac';
  } else {
    console.warn('Unsupported platform for automatic build. Falling back to generic build');
  }
  run(`npx electron-builder ${targetArgs}`);
  return platform;
}

function createLinuxDesktopFile() {
  const home = process.env.HOME;
  if (!home) return;
  const applicationsDir = path.join(home, '.local', 'share', 'applications');
  if (!fs.existsSync(applicationsDir)) fs.mkdirSync(applicationsDir, { recursive: true });
  const desktopPath = path.join(applicationsDir, 'ptero-app.desktop');

  const distDir = path.join(process.cwd(), 'dist');
  let appImage = null;
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    appImage = files.find(f => f.toLowerCase().endsWith('.appimage'));
  }
  const execPath = appImage ? path.join(distDir, appImage) : 'ptero-app';
  const iconSource = path.join(process.cwd(), 'icon.png');

  try {
    const iconTargetDir = path.join(home, '.local', 'share', 'icons', 'hicolor', '512x512', 'apps');
    if (!fs.existsSync(iconTargetDir)) fs.mkdirSync(iconTargetDir, { recursive: true });
    const iconTarget = path.join(iconTargetDir, 'ptero-app.png');
    fs.copyFileSync(iconSource, iconTarget);
  } catch (e) {
    console.warn('Could not install icon to icon theme directory:', e.message);
  }
  const desktopEntry = `[Desktop Entry]\nType=Application\nName=Ptero App\nComment=Electron app for hosting panels\nExec=\"${execPath}\" %U\nIcon=ptero-app\nTerminal=false\nCategories=Utility;Network;\nStartupWMClass=Ptero App`;
  fs.writeFileSync(desktopPath, desktopEntry);
  fs.chmodSync(desktopPath, 0o755);
  console.log('Created desktop file at', desktopPath);
}

function ensureMacSymlink() {
  const appName = 'Ptero App.app';
  const distDir = path.join(process.cwd(), 'dist');
  const appPath = path.join(distDir, appName);
  if (fs.existsSync(appPath)) {
    const targetApplications = '/Applications';
    const linkPath = path.join(targetApplications, appName);
    try {
      if (!fs.existsSync(linkPath)) {
        console.log('Linking application to /Applications (may require sudo)...');
        run(`ln -s "${appPath}" "${linkPath}"`);
      }
    } catch (e) {
      console.warn('Could not link to /Applications:', e.message);
    }
  }
}

function postBuild(platform) {
  if (platform === 'linux') {
    createLinuxDesktopFile();
  } else if (platform === 'darwin') {
    ensureMacSymlink();
  } else if (platform === 'win32') {
    console.log('Windows shortcuts handled by NSIS installer. Run the generated installer in dist/.');
  }
}

function main() {
  const platform = build();
  postBuild(platform);
  console.log('\nBuild complete.');
}

main();
