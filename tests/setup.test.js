const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Extract mergeSettings logic from setup.js for unit testing
const setupCode = fs.readFileSync(path.join(__dirname, '../bin/setup.js'), 'utf8');
const mergeSettingsFunc = new Function('fs', 'path', 'targetPath', 'sourcePath', 'options', `
  ${setupCode.slice(setupCode.indexOf('function mergeSettings'), setupCode.indexOf('async function main'))}
  return mergeSettings(targetPath, sourcePath, options);
`);
const installNodeHooksFunc = new Function('fs', 'path', '__dirname', 'targetDir', 'settingsPath', 'options', `
  ${setupCode.slice(setupCode.indexOf('function mergeSettings'), setupCode.indexOf('function isNewerVersion'))}
  return installNodeHooks(targetDir, settingsPath, options);
`);
const installPwshHooksFunc = new Function('fs', 'path', '__dirname', 'targetDir', 'settingsPath', 'options', `
  ${setupCode.slice(setupCode.indexOf('function mergeSettings'), setupCode.indexOf('function isNewerVersion'))}
  return installPwshHooks(targetDir, settingsPath, options);
`);
const installBashHooksFunc = new Function('fs', 'path', '__dirname', 'targetDir', 'settingsPath', 'options', `
  ${setupCode.slice(setupCode.indexOf('function mergeSettings'), setupCode.indexOf('function isNewerVersion'))}
  return installBashHooks(targetDir, settingsPath, options);
`);
const isNewerVersionFunc = new Function('current', 'latest', `
  ${setupCode.slice(setupCode.indexOf('function isNewerVersion'), setupCode.indexOf('function getLatestNpmVersion'))}
  return isNewerVersion(current, latest);
`);
const saveVersionManifestFunc = new Function('fs', 'path', 'targetDir', 'version', `
  ${setupCode.slice(setupCode.indexOf('function saveVersionManifest'), setupCode.indexOf('async function runDoctor'))}
  return saveVersionManifest(targetDir, version);
`);
const getInstalledEnvironmentStatusFunc = new Function('fs', 'path', 'targetDir', `
  ${setupCode.slice(setupCode.indexOf('function saveVersionManifest'), setupCode.indexOf('async function runDoctor'))}
  return getInstalledEnvironmentStatus(targetDir);
`);
const removeAmigaHooksFunc = new Function('fs', 'path', 'targetPath', `
  ${setupCode.slice(setupCode.indexOf('function removeAmigaHooks'), setupCode.indexOf('function installNodeHooks'))}
  return removeAmigaHooks(targetPath);
`);

const copyRecursiveSyncFunc = new Function('fs', 'path', 'src', 'dest', 'targetEnv', `
  ${setupCode.slice(setupCode.indexOf('function copyRecursiveSync'), setupCode.indexOf('function cleanOrphanedFiles'))}
  return copyRecursiveSync(src, dest, targetEnv);
`);

