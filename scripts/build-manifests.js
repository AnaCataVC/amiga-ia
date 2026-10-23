const fs = require('fs');
const path = require('path');
const { translateFrontmatter } = require('../adapters/capability_translator');

const READ_ONLY_AGENTS = new Set([
  'ami-repo-auditor',
  'ami-pr-reviewer',
  'ami-expert-council',
  'ami-adversarial-verifier'
]);

function resolveCodexSkillReferences(instructions, skillNames, sourceFile) {
  if (typeof instructions !== 'string') return '';
  return instructions
    .replace(/\r\n/g, '\n')
    .replace(/(?:~\/\.agents\/skills\/|skills\/)(ami-[a-z0-9-]+)\/SKILL\.md/g, (reference, skillName) => {
      if (!skillNames.has(skillName)) {
        throw new Error(`${sourceFile} references missing skill ${skillName}`);
      }
      return `__AMIGA_CODEX_SKILLS_DIR__/${skillName}/SKILL.md`;
    });
}

function parseFrontmatter(content, filename) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`Agent is missing YAML frontmatter: ${filename}`);

  const yamlBlock = match[1];
  const metadata = {};
  const lines = yamlBlock.split(/\r?\n/);
  let currentKey = null;
  let multilineType = null;
  let multilineBuffer = [];

  function flush() {
    if (!currentKey) return;
    if (multilineType === 'array') {
      metadata[currentKey] = multilineBuffer;
    } else if (multilineType === 'pipe') {
      metadata[currentKey] = multilineBuffer.join('\n');
    } else if (multilineType === 'fold' || multilineType === 'indent') {
      metadata[currentKey] = multilineBuffer.join(' ').trim();
    }
    currentKey = null;
    multilineType = null;
    multilineBuffer = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const topKeyMatch = rawLine.match(/^([\w-]+):\s*(.*)$/);
    if (topKeyMatch) {
      flush();
      const key = topKeyMatch[1];
      const val = topKeyMatch[2].trim();

      currentKey = key;
      if (val === '|') {
        multilineType = 'pipe';
      } else if (val === '>') {
        multilineType = 'fold';
      } else if (val === '') {
        multilineType = 'pending';
      } else if (val.startsWith('[') && val.endsWith(']')) {
        metadata[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
        currentKey = null;
      } else {
        let cleanVal = val;
        if ((cleanVal.startsWith('"') && cleanVal.endsWith('"')) || (cleanVal.startsWith("'") && cleanVal.endsWith("'"))) {
          cleanVal = cleanVal.slice(1, -1);
          metadata[key] = cleanVal;
          currentKey = null;
        } else {
          metadata[key] = cleanVal;
          multilineType = 'indent';
          multilineBuffer = [cleanVal];
        }
      }
      continue;
    }

    if (currentKey) {
      const listMatch = rawLine.match(/^\s*-\s+(.*)$/);
      if (listMatch) {
        if (multilineType === 'pending' || multilineType === 'array') {
          multilineType = 'array';
          let item = listMatch[1].trim();
          if ((item.startsWith('"') && item.endsWith('"')) || (item.startsWith("'") && item.endsWith("'"))) {
            item = item.slice(1, -1);
          }
          multilineBuffer.push(item);
          continue;
        }
      }

      const indentMatch = rawLine.match(/^(\s+)(.*)$/);
      if (indentMatch) {
        const lineContent = indentMatch[2].trim();
        if (multilineType === 'pipe') {
          multilineBuffer.push(rawLine.trimStart());
        } else if (multilineType === 'fold' || multilineType === 'indent') {
          multilineBuffer.push(lineContent);
        } else if (multilineType === 'pending') {
          multilineType = 'indent';
          multilineBuffer = [lineContent];
        }
        continue;
      }
    }

    flush();
  }
  flush();

  return { metadata, bodyStartIndex: match[0].length };
}

