/**
 * Simulation of Double-Blind Cleanroom TDD Triad.
 * - ami-cleanroom-builder: Implements code strictly from contract.
 * - ami-cleanroom-tester: Implements black-box tests strictly from contract without viewing implementation.
 * - ami-cleanroom-arbiter: Adjudicates failures, categorizes root cause, and coordinates convergence.
 */

class CleanroomEvaluatorDraft1 {
  satisfies(version, range) {
    if (typeof version !== 'string' || typeof range !== 'string' || !version || !range) {
      throw new TypeError('Invalid inputs');
    }
    if (range.startsWith('^')) {
      const target = range.slice(1).split('.').map(Number);
      const current = version.split('.').map(Number);
      if (current[0] !== target[0]) return false;
      return current[1] >= target[1]; // Draft 1 bug: missing zero-major logic
    }
    return version === range;
  }
}

class CleanroomEvaluatorRefined {
  satisfies(version, range) {
    if (typeof version !== 'string' || typeof range !== 'string' || !version || !range) {
      throw new TypeError('Invalid inputs');
    }

    if (range.startsWith('^')) {
      const [tMaj, tMin, tPat] = range.slice(1).split('.').map(Number);
      const [cMaj, cMin, cPat] = version.split('.').map(Number);

      // Enforcing Clause CL-003:
      if (tMaj === 0) {
        if (tMin === 0) {
          // ^0.0.x: only exact patch matches
          return cMaj === 0 && cMin === 0 && cPat === tPat;
        }
        // ^0.x.y: patch updates allowed, but minor is breaking
        return cMaj === 0 && cMin === tMin && cPat >= tPat;
      }

      // Normal caret rule: ^1.x.y allows any minor or patch up to next major
      if (cMaj !== tMaj) return false;
      if (cMin > tMin) return true;
      if (cMin === tMin) return cPat >= tPat;
      return false;
    }

    return version === range;
  }
}

function runCleanroomBlackBoxTests(evaluatorInstance) {
  const results = [];

  // Contract Clause CL-001
  let threwExpected = false;
  try {
    evaluatorInstance.satisfies(null, '^1.0.0');
  } catch (err) {
    if (err instanceof TypeError) threwExpected = true;
  }
  results.push({ clause: 'CL-001', test: 'Type Safety Validation', passed: threwExpected });

  // Contract Clause CL-002
  results.push({
    clause: 'CL-002',
    test: 'Exact Version Match',
    passed: evaluatorInstance.satisfies('1.2.3', '1.2.3') === true
  });

  // Contract Clause CL-003 Normal Caret
  results.push({
    clause: 'CL-003',
    test: 'Caret Normal Major Range',
    passed: evaluatorInstance.satisfies('1.3.0', '^1.2.0') === true &&
            evaluatorInstance.satisfies('2.0.0', '^1.2.0') === false
  });

  // Contract Clause CL-003 Zero-Major Caret Rule
  results.push({
    clause: 'CL-003',
    test: 'Caret Zero-Major Isolation (^0.2.3 rejects 0.3.0)',
    passed: evaluatorInstance.satisfies('0.2.4', '^0.2.3') === true &&
            evaluatorInstance.satisfies('0.3.0', '^0.2.3') === false
  });

  return results;
}

function runCleanroomWorkflow() {
  const logs = [];

  // Iteration 1: Initial Builder draft tested by independent Cleanroom Tester
  logs.push('Iteration 1: ami-cleanroom-tester executes black-box contract tests against Builder draft');
  const draftInstance = new CleanroomEvaluatorDraft1();
  const testResultsIter1 = runCleanroomBlackBoxTests(draftInstance);
  const failedIter1 = testResultsIter1.filter(t => !t.passed);

  logs.push(`Iteration 1 Results: ${testResultsIter1.filter(t => t.passed).length} passed, ${failedIter1.length} failed`);

  // Arbiter Intervention
  logs.push(`ami-cleanroom-arbiter adjudicates failure: Contract Clause ${failedIter1[0].clause} broken by Builder`);
  logs.push('Adjudication: Implementation Defect. Re-dispatching ami-cleanroom-builder with Clause CL-003.');

  // Iteration 2: Builder rectifies implementation according to contract
  logs.push('Iteration 2: Builder submits refined implementation complying with zero-major clause');
  const refinedInstance = new CleanroomEvaluatorRefined();
  const testResultsIter2 = runCleanroomBlackBoxTests(refinedInstance);
  const failedIter2 = testResultsIter2.filter(t => !t.passed);

  logs.push(`Iteration 2 Results: ${testResultsIter2.filter(t => t.passed).length} passed, ${failedIter2.length} failed`);
  logs.push('ami-cleanroom-arbiter approves convergence: 100% contract compliance achieved.');

  return {
    mode: 'Double-Blind Cleanroom TDD (Triad)',
    totalTests: testResultsIter2.length,
    passedCount: testResultsIter2.filter(t => t.passed).length,
    failedCount: failedIter2.length,
    confirmationBiasedCount: 0,
    overConstrainedCount: 0,
    defectsDetectedDuringCycle: 1,
    defectsEscapedToProduction: 0,
    convergenceIterations: 2,
    arbitrationLogs: logs
  };
}

module.exports = {
  runCleanroomWorkflow,
  runCleanroomBlackBoxTests,
  CleanroomEvaluatorDraft1,
  CleanroomEvaluatorRefined
};
