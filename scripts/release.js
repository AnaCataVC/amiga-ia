#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { confirm, intro, outro, isCancel } = require('@clack/prompts');
const pc = require('picocolors');

const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
const EXPECTED_ACCOUNT = 'AnaCataVC';

function runCmd(cmd, options = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: options.silent ? 'pipe' : 'inherit',
    ...options
  });
}

function runCmdOutput(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    }).trim();
  } catch (err) {
    if (options.ignoreError) return '';
    throw err;
  }
}

function parseSemVer(version) {
  const clean = version.replace(/^v/, '');
  if (!SEMVER_REGEX.test(clean)) {
    throw new Error(`Invalid SemVer format: "${version}". Expected format: X.Y.Z or X.Y.Z-rc.1`);
  }
  return clean;
}

function isNewerVersion(current, target) {
  const currentParts = current.split('-')[0].split('.').map(Number);
  const targetParts = target.split('-')[0].split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (targetParts[i] > currentParts[i]) return true;
    if (targetParts[i] < currentParts[i]) return false;
  }

  // Pre-release comparison
  if (target.includes('-') && !current.includes('-')) return false;
  if (!target.includes('-') && current.includes('-')) return true;

  return false;
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const autoYes = args.includes('--yes') || args.includes('-y');
  const notesFlagIndex = args.indexOf('--notes');
  const customNotesFile = notesFlagIndex !== -1 ? args[notesFlagIndex + 1] : null;

  // Filter out flags to extract target version
  const positionalArgs = args.filter(arg => !arg.startsWith('-') && arg !== customNotesFile);
  const targetVersionRaw = positionalArgs[0];

  intro(pc.bold(pc.cyan('Amiga IA Release CLI (Hardened)')));

  const rootDir = path.resolve(__dirname, '..');
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const currentVersion = pkg.version;

  if (!targetVersionRaw) {
    console.error(pc.red('Error: Target version is required. Example: npm run release 4.8.0'));
    process.exit(1);
  }

  // Mitigation 2: Strict SemVer Validation
  let targetVersion;
  try {
    targetVersion = parseSemVer(targetVersionRaw);
  } catch (err) {
    console.error(pc.red(`Error: ${err.message}`));
    process.exit(1);
  }

  if (!isNewerVersion(currentVersion, targetVersion) && !isDryRun) {
    console.error(pc.red(`Error: Target version (${targetVersion}) must be greater than current version (${currentVersion}).`));
    process.exit(1);
  }

  console.log(pc.blue(`Current Version: ${pc.yellow('v' + currentVersion)}`));
  console.log(pc.blue(`Target Release:  ${pc.green('v' + targetVersion)}`));
  if (isDryRun) console.log(pc.magenta('[DRY-RUN MODE ACTIVATED - No mutations will be executed]'));

  // Pre-Flight Checks
  console.log(pc.gray('\nRunning Pre-Flight Checks...'));

  // 1. Branch Check
  const currentBranch = runCmdOutput('git branch --show-current', { cwd: rootDir });
  if (currentBranch !== 'main') {
    console.error(pc.red(`Error: Releases must be cut strictly from 'main' branch. Current branch: '${currentBranch}'.`));
    process.exit(1);
  }
  console.log(pc.green(`  Check: Active branch is 'main'.`));

  // 2. Working Tree Cleanliness Check
  const gitStatus = runCmdOutput('git status --porcelain', { cwd: rootDir });
  if (gitStatus.length > 0) {
    console.error(pc.red('Error: Working tree is dirty. Commit or stash your changes before releasing.'));
    console.error(pc.gray(gitStatus));
    process.exit(1);
  }
  console.log(pc.green('  Check: Working tree is clean.'));

  // 3. GitHub Auth & Token Isolation (Mitigation 3)
  let ghToken = '';
  try {
    runCmd(`gh auth switch -u ${EXPECTED_ACCOUNT} --hostname github.com`, { cwd: rootDir, silent: true });
    ghToken = runCmdOutput(`gh auth token -u ${EXPECTED_ACCOUNT} --hostname github.com`, { cwd: rootDir });
    console.log(pc.green(`  Check: GitHub CLI authenticated as '${EXPECTED_ACCOUNT}'.`));
  } catch (err) {
    console.error(pc.red(`Error: Failed to obtain GitHub token for '${EXPECTED_ACCOUNT}'. Run 'gh auth login'.`));
    process.exit(1);
  }

  // Mitigation 1: Test-First Order (Before mutating any files)
  console.log(pc.gray('\nExecuting Test-First Pre-Flight (npm run prepublishOnly)...'));
  try {
    runCmd('npm run prepublishOnly', { cwd: rootDir, silent: false });
    console.log(pc.green('  Check: Prepublish tests and manifest synchronization passed.'));
  } catch (err) {
    console.error(pc.red('\nError: Tests or build validation failed. Working tree remains clean. Release aborted.'));
    process.exit(1);
  }

  // Determine Release Notes
  let releaseNotes = '';
  if (customNotesFile && fs.existsSync(customNotesFile)) {
    releaseNotes = fs.readFileSync(customNotesFile, 'utf8');
  } else {
    // Generate default bilingual template
    releaseNotes = `# Release v${targetVersion}\n\n## Features\n\n- Release v${targetVersion} of @anacatavc/amiga-ia.\n\n---\n# Lanzamiento v${targetVersion}\n\n## Nuevas Funcionalidades\n\n- Lanzamiento v${targetVersion} de @anacatavc/amiga-ia.\n`;
  }

  console.log(pc.cyan('\nProposed Release Notes Summary:'));
  console.log(pc.gray('--------------------------------------------------'));
  console.log(releaseNotes.trim());
  console.log(pc.gray('--------------------------------------------------'));

  if (isDryRun) {
    outro(pc.green('Dry-run completed successfully! All checks passed with zero errors.'));
    process.exit(0);
  }

  // Mitigation 5: Interactive Confirmation Gate
  if (!autoYes) {
    const shouldProceed = await confirm({
      message: `Do you confirm cutting release v${targetVersion} and pushing to origin/main?`
    });

    if (isCancel(shouldProceed) || !shouldProceed) {
      outro(pc.yellow('Release aborted by user. No changes were made.'));
      process.exit(0);
    }
  }

  // Execution with Automatic Rollback (Mitigation 4)
  let committed = false;
  let pushed = false;
  const tempNotesPath = path.join(rootDir, 'release-notes-temp.md');

  try {
    console.log(pc.blue('\n1. Applying atomic version bump...'));
    runCmd(`npm version ${targetVersion} --no-git-tag-version`, { cwd: rootDir });

    console.log(pc.blue('2. Creating atomic pre-tag commit...'));
    runCmd('git add package.json package-lock.json', { cwd: rootDir });
    runCmd(`git commit -m "chore(release): bump version to v${targetVersion} [skip ci]"`, { cwd: rootDir });
    committed = true;

    console.log(pc.blue('3. Pushing atomic commit to origin/main...'));
    runCmd('git push origin main', { cwd: rootDir });
    pushed = true;

    console.log(pc.blue('4. Publishing GitHub Release...'));
    fs.writeFileSync(tempNotesPath, releaseNotes, 'utf8');
    
    // Scoped execution with GH_TOKEN
    const envWithToken = { ...process.env, GH_TOKEN: ghToken };
    runCmd(`gh release create v${targetVersion} -F release-notes-temp.md --title "Release v${targetVersion}"`, {
      cwd: rootDir,
      env: envWithToken
    });

    if (fs.existsSync(tempNotesPath)) {
      fs.unlinkSync(tempNotesPath);
    }

    console.log(pc.green(`\nSuccess: Release v${targetVersion} published cleanly to GitHub!`));
    console.log(pc.gray(`View online: https://github.com/${EXPECTED_ACCOUNT}/amiga-ia/releases/tag/v${targetVersion}`));
    outro(pc.bold(pc.green(`Release v${targetVersion} complete!`)));
  } catch (err) {
    console.error(pc.red(`\nRelease execution failed: ${err.message}`));

    if (fs.existsSync(tempNotesPath)) {
      try { fs.unlinkSync(tempNotesPath); } catch (_) {}
    }

    // Rollback logic
    if (!pushed) {
      console.log(pc.yellow('\nRolling back unpushed local changes...'));
      try {
        if (committed) {
          runCmd('git reset --hard HEAD~1', { cwd: rootDir });
        } else {
          runCmd('git restore package.json package-lock.json', { cwd: rootDir });
        }
        console.log(pc.green('Rollback complete: working tree restored to clean state.'));
      } catch (rollbackErr) {
        console.error(pc.red(`Rollback error: ${rollbackErr.message}`));
      }
    } else {
      console.error(pc.red('\nCRITICAL: Commit was already pushed to remote. Inspect repository state manually.'));
    }

    process.exit(1);
  }
}

main().catch(err => {
  console.error(pc.red(`Fatal error: ${err.message}`));
  process.exit(1);
});
