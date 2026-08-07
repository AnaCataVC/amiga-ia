#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { select, confirm, multiselect, isCancel } = require('@clack/prompts');
const pc = require('picocolors');

const homeDir = os.homedir();
const claudeDir = path.join(homeDir, '.claude');
const geminiDir = path.join(homeDir, '.gemini', 'config');

const sourceSkillsDir = path.join(__dirname, '../skills');
const sourceAgentsDir = path.join(__dirname, '../agents');
const sourceRulesDir = path.join(__dirname, '../rules');
const sourceSettingsPath = path.join(__dirname, '../hooks.json');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const isDirectory = fs.statSync(src).isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(function(childItemName) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function cleanOrphanedFiles(src, dest, isRoot = true) {
  if (!fs.existsSync(dest)) return;
  if (fs.statSync(dest).isDirectory()) {
    fs.readdirSync(dest).forEach(function(childItemName) {
      const srcPath = path.join(src, childItemName);
      const destPath = path.join(dest, childItemName);
      if (!fs.existsSync(srcPath)) {
        if (isRoot && !childItemName.startsWith('ami-')) {
          return; // Skip deleting user's personal skills or agents
        }
        if (fs.statSync(destPath).isDirectory()) {
          fs.rmSync(destPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(destPath);
        }
      } else {
        cleanOrphanedFiles(srcPath, destPath, false);
      }
    });
  }
}

function deleteMatchingFiles(src, dest, isRoot = true) {
  if (!fs.existsSync(src) || !fs.existsSync(dest)) return;
  const isDirectory = fs.statSync(src).isDirectory();
  if (isDirectory) {
    fs.readdirSync(src).forEach(function(childItemName) {
      deleteMatchingFiles(path.join(src, childItemName), path.join(dest, childItemName), false);
    });
    if (fs.existsSync(dest) && fs.readdirSync(dest).length === 0) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  } else {
    fs.unlinkSync(dest);
  }
}

function mergeSettings(targetPath, sourcePath, options = {}) {
  let targetData = {};
  if (fs.existsSync(targetPath)) {
    try {
      targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    } catch (e) {
      console.error('\n❌ ERROR: Could not parse existing settings.json (invalid JSON).');
      console.error('   Aborting hooks merge to protect your custom settings.');
      console.error('   Please fix the JSON syntax in ~/.claude/settings.json manually and re-run setup.\n');
      return false;
    }
  }
  const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

  if (!targetData.hooks) targetData.hooks = {};

  const amigaSignatures = [
    '$CLAUDE_TOOL_ARGS',
    'commit-assistant',
    'push-assistant',
    'ami-pr-publisher',
    'ami-pr-reviewer',
    'ami-pr-conflict-detector',
    'docs/coding-sessions',
    'debugger|TODO|FIXME',
    'ami-session-start',
    'ami-pre-tool-use',
    'ami-post-tool-use',
    'ami-hooks'
  ];

  let cleanedCount = 0;

  for (const event of Object.keys(targetData.hooks || {})) {
    const initialLen = targetData.hooks[event].length;
    targetData.hooks[event] = targetData.hooks[event].filter(existingHook => {
      const cmdString = JSON.stringify(existingHook);
      const isAmigaHook = amigaSignatures.some(sig => cmdString.includes(sig));
      return !isAmigaHook;
    });
    cleanedCount += (initialLen - targetData.hooks[event].length);
    if (targetData.hooks[event].length === 0) {
      delete targetData.hooks[event];
    }
  }

  for (const [event, newHooks] of Object.entries(sourceData.hooks || {})) {
    if (!targetData.hooks[event]) {
      targetData.hooks[event] = [];
    }
    for (const newHook of newHooks) {
      targetData.hooks[event].push(newHook);
    }
  }

  fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2));
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned ${cleanedCount} obsolete/duplicate Amiga IA hook(s).`);
  }
  return true;
}

function removeAmigaHooks(targetPath) {
  if (!fs.existsSync(targetPath)) return false;
  try {
    const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    if (!targetData.hooks) return false;

    const amigaSignatures = [
      '$CLAUDE_TOOL_ARGS',
      'commit-assistant',
      'push-assistant',
      'ami-pr-publisher',
      'ami-pr-reviewer',
      'ami-pr-conflict-detector',
      'docs/coding-sessions',
      'debugger|TODO|FIXME',
      'ami-session-start',
      'ami-pre-tool-use',
      'ami-post-tool-use',
      'ami-hooks'
    ];

    let cleanedCount = 0;
    for (const event of Object.keys(targetData.hooks)) {
      if (!Array.isArray(targetData.hooks[event])) continue;
      const initialLen = targetData.hooks[event].length;
      targetData.hooks[event] = targetData.hooks[event].filter(existingHook => {
        const cmdString = JSON.stringify(existingHook);
        const isAmigaHook = amigaSignatures.some(sig => cmdString.includes(sig));
        return !isAmigaHook;
      });
      cleanedCount += (initialLen - targetData.hooks[event].length);
      if (targetData.hooks[event].length === 0) {
        delete targetData.hooks[event];
      }
    }
    if (Object.keys(targetData.hooks).length === 0) {
      delete targetData.hooks;
    }
    fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2));
    return cleanedCount > 0;
  } catch (e) {
    return false;
  }
}

function installNodeHooks(targetDir, settingsPath, options = {}) {
  const hooksDir = path.join(targetDir, 'hooks');
  if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });

  const sourceScripts = path.join(__dirname, '../hooks/scripts');
  const scriptFiles = ['ami-pre-tool-use.js', 'ami-post-tool-use.js'];
  for (const file of scriptFiles) {
    const srcFile = path.join(sourceScripts, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(hooksDir, file));
    }
  }
  const legacyScript = path.join(hooksDir, 'ami-session-start.js');
  if (fs.existsSync(legacyScript)) {
    try { fs.unlinkSync(legacyScript); } catch (e) {}
  }
  console.log(`✅ Hook scripts copied to ${hooksDir}`);

  const nodeCmd = (script) => `node "${path.join(hooksDir, script).replace(/\\/g, '/')}"`;
  const hooksConfig = {
    hooks: {
      PreToolUse: [{ matcher: 'Bash|PowerShell|run_command', hooks: [{ type: 'command', command: nodeCmd('ami-pre-tool-use.js') }] }],
      PostToolUse: [{ matcher: 'Edit|Write|write_to_file|replace_file_content|multi_replace_file_content', hooks: [{ type: 'command', command: nodeCmd('ami-post-tool-use.js') }] }]
    }
  };

  const tmpFile = path.join(targetDir, '.amiga-hooks-tmp.json');
  fs.writeFileSync(tmpFile, JSON.stringify(hooksConfig, null, 2));
  const result = mergeSettings(settingsPath, tmpFile, options);
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
  return result;
}

function installPwshHooks(targetDir, settingsPath, options = {}) {
  const hooksDir = path.join(targetDir, 'hooks');
  if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });

  const sourceScripts = path.join(__dirname, '../hooks/scripts');
  const srcFile = path.join(sourceScripts, 'ami-hooks.ps1');
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(hooksDir, 'ami-hooks.ps1'));
  }
  console.log(`✅ PowerShell hook script copied to ${hooksDir}`);

  const pwshCmd = (event) => `pwsh -NoProfile -ExecutionPolicy Bypass -File "${path.join(hooksDir, 'ami-hooks.ps1').replace(/\\/g, '/')}" -Event ${event}`;
  const hooksConfig = {
    hooks: {
      PreToolUse: [{ matcher: 'Bash|PowerShell|run_command', hooks: [{ type: 'command', shell: 'pwsh', command: pwshCmd('PreToolUse') }] }],
      PostToolUse: [{ matcher: 'Edit|Write|write_to_file|replace_file_content|multi_replace_file_content', hooks: [{ type: 'command', shell: 'pwsh', command: pwshCmd('PostToolUse') }] }]
    }
  };

  const tmpFile = path.join(targetDir, '.amiga-hooks-tmp-pwsh.json');
  fs.writeFileSync(tmpFile, JSON.stringify(hooksConfig, null, 2));
  const result = mergeSettings(settingsPath, tmpFile, options);
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
  return result;
}

function installBashHooks(targetDir, settingsPath, options = {}) {
  const hooksDir = path.join(targetDir, 'hooks');
  if (!fs.existsSync(hooksDir)) fs.mkdirSync(hooksDir, { recursive: true });

  const sourceScripts = path.join(__dirname, '../hooks/scripts');
  const srcFile = path.join(sourceScripts, 'ami-hooks.sh');
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(hooksDir, 'ami-hooks.sh'));
  }
  console.log(`✅ Bash hook script copied to ${hooksDir}`);

  const bashCmd = (event) => `bash "${path.join(hooksDir, 'ami-hooks.sh').replace(/\\/g, '/')}" -e ${event}`;
  const hooksConfig = {
    hooks: {
      PreToolUse: [{ matcher: 'Bash|PowerShell|run_command', hooks: [{ type: 'command', shell: 'bash', command: bashCmd('PreToolUse') }] }],
      PostToolUse: [{ matcher: 'Edit|Write|write_to_file|replace_file_content|multi_replace_file_content', hooks: [{ type: 'command', shell: 'bash', command: bashCmd('PostToolUse') }] }]
    }
  };

  const tmpFile = path.join(targetDir, '.amiga-hooks-tmp-bash.json');
  fs.writeFileSync(tmpFile, JSON.stringify(hooksConfig, null, 2));
  const result = mergeSettings(settingsPath, tmpFile, options);
  if (fs.existsSync(tmpFile)) {
    fs.unlinkSync(tmpFile);
  }
  return result;
}

function isNewerVersion(current, latest) {
  if (!current || !latest || current === 'unknown') return false;
  const parse = (v) => v.replace(/^v/, '').split('-')[0].split('.').map(x => parseInt(x, 10) || 0);
  const c = parse(current);
  const l = parse(latest);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const numC = c[i] || 0;
    const numL = l[i] || 0;
    if (numL > numC) return true;
    if (numL < numC) return false;
  }
  return false;
}

function getLatestNpmVersion(packageName) {
  return new Promise((resolve) => {
    const req = https.get(`https://registry.npmjs.org/${packageName}/latest`, { timeout: 3000 }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.version || null);
        } catch (e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function getPackageInfo() {
  const pkgPath = path.join(__dirname, '../package.json');
  let version = 'unknown';
  let name = '@anacatavc/amiga-ia';
  if (fs.existsSync(pkgPath)) {
    try {
      const pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      version = pkgData.version || version;
      name = pkgData.name || name;
    } catch (e) {}
  }
  return { name, version };
}

function saveVersionManifest(targetDir, version) {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const manifestPath = path.join(targetDir, '.amiga-version.json');
    const data = JSON.stringify({
      name: '@anacatavc/amiga-ia',
      version: version,
      installedAt: new Date().toISOString()
    }, null, 2);
    fs.writeFileSync(manifestPath, data);
  } catch (e) {}
}

