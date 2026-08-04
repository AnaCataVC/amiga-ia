const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const UniversalAdapter = require('../adapters/universal_adapter.js');

describe('UniversalAdapter Unit Tests', () => {

  test('should generate valid skills XML for temporary skills directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-adapter-test-'));
    const skillSubDir = path.join(tmpDir, 'ami-test-skill');
    fs.mkdirSync(skillSubDir, { recursive: true });

    const skillContent = `---
name: ami-test-skill
description: A test skill for adapter unit testing.
allowed-tools: view_file, run_command
---

# Test Skill Content
`;

    fs.writeFileSync(path.join(skillSubDir, 'SKILL.md'), skillContent);

    const adapter = new UniversalAdapter('antigravity');
    const xml = adapter.generateSkillsXml(tmpDir);

    assert.ok(xml.includes('<available_skills'));
    assert.ok(xml.includes('name="ami-test-skill"'));
    assert.ok(xml.includes('A test skill for adapter unit testing.'));
    assert.ok(xml.includes('</available_skills>'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should return empty string if skills directory does not exist', () => {
    const adapter = new UniversalAdapter('claude');
    const xml = adapter.generateSkillsXml('/non/existent/path/for/amiga/test');
    assert.strictEqual(xml, '');
  });

  test('should generate valid agents XML for agents directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-agent-test-'));
    const agentContent = `---
name: ami-test-agent
description: A test agent.
---

# Test Agent System Prompt
`;

    fs.writeFileSync(path.join(tmpDir, 'ami-test-agent.md'), agentContent);

    const adapter = new UniversalAdapter('antigravity');
    const xml = adapter.generateAgentsXml(tmpDir);

    assert.ok(xml.includes('<available_agents'));
    assert.ok(xml.includes('name="ami-test-agent"'));
    assert.ok(xml.includes('A test agent.'));
    assert.ok(xml.includes('</available_agents>'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should compile full system prompt correctly', () => {
    const adapter = new UniversalAdapter('antigravity');
    const systemPrompt = adapter.getSystemPrompt(path.resolve('skills'), path.resolve('agents'));
    
    assert.ok(systemPrompt.includes('You are operating in the antigravity environment.'));
    assert.ok(systemPrompt.includes('<available_skills'));
    assert.ok(systemPrompt.includes('<available_agents'));
  });

});
