const test = require('node:test');
const assert = require('node:assert');
const {
  translateTools,
  translateFrontmatter,
  hasWriteCapabilities
} = require('../adapters/capability_translator.js');

test('Cross-Platform Capability Translator Unit Tests', async (t) => {
  await t.test('translateTools for Claude Code translates tokens into PascalCase Claude tools', () => {
    const input = 'Write, Edit, Bash, Read, Grep, Glob, WebSearch, WebFetch, Agent';
    const translated = translateTools(input, 'claude');
    assert.deepStrictEqual(translated, [
      'Write',
      'Edit',
      'Bash',
      'Read',
      'Grep',
      'Glob',
      'WebSearch',
      'WebFetch',
      'Agent'
    ]);

    // Reverse snake_case input should also translate cleanly into Claude Code tools
    const snakeInput = ['write_to_file', 'replace_file_content', 'run_command', 'view_file', 'grep_search', 'search_web'];
    const fromSnake = translateTools(snakeInput, 'claude');
    assert.deepStrictEqual(fromSnake, [
      'Write',
      'Edit',
      'Bash',
      'Read',
      'Grep',
      'WebSearch'
    ]);
  });

  await t.test('translateTools for Antigravity translates tokens into snake_case Antigravity tools', () => {
    const input = 'Write, Edit, Bash, Read, Grep, Agent';
    const translated = translateTools(input, 'antigravity');
    assert.deepStrictEqual(translated, [
      'write_to_file',
      'replace_file_content',
      'multi_replace_file_content',
      'run_command',
      'manage_task',
      'view_file',
      'grep_search',
      'invoke_subagent',
      'send_message',
      'define_subagent'
    ]);
  });

  await t.test('translateTools preserves unknown, custom, or MCP tools (passthrough)', () => {
    const input = 'Write, custom_mcp_tool, Bash, third_party_scanner';
    const forClaude = translateTools(input, 'claude');
    assert.ok(forClaude.includes('custom_mcp_tool'));
    assert.ok(forClaude.includes('third_party_scanner'));

    const forAntigravity = translateTools(input, 'antigravity');
    assert.ok(forAntigravity.includes('custom_mcp_tool'));
    assert.ok(forAntigravity.includes('third_party_scanner'));
  });

  await t.test('translateTools deduplicates mapped tools cleanly', () => {
    const input = 'Write, write_to_file, Edit, replace_file_content, multi_replace_file_content';
    const forClaude = translateTools(input, 'claude');
    assert.deepStrictEqual(forClaude, ['Write', 'Edit']);

    const forAntigravity = translateTools(input, 'antigravity');
    assert.deepStrictEqual(forAntigravity, ['write_to_file', 'replace_file_content', 'multi_replace_file_content']);
  });

  await t.test('hasWriteCapabilities accurately detects write abilities across platforms', () => {
    assert.strictEqual(hasWriteCapabilities('Bash, Read, Grep'), false);
    assert.strictEqual(hasWriteCapabilities('Bash, Read, Grep, WebSearch'), false);
    assert.strictEqual(hasWriteCapabilities('Bash, Read, Grep, Write'), true);
    assert.strictEqual(hasWriteCapabilities('Bash, Read, Grep, Edit'), true);
    assert.strictEqual(hasWriteCapabilities('view_file, grep_search, write_to_file'), true);
    assert.strictEqual(hasWriteCapabilities(['view_file', 'replace_file_content']), true);
  });

  await t.test('translateFrontmatter transforms inline allowed-tools for Claude Code', () => {
    const markdown = [
      '---',
      'name: ami-test-agent',
      'description: A test subagent.',
      'allowed-tools: write_to_file, replace_file_content, run_command, view_file',
      '---',
      '# System Prompt',
      'You are a test agent.'
    ].join('\n');

    const result = translateFrontmatter(markdown, 'claude');
    assert.ok(result.includes('allowed-tools: Write, Edit, Bash, Read'));
    assert.ok(result.includes('# System Prompt'));
    assert.ok(result.includes('name: ami-test-agent'));
  });

  await t.test('translateFrontmatter transforms inline allowed-tools for Antigravity', () => {
    const markdown = [
      '---',
      'name: ami-test-agent',
      'description: A test subagent.',
      'allowed-tools: Write, Edit, Bash, Read',
      '---',
      '# System Prompt',
      'You are a test agent.'
    ].join('\r\n');

    const result = translateFrontmatter(markdown, 'antigravity');
    assert.ok(result.includes('allowed-tools: write_to_file, replace_file_content, multi_replace_file_content, run_command, manage_task, view_file'));
    assert.ok(result.includes('\r\n')); // Preserves CRLF
  });

  await t.test('translateFrontmatter handles YAML multiline array format', () => {
    const markdown = [
      '---',
      'name: ami-yaml-list-agent',
      'description: Agent with list frontmatter.',
      'tools:',
      '  - Write',
      '  - Edit',
      '  - Read',
      '---',
      'Content'
    ].join('\n');

    const result = translateFrontmatter(markdown, 'antigravity');
    assert.ok(result.includes('tools: write_to_file, replace_file_content, multi_replace_file_content, view_file'));
    assert.ok(result.includes('name: ami-yaml-list-agent'));
  });
});