function hasAmigaItems(targetDir) {
  const skillsDir = path.join(targetDir, 'skills');
  const agentsDir = path.join(targetDir, 'agents');
  let found = false;
  const checkDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    try {
      const items = fs.readdirSync(dir);
      if (items.some(item => item.startsWith('ami-') || item === 'antigravity-guide' || item === 'research.md' || item === 'self.md')) {
        found = true;
      }
    } catch (e) {}
  };
  checkDir(skillsDir);
  checkDir(agentsDir);
  return found;
}

function getInstalledEnvironmentStatus(targetDir) {
  if (!fs.existsSync(targetDir) || !hasAmigaItems(targetDir)) {
    return { installed: false, version: null, status: 'Not configured / Not installed' };
  }
  const manifestPath = path.join(targetDir, '.amiga-version.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (data && data.version) {
        return { installed: true, version: data.version, status: `v${data.version}`, installedAt: data.installedAt };
      }
    } catch (e) {}
  }
  return { installed: true, version: 'untracked', status: 'Legacy / Untracked (installed without version manifest)' };
}

async function runDoctor() {
  const { name: pkgName, version: currentVersion } = getPackageInfo();
  console.log(pc.cyan('======================================================'));
  console.log(pc.bold(pc.white(` 🩺 Amiga IA Diagnostic Tool (Doctor) [v${currentVersion}]`)));
  console.log(pc.cyan('======================================================\n'));
  let issueCount = 0;

  // 1. Package & Environment Version Diagnostic
  console.log(pc.blue('🔍 Checking package & installed environment versions...'));
  console.log(`  📦 Executing CLI package version: ${pc.green('v' + currentVersion)}`);
  
  const claudeStatus = getInstalledEnvironmentStatus(claudeDir);
  const geminiStatus = getInstalledEnvironmentStatus(geminiDir);
  
  const formatStatus = (status) => {
    if (!status.installed) return pc.gray(`ℹ️  ${status.status}`);
    if (status.version === 'untracked') return pc.yellow(`⚠️  ${status.status}`);
    const dateStr = status.installedAt ? ` (installed ${status.installedAt.split('T')[0]})` : '';
    return pc.green(`✅ v${status.version}`) + pc.gray(dateStr);
  };
  console.log(`  🤖 Claude Code installed environment: ${formatStatus(claudeStatus)}`);
  console.log(`  🤖 Antigravity installed environment: ${formatStatus(geminiStatus)}`);

  const anyInstalled = claudeStatus.installed || geminiStatus.installed;
  let hasOutdatedOrUntrackedEnv = false;

  if (claudeStatus.installed) {
    if (claudeStatus.version === 'untracked' || isNewerVersion(claudeStatus.version, currentVersion)) {
      hasOutdatedOrUntrackedEnv = true;
      console.log(pc.yellow(`  ⚠️  WARNING: Claude Code skills/agents are outdated relative to executing package v${currentVersion} (or lacking version tracking).`));
    }
  }

  if (geminiStatus.installed) {
    if (geminiStatus.version === 'untracked' || isNewerVersion(geminiStatus.version, currentVersion)) {
      hasOutdatedOrUntrackedEnv = true;
      console.log(pc.yellow(`  ⚠️  WARNING: Antigravity skills/agents are outdated relative to executing package v${currentVersion} (or lacking version tracking).`));
    }
  }

  if (hasOutdatedOrUntrackedEnv) {
    console.log(pc.gray(`     Recommendation: Run 'amiga-ia-setup' and select your AI assistants to upgrade local files and sync version tracking.`));
    issueCount++;
  } else if (anyInstalled) {
    console.log(pc.green(`  ✅ All installed AI assistant environments match executing package version v${currentVersion}.`));
  }

  console.log(pc.blue('\n🔍 Checking NPM registry for updates...'));
  const latestVersion = await getLatestNpmVersion(pkgName);
  if (latestVersion) {
    if (isNewerVersion(currentVersion, latestVersion)) {
      console.log(pc.cyan(`  💡 ADVISORY: A newer version (v${latestVersion}) is available on NPM!`));
      console.log(pc.gray(`     Recommendation: Run 'npm install -g ${pkgName}@latest' to update your global package and enjoy the latest capabilities and bug fixes.`));
    } else {
      console.log(pc.green(`  ✅ Executing CLI package matches the latest published version on NPM (v${latestVersion}).`));
    }
  } else {
    console.log(pc.gray(`  ℹ️  Could not reach NPM registry to check for updates (offline or timed out).`));
  }

  // 2. Installation Health Check
  console.log(pc.blue('\n🔍 Checking for legacy plugin conflicts...'));
  const geminiPluginDir = path.join(geminiDir, 'plugins', 'amiga-ia');
  if (fs.existsSync(geminiPluginDir)) {
    console.log(pc.yellow(`⚠️  WARNING: Legacy plugin directory found (~/.gemini/config/plugins/amiga-ia).`));
    console.log(pc.gray(`    Recommended action: Run 'amiga-ia-setup' to clean legacy plugin directory and migrate to NPM package installation.`));
    issueCount++;
  } else {
    console.log(pc.green('  ✅ No legacy plugin conflicts detected.'));
  }

  // 3. YAML Frontmatter Validator
  console.log(pc.blue('\n🔍 Validating SKILL.md YAML frontmatter...'));
  let invalidSkills = 0;
  if (fs.existsSync(sourceSkillsDir)) {
    const walkSync = (dir, filelist = []) => {
      fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
          filelist = walkSync(filepath, filelist);
        } else if (file === 'SKILL.md') {
          filelist.push(filepath);
        }
      });
      return filelist;
    };
    const skillFiles = walkSync(sourceSkillsDir);
    skillFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) {
        console.log(pc.red(`❌ ERROR: Missing YAML frontmatter in ${path.relative(sourceSkillsDir, file)}`));
        invalidSkills++;
      } else {
        const hasName = match[1].includes('name:');
        const hasDesc = match[1].includes('description:');
        const hasTools = match[1].includes('allowed-tools:');
        if (!hasName || !hasDesc || !hasTools) {
          console.log(pc.yellow(`⚠️  WARNING: Incomplete YAML frontmatter in ${path.relative(sourceSkillsDir, file)} (Missing: ${[!hasName && 'name', !hasDesc && 'description', !hasTools && 'allowed-tools'].filter(Boolean).join(', ')})`));
          invalidSkills++;
        }
      }
    });
    if (invalidSkills === 0) {
      console.log(pc.green(`  ✅ All ${skillFiles.length} skills have valid YAML frontmatter.`));
    } else {
      issueCount += invalidSkills;
    }
  }

  // 4. Hooks Health Check
  console.log(pc.blue('\n🔍 Checking Claude Code hooks configuration...'));
  const claudeSettingsPath = path.join(claudeDir, 'settings.json');
  if (fs.existsSync(claudeSettingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8'));
      if (settings.hooks && (settings.hooks.PreToolUse || settings.hooks.PostToolUse)) {
        console.log(pc.green('  ✅ Amiga IA hooks detected and settings.json is valid JSON.'));

        const isWindows = os.platform() === 'win32';
        const hookEvents = Object.values(settings.hooks).flat();
        const hookCmds = [];
        hookEvents.forEach(h => {
          if (h && h.hooks && Array.isArray(h.hooks)) {
            h.hooks.forEach(subHook => {
              if (subHook && subHook.command) hookCmds.push(subHook);
            });
          }
        });

        const amigaSigs = ['commit-assistant', 'push-assistant', 'ami-pr-publisher', 'ami-pr-reviewer', 'ami-pr-conflict-detector', 'docs/coding-sessions', 'debugger|TODO|FIXME', 'ami-session-start', 'ami-pre-tool-use', 'ami-post-tool-use', 'ami-hooks'];
        const isAmigaHook = (cmd) => cmd && typeof cmd === 'string' && amigaSigs.some(sig => cmd.includes(sig));

        const hasNodeHooks = hookCmds.some(h => isAmigaHook(h.command) && h.command.includes('node '));
        const hasBashHooks = hookCmds.some(h => isAmigaHook(h.command) && !h.command.includes('node ') && (h.shell === 'bash' || !h.shell));
        const hasPwshHooks = hookCmds.some(h => isAmigaHook(h.command) && !h.command.includes('node ') && (h.shell === 'pwsh' || h.shell === 'powershell'));

        if (hasNodeHooks) {
          console.log(pc.green('  ✅ Node.js hooks detected — universal cross-platform support.'));
        } else if (hasPwshHooks && isWindows) {
          console.log(pc.green('  ✅ PowerShell hooks detected — compatible with Windows.'));
        } else if (hasBashHooks && !isWindows) {
          console.log(pc.green('  ✅ Bash hooks detected — compatible with Unix/macOS.'));
        } else if (hasBashHooks && isWindows) {
          console.log(pc.yellow('  ⚠️  WARNING: Bash hooks detected on Windows. They may fail without Git Bash setup.'));
          console.log(pc.gray("     Recommendation: Run 'amiga-ia-setup' and select Node.js (universal) or PowerShell hooks."));
          issueCount++;
        } else if (hasPwshHooks && !isWindows) {
          console.log(pc.yellow('  ⚠️  WARNING: PowerShell hooks detected on a non-Windows OS.'));
          console.log(pc.gray("     Recommendation: Run 'amiga-ia-setup' and select Node.js (universal) or Bash hooks."));
          issueCount++;
        }
      } else {
        console.log(pc.gray('  ℹ️  No Amiga IA hooks found in ~/.claude/settings.json (Optional feature).'));
      }
    } catch (e) {
      console.log(pc.red('❌ ERROR: ~/.claude/settings.json contains invalid JSON syntax.'));
      issueCount++;
    }
  } else {
    console.log(pc.gray('  ℹ️  Claude Code settings file not found (~/.claude/settings.json).'));
  }

  // 5. Legacy Directory Check
  const sessionsDir = path.resolve('docs', 'coding-sessions');
  if (fs.existsSync(sessionsDir)) {
    console.log(pc.blue('\n🔍 Checking project workspace for legacy structures...'));
    console.log(pc.cyan('  💡 ADVISORY: Found legacy docs/coding-sessions/ directory.'));
    console.log(pc.gray('     Recommendation: Extract any valuable architectural insights or pending tasks using ami-learnings-extractor and ami-doc-manager skills, and then delete docs/coding-sessions/ to save tokens and keep your repository clean.'));
  }

  console.log(pc.cyan('\n======================================================'));
  if (issueCount === 0) {
    console.log(pc.green('✨ Diagnostic complete: All checks passed smoothly!'));
  } else {
    console.log(pc.yellow(`⚠️  Diagnostic complete: Found ${issueCount} warning(s)/issue(s).`));
  }
  console.log(pc.cyan('======================================================\n'));
}

