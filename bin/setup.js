#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise(resolve => rl.question(query, resolve));

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
    'ami-post-tool-use'
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

async function runDoctor() {
  const { name: pkgName, version: currentVersion } = getPackageInfo();
  console.log('======================================================');
  console.log(` 🩺 Amiga IA Diagnostic Tool (Doctor) [v${currentVersion}]`);
  console.log('======================================================\n');
  let issueCount = 0;

  // 1. Package Version & Update Status
  console.log('🔍 Checking package version and update status...');
  console.log(`  Current installed version: v${currentVersion}`);
  const latestVersion = await getLatestNpmVersion(pkgName);
  if (latestVersion) {
    if (isNewerVersion(currentVersion, latestVersion)) {
      console.log(`  💡 ADVISORY: A new version (v${latestVersion}) is available on NPM!`);
      console.log(`     Recommendation: Run 'npx ${pkgName}@latest' or update via your package manager to enjoy the latest capabilities and bug fixes.`);
      // Note: Update availability is treated as an informational advisory and does not increment issueCount
    } else {
      console.log(`  ✅ You are using the latest published version (v${latestVersion}).`);
    }
  } else {
    console.log(`  ℹ️  Could not reach NPM registry to check for updates (offline or timed out).`);
  }

  // 2. Installation Health Check
  console.log('\n🔍 Checking for legacy plugin conflicts...');
  const geminiPluginDir = path.join(geminiDir, 'plugins', 'amiga-ia');
  if (fs.existsSync(geminiPluginDir)) {
    console.log(`⚠️  WARNING: Legacy plugin directory found (~/.gemini/config/plugins/amiga-ia).`);
    console.log(`    Recommended action: Run 'npx amiga-ia-setup' to clean legacy plugin directory and migrate to NPM package installation.`);
    issueCount++;
  } else {
    console.log('  ✅ No legacy plugin conflicts detected.');
  }

  // 3. YAML Frontmatter Validator
  console.log('\n🔍 Validating SKILL.md YAML frontmatter...');
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
        console.log(`❌ ERROR: Missing YAML frontmatter in ${path.relative(sourceSkillsDir, file)}`);
        invalidSkills++;
      } else {
        const hasName = match[1].includes('name:');
        const hasDesc = match[1].includes('description:');
        const hasTools = match[1].includes('allowed-tools:');
        if (!hasName || !hasDesc || !hasTools) {
          console.log(`⚠️  WARNING: Incomplete YAML frontmatter in ${path.relative(sourceSkillsDir, file)} (Missing: ${[!hasName && 'name', !hasDesc && 'description', !hasTools && 'allowed-tools'].filter(Boolean).join(', ')})`);
          invalidSkills++;
        }
      }
    });
    if (invalidSkills === 0) {
      console.log(`  ✅ All ${skillFiles.length} skills have valid YAML frontmatter.`);
    } else {
      issueCount += invalidSkills;
    }
  }

  // 4. Hooks Health Check
  console.log('\n🔍 Checking Claude Code hooks configuration...');
  const claudeSettingsPath = path.join(claudeDir, 'settings.json');
  if (fs.existsSync(claudeSettingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8'));
      if (settings.hooks && (settings.hooks.PreToolUse || settings.hooks.PostToolUse)) {
        console.log('  ✅ Amiga IA hooks detected and settings.json is valid JSON.');

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

        const amigaSigs = ['commit-assistant', 'push-assistant', 'ami-pr-publisher', 'ami-pr-reviewer', 'ami-pr-conflict-detector', 'docs/coding-sessions', 'debugger|TODO|FIXME', 'ami-session-start', 'ami-pre-tool-use', 'ami-post-tool-use'];
        const isAmigaHook = (cmd) => cmd && typeof cmd === 'string' && amigaSigs.some(sig => cmd.includes(sig));

        const hasNodeHooks = hookCmds.some(h => isAmigaHook(h.command) && h.command.includes('node '));
        const hasBashHooks = hookCmds.some(h => isAmigaHook(h.command) && !h.command.includes('node ') && (h.shell === 'bash' || !h.shell));
        const hasPwshHooks = hookCmds.some(h => isAmigaHook(h.command) && !h.command.includes('node ') && (h.shell === 'pwsh' || h.shell === 'powershell'));

        if (hasNodeHooks) {
          console.log('  ✅ Node.js hooks detected — universal cross-platform support.');
        } else if (hasPwshHooks && isWindows) {
          console.log('  ✅ PowerShell hooks detected — compatible with Windows.');
        } else if (hasBashHooks && !isWindows) {
          console.log('  ✅ Bash hooks detected — compatible with Unix/macOS.');
        } else if (hasBashHooks && isWindows) {
          console.log('  ⚠️  WARNING: Bash hooks detected on Windows. They may fail without Git Bash setup.');
          console.log("     Recommendation: Run 'npx amiga-ia-setup' and select Node.js (universal) or PowerShell hooks.");
          issueCount++;
        } else if (hasPwshHooks && !isWindows) {
          console.log('  ⚠️  WARNING: PowerShell hooks detected on a non-Windows OS.');
          console.log("     Recommendation: Run 'npx amiga-ia-setup' and select Node.js (universal) or Bash hooks.");
          issueCount++;
        }
      } else {
        console.log('  ℹ️  No Amiga IA hooks found in ~/.claude/settings.json (Optional feature).');
      }
    } catch (e) {
      console.log('❌ ERROR: ~/.claude/settings.json contains invalid JSON syntax.');
      issueCount++;
    }
  } else {
    console.log('  ℹ️  Claude Code settings file not found (~/.claude/settings.json).');
  }

  // 5. Legacy Directory Check
  const sessionsDir = path.resolve('docs', 'coding-sessions');
  if (fs.existsSync(sessionsDir)) {
    console.log('\n🔍 Checking project workspace for legacy structures...');
    console.log('  💡 ADVISORY: Found legacy docs/coding-sessions/ directory.');
    console.log('     Recommendation: Extract any valuable architectural insights or pending tasks using ami-learnings-extractor and ami-doc-manager skills, and then delete docs/coding-sessions/ to save tokens and keep your repository clean.');
  }

  console.log('\n======================================================');
  if (issueCount === 0) {
    console.log('✨ Diagnostic complete: All checks passed smoothly!');
  } else {
    console.log(`⚠️  Diagnostic complete: Found ${issueCount} warning(s)/issue(s).`);
  }
  console.log('======================================================\n');
}