function buildManifests() {
  console.log('📦 Validating Amiga IA configuration from Single Source of Truth (package.json)...');

  const rootDir = path.resolve(__dirname, '..');
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.version || !pkg.name) {
    throw new Error('Invalid package.json: missing name or version.');
  }

  // Sync hooks.json -> hooks/hooks.json
  const sourceHooks = path.join(rootDir, 'hooks.json');
  const targetHooksDir = path.join(rootDir, 'hooks');
  if (!fs.existsSync(targetHooksDir)) {
    fs.mkdirSync(targetHooksDir, { recursive: true });
  }
  const targetHooksPath = path.join(targetHooksDir, 'hooks.json');
  if (fs.existsSync(sourceHooks)) {
    fs.copyFileSync(sourceHooks, targetHooksPath);
    console.log('✅ Synced hooks.json to hooks/hooks.json');
  }

  // Build Codex-native files in a package-owned staging directory.
  const removeOwnedTree = (targetPath) => {
    if (!fs.existsSync(targetPath)) return;
    if (fs.statSync(targetPath).isDirectory()) {
      for (const child of fs.readdirSync(targetPath)) removeOwnedTree(path.join(targetPath, child));
      fs.rmdirSync(targetPath);
    } else {
      fs.unlinkSync(targetPath);
    }
  };

  const syncAmigaDirectory = (sourceDir, targetDir, extension = null) => {
    fs.mkdirSync(targetDir, { recursive: true });
    const sourceEntries = new Set(fs.readdirSync(sourceDir).filter(entry => entry.startsWith('ami-') && (!extension || entry.endsWith(extension))));
    for (const entry of fs.readdirSync(targetDir)) {
      if (entry.startsWith('ami-') && (!extension || entry.endsWith(extension)) && !sourceEntries.has(entry)) {
        removeOwnedTree(path.join(targetDir, entry));
      }
    }
    for (const entry of sourceEntries) {
      fs.cpSync(path.join(sourceDir, entry), path.join(targetDir, entry), { recursive: true });
    }
  };

  const sourceSkillsDir = path.join(rootDir, 'skills');
  const codexSkillsDir = path.join(rootDir, 'codex', 'skills');
  syncAmigaDirectory(sourceSkillsDir, codexSkillsDir);

  const skillNames = new Set(fs.readdirSync(sourceSkillsDir)
    .filter(entry => entry.startsWith('ami-') && fs.statSync(path.join(sourceSkillsDir, entry)).isDirectory()));

  // Process all skill markdown bodies in codex/skills/
  const processSkillFiles = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        processSkillFiles(fullPath);
      } else if (entry.endsWith('.md')) {
        const rawContent = fs.readFileSync(fullPath, 'utf8');
        const relPath = path.relative(rootDir, fullPath);
        let processed = resolveCodexSkillReferences(rawContent, skillNames, relPath);
        processed = translateFrontmatter(processed, 'codex');
        processed = processed.replace(/\r\n/g, '\n');
        fs.writeFileSync(fullPath, processed, 'utf8');
      }
    }
  };
  processSkillFiles(codexSkillsDir);

  const sourceAgentsDir = path.join(rootDir, 'agents');
  const codexAgentsDir = path.join(rootDir, 'codex', 'agents');
  fs.mkdirSync(codexAgentsDir, { recursive: true });
  const sourceAgentFiles = fs.readdirSync(sourceAgentsDir).filter(name => name.startsWith('ami-') && name.endsWith('.md'));
  const expectedAgentFiles = new Set(sourceAgentFiles.map(file => `${path.basename(file, '.md')}.toml`));
  for (const file of fs.readdirSync(codexAgentsDir).filter(name => name.startsWith('ami-') && name.endsWith('.toml') && !expectedAgentFiles.has(name))) {
    fs.unlinkSync(path.join(codexAgentsDir, file));
  }
  for (const file of sourceAgentFiles) {
    const rawContent = fs.readFileSync(path.join(sourceAgentsDir, file), 'utf8').replace(/^\uFEFF/, '');
    const { metadata, bodyStartIndex } = parseFrontmatter(rawContent, file);
    if (!metadata.name || !metadata.description) throw new Error(`Agent needs name and description: ${file}`);

    const agentBaseName = path.basename(file, '.md');
    const isReadOnly = READ_ONLY_AGENTS.has(agentBaseName);
    const description = Array.isArray(metadata.description) ? metadata.description.join(' ') : String(metadata.description);
    const instructions = resolveCodexSkillReferences(rawContent.slice(bodyStartIndex), skillNames, file).trim();

    let toml = `name = ${JSON.stringify(metadata.name)}\ndescription = ${JSON.stringify(description)}\ndeveloper_instructions = ${JSON.stringify(instructions)}\n`;
    if (isReadOnly) {
      toml += `sandbox_mode = "read-only"\n`;
    }

    fs.writeFileSync(path.join(codexAgentsDir, `${agentBaseName}.toml`), toml, 'utf8');
  }
  console.log('✅ Generated Codex skills and custom agent files');

  console.log('✨ Package validation and build complete!\n');
}

if (require.main === module) {
  buildManifests();
}

module.exports = { buildManifests, resolveCodexSkillReferences };
