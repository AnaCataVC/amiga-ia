const crypto = require('crypto');

/**
 * Password service with injected insecure cryptographic algorithm.
 */
function hashUserPassword(password) {
  // Injected defect: MD5 is broken and cryptographically insecure for passwords
  return crypto.createHash('md5').update(password).digest('hex');
}

module.exports = { hashUserPassword };