function checkLegacyDirs() {
  const sessionsDir = path.resolve('docs', 'coding-sessions');
  if (fs.existsSync(sessionsDir)) {
    console.log(pc.cyan('\n💡 ADVISORY: Found legacy docs/coding-sessions/ directory.'));
    console.log(pc.gray('   Recommendation: Extract any valuable architectural insights or pending tasks using ami-learnings-extractor and ami-doc-manager skills, and then delete docs/coding-sessions/ to save tokens and keep your repository clean.'));
  }
  console.log(pc.magenta('\n✨ Setup complete! Restart your AI assistant for changes to take effect.\n'));
}

async function runInstall() {
  const { version: currentVersion } = getPackageInfo();
  console.log(pc.cyan('======================================================'));
  console.log(pc.bold(pc.white(` 🌟 Welcome to Amiga IA Setup Wizard [v${currentVersion}]`)));
  console.log(pc.cyan('======================================================'));
  console.log('This wizard will install the Amiga IA Universal Agent Skills');
  console.log('into your local AI environments.\n');

  const choices = await multiselect({
    message: 'Which assistants do you want to configure?',
    options: [
      { label: 'Claude Code', value: 'claude' },
      { label: 'Antigravity (Gemini)', value: 'antigravity' }
    ],
    initialValues: ['claude', 'antigravity'],
    required: true
  });
  if (isCancel(choices)) process.exit(0);

  if (choices.includes('claude')) {
    console.log(pc.blue('\nInstalling for Claude Code...'));
    cleanOrphanedFiles(sourceSkillsDir, path.join(claudeDir, 'skills'));
    cleanOrphanedFiles(sourceAgentsDir, path.join(claudeDir, 'agents'));
    copyRecursiveSync(sourceSkillsDir, path.join(claudeDir, 'skills'));
    copyRecursiveSync(sourceAgentsDir, path.join(claudeDir, 'agents'));
    saveVersionManifest(claudeDir, currentVersion);
    console.log(pc.green('✅ Skills and Agents directories successfully configured.'));

    if (fs.existsSync(sourceSettingsPath)) {
      console.log('\nClaude Code supports powerful background Hooks (Pre-commit checks, context restoring).');
      const installHooks = await confirm({ message: 'Install recommended Amiga IA Hooks? (We will merge them and create a backup)', initialValue: true });
      if (isCancel(installHooks)) process.exit(0);
      if (installHooks) {
        if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
        
        const claudeSettings = path.join(claudeDir, 'settings.json');
        const backupPath = path.join(claudeDir, 'settings.json.amiga-backup');
        
        if (fs.existsSync(claudeSettings) && !fs.existsSync(backupPath)) {
          fs.copyFileSync(claudeSettings, backupPath);
          console.log(pc.green('✅ Backup created at ~/.claude/settings.json.amiga-backup'));
        }
        
        const engine = await select({
          message: 'Which hook engine should be used?',
          options: [
            { label: 'Node.js (Universal - works on any OS) ← recommended', value: 'n' },
            { label: 'Bash (macOS/Linux)', value: 'b' },
            { label: 'PowerShell (Windows)', value: 'p' }
          ]
        });
        if (isCancel(engine)) process.exit(0);

        let merged = false;
        if (engine === 'b') {
          merged = installBashHooks(claudeDir, claudeSettings);
        } else if (engine === 'p') {
          merged = installPwshHooks(claudeDir, claudeSettings);
        } else {
          merged = installNodeHooks(claudeDir, claudeSettings);
        }

        if (merged) {
          console.log(pc.green('✅ Hooks successfully configured and merged into settings.json.'));
        } else {
          console.log(pc.yellow('⚠️ Hooks merge skipped due to JSON parse error.'));
        }
      } else {
        console.log(pc.gray('⏭️ Hooks installation skipped.'));
      }
    }
  }

  if (choices.includes('antigravity')) {
    console.log(pc.blue('\nInstalling for Antigravity...'));
    const geminiPluginDir = path.join(geminiDir, 'plugins', 'amiga-ia');
    if (fs.existsSync(geminiPluginDir)) {
      fs.rmSync(geminiPluginDir, { recursive: true, force: true });
      console.log(pc.gray('🧹 Cleaned legacy plugin directory at ~/.gemini/config/plugins/amiga-ia'));
    }

    cleanOrphanedFiles(sourceSkillsDir, path.join(geminiDir, 'skills'));
    cleanOrphanedFiles(sourceAgentsDir, path.join(geminiDir, 'agents'));
    cleanOrphanedFiles(sourceRulesDir, path.join(geminiDir, 'rules'));
    copyRecursiveSync(sourceSkillsDir, path.join(geminiDir, 'skills'));
    copyRecursiveSync(sourceAgentsDir, path.join(geminiDir, 'agents'));
    copyRecursiveSync(sourceRulesDir, path.join(geminiDir, 'rules'));
    saveVersionManifest(geminiDir, currentVersion);
    console.log(pc.green('✅ Skills, Agents, and Rules directories successfully configured at ~/.gemini/config/'));

    if (fs.existsSync(sourceSettingsPath)) {
      console.log('\nAntigravity supports background Hooks via universal Node.js scripts (Pre-commit reminders, Debug statement checks).');
      const installHooks = await confirm({ message: 'Install recommended universal Amiga IA Hooks for Antigravity?', initialValue: true });
      if (isCancel(installHooks)) process.exit(0);
      if (installHooks) {
        if (!fs.existsSync(geminiDir)) fs.mkdirSync(geminiDir, { recursive: true });
        const geminiSettings = path.join(geminiDir, 'hooks.json');
        const merged = installNodeHooks(geminiDir, geminiSettings);
        if (merged) {
          console.log(pc.green('✅ Universal Node.js Hooks successfully configured at ~/.gemini/config/hooks.json.'));
        } else {
          console.log(pc.yellow('⚠️ Hooks configuration skipped due to JSON parse error.'));
        }
      } else {
        console.log(pc.gray('⏭️ Hooks installation skipped for Antigravity.'));
      }
    }
  }

  checkLegacyDirs();
}

