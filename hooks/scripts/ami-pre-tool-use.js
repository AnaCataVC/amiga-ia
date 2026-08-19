const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const toolArgs = input.toolCall?.args || input.tool_input || input;
    const command = toolArgs.command || toolArgs.CommandLine || toolArgs.command_line || '';

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
  finally {
    console.log(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }
});
