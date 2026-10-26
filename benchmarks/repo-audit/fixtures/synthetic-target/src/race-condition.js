/**
 * Concurrency module with injected floating promise race condition.
 */
async function recordAuditLog(action, metadata) {
  // Simulates asynchronous remote flush
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!metadata) reject(new Error("Audit metadata is required"));
      else resolve({ recorded: true, action });
    }, 10);
  });
}

async function handleUserCheckout(userId, cart) {
  // Injected defect: floating promise without await or catch handler
  recordAuditLog("CHECKOUT_INITIATED", null);

  return { status: "processing", userId, itemsCount: cart.length };
}

module.exports = { handleUserCheckout, recordAuditLog };
