const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Создание подключения к базе данных
const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('✅ Подключено к SQLite базе данных');
  }
});

// Включение foreign keys
db.run('PRAGMA foreign_keys = ON');

// Функция для инициализации базы данных
function initializeDatabase() {
  // Создание таблиц
  const tables = [
    // Пользователи
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Категории
    `CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      icon_url TEXT,
      parent_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    )`,

    // Бренды
    `CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      description TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Товары
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      price DECIMAL(10,2) NOT NULL,
      sale_price DECIMAL(10,2),
      sku TEXT UNIQUE,
      stock_quantity INTEGER DEFAULT 0,
      stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'on_backorder')),
      category_id INTEGER,
      brand_id INTEGER,
      weight DECIMAL(5,2),
      dimensions TEXT, -- JSON: {"length": 10, "width": 5, "height": 2}
      images TEXT, -- JSON array of image URLs
      is_featured BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      seo_title TEXT,
      seo_description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
    )`,

    // Отзывы
    `CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT,
      is_verified BOOLEAN DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Заказы
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
      total_amount DECIMAL(10,2) NOT NULL,
      shipping_amount DECIMAL(10,2) DEFAULT 0,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      currency TEXT DEFAULT 'RUB',
      shipping_address TEXT NOT NULL, -- JSON
      billing_address TEXT, -- JSON
      payment_method TEXT DEFAULT 'card',
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
      shipping_method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Элементы заказа
    `CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`,

    // Корзина
    `CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id),
      UNIQUE(session_id, product_id)
    )`,

    // Промокоды
    `CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value DECIMAL(10,2) NOT NULL,
      min_order_amount DECIMAL(10,2),
      max_discount DECIMAL(10,2),
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      expiry_date DATETIME,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Связь товаров и категорий (многие-ко-многим)
    `CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE(product_id, category_id)
    )`
  ];

  // Выполнение создания таблиц
  tables.forEach(tableSQL => {
    db.run(tableSQL, (err) => {
      if (err) {
        console.error('Ошибка создания таблицы:', err.message);
      }
    });
  });

  // Миграции для существующих таблиц
  const migrations = [
    // Добавление avatar_url в таблицу users, если её нет
    `ALTER TABLE users ADD COLUMN avatar_url TEXT`,
    // Адрес доставки пользователя
    `ALTER TABLE users ADD COLUMN address TEXT`,
    `ALTER TABLE users ADD COLUMN city TEXT`,
    `ALTER TABLE users ADD COLUMN postal_code TEXT`,
    // Добавление specifications в products (если старые БД без колонки)
    `ALTER TABLE products ADD COLUMN specifications TEXT`,
    // Иконка категории
    `ALTER TABLE categories ADD COLUMN icon_url TEXT`,
    // YooKassa: связь заказа с платежом
    `ALTER TABLE orders ADD COLUMN payment_id TEXT`,
    `ALTER TABLE orders ADD COLUMN payment_confirmation_url TEXT`,
    `ALTER TABLE orders ADD COLUMN payment_paid_at DATETIME`
  ];

  // Миграция данных: перенос существующих category_id в product_categories
  db.run(`
    INSERT OR IGNORE INTO product_categories (product_id, category_id)
    SELECT id, category_id FROM products WHERE category_id IS NOT NULL
  `, (err) => {
    if (err && !err.message.includes('no such table')) {
      console.log('Миграция категорий выполнена или таблица уже существует');
    }
  });

  migrations.forEach(migrationSQL => {
    db.run(migrationSQL, (err) => {
      // Игнорируем ошибку "duplicate column name" - колонка уже существует
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Миграция выполнена или уже существует');
      }
    });
  });

  // Создание индексов для производительности
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)',
    'CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id)',
    'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id)',
    'CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id)'
  ];

  indexes.forEach(indexSQL => {
    db.run(indexSQL, (err) => {
      if (err) {
        console.error('Ошибка создания индекса:', err.message);
      }
    });
  });

  console.log('✅ База данных инициализирована');
}

// Функция для выполнения SQL запросов с промисами
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function getAllQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  initializeDatabase,
  runQuery,
  getQuery,
  getAllQuery
};
