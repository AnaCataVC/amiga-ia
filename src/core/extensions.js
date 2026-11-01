const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { loadReceipt, saveReceipt } = require('./receipts');

function resolveClaudeModsSource(options = {}) {
  if (options.sourceDir && fs.existsSync(options.sourceDir)) {
    return options.sourceDir;
  }

  // Check sibling local repositories for developer speed and offline testing
  const candidates = [
    path.resolve(process.cwd(), '../ami-claude-mods'),
    path.resolve(process.cwd(), '../my-claude-mods'),
    path.resolve(__dirname, '../../../../ami-claude-mods'),
    path.resolve(__dirname, '../../../../my-claude-mods')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'mods'))) {
      return candidate;
    }
  }

  return null;
}

function installClaudeMods(claudeDir, options = {}) {
  const targetModsDir = path.join(claudeDir, 'mods');
  if (!fs.existsSync(targetModsDir)) {
    fs.mkdirSync(targetModsDir, { recursive: true });
  }

  let sourceDir = resolveClaudeModsSource(options);
  let tempCloneDir = null;

  if (!sourceDir) {
    tempCloneDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ami-claude-mods-'));
    const repoUrl = options.repoUrl || 'https://github.com/AnaCataVC/ami-claude-mods.git';
    const cloneResult = spawnSync('git', ['clone', '--depth', '1', repoUrl, tempCloneDir], {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    if (cloneResult.status !== 0) {
      if (tempCloneDir && fs.existsSync(tempCloneDir)) {
        fs.rmSync(tempCloneDir, { recursive: true, force: true });
      }
      throw new Error(`Failed to clone ami-claude-mods from ${repoUrl}: ${cloneResult.stderr || cloneResult.stdout}`);
    }
    sourceDir = tempCloneDir;
  }

  const modsSourceDir = path.join(sourceDir, 'mods');
  if (!fs.existsSync(modsSourceDir)) {
    if (tempCloneDir && fs.existsSync(tempCloneDir)) {
      fs.rmSync(tempCloneDir, { recursive: true, force: true });
    }
    throw new Error(`Invalid ami-claude-mods source: missing 'mods' directory at ${sourceDir}`);
  }

  const installedMods = [];
  const entries = fs.readdirSync(modsSourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const modName = entry.name;
      const src = path.join(modsSourceDir, modName);
      const dest = path.join(targetModsDir, modName);
      fs.cpSync(src, dest, { recursive: true, force: true });
      installedMods.push(modName);
    }
  }

  if (tempCloneDir && fs.existsSync(tempCloneDir)) {
    try {
      fs.rmSync(tempCloneDir, { recursive: true, force: true });
    } catch (e) {}
  }

  // Update receipt
  const receipt = loadReceipt(claudeDir) || {};
  const currentExts = receipt.installedExtensions || {};
  currentExts['claude-mods'] = {
    version: options.version || '1.0.0',
    installedAt: new Date().toISOString(),
    mods: installedMods
  };

  saveReceipt(claudeDir, {
    ...receipt,
    installedExtensions: currentExts
  });

  return {
    success: true,
    installedMods,
    targetDir: targetModsDir
  };
}

function removeClaudeMods(claudeDir) {
  const targetModsDir = path.join(claudeDir, 'mods');
  const receipt = loadReceipt(claudeDir);
  const extInfo = receipt?.installedExtensions?.['claude-mods'];

  const modsToRemove = extInfo?.mods || [
    'child-sessions',
    'cleanroom-guard',
    'close-checklist',
    'context-guard',
    'hooks-viewer',
    'undelegated-reads'
  ];

  let removedCount = 0;
  if (fs.existsSync(targetModsDir)) {
    for (const mod of modsToRemove) {
      const modPath = path.join(targetModsDir, mod);
      if (fs.existsSync(modPath)) {
        fs.rmSync(modPath, { recursive: true, force: true });
        removedCount++;
      }
    }
  }

  if (receipt && receipt.installedExtensions && receipt.installedExtensions['claude-mods']) {
    delete receipt.installedExtensions['claude-mods'];
    saveReceipt(claudeDir, receipt);
  }

  return {
    success: true,
    removedCount
  };
}

module.exports = {
  resolveClaudeModsSource,
  installClaudeMods,
  removeClaudeMods
};
