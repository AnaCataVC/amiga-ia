/**
 * @file tests/install_e2e.test.js
 * @description Comprehensive End-to-End Installation Test Suite for Tri-Ecosystem:
 * - Anthropic Claude Code
 * - Google Antigravity (Gemini)
 * - OpenAI Codex
 *
 * Simulates complete installation workflows in isolated temporary environments,
 * validating physical file tree structure, frontmatter translation, tool isolation,
 * lifecycle hook configuration, and skill cross-referencing.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Extract installation functions from setup.js
const setupPath = path.join(__dirname, '../bin/setup.js');
const setupCode = fs.readFileSync(setupPath, 'utf8');

const { translateFrontmatter } = require('../adapters/capability_translator');

const copyRecursiveSync = (src, dest, targetEnv, options = {}) => {
  const fn = new Function('fs', 'path', 'src', 'dest', 'targetEnv', 'options', 'translateFrontmatter', `
    ${setupCode.slice(setupCode.indexOf('function copyRecursiveSync'), setupCode.indexOf('function cleanOrphanedFiles'))}
    return copyRecursiveSync(src, dest, targetEnv, options);
  `);
  return fn(fs, path, src, dest, targetEnv, options, translateFrontmatter);
};

const mergeSettings = (targetPath, sourcePath, options = {}) => {
  const fn = new Function('fs', 'path', 'targetPath', 'sourcePath', 'options', `
    ${setupCode.slice(setupCode.indexOf('const AMIGA_HOOK_SIGNATURES'), setupCode.indexOf('function removeAmigaHooks'))}
    return mergeSettings(targetPath, sourcePath, options);
  `);
  return fn(fs, path, targetPath, sourcePath, options);
};

const installNodeHooks = (targetDir, settingsPath, options = {}) => {
  const fn = new Function('fs', 'path', '__dirname', 'mergeSettings', 'targetDir', 'settingsPath', 'options', `
    ${setupCode.slice(setupCode.indexOf('function installNodeHooks'), setupCode.indexOf('function installCodexHooks'))}
    return installNodeHooks(targetDir, settingsPath, options);
  `);
  return fn(fs, path, path.join(__dirname, '..', 'bin'), mergeSettings, targetDir, settingsPath, options);
};

const mergeMarkdownBlock = (filePath, blockContent, blockId = 'AMIGA_IA_RULES') => {
  const fn = new Function('fs', 'path', 'os', 'filePath', 'blockContent', 'blockId', `
    ${setupCode.slice(setupCode.indexOf('function mergeMarkdownBlock'), setupCode.indexOf('function hasAmigaItems'))}
    return mergeMarkdownBlock(filePath, blockContent, blockId);
  `);
  return fn(fs, path, os, filePath, blockContent, blockId);
};

const installCodexHooks = (targetCodexDir) => {
  const fn = new Function('fs', 'path', '__dirname', 'mergeSettings', 'targetCodexDir', `
    ${setupCode.slice(setupCode.indexOf('function installCodexHooks'), setupCode.indexOf('function installPwshHooks'))}
    return installCodexHooks(targetCodexDir);
  `);
  return fn(fs, path, path.join(__dirname, '..', 'bin'), mergeSettings, targetCodexDir);
};

const FORBIDDEN_ANTIGRAVITY_TOOLS_IN_CLAUDE = [
  'write_to_file',
  'replace_file_content',
  'multi_replace_file_content',
  'view_file',
  'grep_search',
  'find_by_name',
  'list_dir',
  'invoke_subagent',
  'ask_question',
  'run_command'
];

const FORBIDDEN_CLAUDE_TOOLS_IN_ANTIGRAVITY = [
  'Bash',
  'Read',
  'Write',
  'Edit',
  'Agent'
];

const READ_ONLY_CODEX_AGENTS = [
  'ami-repo-auditor.toml',
  'ami-pr-reviewer.toml',
  'ami-push-assistant.toml',
  'ami-expert-council.toml'
];

const WRITE_ENABLED_CODEX_AGENTS = [
  'ami-cleanroom-builder.toml',
  'ami-cleanroom-tester.toml',
  'ami-data-scientist.toml',
  'ami-doc-architect.toml',
  'ami-pr-publisher.toml',
  'ami-release-manager.toml',
  'ami-tech-lead.toml'
];

/**
 * Recursively retrieves all files under a directory.
 */
function collectFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursively(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Extracts allowed-tools value from YAML frontmatter in a markdown string.
 */
function extractAllowedTools(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return '';
  const allowedToolsMatch = match[1].match(/^(?:allowed-tools|tools):\s*(.*)$/m);
  return allowedToolsMatch ? allowedToolsMatch[1] : '';
}

describe('Tri-Ecosystem End-to-End Installation Test Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const sourceSkillsDir = path.join(rootDir, 'skills');
  const sourceAgentsDir = path.join(rootDir, 'agents');
  const sourceRulesDir = path.join(rootDir, 'rules');
  const sourceCodexSkillsDir = path.join(rootDir, 'codex', 'skills');
  const sourceCodexAgentsDir = path.join(rootDir, 'codex', 'agents');

  describe('1. Anthropic Claude Code E2E Installation', () => {
    it('simulates full Claude Code installation and asserts tool isolation, clean paths, and hook configuration', () => {
      const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-e2e-claude-'));
      const claudeDir = path.join(tmpHome, '.claude');
      const targetSkillsDir = path.join(claudeDir, 'skills');
      const targetAgentsDir = path.join(claudeDir, 'agents');

      // 1. Install skills and agents
      copyRecursiveSync(sourceSkillsDir, targetSkillsDir, 'claude');
      copyRecursiveSync(sourceAgentsDir, targetAgentsDir, 'claude');

      // 2. Install CLAUDE.md rules
      const claudeRuleContent = `## 🤖 Amiga IA Universal Directives\n- Workflow Orchestration.`;
      const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
      const rulesMerged = mergeMarkdownBlock(claudeMdPath, claudeRuleContent, 'AMIGA_IA_RULES');
      assert.strictEqual(rulesMerged, true, 'Claude Code rules merge must return true');

      // 3. Install Node.js hooks
      const claudeSettings = path.join(claudeDir, 'settings.json');
      const hooksMerged = installNodeHooks(claudeDir, claudeSettings, { targetEnv: 'claude' });
      assert.strictEqual(hooksMerged, true, 'Claude Code hooks merge must return true');

      // Assertions
      const installedSkills = collectFilesRecursively(targetSkillsDir);
      const installedAgents = collectFilesRecursively(targetAgentsDir);
      assert.ok(installedSkills.length >= 24, `Expected >= 24 installed skill files, got ${installedSkills.length}`);
      assert.strictEqual(installedAgents.length, 13, `Expected 13 installed agent files, got ${installedAgents.length}`);

      const allMarkdownFiles = [...installedSkills, ...installedAgents];
      for (const file of allMarkdownFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const allowedTools = extractAllowedTools(content);

        // Assert no Antigravity tools leaked into Claude allowed-tools
        for (const forbidden of FORBIDDEN_ANTIGRAVITY_TOOLS_IN_CLAUDE) {
          assert.strictEqual(
            allowedTools.includes(forbidden),
            false,
            `Claude installed file ${path.relative(claudeDir, file)} contains forbidden Antigravity tool "${forbidden}" in allowed-tools: "${allowedTools}"`
          );
        }

        // Assert zero leaked .gemini/agents/ references
        assert.strictEqual(
          content.includes('.gemini/agents/'),
          false,
          `Claude installed file ${path.relative(claudeDir, file)} contains unmigrated ".gemini/agents/" reference`
        );
      }

      // Assert CLAUDE.md rules block exists
      const claudeMdContent = fs.readFileSync(claudeMdPath, 'utf8');
      assert.ok(claudeMdContent.includes('AMIGA_IA_RULES_START:DO_NOT_EDIT'));
      assert.ok(claudeMdContent.includes('Amiga IA Universal Directives'));

      // Assert settings.json contains absolute hook script paths
      const settingsContent = JSON.parse(fs.readFileSync(claudeSettings, 'utf8'));
      assert.ok(settingsContent.hooks && settingsContent.hooks.PreToolUse);
      const preToolUseCmd = settingsContent.hooks.PreToolUse[0].hooks[0].command;
      assert.ok(
        path.isAbsolute(preToolUseCmd.replace(/^node\s+["']?([^"']+)["']?$/, '$1')),
        `Claude hook command must use absolute script path: ${preToolUseCmd}`
      );

      fs.rmSync(tmpHome, { recursive: true, force: true });
    });
  });

  describe('2. Google Antigravity (Gemini) E2E Installation', () => {
    it('simulates full Antigravity installation and asserts tool isolation, rules synchronization, and relative hook paths', () => {
      const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-e2e-antigravity-'));
      const geminiDir = path.join(tmpHome, '.gemini', 'config');
      const targetSkillsDir = path.join(geminiDir, 'skills');
      const targetAgentsDir = path.join(geminiDir, 'agents');
      const targetRulesDir = path.join(geminiDir, 'rules');

      // 1. Install skills and agents
      copyRecursiveSync(sourceSkillsDir, targetSkillsDir, 'antigravity');
      copyRecursiveSync(sourceAgentsDir, targetAgentsDir, 'antigravity');

      // 2. Install rules
      copyRecursiveSync(sourceRulesDir, targetRulesDir, 'antigravity');

      // 3. Install Node.js hooks
      const geminiSettings = path.join(geminiDir, 'hooks.json');
      const hooksMerged = installNodeHooks(geminiDir, geminiSettings, { targetEnv: 'antigravity' });
      assert.strictEqual(hooksMerged, true, 'Antigravity hooks merge must return true');

      // Assertions
      const installedSkills = collectFilesRecursively(targetSkillsDir);
      const installedAgents = collectFilesRecursively(targetAgentsDir);
      const installedRules = collectFilesRecursively(targetRulesDir);

      assert.ok(installedSkills.length >= 24, `Expected >= 24 installed skill files, got ${installedSkills.length}`);
      assert.strictEqual(installedAgents.length, 13, `Expected 13 installed agent files, got ${installedAgents.length}`);
      assert.ok(installedRules.length >= 1, `Expected installed rules, got ${installedRules.length}`);

      const allMarkdownFiles = [...installedSkills, ...installedAgents];
      for (const file of allMarkdownFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const allowedTools = extractAllowedTools(content);

        // Assert no Claude PascalCase tools in Antigravity allowed-tools
        for (const forbidden of FORBIDDEN_CLAUDE_TOOLS_IN_ANTIGRAVITY) {
          const regex = new RegExp(`\\b${forbidden}\\b`);
          assert.strictEqual(
            regex.test(allowedTools),
            false,
            `Antigravity installed file ${path.relative(geminiDir, file)} contains Claude tool "${forbidden}" in allowed-tools: "${allowedTools}"`
          );
        }
      }

      // Assert hooks.json contains relative script paths
      const hooksJsonContent = JSON.parse(fs.readFileSync(geminiSettings, 'utf8'));
      assert.ok(hooksJsonContent.hooks && hooksJsonContent.hooks.PreToolUse);
      const preToolUseCmd = hooksJsonContent.hooks.PreToolUse[0].hooks[0].command;
      const scriptPath = preToolUseCmd.replace(/^node\s+["']?([^"']+)["']?$/, '$1');
      assert.ok(
        !path.isAbsolute(scriptPath) && scriptPath.includes('hooks/ami-pre-tool-use.js'),
        `Antigravity hook command must use relative script path: ${preToolUseCmd}`
      );

      fs.rmSync(tmpHome, { recursive: true, force: true });
    });
  });

  describe('3. OpenAI Codex E2E Installation', () => {
    it('simulates full Codex installation in path with spaces and dollar signs, asserting zero placeholder leaks and resolvable skill paths', () => {
      const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-e2e-$special user-codex-'));
      const codexDir = path.join(tmpHome, '.codex');
      const codexUserSkillsDir = path.join(tmpHome, '.agents', 'skills');
      const targetAgentsDir = path.join(codexDir, 'agents');

      // 1. Install skills and agents
      copyRecursiveSync(sourceCodexSkillsDir, codexUserSkillsDir, 'codex', { codexUserSkillsDir });
      copyRecursiveSync(sourceCodexAgentsDir, targetAgentsDir, 'codex', { codexUserSkillsDir });

      // 2. Install Codex hooks
      const hooksMerged = installCodexHooks(codexDir);
      assert.strictEqual(hooksMerged, true, 'Codex hooks merge must return true');

      // Assertions
      const installedSkills = collectFilesRecursively(codexUserSkillsDir);
      const installedAgents = collectFilesRecursively(targetAgentsDir);

      assert.ok(installedSkills.length >= 24, `Expected >= 24 installed skill files, got ${installedSkills.length}`);
      assert.strictEqual(installedAgents.length, 13, `Expected exactly 13 agent TOML files, got ${installedAgents.length}`);

      const allCodexFiles = [...installedSkills, ...installedAgents];
      const skillRefRegex = /(?:[A-Za-z]:[\\/]|(?:\/[^/\s]+)+[\\/])(ami-[a-z0-9-]+)[\\/]SKILL\.md/g;

      for (const file of allCodexFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // ZERO __AMIGA_CODEX_SKILLS_DIR__ occurrences anywhere
        assert.strictEqual(
          content.includes('__AMIGA_CODEX_SKILLS_DIR__'),
          false,
          `Codex installed file ${path.relative(tmpHome, file)} contains unexpanded __AMIGA_CODEX_SKILLS_DIR__ placeholder!`
        );

        // Every referenced skill path must physically resolve to an existing SKILL.md
        let match;
        while ((match = skillRefRegex.exec(content)) !== null) {
          const referencedSkillName = match[1];
          const targetSkillFile = path.join(codexUserSkillsDir, referencedSkillName, 'SKILL.md');
          assert.ok(
            fs.existsSync(targetSkillFile),
            `Referenced skill "${referencedSkillName}" from ${path.relative(tmpHome, file)} does not exist at ${targetSkillFile}`
          );
        }
      }

      // Assert sandbox_mode = "read-only" in the 4 read-only agents
      for (const roAgent of READ_ONLY_CODEX_AGENTS) {
        const agentFile = path.join(targetAgentsDir, roAgent);
        assert.ok(fs.existsSync(agentFile), `Expected ${roAgent} to exist`);
        const content = fs.readFileSync(agentFile, 'utf8');
        assert.match(
          content,
          /sandbox_mode\s*=\s*["']read-only["']/,
          `${roAgent} must declare sandbox_mode = "read-only"`
        );
      }

      // Assert absence of sandbox_mode in write-enabled agents
      for (const weAgent of WRITE_ENABLED_CODEX_AGENTS) {
        const agentFile = path.join(targetAgentsDir, weAgent);
        assert.ok(fs.existsSync(agentFile), `Expected ${weAgent} to exist`);
        const content = fs.readFileSync(agentFile, 'utf8');
        assert.doesNotMatch(
          content,
          /sandbox_mode\s*=\s*["']read-only["']/,
          `${weAgent} must NOT declare sandbox_mode = "read-only"`
        );
      }

      // Assert hooks.json is valid
      const hooksJsonPath = path.join(codexDir, 'hooks.json');
      assert.ok(fs.existsSync(hooksJsonPath), 'Codex hooks.json must exist');
      const hooksJson = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
      assert.ok(hooksJson.hooks && hooksJson.hooks.PreToolUse && hooksJson.hooks.PostToolUse);

      fs.rmSync(tmpHome, { recursive: true, force: true });
    });
  });
});
