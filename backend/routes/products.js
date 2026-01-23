const express = require('express');
const { body, validationResult, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Конфигурация multer для загрузки изображений товаров
const productImagesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const productImagesUpload = multer({
  storage: productImagesStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены (jpeg, jpg, png, gif, webp)'));
    }
  }
});

const router = express.Router();

// Валидация создания товара
const createProductValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название должно содержать от 2 до 255 символов'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество на складе должно быть неотрицательным целым числом'),
  body('categoryId')
    .optional()
    .isInt()
    .withMessage('ID категории должен быть числом'),
  body('categoryIds')
    .optional()
    .isArray()
    .withMessage('categoryIds должен быть массивом'),
  body('categoryIds.*')
    .optional()
    .isInt()
    .withMessage('Каждый ID категории должен быть числом')
];

// Получение всех товаров с фильтрами
router.get('/', optionalAuth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Неверный номер страницы'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Лимит должен быть от 1 до 100'),
  query('category').optional().isInt().withMessage('Неверный ID категории'),
  query('brand').optional().isInt().withMessage('Неверный ID бренда'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Минимальная цена должна быть положительной'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Максимальная цена должна быть положительной'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Поисковый запрос не может быть пустым'),
  query('featured').optional().isBoolean().withMessage('Параметр featured должен быть true или false'),
  query('inStock').optional().isBoolean().withMessage('Параметр inStock должен быть true или false'),
  query('sortBy').optional().isIn(['name', 'price', 'created_at', 'average_rating']).withMessage('Неверный параметр сортировки'),
  query('sortOrder').optional().isIn(['asc', 'desc', 'ASC', 'DESC']).withMessage('Порядок сортировки должен быть asc или desc')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации параметров',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      category: categoryId,
      brand: brandId,
      minPrice,
      maxPrice,
      search,
      featured,
      inStock,
      sortBy,
      sortOrder
    } = req.query;

    const offset = (page - 1) * limit;

    const options = {
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      search,
      featured: featured === 'true',
      inStock: inStock === 'true',
      limit: parseInt(limit),
      offset,
      sortBy,
      sortOrder
    };

    // Получение товаров
    const products = await Product.findAll(options);
    const totalCount = await Product.count(options);
    const totalPages = Math.ceil(totalCount / limit);

    // Преобразуем товары в публичные данные с категориями
    const productsData = await Promise.all(
      products.map(async (product) => {
        // Загружаем категории для каждого товара
        const categories = await Product.getCategories(product.id);
        product.categories = categories;
        return product.toPublicData();
      })
    );

    res.json({
      success: true,
      data: {
        products: productsData,
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
      message: 'Ошибка сервера при получении товаров'
    });
  }
});

// Получение товара по ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID товара'
      });
    }

    const product = await Product.findById(parseInt(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    res.json({
      success: true,
      data: {
        product: product.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Получение товара по slug
router.get('/slug/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug товара обязателен'
      });
    }

    const product = await Product.findBySlug(slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    res.json({
      success: true,
      data: {
        product: product.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка получения товара по slug:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Загрузка изображений товара
router.post('/upload-images', authenticate, productImagesUpload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Не загружены изображения'
      });
    }

    const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);

    res.json({
      success: true,
      message: 'Изображения успешно загружены',
      data: {
        images: imageUrls
      }
    });
  } catch (error) {
    console.error('Ошибка загрузки изображений:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка загрузки изображений'
    });
  }
});

// Создание товара (только админ)
router.post('/', authenticate, createProductValidation, async (req, res) => {
  try {
    // Проверка прав администратора
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Требуются права администратора'
      });
    }

    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    const productData = req.body;

    // Создание товара
    const result = await Product.create(productData);

    // Получение созданного товара
    const product = await Product.findById(result.id);

    res.status(201).json({
      success: true,
      message: 'Товар успешно создан',
      data: {
        product: product.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка создания товара:', error);

    if (error.message.includes('уже существует')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании товара'
    });
  }
});

// Обновление товара (только админ)
router.put('/:id', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название должно содержать от 2 до 255 символов'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('stockQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество на складе должно быть неотрицательным целым числом')
], async (req, res) => {
  try {
    // Проверка прав администратора
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Требуются права администратора'
      });
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID товара'
      });
    }

    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: errors.array()
      });
    }

    // Проверка существования товара
    const existingProduct = await Product.findById(parseInt(id));
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    const updateData = req.body;

    // Обновление товара
    await Product.update(parseInt(id), updateData);

    // Получение обновленного товара
    const updatedProduct = await Product.findById(parseInt(id));

    res.json({
      success: true,
      message: 'Товар успешно обновлен',
      data: {
        product: updatedProduct.toPublicData()
      }
    });
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

// Удаление товара (только админ)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Проверка прав администратора
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Требуются права администратора'
      });
    }

    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Неверный ID товара'
      });
    }

    // Проверка существования товара
    const existingProduct = await Product.findById(parseInt(id));
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    // Удаление товара
    await Product.delete(parseInt(id));

    res.json({
      success: true,
      message: 'Товар успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

module.exports = router;
