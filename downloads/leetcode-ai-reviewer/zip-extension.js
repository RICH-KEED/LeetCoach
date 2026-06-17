import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = resolve(__dirname, 'dist');
const zipFile = resolve(__dirname, 'leetcoach-extension.zip');

console.log('🚀 Starting extension packaging...');

if (!existsSync(distDir)) {
  console.error('❌ Error: dist/ directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Clean up existing zip file if it exists
if (existsSync(zipFile)) {
  try {
    unlinkSync(zipFile);
    console.log('🗑️  Removed old zip file.');
  } catch (err) {
    console.error(`⚠️  Could not remove old zip file: ${err.message}`);
  }
}

const isWindows = process.platform === 'win32';

try {
  if (isWindows) {
    console.log('📦 Packaging extension using PowerShell on Windows...');
    // We run PowerShell's Compress-Archive command.
    // Note: We use relative path for files inside dist to prevent nested root folder in zip.
    const command = `powershell -Command "Set-Location '${distDir}'; Compress-Archive -Path * -DestinationPath '${zipFile}' -Force"`;
    execSync(command, { stdio: 'inherit' });
  } else {
    console.log('📦 Packaging extension using zip on POSIX...');
    const command = `cd "${distDir}" && zip -r "${zipFile}" .`;
    execSync(command, { stdio: 'inherit' });
  }
  console.log(`✅ Success! Extension packaged into: ${zipFile}`);
} catch (error) {
  console.error('❌ Error packaging extension:', error.message);
  process.exit(1);
}
