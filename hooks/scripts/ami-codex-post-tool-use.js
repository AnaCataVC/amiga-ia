const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  let output = {};
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const toolInput = input.tool_input || input.toolCall?.args || input.args || {};
    const changedContent = JSON.stringify(toolInput);
    if (/console\.log|debugger|TODO|FIXME/.test(changedContent)) {
      output = {
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: 'Review the recent patch for debug statements or unresolved TODO/FIXME markers.'
        }
      };
    }
  } catch { /* Keep hook failures non-blocking. */ }
  process.stdout.write(JSON.stringify(output));
});
