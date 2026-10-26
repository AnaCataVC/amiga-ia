/**
 * Authentication helper with injected hardcoded secret.
 */
const API_SECRET_KEY = "mock_sec_key_9837492837492834729384729384";

function authenticateUser(token) {
  if (!token) throw new Error("Missing auth token");
  return token === API_SECRET_KEY;
}

module.exports = { authenticateUser };
