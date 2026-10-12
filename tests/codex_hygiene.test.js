/**
 * @file tests/codex_hygiene.test.js
 * @description Comprehensive Cleanroom Black-Box test suite verifying tri-ecosystem Codex compatibility,
 * runtime neutralization, capability translation, manifest generation, and TOML schema validity.
 *
 * Contract Baseline: docs/contracts/codex-semantic-compiler.contract.md
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Target modules under test
const {
  translateTools,
  translateFrontmatter
} = require('../adapters/capability_translator.js');
const {
  buildManifests,
  resolveCodexSkillReferences
} = require('../scripts/build-manifests.js');

// Constants defined by Contract
const FORBIDDEN_TOOL_NAMES = [
  'write_to_file',
  'replace_file_content',
  'multi_replace_file_content',
  'view_file',
  'grep_search',
  'find_by_name',
  'list_dir',
  'invoke_subagent',
  'ask_question'
];

const READ_ONLY_AGENTS = [
  'ami-repo-auditor.toml',
  'ami-pr-reviewer.toml',
  'ami-push-assistant.toml',
  'ami-expert-council.toml',
  'ami-adversarial-verifier.toml'
];

const WRITE_ENABLED_AGENTS = [
  'ami-cleanroom-builder.toml',
  'ami-cleanroom-tester.toml',
  'ami-data-scientist.toml',
  'ami-doc-architect.toml',
  'ami-pr-publisher.toml',
  'ami-release-manager.toml',
  'ami-tech-lead.toml'
];

const ALL_EXPECTED_AGENTS = [
  ...READ_ONLY_AGENTS,
  ...WRITE_ENABLED_AGENTS
].sort();

const CODEX_DIR = path.resolve(__dirname, '..', 'codex');
const CODEX_AGENTS_DIR = path.join(CODEX_DIR, 'agents');
const CODEX_SKILLS_DIR = path.join(CODEX_DIR, 'skills');

/**
 * Recursively retrieves all file paths under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function collectFilesRecursively(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Zero-dependency TOML validator and parser for Codex agent TOML files.
 * @param {string} content
 * @param {string} filePath
 * @returns {Record<string, string | boolean>}
 */
function parseAgentToml(content, filePath) {
  assert.ok(typeof content === 'string', `${filePath} content must be a string`);
  assert.ok(content.trim().length > 0, `${filePath} content must not be empty`);

  // Contract Section 5.1: Clean LF line endings without Windows CRLF
  assert.strictEqual(
    content.includes('\r\n'),
    false,
    `${filePath} must use clean LF (\\n) line endings without CRLF (\\r\\n)`
  );

  const parsed = {};
  const lines = content.split('\n');
  let currentKey = null;
  let inMultiLineString = false;
  let multiLineBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inMultiLineString) {
      if (line.includes('"""')) {
        const closeIdx = line.indexOf('"""');
        multiLineBuffer.push(line.slice(0, closeIdx));
        parsed[currentKey] = multiLineBuffer.join('\n');
        inMultiLineString = false;
        currentKey = null;
        const remaining = line.slice(closeIdx + 3).trim();
        if (remaining.length > 0 && !remaining.startsWith('#')) {
          throw new Error(
            `Unexpected content after closing quotes at line ${i + 1} in ${filePath}: ${remaining}`
          );
        }
      } else {
        multiLineBuffer.push(line);
      }
      continue;
    }

    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) {
      throw new Error(
        `Invalid TOML key-value syntax at line ${i + 1} in ${filePath}: "${line}"`
      );
    }

    const key = line.slice(0, eqIdx).trim();
    const rawVal = line.slice(eqIdx + 1).trim();

    if (!/^[A-Za-z0-9_-]+$/.test(key)) {
      throw new Error(
        `Invalid TOML key name "${key}" at line ${i + 1} in ${filePath}`
      );
    }

    if (rawVal.startsWith('"""')) {
      const rest = rawVal.slice(3);
      if (rest.includes('"""')) {
        const closeIdx = rest.indexOf('"""');
        parsed[key] = rest.slice(0, closeIdx);
      } else {
        inMultiLineString = true;
        currentKey = key;
        multiLineBuffer = [rest];
      }
    } else if (rawVal.startsWith('"')) {
      if (!rawVal.endsWith('"') || rawVal.length < 2) {
        throw new Error(
          `Unterminated basic string for key "${key}" at line ${i + 1} in ${filePath}`
        );
      }
      const inner = rawVal.slice(1, -1);
      // Validate escapes and control characters
      for (let c = 0; c < inner.length; c++) {
        if (inner[c] === '\\') {
          const next = inner[c + 1];
          if (!next || !['"', '\\', 'b', 'f', 'n', 'r', 't', 'u', 'U'].includes(next)) {
            throw new Error(
              `Invalid escape sequence \\${next || ''} in key "${key}" at line ${i + 1} in ${filePath}`
            );
          }
          c++;
        } else {
          const code = inner.charCodeAt(c);
          if (code < 0x20 && code !== 0x09) {
            throw new Error(
              `Unescaped control character 0x${code.toString(16)} in key "${key}" at line ${i + 1} in ${filePath}`
            );
          }
        }
      }
      parsed[key] = inner;
    } else if (rawVal.startsWith("'")) {
      if (!rawVal.endsWith("'") || rawVal.length < 2) {
        throw new Error(
          `Unterminated literal string for key "${key}" at line ${i + 1} in ${filePath}`
        );
      }
      parsed[key] = rawVal.slice(1, -1);
    } else if (rawVal === 'true' || rawVal === 'false') {
      parsed[key] = rawVal === 'true';
    } else {
      throw new Error(
        `Unsupported or invalid TOML value "${rawVal}" for key "${key}" at line ${i + 1} in ${filePath}`
      );
    }
  }

  if (inMultiLineString) {
    throw new Error(`Unterminated multi-line string for key "${currentKey}" in ${filePath}`);
  }

  return parsed;
}

