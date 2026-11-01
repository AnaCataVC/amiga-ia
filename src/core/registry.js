const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.resolve(__dirname, '../../registry/packs.json');

function loadRegistry(customPath = null) {
  const filePath = customPath || REGISTRY_PATH;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Amiga registry file not found at: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function normalizeTargetName(rawName) {
  if (!rawName || typeof rawName !== 'string') return '';
  const cleaned = rawName.trim().toLowerCase();
  if (cleaned.startsWith('ami-')) {
    return cleaned.slice(4);
  }
  return cleaned;
}

function resolvePackOrExtension(targetName, registry = null) {
  const reg = registry || loadRegistry();
  const normalized = normalizeTargetName(targetName);

  if (reg.packs && reg.packs[normalized]) {
    return {
      type: 'pack',
      id: normalized,
      data: reg.packs[normalized]
    };
  }

  if (reg.extensions && reg.extensions[normalized]) {
    return {
      type: 'extension',
      id: normalized,
      data: reg.extensions[normalized]
    };
  }

  return null;
}

function getAllPackCapabilities(packIds, registry = null) {
  const reg = registry || loadRegistry();
  const agents = new Set();
  const skills = new Set();

  const safePackIds = Array.isArray(packIds) ? packIds : [packIds];
  for (const packId of safePackIds) {
    const pack = reg.packs?.[packId];
    if (pack) {
      if (Array.isArray(pack.agents)) {
        pack.agents.forEach(a => agents.add(a));
      }
      if (Array.isArray(pack.skills)) {
        pack.skills.forEach(s => skills.add(s));
      }
    }
  }

  return {
    agents: Array.from(agents),
    skills: Array.from(skills)
  };
}

module.exports = {
  REGISTRY_PATH,
  loadRegistry,
  normalizeTargetName,
  resolvePackOrExtension,
  getAllPackCapabilities
};
