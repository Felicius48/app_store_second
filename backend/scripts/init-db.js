const { initializeDatabase, runQuery } = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

async function initDatabase() {
  try {
    console.log('🔄 Инициализация базы данных...');

    // Инициализация таблиц
    initializeDatabase();

    console.log('✅ Таблицы созданы');

    // Небольшая задержка для обеспечения создания таблиц
    await new Promise(resolve => setTimeout(resolve, 100));

    // Создание администратора
    try {
      const adminData = {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+7 (999) 123-45-67'
      };

      // Проверяем, существует ли уже админ
      const existingAdmin = await User.findByEmail(adminData.email);
      if (!existingAdmin) {
        const admin = await User.create(adminData);
        console.log('✅ Администратор создан:', adminData.email);
      } else {
        console.log('ℹ️  Администратор уже существует');
      }
    } catch (error) {
      console.log('⚠️  Ошибка создания администратора:', error.message);
    }

    // Создание тестовых категорий
    const categories = [
      { name: 'Смартфоны', description: 'Мобильные телефоны и смартфоны' },
      { name: 'Ноутбуки', description: 'Портативные компьютеры' },
      { name: 'Аксессуары', description: 'Аксессуары для гаджетов' },
      { name: 'Телевизоры', description: 'Телевизоры и мониторы' }
    ];

    for (const catData of categories) {
      try {
        await Category.create(catData);
        console.log(`✅ Категория создана: ${catData.name}`);
      } catch (error) {
        console.log(`⚠️  Категория "${catData.name}" уже существует`);
      }
    }

    // Создание брендов
    const brands = [
      { name: 'Apple', slug: 'apple', description: 'Технологии Apple' },
      { name: 'Samsung', slug: 'samsung', description: 'Технологии Samsung' }
    ];

    for (const brandData of brands) {
      try {
        // Имитируем создание бренда (простая вставка в базу)
        await runQuery('INSERT OR IGNORE INTO brands (name, slug, description) VALUES (?, ?, ?)',
                       [brandData.name, brandData.slug, brandData.description]);
        console.log(`✅ Бренд создан: ${brandData.name}`);
      } catch (error) {
        console.log(`⚠️  Бренд "${brandData.name}" уже существует`);
      }
    }

    // Создание тестовых товаров
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Флагманский смартфон от Apple с передовыми технологиями',
        shortDescription: 'Мощный смартфон с отличной камерой',
        price: 129990,
        sku: 'IPH15P-128',
        stockQuantity: 50,
        categoryId: 1,
        brandId: 1, // Создадим бренды позже
        images: JSON.stringify(['/uploads/iphone15.jpg']),
        isFeatured: true,
        isActive: true
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Современный Android смартфон с превосходными характеристиками',
        shortDescription: 'Android флагман с отличным экраном',
        price: 89990,
        sku: 'SGS24-256',
        stockQuantity: 30,
        categoryId: 1,
        brandId: 2,
        images: JSON.stringify(['/uploads/samsung-s24.jpg'])
      },
      {
        name: 'MacBook Pro 16"',
        description: 'Профессиональный ноутбук для творческих задач',
        shortDescription: 'Мощный ноутбук для профессионалов',
        price: 299990,
        sku: 'MBP16-M3',
        stockQuantity: 15,
        categoryId: 2,
        brandId: 1,
        images: JSON.stringify(['/uploads/macbook-pro.jpg']),
        isFeatured: true
      },
      {
        name: 'AirPods Pro',
        description: 'Беспроводные наушники с активным шумоподавлением',
        shortDescription: 'Отличное качество звука и комфорт',
        price: 24990,
        sku: 'AP-PRO-2',
        stockQuantity: 100,
        categoryId: 3,
        brandId: 1,
        images: JSON.stringify(['/uploads/airpods-pro.jpg'])
      }
    ];

    for (const prodData of products) {
      try {
        await Product.create(prodData);
        console.log(`✅ Товар создан: ${prodData.name}`);
      } catch (error) {
        console.log(`⚠️  Товар "${prodData.name}" уже существует`);
      }
    }

    console.log('🎉 Инициализация базы данных завершена!');
    console.log('');
    console.log('📋 Данные для входа:');
    console.log('Админ:', process.env.ADMIN_EMAIL || 'admin@example.com');
    console.log('Пароль:', process.env.ADMIN_PASSWORD || 'admin123');

  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    process.exit(1);
  }
}

// Запуск инициализации
initDatabase();
