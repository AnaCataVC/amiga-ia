/**
 * Simulation of Single-Agent TDD Generation.
 * In single-agent mode, the same context authors both the code and the tests.
 * 
 * Result: The agent introduces a flawed boundary implementation for zero-major semver
 * and encodes that exact flaw into its own test assertions, demonstrating confirmation bias.
 * It also couples tests to internal private methods.
 */
class FlawedSemVerEvaluator {
  constructor() {
    this._internalRegex = /^\^?(\d+)\.(\d+)\.(\d+)$/;
  }

  _parseInternalRegex(range) {
    return this._internalRegex.exec(range);
  }

  satisfies(version, range) {
    if (!version || !range) throw new TypeError('Invalid inputs');

    // Flawed implementation: Treats ^0.2.3 like ^1.2.3, allowing minor bumps
    if (range.startsWith('^')) {
      const target = range.slice(1).split('.').map(Number);
      const current = version.split('.').map(Number);
      
      // Injected Flaw: Does not account for zero-major rule! Allows 0.3.0 for ^0.2.3
      if (current[0] !== target[0]) return false;
      return current[1] >= target[1];
    }

    return version === range;
  }
}

function runSingleAgentSuite() {
  const evaluator = new FlawedSemVerEvaluator();
  const testResults = [];

  // Test 1: Exact match (Passes)
  testResults.push({
    name: 'should match exact version',
    passed: evaluator.satisfies('1.2.3', '1.2.3') === true,
    overConstrained: false,
    confirmationBiased: false
  });

  // Test 2: Injected Flaw Validated by Biased Test (Passes due to Confirmation Bias!)
  // In a sound suite, satisfies('0.3.0', '^0.2.3') MUST be false.
  // The biased test asserts true to match its own flawed code!
  const biasedAssertion = evaluator.satisfies('0.3.0', '^0.2.3');
  testResults.push({
    name: 'should allow 0.3.0 for ^0.2.3 (BIASED ASSERTION: passes despite breaking SemVer specification)',
    passed: biasedAssertion === true,
    overConstrained: false,
    confirmationBiased: true,
    defectMasked: true
  });

  // Test 3: Over-constrained test coupled to private method (Fragile / anti-pattern)
  const privateCall = evaluator._parseInternalRegex('^1.2.3');
  testResults.push({
    name: 'should expose _parseInternalRegex (OVER-CONSTRAINED: couples test to private internal property)',
    passed: Boolean(privateCall),
    overConstrained: true,
    confirmationBiased: false
  });

  return {
    mode: 'Single-Agent TDD',
    totalTests: testResults.length,
    passedCount: testResults.filter(t => t.passed).length,
    failedCount: testResults.filter(t => !t.passed).length,
    confirmationBiasedCount: testResults.filter(t => t.confirmationBiased).length,
    overConstrainedCount: testResults.filter(t => t.overConstrained).length,
    defectsEscapedToProduction: 1, // The zero-major bug escaped because tests passed
    convergenceIterations: 1 // Single agent believes it finished immediately because biased tests passed
  };
}

module.exports = { runSingleAgentSuite, FlawedSemVerEvaluator };
