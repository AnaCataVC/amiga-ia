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
              { "type": "command", "command": "powershell -NoProfile -File \"C:\\Users\\anaca\\.claude\\hooks\\precheck.ps1\"" }
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

  test('should exclude SessionStart hook when options.includeSessionStart is false', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-test-'));
    const testSettingsPath = path.join(tmpDir, 'settings.json');
    const sourceHooksPath = path.resolve('hooks.json');

    fs.writeFileSync(testSettingsPath, '{}');

    const result = mergeSettingsFunc(fs, path, testSettingsPath, sourceHooksPath, { includeSessionStart: false });
    assert.strictEqual(result, true);

    const updatedData = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));
    assert.strictEqual(updatedData.hooks.SessionStart, undefined);
    assert.notStrictEqual(updatedData.hooks.PreToolUse, undefined);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should preserve user custom SessionStart hooks when options.includeSessionStart is false and remove only Amiga SessionStart hook', () => {
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

    const result = mergeSettingsFunc(fs, path, testSettingsPath, sourceHooksPath, { includeSessionStart: false });
    assert.strictEqual(result, true);

    const updatedData = JSON.parse(fs.readFileSync(testSettingsPath, 'utf8'));
    assert.strictEqual(updatedData.hooks.SessionStart.length, 1);
    assert.strictEqual(updatedData.hooks.SessionStart[0].hooks[0].command, 'node my-custom-tracker.js');
    assert.notStrictEqual(updatedData.hooks.PreToolUse, undefined);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});
