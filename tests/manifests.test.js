const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { buildManifests } = require('../scripts/build-manifests.js');

describe('Configuration & Build Synchronization Tests', () => {

  test('buildManifests should validate package.json and sync hooks.json to hooks/hooks.json', () => {
    buildManifests();

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
