const fs = require('fs');
const path = require('path');

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

  // Build Codex-native files in a package-owned staging directory. The setup wizard
  // copies these artifacts into Codex's user-level discovery paths.
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

  const sourceAgentsDir = path.join(rootDir, 'agents');
  const codexAgentsDir = path.join(rootDir, 'codex', 'agents');
  fs.mkdirSync(codexAgentsDir, { recursive: true });
  const sourceAgentFiles = fs.readdirSync(sourceAgentsDir).filter(name => name.startsWith('ami-') && name.endsWith('.md'));
  const expectedAgentFiles = new Set(sourceAgentFiles.map(file => `${path.basename(file, '.md')}.toml`));
  for (const file of fs.readdirSync(codexAgentsDir).filter(name => name.startsWith('ami-') && name.endsWith('.toml') && !expectedAgentFiles.has(name))) {
    fs.unlinkSync(path.join(codexAgentsDir, file));
  }
  for (const file of sourceAgentFiles) {
    const content = fs.readFileSync(path.join(sourceAgentsDir, file), 'utf8').replace(/^\uFEFF/, '');
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) throw new Error(`Agent is missing YAML frontmatter: ${file}`);
    const metadata = {};
    for (const line of match[1].split(/\r?\n/)) {
      const field = line.match(/^([\w-]+):\s*(.*)$/);
      if (field) metadata[field[1]] = field[2].trim();
    }
    if (!metadata.name || !metadata.description) throw new Error(`Agent needs name and description: ${file}`);
    const instructions = content.slice(match[0].length).trim();
    const toml = `name = ${JSON.stringify(metadata.name)}\ndescription = ${JSON.stringify(metadata.description)}\ndeveloper_instructions = ${JSON.stringify(instructions)}\n`;
    fs.writeFileSync(path.join(codexAgentsDir, `${path.basename(file, '.md')}.toml`), toml);
  }
  console.log('✅ Generated Codex skills and custom agent files');

  console.log('✨ Package validation and build complete!\n');
}

if (require.main === module) {
  buildManifests();
}

module.exports = { buildManifests };
