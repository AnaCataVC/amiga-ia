/**
 * Boilerplate Agent Entrypoint (Agent Skills Architecture)
 */
const fs = require('fs');
const path = require('path');
const UniversalAdapter = require('../adapters/universal_adapter');

class Agent {
  constructor(env) {
    this.adapter = new UniversalAdapter(env);
    this.skillsDir = path.join(__dirname, '../skills');
    this.agentsDir = path.join(__dirname, '../agents');
  }

  getPrompt() {
    // Generate the XML System Prompt based on available skills and agents
    return this.adapter.getSystemPrompt(this.skillsDir, this.agentsDir);
  }
}

function loadAgents() {
  const agentsDir = path.join(__dirname, '../agents');
  if (!fs.existsSync(agentsDir)) return [];
  
  return fs.readdirSync(agentsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.basename(file, '.md'));
}

function getAgent(name) {
  const agentPath = path.join(__dirname, `../agents/${name}.md`);
  if (fs.existsSync(agentPath)) {
    return fs.readFileSync(agentPath, 'utf8');
  }
  return null;
}

module.exports = {
  Agent,
  loadAgents,
  getAgent
};