describe('Amiga IA setup.js mergeSettings tests', () => {

  test('should abort and return false on invalid JSON target without modifying the file', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-test-'));
    const testSettingsPath = path.join(tmpDir, 'settings.json');
    const sourceHooksPath = path.resolve('hooks.json');
    const invalidJson = '{ invalid json content ...';

    fs.writeFileSync(testSettingsPath, invalidJson);

    const result = mergeSettingsFunc(fs, path, testSettingsPath, sourceHooksPath);
    
    assert.strictEqual(result, false);
    assert.strictEqual(fs.readFileSync(testSettingsPath, 'utf8'), invalidJson);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should purge legacy duplicate hooks, preserve user precheck.ps1, and add exit 0 non-blocking hooks', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-test-'));
    const testSettingsPath = path.join(tmpDir, 'settings.json');
    const sourceHooksPath = path.resolve('hooks.json');

    const mockSettingsWithDuplicates = {
      "model": "opus[1m]",
      "hooks": {
        "PreToolUse": [
          {
            "matcher": "Bash",
            "hooks": [
              { "type": "command", "shell": "bash", "command": "cmd=$(echo $CLAUDE_TOOL_ARGS); commit-assistant" }
            ]
          },
          {
            "matcher": "Bash|PowerShell",
            "hooks": [
              { "type": "command", "command": "powershell -NoProfile -File \"C:\\Users\\testuser\\.claude\\hooks\\precheck.ps1\"" }
            ]
          },
          {
            "matcher": "Bash",
            "hooks": [
              { "type": "command", "shell": "bash", "command": "cmd=$(echo $CLAUDE_TOOL_ARGS); push-assistant" }
            ]
          }
        ]
      }
    };

    fs.writeFileSync(testSettingsPath, JSON.stringify(mockSettingsWithDuplicates, null, 2));

    const result = mergeSettingsFunc(fs, path, testSettingsPath, sourceHooksPath);

    assert.strictEqual(result, true);

    const updatedData = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));

    // Check model preserved
    assert.strictEqual(updatedData.model, 'opus[1m]');

    // Check precheck.ps1 preserved
    const customHookPreserved = updatedData.hooks.PreToolUse.some(h => 
      h.hooks && h.hooks[0]?.command.includes('precheck.ps1')
    );
    assert.strictEqual(customHookPreserved, true);

    // Check dead hooks purged
    const deadHookRemoved = !JSON.stringify(updatedData).includes('CLAUDE_TOOL_ARGS');
    assert.strictEqual(deadHookRemoved, true);

    // Check all hooks are non-blocking exit 0
    const noExit2 = !JSON.stringify(updatedData).includes('exit 2');
    assert.strictEqual(noExit2, true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should not include SessionStart hook when merging settings from source hooks', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-test-'));
    const testSettingsPath = path.join(tmpDir, 'settings.json');
    const sourceHooksPath = path.resolve('hooks.json');

    fs.writeFileSync(testSettingsPath, '{}');

    const result = mergeSettingsFunc(fs, path, testSettingsPath, sourceHooksPath);
    assert.strictEqual(result, true);

    const updatedData = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));
    assert.strictEqual(updatedData.hooks.SessionStart, undefined);
    assert.notStrictEqual(updatedData.hooks.PreToolUse, undefined);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should purge legacy Amiga SessionStart hooks while preserving user custom SessionStart hooks', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-test-'));
    const testSettingsPath = path.join(tmpDir, 'settings.json');
    const sourceHooksPath = path.resolve('hooks.json');

    const mockSettingsWithCustomSession = {
      "hooks": {
        "SessionStart": [
          {
            "hooks": [
              { "type": "command", "command": "node my-custom-tracker.js" }
            ]
          },
          {
            "hooks": [
              { "type": "command", "shell": "bash", "command": "if [ -d 'docs/coding-sessions' ]; then echo test; fi" }
            ]
          }
        ]
      }
    };

    fs.writeFileSync(testSettingsPath, JSON.stringify(mockSettingsWithCustomSession, null, 2));

    const result = mergeSettingsFunc(fs, path, testSettingsPath, sourceHooksPath);
    assert.strictEqual(result, true);

    const updatedData = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));
    assert.strictEqual(updatedData.hooks.SessionStart.length, 1);
    assert.strictEqual(updatedData.hooks.SessionStart[0].hooks[0].command, 'node my-custom-tracker.js');
    assert.notStrictEqual(updatedData.hooks.PreToolUse, undefined);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});

describe('Amiga IA setup.js doctor update detection tests', () => {

  test('should detect when latest version on NPM is newer than current installed version', () => {
    assert.strictEqual(isNewerVersionFunc('3.0.0', '3.1.0'), true);
    assert.strictEqual(isNewerVersionFunc('3.0.0', '4.0.0'), true);
    assert.strictEqual(isNewerVersionFunc('2.9.9', '3.0.0'), true);
    assert.strictEqual(isNewerVersionFunc('0.0.1', '0.0.2'), true);
  });

  test('should return false when current version matches or exceeds latest version on NPM', () => {
    assert.strictEqual(isNewerVersionFunc('3.0.0', '3.0.0'), false);
    assert.strictEqual(isNewerVersionFunc('3.1.0', '3.0.0'), false);
    assert.strictEqual(isNewerVersionFunc('3.0.0-beta.1', '3.0.0'), false);
    assert.strictEqual(isNewerVersionFunc('unknown', '3.0.0'), false);
    assert.strictEqual(isNewerVersionFunc('3.0.0', null), false);
  });

});

