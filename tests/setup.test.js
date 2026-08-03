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
const isNewerVersionFunc = new Function('current', 'latest', `
  ${setupCode.slice(setupCode.indexOf('function isNewerVersion'), setupCode.indexOf('function getLatestNpmVersion'))}
  return isNewerVersion(current, latest);
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
