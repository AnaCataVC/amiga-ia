const { test, describe } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('Universal Hook Scripts Compatibility Tests', () => {

  const preScript = path.resolve(__dirname, '../hooks/scripts/ami-pre-tool-use.js');
  const postScript = path.resolve(__dirname, '../hooks/scripts/ami-post-tool-use.js');

  test('ami-pre-tool-use.js should trigger reminders when using Antigravity CommandLine parameter', () => {
    const inputPayload = JSON.stringify({
      tool_input: {
        CommandLine: 'git push origin main'
      }
    });

    const result = spawnSync('node', [preScript], {
      input: inputPayload,
      encoding: 'utf8'
    });

    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stderr.includes('Reminder: Run push-assistant agent before pushing code.'), true);
  });

  test('ami-pre-tool-use.js should trigger reminders when using Claude Code command parameter', () => {
    const inputPayload = JSON.stringify({
      tool_input: {
        command: 'git commit -m "test"'
      }
    });

    const result = spawnSync('node', [preScript], {
      input: inputPayload,
      encoding: 'utf8'
    });

    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stderr.includes('Reminder: Use commit-assistant for proper commit formatting.'), true);
  });

  test('ami-post-tool-use.js should detect debug statements using Antigravity TargetFile parameter', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-post-test-'));
    const tmpFile = path.join(tmpDir, 'test-file.js');
    fs.writeFileSync(tmpFile, 'function test() { console.log("debug"); }');

    const inputPayload = JSON.stringify({
      tool_input: {
        TargetFile: tmpFile
      }
    });

    const result = spawnSync('node', [postScript], {
      input: inputPayload,
      encoding: 'utf8'
    });

    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stderr.includes('Warning: Detected debug statements or TODOs in modified lines of'), true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});