describe('Amiga IA setup.js installNodeHooks universal tests', () => {

  test('should install universal Node.js hook scripts and configure matchers for both Claude Code and Antigravity', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-universal-test-'));
    const testSettingsPath = path.join(tmpDir, 'hooks.json');

    const result = installNodeHooksFunc(fs, path, __dirname, tmpDir, testSettingsPath);

    assert.strictEqual(result, true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'hooks', 'ami-pre-tool-use.js')), true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'hooks', 'ami-post-tool-use.js')), true);

    const updatedData = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));
    assert.strictEqual(updatedData.hooks.PreToolUse[0].matcher, 'Bash|PowerShell|run_command');
    assert.strictEqual(updatedData.hooks.PostToolUse[0].matcher, 'Edit|Write|write_to_file|replace_file_content|multi_replace_file_content');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});

describe('Amiga IA setup.js installPwshHooks tests', () => {

  test('should install external PowerShell hook script and configure matchers', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-pwsh-test-'));
    const testSettingsPath = path.join(tmpDir, 'hooks-pwsh.json');

    const result = installPwshHooksFunc(fs, path, __dirname, tmpDir, testSettingsPath);

    assert.strictEqual(result, true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'hooks', 'ami-hooks.ps1')), true);

    const updatedData = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));
    assert.strictEqual(updatedData.hooks.PreToolUse[0].matcher, 'Bash|PowerShell|run_command');
    assert.strictEqual(updatedData.hooks.PostToolUse[0].matcher, 'Edit|Write|write_to_file|replace_file_content|multi_replace_file_content');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});

describe('Amiga IA setup.js installBashHooks tests', () => {

  test('should install external Bash hook script and configure matchers', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-bash-test-'));
    const testSettingsPath = path.join(tmpDir, 'hooks-bash.json');

    const result = installBashHooksFunc(fs, path, __dirname, tmpDir, testSettingsPath);

    assert.strictEqual(result, true);
    assert.strictEqual(fs.existsSync(path.join(tmpDir, 'hooks', 'ami-hooks.sh')), true);

    const updatedData = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));
    assert.strictEqual(updatedData.hooks.PreToolUse[0].matcher, 'Bash|PowerShell|run_command');
    assert.strictEqual(updatedData.hooks.PostToolUse[0].matcher, 'Edit|Write|write_to_file|replace_file_content|multi_replace_file_content');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});

