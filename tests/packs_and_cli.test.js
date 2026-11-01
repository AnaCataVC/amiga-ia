const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { loadRegistry, resolvePackOrExtension, getAllPackCapabilities } = require('../src/core/registry');
const { loadReceipt, saveReceipt, updatePackReceipt } = require('../src/core/receipts');
const { installClaudeMods, removeClaudeMods } = require('../src/core/extensions');
const { filterSkillsByPacks, filterAgentsByPacks, cleanUnselectedPackFiles } = require('../src/core/installer');

describe('Amiga IA Ecosystem Registry & Pack Resolution Tests', () => {

  test('loadRegistry loads valid packs and extensions', () => {
    const reg = loadRegistry();
    assert.ok(reg.packs);
    assert.ok(reg.packs.essential);
    assert.ok(reg.packs.data);
    assert.ok(reg.packs.ui);
    assert.ok(reg.extensions['claude-mods']);
  });

  test('resolvePackOrExtension resolves aliases cleanly', () => {
    const resData = resolvePackOrExtension('data');
    assert.strictEqual(resData.type, 'pack');
    assert.strictEqual(resData.id, 'data');

    const resAmiData = resolvePackOrExtension('ami-data');
    assert.strictEqual(resAmiData.type, 'pack');
    assert.strictEqual(resAmiData.id, 'data');

    const resClaudeMods = resolvePackOrExtension('claude-mods');
    assert.strictEqual(resClaudeMods.type, 'extension');
    assert.strictEqual(resClaudeMods.id, 'claude-mods');

    const resAmiClaudeMods = resolvePackOrExtension('ami-claude-mods');
    assert.strictEqual(resAmiClaudeMods.type, 'extension');
    assert.strictEqual(resAmiClaudeMods.id, 'claude-mods');

    const resUnknown = resolvePackOrExtension('nonexistent-pack');
    assert.strictEqual(resUnknown, null);
  });

  test('getAllPackCapabilities aggregates capabilities without duplicates', () => {
    const caps = getAllPackCapabilities(['essential', 'data']);
    assert.ok(caps.agents.includes('ami-tech-lead'));
    assert.ok(caps.agents.includes('ami-data-scientist'));
    assert.ok(caps.skills.includes('ami-plan-feature'));
    assert.ok(caps.skills.includes('ami-optimize-sql'));
    assert.ok(!caps.agents.includes('ami-ui-builder'));
  });

});

describe('Amiga IA Receipt Lifecycle Tests', () => {

  test('saveReceipt and loadReceipt persist and read installed pack receipts', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-receipt-test-'));
    const saved = saveReceipt(tmpDir, {
      name: '@anacatavc/amiga-ia',
      version: '5.12.0',
      installedPacks: ['essential', 'data'],
      files: ['skills/ami-plan-feature', 'agents/ami-tech-lead.md']
    });

    assert.strictEqual(saved.version, '5.12.0');
    assert.deepStrictEqual(saved.installedPacks, ['essential', 'data']);

    const loaded = loadReceipt(tmpDir);
    assert.ok(loaded);
    assert.strictEqual(loaded.version, '5.12.0');
    assert.deepStrictEqual(loaded.installedPacks, ['essential', 'data']);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('updatePackReceipt adds and removes pack IDs and updates file tracking', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-receipt-test-'));
    saveReceipt(tmpDir, {
      name: '@anacatavc/amiga-ia',
      version: '5.12.0',
      installedPacks: ['essential']
    });

    updatePackReceipt(tmpDir, 'data', 'add', ['agents/ami-data-scientist.md', 'skills/ami-optimize-sql']);
    let current = loadReceipt(tmpDir);
    assert.ok(current.installedPacks.includes('essential'));
    assert.ok(current.installedPacks.includes('data'));
    assert.ok(current.files.includes('agents/ami-data-scientist.md'));

    updatePackReceipt(tmpDir, 'data', 'remove', ['agents/ami-data-scientist.md', 'skills/ami-optimize-sql']);
    current = loadReceipt(tmpDir);
    assert.ok(current.installedPacks.includes('essential'));
    assert.ok(!current.installedPacks.includes('data'));
    assert.ok(!current.files.includes('agents/ami-data-scientist.md'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});

describe('Amiga IA Claude Mods Runtime Extension Tests', () => {

  test('installClaudeMods installs mods into target directory and records receipt', () => {
    const tmpClaudeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-claude-ext-test-'));
    
    // Create mock source repository with mods
    const tmpSourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ami-claude-mods-src-'));
    const sourceModsDir = path.join(tmpSourceDir, 'mods');
    fs.mkdirSync(path.join(sourceModsDir, 'hooks-viewer'), { recursive: true });
    fs.writeFileSync(path.join(sourceModsDir, 'hooks-viewer', 'package.json'), JSON.stringify({ name: 'hooks-viewer' }));
    fs.mkdirSync(path.join(sourceModsDir, 'cleanroom-guard'), { recursive: true });
    fs.writeFileSync(path.join(sourceModsDir, 'cleanroom-guard', 'package.json'), JSON.stringify({ name: 'cleanroom-guard' }));

    const res = installClaudeMods(tmpClaudeDir, { sourceDir: tmpSourceDir });
    assert.strictEqual(res.success, true);
    assert.ok(res.installedMods.includes('hooks-viewer'));
    assert.ok(res.installedMods.includes('cleanroom-guard'));

    // Check physical presence in destination
    assert.ok(fs.existsSync(path.join(tmpClaudeDir, 'mods', 'hooks-viewer', 'package.json')));
    assert.ok(fs.existsSync(path.join(tmpClaudeDir, 'mods', 'cleanroom-guard', 'package.json')));

    // Check receipt
    const receipt = loadReceipt(tmpClaudeDir);
    assert.ok(receipt.installedExtensions['claude-mods']);
    assert.deepStrictEqual(receipt.installedExtensions['claude-mods'].mods.sort(), ['cleanroom-guard', 'hooks-viewer']);

    // Test removal
    const removeRes = removeClaudeMods(tmpClaudeDir);
    assert.strictEqual(removeRes.success, true);
    assert.ok(!fs.existsSync(path.join(tmpClaudeDir, 'mods', 'hooks-viewer')));
    assert.ok(!fs.existsSync(path.join(tmpClaudeDir, 'mods', 'cleanroom-guard')));

    const updatedReceipt = loadReceipt(tmpClaudeDir);
    assert.strictEqual(updatedReceipt.installedExtensions['claude-mods'], undefined);

    fs.rmSync(tmpClaudeDir, { recursive: true, force: true });
    fs.rmSync(tmpSourceDir, { recursive: true, force: true });
  });

});
