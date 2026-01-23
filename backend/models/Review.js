const { runQuery, getQuery, getAllQuery } = require('../config/database');

class Review {
  constructor(data) {
    this.id = data.id;
    this.productId = data.product_id;
    this.userId = data.user_id;
    this.rating = data.rating;
    this.title = data.title;
    this.comment = data.comment;
    this.isVerified = Boolean(data.is_verified);
    this.isActive = Boolean(data.is_active);
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    // Данные пользователя (для отображения)
    this.userName = data.user_name || `${data.first_name} ${data.last_name}`;
  }

  // Создание отзыва
  static async create(reviewData) {
    const { productId, userId, rating, title, comment } = reviewData;

    const sql = `
      INSERT INTO reviews (product_id, user_id, rating, title, comment)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await runQuery(sql, [productId, userId, rating, title, comment]);
      return { id: result.id, message: 'Отзыв успешно создан' };
    } catch (error) {
      throw error;
    }
  }

  // Поиск по ID
  static async findById(id) {
    const sql = `
      SELECT r.*,
             u.first_name, u.last_name,
             (u.first_name || ' ' || u.last_name) as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ? AND r.is_active = 1
    `;
    const review = await getQuery(sql, [id]);
    return review ? new Review(review) : null;
  }

  // Получение отзывов для товара
  static async findByProductId(productId, options = {}) {
    const { limit = 10, offset = 0, verifiedOnly = false } = options;

    let sql = `
      SELECT r.*,
             u.first_name, u.last_name,
             (u.first_name || ' ' || u.last_name) as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.is_active = 1
    `;

    const params = [productId];

    if (verifiedOnly) {
      sql += ' AND r.is_verified = 1';
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const reviews = await getAllQuery(sql, params);
    return reviews.map(review => new Review(review));
  }

  // Получение отзывов пользователя
  static async findByUserId(userId, options = {}) {
    const { limit = 10, offset = 0 } = options;

    const sql = `
      SELECT r.*,
             p.name as product_name,
             u.first_name, u.last_name,
             (u.first_name || ' ' || u.last_name) as user_name
      FROM reviews r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ? AND r.is_active = 1
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const reviews = await getAllQuery(sql, [userId, limit, offset]);
    return reviews.map(review => new Review(review));
  }

  // Подсчет отзывов для товара
  static async countByProductId(productId, verifiedOnly = false) {
    let sql = 'SELECT COUNT(*) as count FROM reviews WHERE product_id = ? AND is_active = 1';
    const params = [productId];

    if (verifiedOnly) {
      sql += ' AND is_verified = 1';
    }

    const result = await getQuery(sql, params);
    return result.count;
  }

  // Получение средней оценки товара
  static async getAverageRating(productId) {
    const sql = `
      SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
      FROM reviews
      WHERE product_id = ? AND is_active = 1 AND is_verified = 1
    `;

    const result = await getQuery(sql, [productId]);
    return {
      averageRating: result.average_rating ? parseFloat(result.average_rating) : 0,
      totalReviews: result.total_reviews || 0
    };
  }

  // Обновление отзыва
  static async update(id, updateData) {
    const { rating, title, comment, isVerified } = updateData;

    const sql = `
      UPDATE reviews SET
        rating = COALESCE(?, rating),
        title = COALESCE(?, title),
        comment = COALESCE(?, comment),
        is_verified = COALESCE(?, is_verified),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await runQuery(sql, [rating, title, comment, isVerified ? 1 : 0, id]);
    return { message: 'Отзыв успешно обновлен' };
  }

  // Удаление отзыва
  static async delete(id) {
    const sql = 'UPDATE reviews SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await runQuery(sql, [id]);
    return { message: 'Отзыв удален' };
  }

  // Проверка, оставлял ли пользователь отзыв на товар
  static async hasUserReviewedProduct(userId, productId) {
    const sql = 'SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND is_active = 1';
    const review = await getQuery(sql, [userId, productId]);
    return !!review;
  }

  // Получение публичных данных
  toPublicData() {
    return {
      id: this.id,
      productId: this.productId,
      userId: this.userId,
      userName: this.userName,
      rating: this.rating,
      title: this.title,
      comment: this.comment,
      isVerified: this.isVerified,
      createdAt: this.createdAt
    };
  }

  // Получение данных для админа
  toAdminData() {
    return {
      ...this.toPublicData(),
      isActive: this.isActive,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Review;
