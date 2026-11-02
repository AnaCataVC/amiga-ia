const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { loadRegistry, resolvePackOrExtension, getAllPackCapabilities } = require('../src/core/registry');
const { loadReceipt, saveReceipt, updatePackReceipt } = require('../src/core/receipts');
const { installClaudeMods, removeClaudeMods } = require('../src/core/extensions');
const { filterSkillsByPacks, filterAgentsByPacks, cleanUnselectedPackFiles } = require('../src/core/installer');
const { parseInstallArgs } = require('../bin/setup');

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

describe('Amiga IA CLI Argument Parsing Tests', () => {

  test('parseInstallArgs parses --packs and -p with comma-separated values', () => {
    const res1 = parseInstallArgs(['--packs', 'essential,data']);
    assert.deepStrictEqual(res1.packs, ['essential', 'data']);

    const res2 = parseInstallArgs(['-p', 'ui,data']);
    assert.deepStrictEqual(res2.packs, ['ui', 'data']);

    const res3 = parseInstallArgs(['--packs=essential,ui']);
    assert.deepStrictEqual(res3.packs, ['essential', 'ui']);

    const res4 = parseInstallArgs(['-p=data']);
    assert.deepStrictEqual(res4.packs, ['data']);
  });

  test('parseInstallArgs handles --all and --essential-only convenience flags', () => {
    const resAll = parseInstallArgs(['--all']);
    assert.deepStrictEqual(resAll.packs, ['essential', 'data', 'ui']);
    assert.strictEqual(resAll.installAll, true);

    const resEss = parseInstallArgs(['--essential-only']);
    assert.deepStrictEqual(resEss.packs, ['essential']);
    assert.strictEqual(resEss.essentialOnly, true);
  });

  test('parseInstallArgs handles assistant selectors and claude-mods toggles', () => {
    const resAss = parseInstallArgs(['--assistants', 'claude,codex', '--claude-mods']);
    assert.deepStrictEqual(resAss.assistants, ['claude', 'codex']);
    assert.strictEqual(resAss.claudeMods, true);

    const resAssShort = parseInstallArgs(['-a=antigravity', '--no-claude-mods']);
    assert.deepStrictEqual(resAssShort.assistants, ['antigravity']);
    assert.strictEqual(resAssShort.claudeMods, false);
  });

});

describe('Amiga IA Domain Pack Selective Installation & Pruning Tests', () => {

  test('cleanUnselectedPackFiles cleanly prunes deselected packs while preserving essential and user files', () => {
    const tmpDestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-clean-packs-test-'));

    // Create mock skills in destination
    fs.mkdirSync(path.join(tmpDestDir, 'ami-plan-feature'), { recursive: true });
    fs.mkdirSync(path.join(tmpDestDir, 'ami-optimize-sql'), { recursive: true });
    fs.mkdirSync(path.join(tmpDestDir, 'ami-design-ux'), { recursive: true });
    fs.mkdirSync(path.join(tmpDestDir, 'my-custom-skill'), { recursive: true });

    // Allowed skills: only essential pack skills (which contains ami-plan-feature, but NOT ami-optimize-sql or ami-design-ux)
    const essentialCaps = getAllPackCapabilities(['essential']);
    const deleted = cleanUnselectedPackFiles(tmpDestDir, essentialCaps.skills);

    assert.ok(deleted.includes('ami-optimize-sql'));
    assert.ok(deleted.includes('ami-design-ux'));
    assert.ok(!deleted.includes('ami-plan-feature'));
    assert.ok(!deleted.includes('my-custom-skill'));

    // Verify physical file system state
    assert.ok(fs.existsSync(path.join(tmpDestDir, 'ami-plan-feature')), 'essential skill must remain');
    assert.ok(fs.existsSync(path.join(tmpDestDir, 'my-custom-skill')), 'user custom skill must NEVER be deleted');
    assert.ok(!fs.existsSync(path.join(tmpDestDir, 'ami-optimize-sql')), 'deselected data skill must be pruned');
    assert.ok(!fs.existsSync(path.join(tmpDestDir, 'ami-design-ux')), 'deselected ui skill must be pruned');

    fs.rmSync(tmpDestDir, { recursive: true, force: true });
  });

  test('cleanUnselectedPackFiles cleanly prunes agent files (.md and .toml) while preserving user custom agents', () => {
    const tmpAgentsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-clean-agents-test-'));

    fs.writeFileSync(path.join(tmpAgentsDir, 'ami-tech-lead.md'), '# Tech Lead');
    fs.writeFileSync(path.join(tmpAgentsDir, 'ami-data-scientist.md'), '# Data Scientist');
    fs.writeFileSync(path.join(tmpAgentsDir, 'my-own-agent.md'), '# User Agent');

    const essentialCaps = getAllPackCapabilities(['essential']);
    const deleted = cleanUnselectedPackFiles(tmpAgentsDir, essentialCaps.agents.map(a => `${a}.md`));

    assert.ok(deleted.includes('ami-data-scientist.md'));
    assert.ok(!deleted.includes('ami-tech-lead.md'));
    assert.ok(!deleted.includes('my-own-agent.md'));

    assert.ok(fs.existsSync(path.join(tmpAgentsDir, 'ami-tech-lead.md')));
    assert.ok(fs.existsSync(path.join(tmpAgentsDir, 'my-own-agent.md')));
    assert.ok(!fs.existsSync(path.join(tmpAgentsDir, 'ami-data-scientist.md')));

    fs.rmSync(tmpAgentsDir, { recursive: true, force: true });
  });

});
