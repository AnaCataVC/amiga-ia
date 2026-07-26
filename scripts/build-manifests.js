const fs = require('fs');
const path = require('path');

function buildManifests() {
  console.log('📦 Validating Amiga IA configuration from Single Source of Truth (package.json)...');

  const rootDir = path.resolve(__dirname, '..');
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.version || !pkg.name) {
    throw new Error('Invalid package.json: missing name or version.');
  }

  // Sync hooks.json -> hooks/hooks.json
  const sourceHooks = path.join(rootDir, 'hooks.json');
  const targetHooksDir = path.join(rootDir, 'hooks');
  if (!fs.existsSync(targetHooksDir)) {
    fs.mkdirSync(targetHooksDir, { recursive: true });
  }
  const targetHooksPath = path.join(targetHooksDir, 'hooks.json');
  if (fs.existsSync(sourceHooks)) {
    fs.copyFileSync(sourceHooks, targetHooksPath);
    console.log('✅ Synced hooks.json to hooks/hooks.json');
  }

  console.log('✨ Package validation and build complete!\n');
}

if (require.main === module) {
  buildManifests();
}

module.exports = { buildManifests };
