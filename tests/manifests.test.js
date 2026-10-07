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

  test('codex/agents/*.toml are generated, match source agents, and use normalized LF', () => {
    const rootDir = path.resolve(__dirname, '..');
    const sourceAgentsDir = path.join(rootDir, 'agents');
    const codexAgentsDir = path.join(rootDir, 'codex/agents');

    assert.ok(fs.existsSync(codexAgentsDir), 'codex/agents directory must exist');
    const sourceAgents = fs.readdirSync(sourceAgentsDir).filter(f => f.startsWith('ami-') && f.endsWith('.md'));
    const codexAgents = fs.readdirSync(codexAgentsDir).filter(f => f.startsWith('ami-') && f.endsWith('.toml'));

    assert.strictEqual(codexAgents.length, sourceAgents.length);
    assert.strictEqual(codexAgents.length, 11);

    for (const sourceFile of sourceAgents) {
      const tomlFile = `${path.basename(sourceFile, '.md')}.toml`;
      const tomlPath = path.join(codexAgentsDir, tomlFile);
      assert.ok(fs.existsSync(tomlPath), `Expected ${tomlFile} to exist`);

      const content = fs.readFileSync(tomlPath, 'utf8');
      assert.ok(content.includes('name = "ami-'), 'Must declare valid name');
      assert.ok(content.includes('description = '), 'Must declare description');
      assert.ok(content.includes('developer_instructions = '), 'Must declare developer_instructions');
      assert.strictEqual(content.includes('\\r\\n'), false, 'developer_instructions must not contain escaped \\r\\n');
    }
  });

  test('codex/skills/ are synchronized and match source skills', () => {
    const rootDir = path.resolve(__dirname, '..');
    const sourceSkillsDir = path.join(rootDir, 'skills');
    const codexSkillsDir = path.join(rootDir, 'codex/skills');

    assert.ok(fs.existsSync(codexSkillsDir), 'codex/skills directory must exist');
    const sourceSkills = fs.readdirSync(sourceSkillsDir).filter(f => f.startsWith('ami-'));
    const codexSkills = fs.readdirSync(codexSkillsDir).filter(f => f.startsWith('ami-'));

    assert.strictEqual(codexSkills.length, sourceSkills.length);
    assert.strictEqual(codexSkills.length, 25);
  });

});
