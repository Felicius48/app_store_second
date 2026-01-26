const { runQuery, getAllQuery } = require('../config/database');
const Product = require('./Product');

class Favorite {
  static async listProductsByUser(userId) {
    const sql = `
      SELECT p.*
      FROM favorites f
      JOIN products p ON p.id = f.product_id
      WHERE f.user_id = ? AND p.is_active = 1
      ORDER BY f.created_at DESC
    `;
    const rows = await getAllQuery(sql, [userId]);
    return rows.map((row) => new Product(row));
  }

  static async add(userId, productId) {
    await runQuery(
      'INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)',
      [userId, productId]
    );
  }

  static async remove(userId, productId) {
    await runQuery(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
  }
}

module.exports = Favorite;
