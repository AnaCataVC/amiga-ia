const fs = require('fs');
const path = require('path');
const { translateFrontmatter } = require('../../adapters/capability_translator');
const { getAllPackCapabilities, loadRegistry } = require('./registry');
const { loadReceipt, saveReceipt } = require('./receipts');

function filterSkillsByPacks(sourceDir, allowedSkills) {
  if (!fs.existsSync(sourceDir)) return [];
  const allowedSet = new Set(allowedSkills);
  const found = [];
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && allowedSet.has(entry.name)) {
      found.push(entry.name);
    }
  }
  return found;
}

function filterAgentsByPacks(sourceDir, allowedAgents) {
  if (!fs.existsSync(sourceDir)) return [];
  const allowedSet = new Set(allowedAgents.map(a => a.endsWith('.md') ? a : `${a}.md`));
  const found = [];
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && allowedSet.has(entry.name)) {
      found.push(entry.name);
    }
  }
  return found;
}

function copySelectiveItem(src, dest, targetEnv, options = {}) {
  if (!fs.existsSync(src)) return;
  const isDirectory = fs.statSync(src).isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copySelectiveItem(path.join(src, childItemName), path.join(dest, childItemName), targetEnv, options);
    });
  } else {
    if (dest.endsWith('.md')) {
      let content = fs.readFileSync(src, 'utf8');
      if (targetEnv === 'claude') {
        content = content.replace(/\.gemini\/agents\//g, '.claude/agents/');
        content = translateFrontmatter(content, 'claude');
      } else if (targetEnv === 'antigravity' || targetEnv === 'gemini') {
        content = translateFrontmatter(content, 'antigravity');
      } else if (targetEnv === 'codex') {
        if (!options.codexUserSkillsDir) {
          throw new Error('Codex skills directory is required to install skills.');
        }
        content = content.replace(/__AMIGA_CODEX_SKILLS_DIR__/g, () => options.codexUserSkillsDir);
      }
      fs.writeFileSync(dest, content);
    } else if (targetEnv === 'codex' && dest.endsWith('.toml')) {
      if (!options.codexUserSkillsDir) {
        throw new Error('Codex skills directory is required to install agent profiles.');
      }
      const escapedSkillsDir = JSON.stringify(options.codexUserSkillsDir).slice(1, -1);
      const content = fs.readFileSync(src, 'utf8').replace(/__AMIGA_CODEX_SKILLS_DIR__/g, () => escapedSkillsDir);
      fs.writeFileSync(dest, content);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function cleanUnselectedPackFiles(destDir, allowedNames, isPrefixAmi = true) {
  if (!fs.existsSync(destDir)) return [];
  const allowedSet = new Set(allowedNames);
  const deleted = [];
  const entries = fs.readdirSync(destDir, { withFileTypes: true });
  for (const entry of entries) {
    const itemName = entry.name;
    const baseName = itemName.endsWith('.md') ? itemName.slice(0, -3) : (itemName.endsWith('.toml') ? itemName.slice(0, -5) : itemName);
    if (isPrefixAmi && !itemName.startsWith('ami-')) {
      continue;
    }
    if (!allowedSet.has(itemName) && !allowedSet.has(baseName)) {
      const fullPath = path.join(destDir, itemName);
      if (entry.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      deleted.push(itemName);
    }
  }
  return deleted;
}

module.exports = {
  filterSkillsByPacks,
  filterAgentsByPacks,
  copySelectiveItem,
  cleanUnselectedPackFiles
};
