const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const SessionStateStore = require('../agent/session_state.js');

describe('SessionStateStore Unit Tests', () => {

  test('should create .amiga-ia/session-state.json in specified workspace', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-state-test-'));
    const store = new SessionStateStore(tmpDir);

    const stateFile = path.join(tmpDir, '.amiga-ia', 'session-state.json');
    assert.ok(fs.existsSync(stateFile));

    const state = store.loadState();
    assert.ok(Array.isArray(state.pendingTasks));
    assert.ok(Array.isArray(state.completedTasks));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should add and complete tasks correctly', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-state-test-'));
    const store = new SessionStateStore(tmpDir);

    store.addPendingTask('Implement feature X');
    let state = store.loadState();
    assert.strictEqual(state.pendingTasks.length, 1);
    assert.strictEqual(state.pendingTasks[0].description, 'Implement feature X');

    const taskId = state.pendingTasks[0].id;
    store.completeTask(taskId);

    state = store.loadState();
    assert.strictEqual(state.pendingTasks.length, 0);
    assert.strictEqual(state.completedTasks.length, 1);
    assert.strictEqual(state.completedTasks[0].id, taskId);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should check and add .amiga-ia/ and docs/coding-sessions/ to .gitignore', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amiga-state-test-'));
    const gitignorePath = path.join(tmpDir, '.gitignore');
    fs.writeFileSync(gitignorePath, 'node_modules/\n');

    const store = new SessionStateStore(tmpDir);

    assert.strictEqual(store.isGitIgnored(), false);
    assert.strictEqual(store.isPathGitIgnored('docs/coding-sessions/'), false);

    store.addToGitIgnore('.amiga-ia/', 'Amiga IA local session state');
    store.addToGitIgnore('docs/coding-sessions/', 'Amiga IA session summaries');

    assert.strictEqual(store.isGitIgnored(), true);
    assert.strictEqual(store.isPathGitIgnored('docs/coding-sessions/'), true);

    const updatedGitIgnore = fs.readFileSync(gitignorePath, 'utf8');
    assert.ok(updatedGitIgnore.includes('.amiga-ia/'));
    assert.ok(updatedGitIgnore.includes('docs/coding-sessions/'));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

});
