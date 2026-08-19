const { test, describe } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('Universal Hook Scripts Compatibility Tests', () => {

  const preScript = path.resolve(__dirname, '../hooks/scripts/ami-pre-tool-use.js');
  const postScript = path.resolve(__dirname, '../hooks/scripts/ami-post-tool-use.js');

  test('ami-pre-tool-use.js should trigger reminders when using Antigravity toolCall.args.CommandLine parameter and emit valid stdout JSON', () => {
    const inputPayload = JSON.stringify({
      toolCall: {
        name: 'run_command',
        args: {
          CommandLine: 'git push origin main'
        }
      }
    });

    const result = spawnSync('node', [preScript], {
      input: inputPayload,
      encoding: 'utf8'
    });

    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stderr.includes('Reminder: Run push-assistant agent before pushing code.'), true);
    const stdoutJson = JSON.parse(result.stdout.trim());
    assert.deepStrictEqual(stdoutJson, { decision: 'allow' });
  });

  test('ami-pre-tool-use.js should trigger reminders when using Claude Code command parameter and emit valid stdout JSON', () => {
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
    const stdoutJson = JSON.parse(result.stdout.trim());
    assert.deepStrictEqual(stdoutJson, { decision: 'allow' });
  });

  test('ami-pre-tool-use.js should exit 0 and emit valid stdout JSON even on malformed input', () => {
    const result = spawnSync('node', [preScript], {
      input: 'not-valid-json',
      encoding: 'utf8'
    });

    assert.strictEqual(result.status, 0);
    const stdoutJson = JSON.parse(result.stdout.trim());
    assert.deepStrictEqual(stdoutJson, { decision: 'allow' });
  });

  test('ami-post-tool-use.js should detect debug statements using Antigravity toolCall.args.TargetFile parameter and emit valid stdout JSON', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-post-test-'));
    const tmpFile = path.join(tmpDir, 'test-file.js');
    fs.writeFileSync(tmpFile, 'function test() { console.log("debug"); }');

    const inputPayload = JSON.stringify({
      toolCall: {
        name: 'write_to_file',
        args: {
          TargetFile: tmpFile
        }
      }
    });

    const result = spawnSync('node', [postScript], {
      input: inputPayload,
      encoding: 'utf8'
    });

    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stderr.includes('Warning: Detected debug statements or TODOs in modified lines of'), true);
    const stdoutJson = JSON.parse(result.stdout.trim());
    assert.deepStrictEqual(stdoutJson, { decision: 'allow' });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('ami-post-tool-use.js should detect debug statements using Antigravity toolCall.args.AbsolutePath parameter', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-post-test-2-'));
    const tmpFile = path.join(tmpDir, 'test-file-2.js');
    fs.writeFileSync(tmpFile, 'const x = 1; // TODO: implement later');

    const inputPayload = JSON.stringify({
      toolCall: {
        name: 'replace_file_content',
        args: {
          AbsolutePath: tmpFile
        }
      }
    });

    const result = spawnSync('node', [postScript], {
      input: inputPayload,
      encoding: 'utf8'
    });

    assert.strictEqual(result.status, 0);
    assert.strictEqual(result.stderr.includes('Warning: Detected debug statements or TODOs in modified lines of'), true);
    const stdoutJson = JSON.parse(result.stdout.trim());
    assert.deepStrictEqual(stdoutJson, { decision: 'allow' });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('ami-post-tool-use.js should exit 0 and emit valid stdout JSON even on malformed input', () => {
    const result = spawnSync('node', [postScript], {
      input: 'not-valid-json',
      encoding: 'utf8'
    });

    assert.strictEqual(result.status, 0);
    const stdoutJson = JSON.parse(result.stdout.trim());
    assert.deepStrictEqual(stdoutJson, { decision: 'allow' });
  });

});
