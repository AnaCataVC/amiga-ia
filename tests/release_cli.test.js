const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const releaseScriptPath = path.join(rootDir, 'scripts', 'release.js');

test('Release CLI Hardening Tests', async (t) => {
  await t.test('package.json should define the release script', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.scripts.release, 'node scripts/release.js');
  });

  await t.test('scripts/release.js should reject execution without a target version', () => {
    assert.throws(() => {
      execSync(`node "${releaseScriptPath}"`, {
        cwd: rootDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });
    }, (err) => {
      assert.strictEqual(err.status, 1);
      assert.match(err.stderr, /Target version is required/);
      return true;
    });
  });

  await t.test('scripts/release.js should reject invalid SemVer formats', () => {
    const invalidVersions = ['invalid', '1.0', '1.0.0.0', '1.0.0; rm -rf .', 'v1.0'];
    for (const v of invalidVersions) {
      assert.throws(() => {
        execSync(`node "${releaseScriptPath}" "${v}" --dry-run`, {
          cwd: rootDir,
          stdio: 'pipe',
          encoding: 'utf8'
        });
      }, (err) => {
        assert.strictEqual(err.status, 1);
        assert.match(err.stderr, /Invalid SemVer format/);
        return true;
      });
    }
  });
});