async function main() {
  if (process.argv.includes('doctor') || process.argv.includes('--doctor')) {
    await runDoctor();
    rl.close();
    return;
  }

  const { version: currentVersion } = getPackageInfo();
  console.log('======================================================');
  console.log(` 🌟 Welcome to Amiga IA Setup Wizard [v${currentVersion}]`);
  console.log('======================================================');
  console.log('This wizard will install the Amiga IA Universal Agent Skills');
  console.log('into your local AI environments.\n');

  const answer = await ask('Which assistant do you want to configure? (Claude [c], Antigravity [a], Both [b], Uninstall [u], Skip [s]): ');
  const choice = answer.toLowerCase().trim();

  if (['c', 'claude', 'b', 'both'].includes(choice)) {
    console.log('\nInstalling for Claude Code...');
    cleanOrphanedFiles(sourceSkillsDir, path.join(claudeDir, 'skills'));
    cleanOrphanedFiles(sourceAgentsDir, path.join(claudeDir, 'agents'));
    copyRecursiveSync(sourceSkillsDir, path.join(claudeDir, 'skills'));
    copyRecursiveSync(sourceAgentsDir, path.join(claudeDir, 'agents'));
    console.log('✅ Skills and Agents directories successfully configured.');

    if (fs.existsSync(sourceSettingsPath)) {
      console.log('\nClaude Code supports powerful background Hooks (Pre-commit checks, context restoring).');
      const hookAns = await ask('Install recommended Amiga IA Hooks? (We will merge them and create a backup) [y/N]: ');
      if (hookAns.toLowerCase().trim() === 'y') {
        if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });
        
        const claudeSettings = path.join(claudeDir, 'settings.json');
        const backupPath = path.join(claudeDir, 'settings.json.amiga-backup');
        
        if (fs.existsSync(claudeSettings) && !fs.existsSync(backupPath)) {
          fs.copyFileSync(claudeSettings, backupPath);
          console.log('✅ Backup created at ~/.claude/settings.json.amiga-backup');
        }
        
        const engineAns = await ask(
          `\nWhich hook engine should be used?\n` +
          `  [n] Node.js (Universal - works on any OS) ← recommended\n` +
          `  [b] Bash (macOS/Linux)\n` +
          `  [p] PowerShell (Windows)\n` +
          `  [n/b/p] (default: n): `
        );
        const engine = engineAns.toLowerCase().trim() || 'n';

        let merged = false;
        if (engine === 'b' || engine === 'bash') {
          merged = mergeSettings(claudeSettings, sourceSettingsPath);
        } else if (engine === 'p' || engine === 'powershell' || engine === 'pwsh') {
          const pwshSettingsPath = path.join(__dirname, '../hooks-pwsh.json');
          merged = mergeSettings(claudeSettings, pwshSettingsPath);
        } else {
          merged = installNodeHooks(claudeDir, claudeSettings);
        }

        if (merged) {
          console.log('✅ Hooks successfully configured and merged into settings.json.');
        } else {
          console.log('⚠️ Hooks merge skipped due to JSON parse error.');
        }
      } else {
        console.log('⏭️ Hooks installation skipped.');
      }
    }
  }

  if (['a', 'antigravity', 'b', 'both'].includes(choice)) {
    console.log('\nInstalling for Antigravity...');
    
    // Clean legacy plugin directory in ~/.gemini/config/plugins/amiga-ia if it exists
    const geminiPluginDir = path.join(geminiDir, 'plugins', 'amiga-ia');
    if (fs.existsSync(geminiPluginDir)) {
      fs.rmSync(geminiPluginDir, { recursive: true, force: true });
      console.log('🧹 Cleaned legacy plugin directory at ~/.gemini/config/plugins/amiga-ia');
    }

    cleanOrphanedFiles(sourceSkillsDir, path.join(geminiDir, 'skills'));
    cleanOrphanedFiles(sourceAgentsDir, path.join(geminiDir, 'agents'));
    cleanOrphanedFiles(sourceRulesDir, path.join(geminiDir, 'rules'));
    copyRecursiveSync(sourceSkillsDir, path.join(geminiDir, 'skills'));
    copyRecursiveSync(sourceAgentsDir, path.join(geminiDir, 'agents'));
    copyRecursiveSync(sourceRulesDir, path.join(geminiDir, 'rules'));
    console.log('✅ Skills, Agents, and Rules directories successfully configured at ~/.gemini/config/');

    if (fs.existsSync(sourceSettingsPath)) {
      console.log('\nAntigravity supports background Hooks via universal Node.js scripts (Pre-commit reminders, Debug statement checks).');
      const hookAns = await ask('Install recommended universal Amiga IA Hooks for Antigravity? [y/N]: ');
      if (hookAns.toLowerCase().trim() === 'y') {
        if (!fs.existsSync(geminiDir)) fs.mkdirSync(geminiDir, { recursive: true });
        const geminiSettings = path.join(geminiDir, 'hooks.json');
        const merged = installNodeHooks(geminiDir, geminiSettings);
        if (merged) {
          console.log('✅ Universal Node.js Hooks successfully configured at ~/.gemini/config/hooks.json.');
        } else {
          console.log('⚠️ Hooks configuration skipped due to JSON parse error.');
        }
      } else {
        console.log('⏭️ Hooks installation skipped for Antigravity.');
      }
    }
  }

  if (['u', 'uninstall'].includes(choice)) {
    console.log('\nUninstalling package files from AI assistants...');
    if (fs.existsSync(claudeDir)) {
      deleteMatchingFiles(sourceSkillsDir, path.join(claudeDir, 'skills'));
      deleteMatchingFiles(sourceAgentsDir, path.join(claudeDir, 'agents'));
      const sourceScriptsDir = path.join(__dirname, '../hooks/scripts');
      if (fs.existsSync(sourceScriptsDir)) {
        deleteMatchingFiles(sourceScriptsDir, path.join(claudeDir, 'hooks'));
      }
      console.log('✅ Claude Code skills and hook scripts removed.');
      
      const hookAns = await ask('Do you want to remove the Amiga IA Hooks from Claude Code settings? [y/N]: ');
      if (hookAns.toLowerCase().trim() === 'y') {
        const claudeSettings = path.join(claudeDir, 'settings.json');
        const backupPath = path.join(claudeDir, 'settings.json.amiga-backup');
        
        if (fs.existsSync(backupPath)) {
          fs.copyFileSync(backupPath, claudeSettings);
          fs.unlinkSync(backupPath);
          console.log('✅ Restored settings.json from backup.');
        } else if (fs.existsSync(claudeSettings)) {
           console.log('⚠️ No backup found. Please remove the hooks manually from ~/.claude/settings.json to avoid deleting your custom settings.');
        }
      }
    }
    if (fs.existsSync(geminiDir)) {
      const geminiPluginDir = path.join(geminiDir, 'plugins', 'amiga-ia');
      deleteMatchingFiles(sourceSkillsDir, path.join(geminiDir, 'skills'));
      deleteMatchingFiles(sourceAgentsDir, path.join(geminiDir, 'agents'));
      deleteMatchingFiles(sourceRulesDir, path.join(geminiDir, 'rules'));
      const sourceScriptsDir = path.join(__dirname, '../hooks/scripts');
      if (fs.existsSync(sourceScriptsDir)) {
        deleteMatchingFiles(sourceScriptsDir, path.join(geminiDir, 'hooks'));
      }
      if (fs.existsSync(geminiPluginDir)) {
        fs.rmSync(geminiPluginDir, { recursive: true, force: true });
      }
      console.log('✅ Antigravity skills, agents, rules, and hook scripts removed.');

      const geminiHooksConfig = path.join(geminiDir, 'hooks.json');
      if (fs.existsSync(geminiHooksConfig)) {
        const hookAnsGem = await ask('Do you want to remove the Amiga IA Hooks config from Antigravity (~/.gemini/config/hooks.json)? [y/N]: ');
        if (hookAnsGem.toLowerCase().trim() === 'y') {
          try {
            fs.unlinkSync(geminiHooksConfig);
            console.log('✅ Removed ~/.gemini/config/hooks.json.');
          } catch (e) {
            console.log('⚠️ Could not remove ~/.gemini/config/hooks.json.');
          }
        }
      }
    }
    console.log('✅ Uninstallation complete. Safe deletion applied.');
  }

  if (!['c', 'claude', 'b', 'both', 'a', 'antigravity', 'u', 'uninstall'].includes(choice)) {
    console.log('Skipping configuration.');
  } else {
    const sessionsDir = path.resolve('docs', 'coding-sessions');
    if (fs.existsSync(sessionsDir)) {
      console.log('\n💡 ADVISORY: Found legacy docs/coding-sessions/ directory.');
      console.log('   Recommendation: Extract any valuable architectural insights or pending tasks using ami-learnings-extractor and ami-doc-manager skills, and then delete docs/coding-sessions/ to save tokens and keep your repository clean.');
    }
    console.log('\n✨ Setup complete! Restart your AI assistant for changes to take effect.');
  }
  
  rl.close();
}

main().catch(err => {
  console.error('An error occurred:', err);
  rl.close();
});
