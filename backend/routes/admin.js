const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации и админских прав
router.use(authenticate);
router.use(requireAdmin);

// Статистика для дашборда
router.get('/stats', async (req, res) => {
  try {
    // Получение количества пользователей
    const totalUsers = await User.findAll().then(users => users.length);

    // Получение количества товаров
    const totalProducts = await Product.count();

    // Получение количества заказов
    const totalOrders = await Order.count();

    // Получение количества отзывов
    const totalReviews = await Review.findAll().then(reviews => reviews.length);

    // Получение количества категорий
    const totalCategories = await Category.findAll().then(categories => categories.length);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders: 0, // Пока заглушка
          totalReviews,
          totalCategories
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Управление пользователями
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const offset = (page - 1) * limit;

    const users = await User.findAll({
      limit: parseInt(limit),
      offset,
      role
    });

    // Подсчет общего количества
    const totalCount = users.length + offset; // Упрощенная версия

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toAdminData()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          hasNext: users.length === parseInt(limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Деактивация пользователя
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID пользователя'
      });
    }

    // Проверка, что не пытаемся деактивировать самого себя
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя деактивировать собственный аккаунт'
      });
    }

    await User.deactivate(parseInt(id));

    res.json({
      success: true,
      message: 'Пользователь деактивирован'
    });
  } catch (error) {
    console.error('Ошибка деактивации пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Управление товарами
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, categoryId } = req.query;
    const offset = (page - 1) * limit;

    const options = {
      limit: parseInt(limit),
      offset
    };

    // Добавляем фильтр по категории, если указан
    if (categoryId) {
      if (categoryId === 'null') {
        // Для случая когда categoryId не указан (null) - показываем все товары
        // Ничего не делаем, оставляем без фильтра
      } else {
        // Получаем категорию и все ее подкатегории
        const Category = require('../models/Category');
        const category = await Category.findById(parseInt(categoryId));
        if (category) {
          // Рекурсивно получаем все ID подкатегорий
          const getAllSubcategoryIds = async (catId) => {
            const children = await Category.findAll({ parentId: catId });
            const ids = [catId];
            for (const child of children) {
              ids.push(...await getAllSubcategoryIds(child.id));
            }
            return ids;
          };

          const categoryIds = await getAllSubcategoryIds(parseInt(categoryId));
          options.categoryIds = categoryIds;
        }
      }
    }

    const products = await Product.findAll(options);

    // Подсчет общего количества с учетом фильтра
    const countOptions = {};
    if (options.categoryIds) {
      countOptions.categoryIds = options.categoryIds;
    }
    const totalCount = await Product.count(countOptions);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        products: products.map(product => product.toPublicData()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получение дерева категорий
router.get('/categories/tree', async (req, res) => {
  try {
    const categoryTree = await Category.getTree();

    res.json({
      success: true,
      data: {
        categories: categoryTree
      }
    });
  } catch (error) {
    console.error('Ошибка получения дерева категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Управление категориями (плоский список)
router.get('/categories', async (req, res) => {
  try {
    const { parentId } = req.query;
    const options = {};

    if (parentId !== undefined) {
      options.parentId = parentId === 'null' ? null : parseInt(parentId);
    }

    const categories = await Category.findAll(options);

    res.json({
      success: true,
      data: {
        categories: categories.map(category => category.toPublicData())
      }
    });
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Создание категории
router.post('/categories', async (req, res) => {
  try {
    const { name, description, imageUrl, parentId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Название категории обязательно'
      });
    }

    const result = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      imageUrl,
      parentId: parentId ? parseInt(parentId) : null
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        categoryId: result.id
      }
    });
  } catch (error) {
    console.error('Ошибка создания категории:', error);

    if (error.message.includes('уже существует')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Обновление категории
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, parentId } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID категории'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (parentId !== undefined) updateData.parentId = parentId ? parseInt(parentId) : null;

    await Category.update(parseInt(id), updateData);

    res.json({
      success: true,
      message: 'Категория успешно обновлена'
    });
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Удаление категории
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID категории'
      });
    }

    await Category.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Категория успешно удалена'
    });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);

    if (error.message.includes('подкатегории')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Управление отзывами
router.get('/reviews', async (req, res) => {
  try {
    const { page = 1, limit = 20, verified } = req.query;
    const offset = (page - 1) * limit;

    // Упрощенная версия - получаем все отзывы
    const reviews = await Review.findAll().slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        reviews: reviews.map(review => review.toAdminData()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount: reviews.length,
          hasNext: reviews.length === parseInt(limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Ошибка получения отзывов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Модель Review не имеет метода findAll, создам его
Review.findAll = async function() {
  const sql = `
    SELECT r.*,
           u.first_name, u.last_name,
           (u.first_name || ' ' || u.last_name) as user_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.is_active = 1
    ORDER BY r.created_at DESC
  `;

  const reviews = await require('../config/database').getAllQuery(sql);
  return reviews.map(review => new Review(review));
};

module.exports = router;
