const fs = require('fs');
const path = require('path');

const sessionsDir = path.join(process.cwd(), 'docs', 'coding-sessions');
if (fs.existsSync(sessionsDir)) {
  const files = fs.readdirSync(sessionsDir)
    .filter(f => f.endsWith('_session-summary.md'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(sessionsDir, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length > 0) {
    const latest = path.join(sessionsDir, files[0].name);
    console.log(`Context from previous session (${files[0].name}):`);
    const lines = fs.readFileSync(latest, 'utf8').split(/\r?\n/);
    let flag = false;
    for (const line of lines) {
      if (/^## Pending Tasks/.test(line)) { flag = true; console.log(line); }
      else if (/^##/.test(line)) { flag = false; }
      else if (flag) { console.log(line); }
    }
  }
}
process.exit(0);
