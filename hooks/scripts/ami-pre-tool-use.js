const { execSync } = require('child_process');

const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const toolArgs = input.toolCall?.args || input.tool_input || input;
    const command = toolArgs.command || toolArgs.CommandLine || toolArgs.command_line || '';

    if (command) {
      // 1. Blocking-wait notice
      if (/^\s*sleep\s+\d+|\bgh\s+run\s+watch\b|\bdocker\s+compose\s+up\b(?!\s.*-d\b)/.test(command)) {
        console.error('Notice: Blocking command detected. Consider running in background or using subagent orchestration.');
      }

      // 2. Secret and path check on commit/push
      if (/\bgit\s+(commit|push)\b/.test(command)) {
        try {
          let diffOutput = '';
          try {
            diffOutput = execSync('git diff --cached -U0', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            if (!diffOutput.trim()) {
              diffOutput = execSync('git diff HEAD~1..HEAD -U0', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            }
          } catch {
            diffOutput = '';
          }

          if (diffOutput) {
            const addedLines = diffOutput
              .split(/\r?\n/)
              .filter(l => l.startsWith('+') && !l.startsWith('+++'));

            const secretPatterns = [
              /AKIA[0-9A-Z]{16}/,
              /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
              /xox[baprs]-[0-9A-Za-z-]{10,}/,
              /gh[pousr]_[A-Za-z0-9]{36,}/,
              /AIza[0-9A-Za-z_\-]{35}/,
              /(?:api[_-]?key|secret|access[_-]?token|auth[_-]?token|password|passwd)\s*[:=]\s*["'][A-Za-z0-9/+_\-]{16,}["']/i
            ];
            const secretAllowlist = /(?:getenv|environ|process\.env|config\[|settings\.|<[^>]+>|\$\{|example|placeholder|changeme|your[_-]|xxxx|\*\*\*|pragma:\s*allowlist\s*secret)/i;

            for (const line of addedLines) {
              if (secretAllowlist.test(line)) continue;
              for (const pat of secretPatterns) {
                if (pat.test(line)) {
                  console.error(`SECURITY BLOCK: Potential secret detected in git diff: ${pat}. Bypass with 'pragma: allowlist secret' if intentional.`);
                  console.log(JSON.stringify({ decision: 'block', reason: 'Security policy violation: detected credential in diff.' }));
                  process.exit(2);
                }
              }
            }

            const pathPattern = /(?:C:\\Users\\[a-zA-Z0-9_.-]+|\/(?:home|Users)\/[a-zA-Z0-9_.-]+)/i;
            for (const line of addedLines) {
              if (/pragma:\s*allowlist\s*path/i.test(line)) continue;
              if (pathPattern.test(line)) {
                console.error("PATH PRIVACY BLOCK: Absolute local machine path detected in git diff. Use relative paths or bypass with 'pragma: allowlist path'.");
                console.log(JSON.stringify({ decision: 'block', reason: 'Privacy policy violation: detected local absolute path in diff.' }));
                process.exit(2);
              }
            }
          }
        } catch { /* Ignore git execution issues */ }
      }

      if (command.includes('git commit')) {
        console.error('Reminder: Use ami-plan-commits for proper commit formatting.');
      }
      if (command.includes('git push')) {
        console.error('Reminder: Run ami-push-assistant agent before pushing code.');
      }
      if (command.includes('gh pr create')) {
        console.error('Reminder: Consider running ami-detect-pr-conflicts or ami-pr-publisher before creating PR.');
      }
    }
  } catch { /* Don't block on parse errors */ }
  finally {
    console.log(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }
});
