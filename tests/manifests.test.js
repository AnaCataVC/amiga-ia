const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Configuration & Build Synchronization Tests', () => {

  // Reads the committed files without rebuilding them, so a forgotten `npm run build` fails here.
  test('package.json is valid and hooks/hooks.json matches hooks.json', () => {
    const rootDir = path.resolve(__dirname, '..');
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

    assert.ok(pkg.name);
    assert.ok(pkg.version);

    // Check hooks sync
    const sourceHooks = fs.readFileSync(path.join(rootDir, 'hooks.json'), 'utf8');
    const targetHooks = fs.readFileSync(path.join(rootDir, 'hooks/hooks.json'), 'utf8');
    assert.strictEqual(targetHooks, sourceHooks);
  });

});