async function runUninstall() {
  console.log(pc.blue('\nUninstalling package files from AI assistants...'));
  let uninstalledSomething = false;

  if (fs.existsSync(claudeDir)) {
    deleteMatchingFiles(sourceSkillsDir, path.join(claudeDir, 'skills'));
    deleteMatchingFiles(sourceAgentsDir, path.join(claudeDir, 'agents'));
    const claudeManifest = path.join(claudeDir, '.amiga-version.json');
    if (fs.existsSync(claudeManifest)) {
      try { fs.unlinkSync(claudeManifest); } catch (e) {}
    }
    const sourceScriptsDir = path.join(__dirname, '../hooks/scripts');
    if (fs.existsSync(sourceScriptsDir)) {
      deleteMatchingFiles(sourceScriptsDir, path.join(claudeDir, 'hooks'));
    }
    console.log(pc.green('✅ Claude Code skills and hook scripts removed.'));
    
    const removeHooks = await confirm({ message: 'Do you want to remove the Amiga IA Hooks from Claude Code settings?', initialValue: true });
    if (isCancel(removeHooks)) process.exit(0);
    if (removeHooks) {
      const claudeSettings = path.join(claudeDir, 'settings.json');
      const backupPath = path.join(claudeDir, 'settings.json.amiga-backup');
      
      const cleaned = removeAmigaHooks(claudeSettings);
      if (fs.existsSync(backupPath)) {
        try { fs.unlinkSync(backupPath); } catch (e) {}
      }
      if (cleaned) {
        console.log(pc.green('✅ Removed Amiga IA hooks from settings.json.'));
      } else if (fs.existsSync(claudeSettings)) {
        console.log(pc.gray('ℹ️ No Amiga IA hooks found in settings.json to remove.'));
      } else {
        console.log(pc.gray('ℹ️ settings.json not found.'));
      }
    }
    uninstalledSomething = true;
  }

  if (fs.existsSync(geminiDir)) {
    const geminiPluginDir = path.join(geminiDir, 'plugins', 'amiga-ia');
    deleteMatchingFiles(sourceSkillsDir, path.join(geminiDir, 'skills'));
    deleteMatchingFiles(sourceAgentsDir, path.join(geminiDir, 'agents'));
    deleteMatchingFiles(sourceRulesDir, path.join(geminiDir, 'rules'));
    const geminiManifest = path.join(geminiDir, '.amiga-version.json');
    if (fs.existsSync(geminiManifest)) {
      try { fs.unlinkSync(geminiManifest); } catch (e) {}
    }
    const sourceScriptsDir = path.join(__dirname, '../hooks/scripts');
    if (fs.existsSync(sourceScriptsDir)) {
      deleteMatchingFiles(sourceScriptsDir, path.join(geminiDir, 'hooks'));
    }
    if (fs.existsSync(geminiPluginDir)) {
      fs.rmSync(geminiPluginDir, { recursive: true, force: true });
    }
    console.log(pc.green('✅ Antigravity skills, agents, rules, and hook scripts removed.'));

    const geminiHooksConfig = path.join(geminiDir, 'hooks.json');
    if (fs.existsSync(geminiHooksConfig)) {
      const removeGeminiHooks = await confirm({ message: 'Do you want to remove the Amiga IA Hooks config from Antigravity (~/.gemini/config/hooks.json)?', initialValue: true });
      if (isCancel(removeGeminiHooks)) process.exit(0);
      if (removeGeminiHooks) {
        try {
          fs.unlinkSync(geminiHooksConfig);
          console.log(pc.green('✅ Removed ~/.gemini/config/hooks.json.'));
        } catch (e) {
          console.log(pc.yellow('⚠️ Could not remove ~/.gemini/config/hooks.json.'));
        }
      }
    }
    uninstalledSomething = true;
  }

  if (uninstalledSomething) {
    console.log(pc.green('✅ Uninstallation complete. Safe deletion applied.'));
    console.log(pc.magenta('\n✨ Setup complete! Restart your AI assistant for changes to take effect.\n'));
  } else {
    console.log(pc.gray('ℹ️ No installations found to remove.'));
  }
}

