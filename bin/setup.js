#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const homeDir = os.homedir();
const claudeDir = path.join(homeDir, '.claude');
const geminiDir = path.join(homeDir, '.gemini', 'config');

const sourceSkillsDir = path.join(__dirname, '../skills');
const sourceAgentsDir = path.join(__dirname, '../agents');
const sourceSettingsPath = path.join(__dirname, '../settings.json');

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

function setupClaude() {
  console.log('\nInstalling for Claude Code...');
  copyRecursiveSync(sourceSkillsDir, path.join(claudeDir, 'skills'));
  copyRecursiveSync(sourceAgentsDir, path.join(claudeDir, 'agents'));
  
  if (fs.existsSync(sourceSettingsPath)) {
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    fs.copyFileSync(sourceSettingsPath, path.join(claudeDir, 'settings.json'));
  }
  console.log('✅ Claude Code successfully configured.');
}

function setupAntigravity() {
  console.log('\nInstalling for Antigravity...');
  copyRecursiveSync(sourceSkillsDir, path.join(geminiDir, 'skills'));
  copyRecursiveSync(sourceAgentsDir, path.join(geminiDir, 'agents'));
  console.log('✅ Antigravity successfully configured.');
}

function deleteMatchingFiles(src, dest) {
  if (!fs.existsSync(src) || !fs.existsSync(dest)) return;
  const isDirectory = fs.statSync(src).isDirectory();
  if (isDirectory) {
    fs.readdirSync(src).forEach(function(childItemName) {
      deleteMatchingFiles(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.unlinkSync(dest);
  }
}

function uninstall() {
  console.log('\nUninstalling package files from AI assistants...');
  if (fs.existsSync(claudeDir)) {
    deleteMatchingFiles(sourceSkillsDir, path.join(claudeDir, 'skills'));
    deleteMatchingFiles(sourceAgentsDir, path.join(claudeDir, 'agents'));
    const claudeSettings = path.join(claudeDir, 'settings.json');
    if (fs.existsSync(sourceSettingsPath) && fs.existsSync(claudeSettings)) {
      fs.unlinkSync(claudeSettings);
    }
  }
  if (fs.existsSync(geminiDir)) {
    deleteMatchingFiles(sourceSkillsDir, path.join(geminiDir, 'skills'));
    deleteMatchingFiles(sourceAgentsDir, path.join(geminiDir, 'agents'));
  }
  console.log('✅ Uninstallation complete. Safe deletion applied.');
}

console.log('=================================');
console.log(' Welcome to Amiga IA Setup Wizard');
console.log('=================================\n');

rl.question('Which assistant do you want to configure? (Claude [c], Antigravity [a], Both [b], Uninstall [u], Skip [s]): ', (answer) => {
  const choice = answer.toLowerCase().trim();
  
  if (choice === 'c' || choice === 'claude') {
    setupClaude();
  } else if (choice === 'a' || choice === 'antigravity') {
    setupAntigravity();
  } else if (choice === 'b' || choice === 'both') {
    setupClaude();
    setupAntigravity();
  } else if (choice === 'u' || choice === 'uninstall') {
    uninstall();
  } else {
    console.log('Skipping configuration.');
  }

  console.log('\nSetup complete!\n');
  rl.close();
});
