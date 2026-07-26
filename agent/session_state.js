const fs = require('fs');
const path = require('path');

/**
 * Structured Session State Store ($S$) for Amiga IA Agents
 * Manages persistent state in `.amiga-ia/session-state.json`
 */
class SessionStateStore {
  constructor(workspaceDir = process.cwd()) {
    this.workspaceDir = workspaceDir;
    this.stateDir = path.join(workspaceDir, '.amiga-ia');
    this.stateFilePath = path.join(this.stateDir, 'session-state.json');
    this.ensureStateFile();
  }

  ensureStateFile() {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true });
    }
    if (!fs.existsSync(this.stateFilePath)) {
      const initialState = {
        lastUpdated: new Date().toISOString(),
        pendingTasks: [],
        completedTasks: [],
        sessionNotes: [],
        metadata: {}
      };
      fs.writeFileSync(this.stateFilePath, JSON.stringify(initialState, null, 2) + '\n');
    }
  }

  /**
   * Checks if a target path (e.g. '.amiga-ia/' or 'docs/coding-sessions/') is listed in .gitignore.
   */
  isPathGitIgnored(targetPath) {
    const gitignorePath = path.join(this.workspaceDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) return false;
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const normalizedTarget = targetPath.replace(/\/$/, '');
    return content.split('\n').some(line => {
      const trimmed = line.trim().replace(/\/$/, '');
      return trimmed === normalizedTarget;
    });
  }

  /**
   * Convenience method to check if .amiga-ia/ is listed in .gitignore.
   */
  isGitIgnored() {
    return this.isPathGitIgnored('.amiga-ia/');
  }

  /**
   * Appends a target path to .gitignore if not present.
   */
  addToGitIgnore(targetPath = '.amiga-ia/', comment = 'Amiga IA local session state') {
    const gitignorePath = path.join(this.workspaceDir, '.gitignore');
    if (this.isPathGitIgnored(targetPath)) return true;

    let content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
    if (content && !content.endsWith('\n')) content += '\n';
    
    const formattedEntry = targetPath.endsWith('/') ? targetPath : `${targetPath}/`;
    content += `# ${comment}\n${formattedEntry}\n`;

    fs.writeFileSync(gitignorePath, content);
    return true;
  }

  loadState() {
    try {
      return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf8'));
    } catch (e) {
      return { lastUpdated: new Date().toISOString(), pendingTasks: [], completedTasks: [], sessionNotes: [], metadata: {} };
    }
  }

  saveState(state) {
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2) + '\n');
  }

  addPendingTask(taskDescription) {
    const state = this.loadState();
    state.pendingTasks.push({ id: Date.now().toString(), description: taskDescription, createdAt: new Date().toISOString() });
    this.saveState(state);
  }

  completeTask(taskId) {
    const state = this.loadState();
    const index = state.pendingTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const [task] = state.pendingTasks.splice(index, 1);
      task.completedAt = new Date().toISOString();
      state.completedTasks.push(task);
      this.saveState(state);
    }
  }
}

module.exports = SessionStateStore;
