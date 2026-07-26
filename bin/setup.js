#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

function mergeSettings(targetPath, sourcePath) {
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
    'ami-pr-conflict-detector',
    'docs/coding-sessions',
    'debugger|TODO|FIXME'
  ];

  let cleanedCount = 0;

  for (const [event, newHooks] of Object.entries(sourceData.hooks || {})) {
    if (!targetData.hooks[event]) {
      targetData.hooks[event] = [];
    }

    const initialLen = targetData.hooks[event].length;
    targetData.hooks[event] = targetData.hooks[event].filter(existingHook => {
      const cmdString = JSON.stringify(existingHook);
      const isAmigaHook = amigaSignatures.some(sig => cmdString.includes(sig));
      return !isAmigaHook;
    });
    cleanedCount += (initialLen - targetData.hooks[event].length);

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

function runDoctor() {
  console.log('======================================================');
  console.log(' 🩺 Amiga IA Diagnostic Tool (Doctor)');
  console.log('======================================================\n');
  let issueCount = 0;

  // 1. Installation Health Check
  console.log('🔍 Checking for legacy plugin conflicts...');
  const geminiPluginDir = path.join(geminiDir, 'plugins', 'amiga-ia');
  if (fs.existsSync(geminiPluginDir)) {
    console.log(`⚠️  WARNING: Legacy plugin directory found (~/.gemini/config/plugins/amiga-ia).`);
    console.log(`    Recommended action: Run 'npx amiga-ia-setup' to clean legacy plugin directory and migrate to NPM package installation.`);
    issueCount++;
  } else {
    console.log('  ✅ No legacy plugin conflicts detected.');
  }

  // 2. YAML Frontmatter Validator
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

  // 3. Hooks Health Check
  console.log('\n🔍 Checking Claude Code hooks configuration...');
  const claudeSettingsPath = path.join(claudeDir, 'settings.json');
  if (fs.existsSync(claudeSettingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(claudeSettingsPath, 'utf8'));
      if (settings.hooks && (settings.hooks.SessionStart || settings.hooks.PreToolUse || settings.hooks.PostToolUse)) {
        console.log('  ✅ Amiga IA hooks detected and settings.json is valid JSON.');
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

  // 4. Session State GitIgnore Check
  console.log('\n🔍 Checking .gitignore configuration for session state and coding sessions...');
  const gitignorePath = path.resolve('.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    const isAmigaIgnored = gitignoreContent.split('\n').some(line => line.trim() === '.amiga-ia' || line.trim() === '.amiga-ia/');
    const isSessionsIgnored = gitignoreContent.split('\n').some(line => line.trim() === 'docs/coding-sessions' || line.trim() === 'docs/coding-sessions/');

    if (isAmigaIgnored) {
      console.log('  ✅ .amiga-ia/ directory is properly listed in .gitignore.');
    } else {
      console.log('  ℹ️  .amiga-ia/ directory is not listed in .gitignore.');
    }

    if (isSessionsIgnored) {
      console.log('  ✅ docs/coding-sessions/ directory is properly listed in .gitignore.');
    } else {
      console.log('  ℹ️  docs/coding-sessions/ directory is not listed in .gitignore. You can add it if you wish to keep markdown session summaries out of git history.');
    }
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
    runDoctor();
    rl.close();
    return;
  }

  console.log('======================================================');
  console.log(' 🌟 Welcome to Amiga IA Setup Wizard');
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
        
        const merged = mergeSettings(claudeSettings, sourceSettingsPath);
        if (merged) {
          console.log('✅ Hooks successfully merged into settings.json.');
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
    console.log('ℹ️ Note: Bash hooks installation skipped. Antigravity ignores bash hooks in secure mode.');
  }

  if (['u', 'uninstall'].includes(choice)) {
    console.log('\nUninstalling package files from AI assistants...');
    if (fs.existsSync(claudeDir)) {
      deleteMatchingFiles(sourceSkillsDir, path.join(claudeDir, 'skills'));
      deleteMatchingFiles(sourceAgentsDir, path.join(claudeDir, 'agents'));
      console.log('✅ Claude Code skills removed.');
      
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
      if (fs.existsSync(geminiPluginDir)) {
        fs.rmSync(geminiPluginDir, { recursive: true, force: true });
      }
      console.log('✅ Antigravity skills, agents, and rules removed.');
    }
    console.log('✅ Uninstallation complete. Safe deletion applied.');
  }

  if (!['c', 'claude', 'b', 'both', 'a', 'antigravity', 'u', 'uninstall'].includes(choice)) {
    console.log('Skipping configuration.');
  } else {
    const gitignorePath = path.resolve('.gitignore');
    if (fs.existsSync(gitignorePath)) {
      let content = fs.readFileSync(gitignorePath, 'utf8');
      const isAmigaIgnored = content.split('\n').some(line => line.trim() === '.amiga-ia' || line.trim() === '.amiga-ia/');
      const isSessionsIgnored = content.split('\n').some(line => line.trim() === 'docs/coding-sessions' || line.trim() === 'docs/coding-sessions/');

      if (!isAmigaIgnored) {
        const ignoreAns = await ask('\nDo you want to add .amiga-ia/ (local session state) to your project\'s .gitignore? [y/N]: ');
        if (ignoreAns.toLowerCase().trim() === 'y') {
          if (content && !content.endsWith('\n')) content += '\n';
          content += '# Amiga IA local session state\n.amiga-ia/\n';
          fs.writeFileSync(gitignorePath, content);
          console.log('✅ Added .amiga-ia/ to .gitignore.');
        }
      }

      if (!isSessionsIgnored) {
        const ignoreAns = await ask('\nDo you want to add docs/coding-sessions/ (markdown session summaries) to your project\'s .gitignore? [y/N]: ');
        if (ignoreAns.toLowerCase().trim() === 'y') {
          if (content && !content.endsWith('\n')) content += '\n';
          content += '# Amiga IA session summaries\ndocs/coding-sessions/\n';
          fs.writeFileSync(gitignorePath, content);
          console.log('✅ Added docs/coding-sessions/ to .gitignore.');
        }
      }
    }
    console.log('\n✨ Setup complete! Restart your AI assistant for changes to take effect.');
  }
  
  rl.close();
}

main().catch(err => {
  console.error('An error occurred:', err);
  rl.close();
});