describe('Contract: Codex Semantic Compiler & Runtime Neutralization', () => {

  describe('2.1 Capability Translator (adapters/capability_translator.js)', () => {

    it('Scenario 1: translateTools("codex") produces clean abstract capabilities and excludes Antigravity identifiers', () => {
      const inputTools = [
        'Bash',
        'Read',
        'Grep',
        'Write',
        'Edit',
        'Agent',
        'write_to_file',
        'replace_file_content',
        'invoke_subagent',
        'view_file'
      ];

      const translated = translateTools(inputTools, 'codex');

      assert.ok(Array.isArray(translated), 'Output must be an array');
      assert.ok(translated.length > 0, 'Output must not be empty');

      // Assert ZERO Antigravity-specific identifiers in translated output
      for (const forbidden of FORBIDDEN_TOOL_NAMES) {
        assert.strictEqual(
          translated.includes(forbidden),
          false,
          `Translated tools for codex MUST NOT contain Antigravity identifier "${forbidden}"`
        );
      }

      // Assert return items are clean abstract capabilities
      for (const tool of translated) {
        assert.strictEqual(typeof tool, 'string', 'Each tool item must be a string');
        assert.ok(tool.length > 0, 'Tool name must not be empty');
      }

      // Assert deduplication
      const uniqueTools = new Set(translated);
      assert.strictEqual(
        uniqueTools.size,
        translated.length,
        'Translated tools must be deduplicated'
      );
    });

    it('Scenario 2: translateTools rejects invalid/unsupported platform targets with matching error', () => {
      const invalidPlatforms = ['unsupported-target', 'unknown-platform', 'invalid', 'foo'];

      for (const platform of invalidPlatforms) {
        assert.throws(
          () => translateTools(['Read', 'Write'], platform),
          /unsupported platform/i,
          `Expected translateTools to throw /unsupported platform/i for platform "${platform}"`
        );
      }
    });

    it('translateTools accepts comma-separated string inputs and empty arrays', () => {
      const stringResult = translateTools('Read, Write, Bash', 'codex');
      assert.ok(Array.isArray(stringResult), 'String input should return an array');

      const emptyResult = translateTools([], 'codex');
      assert.deepStrictEqual(emptyResult, [], 'Empty array should return empty array');
    });

    it('translateFrontmatter processes markdown with YAML frontmatter for codex platform', () => {
      const sampleMarkdown = [
        '---',
        'name: test-agent',
        'allowed-tools:',
        '  - write_to_file',
        '  - replace_file_content',
        '  - view_file',
        '---',
        '# Agent Instructions',
        'Neutral instructions here.'
      ].join('\n');

      const translated = translateFrontmatter(sampleMarkdown, 'codex');
      assert.ok(typeof translated === 'string', 'translateFrontmatter must return string');

      // Assert no forbidden tool names in frontmatter
      for (const forbidden of FORBIDDEN_TOOL_NAMES) {
        assert.strictEqual(
          translated.includes(forbidden),
          false,
          `translateFrontmatter for codex must not include "${forbidden}"`
        );
      }
    });
  });

  describe('2.2 Semantic Manifest Engine Public Interface (scripts/build-manifests.js)', () => {

    it('exports buildManifests and resolveCodexSkillReferences as functions', () => {
      assert.strictEqual(
        typeof buildManifests,
        'function',
        'buildManifests must be exported as a function'
      );
      assert.strictEqual(
        typeof resolveCodexSkillReferences,
        'function',
        'resolveCodexSkillReferences must be exported as a function'
      );
    });

    it('resolveCodexSkillReferences replaces canonical skill references with __AMIGA_CODEX_SKILLS_DIR__ placeholders', () => {
      const validSkills = new Set(['ami-plan-feature', 'ami-create-tests', 'ami-scan-tech-debt']);

      const proseInput = [
        'Please refer to skills/ami-plan-feature/SKILL.md before proceeding.',
        'Then inspect ~/.agents/skills/ami-create-tests/SKILL.md for test generation.'
      ].join('\n');

      const resolved = resolveCodexSkillReferences(proseInput, validSkills, 'test-source.md');

      assert.strictEqual(
        resolved.includes('skills/ami-plan-feature/SKILL.md'),
        false,
        'Raw skills/ path must be replaced'
      );
      assert.strictEqual(
        resolved.includes('~/.agents/skills/ami-create-tests/SKILL.md'),
        false,
        'Raw ~/.agents/skills/ path must be replaced'
      );
      assert.ok(
        resolved.includes('__AMIGA_CODEX_SKILLS_DIR__/ami-plan-feature/SKILL.md'),
        'Must contain __AMIGA_CODEX_SKILLS_DIR__/ami-plan-feature/SKILL.md'
      );
      assert.ok(
        resolved.includes('__AMIGA_CODEX_SKILLS_DIR__/ami-create-tests/SKILL.md'),
        'Must contain __AMIGA_CODEX_SKILLS_DIR__/ami-create-tests/SKILL.md'
      );
    });

    it('resolveCodexSkillReferences normalizes CRLF line endings to clean LF', () => {
      const validSkills = new Set(['ami-plan-feature']);
      const crlfInput = 'Line 1\r\nRefer to skills/ami-plan-feature/SKILL.md\r\nLine 3\r\n';

      const resolved = resolveCodexSkillReferences(crlfInput, validSkills, 'test-crlf.md');
      assert.strictEqual(resolved.includes('\r\n'), false, 'Line endings must be normalized to LF');
    });

    it('resolveCodexSkillReferences throws when referencing an invalid or nonexistent skill', () => {
      const validSkills = new Set(['ami-plan-feature']);
      const invalidReference = 'Inspect skills/ami-nonexistent-skill/SKILL.md for instructions.';

      assert.throws(
        () => resolveCodexSkillReferences(invalidReference, validSkills, 'error-test.md'),
        /nonexistent|missing|ami-nonexistent-skill/i,
        'Must throw an Error indicating missing or nonexistent skill reference'
      );
    });

    it('buildManifests executes successfully and compiles codex artifacts', () => {
      assert.doesNotThrow(
        () => buildManifests(),
        'buildManifests() must execute without throwing errors'
      );
    });
  });

  describe('Scenario 3: Zero-Tool Leakage in Generated Codex Directory', () => {

    it('asserts zero occurrences of forbidden tool names across all files in codex/skills/ and codex/agents/', () => {
      const allCodexFiles = [
        ...collectFilesRecursively(CODEX_AGENTS_DIR),
        ...collectFilesRecursively(CODEX_SKILLS_DIR)
      ];

      assert.ok(
        allCodexFiles.length > 0,
        'codex/ directory must contain generated agent and skill files'
      );

      const violations = [];

      for (const filePath of allCodexFiles) {
        const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        for (const forbidden of FORBIDDEN_TOOL_NAMES) {
          if (content.includes(forbidden)) {
            violations.push({
              file: relativePath,
              tool: forbidden
            });
          }
        }
      }

      assert.strictEqual(
        violations.length,
        0,
        `Forbidden tool names found in generated codex files:\n${violations
          .map((v) => `  - ${v.file}: "${v.tool}"`)
          .join('\n')}`
      );
    });
  });

  describe('Scenario 4 & 5: Codex Agent Sandbox Mode Configuration', () => {

    it('Scenario 4: emits sandbox_mode = "read-only" for read-only agents', () => {
      for (const agentFileName of READ_ONLY_AGENTS) {
        const filePath = path.join(CODEX_AGENTS_DIR, agentFileName);
        assert.ok(
          fs.existsSync(filePath),
          `Expected read-only agent file ${agentFileName} to exist in ${CODEX_AGENTS_DIR}`
        );

        const content = fs.readFileSync(filePath, 'utf8');
        assert.match(
          content,
          /sandbox_mode\s*=\s*["']read-only["']/,
          `Agent ${agentFileName} MUST declare sandbox_mode = "read-only"`
        );
      }
    });

    it('Scenario 5: does NOT emit sandbox_mode = "read-only" for write-enabled agents', () => {
      for (const agentFileName of WRITE_ENABLED_AGENTS) {
        const filePath = path.join(CODEX_AGENTS_DIR, agentFileName);
        assert.ok(
          fs.existsSync(filePath),
          `Expected write-enabled agent file ${agentFileName} to exist in ${CODEX_AGENTS_DIR}`
        );

        const content = fs.readFileSync(filePath, 'utf8');
        assert.doesNotMatch(
          content,
          /sandbox_mode\s*=\s*["']read-only["']/,
          `Agent ${agentFileName} MUST NOT declare sandbox_mode = "read-only"`
        );
      }
    });
  });

  describe('Scenario 6: Skill Path Placeholders in Skill Bodies', () => {

    it('asserts no raw unmapped skill paths remain in codex/skills/', () => {
      const skillFiles = collectFilesRecursively(CODEX_SKILLS_DIR);
      assert.ok(
        skillFiles.length > 0,
        'codex/skills/ must contain generated skill files'
      );

      const rawSkillPathRegex = /(?:~\/\.agents\/skills\/|skills\/)(ami-[a-z0-9-]+)\/SKILL\.md/g;
      const unmappedOccurrences = [];

      for (const filePath of skillFiles) {
        const relativePath = path.relative(path.resolve(__dirname, '..'), filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        let match;
        while ((match = rawSkillPathRegex.exec(content)) !== null) {
          unmappedOccurrences.push({
            file: relativePath,
            match: match[0],
            skill: match[1]
          });
        }
      }

      assert.strictEqual(
        unmappedOccurrences.length,
        0,
        `Raw unmapped skill paths found in codex/skills/:\n${unmappedOccurrences
          .map((u) => `  - ${u.file}: "${u.match}" (skill: ${u.skill})`)
          .join('\n')}`
      );
    });
  });

  describe('Scenario 7: TOML Syntax Validity & Non-Functional Quality Constraints', () => {

    it('verifies all 12 expected agent TOML files exist in codex/agents/', () => {
      const existingFiles = fs.existsSync(CODEX_AGENTS_DIR)
        ? fs.readdirSync(CODEX_AGENTS_DIR).filter((f) => f.endsWith('.toml')).sort()
        : [];

      assert.deepStrictEqual(
        existingFiles,
        ALL_EXPECTED_AGENTS,
        `Expected exactly 12 agent TOML files: ${ALL_EXPECTED_AGENTS.join(', ')}`
      );
    });

    it('validates all 12 codex agent TOML files parse with valid keys and escape syntax', () => {
      for (const agentFileName of ALL_EXPECTED_AGENTS) {
        const filePath = path.join(CODEX_AGENTS_DIR, agentFileName);
        const content = fs.readFileSync(filePath, 'utf8');

        const parsed = parseAgentToml(content, agentFileName);

        // Required keys from Contract Section 2.2
        assert.ok(
          typeof parsed.name === 'string' && parsed.name.trim().length > 0,
          `${agentFileName} must contain non-empty string property "name"`
        );
        assert.ok(
          typeof parsed.description === 'string' && parsed.description.trim().length > 0,
          `${agentFileName} must contain non-empty string property "description"`
        );
        assert.ok(
          typeof parsed.developer_instructions === 'string' &&
            parsed.developer_instructions.trim().length > 0,
          `${agentFileName} must contain non-empty string property "developer_instructions"`
        );

        // Validate name matches file basename
        const expectedBaseName = agentFileName.replace(/\.toml$/, '');
        assert.strictEqual(
          parsed.name,
          expectedBaseName,
          `Property "name" in ${agentFileName} must match filename without extension`
        );
      }
    });

    it('verifies token efficiency: enforces clean LF line endings without Windows CRLF in agent TOML files', () => {
      for (const agentFileName of ALL_EXPECTED_AGENTS) {
        const filePath = path.join(CODEX_AGENTS_DIR, agentFileName);
        const content = fs.readFileSync(filePath, 'utf8');

        assert.strictEqual(
          content.includes('\r\n'),
          false,
          `${agentFileName} violates LF line ending invariant (CRLF detected)`
        );
      }
    });
  });
});