async function showPrimaryMenu() {
  const { version: currentVersion } = getPackageInfo();
  console.log(pc.cyan('======================================================'));
  console.log(pc.bold(pc.white(` 🌟 Welcome to Amiga IA Setup Wizard [v${currentVersion}]`)));
  console.log(pc.cyan('======================================================'));
  console.log('This wizard will manage the Amiga IA Universal Agent Skills');
  console.log('for your local AI environments.\n');

  const action = await select({
    message: 'What would you like to do?',
    options: [
      { label: 'Install / Configure Assistants', value: 'install' },
      { label: 'Run Amiga Doctor (Diagnostics)', value: 'doctor' },
      { label: 'Uninstall Amiga IA', value: 'uninstall' },
      { label: 'Exit', value: 'exit' }
    ]
  });
  if (isCancel(action)) process.exit(0);

  if (action === 'install') {
    await runInstall();
  } else if (action === 'doctor') {
    await runDoctor();
  } else if (action === 'uninstall') {
    await runUninstall();
  } else {
    console.log(pc.gray('Exiting Setup Wizard.'));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const arg = args[0] ? args[0].toLowerCase() : '';

  if (arg === 'doctor' || arg === '--doctor') {
    await runDoctor();
  } else if (arg === 'install') {
    await runInstall();
  } else if (arg === 'uninstall' || arg === 'u') {
    await runUninstall();
  } else {
    await showPrimaryMenu();
  }
}

main().catch(err => {
  console.error(pc.red('An error occurred:'), err);
  process.exit(1);
});
