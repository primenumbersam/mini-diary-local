const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const appDistDir = path.join(distDir, 'mini-local-diary');

if (!fs.existsSync(appDistDir)) {
  console.log('Building app first...');
  execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
}

// Ensure storage template is included
const targetStorage = path.join(appDistDir, 'storage');
if (!fs.existsSync(targetStorage)) {
  fs.mkdirSync(path.join(targetStorage, 'diaries'), { recursive: true });
  fs.mkdirSync(path.join(targetStorage, 'assets'), { recursive: true });
}

console.log('Packaging for individual OS releases...');

// Helper to create zip on Linux/Mac
function createZip(zipName, filesAndFolders) {
  const zipPath = path.join(distDir, zipName);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  
  const cmd = `cd "${appDistDir}" && zip -r "${zipPath}" ${filesAndFolders.join(' ')}`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✓ Created: dist/${zipName}`);
  } catch (err) {
    console.error(`Failed to create ${zipName}:`, err.message);
  }
}

// 1. Windows Package
createZip('mini-local-diary-windows.zip', ['mini-local-diary-win_x64.exe', 'resources.neu', 'storage']);

// 2. macOS Package (Universal)
createZip('mini-local-diary-macos.zip', ['mini-local-diary-mac_universal', 'resources.neu', 'storage']);

// 3. Linux Package (x64)
createZip('mini-local-diary-linux.zip', ['mini-local-diary-linux_x64', 'resources.neu', 'storage']);

console.log('\nAll OS distribution packages ready in dist/ !');
