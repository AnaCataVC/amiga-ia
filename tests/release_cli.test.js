const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const releaseScriptPath = path.join(rootDir, 'scripts', 'release.js');
const {
  isNonProductFile,
  evaluateReleaseNecessity,
  parseSemVer,
  isNewerVersion
} = require('../scripts/release');

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

  await t.test('isNonProductFile should accurately classify product vs non-product paths', () => {
    // Non-product paths
    assert.strictEqual(isNonProductFile('docs/architecture.md'), true);
    assert.strictEqual(isNonProductFile('docs\\adr\\001-test.md'), true);
    assert.strictEqual(isNonProductFile('benchmarks/run-all.js'), true);
    assert.strictEqual(isNonProductFile('tests/release_cli.test.js'), true);
    assert.strictEqual(isNonProductFile('.github/workflows/ci.yml'), true);
    assert.strictEqual(isNonProductFile('.agents/rules/custom.md'), true);
    assert.strictEqual(isNonProductFile('.claude/settings.json'), true);
    assert.strictEqual(isNonProductFile('.gemini/config/settings.json'), true);
    assert.strictEqual(isNonProductFile('README.md'), true);
    assert.strictEqual(isNonProductFile('README.es.md'), true);
    assert.strictEqual(isNonProductFile('LICENSE'), true);
    assert.strictEqual(isNonProductFile('index.html'), true);
    assert.strictEqual(isNonProductFile('.gitignore'), true);

    // Product paths (Layer 1 & Layer 2)
    assert.strictEqual(isNonProductFile('skills/ami-plan-feature/SKILL.md'), false);
    assert.strictEqual(isNonProductFile('agents/ami-release-manager.md'), false);
    assert.strictEqual(isNonProductFile('adapters/universal_adapter.js'), false);
    assert.strictEqual(isNonProductFile('bin/setup.js'), false);
    assert.strictEqual(isNonProductFile('hooks/scripts/ami-pre-tool-use.js'), false);
    assert.strictEqual(isNonProductFile('package.json'), false);
  });

  await t.test('evaluateReleaseNecessity should reject releases when only docs, tests, or chores are changed', () => {
    // Scenario 1: Only docs and tests commits and files
    const resultDocsOnly = evaluateReleaseNecessity({
      unreleasedCommits: [
        '2d2ffc6 chore(guidelines): align Rule 17 with modular catalog architecture',
        'be7e49e docs(catalog): modularize capability catalog and elevate distribution layout',
        '39b603c test(benchmarks): introduce empirical agentic evaluation suite and contracts'
      ],
      changedFiles: [
        'README.md',
        'docs/catalog.md',
        'benchmarks/run-all.js',
        'package.json'
      ]
    });
    assert.strictEqual(resultDocsOnly.allowed, false);
    assert.match(resultDocsOnly.reason, /No core product changes detected/);

    // Scenario 2: Zero unreleased commits
    const resultEmpty = evaluateReleaseNecessity({
      unreleasedCommits: [],
      changedFiles: []
    });
    assert.strictEqual(resultEmpty.allowed, false);
    assert.match(resultEmpty.reason, /No unreleased commits detected/);

    // Scenario 3: Only non-product files modified even with generic commit title
    const resultNonProductFiles = evaluateReleaseNecessity({
      unreleasedCommits: ['a1b2c3d refactor: improve readability of documentation'],
      changedFiles: ['docs/architecture.md', 'README.md']
    });
    assert.strictEqual(resultNonProductFiles.allowed, false);
    assert.strictEqual(resultNonProductFiles.hasProductFileChanges, false);
  });

  await t.test('evaluateReleaseNecessity should authorize releases when core product changes exist', () => {
    // Scenario 1: New feature in skills/
    const resultFeat = evaluateReleaseNecessity({
      unreleasedCommits: ['62e2a2f feat(manifests): enable write capabilities for ami-push-assistant'],
      changedFiles: ['skills/ami-push-assistant/SKILL.md', 'scripts/build-manifests.js']
    });
    assert.strictEqual(resultFeat.allowed, true);
    assert.strictEqual(resultFeat.hasProductFileChanges, true);
    assert.strictEqual(resultFeat.allCommitsNonProduct, false);

    // Scenario 2: Bug fix in adapters/
    const resultFix = evaluateReleaseNecessity({
      unreleasedCommits: ['f1e2d3c fix(adapter): handle undefined prompt input'],
      changedFiles: ['adapters/capability_translator.js']
    });
    assert.strictEqual(resultFix.allowed, true);
    assert.strictEqual(resultFix.hasProductFileChanges, true);
    assert.strictEqual(resultFix.allCommitsNonProduct, false);

    // Scenario 3: Refactor in product code
    const resultRefactor = evaluateReleaseNecessity({
      unreleasedCommits: ['1a2b3c4 refactor(core): optimize XML parser regex'],
      changedFiles: ['adapters/universal_adapter.js']
    });
    assert.strictEqual(resultRefactor.allowed, true);
    assert.strictEqual(resultRefactor.hasProductFileChanges, true);
    assert.strictEqual(resultRefactor.allCommitsNonProduct, false);
  });
});
