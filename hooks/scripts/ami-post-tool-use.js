const { execFileSync } = require('child_process');
const fs = require('fs');

function extractModifiedContent(args) {
  if (!args || typeof args !== 'object') return '';
  const directFields = [args.Replacement, args.new_str, args.new_string, args.Content, args.content, args.patch];
  for (const field of directFields) {
    if (typeof field === 'string' && field.length > 0) return field;
  }
  if (Array.isArray(args.edits)) {
    return args.edits.map(e => e?.new_text || e?.replacement || e?.Replacement || '').join('\n');
  }
  return '';
}

const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const toolArgs = input.toolCall?.args || input.tool_input || input;
    const filePath = toolArgs.file_path || toolArgs.TargetFile || toolArgs.AbsolutePath || toolArgs.target_file || toolArgs.path || '';

    let added = extractModifiedContent(toolArgs);

    if (!added && filePath && fs.existsSync(filePath)) {
      try {
        const gitEnv = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
        // execFileSync passes the path as an argv entry, so a crafted file name cannot reach a shell.
        execFileSync('git', ['ls-files', '--error-unmatch', '--', filePath], { stdio: 'pipe', env: gitEnv });
        const diff = execFileSync('git', ['diff', '-U0', '--', filePath], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: gitEnv });
        // Only added lines count; removed lines and the "+++" header must not trigger the warning.
        added = diff.split(/\r?\n/).filter(line => line.startsWith('+') && !line.startsWith('+++')).join('\n');
      } catch {
        added = fs.readFileSync(filePath, 'utf8');
      }
    }

    if (added && /console\.log|debugger|TODO|FIXME/.test(added)) {
      const targetLabel = filePath ? `in modified lines of ${filePath}` : 'in recent tool modifications';
      console.error(`Warning: Detected debug statements or TODOs ${targetLabel}. Review before commit.`);
    }
  } catch { /* Don't block on parse errors */ }
  finally {
    console.log(JSON.stringify({}));
    process.exit(0);
  }
});
