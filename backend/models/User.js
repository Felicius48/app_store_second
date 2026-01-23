const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { runQuery, getQuery, getAllQuery } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.first_name || data.firstName;
    this.lastName = data.last_name || data.lastName;
    this.phone = data.phone;
    this.address = data.address;
    this.city = data.city;
    this.postalCode = data.postal_code || data.postalCode;
    this.role = data.role || 'user';
    this.avatarUrl = data.avatar_url;
    this.isActive = data.is_active !== undefined ? data.is_active : true;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Создание нового пользователя
  static async create(userData) {
    const { email, password, firstName, lastName, phone, avatarUrl, address, city, postalCode } = userData;

    // Хэширование пароля
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sql = `
      INSERT INTO users (email, password, first_name, last_name, phone, address, city, postal_code, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const result = await runQuery(
        sql,
        [email, hashedPassword, firstName, lastName, phone, address, city, postalCode, avatarUrl]
      );
      return { id: result.id, message: 'Пользователь успешно создан' };
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Пользователь с таким email уже существует');
      }
      throw error;
    }
  }

  // Поиск пользователя по email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ? AND is_active = 1';
    const user = await getQuery(sql, [email]);
    return user ? new User(user) : null;
  }

  // Поиск пользователя по ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
    const user = await getQuery(sql, [id]);
    return user ? new User(user) : null;
  }

  // Получение всех пользователей (для админа)
  static async findAll(options = {}) {
    const { limit = 20, offset = 0, role } = options;

    let sql = 'SELECT id, email, first_name, last_name, phone, role, is_active, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = await getAllQuery(sql, params);
    return users.map(user => new User(user));
  }

  // Проверка пароля
  async checkPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Генерация JWT токена
  generateToken() {
    const payload = {
      id: this.id,
      email: this.email,
      role: this.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '7d'
    });
  }

  // Обновление профиля
  static async updateProfile(id, updateData) {
    const { firstName, lastName, phone, avatarUrl, address, city, postalCode } = updateData;

    const sql = `
      UPDATE users
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          postal_code = COALESCE(?, postal_code),
          avatar_url = COALESCE(?, avatar_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await runQuery(
      sql,
      [firstName, lastName, phone, address, city, postalCode, avatarUrl, id]
    );
    return { message: 'Профиль успешно обновлен' };
  }

  // Изменение пароля
  static async changePassword(id, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const sql = 'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await runQuery(sql, [hashedPassword, id]);
    return { message: 'Пароль успешно изменен' };
  }

  // Деактивация пользователя
  static async deactivate(id) {
    const sql = 'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await runQuery(sql, [id]);
    return { message: 'Пользователь деактивирован' };
  }

  // Получение публичных данных пользователя
  toPublicData() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      address: this.address,
      city: this.city,
      postalCode: this.postalCode,
      role: this.role,
      avatarUrl: this.avatarUrl,
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

module.exports = User;
