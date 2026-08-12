const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const command = input.tool_input?.command || input.tool_input?.CommandLine || input.CommandLine || '';

    if (command.includes('git commit')) {
      console.error('Reminder: Use commit-assistant for proper commit formatting.');
    }
    if (command.includes('git push')) {
      console.error('Reminder: Run push-assistant agent before pushing code.');
    }
    if (command.includes('gh pr create')) {
      console.error('Reminder: Consider running ami-detect-pr-conflicts or ami-pr-publisher before creating PR.');
    }
  } catch { /* Don't block on parse errors */ }
  process.exit(0);
});
