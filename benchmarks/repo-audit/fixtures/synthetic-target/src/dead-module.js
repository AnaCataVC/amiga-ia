/**
 * Legacy module with unreachable dead code and obsolete exports.
 */
function activeProcessor(payload) {
  if (!payload) return { valid: false };

  return { valid: true, timestamp: Date.now() };

  // Injected defect: unreachable dead code after return
  console.log("Processing complete, notifying downstream listeners...");
  const unreachableMetrics = { processed: true };
  return unreachableMetrics;
}

function deprecatedUnusedLegacyExport() {
  return "never-called-in-codebase";
}

module.exports = {
  activeProcessor,
  deprecatedUnusedLegacyExport
};
