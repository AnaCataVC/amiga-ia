const { execFileSync } = require('child_process');
const fs = require('fs');

const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const toolArgs = input.toolCall?.args || input.tool_input || input;
    const filePath = toolArgs.file_path || toolArgs.TargetFile || toolArgs.AbsolutePath || toolArgs.target_file || toolArgs.path || '';

    if (filePath && fs.existsSync(filePath)) {
      let added = '';
      try {
        // execFileSync passes the path as an argv entry, so a crafted file name cannot reach a shell.
        execFileSync('git', ['ls-files', '--error-unmatch', '--', filePath], { stdio: 'pipe' });
        const diff = execFileSync('git', ['diff', '-U0', '--', filePath], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        // Only added lines count; removed lines and the "+++" header must not trigger the warning.
        added = diff.split(/\r?\n/).filter(line => line.startsWith('+') && !line.startsWith('+++')).join('\n');
      } catch {
        added = fs.readFileSync(filePath, 'utf8');
      }

      if (/console\.log|debugger|TODO|FIXME/.test(added)) {
        console.error(`Warning: Detected debug statements or TODOs in modified lines of ${filePath}. Review before commit.`);
      }
    }
  } catch { /* Don't block on parse errors */ }
  finally {
    console.log(JSON.stringify({}));
    process.exit(0);
  }
});
