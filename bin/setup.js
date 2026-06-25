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
    if (!isRoot && fs.existsSync(dest) && fs.readdirSync(dest).length === 0) {
      fs.rmdirSync(dest);
    }
  } else {
    fs.unlinkSync(dest);
  }
}

function mergeSettings(targetPath, sourcePath) {
  let targetData = { hooks: {} };
  if (fs.existsSync(targetPath)) {
    try {
      targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Could not parse existing settings.json. Proceeding with overwrite.');
    }
  }
  const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

  if (!targetData.hooks) targetData.hooks = {};
  
  for (const [event, newHooks] of Object.entries(sourceData.hooks || {})) {
    if (!targetData.hooks[event]) {
      targetData.hooks[event] = [...newHooks];
    } else {
      for (const newHook of newHooks) {
        // Very simplistic check to avoid exact duplicates
        const exists = targetData.hooks[event].some(h => 
          JSON.stringify(h) === JSON.stringify(newHook) || 
          (h.hooks && newHook.hooks && h.hooks[0]?.command === newHook.hooks[0]?.command)
        );
        if (!exists) {
          targetData.hooks[event].push(newHook);
        }
      }
    }
  }
  
  fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2));
}

async function main() {
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
        
        mergeSettings(claudeSettings, sourceSettingsPath);
        console.log('✅ Hooks successfully merged into settings.json.');
      } else {
        console.log('⏭️ Hooks installation skipped.');
      }
    }
  }

  if (['a', 'antigravity', 'b', 'both'].includes(choice)) {
    console.log('\nInstalling for Antigravity...');
    const geminiPluginDir = path.join(geminiDir, 'plugins', 'amiga-ia');
    cleanOrphanedFiles(sourceSkillsDir, path.join(geminiDir, 'skills'));
    copyRecursiveSync(sourceSkillsDir, path.join(geminiDir, 'skills'));
    
    if (!fs.existsSync(geminiPluginDir)) fs.mkdirSync(geminiPluginDir, { recursive: true });
    fs.copyFileSync(path.join(__dirname, '../plugin.json'), path.join(geminiPluginDir, 'plugin.json'));
    
    cleanOrphanedFiles(sourceAgentsDir, path.join(geminiPluginDir, 'agents'));
    copyRecursiveSync(sourceAgentsDir, path.join(geminiPluginDir, 'agents'));
    console.log('✅ Skills and Plugin (Agents) directories successfully configured.');
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
      if (fs.existsSync(geminiPluginDir)) {
        fs.rmSync(geminiPluginDir, { recursive: true, force: true });
      }
      console.log('✅ Antigravity skills and plugin removed.');
    }
    console.log('✅ Uninstallation complete. Safe deletion applied.');
  }

  if (!['c', 'claude', 'b', 'both', 'a', 'antigravity', 'u', 'uninstall'].includes(choice)) {
    console.log('Skipping configuration.');
  } else {
    console.log('\nSetup complete!');
  }
  
  console.log('---------------------------------------------------------');
  console.log('💡 Note: amiga-ia is also available natively as a Plugin.');
  console.log('For Antigravity: agy plugin install https://github.com/AnaCataVC/amiga-ia');
  console.log('For Claude Code: /plugin marketplace add AnaCataVC/amiga-ia');
  console.log('---------------------------------------------------------\n');
  
  rl.close();
}

main().catch(err => {
  console.error('An error occurred:', err);
  rl.close();
});