describe('Amiga IA setup.js version manifest and environment tracking tests', () => {

  test('should accurately report status for uninstalled environment', () => {
    const tmpDir = path.join(os.tmpdir(), 'amiga-non-existent-env');
    const status = getInstalledEnvironmentStatusFunc(fs, path, tmpDir);
    assert.strictEqual(status.installed, false);
    assert.strictEqual(status.status, 'Not configured / Not installed');
  });

  test('should detect legacy/untracked installation when skills exist without version manifest', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-legacy-env-'));
    fs.mkdirSync(path.join(tmpDir, 'skills', 'ami-test-skill'), { recursive: true });

    const status = getInstalledEnvironmentStatusFunc(fs, path, tmpDir);
    assert.strictEqual(status.installed, true);
    assert.strictEqual(status.version, 'untracked');
    assert.strictEqual(status.status, 'Legacy / Untracked (installed without version manifest)');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should save and correctly detect installed version manifest in local environment', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-modern-env-'));
    fs.mkdirSync(path.join(tmpDir, 'skills', 'ami-test-skill'), { recursive: true });

    saveVersionManifestFunc(fs, path, tmpDir, '3.3.0');

    const status = getInstalledEnvironmentStatusFunc(fs, path, tmpDir);
    assert.strictEqual(status.installed, true);
    assert.strictEqual(status.version, '3.3.0');
    assert.strictEqual(status.status, 'v3.3.0');
    assert.ok(status.installedAt !== undefined);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should report uninstalled when skills folder is empty or only contains non-Amiga files (even if manifest exists)', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-empty-env-'));
    fs.mkdirSync(path.join(tmpDir, 'skills', 'custom-non-ami-skill'), { recursive: true });
    saveVersionManifestFunc(fs, path, tmpDir, '3.3.0');

    const status = getInstalledEnvironmentStatusFunc(fs, path, tmpDir);
    assert.strictEqual(status.installed, false);
    assert.strictEqual(status.status, 'Not configured / Not installed');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should programmatically remove Amiga IA hooks from settings.json during uninstall', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-hook-remove-test-'));
    const testSettingsPath = path.join(tmpDir, 'settings.json');
    const mockSettings = {
      "model": "opus[1m]",
      "hooks": {
        "PreToolUse": [
          {
            "matcher": "Bash",
            "hooks": [
              { "type": "command", "command": "node C:\\\\users\\\\test\\\\hooks\\\\ami-pre-tool-use.js" }
            ]
          },
          {
            "matcher": "Bash",
            "hooks": [
              { "type": "command", "command": "node my-custom-hook.js" }
            ]
          }
        ],
        "PostToolUse": [
          {
            "matcher": "Edit",
            "hooks": [
              { "type": "command", "command": "node C:\\\\users\\\\test\\\\hooks\\\\ami-post-tool-use.js" }
            ]
          }
        ]
      }
    };
    fs.writeFileSync(testSettingsPath, JSON.stringify(mockSettings, null, 2));

    const result = removeAmigaHooksFunc(fs, path, testSettingsPath);
    assert.strictEqual(result, true);

    const updated = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));
    assert.strictEqual(updated.model, 'opus[1m]');
    assert.strictEqual(updated.hooks.PreToolUse.length, 1);
    assert.strictEqual(updated.hooks.PreToolUse[0].hooks[0].command, 'node my-custom-hook.js');
    assert.strictEqual(updated.hooks.PostToolUse, undefined);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});

describe('Amiga IA setup.js copyRecursiveSync tests', () => {

  test('should replace .gemini/agents/ with .claude/agents/ in markdown files when targetEnv is claude', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-copy-test-'));
    const srcDir = path.join(tmpDir, 'src');
    const destDir = path.join(tmpDir, 'dest');
    fs.mkdirSync(srcDir, { recursive: true });
    
    const testMdPath = path.join(srcDir, 'test-agent.md');
    fs.writeFileSync(testMdPath, 'Local workspace agents can be found in .gemini/agents/ folder.');
    
    copyRecursiveSyncFunc(fs, path, srcDir, destDir, 'claude');
    
    const copiedContent = fs.readFileSync(path.join(destDir, 'test-agent.md'), 'utf8');
    assert.strictEqual(copiedContent, 'Local workspace agents can be found in .claude/agents/ folder.');
    
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should NOT replace .gemini/agents/ in markdown files when targetEnv is antigravity', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-copy-test-2-'));
    const srcDir = path.join(tmpDir, 'src');
    const destDir = path.join(tmpDir, 'dest');
    fs.mkdirSync(srcDir, { recursive: true });
    
    const testMdPath = path.join(srcDir, 'test-agent.md');
    fs.writeFileSync(testMdPath, 'Local workspace agents can be found in .gemini/agents/ folder.');
    
    copyRecursiveSyncFunc(fs, path, srcDir, destDir, 'antigravity');
    
    const copiedContent = fs.readFileSync(path.join(destDir, 'test-agent.md'), 'utf8');
    assert.strictEqual(copiedContent, 'Local workspace agents can be found in .gemini/agents/ folder.');
    
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});
