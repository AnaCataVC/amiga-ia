const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

describe('Skills & Agents Emoji Hygiene Tests', () => {
  const rootDir = path.resolve(__dirname, '..');
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

  function getMarkdownFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  test('all skills must be completely free of emojis', () => {
    const skillsDir = path.join(rootDir, 'skills');
    const files = getMarkdownFiles(skillsDir);
    assert.ok(files.length > 0, 'Should find skills markdown files');

    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const matches = line.match(emojiRegex);
        if (matches) {
          violations.push({
            file: path.relative(rootDir, file),
            line: index + 1,
            emojis: Array.from(new Set(matches)),
            text: line.trim()
          });
        }
      });
    }

    assert.deepStrictEqual(
      violations,
      [],
      `Found emojis in skills files:\n${violations.map(v => `  - ${v.file}:${v.line} [${v.emojis.join(' ')}] -> ${v.text}`).join('\n')}`
    );
  });

  test('all agents must be completely free of emojis', () => {
    const agentsDir = path.join(rootDir, 'agents');
    const files = getMarkdownFiles(agentsDir);
    assert.ok(files.length > 0, 'Should find agent markdown files');

    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const matches = line.match(emojiRegex);
        if (matches) {
          violations.push({
            file: path.relative(rootDir, file),
            line: index + 1,
            emojis: Array.from(new Set(matches)),
            text: line.trim()
          });
        }
      });
    }

    assert.deepStrictEqual(
      violations,
      [],
      `Found emojis in agent files:\n${violations.map(v => `  - ${v.file}:${v.line} [${v.emojis.join(' ')}] -> ${v.text}`).join('\n')}`
    );
  });
});
