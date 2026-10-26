/**
 * Clean, well-formed service to test that the auditor does not generate false positives.
 */
class UserService {
  constructor(database) {
    this.database = database;
  }

  async findUserById(id) {
    if (!id || typeof id !== 'string') {
      throw new TypeError('Invalid user ID');
    }
    return this.database.query('SELECT id, name FROM users WHERE id = ?', [id]);
  }
}

module.exports = { UserService };
