const { runQuery, getQuery, getAllQuery } = require('../config/database');

class Settings {
  static async getValue(key) {
    const row = await getQuery('SELECT value FROM site_settings WHERE key = ?', [key]);
    return row ? row.value : null;
  }

  static async setValue(key, value) {
    const sql = `
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `;
    await runQuery(sql, [key, value]);
  }

  static async getAll() {
    const rows = await getAllQuery('SELECT key, value, updated_at FROM site_settings');
    return rows;
  }
}

module.exports = Settings;
