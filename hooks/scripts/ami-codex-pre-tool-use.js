const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  const reminders = [];
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const command = input.tool_input?.command || '';
    if (command.includes('git commit')) reminders.push('Use the ami-plan-commits skill before creating a commit.');
    if (command.includes('git push')) reminders.push('Use the appropriate Amiga IA push workflow before pushing.');
    if (command.includes('gh pr create')) reminders.push('Run ami-detect-pr-conflicts before creating a pull request.');
  } catch { /* Keep hook failures non-blocking. */ }

  const output = reminders.length
    ? { hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: reminders.join(' ') } }
    : {};
  process.stdout.write(JSON.stringify(output));
});
