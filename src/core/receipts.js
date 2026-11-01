const fs = require('fs');
const path = require('path');

function getReceiptPath(targetDir) {
  return path.join(targetDir, '.amiga-version.json');
}

function loadReceipt(targetDir) {
  const receiptFile = getReceiptPath(targetDir);
  if (!fs.existsSync(receiptFile)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(receiptFile, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveReceipt(targetDir, data) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const receiptFile = getReceiptPath(targetDir);
  const existing = loadReceipt(targetDir) || {};

  const updated = {
    name: data.name || existing.name || '@anacatavc/amiga-ia',
    version: data.version || existing.version || 'unknown',
    installedAt: data.installedAt || existing.installedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    installedPacks: Array.isArray(data.installedPacks)
      ? Array.from(new Set(data.installedPacks))
      : (existing.installedPacks || ['essential']),
    installedExtensions: data.installedExtensions !== undefined
      ? data.installedExtensions
      : (existing.installedExtensions || {}),
    files: Array.isArray(data.files)
      ? Array.from(new Set(data.files))
      : (existing.files || [])
  };

  fs.writeFileSync(receiptFile, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

function updatePackReceipt(targetDir, packId, action = 'add', files = []) {
  const receipt = loadReceipt(targetDir) || {
    name: '@anacatavc/amiga-ia',
    installedPacks: ['essential'],
    installedExtensions: {},
    files: []
  };

  const currentPacks = new Set(receipt.installedPacks || ['essential']);
  let currentFiles = new Set(receipt.files || []);

  if (action === 'add') {
    currentPacks.add(packId);
    files.forEach(f => currentFiles.add(f));
  } else if (action === 'remove') {
    currentPacks.delete(packId);
    if (files.length > 0) {
      const toRemove = new Set(files);
      currentFiles = new Set(Array.from(currentFiles).filter(f => !toRemove.has(f)));
    }
  }

  receipt.installedPacks = Array.from(currentPacks);
  receipt.files = Array.from(currentFiles);
  return saveReceipt(targetDir, receipt);
}

module.exports = {
  getReceiptPath,
  loadReceipt,
  saveReceipt,
  updatePackReceipt
};
