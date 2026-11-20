#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function getSkills() {
  const skillsDir = path.join(rootDir, 'skills');
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && fs.existsSync(path.join(skillsDir, d.name, 'SKILL.md')))
    .map(d => d.name)
    .sort();
}

function getAgents() {
  const agentsDir = path.join(rootDir, 'agents');
  return fs
    .readdirSync(agentsDir, { withFileTypes: true })
    .filter(f => f.isFile() && f.name.endsWith('.md'))
    .map(f => f.name.replace(/\.md$/, ''))
    .sort();
}

function checkCatalogFile(relPath, skills, agents, errors) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing catalog file: ${relPath}`);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');

  for (const skill of skills) {
    if (!content.includes(`\`${skill}\``)) {
      errors.push(`${relPath} is missing skill entry: ${skill}`);
    }
  }
  for (const agent of agents) {
    if (!content.includes(`\`${agent}\``)) {
      errors.push(`${relPath} is missing agent entry: ${agent}`);
    }
  }

  const total = skills.length + agents.length;
  const countRegex = new RegExp(`\\*\\*${total}[^*]*\\b${agents.length}\\b[^*]*\\b${skills.length}\\b[^*]*\\*\\*`);
  if (!countRegex.test(content)) {
    errors.push(`${relPath} header counts do not match ${total} total (${agents.length} agents, ${skills.length} skills)`);
  }
}

function checkPacksRegistry(skills, agents, errors) {
  const relPath = 'registry/packs.json';
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing registry file: ${relPath}`);
    return;
  }

  const registry = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const packSkills = new Set();
  const packAgents = new Set();

  for (const pack of Object.values(registry.packs || {})) {
    for (const s of pack.skills || []) packSkills.add(s);
    for (const a of pack.agents || []) packAgents.add(a);
  }

  for (const skill of skills) {
    if (!packSkills.has(skill)) errors.push(`${relPath} is missing skill: ${skill}`);
  }
  for (const agent of agents) {
    if (!packAgents.has(agent)) errors.push(`${relPath} is missing agent: ${agent}`);
  }
  for (const s of packSkills) {
    if (!skills.includes(s)) errors.push(`${relPath} references unknown skill: ${s}`);
  }
  for (const a of packAgents) {
    if (!agents.includes(a)) errors.push(`${relPath} references unknown agent: ${a}`);
  }
}

function checkReadmeCounts(relPath, skills, agents, errors) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');

  const skillDirMatches = content.match(/\((\d+)\s+(?:directories|directorios)\)/g) || [];
  for (const m of skillDirMatches) {
    const n = Number(m.match(/\d+/)[0]);
    if (n !== skills.length) {
      errors.push(`${relPath} reports ${n} skill directories, expected ${skills.length}`);
    }
  }

  const agentProfileMatches = content.match(/\((\d+)\s+(?:profiles|perfiles)\)/g) || [];
  for (const m of agentProfileMatches) {
    const n = Number(m.match(/\d+/)[0]);
    if (n !== agents.length) {
      errors.push(`${relPath} reports ${n} agent profiles, expected ${agents.length}`);
    }
  }
}

function main() {
  const skills = getSkills();
  const agents = getAgents();
  const errors = [];

  checkCatalogFile('docs/catalog.md', skills, agents, errors);
  checkCatalogFile('docs/catalog.es.md', skills, agents, errors);
  checkPacksRegistry(skills, agents, errors);
  checkReadmeCounts('README.md', skills, agents, errors);
  checkReadmeCounts('README.es.md', skills, agents, errors);

  if (errors.length > 0) {
    console.error('Catalog sync check failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`Catalog sync check passed: ${skills.length} skills, ${agents.length} agents.`);
}

main();
