const { execSync } = require('child_process');
const fs = require('fs');

const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const filePath = input.tool_input?.file_path || input.tool_input?.TargetFile || input.tool_input?.AbsolutePath || input.TargetFile || input.AbsolutePath;

    if (!filePath || !fs.existsSync(filePath)) {
      process.exit(0);
      return;
    }

    let added = '';
    try {
      execSync(`git ls-files --error-unmatch "${filePath}"`, { stdio: 'pipe' });
      added = execSync(`git diff -U0 "${filePath}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    } catch {
      added = fs.readFileSync(filePath, 'utf8');
    }

    if (/console\.log|debugger|TODO|FIXME/.test(added)) {
      console.error(`Warning: Detected debug statements or TODOs in modified lines of ${filePath}. Review before commit.`);
    }
  } catch { /* Don't block on parse errors */ }
  process.exit(0);
});
